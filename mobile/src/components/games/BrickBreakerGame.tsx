import { WebViewGame } from './WebViewGame';
import { brickBreakerHtml } from './generated/brickBreakerHtml';
import type { GameComponentProps } from './types';

export const BRICK_BREAKER_HIGH_SCORE_KEY = 'frooGamesBrickBreakerHighScore';

export function BrickBreakerGame({ onGameOver }: GameComponentProps) {
  return <WebViewGame html={brickBreakerHtml} style={{ width: '100%', height: '100%' }} onGameOver={onGameOver} />;
}
