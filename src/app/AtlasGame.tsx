import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const AtlasGame: React.FC = () => {
  const [timer, setTimer] = useState<number>(60);
  const [hasUsedTimeBoost, setHasUsedTimeBoost] = useState(false);

  const handleTimeBoost = () => {
    if (timer < 30 && !hasUsedTimeBoost) {
      setTimer(prev => prev + 5);
      setHasUsedTimeBoost(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold text-primary">{timer}s</div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleTimeBoost}
        disabled={hasUsedTimeBoost || timer >= 30}
        className="h-8 px-2 text-xs"
      >
        +5s
      </Button>
    </div>
  );
};

export default AtlasGame; 