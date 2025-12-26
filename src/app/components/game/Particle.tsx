'use client';

import type { Particle as ParticleType } from '@/app/game/types';

interface ParticleProps {
  particle: ParticleType;
}

export default function Particle({ particle }: ParticleProps) {
  const colorVar = particle.color === 'accent'
    ? 'hsl(var(--accent))'
    : particle.color === 'silver'
      ? 'hsl(240 10% 80%)'
      : 'hsl(var(--primary))';

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: particle.radius * 2,
        height: particle.radius * 2,
        left: particle.position.x,
        top: particle.position.y,
        opacity: particle.opacity,
        backgroundColor: colorVar,
        transform: 'translate(-50%, -50%)',
        boxShadow: `0 0 10px ${colorVar}, 0 0 20px ${colorVar}`,
        mixBlendMode: 'screen',
      }}
    />
  );
}
