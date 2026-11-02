import React from 'react';
import type { GameComponentProps, GameResult } from './types';

import dinoStandImg from '@/assets/games/dino/standing_still.png';
import dinoRun1Img from '@/assets/games/dino/dino_run1.png';
import dinoRun2Img from '@/assets/games/dino/dino_run2.png';
import groundImg from '@/assets/games/dino/ground.png';
import cactus1Img from '@/assets/games/dino/cactus_1.png';
import cactus2Img from '@/assets/games/dino/cactus_2.png';
import cactus3Img from '@/assets/games/dino/cactus_3.png';

export const DINO_HIGH_SCORE_KEY = 'frooGamesDinoHighScore';

interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const GAME_SPEED_START = 1;
const GAME_SPEED_INCREMENT = 0.00001;
const PLAYER_WIDTH = 88 / 1.5;
const PLAYER_HEIGHT = 94 / 1.5;
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 24;
const GROUND_AND_CACTUS_SPEED = 0.5;

const CACTI_CONFIG = [
  { width: 48 / 1.5, height: 100 / 1.5, src: cactus1Img },
  { width: 98 / 1.5, height: 100 / 1.5, src: cactus2Img },
  { width: 68 / 1.5, height: 70 / 1.5, src: cactus3Img },
];

class Player {
  private readonly WALK_ANIMATION_TIMER = 200;
  private readonly JUMP_SPEED = 0.6;
  private readonly GRAVITY = 0.4;

  private walkAnimationTimer = this.WALK_ANIMATION_TIMER;
  private jumpPressed = false;
  private jumpInProgress = false;
  private falling = false;

  private readonly standingStillImage: HTMLImageElement;
  private readonly dinoRunImages: HTMLImageElement[];
  private image: HTMLImageElement;

  x: number;
  y: number;
  private readonly yStandingPosition: number;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    public readonly width: number,
    public readonly height: number,
    private readonly minJumpHeight: number,
    private readonly maxJumpHeight: number,
    private readonly scaleRatio: number,
    private readonly target: HTMLElement,
  ) {
    const canvas = ctx.canvas;
    this.x = 10 * scaleRatio;
    this.y = canvas.height - this.height - 1.5 * scaleRatio;
    this.yStandingPosition = this.y;

    this.standingStillImage = new Image();
    this.standingStillImage.src = dinoStandImg;
    this.image = this.standingStillImage;

    this.dinoRunImages = [dinoRun1Img, dinoRun2Img].map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    this.target.addEventListener('keydown', this.keydown);
    this.target.addEventListener('keyup', this.keyup);
    this.target.addEventListener('pointerdown', this.pointerdown);
    this.target.addEventListener('pointerup', this.pointerup);
  }

  destroy() {
    this.target.removeEventListener('keydown', this.keydown);
    this.target.removeEventListener('keyup', this.keyup);
    this.target.removeEventListener('pointerdown', this.pointerdown);
    this.target.removeEventListener('pointerup', this.pointerup);
  }

  private pointerdown = () => {
    this.jumpPressed = true;
  };

  private pointerup = () => {
    this.jumpPressed = false;
  };

  private keydown = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      this.jumpPressed = true;
    }
  };

  private keyup = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      this.jumpPressed = false;
    }
  };

  get hitbox(): Hitbox {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(gameSpeed: number, frameTimeDelta: number) {
    this.run(gameSpeed, frameTimeDelta);

    if (this.jumpInProgress) {
      this.image = this.standingStillImage;
    }

    this.jump(frameTimeDelta);
  }

  private jump(frameTimeDelta: number) {
    if (this.jumpPressed) {
      this.jumpInProgress = true;
    }

    if (this.jumpInProgress && !this.falling) {
      const canvasHeight = this.ctx.canvas.height;
      if (
        this.y > canvasHeight - this.minJumpHeight ||
        (this.y > canvasHeight - this.maxJumpHeight && this.jumpPressed)
      ) {
        this.y -= this.JUMP_SPEED * frameTimeDelta * this.scaleRatio;
      } else {
        this.falling = true;
      }
    } else {
      if (this.y < this.yStandingPosition) {
        this.y += this.GRAVITY * frameTimeDelta * this.scaleRatio;
        if (this.y + this.height > this.ctx.canvas.height) {
          this.y = this.yStandingPosition;
        }
      } else {
        this.falling = false;
        this.jumpInProgress = false;
      }
    }
  }

  private run(gameSpeed: number, frameTimeDelta: number) {
    if (this.walkAnimationTimer <= 0) {
      this.image = this.image === this.dinoRunImages[0] ? this.dinoRunImages[1] : this.dinoRunImages[0];
      this.walkAnimationTimer = this.WALK_ANIMATION_TIMER;
    }
    this.walkAnimationTimer -= frameTimeDelta * gameSpeed;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

class Ground {
  x = 0;
  private readonly y: number;
  private readonly groundImage: HTMLImageElement;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly width: number,
    private readonly height: number,
    private readonly speed: number,
    private readonly scaleRatio: number,
  ) {
    this.y = ctx.canvas.height - height;
    this.groundImage = new Image();
    this.groundImage.src = groundImg;
  }

  update(gameSpeed: number, frameTimeDelta: number) {
    this.x -= gameSpeed * frameTimeDelta * this.speed * this.scaleRatio;
  }

  draw() {
    this.ctx.drawImage(this.groundImage, this.x, this.y, this.width, this.height);
    this.ctx.drawImage(this.groundImage, this.x + this.width, this.y, this.width, this.height);

    if (this.x < -this.width) {
      this.x = 0;
    }
  }

  reset() {
    this.x = 0;
  }
}

class Cactus {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    public x: number,
    public readonly y: number,
    public readonly width: number,
    public readonly height: number,
    private readonly image: HTMLImageElement,
  ) {}

  update(speed: number, gameSpeed: number, frameTimeDelta: number, scaleRatio: number) {
    this.x -= speed * gameSpeed * frameTimeDelta * scaleRatio;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collideWith(sprite: Hitbox) {
    const adjustBy = 1.4;
    return (
      sprite.x < this.x + this.width / adjustBy &&
      sprite.x + sprite.width / adjustBy > this.x &&
      sprite.y < this.y + this.height / adjustBy &&
      sprite.height + sprite.y / adjustBy > this.y
    );
  }
}

interface CactusImageConfig {
  image: HTMLImageElement;
  width: number;
  height: number;
}

class CactiController {
  private readonly CACTUS_INTERVAL_MIN = 500;
  private readonly CACTUS_INTERVAL_MAX = 2000;
  private nextCactusInterval = 0;
  private cacti: Cactus[] = [];

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly cactiImages: CactusImageConfig[],
    private readonly scaleRatio: number,
    private readonly speed: number,
  ) {
    this.setNextCactusTime();
  }

  private setNextCactusTime() {
    this.nextCactusInterval = this.getRandomNumber(this.CACTUS_INTERVAL_MIN, this.CACTUS_INTERVAL_MAX);
  }

  private getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private createCactus() {
    const index = this.getRandomNumber(0, this.cactiImages.length - 1);
    const cactusImage = this.cactiImages[index];
    const x = this.ctx.canvas.width * 1.5;
    const y = this.ctx.canvas.height - cactusImage.height;
    this.cacti.push(new Cactus(this.ctx, x, y, cactusImage.width, cactusImage.height, cactusImage.image));
  }

  update(gameSpeed: number, frameTimeDelta: number) {
    if (this.nextCactusInterval <= 0) {
      this.createCactus();
      this.setNextCactusTime();
    }
    this.nextCactusInterval -= frameTimeDelta;

    this.cacti.forEach((cactus) => cactus.update(this.speed, gameSpeed, frameTimeDelta, this.scaleRatio));
    this.cacti = this.cacti.filter((cactus) => cactus.x > -cactus.width);
  }

  draw() {
    this.cacti.forEach((cactus) => cactus.draw());
  }

  collideWith(sprite: Hitbox) {
    return this.cacti.some((cactus) => cactus.collideWith(sprite));
  }

  reset() {
    this.cacti = [];
  }
}

