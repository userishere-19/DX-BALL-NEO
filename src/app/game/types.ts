export interface Vector {
  x: number;
  y: number;
}

export interface Paddle {
  position: Vector;
  width: number;
  height: number;
  isLaser?: boolean;
}

export interface Ball {
  id: string;
  position: Vector;
  velocity: Vector;
  radius: number;
  trail: Vector[];
}

export interface Brick {
  id: string;
  position: Vector;
  width: number;
  height: number;
  type: 'standard' | 'silver';
  hitsLeft?: number;
  destroyed: boolean;
}

export interface Particle {
    id: string;
    position: Vector;
    velocity: Vector;
    radius: number;
    opacity: number;
    createdAt: number;
    color: 'accent' | 'primary' | 'silver';
}

export interface PowerUp {
    id: string;
    position: Vector;
    type: 'extend' | 'laser' | 'multi-ball' | 'power-ball';
    width: number;
    height: number;
}

export interface Laser {
    id: string;
    position: Vector;
}

export type GameStatus = 'start' | 'playing' | 'level-starting' | 'level-complete' | 'game-over';

export type SoundEffect = 
  | 'paddle'
  | 'brick'
  | 'brickSilver'
  | 'wall'
  | 'powerup'
  | 'loseLife'
  | 'laser'
  | 'levelComplete'
  | 'gameOver'
  | 'start';
