'use client';

import { Laser as LaserType } from '@/app/game/types';

interface LaserProps {
  laser: LaserType;
}

export default function Laser({ laser }: LaserProps) {
  return (
    <div
      className="absolute bg-destructive rounded-full"
      style={{
        width: 4,
        height: 10,
        left: laser.position.x - 2,
        top: laser.position.y,
        boxShadow: '0 0 8px hsl(var(--destructive)), 0 0 12px hsl(var(--destructive))',
      }}
    />
  );
}
