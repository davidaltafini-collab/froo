import React from 'react';
import type { GameComponentProps, GameResult } from './types';
import { getDevicePixelRatio } from './canvasScale';

import churrosImg from '@/assets/games/froomerge/tier-0-churros.webp';
import friesImg from '@/assets/games/froomerge/tier-1-fries.webp';
import hotdogImg from '@/assets/games/froomerge/tier-3-hotdog.webp';
import hotdogWrapImg from '@/assets/games/froomerge/tier-4-hotdog-wrap.webp';
import crocantBoxImg from '@/assets/games/froomerge/tier-5-crocant-box.webp';
import chickenSandwichImg from '@/assets/games/froomerge/tier-6-chicken-sandwich.webp';
import donerWrapImg from '@/assets/games/froomerge/tier-7-doner-wrap.webp';
import chickenPaniniImg from '@/assets/games/froomerge/tier-8-chicken-panini.webp';
import sauceImg from '@/assets/games/froomerge/powerup-sauce.webp';
import shakeImg from '@/assets/games/froomerge/powerup-shake.webp';
import dishMediumImg from '@/assets/games/froomerge/paddle-dish-medium.webp';
import dishLargeImg from '@/assets/games/froomerge/paddle-dish-large.webp';

export const BRICK_BREAKER_HIGH_SCORE_KEY = 'frooGamesBrickBreakerHighScore';

const BASE_WIDTH = 320;
const BASE_HEIGHT = 440;

const PADDLE_WIDTH = 64;
const PADDLE_HEIGHT = 12;
const PADDLE_BOTTOM_OFFSET = 28;
const PADDLE_KEY_SPEED = 320;
const PADDLE_WIDE_MULTIPLIER = 1.6;

const BALL_RADIUS = 6;
const BALL_SPEED = 210;

const BRICK_ROWS = 5;
const BRICK_COLS = 7;
const BRICK_GAP = 4;
const BRICK_TOP_OFFSET = 40;
const BRICK_SIDE_MARGIN = 10;

const ROW_POINTS = [50, 40, 30, 20, 10];
const STEEL_COLOR = '#94a3b8';
const REINFORCED_RING = 'rgba(255,255,255,0.85)';

interface HullPoint {
  x: number;
  y: number;
}

type FoodKey = 'hotdog' | 'hotdogWrap' | 'donerWrap';

interface FoodBrickType {
  image: HTMLImageElement;
  hull: HullPoint[]; // centered on the content centroid, in design units at scaleRatio=1
  drawSize: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img;
}

// Same alpha-traced convex hulls used for collision in Froo Merge, uniformly rescaled so
// each item's width fits one brick-grid column (heights differ per item's real proportions).
const FOOD_TYPES: Record<FoodKey, FoodBrickType> = {
  hotdog: {
    image: loadImage(hotdogImg),
    drawSize: 39.53, offsetX: -20.14, offsetY: -20.39, width: 37.06, height: 20.26,
    hull: [
      { x: -19.03, y: -2.85 }, { x: -17.3, y: -7.05 }, { x: -10.75, y: -10.01 }, { x: -4.2, y: -8.9 },
      { x: 7.17, y: -6.31 }, { x: 13.96, y: -3.34 }, { x: 18.04, y: 2.71 }, { x: 15.94, y: 7.9 },
      { x: 11, y: 10.25 }, { x: 3.7, y: 9.14 }, { x: -15.32, y: 2.34 },
    ],
  },
  hotdogWrap: {
    image: loadImage(hotdogWrapImg),
    drawSize: 43.77, offsetX: -21.26, offsetY: -21.13, width: 37.06, height: 14.91,
    hull: [
      { x: -18.25, y: -4.18 }, { x: -14.83, y: -7.73 }, { x: -11.69, y: -7.46 }, { x: -6.76, y: -6.5 },
      { x: 0.76, y: -4.99 }, { x: 6.78, y: -3.76 }, { x: 14.99, y: -1.3 }, { x: 18.82, y: 4.03 },
      { x: 16.63, y: 6.36 }, { x: 8.15, y: 7.18 }, { x: 3.22, y: 6.09 }, { x: -0.74, y: 5.13 },
      { x: -7.17, y: 3.48 }, { x: -15.52, y: 1.02 },
    ],
  },
  donerWrap: {
    image: loadImage(donerWrapImg),
    drawSize: 48.81, offsetX: -23.02, offsetY: -23.93, width: 37.06, height: 18.15,
    hull: [
      { x: -18.75, y: -1.81 }, { x: -17.53, y: -6.39 }, { x: -10.97, y: -8.68 }, { x: 7.79, y: -5.02 },
      { x: 13.13, y: -3.8 }, { x: 18.31, y: -0.75 }, { x: 16.48, y: 5.66 }, { x: 11.6, y: 8.86 },
      { x: 7.79, y: 9.47 }, { x: -1.36, y: 6.73 }, { x: -5.18, y: 5.35 }, { x: -11.43, y: 3.07 },
    ],
  },
};

// Row-to-food mapping, top to bottom — bigger items up top where ROW_POINTS pays out the most.
const ROW_FOOD_KEYS: FoodKey[] = ['donerWrap', 'donerWrap', 'hotdogWrap', 'hotdogWrap', 'hotdog'];

