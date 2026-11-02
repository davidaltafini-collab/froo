import * as Haptics from 'expo-haptics';
import type { GameHapticKind } from './types';

/**
 * Plays the haptic a game asked for.
 *
 * The games describe events, not waveforms, so the mapping and the rate limiting live here.
 * Rate limiting matters: a brick-breaker rally can report several contacts inside one frame,
 * and firing the taptic engine on every one of them turns distinct hits into a continuous
 * buzz that feels worse than no haptics at all.
 */

/** Contacts fire constantly during play, so they get the tightest budget. */
const TICK_MIN_INTERVAL_MS = 55;
/** Everything else is rarer, but still worth spacing so two events stay distinguishable. */
const EVENT_MIN_INTERVAL_MS = 90;

let lastPlayedAt = 0;

export function playGameHaptic(kind: GameHapticKind) {
  const now = Date.now();
  const minInterval = kind === 'tick' ? TICK_MIN_INTERVAL_MS : EVENT_MIN_INTERVAL_MS;
  if (now - lastPlayedAt < minInterval) return;
  lastPlayedAt = now;

  switch (kind) {
    case 'tick':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'impact':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'strong':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'pickup':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'levelUp':
      // A two-beat pattern so clearing a level is unmistakably not just another brick.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 140);
      break;
    case 'fail':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
}

/** Lets a fresh session start with a clean budget instead of inheriting the last one's. */
export function resetGameHapticThrottle() {
  lastPlayedAt = 0;
}
