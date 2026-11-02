import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface GameResult {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
}

/**
 * Haptic vocabulary shared by both games.
 *
 * The games only describe *what happened*; the host decides how it should feel. On the
 * phone the React Native shell maps these onto expo-haptics, and in a desktop browser
 * `onHaptic` is simply absent, so the web reference behaves exactly as before.
 */
export type GameHapticKind =
  /** Light contact — paddle bounce, chipping a brick, releasing a piece. */
  | 'tick'
  /** Something was consumed or combined — brick destroyed, two pieces merged. */
  | 'impact'
  /** A heavy or high-tier event — late-tier merge, power ball smash. */
  | 'strong'
  /** A pickup landed in the tray. */
  | 'pickup'
  /** Level cleared. Deliberately a distinct two-beat pattern. */
  | 'levelUp'
  /** Life lost or run over. */
  | 'fail';

export interface GameComponentProps {
  onGameOver?: (result: GameResult) => void;
  onHaptic?: (kind: GameHapticKind) => void;
}

export interface GameDefinition {
  id: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  highScoreKey: string;
  Component: ComponentType<GameComponentProps>;
}
