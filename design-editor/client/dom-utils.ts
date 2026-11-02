// Pure DOM measurement/positioning helpers used while dragging/resizing. No React,
// no source-patching — this only ever touches live inline styles for the in-browser
// preview; the resulting numbers get turned into staged Tailwind classes by callers.
import { preferredTargetForSourceId } from './element-targets';

export function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function isFlexOrGrid(el: Element): boolean {
  const d = getComputedStyle(el).display;
  return d === 'flex' || d === 'inline-flex' || d === 'grid' || d === 'inline-grid';
}

export function isFlexParent(el: Element | null): boolean {
  return !!el && isFlexOrGrid(el);
}

export interface Basis {
  widthPx: number;
  heightPx: number;
  widthReliable: boolean;
  heightReliable: boolean;
}

/**
 * Percentage top/left/width/height only resolve correctly against a containing
 * block whose own box doesn't itself depend on the element being measured (the
 * classic CSS "percentage height needs an explicit-height ancestor" gotcha, and
 * the same failure mode for width on shrink-to-fit containers). Detect it by
 * briefly forcing the element out of flow and checking whether the parent's
 * rendered box actually held steady.
 */
export function probeBasis(el: HTMLElement, parent: HTMLElement): Basis {
  const beforeW = parent.clientWidth;
  const beforeH = parent.clientHeight;
  const prev = { position: el.style.position, top: el.style.top, left: el.style.left, width: el.style.width, height: el.style.height };

  el.style.position = 'absolute';
  const afterW = parent.clientWidth;
  const afterH = parent.clientHeight;

  el.style.position = prev.position;
  el.style.top = prev.top;
  el.style.left = prev.left;
  el.style.width = prev.width;
  el.style.height = prev.height;

  return {
    widthPx: afterW,
    heightPx: afterH,
    widthReliable: beforeW > 0 && afterW >= beforeW * 0.9,
    heightReliable: beforeH > 0 && afterH >= beforeH * 0.9,
  };
}

/** Formats a pixel measurement as a Tailwind arbitrary-value token body
 *  ("42.3%" or "212px"), given the probed basis for that axis. */
export function formatMeasurement(valuePx: number, basisPx: number, reliable: boolean): string {
  if (reliable && basisPx > 0) return `${round((valuePx / basisPx) * 100, 1)}%`;
  return `${Math.round(valuePx)}px`;
}

export interface PromoteResult {
  offsetParent: HTMLElement;
  parentNeedsRelative: boolean;
  promotedFromFlow: boolean;
  frozenTop: number;
  frozenLeft: number;
  frozenWidth: number;
  frozenHeight: number;
}

/** Freezes the element's current rendered position/size as absolute-positioned
 *  inline styles with zero visual jump (no-op measurement-only if it's already
 *  absolute/fixed). Promotes the offsetParent to `relative` too if it wasn't
 *  positioned, since an unpositioned parent would otherwise change what the new
 *  absolute child measures against. */
export function promoteToAbsolute(el: HTMLElement): PromoteResult | null {
  const parent = el.offsetParent as HTMLElement | null;
  if (!parent) return null;

  const top = el.offsetTop;
  const left = el.offsetLeft;
  const width = el.offsetWidth;
  const height = el.offsetHeight;

  const alreadyPositioned = ['absolute', 'fixed'].includes(getComputedStyle(el).position);
  if (!alreadyPositioned) {
    // offsetTop/Left already account for any margin's effect on position, so the
    // margin must be zeroed or the frozen coordinates would double-apply it.
    el.style.position = 'absolute';
    el.style.margin = '0';
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
  }

  const parentNeedsRelative = getComputedStyle(parent).position === 'static';
  if (parentNeedsRelative) parent.style.position = 'relative';

  return {
    offsetParent: parent,
    parentNeedsRelative,
    promotedFromFlow: !alreadyPositioned,
    frozenTop: top,
    frozenLeft: left,
    frozenWidth: width,
    frozenHeight: height,
  };
}

export function getVleId(el: Element | null): string | null {
  return el instanceof HTMLElement ? el.dataset.vleId ?? null : null;
}

export function findTaggedAncestor(el: Element | null): HTMLElement | null {
  return el instanceof Element ? (el.closest('[data-vle-id]') as HTMLElement | null) : null;
}

export function queryByVleId(id: string): HTMLElement | null {
  const preferred = preferredTargetForSourceId(id);
  if (preferred) return preferred;
  const escaped = id.replace(/["\\]/g, '\\$&');
  return document.querySelector(`[data-vle-id="${escaped}"]`);
}

export function getEditableDirectTextNode(el: HTMLElement): Text | null {
  const nodes = [...el.childNodes].filter(
    (node): node is Text => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim().length > 0,
  );
  return nodes.length === 1 ? nodes[0] : null;
}

export function canEditDirectText(el: HTMLElement): boolean {
  const mode = el.dataset.vleTextMode;
  return (mode === 'text' || mode === 'mixed') && !!getEditableDirectTextNode(el);
}

export function readRotationDegrees(el: HTMLElement | null): number {
  if (!el) return 0;
  const inline = el.style.rotate;
  const computed = getComputedStyle(el).rotate;
  const raw = inline && inline !== 'none' ? inline : computed;
  const degMatch = raw.match(/(-?\d+(?:\.\d+)?)deg/);
  if (degMatch) return Number(degMatch[1]);

  const matrixMatch = getComputedStyle(el).transform.match(/^matrix\(([^,]+),\s*([^,]+)/);
  if (!matrixMatch) return 0;
  const a = Number(matrixMatch[1]);
  const b = Number(matrixMatch[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.atan2(b, a) * (180 / Math.PI);
}

export function rgbStringToHex(rgb: string): string {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  const [, r, g, b] = m;
  return `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`;
}
