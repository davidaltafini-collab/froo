import React from 'react';
import { classifyElement, parentLayoutFor } from './layout-classifier';
import { queryByVleId } from './dom-utils';
import { useDesignModeStore } from './store';

const Z = 2147482998;
const OWN_ROOT_ID = 'design-editor-root';

interface GapGuide {
  key: string;
  orientation: 'h' | 'v';
  start: number;
  end: number;
  cross: number;
  label: string;
  kind: 'padding' | 'gap' | 'equal' | 'outlier';
}

const COLORS: Record<GapGuide['kind'], { line: string; badge: string; text: string }> = {
  padding: { line: '#f59e0b', badge: '#fef3c7', text: '#b45309' },
  gap: { line: '#0ea5e9', badge: '#e0f2fe', text: '#0369a1' },
  equal: { line: '#8b5cf6', badge: '#ede9fe', text: '#6d28d9' },
  outlier: { line: '#f43f5e', badge: '#ffe4e6', text: '#be123c' },
};

function visibleTaggedChildren(parent: HTMLElement, excluded?: HTMLElement): HTMLElement[] {
  const ownRoot = document.getElementById(OWN_ROOT_ID);
  return [...parent.children]
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter((child) => child !== excluded && !!child.dataset.vleId && !ownRoot?.contains(child))
    .filter((child) => getComputedStyle(child).display !== 'none');
}

function rounded(px: number): number {
  return Math.round(Math.max(0, px));
}

function paddingGuides(container: HTMLElement): GapGuide[] {
  const rect = container.getBoundingClientRect();
  const style = getComputedStyle(container);
  const top = Number.parseFloat(style.paddingTop) || 0;
  const right = Number.parseFloat(style.paddingRight) || 0;
  const bottom = Number.parseFloat(style.paddingBottom) || 0;
  const left = Number.parseFloat(style.paddingLeft) || 0;
  const crossX = rect.left + Math.min(rect.width / 2, Math.max(left + 10, 24));
  const crossY = rect.top + Math.min(rect.height / 2, Math.max(top + 10, 24));
  return [
    { key: 'padding-top', orientation: 'v', start: rect.top, end: rect.top + top, cross: crossX, label: `Top ${rounded(top)}`, kind: 'padding' },
    { key: 'padding-bottom', orientation: 'v', start: rect.bottom - bottom, end: rect.bottom, cross: crossX, label: `Bottom ${rounded(bottom)}`, kind: 'padding' },
    { key: 'padding-left', orientation: 'h', start: rect.left, end: rect.left + left, cross: crossY, label: `Left ${rounded(left)}`, kind: 'padding' },
    { key: 'padding-right', orientation: 'h', start: rect.right - right, end: rect.right, cross: crossY, label: `Right ${rounded(right)}`, kind: 'padding' },
  ].filter((guide) => guide.end - guide.start >= 2) as GapGuide[];
}

