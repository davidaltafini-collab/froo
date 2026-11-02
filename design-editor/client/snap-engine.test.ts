import { describe, expect, it } from 'vitest';
import { computeMoveSnap, type MoveSnapInput, type RectSnapshot } from './snap-engine';

function rect(left: number, top: number, width: number, height: number): RectSnapshot {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function baseInput(): MoveSnapInput {
  return {
    rect: rect(40, 150, 100, 50),
    dx: 0,
    dy: 0,
    parentRect: rect(0, 0, 400, 400),
    parentPadding: { top: 20, right: 20, bottom: 20, left: 20 },
    siblings: [],
    rulerGuides: [],
  };
}

describe('computeMoveSnap', () => {
  it('snaps to a sibling edge and explains the relationship', () => {
    const result = computeMoveSnap({
      ...baseInput(),
      dx: 158,
      siblings: [{ id: 'sibling', rect: rect(200, 80, 100, 50) }],
    });
    expect(result.dx).toBe(160);
    expect(result.guides.some((guide) => guide.label === 'Left edges')).toBe(true);
  });

  it('keeps a locked snap until the wider release threshold is crossed', () => {
    const result = computeMoveSnap({
      ...baseInput(),
      dx: 167,
      siblings: [{ id: 'sibling', rect: rect(200, 80, 100, 50) }],
      previousLocks: { x: 'sibling:sibling:x:start' },
    });
    expect(result.dx).toBe(160);
    expect(result.locks.x).toBe('sibling:sibling:x:start');
  });

  it('surfaces equal spacing as a first-class snap reason', () => {
    const result = computeMoveSnap({
      ...baseInput(),
      siblings: [
        { id: 'above', rect: rect(40, 50, 100, 50) },
        { id: 'below', rect: rect(40, 250, 100, 50) },
      ],
    });
    expect(result.dy).toBe(0);
    expect(result.guides.some((guide) => guide.label === 'Equal gap 50')).toBe(true);
  });

  it('returns raw pointer movement when snapping is disabled', () => {
    const result = computeMoveSnap({
      ...baseInput(),
      dx: 158,
      disabled: true,
      siblings: [{ id: 'sibling', rect: rect(200, 80, 100, 50) }],
    });
    expect(result.dx).toBe(158);
    expect(result.guides).toEqual([]);
  });
});