// Different brick layouts cycle in as levels progress so the board doesn't feel static.
const LAYOUT_PATTERNS: ((row: number, col: number) => boolean)[] = [
  () => true, // full grid
  (row, col) => (row + col) % 2 === 0, // checkerboard
  (row, col) => { // diamond: fullest in the middle row, tapering at top/bottom
    const mid = (BRICK_ROWS - 1) / 2;
    const rowDist = Math.abs(row - mid);
    const allowed = Math.round(((BRICK_COLS - 1) / 2) * (1 - rowDist / (mid + 0.5)));
    const centerCol = (BRICK_COLS - 1) / 2;
    return Math.abs(col - centerCol) <= allowed;
  },
  (row, col) => { // funnel: full at top, narrowing toward the bottom
    const centerCol = (BRICK_COLS - 1) / 2;
    return Math.abs(col - centerCol) <= BRICK_COLS / 2 - row * 0.6;
  },
  (row, col) => (row + col) % 2 === 0 || Math.random() < 0.5, // loose scatter, re-rolled per level
];

const STARTING_LIVES = 3;
const MAX_LIVES = 5;
const RESTART_GRACE_MS = 1000;

const WIDE_DURATION_MS = 10000;
const SLOW_DURATION_MS = 8000;
const SLOW_MULTIPLIER = 0.65;
const STICKY_DURATION_MS = 12000;
const SHIELD_DURATION_MS = 15000;
const SHIELD_LINE_OFFSET = 4;
const MEGA_DURATION_MS = 8000;

// The ball gradually speeds up the longer a run lasts, on top of the per-level jump on clear.
const TIME_RAMP_PER_SECOND = 0.008;
const MAX_TIME_RAMP = 1.0;

const POWERUP_FALL_SPEED = 90;
const POWERUP_ICON_RADIUS = 15;
const POWERUP_CATCH_SCORE = 5;

// Power-ups themed as Froo Bistro menu items. The ones below with a real product photo use it
// for the falling capsule; the rest fall back to a plain colored capsule with a text label.
// STILL NEEDED for full art coverage: a sauce/condiment image for SAUCE (sticky), and a
// milkshake/drink image for SHAKE (slow-mo).
type PowerUpType = 'wide' | 'multi' | 'slow' | 'sticky' | 'life' | 'shield' | 'mega';

interface PowerUpIcon {
  image: HTMLImageElement;
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
}

interface PowerUpConfig {
  type: PowerUpType;
  label: string;
  color: string;
  icon: PowerUpIcon;
  /** Effect lifetime, or null for pickups that resolve immediately. */
  durationMs: number | null;
}

/**
 * The tier sprites are square with their own internal padding, so their draw box and
 * centroid offsets were traced per image. The two dedicated power-up sprites are cropped
 * tight to the subject, so they are simply fitted to a common longest edge and centred.
 */
const POWERUP_SPRITE_SIZE = 36;

function fittedIcon(image: HTMLImageElement, naturalWidth: number, naturalHeight: number): PowerUpIcon {
  const scale = POWERUP_SPRITE_SIZE / Math.max(naturalWidth, naturalHeight);
  const drawWidth = naturalWidth * scale;
  const drawHeight = naturalHeight * scale;
  return { image, drawWidth, drawHeight, offsetX: -drawWidth / 2, offsetY: -drawHeight / 2 };
}

function tracedIcon(image: HTMLImageElement, drawSize: number, offsetX: number, offsetY: number): PowerUpIcon {
  return { image, drawWidth: drawSize, drawHeight: drawSize, offsetX, offsetY };
}

const paddleDishMedium = loadImage(dishMediumImg);
const paddleDishLarge = loadImage(dishLargeImg);

const POWER_UP_POOL: PowerUpConfig[] = [
  {
    type: 'wide', label: 'FRIES', color: '#f59e0b', durationMs: WIDE_DURATION_MS,
    icon: tracedIcon(loadImage(friesImg), 42.49, -21.6, -20.51),
  },
  {
    type: 'multi', label: 'COMBO', color: '#0ea5e9', durationMs: null,
    icon: tracedIcon(loadImage(crocantBoxImg), 35.87, -17.72, -17.23),
  },
  {
    type: 'slow', label: 'SHAKE', color: '#a855f7', durationMs: SLOW_DURATION_MS,
    icon: fittedIcon(loadImage(shakeImg), 162, 320),
  },
  {
    type: 'sticky', label: 'SAUCE', color: '#ef4444', durationMs: STICKY_DURATION_MS,
    icon: fittedIcon(loadImage(sauceImg), 320, 316),
  },
  {
    type: 'life', label: 'DESSERT', color: '#ec4899', durationMs: null,
    icon: tracedIcon(loadImage(churrosImg), 37.83, -19.3, -17.96),
  },
  {
    type: 'shield', label: 'PANINI', color: '#0891b2', durationMs: SHIELD_DURATION_MS,
    icon: tracedIcon(loadImage(chickenPaniniImg), 30.89, -15.33, -15.52),
  },
  {
    type: 'mega', label: 'BURGER', color: '#dc2626', durationMs: MEGA_DURATION_MS,
    icon: tracedIcon(loadImage(chickenSandwichImg), 31.71, -16.29, -16.99),
  },
];

function powerUpConfig(type: PowerUpType) {
  return POWER_UP_POOL.find((config) => config.type === type)!;
}

function pickPowerUpType(): PowerUpType {
  const weights: [PowerUpType, number][] = [
    ['wide', 3],
    ['multi', 3],
    ['slow', 3],
    ['sticky', 3],
    ['shield', 2],
    ['mega', 2],
    ['life', 1],
  ];
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of weights) {
    if (roll < weight) return type;
    roll -= weight;
  }
  return 'wide';
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  foodKey: FoodKey;
  hp: number;
  maxHp: number;
  steel: boolean;
  powerUp: PowerUpType | null;
  alive: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  attached: boolean;
  offsetX: number; // offset from paddle center while attached (0 = center spawn, non-zero after a sticky catch)
}

interface FallingPowerUp {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
}

