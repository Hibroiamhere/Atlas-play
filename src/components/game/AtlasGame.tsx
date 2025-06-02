'use client';

// Sound File Placeholders:
// Please create a "sounds" directory in your "public" folder (public/sounds/)
// and add the following audio files (e.g., in .wav or .mp3 format):
// - click.wav (for generic button clicks)
// - countdown-tick.wav (for each letter in ATLAS countdown)
// - game-start.wav (when the game begins after countdown)
// - correct-move.wav (when player submits a correct location)
// - error-move.wav (when player submits an incorrect location, wrong letter, or duplicate)
// - opponent-move.wav (when opponent makes a move)
// - hint-popup.wav (when hints are shown)
// - timer-tick.wav (for player turn timer when time is low, e.g. <= 5s)
// - time-up.wav (when player's turn timer runs out)
// - game-over-win.wav (when player wins)
// - game-over-lose.wav (when player loses or game ends otherwise)
// - record-celebration.wav (for new high score/streak/IQ modals)
// - wins-milestone.wav (for 25 wins modal)
// - background-music.mp3 (for looping background music during gameplay)


import type { FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { 
  isValidLocalLocation, 
  getLocalLocationSuggestion, 
  getLocalLocationHints 
} from '@/services/local-atlas-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import GlobeLogo from '@/components/icons/GlobeLogo';
import RecordCelebrationModal from '@/components/game/RecordCelebrationModal';
import TwentyFiveWinsModal from '@/components/game/TwentyFiveWinsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Loader2, Mic, Lightbulb, AlertCircle, Info, User, Bot, Award, Zap, Brain, Trophy, Square, Sparkles, Tv, Share2, Clock, Play, Music, Volume2, Twitter, Facebook, Wifi, WifiOff, UserCircle, ServerCrash, PauseIcon, RotateCcw, LogOut 
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import React, { Component, ErrorInfo, ReactNode } from 'react';

// Add this type to fix build error for SpeechRecognition
// You can replace 'any' with a more specific type if needed

type SpeechRecognition = any;

const COUNTDOWN_SEQUENCE = ['A', 'T', 'L', 'A', 'S'];
const INITIAL_RETRIES = 1;
const MAX_HINTS_PER_GAME = 5;
const WINS_MILESTONE = 25;
const PLAYER_TURN_DURATION = 15; // Duration in seconds
const LOW_TIME_THRESHOLD = 5; // Play tick sound when timeLeft <= this value

type GamePhase = 'nameInput' | 'countdown' | 'playerTurn' | 'opponentTurn' | 'gameOver' | 'loadingNextTurn';
type PlayerType = 'user' | 'opponent';
type CelebrationRecordType = 'score' | 'streak' | 'iq';

interface PlayerStats {
  score: number;
  coins: number;
  iq: number;
}

const getIQLevel = (iq: number): string => {
  if (iq >= 81) return "Globetrotter";
  if (iq >= 61) return "Geo Genius";
  if (iq >= 41) return "Navigator";
  if (iq >= 21) return "Explorer";
  return "Newbie";
};

const LOCAL_STORAGE_BEST_SCORE_PREFIX = 'atlasPlayBestScore_';
const LOCAL_STORAGE_BEST_STREAK_PREFIX = 'atlasPlayBestStreak_';
const LOCAL_STORAGE_BEST_IQ_PREFIX = 'atlasPlayBestIQ_';
const LOCAL_STORAGE_TOTAL_WINS_PREFIX = 'atlasPlayTotalWins_';
const LOCAL_STORAGE_25_WINS_CELEBRATED_PREFIX = 'atlasPlay25WinsCelebrated_';

const LOCAL_STORAGE_SOUND_EFFECTS = 'atlasPlaySoundEffects';
const LOCAL_STORAGE_BACKGROUND_MUSIC = 'atlasPlayBackgroundMusic';

// Add the ErrorBoundary class component before the AtlasGame component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled error in AtlasGame:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message || "An unexpected error occurred."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap the AtlasGame component with ErrorBoundary
export default function AtlasGame() {
  return (
    <ErrorBoundary>
      <AtlasGameContent />
    </ErrorBoundary>
  );
}

// Rename the original AtlasGame function to AtlasGameContent
function AtlasGameContent() {
  const { playerName, setPlayerName: setGlobalPlayerName, hasSetName, setHasSetName } = usePlayer();
  const { toast } = useToast();

  const [uiPlayerName, setUiPlayerName] = useState('');
  const [gamePhase, setGamePhase] = useState<GamePhase>(hasSetName ? 'countdown' : 'nameInput');
  const [countdownStep, setCountdownStep] = useState(0);

  const [currentChain, setCurrentChain] = useState<string[]>([]);
  const [usedLocations, setUsedLocations] = useState<Set<string>>(new Set());
  const [locationInput, setLocationInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);

  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>('user');
  const [expectedLetter, setExpectedLetter] = useState<string>('');
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ score: 0, coins: 0, iq: 0 });
  const [retriesLeft, setRetriesLeft] = useState(INITIAL_RETRIES);
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestIQ, setBestIQ] = useState(0);
  const [totalWins, setTotalWins] = useState(0);

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{type: CelebrationRecordType, value: number} | null>(null);
  const [show25WinsModal, setShow25WinsModal] = useState(false);
  const [showWatchAdForTimeButton, setShowWatchAdForTimeButton] = useState(false);

  const [hintsLeftThisGame, setHintsLeftThisGame] = useState(MAX_HINTS_PER_GAME);

  const [timeLeft, setTimeLeft] = useState(PLAYER_TURN_DURATION);
  const timerIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(true);
  const backgroundMusicAudioRef = useRef<HTMLAudioElement | null>(null);

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showManualShareLinks, setShowManualShareLinks] = useState(false);

  const gamePhaseRef = useRef(gamePhase);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);

  const isOnlineRef = useRef(isOnline);
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const playSoundEffect = useCallback((soundFile: string) => {
    if (soundEffectsEnabled && typeof window !== 'undefined') {
      try {
        // Ensure the path starts with a slash if your sounds are in public/sounds
        const audio = new Audio(soundFile.startsWith('/') ? soundFile : `/sounds/${soundFile}`);
        audio.play().catch(e => console.error(`Error playing sound effect ${soundFile}:`, e));
      } catch (e) {
        console.error(`Could not create audio element for sound effect ${soundFile}:`, e);
      }
    }
  }, [soundEffectsEnabled]);


  useEffect(() => { // Initialize background music element
    if (typeof window !== 'undefined' && !backgroundMusicAudioRef.current) {
      backgroundMusicAudioRef.current = new Audio('/sounds/background-music.mp3');
      backgroundMusicAudioRef.current.loop = true;
      backgroundMusicAudioRef.current.volume = 0.2; // Adjust volume as needed
    }
  }, []);

  useEffect(() => { // Control background music playback
    if (backgroundMusicAudioRef.current) {
      const shouldPlayMusic = backgroundMusicEnabled &&
                              (gamePhase === 'playerTurn' || gamePhase === 'opponentTurn' || gamePhase === 'loadingNextTurn') &&
                              !isPaused && !gameOverMessage && !showCelebration && !show25WinsModal;
      if (shouldPlayMusic) {
        backgroundMusicAudioRef.current.play().catch(e => console.error("Error playing background music:", e));
      } else {
        backgroundMusicAudioRef.current.pause();
      }
    }
  }, [backgroundMusicEnabled, gamePhase, isPaused, gameOverMessage, showCelebration, show25WinsModal]);


  const getLocalStorageKey = useCallback((prefix: string) => {
    if (!playerName) return null;
    return `${prefix}${playerName.trim().replace(/\s+/g, '_').toLowerCase()}`;
  }, [playerName]);

  const normalizeLocation = useCallback((location: string): string => {
    return location.trim().toLowerCase();
  }, []);

  const getLastLetter = useCallback((location: string): string => {
    return location.charAt(location.length - 1).toUpperCase();
  }, []);

  const stopPlayerTimer = useCallback(() => {
    if (timerIntervalIdRef.current) {
      clearInterval(timerIntervalIdRef.current);
      timerIntervalIdRef.current = null;
    }
  }, []);

  const checkAndSetRecords = useCallback((stats: PlayerStats, streak: number) => {
    if (showCelebration || show25WinsModal || !playerName) return false;

    const bestScoreKey = getLocalStorageKey(LOCAL_STORAGE_BEST_SCORE_PREFIX);
    const bestStreakKey = getLocalStorageKey(LOCAL_STORAGE_BEST_STREAK_PREFIX);
    const bestIQKey = getLocalStorageKey(LOCAL_STORAGE_BEST_IQ_PREFIX);

    let recordBroken = false;
    if (bestScoreKey && stats.score > 0 && stats.score > bestScore) {
      setBestScore(stats.score);
      localStorage.setItem(bestScoreKey, stats.score.toString());
      setCelebrationData({ type: 'score', value: stats.score });
      setShowCelebration(true);
      playSoundEffect('record-celebration.wav');
      recordBroken = true;
    } else if (bestStreakKey && streak > 0 && streak > bestStreak) {
      setBestStreak(streak);
      localStorage.setItem(bestStreakKey, streak.toString());
      setCelebrationData({ type: 'streak', value: streak });
      setShowCelebration(true);
      playSoundEffect('record-celebration.wav');
      recordBroken = true;
    } else if (bestIQKey && stats.iq > 0 && stats.iq > bestIQ) {
      setBestIQ(stats.iq);
      localStorage.setItem(bestIQKey, stats.iq.toString());
      setCelebrationData({ type: 'iq', value: stats.iq });
      setShowCelebration(true);
      playSoundEffect('record-celebration.wav');
      recordBroken = true;
    }
    return recordBroken;
  }, [bestScore, bestStreak, bestIQ, showCelebration, show25WinsModal, playerName, getLocalStorageKey, playSoundEffect]);

  const handleGameOverCallback = useCallback((message: string, userWon: boolean = false) => {
    stopPlayerTimer();
    if (gamePhaseRef.current === 'gameOver') return;

    setIsPaused(false); 
    setGamePhase('gameOver');
    setGameOverMessage(message);
    setTimeout(() => {
        toast({ 
          title: "Game Over", 
          description: message, 
          variant: userWon ? "default" : "destructive",
          className: "flex items-center gap-2"
        });
    }, 0);
    
    userWon ? playSoundEffect('game-over-win.wav') : playSoundEffect('game-over-lose.wav');


    const newPlayerStats = playerStats;
    const finalStreak = currentStreak;
    setCurrentStreak(0); 

    let recordCelebrationShown = checkAndSetRecords(newPlayerStats, finalStreak);

    if (userWon && playerName) {
      const totalWinsKey = getLocalStorageKey(LOCAL_STORAGE_TOTAL_WINS_PREFIX);
      const winsCelebratedKey = getLocalStorageKey(LOCAL_STORAGE_25_WINS_CELEBRATED_PREFIX);

      if (totalWinsKey && winsCelebratedKey) {
        const newTotalWins = (parseInt(localStorage.getItem(totalWinsKey) || '0', 10)) + 1;
        setTotalWins(newTotalWins);
        localStorage.setItem(totalWinsKey, newTotalWins.toString());

        const hasCelebrated25Wins = localStorage.getItem(winsCelebratedKey) === 'true';
        if (newTotalWins >= WINS_MILESTONE && !hasCelebrated25Wins && !recordCelebrationShown && !show25WinsModal) {
          setShow25WinsModal(true);
          playSoundEffect('wins-milestone.wav');
          localStorage.setItem(winsCelebratedKey, 'true');
        }
      }
    }
  }, [playerStats, currentStreak, checkAndSetRecords, toast, show25WinsModal, stopPlayerTimer, playerName, getLocalStorageKey, playSoundEffect]);

  const handleGameOverRef = useRef(handleGameOverCallback);
  useEffect(() => {
    handleGameOverRef.current = handleGameOverCallback;
  }, [handleGameOverCallback]);


  const startPlayerTimer = useCallback(() => {
    if (isPausedRef.current || !isOnlineRef.current || gamePhaseRef.current !== 'playerTurn' || gameOverMessage || showCelebration || show25WinsModal) {
        return;
    }
    stopPlayerTimer(); 
    setTimeLeft(PLAYER_TURN_DURATION); 

    const intervalId = setInterval(() => {
      if (isPausedRef.current || gamePhaseRef.current !== 'playerTurn' || !isOnlineRef.current || gameOverMessage || showCelebration || show25WinsModal) {
        clearInterval(intervalId);
        timerIntervalIdRef.current = null;
        return;
      }
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(intervalId);
          timerIntervalIdRef.current = null;
          if (gamePhaseRef.current === 'playerTurn' && isOnlineRef.current && !gameOverMessage && !showCelebration && !show25WinsModal && !isPausedRef.current) {
            setShowWatchAdForTimeButton(true);
            playSoundEffect('time-up.wav');
            handleGameOverRef.current("Time's up!");
          }
          return 0;
        }
        if (prevTime <= LOW_TIME_THRESHOLD + 1 && prevTime > 1) { // +1 because it's prevTime before decrement
            playSoundEffect('timer-tick.wav');
        }
        return prevTime - 1;
      });
    }, 1000);
    timerIntervalIdRef.current = intervalId;
  }, [stopPlayerTimer, gameOverMessage, showCelebration, show25WinsModal, playSoundEffect]);


  useEffect(() => {
    if (gamePhase === 'playerTurn' && isOnlineRef.current && !gameOverMessage && !showCelebration && !show25WinsModal && !isPaused) {
      if (!timerIntervalIdRef.current) { 
        startPlayerTimer();
      }
    } else {
      stopPlayerTimer();
    }
  }, [gamePhase, isOnline, gameOverMessage, showCelebration, show25WinsModal, isPaused, startPlayerTimer, stopPlayerTimer]);


  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        setTimeout(() => toast({ 
          title: "Back Online", 
          description: "Gameplay can resume.",
          className: "flex items-center gap-2"
        }), 0);
      } else {
        setTimeout(() => toast({ 
          title: "You are Offline", 
          description: "Some features may be limited. Please check your connection.", 
          variant: "destructive",
          className: "flex items-center gap-2"
        }), 0);
      }
    };

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine); 
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        if (!navigator.share) {
          setShowManualShareLinks(true);
        }
    }


    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      }
      stopPlayerTimer(); 
    };
  }, [toast, stopPlayerTimer]);

  useEffect(() => {
    if (!hasSetName) {
        setGamePhase('nameInput');
    } else if (playerName && gamePhase === 'nameInput') {
        setGamePhase('countdown');
    }
  }, [hasSetName, playerName, gamePhase]);


  useEffect(() => {
    if (!playerName) return;

    const bestScoreKey = getLocalStorageKey(LOCAL_STORAGE_BEST_SCORE_PREFIX);
    const bestStreakKey = getLocalStorageKey(LOCAL_STORAGE_BEST_STREAK_PREFIX);
    const bestIQKey = getLocalStorageKey(LOCAL_STORAGE_BEST_IQ_PREFIX);
    const totalWinsKey = getLocalStorageKey(LOCAL_STORAGE_TOTAL_WINS_PREFIX);

    if (bestScoreKey) setBestScore(parseInt(localStorage.getItem(bestScoreKey) || '0', 10));
    if (bestStreakKey) setBestStreak(parseInt(localStorage.getItem(bestStreakKey) || '0', 10));
    if (bestIQKey) setBestIQ(parseInt(localStorage.getItem(bestIQKey) || '0', 10));
    if (totalWinsKey) setTotalWins(parseInt(localStorage.getItem(totalWinsKey) || '0', 10));

    const storedSoundEffects = localStorage.getItem(LOCAL_STORAGE_SOUND_EFFECTS);
    setSoundEffectsEnabled(storedSoundEffects ? JSON.parse(storedSoundEffects) : true);

    const storedBackgroundMusic = localStorage.getItem(LOCAL_STORAGE_BACKGROUND_MUSIC);
    setBackgroundMusicEnabled(storedBackgroundMusic ? JSON.parse(storedBackgroundMusic) : true);

  }, [playerName, getLocalStorageKey]);

  const resetGameValues = useCallback(() => {
    setCurrentChain([]);
    setUsedLocations(new Set());
    setLocationInput('');
    setPlayerStats({ score: 0, coins: 0, iq: 0 });
    setCurrentStreak(0);
    setRetriesLeft(INITIAL_RETRIES);
    setHintsLeftThisGame(MAX_HINTS_PER_GAME);
    setError(null);
    setGameOverMessage(null);
    setShowCelebration(false);
    setShow25WinsModal(false);
    setShowWatchAdForTimeButton(false);
    setIsPaused(false);
    setTimeLeft(PLAYER_TURN_DURATION);
  }, []);


  useEffect(() => {
    if (gamePhase === 'countdown' && playerName) {
      if (countdownStep < COUNTDOWN_SEQUENCE.length) {
        const timer = setTimeout(() => {
          playSoundEffect('countdown-tick.wav');
          setCountdownStep(prev => prev + 1);
        }, 700);
        return () => clearTimeout(timer);
      } else {
        resetGameValues();
        setGamePhase('playerTurn');
        setCurrentPlayer('user');
        setExpectedLetter('S'); // Default starting letter
        playSoundEffect('game-start.wav');
        setTimeout(() => toast({ 
          title: "Game Start!", 
          description: `Enter a place starting with 'S'`,
          className: "flex items-center gap-2"
        }), 0);
      }
    }
  }, [gamePhase, countdownStep, playerName, toast, resetGameValues, playSoundEffect]);


  const handleLocalOpponentTurn = useCallback(async (currentChainForOpponent: string[], opponentExpectedLetter: string) => {
    if (showCelebration || show25WinsModal || isPausedRef.current) {
      setTimeout(() => handleLocalOpponentTurn(currentChainForOpponent, opponentExpectedLetter), 200);
      return;
    }

    setGamePhase('opponentTurn');
    setIsLoading(true);

    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      if (isPausedRef.current) { 
          setIsLoading(false);
          return;
      }

      const opponentLocation = await getLocalLocationSuggestion(opponentExpectedLetter, currentChainForOpponent);

      if (!opponentLocation) {
        handleGameOverRef.current("Opponent couldn't find a valid location. You win!", true);
        setIsLoading(false);
        return;
      }
      
      const normalizedOpponentLocation = normalizeLocation(opponentLocation);

      if (normalizedOpponentLocation.charAt(0).toUpperCase() !== opponentExpectedLetter) {
        handleGameOverRef.current(`Opponent made an invalid move (wrong letter: ${opponentLocation}). You win!`, true);
        setIsLoading(false);
        return;
      }

      if (usedLocations.has(normalizedOpponentLocation)) {
        handleGameOverRef.current(`Opponent repeated a location ('${opponentLocation}'). You win!`, true);
        setIsLoading(false);
        return;
      }
      
      const opponentValidationResult = await isValidLocalLocation(opponentLocation, currentChainForOpponent);

      if (!opponentValidationResult.isValid) {
        handleGameOverRef.current(opponentValidationResult.reason || `Opponent suggested an invalid location ('${opponentLocation}'). You win!`, true);
        setIsLoading(false);
        return;
      }

      setCurrentChain(prev => [...prev, opponentLocation]);
      setUsedLocations(prev => new Set(prev).add(normalizedOpponentLocation));
      playSoundEffect('opponent-move.wav');

      setTimeout(() => {
        toast({
            title: "Opponent Played!",
            description: `Opponent chose '${opponentLocation}'. Your turn!`,
        });
      }, 0);

      setGamePhase('playerTurn');
      setCurrentPlayer('user');
      setExpectedLetter(getLastLetter(opponentLocation));

    } catch (e: any) {
      console.error("Local opponent turn error:", e);
      setTimeout(() => toast({ 
        title: "Game Error", 
        description: "An error occurred during the opponent's turn.", 
        variant: "destructive",
        className: "flex items-center gap-2"
      }), 0);
      setGamePhase('playerTurn'); 
      setCurrentPlayer('user'); 
    } finally {
        setIsLoading(false);
    }
  }, [normalizeLocation, getLastLetter, toast, usedLocations, showCelebration, show25WinsModal, playSoundEffect]);


  const handleSubmitCurrentInput = useCallback(async () => {
    if (!locationInput.trim() || gamePhaseRef.current !== 'playerTurn' || isLoading || showCelebration || show25WinsModal || isPausedRef.current) return;

    stopPlayerTimer();
    setIsLoading(true);
    setError(null);
    playSoundEffect('click.wav');

    const currentInput = locationInput.trim();
    const normalizedInput = normalizeLocation(currentInput);

    if (normalizedInput.charAt(0).toUpperCase() !== expectedLetter) {
      setError(`Location must start with the letter '${expectedLetter}'.`);
      playSoundEffect('error-move.wav');
      const remainingRetries = retriesLeft - 1;
      if (remainingRetries >= 0) {
        setRetriesLeft(remainingRetries);
        setTimeout(() => {
          toast({
            title: "Wrong Letter!",
            description: `Must start with '${expectedLetter}'. ${remainingRetries} ${remainingRetries === 1 ? 'retry' : 'retries'} left.`,
            variant: "destructive",
          });
        }, 0);
        if (isOnlineRef.current && !gameOverMessage && !showCelebration && !show25WinsModal && !isPausedRef.current) startPlayerTimer();
      } else {
        handleGameOverRef.current(`Wrong starting letter. Expected '${expectedLetter}'.`);
      }
      setIsLoading(false);
      return;
    }

    if (usedLocations.has(normalizedInput)) {
      setError(`'${currentInput}' has already been used. Please try a different one.`);
      playSoundEffect('error-move.wav');
      const remainingRetries = retriesLeft - 1;
      if (remainingRetries >= 0) {
        setRetriesLeft(remainingRetries);
        setTimeout(() => {
          toast({
            title: "Duplicate Place!",
            description: `'${currentInput}' already used. ${remainingRetries} ${remainingRetries === 1 ? 'retry' : 'retries'} left.`,
            variant: "destructive",
          });
        }, 0);
        if (isOnlineRef.current && !gameOverMessage && !showCelebration && !show25WinsModal && !isPausedRef.current) startPlayerTimer();
      } else {
        handleGameOverRef.current(`'${currentInput}' has already been used. No retries left.`);
      }
      setIsLoading(false);
      return;
    }

    try {
      const validationResult = await isValidLocalLocation(currentInput, currentChain);

      if (validationResult.isValid) {
        const canonicalName = currentInput; 
        const normalizedCanonical = normalizeLocation(canonicalName);

        if (usedLocations.has(normalizedCanonical)) { 
            setError(`'${canonicalName}' (or a similar name) has already been used.`);
            playSoundEffect('error-move.wav');
             const remainingRetries = retriesLeft - 1;
            if (remainingRetries >= 0) {
                setRetriesLeft(remainingRetries);
                setTimeout(() => {
                  toast({
                      title: "Duplicate Place!",
                      description: `'${canonicalName}' already used. ${remainingRetries} ${remainingRetries === 1 ? 'retry' : 'retries'} left.`,
                      variant: "destructive",
                  });
                }, 0);
                if (isOnlineRef.current && !gameOverMessage && !showCelebration && !show25WinsModal && !isPausedRef.current) startPlayerTimer();
            } else {
                handleGameOverRef.current(`'${canonicalName}' (or a similar name) has already been used.`);
            }
            setIsLoading(false);
            return;
        }

        const newChain = [...currentChain, canonicalName];
        setCurrentChain(newChain);
        setUsedLocations(prev => new Set(prev).add(normalizedInput).add(normalizedCanonical));
        setLocationInput('');
        playSoundEffect('correct-move.wav');

        const newPlayerStats = {
            score: playerStats.score + 1,
            coins: playerStats.coins + 5,
            iq: Math.min(100, playerStats.iq + 2)
        };
        setPlayerStats(newPlayerStats);
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);

        const celebrationShown = checkAndSetRecords(newPlayerStats, newStreak);

        if (!celebrationShown) {
            setTimeout(() => {
              toast({
                  title: "Great Move!",
                  description: `'${canonicalName}' added. Opponent's turn...`,
                  className: "bg-primary text-primary-foreground"
              });
            }, 0);
        }

        setGamePhase('loadingNextTurn');
        setCurrentPlayer('opponent');
        const nextExpectedLetter = getLastLetter(canonicalName);
        setExpectedLetter(nextExpectedLetter);
        setRetriesLeft(INITIAL_RETRIES);

        handleLocalOpponentTurn(newChain, nextExpectedLetter);

      } else {
        let userErrorMessage = validationResult.reason || `'${currentInput}' is not a valid input.`;
        if (validationResult.reason && (validationResult.reason.includes('not a recognized place') || validationResult.reason.includes('not found'))) {
            userErrorMessage = `Only continents, countries, states, and famous cities are allowed. '${currentInput}' is not recognized.`;
        }
        
        setError(userErrorMessage);
        playSoundEffect('error-move.wav');
        const remainingRetries = retriesLeft - 1;
        if (remainingRetries >= 0) {
            setRetriesLeft(remainingRetries);
            setTimeout(() => {
              toast({
                  title: "Invalid Location",
                  description: `${userErrorMessage} ${remainingRetries} ${remainingRetries === 1 ? 'retry' : 'retries'} left.`,
                  variant: "destructive",
              });
            }, 0);
            if (isOnlineRef.current && !gameOverMessage && !showCelebration && !show25WinsModal && !isPausedRef.current) startPlayerTimer();
        } else {
            handleGameOverRef.current(`${userErrorMessage} No retries left.`);
        }
      }
    } catch (e: any) {
      console.error("User submission error with local data:", e);
      setError('A game error occurred. Please try again.');
      playSoundEffect('error-move.wav');
      setTimeout(() => toast({ 
        title: "Error", 
        description: "A game error occurred.", 
        variant: "destructive",
        className: "flex items-center gap-2"
      }), 0);
      if (isOnlineRef.current && !gameOverMessage && !showCelebration && !show25WinsModal && !isPausedRef.current) startPlayerTimer();
    } finally {
      setIsLoading(false);
    }
  }, [
    locationInput, isLoading, showCelebration, show25WinsModal, isOnline,
    normalizeLocation, expectedLetter, retriesLeft, usedLocations, currentChain,
    playerStats, currentStreak, checkAndSetRecords, toast,
    getLastLetter, startPlayerTimer, stopPlayerTimer, handleLocalOpponentTurn, gameOverMessage, playSoundEffect
  ]);

  const handleUserSubmitForm = async (event: FormEvent) => {
    event.preventDefault();
    handleSubmitCurrentInput();
  };

  // Add a ref to track if we should auto-retry
  const autoRetryRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setBrowserSupportsSpeechRecognition(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTimeout(() => toast({ 
        title: "Listening...", 
        description: "Speak now!",
        className: "flex items-center gap-2"
      }), 0);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setLocationInput(event.results[i][0].transcript.trim());
        } else {
           setLocationInput(transcript);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      let errorMsg = "An unknown speech error occurred.";
      let showRetry = false;
      if (event.error === 'not-allowed') {
        errorMsg = "Microphone access denied. Please allow access in your browser settings.";
      } else if (event.error === 'no-speech') {
        errorMsg = "No speech detected. Please try again.";
        showRetry = true;
      } else if (event.error === 'network') {
        errorMsg = "Network error during speech recognition.";
      } else if (event.error === 'audio-capture') {
        errorMsg = "Microphone not available or not working.";
      }
      setTimeout(() => {
        toast({
          title: "Speech Error",
          description: errorMsg,
          variant: "destructive",
          action: showRetry ? {
            label: "Retry",
            onClick: () => {
              autoRetryRef.current = false;
              recognition.start();
            }
          } : undefined
        });
      }, 0);
      setIsListening(false);
      if (showRetry) {
        autoRetryRef.current = true;
        setTimeout(() => {
          if (autoRetryRef.current) {
            recognition.start();
          }
        }, 1500);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      autoRetryRef.current = false;
      if (locationInput.trim() && gamePhaseRef.current === 'playerTurn' && !isLoading && !showCelebration && !show25WinsModal && !gameOverMessage && !isPausedRef.current) {
         handleSubmitCurrentInput();
      }
    };

    speechRecognitionRef.current = recognition;

    return () => {
      speechRecognitionRef.current?.stop();
    };
  }, [toast, locationInput, isLoading, showCelebration, show25WinsModal, handleSubmitCurrentInput, gameOverMessage]);


  const handleGetHint = async () => {
    if (gamePhaseRef.current !== 'playerTurn' || showCelebration || show25WinsModal || hintsLeftThisGame <= 0 || isHintLoading || isLoading || gameOverMessage || isPausedRef.current) {
        return;
    }
    playSoundEffect('click.wav');
    setIsHintLoading(true);
    setError(null);
    setHints([]);
    try {
      const localHints = await getLocalLocationHints(currentChain, 3);
      setHints(localHints);
      if(localHints.length > 0) {
        playSoundEffect('hint-popup.wav');
        setTimeout(() => toast({ 
          title: "Hints Generated!", 
          description: "Check out the suggestions.",
          className: "flex items-center gap-2"
        }), 0);
        setTimeout(() => toast({ title: "Hints Generated!", description: "Check out the suggestions." }), 0);
      } else {
        playSoundEffect('error-move.wav');
        setTimeout(() => toast({ title: "No Hints Found", description: "Could not find suitable hints from local data." }), 0);
      }
      setHintsLeftThisGame(prev => prev - 1);
    } catch (e: any) {
      console.error("Hint generation error from local data:", e);
      setError('Failed to generate hints.');
      playSoundEffect('error-move.wav');
      setTimeout(() => toast({ title: "Hint Error", description: "Failed to generate hints.", variant: "destructive", icon: <ServerCrash className="h-5 w-5"/>}), 0);
    } finally {
      setIsHintLoading(false);
    }
  };

  const handleRestartGame = () => {
    playSoundEffect('click.wav');
    stopPlayerTimer();
    setIsPaused(false);
    setShowWatchAdForTimeButton(false);
    setGamePhase(playerName ? 'countdown' : 'nameInput');
    setCountdownStep(0);
    setGameOverMessage(null);
    
    setTimeout(() => toast({ title: "Game Restarted", description: "Starting a new game."}), 0);
  };

  const handleExitGame = () => {
    playSoundEffect('click.wav');
    stopPlayerTimer();
    setIsPaused(false);
    setGlobalPlayerName(null); 
    setHasSetName(false);
    setUiPlayerName(playerName || ''); 
    setGamePhase('nameInput');
    setGameOverMessage(null);
    resetGameValues();
    setTimeout(() => toast({ title: "Exited Game", description: "Returning to name input screen."}), 0);
  };

  const handlePauseToggle = () => {
    playSoundEffect('click.wav');
    setIsPaused(prev => {
      const newPausedState = !prev;
      if (newPausedState) {
        stopPlayerTimer();
        setTimeout(() => toast({ title: "Game Paused", icon: <PauseIcon className="h-5 w-5" /> }), 0);
      } else {
        if (gamePhaseRef.current === 'playerTurn' && !gameOverMessage && !showCelebration && !show25WinsModal) {
          startPlayerTimer();
        }
        setTimeout(() => toast({ title: "Game Resumed", icon: <Play className="h-5 w-5" /> }), 0);
      }
      return newPausedState;
    });
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSoundEffect('click.wav');
    if (uiPlayerName.trim()) {
      setGlobalPlayerName(uiPlayerName.trim());
      setHasSetName(true);
      
    } else {
      setTimeout(() => toast({ title: "Name Required", description: "Please enter a name to play.", variant: "destructive" }), 0);
    }
  };

  const handleChangeNameInHeader = () => { 
    playSoundEffect('click.wav');
    stopPlayerTimer();
    setIsPaused(false);
    setGlobalPlayerName(null);
    setHasSetName(false);
    setUiPlayerName(playerName || '');
    setGamePhase('nameInput');
    setGameOverMessage(null);
    resetGameValues();
  };


  const handleToggleListening = () => {
    playSoundEffect('click.wav');
    if (isPausedRef.current) {
        setTimeout(() => toast({ title: "Game Paused", description: "Resume game to use microphone."}), 0);
        return;
    }
    if (!isOnlineRef.current && browserSupportsSpeechRecognition) { 
        setTimeout(() => toast({title: "Voice Input Note", description: "Voice input might be affected by network status.", variant: "default"}), 0);
    }
    if (!browserSupportsSpeechRecognition) {
      setTimeout(() => {
        toast({
          title: "Mic Not Supported",
          description: "Speech recognition is not supported by your browser.",
          variant: "destructive",
        });
      }, 0);
      return;
    }
    if (speechRecognitionRef.current) {
      if (isListening) {
        speechRecognitionRef.current.stop();
      } else {
         if (gamePhaseRef.current === 'playerTurn' && !isLoading && !showCelebration && !show25WinsModal && !gameOverMessage && !isPausedRef.current) {
            try {
                speechRecognitionRef.current.start();
            } catch (err) {
                console.error("Error starting speech recognition:", err);
                setTimeout(() => toast({ title: "Mic Error", description: "Could not start voice recording.", variant: "destructive"}), 0);
            }
         }
      }
    }
  };

  const handleShareScore = async () => {
    if (playerStats.score <= 0 || isSharing) return;
    playSoundEffect('click.wav');
    setIsSharing(true);

    const shareMessage = `I just scored ${playerStats.score} points playing AtlasPlay! My IQ is ${playerStats.iq}. Can you beat my score? 🌍🏆`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/play' : 'https://your-atlasplay-url.com/play';

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My AtlasPlay Score!',
          text: shareMessage,
          url: shareUrl,
        });
        setTimeout(() => toast({ title: "Shared!", description: "Your score has been shared." }), 0);
      } else {
        setShowManualShareLinks(true); 
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${shareMessage} Play here: ${shareUrl}`);
          setTimeout(() => toast({ title: "Copied to Clipboard!", description: "Score message copied. Manual share links available." }), 0);
        } else {
          setTimeout(() => toast({ title: "Share Failed", description: "Could not automatically share or copy. Please use manual links.", variant: "destructive" }), 0);
        }
      }
    } catch (e: unknown) { 
      console.error('Error sharing score:', e);
      setShowManualShareLinks(true); 

      if (e instanceof DOMException) {
        if (e.name === 'AbortError') {
          setTimeout(() => toast({ title: "Share Cancelled", description: "You cancelled the share operation." }), 0);
        } else if (e.name === 'NotAllowedError') {
          setTimeout(() => toast({ title: "Share Permission Denied", description: "Sharing was blocked. Try manual links or check browser permissions.", variant: "destructive" }), 0);
        } else {
          setTimeout(() => toast({ title: "Share Error", description: `Share failed: ${e.message}. Try manual links.`, variant: "destructive" }), 0);
        }
      } else if (e instanceof Error) {
        setTimeout(() => toast({ title: "Share Error", description: `An unexpected error occurred: ${e.message}. Try manual links.`, variant: "destructive" }), 0);
      } else {
        setTimeout(() => toast({ title: "Share Error", description: "An unknown error occurred. Try manual links.", variant: "destructive" }), 0);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleToggleSoundEffects = (checked: boolean) => {
    setSoundEffectsEnabled(checked);
    localStorage.setItem(LOCAL_STORAGE_SOUND_EFFECTS, JSON.stringify(checked));
    playSoundEffect('click.wav');
  };

  const handleToggleBackgroundMusic = (checked: boolean) => {
    setBackgroundMusicEnabled(checked);
    localStorage.setItem(LOCAL_STORAGE_BACKGROUND_MUSIC, JSON.stringify(checked));
    if (checked && backgroundMusicAudioRef.current && (gamePhase === 'playerTurn' || gamePhase === 'opponentTurn' || gamePhase === 'loadingNextTurn') && !isPaused && !gameOverMessage) {
        backgroundMusicAudioRef.current.play().catch(e => console.error("Error playing background music on toggle:", e));
    } else if (!checked && backgroundMusicAudioRef.current) {
        backgroundMusicAudioRef.current.pause();
    }
    playSoundEffect('click.wav');
  };

  if (gamePhase === 'nameInput' || !hasSetName) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4 pt-8">
            <GlobeLogo className="justify-center mb-4" />
            <CardTitle className="font-headline text-3xl">Welcome to AtlasPlay!</CardTitle>
            <CardDescription>Enter your name to start your adventure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playerNameInput" className="text-base">Player Name</Label>
                <Input
                  id="playerNameInput"
                  type="text"
                  placeholder="Your Name"
                  value={uiPlayerName}
                  onChange={(e) => setUiPlayerName(e.target.value)}
                  required
                  className="text-lg p-3"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full text-lg py-3" size="lg" disabled={!uiPlayerName.trim() || isLoading}>
                Let's Play!
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }


  if (gamePhase === 'countdown') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
        <GlobeLogo className="mb-8" />
        {countdownStep < COUNTDOWN_SEQUENCE.length ? (
          <p className="font-headline text-8xl md:text-9xl text-primary animate-pulse">
            {COUNTDOWN_SEQUENCE[countdownStep]}
          </p>
        ) : (
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        )}
      </div>
    );
  }

  const CurrentTurnIcon = currentPlayer === 'user' ? User : Bot; 
  let turnMessage = "Loading...";
  if (isPaused) {
    turnMessage = "Game Paused";
  } else if (gamePhaseRef.current === 'playerTurn' && !gameOverMessage) {
    turnMessage = `Your Turn (Starts with '${expectedLetter}')`;
  } else if (gamePhaseRef.current === 'opponentTurn' || gamePhaseRef.current === 'loadingNextTurn') {
    turnMessage = "Opponent is Thinking...";
  } else if (gameOverMessage) {
    turnMessage = "Game Over";
  }


  const shareLinks = [
    {
      name: 'Twitter',
      icon: <Twitter className="h-5 w-5" />,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just scored ${playerStats.score} points playing AtlasPlay! My IQ is ${playerStats.iq}. Play at ${typeof window !== 'undefined' ? window.location.origin + '/play' : ''}`)}`
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/play' : '')}&quote=${encodeURIComponent(`I just scored ${playerStats.score} points playing AtlasPlay!  My IQ is ${playerStats.iq}.`)}`
    }
  ];


  return (
    <div className="flex flex-col items-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-secondary/30 to-background text-foreground">
      {showCelebration && celebrationData && (
        <RecordCelebrationModal
          isOpen={showCelebration}
          onClose={() => {
            playSoundEffect('click.wav');
            setShowCelebration(false);
            if (gamePhaseRef.current === 'loadingNextTurn' && currentPlayer === 'opponent' && currentChain.length > 0 && !gameOverMessage && !showCelebration && !show25WinsModal && !isPausedRef.current) {
                handleLocalOpponentTurn(currentChain, expectedLetter);
            }
          }}
          recordType={celebrationData.type}
          newValue={celebrationData.value}
        />
      )}
      {show25WinsModal && (
        <TwentyFiveWinsModal
          isOpen={show25WinsModal}
          onClose={() => {
            playSoundEffect('click.wav');
            setShow25WinsModal(false);
          }}
          wins={totalWins}
        />
      )}
      <header className="w-full max-w-3xl mb-6 flex justify-between items-center">
        <GlobeLogo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {playerName && (
            <Badge variant="secondary" className="text-sm py-1 px-3 flex items-center gap-1.5">
              <UserCircle className="h-4 w-4" /> {playerName}
            </Badge>
          )}
           <Button variant="outline" size="sm" onClick={handleChangeNameInHeader}>Change Name</Button>
        </div>
      </header>

      <div className="w-full max-w-3xl mb-4 flex flex-col sm:flex-row gap-2 justify-end items-center text-xs">
        <div className="flex items-center space-x-2">
          <Switch
            id="sound-effects-toggle"
            checked={soundEffectsEnabled}
            onCheckedChange={handleToggleSoundEffects}
            aria-label="Toggle sound effects"
            disabled={isPaused}
          />
          <Label htmlFor="sound-effects-toggle" className="flex items-center gap-1 text-muted-foreground">
            <Volume2 className="h-4 w-4" /> Sound Effects
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="background-music-toggle"
            checked={backgroundMusicEnabled}
            onCheckedChange={handleToggleBackgroundMusic}
            aria-label="Toggle background music"
            disabled={isPaused}
          />
          <Label htmlFor="background-music-toggle" className="flex items-center gap-1 text-muted-foreground">
            <Music className="h-4 w-4" /> Music
          </Label>
        </div>
      </div>


      <Card className="w-full max-w-3xl shadow-xl mb-4">
        <CardHeader>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-yellow-500" /> Score: {playerStats.score} (Best: {bestScore})
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-orange-500" /> Streak: {currentStreak} (Best: {bestStreak})
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-green-500" /> Coins: {playerStats.coins}
              </div>
               <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-blue-500" /> Wins: {totalWins}
              </div>
            </div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <Progress value={playerStats.iq} className="w-full h-3" aria-label={`IQ level ${getIQLevel(playerStats.iq)}: ${playerStats.iq} out of 100`} aria-valuenow={playerStats.iq} aria-valuemin={0} aria-valuemax={100} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{getIQLevel(playerStats.iq)} ({playerStats.iq} IQ) (Best: {bestIQ})</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="font-headline text-xl md:text-2xl text-center flex items-center justify-center gap-2" aria-live="polite">
              <CurrentTurnIcon className="h-6 w-6 text-primary" /> {turnMessage}
            </CardTitle>
          </div>
          {gamePhaseRef.current !== 'gameOver' && currentChain.length > 0 && (
            <CardDescription className="text-center">
              Last played: <strong className="text-accent">{currentChain[currentChain.length - 1]}</strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40 md:h-48 w-full border rounded-md p-3 mb-4 bg-muted/30">
            {currentChain.length === 0 && gamePhaseRef.current !== 'gameOver' && !isPaused ? (
              <p className="text-muted-foreground text-center">The chain is empty. Make the first move!</p>
            ) : isPaused ? (
              <p className="text-muted-foreground text-center font-semibold">Game Paused. Press Resume to continue.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {currentChain.map((loc, index) => (
                  <Badge key={index} variant={index === currentChain.length - 1 ? "default" : "secondary"} className="text-sm py-0.5 px-2 shadow-sm">
                    {loc}
                    {index < currentChain.length - 1 && <span className="text-xs opacity-60 ml-1">-&gt;</span>}
                  </Badge>
                ))}
              </div>
            )}
             {gameOverMessage && (
                <Alert variant={gameOverMessage.includes("You win!") ? "default" : "destructive"} className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{gameOverMessage.includes("You win!") ? "Congratulations!" : "Game Over!"}</AlertTitle>
                  <AlertDescription>{gameOverMessage}</AlertDescription>
                </Alert>
              )}
          </ScrollArea>

          {gamePhaseRef.current === 'playerTurn' && !gameOverMessage && (
            <form onSubmit={handleUserSubmitForm} className="space-y-3">
              {isListening && (
                <div className="flex items-center gap-2 mb-2 animate-pulse text-primary">
                  <Mic className="h-5 w-5 animate-pulse" />
                  <span>Listening... Please speak now</span>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <Input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder={`Enter location starting with '${expectedLetter}'`}
                  className="flex-grow py-2.5 px-3.5 text-base md:text-sm"
                  aria-label="Location input"
                  disabled={isLoading || showCelebration || show25WinsModal || isListening || isPaused}
                />
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  className="h-[42px] w-[42px] md:h-10 md:w-10 shrink-0"
                  aria-label={isListening ? "Stop voice recording" : "Start voice recording for location input"}
                  onClick={handleToggleListening}
                  disabled={!browserSupportsSpeechRecognition || isLoading || showCelebration || show25WinsModal || isPaused}
                >
                  {isListening ? <Square className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
                </Button>
              </div>
              <Button type="submit" className="w-full text-md py-2.5" disabled={isLoading || !locationInput.trim() || showCelebration || show25WinsModal || isListening || isPaused}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Submit Location
              </Button>
            </form>
          )}
           {(gamePhaseRef.current === 'opponentTurn' || gamePhaseRef.current === 'loadingNextTurn') && !gameOverMessage && !showCelebration && !show25WinsModal && !isPaused &&(
             <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Opponent is thinking...</p>
             </div>
           )}

          {error && gamePhaseRef.current !== 'gameOver' && !showCelebration && !show25WinsModal && !isPaused && (
            <Alert variant="destructive" className="mt-4" aria-live="assertive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Oops!</AlertTitle>
              <AlertDescription>{error} {retriesLeft >= 0 && gamePhaseRef.current === 'playerTurn' && !error.includes('retry') && !error.includes('No retries left') && !error.toLowerCase().includes('only continents, countries') ? `${retriesLeft} ${retriesLeft === 1 ? 'retry' : 'retries'} left.` : ''}</AlertDescription>
            </Alert>
          )}

          
          {gamePhaseRef.current === 'playerTurn' && !gameOverMessage && !showCelebration && !show25WinsModal && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleGetHint}
                        disabled={isHintLoading || isLoading || isListening || hintsLeftThisGame <= 0 || isPaused}
                        className="bg-accent/20 hover:bg-accent/30 text-accent-foreground border-accent/50 shrink-0"
                        aria-label={`Get a hint, ${hintsLeftThisGame} uses left`}
                    >
                        {isHintLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                        Hint ({hintsLeftThisGame} left)
                    </Button>
                    {hintsLeftThisGame <= 0 && (
                        <Button variant="outline" disabled className="opacity-70 text-xs px-2 shrink-0">
                            <Tv className="mr-1.5 h-4 w-4" /> Watch Ad for Hints
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePauseToggle}
                        aria-label={isPaused ? "Resume Game" : "Pause Game"}
                        className="text-primary"
                    >
                        {isPaused ? <Play className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
                    </Button>
                    <div className="flex items-center justify-center text-lg font-medium text-primary p-2 border border-primary/30 rounded-md shadow-sm bg-primary/5 min-w-[80px]">
                        <Clock className="h-5 w-5 mr-2 text-primary/80" />
                        <span>{String(timeLeft).padStart(2, '0')}s</span>
                    </div>
                </div>
            </div>
          )}
           {hintsLeftThisGame <= 0 && gamePhaseRef.current === 'playerTurn' && !gameOverMessage && !showCelebration && !show25WinsModal && !isPaused && (
            <p className="text-xs text-muted-foreground text-center mt-2">
                You have used all your hints for this game.
            </p>
           )}

          {hints.length > 0 && gamePhaseRef.current === 'playerTurn' && !gameOverMessage && !showCelebration && !show25WinsModal && !isPaused &&(
            <div className="mt-3 p-3 border rounded-md bg-accent/10">
              <h3 className="font-semibold text-accent-foreground mb-1.5 flex items-center text-sm"><Info className="h-4 w-4 mr-1.5 text-accent"/>Suggestions:</h3>
              <ul className="list-disc list-inside space-y-0.5">
                {hints.map((hint, index) => (
                  <li key={index} className="text-xs text-accent-foreground/80">{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        
        {(gamePhaseRef.current === 'playerTurn' || gamePhaseRef.current === 'opponentTurn' || gamePhaseRef.current === 'loadingNextTurn' || gamePhaseRef.current === 'gameOver') &&
         !showCelebration && !show25WinsModal && (
          <CardFooter className={`flex flex-col gap-3 pt-4 ${gamePhaseRef.current === 'gameOver' ? 'sm:flex-row justify-center' : 'sm:flex-row justify-end'}`}>
            {gamePhaseRef.current === 'gameOver' ? (
              <>
                <Button onClick={handleRestartGame} className="text-lg py-3 px-6 w-full sm:w-auto">
                  <Play className="mr-2 h-5 w-5" /> Play Again?
                </Button>
                {playerStats.score > 0 && (
                  <Button
                    onClick={handleShareScore}
                    variant="outline"
                    className="text-lg py-3 px-6 w-full sm:w-auto"
                    disabled={isSharing}
                    aria-label="Share your score"
                  >
                    {isSharing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
                    Share Score
                  </Button>
                )}
                <Button onClick={handleExitGame} variant="ghost" className="text-lg py-3 px-6 w-full sm:w-auto">
                  <LogOut className="mr-2 h-5 w-5" /> Exit to Menu
                </Button>
              </>
            ) : (
              
              <>
                <Button onClick={handleRestartGame} variant="outline" size="sm" disabled={isPaused}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Restart Game
                </Button>
                <Button onClick={handleExitGame} variant="destructive" size="sm" disabled={isPaused}>
                  <LogOut className="mr-2 h-4 w-4" /> Exit Game
                </Button>
              </>
            )}
          </CardFooter>
        )}

        
        {gamePhaseRef.current === 'gameOver' && !showCelebration && !show25WinsModal && (
            <div className="p-6 pt-0 text-center">
                {showManualShareLinks && playerStats.score > 0 && (
                <div className="mt-2 flex flex-wrap justify-center items-center gap-2">
                    <span className="text-xs text-muted-foreground">Or share via:</span>
                    {shareLinks.map(link => (
                    <Button key={link.name} variant="outline" size="icon" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${link.name}`}>
                        {link.icon}
                        </a>
                    </Button>
                    ))}
                </div>
                )}
                {showWatchAdForTimeButton && (
                <Button variant="outline" disabled className="text-lg py-3 px-6 opacity-70 mt-4">
                    <Tv className="mr-2 h-5 w-5" /> Watch Ad for Time (Feature Coming Soon)
                </Button>
                )}
            </div>
        )}
      </Card>
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AtlasPlay. All rights reserved.</p>
      </footer>
    </div>
  );
}