class Score {
  score = 0;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly scaleRatio: number,
  ) {}

  update(frameTimeDelta: number) {
    this.score += frameTimeDelta * 0.01;
  }

  reset() {
    this.score = 0;
  }

  finalize(): GameResult {
    const finalScore = Math.floor(this.score);
    const previousHighScore = Number(localStorage.getItem(DINO_HIGH_SCORE_KEY)) || 0;
    const isNewHighScore = finalScore > previousHighScore;
    if (isNewHighScore) {
      localStorage.setItem(DINO_HIGH_SCORE_KEY, String(finalScore));
    }
    return { score: finalScore, highScore: isNewHighScore ? finalScore : previousHighScore, isNewHighScore };
  }

  draw() {
    const highScore = Number(localStorage.getItem(DINO_HIGH_SCORE_KEY)) || 0;
    // Floor the font size so the HUD stays legible when embedded in a narrow container.
    const fontSize = Math.max(11, 20 * this.scaleRatio);
    const margin = Math.max(8, 12 * this.scaleRatio);
    const gap = Math.max(10, 16 * this.scaleRatio);
    const y = fontSize + margin / 2;

    this.ctx.font = `${fontSize}px Verdana, sans-serif`;
    this.ctx.fillStyle = '#525250';
    this.ctx.textAlign = 'right';

    const scorePadded = Math.floor(this.score).toString().padStart(6, '0');
    const highScorePadded = highScore.toString().padStart(6, '0');

    const scoreX = this.ctx.canvas.width - margin;
    this.ctx.fillText(scorePadded, scoreX, y);

    const scoreWidth = this.ctx.measureText(scorePadded).width;
    this.ctx.fillText(`HI ${highScorePadded}`, scoreX - scoreWidth - gap, y);
  }
}