function createBricks(canvasWidth: number, scaleRatio: number, level: number): Brick[] {
  const margin = BRICK_SIDE_MARGIN * scaleRatio;
  const gap = BRICK_GAP * scaleRatio;
  const totalGapWidth = gap * (BRICK_COLS - 1);
  const cellWidth = (canvasWidth - margin * 2 - totalGapWidth) / BRICK_COLS;
  const topOffset = BRICK_TOP_OFFSET * scaleRatio;

  const steelChance = Math.min(0.1, 0.02 + level * 0.01);
  const reinforcedChance = Math.min(0.4, 0.15 + level * 0.03);
  const pattern = LAYOUT_PATTERNS[(level - 1) % LAYOUT_PATTERNS.length];

  const bricks: Brick[] = [];
  const candidates: Brick[] = [];
  let rowY = topOffset;

  for (let row = 0; row < BRICK_ROWS; row++) {
    const foodKey = ROW_FOOD_KEYS[row] ?? 'hotdog';
    const rowHeight = FOOD_TYPES[foodKey].height * scaleRatio;

    for (let col = 0; col < BRICK_COLS; col++) {
      if (!pattern(row, col)) continue;
      const steel = Math.random() < steelChance;
      const reinforced = !steel && Math.random() < reinforcedChance;
      const hp = steel ? Infinity : reinforced ? 2 : 1;
      const brick: Brick = {
        x: margin + col * (cellWidth + gap),
        y: rowY,
        width: cellWidth,
        height: rowHeight,
        row,
        foodKey,
        hp,
        maxHp: hp,
        steel,
        powerUp: null,
        alive: true,
      };
      bricks.push(brick);
      if (!steel) candidates.push(brick);
    }

    rowY += rowHeight + gap;
  }

  const powerUpCount = Math.min(candidates.length, 2 + Math.floor(level / 2));
  const shuffled = candidates.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (let i = 0; i < powerUpCount; i++) {
    shuffled[i].powerUp = pickPowerUpType();
  }

  return bricks;
}

