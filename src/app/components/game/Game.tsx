'use client';

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    PADDLE_Y,
    BALL_RADIUS,
    INITIAL_BALL_SPEED,
    BRICK_WIDTH,
    BRICK_HEIGHT,
    BRICK_GAP,
    BRICK_OFFSET_LEFT,
    BRICK_OFFSET_TOP,
    SCORE_PER_BRICK,
    PADDLE_SPEED,
    INITIAL_LIVES,
    POWER_BALL_SPEED_MULTIPLIER
} from '@/app/game/constants';
import { levels } from '@/app/game/levels';
import { themes } from '@/app/game/themes';
import type { Ball, Paddle, Brick, GameStatus, Vector, Particle, PowerUp, Laser } from '@/app/game/types';
import PaddleComponent from './Paddle';
import BallComponent from './Ball';
import BrickComponent from './Brick';
import ParticleComponent from './Particle';
import PowerUpComponent from './PowerUp';
import LaserComponent from './Laser';
import HUD from './HUD';
import { Button } from '@/components/ui/button';
import { Play, RotateCw, ArrowRight } from 'lucide-react';
import { playSound } from '@/app/game/sounds';
import { musicGenerator } from '@/app/game/music';

const PARTICLE_COUNT = 30;
const PARTICLE_LIFESPAN = 800; // ms

export interface DynamicGameState {
    paddle: Paddle;
    balls: Ball[];
    particles: Particle[];
    powerUps: PowerUp[];
    lasers: Laser[];
}

interface GameState {
    score: number;
    level: number;
    lives: number;
    gameStatus: GameStatus;
    isPowerBallActive: boolean;
    bricks: Brick[];
    paddleWidth: number;
    paddleIsLaser: boolean;
}

type Action =
    | { type: 'SET_GAME_STATE'; payload: Partial<GameState> }
    | { type: 'START_GAME' }
    | { type: 'NEXT_LEVEL' }
    | { type: 'LOSE_LIFE' }
    | { type: 'RESET_GAME' }
    | { type: 'SET_STATUS'; payload: GameStatus }
    | { type: 'UPDATE_BRICKS_AND_SCORE'; payload: { bricks: Brick[], scoreToAdd: number } }
    | { type: 'INCREASE_SCORE'; payload: number }
    | { type: 'SET_PADDLE_PROPS'; payload: { width?: number, isLaser?: boolean } }
    | { type: 'SET_POWER_BALL'; payload: boolean };


const loadLevel = (levelIndex: number): Brick[] => {
    const levelLayout = levels[levelIndex % levels.length];
    return levelLayout.flatMap((row, rowIndex) =>
        row.map((brickType, colIndex) => {
            if (brickType === 0) return null;

            const isSilver = brickType === 2;
            return {
                id: `brick-${levelIndex}-${rowIndex}-${colIndex}`,
                position: {
                    x: BRICK_OFFSET_LEFT + colIndex * (BRICK_WIDTH + BRICK_GAP),
                    y: BRICK_OFFSET_TOP + rowIndex * (BRICK_HEIGHT + BRICK_GAP),
                },
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                type: isSilver ? 'silver' : 'standard',
                hitsLeft: isSilver ? 2 : 1,
                destroyed: false,
            };
        }).filter(b => b !== null) as Brick[]
    );
};

const initialGameState: GameState = {
    score: 0,
    level: 0,
    lives: INITIAL_LIVES,
    gameStatus: 'start',
    isPowerBallActive: false,
    bricks: [],
    paddleWidth: PADDLE_WIDTH,
    paddleIsLaser: false,
};


function gameReducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case 'SET_GAME_STATE':
            return { ...state, ...action.payload };
        case 'UPDATE_BRICKS_AND_SCORE': {
            const { bricks, scoreToAdd } = action.payload;
            const allBricksDestroyed = bricks.every(b => b.destroyed);
            const newStatus = (allBricksDestroyed && state.gameStatus === 'playing') ? 'level-complete' : state.gameStatus;
            if (newStatus === 'level-complete') {
                playSound('levelComplete');
            }
            return {
                ...state,
                bricks,
                score: state.score + scoreToAdd,
                gameStatus: newStatus,
            };
        }
        case 'INCREASE_SCORE':
            return { ...state, score: state.score + action.payload };
        case 'START_GAME': {
            const initialLevel = 0;
            return {
                ...initialGameState,
                level: initialLevel,
                lives: INITIAL_LIVES,
                score: 0,
                bricks: loadLevel(initialLevel),
                gameStatus: 'level-starting',
            };
        }
        case 'NEXT_LEVEL': {
            const nextLevel = state.level + 1;
            return {
                ...state,
                level: nextLevel,
                bricks: loadLevel(nextLevel),
                gameStatus: 'level-starting',
                isPowerBallActive: false,
                paddleWidth: PADDLE_WIDTH,
                paddleIsLaser: false,
            };
        }
        case 'LOSE_LIFE': {
            const newLives = state.lives - 1;
            if (newLives <= 0) {
                playSound('gameOver');
                return { ...state, lives: 0, gameStatus: 'game-over' };
            }
            return {
                ...state,
                lives: newLives,
                gameStatus: 'playing',
                isPowerBallActive: false,
                paddleWidth: PADDLE_WIDTH,
                paddleIsLaser: false,
            };
        }
        case 'RESET_GAME': {
            return { ...initialGameState, gameStatus: 'start' };
        }
        case 'SET_STATUS':
            return { ...state, gameStatus: action.payload };

        case 'SET_PADDLE_PROPS':
            return { ...state, paddleWidth: action.payload.width ?? state.paddleWidth, paddleIsLaser: action.payload.isLaser ?? state.paddleIsLaser };

        case 'SET_POWER_BALL':
            return { ...state, isPowerBallActive: action.payload };

        default:
            return state;
    }
}

let particleCounter = 0;
let powerUpCounter = 0;
let laserCounter = 0;
let ballCounter = 0;

