/**
 * Depth without strokes.
 *
 * Surfaces are separated by soft, layered shadows plus a 1px inner top highlight (the way iOS
 * lights a raised card) instead of 1px borders. Every token is a CSS `boxShadow` string, which
 * React Native renders natively on iOS and Android under the New Architecture (Expo SDK 54).
 *
 * - card:     default resting surface (list rows, tiles, section cards)
 * - raised:   small interactive things that sit on a card (chips, icon buttons, avatars)
 * - floating: things above the page (sheets, nav bar, toasts, the active-reward pill)
 * - well:     recessed controls (inputs, unchecked checkboxes, empty streak days)
 * - glow:     primary coloured buttons; pass the button's RGB so the shadow is tinted by it
 */
export const elevation = {
  card: {
    boxShadow:
      '0 1px 2px rgba(15, 23, 42, 0.05), 0 6px 20px -8px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  },
  raised: {
    boxShadow:
      '0 1px 2px rgba(15, 23, 42, 0.08), 0 3px 8px -3px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
  },
  floating: {
    boxShadow: '0 -2px 10px rgba(15, 23, 42, 0.04), 0 16px 40px -12px rgba(15, 23, 42, 0.22)',
  },
  well: {
    boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.10), inset 0 -1px 0 rgba(255, 255, 255, 0.8)',
  },
} as const;

/** Tinted lift for a solid coloured control, e.g. glow('22, 163, 74') for green-600. */
export function glow(rgb: string, strength = 0.35) {
  return {
    boxShadow: `0 6px 16px -6px rgba(${rgb}, ${strength}), 0 1px 2px rgba(${rgb}, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.28)`,
  };
}
