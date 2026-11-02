import type { ParentLayout } from '../shared-types';
import { parentLayoutFor } from './layout-classifier';

export interface InsertionIndicatorGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
  axis: 'x' | 'y';
}

export interface ReorderInsertion {
  parentId: string;
  beforeId: string | null;
  changed: boolean;
  indicator: InsertionIndicatorGeometry;
  label: string;
}

function sourceFile(id: string): string {
  const parts = id.split(':');
  return parts.length >= 3 ? parts.slice(0, -2).join(':') : '';
}

export function isSafeSameSourceParent(target: HTMLElement): boolean {
  const targetId = target.dataset.vleId;
  const parentId = target.parentElement?.dataset.vleId;
  // Generated nodes (for example the repeated result of a .map()) do not have a
  // one-to-one source sibling we can move. Conditional and legacy nodes still
  // do, and the server performs the final AST validation before saving.
  if (!targetId || !parentId || target.dataset.vleSourceMode === 'generated') return false;
  return sourceFile(targetId) === sourceFile(parentId);
}

function visibleSiblings(target: HTMLElement) {
  const parent = target.parentElement;
  if (!parent) return [];
  return [...parent.children]
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter((child) => child !== target && !!child.dataset.vleId && getComputedStyle(child).display !== 'none')
    .map((el) => ({ el, rect: el.getBoundingClientRect() }));
}

function currentNextId(target: HTMLElement): string | null {
  let next = target.nextElementSibling;
  while (next) {
    if (next instanceof HTMLElement && next.dataset.vleId && getComputedStyle(next).display !== 'none') {
      return next.dataset.vleId;
    }
    next = next.nextElementSibling;
  }
  return null;
}

function indicatorFor(
  parent: HTMLElement,
  before: { el: HTMLElement; rect: DOMRect } | null,
  ordered: { el: HTMLElement; rect: DOMRect }[],
  layout: ParentLayout,
): InsertionIndicatorGeometry {
  const parentRect = parent.getBoundingClientRect();
  const horizontal = layout === 'flex-row';
  if (horizontal) {
    const x = before?.rect.left ?? ordered.at(-1)?.rect.right ?? parentRect.left;
    return { left: x - 1, top: parentRect.top + 4, width: 2, height: Math.max(12, parentRect.height - 8), axis: 'x' };
  }
  if (layout === 'grid' || layout === 'flex-wrap') {
    const rect = before?.rect ?? ordered.at(-1)?.rect;
    if (rect) return { left: rect.left, top: (before ? rect.top : rect.bottom) - 1, width: rect.width, height: 2, axis: 'y' };
  }
  const y = before?.rect.top ?? ordered.at(-1)?.rect.bottom ?? parentRect.top;
  return { left: parentRect.left + 4, top: y - 1, width: Math.max(12, parentRect.width - 8), height: 2, axis: 'y' };
}

function sortGrid(items: { el: HTMLElement; rect: DOMRect }[]) {
  return [...items].sort((a, b) => {
    const rowTolerance = Math.max(8, Math.min(a.rect.height, b.rect.height) * 0.35);
    if (Math.abs(a.rect.top - b.rect.top) > rowTolerance) return a.rect.top - b.rect.top;
    return a.rect.left - b.rect.left;
  });
}

function beforeInGrid(items: { el: HTMLElement; rect: DOMRect }[], x: number, y: number) {
  if (!items.length) return null;
  const ordered = sortGrid(items);
  for (const item of ordered) {
    const rowThreshold = item.rect.top + item.rect.height / 2;
    if (y < rowThreshold) {
      const rowItems = ordered.filter((candidate) => Math.abs(candidate.rect.top - item.rect.top) <= Math.max(8, item.rect.height * 0.35));
      const withinRow = rowItems.find((candidate) => x < candidate.rect.left + candidate.rect.width / 2);
      if (withinRow) return withinRow;
      const lastInRow = rowItems.at(-1);
      return lastInRow ? ordered[ordered.indexOf(lastInRow) + 1] ?? null : null;
    }
  }
  return null;
}

export function getReorderInsertion(target: HTMLElement, dx: number, dy: number): ReorderInsertion | null {
  const parent = target.parentElement;
  const parentId = parent?.dataset.vleId;
  if (!parent || !parentId || !isSafeSameSourceParent(target)) return null;
  const layout = parentLayoutFor(parent);
  const siblings = visibleSiblings(target);
  if (!siblings.length) return null;
  const rect = target.getBoundingClientRect();
  const pointerX = rect.left + dx + rect.width / 2;
  const pointerY = rect.top + dy + rect.height / 2;
  let ordered: { el: HTMLElement; rect: DOMRect }[];
  let before: { el: HTMLElement; rect: DOMRect } | null = null;

  if (layout === 'flex-row') {
    ordered = [...siblings].sort((a, b) => a.rect.left - b.rect.left);
    before = ordered.find((item) => pointerX < item.rect.left + item.rect.width / 2) ?? null;
  } else if (layout === 'grid' || layout === 'flex-wrap') {
    ordered = sortGrid(siblings);
    before = beforeInGrid(ordered, pointerX, pointerY);
  } else {
    ordered = [...siblings].sort((a, b) => a.rect.top - b.rect.top);
    before = ordered.find((item) => pointerY < item.rect.top + item.rect.height / 2) ?? null;
  }

  const beforeId = before?.el.dataset.vleId ?? null;
  return {
    parentId,
    beforeId,
    changed: beforeId !== currentNextId(target),
    indicator: indicatorFor(parent, before, ordered, layout),
    label: layout === 'flex-row' ? 'Reorder in row' : layout === 'grid' || layout === 'flex-wrap' ? 'Reorder in grid' : 'Reorder in flow',
  };
}