const createInitialBall = (paddleX: number, paddleWidth: number, moving: boolean): Ball => ({
    id: `ball-${ballCounter++}`,
    position: { x: paddleX + paddleWidth / 2, y: PADDLE_Y - BALL_RADIUS },
    velocity: moving
        ? { x: (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED, y: -INITIAL_BALL_SPEED }
        : { x: 0, y: 0 },
    radius: BALL_RADIUS,
    trail: [],
});

const createInitialPaddle = (): Paddle => ({
    position: { x: (GAME_WIDTH - PADDLE_WIDTH) / 2, y: PADDLE_Y },
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    isLaser: false,
});


export default function Game() {
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
    const { score, level, lives, gameStatus, isPowerBallActive, bricks, paddleWidth, paddleIsLaser } = gameState;

    const gameBoardRef = useRef<HTMLDivElement>(null);

    const dynamicStateRef = useRef<DynamicGameState>({
        paddle: createInitialPaddle(),
        balls: [],
        particles: [],
        powerUps: [],
        lasers: [],
    });

    const gameStateRef = useRef(gameState);

    // This state is used to force a re-render on each animation frame
    const [renderTrigger, setRenderTrigger] = useState(0);

    useEffect(() => {
        gameStateRef.current = gameState;
        if (gameState.gameStatus === 'level-complete') {
            screenShakeRef.current = 20;
        }
    }, [gameState]);

    useEffect(() => {
        const theme = themes[level % themes.length];
        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
    }, [level]);

    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const lastLaserTime = useRef(0);
    const screenShakeRef = useRef(0);
    const lastTimeRef = useRef<number>(performance.now());
    const animationFrameIdRef = useRef<number | undefined>(undefined);

    const createParticles = useCallback((position: Vector, color: 'accent' | 'primary' | 'silver', count: number = PARTICLE_COUNT) => {
        const newParticles: Particle[] = [];
        const now = Date.now();
        for (let i = 0; i < count; i++) {
            const id = `particle-${now}-${particleCounter++}`;
            newParticles.push({
                id: id,
                position: { ...position },
                velocity: {
                    x: (Math.random() - 0.5) * (Math.random() * 8),
                    y: (Math.random() - 0.5) * (Math.random() * 8),
                },
                radius: Math.random() * 3 + 1,
                opacity: 1,
                createdAt: now,
                color,
            });
        }
        dynamicStateRef.current.particles.push(...newParticles);
    }, []);

    const resetLevel = useCallback((isNextLevel: boolean) => {
        const newPaddle = createInitialPaddle();
        newPaddle.width = PADDLE_WIDTH;

        dynamicStateRef.current = {
            paddle: newPaddle,
            balls: [createInitialBall(newPaddle.position.x, newPaddle.width, isNextLevel)],
            powerUps: [],
            lasers: [],
            particles: [],
        };
        screenShakeRef.current = 0;
        if (isNextLevel) {
            dispatch({ type: 'NEXT_LEVEL' });
        }
    }, []);

    const loseLife = useCallback(() => {
        dispatch({ type: 'LOSE_LIFE' });
        const newPaddle = createInitialPaddle();
        newPaddle.width = PADDLE_WIDTH;
        dynamicStateRef.current = {
            paddle: newPaddle,
            balls: [createInitialBall(newPaddle.position.x, PADDLE_WIDTH, false)],
            powerUps: [],
            lasers: [],
            particles: dynamicStateRef.current.particles, // Keep particles from previous frame
        };
    }, []);

    useEffect(() => {
        const gameLoop = (time: number) => {
            animationFrameIdRef.current = requestAnimationFrame(gameLoop);

            const deltaTime = (time - lastTimeRef.current) / 16.67; // Normalize to a 60 FPS baseline
            lastTimeRef.current = time;

            const currentGameState = gameStateRef.current;
            if (currentGameState.gameStatus !== 'playing') {
                if (gameBoardRef.current && screenShakeRef.current > 0) {
                    screenShakeRef.current = 0;
                    gameBoardRef.current.style.transform = 'translate(0, 0)';
                }
                return;
            }

            const dynamicState = dynamicStateRef.current;
            const { paddle, balls, particles, powerUps, lasers } = dynamicState;

            let localBricks = [...currentGameState.bricks];

            // --- Handle Input ---
            if (keysPressed.current['ArrowLeft']) paddle.position.x -= PADDLE_SPEED * deltaTime;
            if (keysPressed.current['ArrowRight']) paddle.position.x += PADDLE_SPEED * deltaTime;

            paddle.position.x = Math.max(0, Math.min(GAME_WIDTH - paddle.width, paddle.position.x));
            paddle.width = currentGameState.paddleWidth;
            paddle.isLaser = currentGameState.paddleIsLaser;

            let ballIsStuck = balls.length === 1 && balls[0].velocity.y === 0;
            if (ballIsStuck) {
                balls[0].position.x = paddle.position.x + paddle.width / 2;
            }

            if (keysPressed.current[' '] && paddle.isLaser) {
                const now = Date.now();
                if (now - lastLaserTime.current > 200) {
                    laserCounter++;
                    lasers.push({ id: `laser-${laserCounter}-1`, position: { x: paddle.position.x + 5, y: paddle.position.y } });
                    lasers.push({ id: `laser-${laserCounter}-2`, position: { x: paddle.position.x + paddle.width - 5, y: paddle.position.y } });
                    lastLaserTime.current = now;
                    playSound('laser');
                }
            }

            // --- Update Particles ---
            const now = Date.now();
            dynamicState.particles = particles.filter(p => {
                if (now - p.createdAt <= PARTICLE_LIFESPAN) {
                    p.position.x += p.velocity.x * deltaTime;
                    p.position.y += p.velocity.y * deltaTime;
                    p.opacity = 1 - (now - p.createdAt) / PARTICLE_LIFESPAN;
                    return true;
                }
                return false;
            });

            // --- Update PowerUps ---
            dynamicState.powerUps = powerUps.filter(p => {
                p.position.y += 1 * deltaTime;
                return p.position.y < GAME_HEIGHT;
            });

            // --- Update Lasers ---
            dynamicState.lasers = lasers.filter(l => {
                l.position.y -= 10 * deltaTime;
                return l.position.y > 0;
            });

            // --- Update Balls ---
            balls.forEach(ball => {
                ball.trail = [...ball.trail, ball.position].slice(-5);

                const speedMultiplier = currentGameState.isPowerBallActive ? POWER_BALL_SPEED_MULTIPLIER : 1;
                ball.position.x += ball.velocity.x * speedMultiplier * deltaTime;
                ball.position.y += ball.velocity.y * speedMultiplier * deltaTime;
            });

            // --- Collision Detection ---

            // PowerUp - Paddle
            const collectedPowerUps: string[] = [];
            powerUps.forEach(p => {
                if (p.position.y + p.height >= paddle.position.y &&
                    p.position.y <= paddle.position.y + paddle.height &&
                    p.position.x + p.width >= paddle.position.x &&
                    p.position.x <= paddle.position.x + paddle.width
                ) {
                    collectedPowerUps.push(p.id);
                    playSound('powerup');
                    screenShakeRef.current = 10;

                    let paddleUpdate: Partial<{ width: number, isLaser: boolean }> = {};

                    switch (p.type) {
                        case 'extend':
                            paddleUpdate.width = Math.min(currentGameState.paddleWidth + 40, 240);
                            break;
                        case 'laser':
                            paddleUpdate.isLaser = true;
                            break;
                        case 'multi-ball':
                            const newSpawnedBalls: Ball[] = [];
                            balls.forEach(existingBall => {
                                for (let i = 0; i < 2; i++) {
                                    ballCounter++;
                                    newSpawnedBalls.push({
                                        ...existingBall,
                                        id: `ball-${ballCounter}`,
                                        velocity: {
                                            x: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
                                            y: -Math.abs(existingBall.velocity.y || INITIAL_BALL_SPEED)
                                        }
                                    });
                                }
                            });
                            balls.push(...newSpawnedBalls);
                            break;
                        case 'power-ball':
                            dispatch({ type: 'SET_POWER_BALL', payload: true });
                            setTimeout(() => dispatch({ type: 'SET_POWER_BALL', payload: false }), 10000); // Power-ball lasts 10s
                            break;
                    }
                    if (Object.keys(paddleUpdate).length > 0) {
                        dispatch({ type: 'SET_PADDLE_PROPS', payload: paddleUpdate });
                    }
                }
            });
            if (collectedPowerUps.length > 0) {
                dynamicState.powerUps = powerUps.filter(p => !collectedPowerUps.includes(p.id));
            }

            for (let i = 0; i < balls.length; i++) {
                const ball = balls[i];

                // Wall collision
                if (ball.position.x - ball.radius <= 0 || ball.position.x + ball.radius >= GAME_WIDTH) {
                    ball.velocity.x *= -1;
                    ball.position.x = Math.max(ball.radius, Math.min(GAME_WIDTH - ball.radius, ball.position.x));
                    createParticles(ball.position, 'primary');
                    playSound('wall');
                }
                if (ball.position.y - ball.radius <= 0) {
                    ball.velocity.y *= -1;
                    ball.position.y = ball.radius;
                    createParticles(ball.position, 'primary');
                    playSound('wall');
                }

                // Paddle collision
                if (
                    ball.velocity.y > 0 &&
                    ball.position.y + ball.radius >= paddle.position.y &&
                    ball.position.y - ball.radius <= paddle.position.y + paddle.height &&
                    ball.position.x + ball.radius >= paddle.position.x &&
                    ball.position.x - ball.radius <= paddle.position.x + paddle.width
                ) {
                    ball.position.y = paddle.position.y - ball.radius;

                    const hitPos = (ball.position.x - (paddle.position.x + paddle.width / 2)) / (paddle.width / 2);
                    const angle = hitPos * (Math.PI / 2.5); // Max angle of 72 degrees
                    const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
                    ball.velocity.x = speed * Math.sin(angle);
                    ball.velocity.y = -speed * Math.cos(angle);

                    // Prevent ball from getting stuck in a horizontal loop
                    if (Math.abs(ball.velocity.y) < 0.2 * speed) {
                        ball.velocity.y = (ball.velocity.y > 0 ? 1 : -1) * 0.2 * speed * (Math.random() * 0.5 + 0.75);
                    }

                    createParticles(ball.position, 'primary', 50);
                    playSound('paddle');
                    screenShakeRef.current = 5;
                }
            }

            let shouldLoseLife = false;
            const previousBallCount = balls.length;
            dynamicState.balls = balls.filter(b => b.position.y - b.radius < GAME_HEIGHT);
            if (dynamicState.balls.length === 0 && previousBallCount > 0) {
                shouldLoseLife = true;
            }

            const hitBrickIds = new Set<string>();
            let scoreIncrease = 0;
            let bricksUpdated = false;

            // Laser-Brick collision
            const remainingLasers = [];
            for (const laser of lasers) {
                let laserHitBrick = false;
                for (const brick of localBricks) {
                    if (brick.destroyed || hitBrickIds.has(brick.id)) continue;
                    if (
                        laser.position.x >= brick.position.x &&
                        laser.position.x <= brick.position.x + brick.width &&
                        laser.position.y <= brick.position.y + brick.height &&
                        laser.position.y >= brick.position.y
                    ) {
                        laserHitBrick = true;
                        hitBrickIds.add(brick.id);
                        break;
                    }
                }
                if (!laserHitBrick) {
                    remainingLasers.push(laser);
                }
            }
            if (lasers.length !== remainingLasers.length) {
                dynamicState.lasers = remainingLasers;
            }

            // Ball-Brick collision
            for (const ball of balls) {
                for (const brick of localBricks) {
                    if (brick.destroyed || hitBrickIds.has(brick.id)) continue;

                    if (
                        ball.position.x + ball.radius > brick.position.x &&
                        ball.position.x - ball.radius < brick.position.x + brick.width &&
                        ball.position.y + ball.radius > brick.position.y &&
                        ball.position.y - ball.radius < brick.position.y + brick.height
                    ) {
                        hitBrickIds.add(brick.id);
                        if (!currentGameState.isPowerBallActive) {
                            const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
                            const prevBallX = ball.position.x - (ball.velocity.x / speed) * (ball.radius);
                            const prevBallY = ball.position.y - (ball.velocity.y / speed) * (ball.radius);

                            const fromTop = prevBallY + ball.radius <= brick.position.y;
                            const fromBottom = prevBallY - ball.radius >= brick.position.y + brick.height;
                            const fromLeft = prevBallX + ball.radius <= brick.position.x;
                            const fromRight = prevBallX - ball.radius >= brick.position.x + brick.width;

                            if (fromTop || fromBottom) {
                                ball.velocity.y *= -1;
                            }
                            if (fromLeft || fromRight) {
                                ball.velocity.x *= -1;
                            }
                        }
                    }
                }
            }

            if (hitBrickIds.size > 0) {
                const updatedBricks = localBricks.map(b => {
                    if (hitBrickIds.has(b.id)) {
                        bricksUpdated = true;
                        screenShakeRef.current = 10;
                        if (b.type === 'silver' && (b.hitsLeft ?? 2) > 1 && !currentGameState.isPowerBallActive) {
                            playSound('brickSilver');
                            createParticles({ x: b.position.x + b.width / 2, y: b.position.y + b.height / 2 }, 'silver', 10);
                            return { ...b, hitsLeft: (b.hitsLeft ?? 2) - 1 };
                        } else {
                            playSound('brick');
                            createParticles({ x: b.position.x + b.width / 2, y: b.position.y + b.height / 2 }, 'accent');
                            scoreIncrease += SCORE_PER_BRICK;

                            if (Math.random() < 0.2) {
                                powerUpCounter++;
                                const powerUpTypes: PowerUp['type'][] = ['extend', 'laser', 'multi-ball', 'power-ball'];
                                const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                                powerUps.push({
                                    id: `powerup-${powerUpCounter}`,
                                    position: { x: b.position.x + b.width / 2 - 15, y: b.position.y + b.height / 2 },
                                    type,
                                    width: 30, height: 15,
                                });
                            }
                            return { ...b, destroyed: true };
                        }
                    }
                    return b;
                });
                if (bricksUpdated) {
                    dispatch({ type: 'UPDATE_BRICKS_AND_SCORE', payload: { bricks: updatedBricks, scoreToAdd: scoreIncrease } });
                }
            }

            if (gameBoardRef.current) {
                if (screenShakeRef.current > 0) {
                    const shakeX = Math.round(Math.random() * screenShakeRef.current - screenShakeRef.current / 2);
                    const shakeY = Math.round(Math.random() * screenShakeRef.current - screenShakeRef.current / 2);
                    gameBoardRef.current.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
                    screenShakeRef.current -= 1;
                } else {
                    gameBoardRef.current.style.transform = 'translate(0, 0)';
                }
            }

            if (shouldLoseLife) {
                playSound('loseLife');
                loseLife();
            }

            // Force a re-render
            setRenderTrigger(r => r + 1);
        };

        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [createParticles, loseLife, resetLevel]);

    useEffect(() => {
        dispatch({ type: 'RESET_GAME' });
    }, []);

    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
        musicGenerator.toggleMute(!isMuted);
    }, [isMuted]);

    const startGame = useCallback(() => {
        musicGenerator.play();
        dispatch({ type: 'START_GAME' });
        const newPaddle = createInitialPaddle();
        newPaddle.width = PADDLE_WIDTH;
        dynamicStateRef.current = {
            paddle: newPaddle,
            balls: [createInitialBall(newPaddle.position.x, PADDLE_WIDTH, false)],
            powerUps: [],
            lasers: [],
            particles: [],
        };
        playSound('start');
        lastTimeRef.current = performance.now();
    }, []);

    const handleNextLevel = useCallback(() => {
        resetLevel(true);
    }, [resetLevel]);

    // Mouse controls
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!gameBoardRef.current || gameStateRef.current.gameStatus !== 'playing') return;
            const boardRect = gameBoardRef.current.getBoundingClientRect();
            const newPaddleX = e.clientX - boardRect.left - dynamicStateRef.current.paddle.width / 2;
            dynamicStateRef.current.paddle.position.x = Math.max(0, Math.min(GAME_WIDTH - dynamicStateRef.current.paddle.width, newPaddleX));
        };

        const handleClick = () => {
            const { balls } = dynamicStateRef.current;
            const currentGameState = gameStateRef.current;
            if (currentGameState.gameStatus === 'playing' && balls.length === 1 && balls[0].velocity.y === 0) {
                balls[0].velocity = { x: (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED, y: -INITIAL_BALL_SPEED };
                playSound('paddle');
            }
        };

        const board = gameBoardRef.current;
        board?.addEventListener('mousemove', handleMouseMove);
        board?.addEventListener('click', handleClick);
        return () => {
            board?.removeEventListener('mousemove', handleMouseMove);
            board?.removeEventListener('click', handleClick);
        }
    }, [gameStatus]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                keysPressed.current[e.key] = true;
            }
            const { balls } = dynamicStateRef.current;
            const currentGameState = gameStateRef.current;
            if (e.key === ' ' && currentGameState.gameStatus === 'playing' && balls.length === 1 && balls[0].velocity.y === 0) {
                balls[0].velocity = { x: (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED, y: -INITIAL_BALL_SPEED };
                playSound('paddle');
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                keysPressed.current[e.key] = false;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            keysPressed.current = {};
        };
    }, []);

    const renderOverlay = () => {
        if (gameStatus === 'start') {
            return (
                <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center rounded-lg z-20">
                    <h2 className="text-5xl font-bold mb-4 text-white animate-pulse" style={{ textShadow: '0 0 15px hsl(var(--primary))' }}>Neon Breakout</h2>
                    <Button onClick={startGame} variant="secondary" size="lg">
                        <Play className="mr-2" /> Start Game
                    </Button>
                </div>
            );
        }
        if (gameStatus === 'level-starting') {
            return (
                <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center rounded-lg z-20 animate-fade-out pointer-events-none" onAnimationEnd={() => dispatch({ type: 'SET_STATUS', payload: 'playing' })}>
                    <h2 className="text-4xl font-bold mb-4" style={{ textShadow: '0 0 10px hsl(var(--accent))' }}>Level {level + 1}</h2>
                </div>
            );
        }
        if (gameStatus === 'level-complete') {
            return (
                <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center rounded-lg z-20">
                    <h2 className="text-4xl font-bold mb-4" style={{ textShadow: '0 0 10px hsl(var(--accent))' }}>Level Complete!</h2>
                    <p className="text-xl mb-4">Your Score: {score}</p>
                    <Button onClick={handleNextLevel} variant="secondary" size="lg">
                        Next Level <ArrowRight className="ml-2" />
                    </Button>
                </div>
            );
        }
        if (gameStatus === 'game-over') {
            return (
                <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center rounded-lg z-20">
                    <h2 className="text-4xl font-bold mb-4 text-destructive" style={{ textShadow: '0 0 10px hsl(var(--destructive))' }}>Game Over</h2>
                    <p className="text-xl mb-4">Final Score: {score}</p>
                    <Button onClick={startGame} variant="secondary" size="lg">
                        <RotateCw className="mr-2" /> Restart
                    </Button>
                </div>
            );
        }
        return null;
    };

    const { paddle, balls, particles, powerUps, lasers } = dynamicStateRef.current;

    return (
        <div
            ref={gameBoardRef}
            className="relative bg-background rounded-lg overflow-hidden cursor-none perspective-grid"
            style={{
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                boxShadow: '0 0 20px hsl(var(--primary)/0.5), 0 0 40px hsl(var(--accent)/0.5), inset 0 0 20px hsl(var(--primary)/0.5)',
                border: '2px solid hsl(var(--accent))',
                transition: 'transform 0.1s linear, box-shadow 0.5s ease-out, border-color 0.5s ease-out',
            }}
        >
            <div className="retro-grid" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

            <HUD score={score} level={level + 1} lives={lives} isMuted={isMuted} onToggleMute={toggleMute} />

            {bricks.map((brick) => (
                <BrickComponent key={brick.id} brick={brick} />
            ))}
            <PaddleComponent paddle={paddle} />
            {balls.map((ball) => (
                <BallComponent key={ball.id} ball={ball} isPowerBall={isPowerBallActive} />
            ))}
            {particles.map((particle) => (
                <ParticleComponent key={particle.id} particle={particle} />
            ))}
            {powerUps.map((powerUp) => (
                <PowerUpComponent key={powerUp.id} powerUp={powerUp} />
            ))}
            {lasers.map((laser) => (
                <LaserComponent key={laser.id} laser={laser} />
            ))}

            {renderOverlay()}
        </div>
    );
}
