import { WebViewGame } from './WebViewGame';
import { fruitMergeHtml } from './generated/fruitMergeHtml';
import type { GameComponentProps } from './types';

export const FRUIT_MERGE_HIGH_SCORE_KEY = 'frooGamesFruitMergeHighScore';

export function FruitMergeGame({ onGameOver }: GameComponentProps) {
  return <WebViewGame html={fruitMergeHtml} style={{ width: '100%', height: '100%' }} onGameOver={onGameOver} />;
}