export function BrickBreakerGame({ onGameOver, onHaptic }: GameComponentProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const onGameOverRef = React.useRef(onGameOver);
  const onHapticRef = React.useRef(onHaptic);

  React.useEffect(() => {
    onGameOverRef.current = onGameOver;
    onHapticRef.current = onHaptic;
  }, [onGameOver, onHaptic]);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let scaleRatio = 1;
    // Logical game units. These stay in CSS pixels so physics, layout, and pointer
    // coordinates share one coordinate system; only the backing store is rendered at
    // device resolution (see setScreen).
    let viewWidth = BASE_WIDTH;
    let viewHeight = BASE_HEIGHT;
    let bricks: Brick[] = [];
    let balls: Ball[] = [];
    let fallingPowerUps: FallingPowerUp[] = [];
    let particles: Particle[] = [];
    let scorePopups: ScorePopup[] = [];

    let paddleX = 0;
    let paddleY = 0;
    let ballRadius = BALL_RADIUS;

    let paddleWidthMultiplier = 1;
    let wideUntil: number | null = null;
    let ballSpeedMultiplier = 1;
    let slowUntil: number | null = null;
    let stickyUntil: number | null = null;
    let shieldUntil: number | null = null;
    let megaUntil: number | null = null;
    /** Short icon flourishes played where a pickup was caught, in place of a text callout. */
    let pickupFlourishes: { type: PowerUpType; x: number; y: number; life: number; maxLife: number }[] = [];

    let playElapsedMs = 0;
    let timeSpeedScale = 1;

    let level = 1;
    let lives = STARTING_LIVES;
    let score = 0;
    let gameOver = false;
    let canRestart = false;
    let previousTime: number | null = null;
    let rafId = 0;
    let resizeTimeoutId: number | undefined;
    let restartTimeoutId: number | undefined;
    let destroyed = false;
    let pointerTargetX: number | null = null;

    const keysDown = new Set<string>();

    function getPaddleWidth() {
      return PADDLE_WIDTH * scaleRatio * paddleWidthMultiplier;
    }

    function getScaleRatio() {
      const width = container!.clientWidth || BASE_WIDTH;
      const height = container!.clientHeight || BASE_HEIGHT;
      return Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    }

    function clampPaddle() {
      const pWidth = getPaddleWidth();
      paddleX = Math.min(Math.max(paddleX, 0), viewWidth - pWidth);
    }

    function spawnSingleBallOnPaddle() {
      balls = [
        { x: paddleX + getPaddleWidth() / 2, y: paddleY - ballRadius - 1, vx: 0, vy: 0, attached: true, offsetX: 0 },
      ];
    }

    function setupLevel() {
      bricks = createBricks(viewWidth, scaleRatio, level);
    }

    function setScreen() {
      scaleRatio = getScaleRatio();
      viewWidth = BASE_WIDTH * scaleRatio;
      viewHeight = BASE_HEIGHT * scaleRatio;

      // Separate the CSS box from the backing store so a high-density screen renders at
      // native resolution instead of being upscaled. The context is scaled exactly once
      // here; every other coordinate in this file stays in logical CSS pixels.
      const dpr = getDevicePixelRatio();
      canvas!.style.width = `${viewWidth}px`;
      canvas!.style.height = `${viewHeight}px`;
      canvas!.width = Math.round(viewWidth * dpr);
      canvas!.height = Math.round(viewHeight * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      ballRadius = BALL_RADIUS * scaleRatio;
      paddleY = viewHeight - PADDLE_BOTTOM_OFFSET * scaleRatio;
      paddleX = (viewWidth - getPaddleWidth()) / 2;
      setupLevel();
      spawnSingleBallOnPaddle();
    }

    setScreen();

    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimeoutId);
      resizeTimeoutId = window.setTimeout(setScreen, 300);
    });
    resizeObserver.observe(container);

    function rescaleBalls(factor: number) {
      for (const ball of balls) {
        if (ball.attached) continue;
        ball.vx *= factor;
        ball.vy *= factor;
      }
    }

    function resetPowerUpEffects() {
      paddleWidthMultiplier = 1;
      wideUntil = null;
      ballSpeedMultiplier = 1;
      slowUntil = null;
      stickyUntil = null;
      shieldUntil = null;
      megaUntil = null;
      clampPaddle();
    }

    function activateMulti() {
      const flying = balls.filter((b) => !b.attached);
      if (flying.length === 0) return;
      const newBalls: Ball[] = [];
      for (const ball of flying) {
        const speed = Math.hypot(ball.vx, ball.vy);
        const baseAngle = Math.atan2(ball.vy, ball.vx);
        for (const offset of [-0.45, 0.45]) {
          const angle = baseAngle + offset;
          newBalls.push({
            x: ball.x,
            y: ball.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            attached: false,
            offsetX: 0,
          });
        }
      }
      balls.push(...newBalls);
    }

    function activatePowerUp(type: PowerUpType, now: number) {
      switch (type) {
        case 'wide':
          paddleWidthMultiplier = PADDLE_WIDE_MULTIPLIER;
          wideUntil = now + WIDE_DURATION_MS;
          clampPaddle();
          break;
        case 'slow':
          if (ballSpeedMultiplier === 1) rescaleBalls(SLOW_MULTIPLIER);
          ballSpeedMultiplier = SLOW_MULTIPLIER;
          slowUntil = now + SLOW_DURATION_MS;
          break;
        case 'sticky':
          stickyUntil = now + STICKY_DURATION_MS;
          break;
        case 'life':
          lives = Math.min(MAX_LIVES, lives + 1);
          break;
        case 'multi':
          activateMulti();
          break;
        case 'shield':
          shieldUntil = now + SHIELD_DURATION_MS;
          break;
        case 'mega':
          megaUntil = now + MEGA_DURATION_MS;
          break;
      }
      score += POWERUP_CATCH_SCORE;
      pickupFlourishes.push({
        type,
        x: paddleX + getPaddleWidth() / 2,
        y: paddleY - 16 * scaleRatio,
        life: 620,
        maxLife: 620,
      });
      onHapticRef.current?.('pickup');
    }

    function checkPowerUpExpiry(now: number) {
      if (wideUntil !== null && now >= wideUntil) {
        paddleWidthMultiplier = 1;
        wideUntil = null;
        clampPaddle();
      }
      if (slowUntil !== null && now >= slowUntil) {
        rescaleBalls(1 / ballSpeedMultiplier);
        ballSpeedMultiplier = 1;
        slowUntil = null;
      }
      if (stickyUntil !== null && now >= stickyUntil) {
        stickyUntil = null;
      }
      if (shieldUntil !== null && now >= shieldUntil) {
        shieldUntil = null;
      }
      if (megaUntil !== null && now >= megaUntil) {
        megaUntil = null;
      }
    }

    function updateTimeRamp(frameTimeDelta: number) {
      playElapsedMs += frameTimeDelta;
      const target = 1 + Math.min(MAX_TIME_RAMP, (playElapsedMs / 1000) * TIME_RAMP_PER_SECOND);
      if (target !== timeSpeedScale) {
        rescaleBalls(target / timeSpeedScale);
        timeSpeedScale = target;
      }
    }

    function spawnBrickBurst(x: number, y: number, color: string) {
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (50 + Math.random() * 70) * scaleRatio;
        const life = 350 + Math.random() * 200;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          color,
          size: (1.5 + Math.random() * 2) * scaleRatio,
        });
      }
    }

    function damageBrick(brick: Brick) {
      if (brick.steel) return;
      brick.hp -= 1;
      if (brick.hp > 0) {
        // Reinforced brick survived: a lighter knock than a clean break.
        onHapticRef.current?.('tick');
        return;
      }

      brick.alive = false;
      const gained = ROW_POINTS[brick.row] ?? 10;
      score += gained;
      const cx = brick.x + brick.width / 2;
      const cy = brick.y + brick.height / 2;
      spawnBrickBurst(cx, cy, brick.steel ? STEEL_COLOR : '#16a34a');
      scorePopups.push({ x: cx, y: brick.y, text: `+${gained}`, life: 600, maxLife: 600, color: '#166534' });

      onHapticRef.current?.(megaUntil !== null ? 'strong' : 'impact');

      if (brick.powerUp) {
        fallingPowerUps.push({ x: cx, y: cy, vy: POWERUP_FALL_SPEED * scaleRatio, type: brick.powerUp });
      }
    }

    function closestPointOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
      const abx = bx - ax;
      const aby = by - ay;
      const abLenSq = abx * abx + aby * aby;
      let t = abLenSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / abLenSq;
      t = Math.max(0, Math.min(1, t));
      return { x: ax + abx * t, y: ay + aby * t };
    }

    // Finds the closest point on the brick's real traced silhouette (the same hull used in Froo
    // Merge) to the ball center, so collisions follow the actual food outline, not a bounding box.
    function closestFoodBrickPoint(ball: Ball, brick: Brick) {
      const hull = FOOD_TYPES[brick.foodKey].hull;
      const cx = brick.x + brick.width / 2;
      const cy = brick.y + brick.height / 2;
      const n = hull.length;

      let minDistSq = Infinity;
      let closestX = cx;
      let closestY = cy;

      for (let i = 0; i < n; i++) {
        const a = hull[i];
        const b = hull[(i + 1) % n];
        const ax = cx + a.x * scaleRatio;
        const ay = cy + a.y * scaleRatio;
        const bx = cx + b.x * scaleRatio;
        const by = cy + b.y * scaleRatio;
        const cp = closestPointOnSegment(ball.x, ball.y, ax, ay, bx, by);
        const dx = ball.x - cp.x;
        const dy = ball.y - cp.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestX = cp.x;
          closestY = cp.y;
        }
      }

      return { distSq: minDistSq, x: closestX, y: closestY };
    }

    function isTouchingFoodBrick(ball: Ball, brick: Brick) {
      return closestFoodBrickPoint(ball, brick).distSq <= ballRadius * ballRadius;
    }

    function reflectOffFoodBrick(ball: Ball, brick: Brick) {
      const closest = closestFoodBrickPoint(ball, brick);
      if (closest.distSq > ballRadius * ballRadius) return false;

      const dist = Math.sqrt(closest.distSq) || 0.0001;
      const nx = (ball.x - closest.x) / dist;
      const ny = (ball.y - closest.y) / dist;

      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        ball.vx -= 2 * dot * nx;
        ball.vy -= 2 * dot * ny;
      }

      const overlap = ballRadius - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      return true;
    }

    function handlePaddleCollision(ball: Ball) {
      if (ball.vy <= 0) return;
      const pWidth = getPaddleWidth();
      const paddleHeight = PADDLE_HEIGHT * scaleRatio;
      const closestX = Math.min(Math.max(ball.x, paddleX), paddleX + pWidth);
      const closestY = Math.min(Math.max(ball.y, paddleY), paddleY + paddleHeight);
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      if (dx * dx + dy * dy > ballRadius * ballRadius) return;

      const alreadyAttached = balls.some((b) => b.attached);
      if (stickyUntil !== null && !alreadyAttached) {
        const half = pWidth / 2 - ballRadius;
        ball.offsetX = Math.min(half, Math.max(-half, ball.x - (paddleX + pWidth / 2)));
        ball.attached = true;
        ball.vx = 0;
        ball.vy = 0;
        ball.x = paddleX + pWidth / 2 + ball.offsetX;
        ball.y = paddleY - ballRadius - 1;
        onHapticRef.current?.('impact');
        return;
      }

      const overlapX = ballRadius - Math.abs(dx);
      const overlapY = ballRadius - Math.abs(dy);
      if (overlapX < overlapY) {
        ball.vx = -ball.vx;
        ball.x += dx > 0 ? overlapX : -overlapX;
      } else {
        ball.vy = -ball.vy;
        ball.y += dy > 0 ? overlapY : -overlapY;
      }

      const hitPos = (ball.x - (paddleX + pWidth / 2)) / (pWidth / 2);
      const speed = Math.hypot(ball.vx, ball.vy);
      const angle = -Math.PI / 2 + Math.max(-1, Math.min(1, hitPos)) * (Math.PI / 3);
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
      onHapticRef.current?.('tick');
    }

    function launchAttachedBalls() {
      const speed = BALL_SPEED * scaleRatio * ballSpeedMultiplier * timeSpeedScale;
      const pWidth = getPaddleWidth();
      for (const ball of balls) {
        if (!ball.attached) continue;
        ball.attached = false;
        const hitPos = (ball.x - (paddleX + pWidth / 2)) / (pWidth / 2);
        const angle = -Math.PI / 2 + Math.max(-1, Math.min(1, hitPos)) * (Math.PI / 3);
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
      }
    }

    function setupGameOverRestart() {
      restartTimeoutId = window.setTimeout(() => {
        if (!destroyed) canRestart = true;
      }, RESTART_GRACE_MS);
    }

    function triggerGameOver() {
      gameOver = true;
      const finalScore = Math.floor(score);
      const previousHighScore = Number(localStorage.getItem(BRICK_BREAKER_HIGH_SCORE_KEY)) || 0;
      const isNewHighScore = finalScore > previousHighScore;
      if (isNewHighScore) {
        localStorage.setItem(BRICK_BREAKER_HIGH_SCORE_KEY, String(finalScore));
      }
      const result: GameResult = {
        score: finalScore,
        highScore: isNewHighScore ? finalScore : previousHighScore,
        isNewHighScore,
      };
      onHapticRef.current?.('fail');
      onGameOverRef.current?.(result);
      setupGameOverRestart();
    }

    function loseLife() {
      lives -= 1;
      if (lives <= 0) {
        triggerGameOver();
      } else {
        onHapticRef.current?.('fail');
        resetPowerUpEffects();
        spawnSingleBallOnPaddle();
      }
    }

    function resetGame() {
      gameOver = false;
      canRestart = false;
      score = 0;
      lives = STARTING_LIVES;
      level = 1;
      playElapsedMs = 0;
      timeSpeedScale = 1;
      pickupFlourishes = [];
      resetPowerUpEffects();
      fallingPowerUps = [];
      particles = [];
      scorePopups = [];
      setupLevel();
      paddleX = (viewWidth - getPaddleWidth()) / 2;
      spawnSingleBallOnPaddle();
    }

    function handlePointerMove(event: PointerEvent) {
      if (gameOver) return;
      const rect = canvas!.getBoundingClientRect();
      pointerTargetX = event.clientX - rect.left;
    }

    function handlePointerDown() {
      if (gameOver) {
        if (canRestart) resetGame();
        return;
      }
      if (balls.some((ball) => ball.attached)) onHapticRef.current?.('tick');
      launchAttachedBalls();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        keysDown.add(event.code);
      } else if (event.code === 'Space') {
        event.preventDefault();
        if (gameOver) {
          if (canRestart) resetGame();
        } else {
          launchAttachedBalls();
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      keysDown.delete(event.code);
    }

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keyup', handleKeyUp);
    container.focus();

    function updatePaddle(dt: number) {
      if (pointerTargetX !== null) {
        paddleX = pointerTargetX - getPaddleWidth() / 2;
        pointerTargetX = null;
      }
      if (keysDown.has('ArrowLeft')) paddleX -= PADDLE_KEY_SPEED * scaleRatio * dt;
      if (keysDown.has('ArrowRight')) paddleX += PADDLE_KEY_SPEED * scaleRatio * dt;
      clampPaddle();
    }

    function updateSingleBall(ball: Ball, dt: number) {
      if (ball.attached) {
        ball.x = paddleX + getPaddleWidth() / 2 + ball.offsetX;
        ball.y = paddleY - ballRadius - 1;
        return;
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x - ballRadius < 0) {
        ball.x = ballRadius;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + ballRadius > viewWidth) {
        ball.x = viewWidth - ballRadius;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - ballRadius < 0) {
        ball.y = ballRadius;
        ball.vy = Math.abs(ball.vy);
      }

      handlePaddleCollision(ball);

      // Shield: catches anything that slipped past the paddle instead of letting it fall through.
      if (shieldUntil !== null && ball.vy > 0) {
        const shieldY = viewHeight - SHIELD_LINE_OFFSET * scaleRatio;
        if (ball.y + ballRadius >= shieldY) {
          ball.y = shieldY - ballRadius;
          ball.vy = -Math.abs(ball.vy);
          onHapticRef.current?.('impact');
        }
      }

      for (const brick of bricks) {
        if (!brick.alive) continue;
        if (megaUntil !== null && !brick.steel) {
          // Power ball: plow straight through without bouncing off, damaging whatever it touches.
          if (isTouchingFoodBrick(ball, brick)) damageBrick(brick);
          continue;
        }
        if (reflectOffFoodBrick(ball, brick)) {
          damageBrick(brick);
          break;
        }
      }
    }

    function updateBalls(dt: number) {
      for (const ball of balls) updateSingleBall(ball, dt);

      balls = balls.filter((ball) => ball.attached || ball.y - ballRadius <= viewHeight);
      if (balls.length === 0) {
        loseLife();
      }

      if (bricks.every((b) => b.steel || !b.alive)) {
        level += 1;
        onHapticRef.current?.('levelUp');
        const speedBoost = 1 + Math.min(0.5, level * 0.05);
        setupLevel();
        for (const ball of balls) {
          if (ball.attached) continue;
          const currentSpeed = Math.hypot(ball.vx, ball.vy) * speedBoost;
          const currentAngle = Math.atan2(ball.vy, ball.vx);
          ball.vx = Math.cos(currentAngle) * currentSpeed;
          ball.vy = Math.sin(currentAngle) * currentSpeed;
        }
      }
    }

    function updateFallingPowerUps(dt: number, now: number) {
      const pWidth = getPaddleWidth();
      const paddleHeight = PADDLE_HEIGHT * scaleRatio;
      const radius = POWERUP_ICON_RADIUS * scaleRatio;
      const remaining: FallingPowerUp[] = [];
      for (const p of fallingPowerUps) {
        p.y += p.vy * dt;
        const overlapsX = p.x + radius > paddleX && p.x - radius < paddleX + pWidth;
        const overlapsY = p.y + radius > paddleY && p.y - radius < paddleY + paddleHeight;
        if (overlapsX && overlapsY) {
          activatePowerUp(p.type, now);
          continue;
        }
        if (p.y - radius > viewHeight) continue;
        remaining.push(p);
      }
      fallingPowerUps = remaining;
    }

    function updateEffects(frameTimeDelta: number) {
      const dt = frameTimeDelta / 1000;
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * scaleRatio * dt;
        p.life -= frameTimeDelta;
      }
      particles = particles.filter((p) => p.life > 0);

      for (const p of scorePopups) {
        p.y -= 40 * scaleRatio * dt;
        p.life -= frameTimeDelta;
      }
      scorePopups = scorePopups.filter((p) => p.life > 0);

      for (const flourish of pickupFlourishes) flourish.life -= frameTimeDelta;
      pickupFlourishes = pickupFlourishes.filter((flourish) => flourish.life > 0);
    }

    function clearScreen() {
      ctx!.fillStyle = '#f0fdf4';
      ctx!.fillRect(0, 0, viewWidth, viewHeight);
    }

    function traceHullPath(hull: HullPoint[]) {
      ctx!.beginPath();
      hull.forEach((p, i) => {
        const px = p.x * scaleRatio;
        const py = p.y * scaleRatio;
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      });
      ctx!.closePath();
    }

    function drawBricks() {
      for (const brick of bricks) {
        if (!brick.alive) continue;
        const food = FOOD_TYPES[brick.foodKey];
        const cx = brick.x + brick.width / 2;
        const cy = brick.y + brick.height / 2;

        ctx!.save();
        ctx!.translate(cx, cy);

        traceHullPath(food.hull);
        ctx!.clip();

        if (brick.steel) {
          ctx!.fillStyle = STEEL_COLOR;
          ctx!.fillRect(-food.width * scaleRatio, -food.height * scaleRatio, food.width * scaleRatio * 2, food.height * scaleRatio * 2);
          ctx!.fillStyle = 'rgba(255,255,255,0.35)';
          ctx!.fillRect(-food.width * scaleRatio / 2, -food.height * scaleRatio, food.width * scaleRatio * 0.35, food.height * scaleRatio * 2);
        } else if (food.image.complete && food.image.naturalWidth > 0) {
          ctx!.drawImage(
            food.image,
            food.offsetX * scaleRatio,
            food.offsetY * scaleRatio,
            food.drawSize * scaleRatio,
            food.drawSize * scaleRatio,
          );
          if (brick.hp < brick.maxHp) {
            ctx!.fillStyle = 'rgba(15,23,42,0.3)';
            ctx!.fillRect(-food.width * scaleRatio, -food.height * scaleRatio, food.width * scaleRatio * 2, food.height * scaleRatio * 2);
          }
        }

        ctx!.restore();

        ctx!.save();
        ctx!.translate(cx, cy);
        traceHullPath(food.hull);
        ctx!.lineWidth = Math.max(1, scaleRatio);
        ctx!.strokeStyle = brick.steel ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.15)';
        ctx!.stroke();
        if (!brick.steel && brick.maxHp > 1 && brick.hp === brick.maxHp) {
          ctx!.lineWidth = Math.max(1.5, 2 * scaleRatio);
          ctx!.strokeStyle = REINFORCED_RING;
          ctx!.stroke();
        }
        ctx!.restore();
      }
    }

    function drawPaddle() {
      const pWidth = getPaddleWidth();
      // The tray swaps to the large size while FRIES is active, matching the wider hit area.
      const dish = paddleWidthMultiplier > 1 ? paddleDishLarge : paddleDishMedium;

      if (dish.complete && dish.naturalWidth > 0) {
        // The drawn width is always the collision width so what the player aims at is what
        // the ball bounces off. Its top rim sits on the bounce line and the body hangs into
        // the space below, clamped so the tray never runs off the bottom edge.
        const available = viewHeight - paddleY;
        const height = Math.min(pWidth * (dish.naturalHeight / dish.naturalWidth), available);
        ctx!.save();
        ctx!.shadowColor = 'rgba(15,23,42,0.22)';
        ctx!.shadowBlur = 5 * scaleRatio;
        ctx!.shadowOffsetY = 2 * scaleRatio;
        ctx!.drawImage(dish, paddleX, paddleY, pWidth, height);
        ctx!.restore();
        return;
      }

      const paddleHeight = PADDLE_HEIGHT * scaleRatio;
      const radius = Math.min(6 * scaleRatio, paddleHeight / 2);
      ctx!.fillStyle = '#15803d';
      ctx!.beginPath();
      ctx!.roundRect(paddleX, paddleY, pWidth, paddleHeight, radius);
      ctx!.fill();
    }

    function drawBalls() {
      for (const ball of balls) {
        if (megaUntil !== null) {
          ctx!.save();
          ctx!.globalAlpha = 0.35;
          ctx!.fillStyle = '#facc15';
          ctx!.beginPath();
          ctx!.arc(ball.x, ball.y, ballRadius * 1.8, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        }

        ctx!.fillStyle = '#f97316';
        ctx!.beginPath();
        ctx!.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.strokeStyle = '#7c2d12';
        ctx!.lineWidth = Math.max(1, scaleRatio);
        ctx!.stroke();

        ctx!.fillStyle = 'rgba(255,255,255,0.8)';
        ctx!.beginPath();
        ctx!.arc(ball.x - ballRadius * 0.32, ball.y - ballRadius * 0.32, ballRadius * 0.35, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    /** Draws a power-up sprite centred on (0,0) in the current transform. */
    function drawPowerUpSprite(icon: PowerUpIcon, scale: number) {
      if (!icon.image.complete || icon.image.naturalWidth === 0) return false;
      ctx!.drawImage(
        icon.image,
        icon.offsetX * scale,
        icon.offsetY * scale,
        icon.drawWidth * scale,
        icon.drawHeight * scale,
      );
      return true;
    }

    function drawFallingPowerUps() {
      for (const p of fallingPowerUps) {
        const config = powerUpConfig(p.type);

        ctx!.save();
        ctx!.translate(p.x, p.y);
        // The product shot carries the whole identity — no capsule, no ring. A soft drop
        // shadow is all that separates it from the playfield.
        ctx!.shadowColor = 'rgba(15,23,42,0.28)';
        ctx!.shadowBlur = 6 * scaleRatio;
        ctx!.shadowOffsetY = 2 * scaleRatio;
        if (!drawPowerUpSprite(config.icon, scaleRatio)) {
          // Only reachable in the frames before the sprite has decoded.
          const radius = POWERUP_ICON_RADIUS * scaleRatio;
          ctx!.fillStyle = config.color;
          ctx!.beginPath();
          ctx!.arc(0, 0, radius, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }
    }

    function drawParticles() {
      for (const p of particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawScorePopups() {
      const fontSize = Math.max(10, 13 * scaleRatio);
      for (const p of scorePopups) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.font = `bold ${fontSize}px Verdana, sans-serif`;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText(p.text, p.x, p.y);
        ctx!.restore();
      }
    }

    function drawHud(now: number) {
      const highScore = Number(localStorage.getItem(BRICK_BREAKER_HIGH_SCORE_KEY)) || 0;
      const fontSize = Math.max(11, 16 * scaleRatio);
      const margin = Math.max(8, 12 * scaleRatio);

      ctx!.font = `bold ${fontSize}px Verdana, sans-serif`;
      ctx!.fillStyle = '#166534';
      ctx!.textAlign = 'left';
      ctx!.textBaseline = 'top';
      ctx!.fillText(`SCORE ${Math.floor(score)}`, margin, margin);

      ctx!.textAlign = 'right';
      ctx!.fillText(`HI ${highScore}`, viewWidth - margin, margin);

      const dotRadius = Math.max(3, 4 * scaleRatio);
      const dotGap = dotRadius * 2.5;
      const dotsY = margin + fontSize + dotRadius + 6 * scaleRatio;
      for (let i = 0; i < lives; i++) {
        ctx!.beginPath();
        ctx!.arc(margin + dotRadius + i * dotGap, dotsY, dotRadius, 0, Math.PI * 2);
        ctx!.fillStyle = '#16a34a';
        ctx!.fill();
      }

      drawActiveEffects(now, margin, dotsY + dotRadius + 10 * scaleRatio);
    }

    /**
     * One dial per running effect: the item itself, wrapped in a ring that drains clockwise
     * as its time expires. This replaces the stack of labelled countdown pills — the art
     * carries the identity and the arc carries the timer, so nothing has to be read.
     */
    function drawActiveEffects(now: number, left: number, top: number) {
      const active: { type: PowerUpType; remaining: number }[] = [];
      if (wideUntil !== null) active.push({ type: 'wide', remaining: wideUntil - now });
      if (slowUntil !== null) active.push({ type: 'slow', remaining: slowUntil - now });
      if (stickyUntil !== null) active.push({ type: 'sticky', remaining: stickyUntil - now });
      if (shieldUntil !== null) active.push({ type: 'shield', remaining: shieldUntil - now });
      if (megaUntil !== null) active.push({ type: 'mega', remaining: megaUntil - now });
      if (active.length === 0) return;

      const radius = 11 * scaleRatio;
      const ringWidth = Math.max(1.5, 2.2 * scaleRatio);
      const step = radius * 2 + 7 * scaleRatio;

      active.forEach((effect, index) => {
        const config = powerUpConfig(effect.type);
        const total = config.durationMs ?? 1;
        const fraction = Math.max(0, Math.min(1, effect.remaining / total));
        const cx = left + radius + index * step;
        const cy = top + radius;

        ctx!.save();
        ctx!.translate(cx, cy);

        // Fade the whole dial out over the last second so it leaves quietly.
        ctx!.globalAlpha = Math.min(1, effect.remaining / 900);

        ctx!.beginPath();
        ctx!.arc(0, 0, radius, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(255,255,255,0.92)';
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(0, 0, radius, 0, Math.PI * 2);
        ctx!.lineWidth = ringWidth;
        ctx!.strokeStyle = 'rgba(15,23,42,0.08)';
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
        ctx!.lineWidth = ringWidth;
        ctx!.lineCap = 'round';
        ctx!.strokeStyle = config.color;
        ctx!.stroke();

        // Fit the sprite inside the ring rather than at its falling size.
        const inner = (radius - ringWidth) * 2 * 0.82;
        const iconScale = inner / Math.max(config.icon.drawWidth, config.icon.drawHeight);
        drawPowerUpSprite(config.icon, iconScale);

        ctx!.restore();
      });
    }

    function drawMessage() {
      if (gameOver) {
        ctx!.fillStyle = 'rgba(255,255,255,0.7)';
        ctx!.fillRect(0, 0, viewWidth, viewHeight);

        const fontSize = Math.max(16, 26 * scaleRatio);
        ctx!.font = `bold ${fontSize}px Verdana, sans-serif`;
        ctx!.fillStyle = '#475569';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText('GAME OVER', viewWidth / 2, viewHeight / 2 - fontSize);

        const subFontSize = Math.max(10, 13 * scaleRatio);
        ctx!.font = `${subFontSize}px Verdana, sans-serif`;
        ctx!.fillStyle = '#94a3b8';
        ctx!.fillText(
          canRestart ? 'Tap or press Space to play again' : `Score: ${Math.floor(score)}`,
          viewWidth / 2,
          viewHeight / 2,
        );
      } else if (balls.some((b) => b.attached)) {
        const fontSize = Math.max(11, 14 * scaleRatio);
        ctx!.font = `${fontSize}px Verdana, sans-serif`;
        ctx!.fillStyle = '#94a3b8';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText('Tap or press Space to launch', viewWidth / 2, viewHeight / 2);
      }
    }

    /** The caught item lifts off the tray and dissolves — the pickup's whole announcement. */
    function drawPickupFlourishes() {
      for (const flourish of pickupFlourishes) {
        const progress = 1 - flourish.life / flourish.maxLife;
        const config = powerUpConfig(flourish.type);

        ctx!.save();
        ctx!.globalAlpha = Math.max(0, 1 - progress * progress);
        ctx!.translate(flourish.x, flourish.y - progress * 20 * scaleRatio);
        drawPowerUpSprite(config.icon, scaleRatio * (0.75 + progress * 0.55));
        ctx!.restore();
      }
    }

    function draw(now: number) {
      clearScreen();
      drawBricks();
      drawFallingPowerUps();
      drawPaddle();
      drawBalls();
      drawParticles();
      drawScorePopups();
      drawPickupFlourishes();
      drawHud(now);
      drawMessage();
    }

    function gameLoop(currentTime: number) {
      if (previousTime === null) {
        previousTime = currentTime;
        rafId = requestAnimationFrame(gameLoop);
        return;
      }
      const frameTimeDelta = Math.min(currentTime - previousTime, 33);
      previousTime = currentTime;
      const dt = frameTimeDelta / 1000;

      updateEffects(frameTimeDelta);

      if (!gameOver) {
        updatePaddle(dt);
        updateTimeRamp(frameTimeDelta);
        checkPowerUpExpiry(currentTime);
        updateFallingPowerUps(dt, currentTime);
        updateBalls(dt);
      }

      draw(currentTime);
      rafId = requestAnimationFrame(gameLoop);
    }

    rafId = requestAnimationFrame(gameLoop);

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.clearTimeout(resizeTimeoutId);
      window.clearTimeout(restartTimeoutId);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="w-full h-full outline-none select-none touch-none cursor-pointer flex items-center justify-center"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
