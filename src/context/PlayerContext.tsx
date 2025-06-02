
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface PlayerContextType {
  playerName: string | null;
  setPlayerName: (name: string | null) => void;
  hasSetName: boolean;
  setHasSetName: Dispatch<SetStateAction<boolean>>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const PLAYER_NAME_STORAGE_KEY = 'atlasPlay_playerName';

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [hasSetName, setHasSetName] = useState(false); // Tracks if name input process was completed

  useEffect(() => {
    const storedName = localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
    if (storedName) {
      setPlayerNameState(storedName);
      setHasSetName(true); // Assume if name is in storage, it was set
    }
  }, []);

  const setPlayerName = (name: string | null) => {
    const trimmedName = name ? name.trim() : null;
    setPlayerNameState(trimmedName);
    if (trimmedName) {
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, trimmedName);
      // setHasSetName(true) is handled by the component using the context after successful submission
    } else {
      localStorage.removeItem(PLAYER_NAME_STORAGE_KEY);
      // setHasSetName(false); // Let the component manage this to re-show input if needed
    }
  };

  const value = { playerName, setPlayerName, hasSetName, setHasSetName };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
