'use client';

import { cn } from '@/lib/utils';
import type { Paddle as PaddleType } from '@/app/game/types';

interface PaddleProps {
  paddle: PaddleType;
}

export default function Paddle({ paddle }: PaddleProps) {
  return (
    <div
      className="absolute rounded-md"
      style={{
        width: paddle.width,
        height: paddle.height,
        left: paddle.position.x,
        top: paddle.position.y,
        transition: 'width 0.2s ease',
      }}
    >
      <div
        className={cn(
          "h-full w-full rounded-md",
          paddle.isLaser ? 'bg-destructive' : 'bg-primary'
        )}
        style={{
          boxShadow: paddle.isLaser
            ? '0 0 15px hsl(var(--destructive)), 0 0 30px hsl(var(--destructive)), 0 0 60px hsl(var(--destructive))'
            : '0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary)), 0 0 60px hsl(var(--primary))',
          filter: 'blur(0.5px) brightness(1.2)',
          border: '1px solid white',
        }}
      />

      {/* Engine Thrusters */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-2 h-3 w-6 bg-accent rounded-full blur-sm opacity-60 animate-pulse" />
      <div className="absolute top-1/2 -translate-y-1/2 -right-2 h-3 w-6 bg-accent rounded-full blur-sm opacity-60 animate-pulse" />
      {paddle.isLaser && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 left-1 h-1 w-4 bg-white rounded-full" />
          <div className="absolute top-1/2 -translate-y-1/2 right-1 h-1 w-4 bg-white rounded-full" />
        </>
      )}
    </div>
  );
}


