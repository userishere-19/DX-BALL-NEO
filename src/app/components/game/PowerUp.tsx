'use client';

import { cn } from '@/lib/utils';
import type { PowerUp as PowerUpType } from '@/app/game/types';
import { ArrowLeftRight, VenetianMask, Zap } from 'lucide-react';

interface PowerUpProps {
  powerUp: PowerUpType;
}

const powerUpConfig = {
    extend: {
        icon: ArrowLeftRight,
        color: 'hsl(var(--primary))',
        label: 'E',
    },
    laser: {
        icon: Zap,
        color: 'hsl(var(--destructive))',
        label: 'L',
    },
    'multi-ball': {
        icon: VenetianMask,
        color: 'hsl(var(--accent))',
        label: 'M',
    },
    'power-ball': {
        icon: Zap,
        color: 'hsl(var(--destructive))',
        label: 'P'
    }
};

export default function PowerUp({ powerUp }: PowerUpProps) {
    const config = powerUpConfig[powerUp.type];
  
    return (
    <div
      className="absolute flex items-center justify-center rounded-sm animate-pulse"
      style={{
        width: powerUp.width,
        height: powerUp.height,
        left: powerUp.position.x,
        top: powerUp.position.y,
        backgroundColor: `${config.color.slice(0,-1)} / 0.2)`,
        border: `1px solid ${config.color}`,
        boxShadow: `0 0 10px ${config.color}, inset 0 0 8px ${config.color}`,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '10px',
        textShadow: `0 0 5px white`
      }}
    >
      {config.label}
    </div>
  );
}
