import type { GameHapticKind, GameResult } from '../components/games/types';

/**
 * Messages a game sends to whatever is hosting it: the React Native WebView on a phone, or
 * the parent frame in a browser. The games never touch a platform API directly, so one
 * build runs in both places.
 */
type GameMessage =
  | { type: 'gameOver'; result: GameResult }
  | { type: 'haptic'; kind: GameHapticKind };

function post(message: GameMessage) {
  const rnWebView = (window as unknown as { ReactNativeWebView?: { postMessage(data: string): void } })
    .ReactNativeWebView;
  if (rnWebView?.postMessage) {
    rnWebView.postMessage(JSON.stringify(message));
  }
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'FROO_GAME_MESSAGE', message }, '*');
  }
}

/** Posts a game-over result back to the host. */
export function postGameOver(result: GameResult) {
  post({ type: 'gameOver', result });
}

/**
 * Asks the host to play a haptic. The game names the event, not the waveform — the native
 * side owns intensity and picks the waveform.
 *
 * The native side also throttles (see mobile/src/components/games/haptics.ts), but only after
 * the message has already crossed the WebView bridge: a JSON-stringify plus a postMessage hop
 * per contact. A brick-breaker rally can report several contacts inside one frame, and most of
 * those bridge crossings would just be discarded on arrival anyway, so the same interval is
 * applied here first to cut that traffic at the source instead of paying for it every time.
 */
const TICK_MIN_INTERVAL_MS = 55;
const EVENT_MIN_INTERVAL_MS = 90;
let lastHapticAt = 0;

export function postHaptic(kind: GameHapticKind) {
  const now = Date.now();
  const minInterval = kind === 'tick' ? TICK_MIN_INTERVAL_MS : EVENT_MIN_INTERVAL_MS;
  if (now - lastHapticAt < minInterval) return;
  lastHapticAt = now;
  post({ type: 'haptic', kind });
}
