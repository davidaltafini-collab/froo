import { BrickWall, Citrus } from 'lucide-react-native';
import { BrickBreakerGame, BRICK_BREAKER_HIGH_SCORE_KEY } from './BrickBreakerGame';
import { FruitMergeGame, FRUIT_MERGE_HIGH_SCORE_KEY } from './FruitMergeGame';
import type { GameDefinition } from './types';

export const GAMES: GameDefinition[] = [
  {
    id: 'brick-breaker',
    title: 'Store Breaker',
    tagline: 'Bounce, break the shelves, clear the aisle.',
    icon: BrickWall,
    highScoreKey: BRICK_BREAKER_HIGH_SCORE_KEY,
    Component: BrickBreakerGame,
  },
  {
    id: 'fruit-merge',
    title: 'Froo Merge',
    tagline: 'Merge matching bistro bites into bigger ones.',
    icon: Citrus,
    highScoreKey: FRUIT_MERGE_HIGH_SCORE_KEY,
    Component: FruitMergeGame,
  },
];
