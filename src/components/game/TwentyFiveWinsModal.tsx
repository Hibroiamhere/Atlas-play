
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface TwentyFiveWinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wins: number;
}

const CELEBRATION_DURATION = 4000; // 4 seconds

export default function TwentyFiveWinsModal({ isOpen, onClose, wins }: TwentyFiveWinsModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
      <Card className="w-full max-w-md shadow-2xl transform scale-100 animate-in zoom-in-90 duration-300">
        <CardHeader className="text-center items-center pt-8">
          <Trophy className="h-20 w-20 text-yellow-400 animate-bounce" />
          <CardTitle className="font-headline text-3xl mt-4">Amazing Milestone!</CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="text-lg mb-6 mt-2">
            🎉 Congratulations! You've reached <strong className="text-primary">{wins} wins</strong>! Keep going to beat your high score!
          </p>
          <Button onClick={onClose} size="lg" className="w-1/2">
            Awesome!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
