import React from 'react';
import Matter from 'matter-js';
import type { GameComponentProps, GameResult } from './types';
import { getDevicePixelRatio } from './canvasScale';

import churrosImg from '@/assets/games/froomerge/tier-0-churros.webp';
import friesImg from '@/assets/games/froomerge/tier-1-fries.webp';
import tendersImg from '@/assets/games/froomerge/tier-2-tenders.webp';
import hotdogImg from '@/assets/games/froomerge/tier-3-hotdog.webp';
import hotdogWrapImg from '@/assets/games/froomerge/tier-4-hotdog-wrap.webp';
import crocantBoxImg from '@/assets/games/froomerge/tier-5-crocant-box.webp';
import chickenSandwichImg from '@/assets/games/froomerge/tier-6-chicken-sandwich.webp';
import donerWrapImg from '@/assets/games/froomerge/tier-7-doner-wrap.webp';
import chickenPaniniImg from '@/assets/games/froomerge/tier-8-chicken-panini.webp';
import flatbreadSubImg from '@/assets/games/froomerge/tier-9-flatbread-sub.webp';

const { Engine, World, Bodies, Body, Composite, Events, Vertices } = Matter;

export const FRUIT_MERGE_HIGH_SCORE_KEY = 'frooGamesFruitMergeHighScore';

interface HullPoint {
  x: number;
  y: number;
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
}

interface Tier {
  // Collision + sizing are driven by a convex hull traced from each image's alpha
  // channel (see scripts used to generate this data) instead of a plain circle,
  // so pieces collide roughly along their real silhouette rather than a bounding disc.
  boundRadius: number; // farthest hull point from the content centroid — used for wall/line checks
  hull: HullPoint[]; // convex hull, centered on the content centroid, in tier-radius units
  drawSize: number; // width/height to draw the full source image at, same unit space
  offsetX: number; // top-left draw offset from the content centroid, same unit space
  offsetY: number;
  ringColor: string;
  points: number;
  image: HTMLImageElement;
}

function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img;
}

