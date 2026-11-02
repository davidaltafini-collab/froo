import { captureElementBaseline, stageClassTokenBatch } from './store';

export type StackAction = 'front' | 'forward' | 'backward' | 'back';

export function numericZIndex(el: Element): number {
  const parsed = Number.parseInt(getComputedStyle(el).zIndex, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function nextStackingIndex(current: number, siblingValues: number[], action: StackAction): number {
  if (action === 'forward') return current + 1;
  if (action === 'backward') return current - 1;
  if (action === 'front') return Math.max(current, ...siblingValues, 0) + 1;
  return Math.min(current, ...siblingValues, 0) - 1;
}

export function changeElementStacking(el: HTMLElement, action: StackAction): number | null {
  const id = el.dataset.vleId;
  if (!id || el.dataset.vleClassMode !== 'static') return null;

  const siblings = el.parentElement
    ? [...el.parentElement.children].filter((candidate) => candidate !== el && candidate.hasAttribute('data-vle-id'))
    : [];
  const next = nextStackingIndex(numericZIndex(el), siblings.map(numericZIndex), action);
  const edits: { category: 'z-index' | 'position-mode'; tokens: string[] }[] = [
    { category: 'z-index', tokens: [next < 0 ? `-z-[${Math.abs(next)}]` : `z-[${next}]`] },
  ];

  captureElementBaseline(id);
  const style = getComputedStyle(el);
  const parentDisplay = el.parentElement ? getComputedStyle(el.parentElement).display : '';
  const isFlexOrGridItem = ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(parentDisplay);
  if (style.position === 'static' && !isFlexOrGridItem) {
    el.style.position = 'relative';
    edits.unshift({ category: 'position-mode', tokens: ['relative'] });
  }
  el.style.zIndex = String(next);
  stageClassTokenBatch(id, edits);
  return next;
}
