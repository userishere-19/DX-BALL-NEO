'use client';

import { Heart, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HUDProps {
  score: number;
  level: number;
  lives: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function HUD({ score, level, lives, isMuted, onToggleMute }: HUDProps) {
  const commonTextStyle = {
    textShadow: '0 0 5px hsl(var(--accent)), 0 0 10px hsl(var(--accent))',
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 font-headline text-2xl text-accent">
      <div style={commonTextStyle}>
        SCORE: <span className="font-bold">{score}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" style={commonTextStyle}>
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} className="text-primary animate-pulse" fill="hsl(var(--primary))" style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }} />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMute}
          className="text-accent hover:text-accent hover:bg-accent/10"
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>

      <div style={commonTextStyle}>
        LEVEL: <span className="font-bold">{level}</span>
      </div>
    </div>
  );
}