// Smallest -> largest: a snack/side progressively merges up into bigger Froo Bistro menu items.
// Hull/size data traced from each image's alpha channel at a 320x320 source resolution.
const TIERS: Tier[] = [
  {
    boundRadius: 14, drawSize: 35.31, offsetX: -18.01, offsetY: -16.76,
    ringColor: '#f87171', points: 1, image: loadImage(churrosImg),
    hull: [
      { x: -9.07, y: -9.92 }, { x: -8.18, y: -10.8 }, { x: -2.89, y: -12.79 }, { x: 2.85, y: -13.12 },
      { x: 9.14, y: -8.48 }, { x: 8.48, y: -2.19 }, { x: 4.51, y: 13.25 }, { x: 4.4, y: 13.25 },
      { x: -4.65, y: 12.92 }, { x: -8.52, y: -2.53 },
    ],
  },
  {
    boundRadius: 19, drawSize: 53.82, offsetX: -27.36, offsetY: -25.98,
    ringColor: '#fb923c', points: 3, image: loadImage(friesImg),
    hull: [
      { x: -14.74, y: -9.16 }, { x: -11.55, y: -14.54 }, { x: -4.82, y: -16.9 }, { x: 2.91, y: -16.9 },
      { x: 6.78, y: -15.89 }, { x: 13.51, y: -10 }, { x: 14.35, y: -5.96 }, { x: 3.92, y: 18.59 },
      { x: -1.29, y: 18.42 }, { x: -6.67, y: 16.74 },
    ],
  },
  {
    boundRadius: 25, drawSize: 65.25, offsetX: -34.01, offsetY: -32.69,
    ringColor: '#facc15', points: 6, image: loadImage(tendersImg),
    hull: [
      { x: -19.13, y: -14.54 }, { x: -18.52, y: -16.17 }, { x: -9.55, y: -23.11 }, { x: 5.34, y: -22.09 },
      { x: 13.9, y: -18.82 }, { x: 20.63, y: -11.08 }, { x: 11.46, y: 19.1 }, { x: 5.34, y: 24.4 },
      { x: 1.26, y: 23.79 }, { x: -11.59, y: 21.14 },
    ],
  },
  {
    boundRadius: 32, drawSize: 65.76, offsetX: -33.5, offsetY: -33.91,
    ringColor: '#a3e635', points: 10, image: loadImage(hotdogImg),
    hull: [
      { x: -31.65, y: -4.74 }, { x: -28.77, y: -11.72 }, { x: -17.88, y: -16.65 }, { x: -6.99, y: -14.8 },
      { x: 11.92, y: -10.49 }, { x: 23.22, y: -5.56 }, { x: 30, y: 4.51 }, { x: 26.51, y: 13.14 },
      { x: 18.29, y: 17.05 }, { x: 6.16, y: 15.2 }, { x: -25.48, y: 3.9 },
    ],
  },
  {
    boundRadius: 40, drawSize: 90.98, offsetX: -44.19, offsetY: -43.93,
    ringColor: '#4ade80', points: 15, image: loadImage(hotdogWrapImg),
    hull: [
      { x: -37.93, y: -8.68 }, { x: -30.83, y: -16.07 }, { x: -24.29, y: -15.5 }, { x: -14.05, y: -13.51 },
      { x: 1.58, y: -10.38 }, { x: 14.09, y: -7.82 }, { x: 31.15, y: -2.71 }, { x: 39.11, y: 8.38 },
      { x: 34.56, y: 13.21 }, { x: 16.94, y: 14.92 }, { x: 6.7, y: 12.65 }, { x: -1.54, y: 10.66 },
      { x: -14.9, y: 7.24 }, { x: -32.25, y: 2.13 },
    ],
  },
  {
    boundRadius: 49, drawSize: 117.17, offsetX: -57.89, offsetY: -56.29,
    ringColor: '#2dd4bf', points: 21, image: loadImage(crocantBoxImg),
    hull: [
      { x: -45.8, y: -11.62 }, { x: -41.41, y: -22.6 }, { x: -23.1, y: -37.98 }, { x: -10.29, y: -38.71 },
      { x: 14.61, y: -37.98 }, { x: 37.32, y: -31.76 }, { x: 43.54, y: -16.01 }, { x: 42.81, y: -6.49 },
      { x: 28.16, y: 33.05 }, { x: 8.75, y: 43.31 }, { x: -34.09, y: 27.56 }, { x: -35.18, y: 24.26 },
    ],
  },
  {
    boundRadius: 59, drawSize: 124.72, offsetX: -64.07, offsetY: -66.82,
    ringColor: '#38bdf8', points: 28, image: loadImage(chickenSandwichImg),
    hull: [
      { x: -59, y: -0.17 }, { x: -57.44, y: -3.68 }, { x: -32.89, y: -31.35 }, { x: -13.01, y: -34.86 },
      { x: 7.65, y: -34.08 }, { x: 27.53, y: -29.02 }, { x: 47.41, y: -17.32 }, { x: 51.69, y: -7.19 },
      { x: 50.91, y: 19.32 }, { x: 31.82, y: 33.74 }, { x: 11.55, y: 34.13 }, { x: 4.92, y: 33.35 },
      { x: -13.79, y: 29.45 }, { x: -49.65, y: 19.7 },
    ],
  },
  {
    boundRadius: 70, drawSize: 181.36, offsetX: -85.54, offsetY: -88.92,
    ringColor: '#818cf8', points: 36, image: loadImage(donerWrapImg),
    hull: [
      { x: -69.67, y: -6.74 }, { x: -65.14, y: -23.75 }, { x: -40.77, y: -32.25 }, { x: 28.94, y: -18.64 },
      { x: 48.78, y: -14.11 }, { x: 68.05, y: -2.78 }, { x: 61.25, y: 21.03 }, { x: 43.11, y: 32.93 },
      { x: 28.94, y: 35.2 }, { x: -5.06, y: 25 }, { x: -19.23, y: 19.89 }, { x: -42.47, y: 11.39 },
    ],
  },
  {
    boundRadius: 82, drawSize: 168.88, offsetX: -83.79, offsetY: -84.84,
    ringColor: '#c084fc', points: 45, image: loadImage(chickenPaniniImg),
    hull: [
      { x: -81.68, y: -7.26 }, { x: -68.48, y: -27.31 }, { x: -43.68, y: -32.06 }, { x: -16.24, y: -28.9 },
      { x: 8.04, y: -25.2 }, { x: 37.07, y: -19.92 }, { x: 57.12, y: -14.65 }, { x: 76.12, y: -1.45 },
      { x: 67.15, y: 27.57 }, { x: 39.7, y: 34.43 }, { x: 19.65, y: 30.74 }, { x: -9.38, y: 24.41 },
      { x: -26.26, y: 20.19 }, { x: -63.73, y: 10.16 },
    ],
  },
  {
    boundRadius: 95, drawSize: 211.97, offsetX: -99.29, offsetY: -103.87,
    ringColor: '#f472b6', points: 55, image: loadImage(flatbreadSubImg),
    hull: [
      { x: -93.99, y: -13.78 }, { x: -74.79, y: -36.97 }, { x: -64.19, y: -40.28 }, { x: -42.33, y: -37.63 },
      { x: 27.89, y: -22.39 }, { x: 68.29, y: -10.47 }, { x: 92.14, y: 17.35 }, { x: 75.58, y: 40.53 },
      { x: 51.73, y: 39.87 }, { x: -72.8, y: 8.08 },
    ],
  },
];

