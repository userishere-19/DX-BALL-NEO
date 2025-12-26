'use client';

import { cn } from '@/lib/utils';
import type { Ball as BallType } from '@/app/game/types';

interface BallProps {
  ball: BallType;
  isPowerBall?: boolean;
}

export default function Ball({ ball, isPowerBall = false }: BallProps) {
  const ballColor = isPowerBall ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
  const shadowColor = isPowerBall ? 'hsl(var(--destructive) / 0.75)' : 'hsl(var(--primary))';

  return (
    <div className="absolute" style={{
      left: ball.position.x,
      top: ball.position.y,
      width: 0,
      height: 0,
    }}>
      {ball.trail.map((pos, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            width: ball.radius * 2 * ((index + 1) / ball.trail.length),
            height: ball.radius * 2 * ((index + 1) / ball.trail.length),
            left: pos.x - ball.position.x,
            top: pos.y - ball.position.y,
            opacity: 0.2 + (index / ball.trail.length) * 0.5,
            transform: 'translate(-50%, -50%)',
            backgroundColor: ballColor,
            filter: `brightness(2)`,
            boxShadow: `0 0 15px ${shadowColor}`,
          }}
        />
      ))}
      <div
        className={cn(
          "absolute rounded-full",
          isPowerBall && "animate-pulse"
        )}
        style={{
          width: ball.radius * 2,
          height: ball.radius * 2,
          backgroundColor: isPowerBall ? 'white' : ballColor,
          boxShadow: `0 0 15px ${shadowColor}, 0 0 30px ${shadowColor}, inset 0 0 10px rgba(255,255,255,0.8)`,
          transform: 'translate(-50%, -50%)',
          filter: 'brightness(1.2)',
          border: isPowerBall ? '2px solid hsl(var(--destructive))' : '2px solid white',
        }}
      />
    </div>
  );
}
