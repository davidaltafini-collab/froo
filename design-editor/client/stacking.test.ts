import { describe, expect, it } from 'vitest';
import { nextStackingIndex } from './stacking';

describe('layer stacking order', () => {
  it('moves relative to the current layer', () => {
    expect(nextStackingIndex(4, [1, 8], 'forward')).toBe(5);
    expect(nextStackingIndex(4, [1, 8], 'backward')).toBe(3);
  });

  it('moves beyond all sibling layers', () => {
    expect(nextStackingIndex(4, [-2, 8], 'front')).toBe(9);
    expect(nextStackingIndex(4, [-2, 8], 'back')).toBe(-3);
  });
});