function commonRhythm(values: number[]): number | null {
  if (values.length < 2) return null;
  const buckets = new Map<number, number>();
  for (const value of values) {
    const roundedValue = Math.round(value);
    buckets.set(roundedValue, (buckets.get(roundedValue) ?? 0) + 1);
  }
  return [...buckets.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null;
}

function repeatedChildGaps(container: HTMLElement): GapGuide[] {
  const children = visibleTaggedChildren(container).map((el) => ({ el, rect: el.getBoundingClientRect() }));
  if (children.length < 2) return [];
  const layout = parentLayoutFor(container);
  const horizontal = layout === 'flex-row';
  const ordered = [...children].sort((a, b) => horizontal ? a.rect.left - b.rect.left : a.rect.top - b.rect.top);
  const measurements = ordered.slice(0, -1).map((item, index) => {
    const next = ordered[index + 1];
    const value = horizontal ? next.rect.left - item.rect.right : next.rect.top - item.rect.bottom;
    return { item, next, value };
  });
  const rhythm = commonRhythm(measurements.map((measurement) => measurement.value));
  return measurements
    .filter(({ value }) => value > 1)
    .map(({ item, next, value }, index) => {
      const equal = rhythm != null && Math.abs(value - rhythm) <= 1;
      const kind: GapGuide['kind'] = rhythm == null ? 'gap' : equal ? 'equal' : 'outlier';
      const label = rhythm != null && !equal ? `${rounded(value)} → ${rhythm}` : `${rounded(value)}px${equal ? ' equal' : ''}`;
      return horizontal
        ? { key: `child-gap-x-${index}`, orientation: 'h', start: item.rect.right, end: next.rect.left, cross: Math.min(item.rect.bottom, next.rect.bottom) - 8, label, kind }
        : { key: `child-gap-y-${index}`, orientation: 'v', start: item.rect.bottom, end: next.rect.top, cross: Math.min(item.rect.right, next.rect.right) - 8, label, kind };
    });
}

function adjacentGaps(selected: HTMLElement): GapGuide[] {
  const parent = selected.parentElement;
  if (!parent) return [];
  const rect = selected.getBoundingClientRect();
  const siblings = visibleTaggedChildren(parent, selected).map((el) => ({ el, rect: el.getBoundingClientRect() }));
  const above = siblings.filter((item) => item.rect.bottom <= rect.top).sort((a, b) => b.rect.bottom - a.rect.bottom)[0];
  const below = siblings.filter((item) => item.rect.top >= rect.bottom).sort((a, b) => a.rect.top - b.rect.top)[0];
  const left = siblings.filter((item) => item.rect.right <= rect.left).sort((a, b) => b.rect.right - a.rect.right)[0];
  const right = siblings.filter((item) => item.rect.left >= rect.right).sort((a, b) => a.rect.left - b.rect.left)[0];
  const guides: GapGuide[] = [];
  if (above) guides.push({ key: 'gap-above', orientation: 'v', start: above.rect.bottom, end: rect.top, cross: rect.left + rect.width / 2, label: `Above ${rounded(rect.top - above.rect.bottom)}px`, kind: 'gap' });
  if (below) guides.push({ key: 'gap-below', orientation: 'v', start: rect.bottom, end: below.rect.top, cross: rect.left + rect.width / 2, label: `Below ${rounded(below.rect.top - rect.bottom)}px`, kind: 'gap' });
  if (left) guides.push({ key: 'gap-left', orientation: 'h', start: left.rect.right, end: rect.left, cross: rect.top + rect.height / 2, label: `${rounded(rect.left - left.rect.right)}px`, kind: 'gap' });
  if (right) guides.push({ key: 'gap-right', orientation: 'h', start: rect.right, end: right.rect.left, cross: rect.top + rect.height / 2, label: `${rounded(right.rect.left - rect.right)}px`, kind: 'gap' });
  return guides.filter((guide) => guide.end - guide.start > 2);
}

function buildGuides(selected: HTMLElement, override: import('../shared-types').LayoutOverride): GapGuide[] {
  const kind = classifyElement(selected, override).kind;
  // Measurements are strictly scoped to the selection. A selected container
  // owns its padding; it does not implicitly select and measure its children.
  if (kind === 'container') return paddingGuides(selected);
  if (kind === 'section') return adjacentGaps(selected);
  return adjacentGaps(selected);
}

function Guide({ guide }: { guide: GapGuide }) {
  const colors = COLORS[guide.kind];
  const mid = (guide.start + guide.end) / 2;
  const length = guide.end - guide.start;
  const common: React.CSSProperties = { position: 'fixed', background: colors.line, pointerEvents: 'none' };
  const badge: React.CSSProperties = {
    position: 'fixed', borderRadius: 5, border: `1px solid ${colors.line}33`, background: colors.badge,
    color: colors.text, padding: '2px 5px', fontSize: 10, fontWeight: 750, lineHeight: '14px',
    whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(15,23,42,0.08)', pointerEvents: 'none',
  };
  if (guide.orientation === 'v') {
    return (
      <>
        <div style={{ ...common, left: guide.cross, top: guide.start, width: 1, height: length }} />
        <div style={{ ...common, left: guide.cross - 4, top: guide.start, width: 9, height: 1 }} />
        <div style={{ ...common, left: guide.cross - 4, top: guide.end, width: 9, height: 1 }} />
        <div style={{ ...badge, left: guide.cross + 6, top: mid, transform: 'translateY(-50%)' }}>{guide.label}</div>
      </>
    );
  }
  return (
    <>
      <div style={{ ...common, left: guide.start, top: guide.cross, width: length, height: 1 }} />
      <div style={{ ...common, left: guide.start, top: guide.cross - 4, width: 1, height: 9 }} />
      <div style={{ ...common, left: guide.end, top: guide.cross - 4, width: 1, height: 9 }} />
      <div style={{ ...badge, left: mid, top: guide.cross + 6, transform: 'translateX(-50%)' }}>{guide.label}</div>
    </>
  );
}

export function SpacingGuides() {
  const state = useDesignModeStore();
  const [, forceTick] = React.useState(0);

  React.useEffect(() => {
    if (!state.active || !state.smartSpacing) return;
    const id = requestAnimationFrame(() => forceTick((tick) => tick + 1));
    return () => cancelAnimationFrame(id);
  });

  if (!state.active || !state.smartSpacing || state.selectedIds.length !== 1) return null;
  const selected = queryByVleId(state.selectedIds[0]);
  if (!selected) return null;
  const guides = buildGuides(selected, state.layoutOverrides[state.selectedIds[0]] ?? 'auto');

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: Z }}>
      {guides.map((guide) => <Guide key={guide.key} guide={guide} />)}
    </div>
  );
}
