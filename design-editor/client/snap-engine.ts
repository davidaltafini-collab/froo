import type { RulerGuide } from './store';

export interface RectSnapshot {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface SnapSibling {
  id: string;
  rect: RectSnapshot;
}

export type SnapGuideKind = 'guide' | 'edge' | 'center' | 'equal-gap' | 'padding';

export interface VisibleSnapGuide {
  key: string;
  axis: 'x' | 'y';
  position: number;
  start: number;
  end: number;
  label: string;
  kind: SnapGuideKind;
}

export interface SnapLocks {
  x?: string;
  y?: string;
}

interface AxisCandidate extends VisibleSnapGuide {
  movingAnchor: 'start' | 'center' | 'end';
  targetPosition: number;
  priority: number;
}

export interface MoveSnapInput {
  rect: RectSnapshot;
  dx: number;
  dy: number;
  parentRect: RectSnapshot;
  parentPadding: { top: number; right: number; bottom: number; left: number };
  siblings: SnapSibling[];
  rulerGuides: RulerGuide[];
  previousLocks?: SnapLocks;
  threshold?: number;
  releaseThreshold?: number;
  disabled?: boolean;
}

export interface MoveSnapResult {
  dx: number;
  dy: number;
  locks: SnapLocks;
  guides: VisibleSnapGuide[];
}

function center(start: number, end: number) {
  return start + (end - start) / 2;
}

function axisValue(rect: RectSnapshot, axis: 'x' | 'y', anchor: AxisCandidate['movingAnchor'], delta: number): number {
  const start = axis === 'x' ? rect.left : rect.top;
  const end = axis === 'x' ? rect.right : rect.bottom;
  if (anchor === 'start') return start + delta;
  if (anchor === 'end') return end + delta;
  return center(start, end) + delta;
}

function candidate(
  key: string,
  axis: 'x' | 'y',
  movingAnchor: AxisCandidate['movingAnchor'],
  targetPosition: number,
  start: number,
  end: number,
  label: string,
  kind: SnapGuideKind,
  priority: number,
): AxisCandidate {
  return { key, axis, movingAnchor, targetPosition, position: targetPosition, start, end, label, kind, priority };
}

function buildCandidates(input: MoveSnapInput, axis: 'x' | 'y'): AxisCandidate[] {
  const { parentRect, parentPadding, siblings, rulerGuides, rect } = input;
  const isX = axis === 'x';
  const parentStart = isX ? parentRect.left + parentPadding.left : parentRect.top + parentPadding.top;
  const parentEnd = isX ? parentRect.right - parentPadding.right : parentRect.bottom - parentPadding.bottom;
  const crossStart = isX ? parentRect.top : parentRect.left;
  const crossEnd = isX ? parentRect.bottom : parentRect.right;
  const result: AxisCandidate[] = [
    candidate(`parent:${axis}:start`, axis, 'start', parentStart, crossStart, crossEnd, isX ? 'Left padding' : 'Top padding', 'padding', 1),
    candidate(`parent:${axis}:center`, axis, 'center', center(parentStart, parentEnd), crossStart, crossEnd, isX ? 'Horizontal center' : 'Vertical center', 'center', 3),
    candidate(`parent:${axis}:end`, axis, 'end', parentEnd, crossStart, crossEnd, isX ? 'Right padding' : 'Bottom padding', 'padding', 1),
  ];

  for (const guide of rulerGuides) {
    if ((axis === 'x' && guide.axis !== 'x') || (axis === 'y' && guide.axis !== 'y')) continue;
    for (const anchor of ['start', 'center', 'end'] as const) {
      result.push(candidate(`ruler:${guide.id}:${anchor}`, axis, anchor, guide.position, 0, isX ? window.innerHeight : window.innerWidth, `Guide ${Math.round(guide.position)}`, 'guide', 0));
    }
  }

  for (const sibling of siblings) {
    const siblingStart = isX ? sibling.rect.left : sibling.rect.top;
    const siblingEnd = isX ? sibling.rect.right : sibling.rect.bottom;
    const spanStart = Math.min(isX ? sibling.rect.top : sibling.rect.left, isX ? rect.top : rect.left);
    const spanEnd = Math.max(isX ? sibling.rect.bottom : sibling.rect.right, isX ? rect.bottom : rect.right);
    result.push(
      candidate(`sibling:${sibling.id}:${axis}:start`, axis, 'start', siblingStart, spanStart, spanEnd, isX ? 'Left edges' : 'Top edges', 'edge', 2),
      candidate(`sibling:${sibling.id}:${axis}:center`, axis, 'center', center(siblingStart, siblingEnd), spanStart, spanEnd, isX ? 'Horizontal centers' : 'Vertical centers', 'center', 3),
      candidate(`sibling:${sibling.id}:${axis}:end`, axis, 'end', siblingEnd, spanStart, spanEnd, isX ? 'Right edges' : 'Bottom edges', 'edge', 2),
    );
  }

  const before = siblings
    .filter((sibling) => (isX ? sibling.rect.right <= rect.left : sibling.rect.bottom <= rect.top))
    .sort((a, b) => (isX ? b.rect.right - a.rect.right : b.rect.bottom - a.rect.bottom))[0];
  const after = siblings
    .filter((sibling) => (isX ? sibling.rect.left >= rect.right : sibling.rect.top >= rect.bottom))
    .sort((a, b) => (isX ? a.rect.left - b.rect.left : a.rect.top - b.rect.top))[0];
  if (before && after) {
    const beforeEnd = isX ? before.rect.right : before.rect.bottom;
    const afterStart = isX ? after.rect.left : after.rect.top;
    const size = isX ? rect.width : rect.height;
    const targetStart = (beforeEnd + afterStart - size) / 2;
    const gap = Math.max(0, (afterStart - beforeEnd - size) / 2);
    const spanStart = isX ? Math.min(before.rect.top, after.rect.top, rect.top) : Math.min(before.rect.left, after.rect.left, rect.left);
    const spanEnd = isX ? Math.max(before.rect.bottom, after.rect.bottom, rect.bottom) : Math.max(before.rect.right, after.rect.right, rect.right);
    result.push(candidate(`equal:${before.id}:${after.id}:${axis}`, axis, 'start', targetStart, spanStart, spanEnd, `Equal gap ${Math.round(gap)}`, 'equal-gap', 2));
  }

  return result;
}

function chooseAxis(
  rect: RectSnapshot,
  axis: 'x' | 'y',
  rawDelta: number,
  candidates: AxisCandidate[],
  previousKey: string | undefined,
  threshold: number,
  releaseThreshold: number,
): { delta: number; candidate?: AxisCandidate } {
  const locked = previousKey ? candidates.find((item) => item.key === previousKey) : undefined;
  if (locked) {
    const correction = locked.targetPosition - axisValue(rect, axis, locked.movingAnchor, rawDelta);
    if (Math.abs(correction) <= releaseThreshold) return { delta: rawDelta + correction, candidate: locked };
  }

  let best: { correction: number; candidate: AxisCandidate } | undefined;
  for (const item of candidates) {
    const correction = item.targetPosition - axisValue(rect, axis, item.movingAnchor, rawDelta);
    const distance = Math.abs(correction);
    if (distance > threshold) continue;
    if (
      !best ||
      item.priority < best.candidate.priority ||
      (item.priority === best.candidate.priority && distance < Math.abs(best.correction))
    ) {
      best = { correction, candidate: item };
    }
  }
  return best ? { delta: rawDelta + best.correction, candidate: best.candidate } : { delta: rawDelta };
}

export function computeMoveSnap(input: MoveSnapInput): MoveSnapResult {
  if (input.disabled) return { dx: input.dx, dy: input.dy, locks: {}, guides: [] };
  const threshold = input.threshold ?? 6;
  const releaseThreshold = input.releaseThreshold ?? 10;
  const x = chooseAxis(input.rect, 'x', input.dx, buildCandidates(input, 'x'), input.previousLocks?.x, threshold, releaseThreshold);
  const y = chooseAxis(input.rect, 'y', input.dy, buildCandidates(input, 'y'), input.previousLocks?.y, threshold, releaseThreshold);
  return {
    dx: x.delta,
    dy: y.delta,
    locks: { x: x.candidate?.key, y: y.candidate?.key },
    guides: [x.candidate, y.candidate].filter((item): item is AxisCandidate => !!item),
  };
}

