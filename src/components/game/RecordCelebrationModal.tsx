
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper, Trophy, Zap } from 'lucide-react';

interface RecordCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: 'score' | 'streak' | 'iq';
  newValue: number;
}

const CELEBRATION_DURATION = 4000; // 4 seconds

const recordTypeDetails = {
  score: {
    icon: <Trophy className="h-16 w-16 text-yellow-400" />,
    title: "New High Score!",
    message: (val: number) => `You reached a new high score of ${val} points! 🎉`,
  },
  streak: {
    icon: <Zap className="h-16 w-16 text-orange-400" />,
    title: "Longest Streak!",
    message: (val: number) => `Incredible! New longest streak of ${val} moves! 🔥`,
  },
  iq: {
    icon: <PartyPopper className="h-16 w-16 text-purple-400" />,
    title: "Peak IQ Achieved!",
    message: (val: number) => `Genius! You've reached a new peak IQ of ${val}! 🧠`,
  },
};

export default function RecordCelebrationModal({ isOpen, onClose, recordType, newValue }: RecordCelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, CELEBRATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const details = recordTypeDetails[recordType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
      <Card className="w-full max-w-sm shadow-2xl transform scale-100 animate-in zoom-in-90 duration-300">
        <CardHeader className="text-center items-center pt-8">
          {details.icon}
          <CardTitle className="font-headline text-3xl mt-4">{details.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="text-lg mb-8 mt-2">{details.message(newValue)}</p>
          <Button onClick={onClose} size="lg" className="w-1/2">
            Awesome!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