const SPAWNABLE_TIERS = 5;
const BASE_WIDTH = 320;
const BASE_HEIGHT = 440;
const WALL_THICKNESS = 24;
const DROP_COOLDOWN_MS = 350;
const POP_DURATION_MS = 260;
const DANGER_LINE_RATIO = 0.2;
const GAME_OVER_GRACE_MS = 1200;
const SPAWN_GRACE_MS = 500;

function randomSpawnTier() {
  return Math.floor(Math.random() * SPAWNABLE_TIERS);
}

export function FruitMergeGame({ onGameOver, onHaptic }: GameComponentProps) {
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

    let engine = Engine.create();
    let scaleRatio = 1;
    // Logical game units. These stay in CSS pixels so Matter's world, the drawing code, and
    // pointer coordinates share one coordinate system; only the backing store is rendered at
    // device resolution (see setScreen).
    let viewWidth = BASE_WIDTH;
    let viewHeight = BASE_HEIGHT;
    let dangerLineY = 0;
    let previewY = 0;

    let score = 0;
    let gameOver = false;
    let canRestart = false;
    let overLineSince: number | null = null;
    let previousTime: number | null = null;
    let rafId = 0;
    let resizeTimeoutId: number | undefined;
    let restartTimeoutId: number | undefined;
    let lastDropTime = 0;
    let dropX = 0;
    let nextTier = randomSpawnTier();
    let destroyed = false;

    const bodyTierById = new Map<number, number>();
    const spawnTimeById = new Map<number, number>();
    const pendingRemoval = new Set<number>();
    const mergeQueue: { ax: number; ay: number; bx: number; by: number; tier: number }[] = [];

    let particles: Particle[] = [];
    let scorePopups: ScorePopup[] = [];

    function getScaleRatio() {
      const width = container!.clientWidth || BASE_WIDTH;
      const height = container!.clientHeight || BASE_HEIGHT;
      return Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    }

    function createFruitBody(x: number, y: number, tier: number) {
      const hullPoints = TIERS[tier].hull.map((p) => ({ x: p.x * scaleRatio, y: p.y * scaleRatio }));
      return Bodies.fromVertices(x, y, [hullPoints], {
        restitution: 0.1,
        friction: 0.5,
        frictionStatic: 0.6,
        frictionAir: 0.001,
        density: 0.0025,
      });
    }

    function buildWorld() {
      World.clear(engine.world, false);
      bodyTierById.clear();
      spawnTimeById.clear();
      pendingRemoval.clear();
      mergeQueue.length = 0;
      particles = [];
      scorePopups = [];

      const w = BASE_WIDTH * scaleRatio;
      const h = BASE_HEIGHT * scaleRatio;
      const t = WALL_THICKNESS * scaleRatio;

      const floor = Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, { isStatic: true, friction: 0.6 });
      const leftWall = Bodies.rectangle(-t / 2, h / 2, t, h * 2, { isStatic: true, friction: 0.6 });
      const rightWall = Bodies.rectangle(w + t / 2, h / 2, t, h * 2, { isStatic: true, friction: 0.6 });
      World.add(engine.world, [floor, leftWall, rightWall]);

      dangerLineY = h * DANGER_LINE_RATIO;
      previewY = dangerLineY * 0.6;
      dropX = w / 2;
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

      buildWorld();
    }

    setScreen();

    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimeoutId);
      resizeTimeoutId = window.setTimeout(setScreen, 300);
    });
    resizeObserver.observe(container);

    function handleCollisionStart(event: Matter.IEventCollision<Matter.Engine>) {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        const tierA = bodyTierById.get(bodyA.id);
        const tierB = bodyTierById.get(bodyB.id);
        if (tierA === undefined || tierB === undefined) continue;
        if (tierA !== tierB) continue;
        if (tierA >= TIERS.length - 1) continue;
        if (pendingRemoval.has(bodyA.id) || pendingRemoval.has(bodyB.id)) continue;

        pendingRemoval.add(bodyA.id);
        pendingRemoval.add(bodyB.id);
        mergeQueue.push({
          ax: bodyA.position.x,
          ay: bodyA.position.y,
          bx: bodyB.position.x,
          by: bodyB.position.y,
          tier: tierA,
        });
      }
    }

    Events.on(engine, 'collisionStart', handleCollisionStart);

    function processMerges(now: number) {
      if (mergeQueue.length === 0) return;

      for (const bodyId of pendingRemoval) {
        const body = Composite.allBodies(engine.world).find((b) => b.id === bodyId);
        if (body) World.remove(engine.world, body);
        bodyTierById.delete(bodyId);
        spawnTimeById.delete(bodyId);
      }
      pendingRemoval.clear();

      for (const merge of mergeQueue) {
        const nextTierIndex = merge.tier + 1;
        const midX = (merge.ax + merge.bx) / 2;
        const midY = (merge.ay + merge.by) / 2;
        const newBody = createFruitBody(midX, midY, nextTierIndex);
        World.add(engine.world, newBody);
        bodyTierById.set(newBody.id, nextTierIndex);
        spawnTimeById.set(newBody.id, now);

        const gained = TIERS[nextTierIndex].points;
        score += gained;
        // The further up the chain, the more it should be felt.
        onHapticRef.current?.(
          nextTierIndex >= TIERS.length - 2 ? 'levelUp' : nextTierIndex >= 5 ? 'strong' : nextTierIndex >= 2 ? 'impact' : 'tick',
        );
        spawnMergeBurst(midX, midY, TIERS[nextTierIndex].ringColor);
        scorePopups.push({
          x: midX,
          y: midY - TIERS[nextTierIndex].boundRadius * scaleRatio * 0.7,
          text: `+${gained}`,
          life: 700,
          maxLife: 700,
        });
      }
      mergeQueue.length = 0;
    }

    function spawnMergeBurst(x: number, y: number, color: string) {
      const count = 14;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = (70 + Math.random() * 70) * scaleRatio;
        const life = 400 + Math.random() * 250;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          color,
          size: (2 + Math.random() * 2.5) * scaleRatio,
        });
      }
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
        p.y -= 42 * scaleRatio * dt;
        p.life -= frameTimeDelta;
      }
      scorePopups = scorePopups.filter((p) => p.life > 0);
    }

    function checkGameOver(now: number) {
      let anyOverLine = false;
      for (const body of Composite.allBodies(engine.world)) {
        const tier = bodyTierById.get(body.id);
        if (tier === undefined) continue;
        const spawnedAt = spawnTimeById.get(body.id) ?? 0;
        if (now - spawnedAt < SPAWN_GRACE_MS) continue;
        const radius = TIERS[tier].boundRadius * scaleRatio;
        if (body.position.y - radius < dangerLineY) {
          anyOverLine = true;
          break;
        }
      }

      if (anyOverLine) {
        if (overLineSince === null) overLineSince = now;
        else if (now - overLineSince > GAME_OVER_GRACE_MS) triggerGameOver();
      } else {
        overLineSince = null;
      }
    }

    function triggerGameOver() {
      gameOver = true;
      const finalScore = Math.floor(score);
      const previousHighScore = Number(localStorage.getItem(FRUIT_MERGE_HIGH_SCORE_KEY)) || 0;
      const isNewHighScore = finalScore > previousHighScore;
      if (isNewHighScore) {
        localStorage.setItem(FRUIT_MERGE_HIGH_SCORE_KEY, String(finalScore));
      }
      const result: GameResult = {
        score: finalScore,
        highScore: isNewHighScore ? finalScore : previousHighScore,
        isNewHighScore,
      };
      onHapticRef.current?.('fail');
      onGameOverRef.current?.(result);

      restartTimeoutId = window.setTimeout(() => {
        if (!destroyed) canRestart = true;
      }, 1000);
    }

    function resetGame() {
      gameOver = false;
      canRestart = false;
      overLineSince = null;
      score = 0;
      nextTier = randomSpawnTier();
      lastDropTime = 0;
      buildWorld();
    }

    function tryDrop() {
      const now = performance.now();
      if (now - lastDropTime < DROP_COOLDOWN_MS) return;
      lastDropTime = now;

      const body = createFruitBody(dropX, previewY, nextTier);
      World.add(engine.world, body);
      bodyTierById.set(body.id, nextTier);
      spawnTimeById.set(body.id, now);
      nextTier = randomSpawnTier();
      onHapticRef.current?.('tick');
      // The next piece has its own radius, so re-clamp before it is previewed.
      clampDropX();
    }

    function clampDropX() {
      const radius = TIERS[nextTier].boundRadius * scaleRatio;
      const w = BASE_WIDTH * scaleRatio;
      dropX = Math.min(Math.max(dropX, radius), w - radius);
    }

    function aimAt(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      dropX = event.clientX - rect.left;
      clampDropX();
    }

    function handlePointerMove(event: PointerEvent) {
      if (gameOver) return;
      aimAt(event);
    }

    function handlePointerDown(event: PointerEvent) {
      if (gameOver) {
        if (canRestart) resetGame();
        return;
      }
      // A tap carries its own aim. Without this the piece would fall wherever the previous
      // one was released, because a touch fires pointerdown with no preceding pointermove.
      aimAt(event);
      tryDrop();
    }

    const NUDGE = 12;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        if (!gameOver) {
          dropX -= NUDGE * scaleRatio;
          clampDropX();
        }
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        if (!gameOver) {
          dropX += NUDGE * scaleRatio;
          clampDropX();
        }
      } else if (event.code === 'Space') {
        event.preventDefault();
        if (gameOver) {
          if (canRestart) resetGame();
        } else {
          tryDrop();
        }
      }
    }

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('keydown', handleKeyDown);
    container.focus();

    function drawBackground() {
      ctx!.fillStyle = '#f0fdf4';
      ctx!.fillRect(0, 0, viewWidth, viewHeight);

      ctx!.strokeStyle = '#fca5a5';
      ctx!.setLineDash([6 * scaleRatio, 6 * scaleRatio]);
      ctx!.lineWidth = Math.max(1, 1.5 * scaleRatio);
      ctx!.beginPath();
      ctx!.moveTo(0, dangerLineY);
      ctx!.lineTo(viewWidth, dangerLineY);
      ctx!.stroke();
      ctx!.setLineDash([]);
    }

    function tracePath(hull: HullPoint[]) {
      ctx!.beginPath();
      hull.forEach((p, i) => {
        const px = p.x * scaleRatio;
        const py = p.y * scaleRatio;
        if (i === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      });
      ctx!.closePath();
    }

    function easeOutBack(t: number) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function getSpawnScale(bodyId: number, now: number) {
      const spawnedAt = spawnTimeById.get(bodyId);
      if (spawnedAt === undefined) return 1;
      const elapsed = now - spawnedAt;
      if (elapsed >= POP_DURATION_MS) return 1;
      const t = Math.max(0, elapsed / POP_DURATION_MS);
      return Math.max(0.01, easeOutBack(t));
    }

    function drawFruit(x: number, y: number, angle: number, tier: number, alpha: number, scale: number) {
      const { hull, drawSize, offsetX, offsetY, image, ringColor } = TIERS[tier];
      ctx!.save();
      ctx!.globalAlpha = alpha;
      ctx!.translate(x, y);
      ctx!.rotate(angle);
      ctx!.scale(scale, scale);

      // Clip to the traced hull so the image never bleeds past its own collision shape.
      tracePath(hull);
      ctx!.clip();

      if (image.complete && image.naturalWidth > 0) {
        ctx!.drawImage(
          image,
          offsetX * scaleRatio,
          offsetY * scaleRatio,
          drawSize * scaleRatio,
          drawSize * scaleRatio,
        );
      } else {
        ctx!.fillStyle = ringColor;
        ctx!.fill();
      }

      ctx!.restore();
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
      const fontSize = Math.max(13, 18 * scaleRatio);
      for (const p of scorePopups) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = '#16a34a';
        ctx!.font = `bold ${fontSize}px Verdana, sans-serif`;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText(p.text, p.x, p.y);
        ctx!.restore();
      }
    }

    function drawHud() {
      const highScore = Number(localStorage.getItem(FRUIT_MERGE_HIGH_SCORE_KEY)) || 0;
      const fontSize = Math.max(11, 18 * scaleRatio);
      const margin = Math.max(8, 12 * scaleRatio);

      ctx!.font = `bold ${fontSize}px Verdana, sans-serif`;
      ctx!.fillStyle = '#78716c';
      ctx!.textAlign = 'left';
      ctx!.textBaseline = 'top';
      ctx!.fillText(`SCORE ${Math.floor(score)}`, margin, margin);

      ctx!.textAlign = 'right';
      ctx!.fillText(`HI ${highScore}`, viewWidth - margin, margin);
    }

    function drawGameOver() {
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
    }

    function draw(currentTime: number) {
      drawBackground();

      for (const body of Composite.allBodies(engine.world)) {
        const tier = bodyTierById.get(body.id);
        if (tier === undefined) continue;
        const popScale = getSpawnScale(body.id, currentTime);
        drawFruit(body.position.x, body.position.y, body.angle, tier, 1, popScale);
      }

      drawParticles();
      drawScorePopups();

      if (!gameOver) {
        drawFruit(dropX, previewY, 0, nextTier, 0.85, 1);
      }

      drawHud();

      if (gameOver) drawGameOver();
    }

    function gameLoop(currentTime: number) {
      if (previousTime === null) {
        previousTime = currentTime;
        rafId = requestAnimationFrame(gameLoop);
        return;
      }
      const frameTimeDelta = Math.min(currentTime - previousTime, 33);
      previousTime = currentTime;

      updateEffects(frameTimeDelta);

      if (!gameOver) {
        Engine.update(engine, frameTimeDelta);
        processMerges(currentTime);
        checkGameOver(currentTime);
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
      Events.off(engine, 'collisionStart', handleCollisionStart);
      World.clear(engine.world, false);
      Engine.clear(engine);
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
