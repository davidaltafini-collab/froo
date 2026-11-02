/**
 * Backing-store scale for the canvas games.
 *
 * The games keep every coordinate — physics, layout, and pointer input — in logical CSS
 * pixels. Only the canvas backing store is enlarged by this ratio, and the 2D context is
 * scaled by it exactly once per resize, so a high-density phone screen renders at native
 * resolution instead of being upscaled by the compositor.
 *
 * On a DPR-1 display this returns 1, which makes the whole mechanism a no-op and keeps the
 * canonical desktop reference rendering byte-for-byte as before.
 */

/** Beyond 3x the extra pixels are not perceivable but the fill cost keeps growing. */
const MAX_BACKING_SCALE = 3;

export function getDevicePixelRatio() {
  const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return Math.min(ratio, MAX_BACKING_SCALE);
}
