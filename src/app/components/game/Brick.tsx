'use client';

import { cn } from '@/lib/utils';
import type { Brick as BrickType } from '@/app/game/types';

interface BrickProps {
  brick: BrickType;
}

export default function Brick({ brick }: BrickProps) {
  const isSilver = brick.type === 'silver';
  const opacity = isSilver ? 0.4 + (brick.hitsLeft! / 2) * 0.6 : 1;

  return (
    <div
      className={cn(
        'absolute rounded-sm transition-all duration-300',
        !brick.destroyed && 'animate-pulse-glow'
      )}
      style={{
        width: brick.width,
        height: brick.height,
        left: brick.position.x,
        top: brick.position.y,
        backgroundColor: isSilver ? `hsl(240 10% 80% / ${opacity * 0.3})` : 'hsl(var(--accent) / 0.2)',
        border: `2px solid ${isSilver ? `hsl(240 10% 80% / ${opacity})` : 'hsl(var(--accent))'}`,
        boxShadow: isSilver
          ? `0 0 10px hsl(240 10% 80% / ${opacity * 0.5}), inset 0 0 10px hsl(240 10% 80% / ${opacity * 0.2})`
          : '0 0 10px hsl(var(--accent) / 0.8), 0 0 20px hsl(var(--accent) / 0.4), inset 0 0 10px hsl(var(--accent) / 0.4)',
        transform: brick.destroyed ? 'scale(0)' : 'scale(1)',
        opacity: brick.destroyed ? 0 : 1,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
    />
  );
}