export function DinoGame({ onGameOver }: GameComponentProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const onGameOverRef = React.useRef(onGameOver);

  React.useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let player!: Player;
    let ground!: Ground;
    let cactiController!: CactiController;
    let score!: Score;
    let scaleRatio = 1;
    let previousTime: number | null = null;
    let gameSpeed = GAME_SPEED_START;
    let gameOver = false;
    let waitingToStart = true;
    let hasAddedEventListenersForRestart = false;
    let rafId = 0;
    let restartTimeoutId: number | undefined;
    let resizeTimeoutId: number | undefined;
    let destroyed = false;

    function getScaleRatio() {
      const width = container!.clientWidth || GAME_WIDTH;
      return width / GAME_WIDTH;
    }

    function createSprites() {
      const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
      const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
      const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
      const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;
      const groundWidthInGame = GROUND_WIDTH * scaleRatio;
      const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

      player?.destroy();
      player = new Player(
        ctx,
        playerWidthInGame,
        playerHeightInGame,
        minJumpHeightInGame,
        maxJumpHeightInGame,
        scaleRatio,
        container!,
      );

      ground = new Ground(ctx, groundWidthInGame, groundHeightInGame, GROUND_AND_CACTUS_SPEED, scaleRatio);

      const cactiImages: CactusImageConfig[] = CACTI_CONFIG.map((cactus) => {
        const image = new Image();
        image.src = cactus.src;
        return { image, width: cactus.width * scaleRatio, height: cactus.height * scaleRatio };
      });

      cactiController = new CactiController(ctx, cactiImages, scaleRatio, GROUND_AND_CACTUS_SPEED);
      score = new Score(ctx, scaleRatio);
    }

    function setScreen() {
      scaleRatio = getScaleRatio();
      canvas!.width = GAME_WIDTH * scaleRatio;
      canvas!.height = GAME_HEIGHT * scaleRatio;
      createSprites();
    }

    setScreen();

    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimeoutId);
      resizeTimeoutId = window.setTimeout(setScreen, 300);
    });
    resizeObserver.observe(container);

    function showGameOver() {
      const fontSize = 26 * scaleRatio;
      ctx!.font = `bold ${fontSize}px Verdana, sans-serif`;
      ctx!.fillStyle = '#475569';
      ctx!.textAlign = 'center';
      ctx!.fillText('GAME OVER', canvas!.width / 2, canvas!.height / 2);
    }

    function showStartGameText() {
      const fontSize = 16 * scaleRatio;
      ctx!.font = `${fontSize}px Verdana, sans-serif`;
      ctx!.fillStyle = '#94a3b8';
      ctx!.textAlign = 'center';
      ctx!.fillText('Tap or press Space to jump', canvas!.width / 2, canvas!.height / 2);
    }

    function reset() {
      hasAddedEventListenersForRestart = false;
      gameOver = false;
      waitingToStart = false;
      ground.reset();
      cactiController.reset();
      score.reset();
      gameSpeed = GAME_SPEED_START;
    }

    function setupGameReset() {
      if (!hasAddedEventListenersForRestart) {
        hasAddedEventListenersForRestart = true;
        restartTimeoutId = window.setTimeout(() => {
          if (destroyed) return;
          container!.addEventListener('keyup', reset, { once: true });
          container!.addEventListener('pointerdown', reset, { once: true });
        }, 1000);
      }
    }

    function updateGameSpeed(frameTimeDelta: number) {
      gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
    }

    function clearScreen() {
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
    }

    function gameLoop(currentTime: number) {
      if (previousTime === null) {
        previousTime = currentTime;
        rafId = requestAnimationFrame(gameLoop);
        return;
      }
      const frameTimeDelta = currentTime - previousTime;
      previousTime = currentTime;

      clearScreen();

      if (!gameOver && !waitingToStart) {
        ground.update(gameSpeed, frameTimeDelta);
        cactiController.update(gameSpeed, frameTimeDelta);
        player.update(gameSpeed, frameTimeDelta);
        score.update(frameTimeDelta);
        updateGameSpeed(frameTimeDelta);
      }

      if (!gameOver && cactiController.collideWith(player.hitbox)) {
        gameOver = true;
        setupGameReset();
        onGameOverRef.current?.(score.finalize());
      }

      ground.draw();
      cactiController.draw();
      player.draw();
      score.draw();

      if (gameOver) showGameOver();
      if (waitingToStart) showStartGameText();

      rafId = requestAnimationFrame(gameLoop);
    }

    rafId = requestAnimationFrame(gameLoop);
    container.addEventListener('keyup', reset, { once: true });
    container.addEventListener('pointerdown', reset, { once: true });
    container.focus();

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.clearTimeout(restartTimeoutId);
      window.clearTimeout(resizeTimeoutId);
      container.removeEventListener('keyup', reset);
      container.removeEventListener('pointerdown', reset);
      player?.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} tabIndex={0} className="w-full outline-none select-none touch-none cursor-pointer">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
