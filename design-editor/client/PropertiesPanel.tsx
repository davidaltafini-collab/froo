// Figma-like side panel for the current selection. Single-select gets position/size
// (X/Y/W/H) and text editing on top of the shared style controls; multi-select gets
// only the shared style controls (group resize is out of v1 scope — see the plan).
import React from 'react';
import { applyClassEdit, collapsesMultipleTokens } from '../class-algebra';
import type { ClassCategory } from '../shared-types';
import { altFromFileName, uploadDesignAsset } from './assets';
import { stageMoveClasses, stageParentRelativeIfNeeded, stageResizeClasses, stageRotationClass } from './commit';
import { canEditDirectText, getEditableDirectTextNode, isFlexParent, probeBasis, promoteToAbsolute, queryByVleId, rgbStringToHex } from './dom-utils';
import { downloadElementAsSvg, getSvgRoundTripTarget, type AffinityExportMode } from './export-svg';
import { classifyElement, layoutKindLabel, parentLayoutFor } from './layout-classifier';
import { previewAssetReplacement } from './replacement-preview';
import { changeElementStacking, numericZIndex, type StackAction } from './stacking';
import { captureElementBaseline, select, setInlineEditing, setLayoutOverride, setSwapArmed, stageAssetReplacement, stageClassTokenBatch, stageClassTokens, stageText, useDesignModeStore } from './store';

interface Capabilities {
  classMode: 'static' | 'dynamic';
  textMode: 'text' | 'mixed' | 'none';
}

function getCapabilities(el: HTMLElement): Capabilities {
  return {
    classMode: el.dataset.vleClassMode === 'static' ? 'static' : 'dynamic',
    textMode: (el.dataset.vleTextMode as Capabilities['textMode']) ?? 'none',
  };
}

function applyStyleToSelection(
  ids: string[],
  category: ClassCategory,
  token: string,
  previewApply: (el: HTMLElement) => void,
): string[] {
  const warnings: string[] = [];
  for (const id of ids) {
    const el = queryByVleId(id);
    if (!el) continue;
    if (getCapabilities(el).classMode !== 'static') {
      warnings.push(`Skipped one element — its className isn't a plain string, can't be patched safely.`);
      continue;
    }
    const preview = applyClassEdit(el.className, [token], [category]);
    const collapsed = collapsesMultipleTokens(preview);
    if (collapsed.length) {
      warnings.push(`Replacing ${preview.removedByCategory[category]} existing custom values on one element.`);
    }
    captureElementBaseline(id);
    previewApply(el);
    stageClassTokens(id, category, [token], true);
  }
  return warnings;
}

function NumberField({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = React.useState(String(Math.round(value)));
  React.useEffect(() => setDraft(String(Math.round(value))), [value]);
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-slate-600">
      <span className="w-6 shrink-0 font-semibold text-slate-400">{label}</span>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = Number(draft);
          if (Number.isFinite(n)) onCommit(n);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1 text-right text-xs tabular-nums focus:border-green-500 focus:outline-none"
      />
    </label>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <ul className="space-y-1 rounded-md bg-amber-50 p-2 text-[10px] leading-snug text-amber-700">
      {warnings.map((w, i) => (
        <li key={i}>{w}</li>
      ))}
    </ul>
  );
}

function readRotationDegrees(el: HTMLElement | null): number {
  if (!el) return 0;
  const inline = el.style.rotate;
  const computed = getComputedStyle(el).rotate;
  const raw = inline && inline !== 'none' ? inline : computed;
  const match = raw.match(/(-?\d+(?:\.\d+)?)deg/);
  return match ? Number(match[1]) : 0;
}

function findContainingSection(el: HTMLElement): HTMLElement | null {
  let current = el.parentElement;
  while (current && current.id !== 'design-editor-root') {
    if (current.dataset.vleId && classifyElement(current).kind === 'section') return current;
    current = current.parentElement;
  }
  return null;
}

interface SectionSpacing {
  above: number | null;
  below: number | null;
}

interface RowRhythm {
  sourceId: string;
  visualGap: number;
  cssGap: number;
  justifyToken: string | null;
}

function visibleFlowChildren(container: HTMLElement): HTMLElement[] {
  return [...container.children].filter((child): child is HTMLElement => {
    if (!(child instanceof HTMLElement) || !child.dataset.vleId) return false;
    const style = getComputedStyle(child);
    return style.display !== 'none' && !['absolute', 'fixed'].includes(style.position);
  });
}

function measuredRowGap(container: HTMLElement): number | null {
  const children = visibleFlowChildren(container)
    .map((child) => child.getBoundingClientRect())
    .sort((a, b) => a.left - b.left);
  if (children.length < 2) return null;
  const gaps = children.slice(0, -1)
    .map((rect, index) => children[index + 1].left - rect.right)
    .filter((gap) => gap >= 0);
  if (!gaps.length) return null;
  return Math.round(gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)]);
}

function justifyTokenFor(value: string): string | null {
  const tokenByValue: Record<string, string> = {
    normal: 'justify-normal',
    'flex-start': 'justify-start',
    start: 'justify-start',
    'flex-end': 'justify-end',
    end: 'justify-end',
    center: 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
    stretch: 'justify-stretch',
  };
  return tokenByValue[value] ?? null;
}

function findRowRhythmAbove(container: HTMLElement): RowRhythm | null {
  const layout = parentLayoutFor(container);
  if (!['flex-row', 'flex-wrap', 'grid'].includes(layout)) return null;
  const rect = container.getBoundingClientRect();
  const childCount = visibleFlowChildren(container).length;
  if (childCount < 2) return null;

  const candidates = [...document.querySelectorAll<HTMLElement>('[data-vle-id]')]
    .filter((candidate) => candidate !== container && !candidate.contains(container) && !container.contains(candidate))
    .map((candidate) => {
      const candidateRect = candidate.getBoundingClientRect();
      const candidateLayout = parentLayoutFor(candidate);
      const candidateChildren = visibleFlowChildren(candidate);
      const visualGap = measuredRowGap(candidate);
      if (
        !['flex-row', 'flex-wrap', 'grid'].includes(candidateLayout) ||
        candidateChildren.length < 2 ||
        visualGap == null ||
        candidateRect.bottom > rect.top + 1 ||
        candidateRect.width < rect.width * 0.6
      ) return null;
      const style = getComputedStyle(candidate);
      const rawGap = Number.parseFloat(style.columnGap === 'normal' ? style.gap : style.columnGap);
      return {
        sourceId: candidate.dataset.vleId!,
        visualGap,
        cssGap: Number.isFinite(rawGap) ? Math.max(0, Math.round(rawGap)) : 0,
        justifyToken: candidateLayout.startsWith('flex') ? justifyTokenFor(style.justifyContent) : null,
        score: Math.max(0, rect.top - candidateRect.bottom) + Math.abs(childCount - candidateChildren.length) * 80,
      };
    })
    .filter((candidate): candidate is RowRhythm & { score: number } => !!candidate)
    .sort((a, b) => a.score - b.score);
  const best = candidates[0];
  if (!best) return null;
  return { sourceId: best.sourceId, visualGap: best.visualGap, cssGap: best.cssGap, justifyToken: best.justifyToken };
}

function measureSectionSpacing(el: HTMLElement): SectionSpacing {
  const visibleFlowSibling = (candidate: Element | null, direction: 'previous' | 'next'): HTMLElement | null => {
    let current = candidate;
    while (current) {
      if (current instanceof HTMLElement) {
        const style = getComputedStyle(current);
        if (current.dataset.vleId && style.display !== 'none' && !['absolute', 'fixed'].includes(style.position)) return current;
      }
      current = direction === 'previous' ? current.previousElementSibling : current.nextElementSibling;
    }
    return null;
  };

  const previous = visibleFlowSibling(el.previousElementSibling, 'previous');
  const next = visibleFlowSibling(el.nextElementSibling, 'next');
  const rect = el.getBoundingClientRect();
  return {
    above: previous ? Math.max(0, Math.round(rect.top - previous.getBoundingClientRect().bottom)) : null,
    below: next ? Math.max(0, Math.round(next.getBoundingClientRect().top - rect.bottom)) : null,
  };
}

export function PropertiesPanel() {
  const state = useDesignModeStore();
  const [panelOpen, setPanelOpen] = React.useState(() => typeof window === 'undefined' || window.innerWidth >= 1100);
  const [, forceTick] = React.useState(0);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [exportingSvg, setExportingSvg] = React.useState<AffinityExportMode | null>(null);
  const replaceInputRef = React.useRef<HTMLInputElement | null>(null);

  // Keep displayed px values (offsetWidth/Top/...) fresh while the panel is open.
  React.useEffect(() => {
    const id = setInterval(() => forceTick((t) => (t + 1) % 1_000_000), 200);
    return () => clearInterval(id);
  }, []);

  if (!state.active || state.selectedIds.length === 0) return null;

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed right-3 top-3 z-[2147483001] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-lg"
      >
        Properties
      </button>
    );
  }

  const ids = state.selectedIds;
  const single = ids.length === 1 ? queryByVleId(ids[0]) : null;
  const singleCaps = single ? getCapabilities(single) : null;
  const singleHtml = single instanceof HTMLElement ? single : null;
  const editableDirectText = singleHtml && canEditDirectText(singleHtml) ? getEditableDirectTextNode(singleHtml) : null;
  const layoutOverride = ids.length === 1 ? state.layoutOverrides[ids[0]] ?? 'auto' : 'auto';
  const classification = singleHtml ? classifyElement(singleHtml, layoutOverride) : null;
  const containingSection = singleHtml && classification?.kind !== 'section' ? findContainingSection(singleHtml) : null;
  const sectionSpacing = singleHtml && classification?.kind === 'section' ? measureSectionSpacing(singleHtml) : null;
  const rowRhythm = singleHtml && classification?.kind === 'container' ? findRowRhythmAbove(singleHtml) : null;

  const runStyleEdit = (category: ClassCategory, token: string, previewApply: (el: HTMLElement) => void) => {
    const w = applyStyleToSelection(ids, category, token, previewApply);
    setWarnings(w);
  };

  const handleStacking = (action: StackAction) => {
    if (!singleHtml) return;
    const next = changeElementStacking(singleHtml, action);
    setWarnings(next == null ? ['This layer has a dynamic className, so its stack order cannot be saved safely.'] : [`Layer stack set to ${next}.`]);
  };

  const setSectionSpaceAbove = (value: number) => {
    const px = Math.max(0, Math.round(value));
    runStyleEdit('margin-top', `mt-[${px}px]`, (el) => {
      el.style.marginTop = `${px}px`;
    });
  };

  const matchRowAbove = () => {
    if (!single || !rowRhythm || singleCaps?.classMode !== 'static') return;
    const id = single.dataset.vleId;
    if (!id) return;
    captureElementBaseline(id);
    single.style.gap = `${rowRhythm.cssGap}px`;
    const edits: { category: ClassCategory; tokens: string[] }[] = [
      { category: 'gap', tokens: [`gap-[${rowRhythm.cssGap}px]`] },
    ];
    if (rowRhythm.justifyToken) {
      const justifyValues: Record<string, string> = {
        'justify-normal': 'normal',
        'justify-start': 'flex-start',
        'justify-end': 'flex-end',
        'justify-center': 'center',
        'justify-between': 'space-between',
        'justify-around': 'space-around',
        'justify-evenly': 'space-evenly',
        'justify-stretch': 'stretch',
      };
      single.style.justifyContent = justifyValues[rowRhythm.justifyToken] ?? '';
      edits.push({ category: 'justify-content', tokens: [rowRhythm.justifyToken] });
    }
    stageClassTokenBatch(id, edits);
  };

  const handleMove = (axis: 'x' | 'y', v: number) => {
    if (!single || (state.smartSpacing && classification?.kind !== 'absolute-layer')) return;
    const id = single.dataset.vleId;
    if (id) captureElementBaseline(id);
    const parentId = (single.offsetParent as HTMLElement | null)?.dataset.vleId;
    if (parentId) captureElementBaseline(parentId);
    const promoted = promoteToAbsolute(single);
    if (!promoted) return;
    const basis = probeBasis(single, promoted.offsetParent);
    const top = axis === 'y' ? v : promoted.frozenTop;
    const left = axis === 'x' ? v : promoted.frozenLeft;
    single.style.top = `${top}px`;
    single.style.left = `${left}px`;
    if (!id) return;
    stageMoveClasses(id, top, left, promoted.frozenWidth, promoted.frozenHeight, basis);
    if (promoted.promotedFromFlow) stageClassTokens(id, 'margin', ['m-0'], false);
    stageParentRelativeIfNeeded(promoted);
  };

  const handleCenterHorizontal = () => {
    if (!single || singleCaps?.classMode !== 'static') return;
    const parent = (state.smartSpacing ? single.parentElement : single.offsetParent) as HTMLElement | null;
    if (!parent) return;

    const rect = single.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const parentStyle = getComputedStyle(parent);
    const contentLeft = parentRect.left + (Number.parseFloat(parentStyle.borderLeftWidth) || 0) + (Number.parseFloat(parentStyle.paddingLeft) || 0);
    const contentRight = parentRect.right - (Number.parseFloat(parentStyle.borderRightWidth) || 0) - (Number.parseFloat(parentStyle.paddingRight) || 0);
    const delta = (contentLeft + contentRight) / 2 - (rect.left + rect.width / 2);
    if (Math.abs(delta) < 0.5) return;

    const id = single.dataset.vleId;
    if (!id) return;
    captureElementBaseline(id);
    const computed = getComputedStyle(single);
    const isLayer = !state.smartSpacing || ['absolute', 'fixed'].includes(computed.position);
    if (isLayer) {
      const parentId = (single.offsetParent as HTMLElement | null)?.dataset.vleId;
      if (parentId) captureElementBaseline(parentId);
      const promoted = promoteToAbsolute(single);
      if (!promoted) return;
      const basis = probeBasis(single, promoted.offsetParent);
      const left = promoted.frozenLeft + delta;
      single.style.left = `${left}px`;
      stageMoveClasses(id, promoted.frozenTop, left, promoted.frozenWidth, promoted.frozenHeight, basis);
      if (promoted.promotedFromFlow) stageClassTokens(id, 'margin', ['m-0'], false);
      stageParentRelativeIfNeeded(promoted);
      return;
    }

    const top = Number.isFinite(Number.parseFloat(computed.top)) ? Number.parseFloat(computed.top) : 0;
    const left = (Number.isFinite(Number.parseFloat(computed.left)) ? Number.parseFloat(computed.left) : 0) + delta;
    single.style.position = 'relative';
    single.style.top = `${top}px`;
    single.style.left = `${left}px`;
    stageClassTokenBatch(id, [
      { category: 'position-mode', tokens: ['relative'] },
      { category: 'position-offset', tokens: [`top-[${Math.round(top)}px]`, `left-[${Math.round(left)}px]`] },
    ]);
  };

  const handleResize = (axis: 'w' | 'h', v: number) => {
    if (!single) return;
    const id = single.dataset.vleId;
    if (id) captureElementBaseline(id);
    const width = axis === 'w' ? v : single.offsetWidth;
    const height = axis === 'h' ? v : single.offsetHeight;
    single.style.width = `${width}px`;
    single.style.height = `${height}px`;
    const parent = single.offsetParent as HTMLElement | null;
    if (!parent) return;
    const basis = probeBasis(single, parent);
    const staysFlexChild = isFlexParent(single.parentElement) && getComputedStyle(single).position === 'static';
    if (!id) return;
    stageResizeClasses(id, width, height, basis, staysFlexChild);
  };

  const handleRotate = (degrees: number) => {
    if (!single) return;
    const id = single.dataset.vleId;
    if (!id) return;
    captureElementBaseline(id);
    single.style.rotate = `${degrees}deg`;
    stageRotationClass(id, degrees);
  };

  const handleReplaceFile = async (file: File | undefined) => {
    if (!single || !file) return;
    try {
      const replacementTarget = getSvgRoundTripTarget(single);
      const uploaded = await uploadDesignAsset(file);
      const id = replacementTarget.dataset.vleId;
      if (id) captureElementBaseline(id);
      previewAssetReplacement(replacementTarget, uploaded.objectUrl);
      const instanceIndex = replacementTarget.dataset.vleInstance;
      if (id) {
        stageAssetReplacement(
          id,
          uploaded.asset,
          altFromFileName(file.name),
          uploaded.objectUrl,
          instanceIndex == null ? undefined : Number(instanceIndex),
        );
      }
      setWarnings([replacementTarget === single ? 'Replacement staged.' : 'Replacement staged inside the selected spacing wrapper.']);
    } catch (err) {
      setWarnings([(err as Error).message]);
    }
  };

  const handleExportSvg = async (mode: AffinityExportMode) => {
    if (!single || exportingSvg) return;
    setExportingSvg(mode);
    try {
      const result = await downloadElementAsSvg(single, mode);
      setWarnings([
        result.savedPath
          ? `SVG saved here: ${result.savedPath}`
          : `Browser download requested for ${result.fileName}.`,
        'Edit that file in Affinity, then select this same element and choose Replace with edited SVG.',
        ...result.warnings,
      ]);
    } catch (err) {
      setWarnings([(err as Error).message]);
    } finally {
      setExportingSvg(null);
    }
  };

  return (
    <div className="fixed right-3 top-3 bottom-3 z-[2147483001] w-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{ids.length === 1 ? 'Element' : `${ids.length} selected`}</h3>
        <button onClick={() => setPanelOpen(false)} className="flex h-6 w-6 items-center justify-center rounded text-base text-slate-400 hover:bg-slate-100" aria-label="Collapse Properties panel">×</button>
      </div>

      {single && (
        <div className="mb-3 truncate rounded-md bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-400" title={ids[0]}>
          {ids[0]}
        </div>
      )}

      {single && classification && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Movement</div>
              <div className="mt-0.5 text-xs font-bold text-slate-800">{state.smartSpacing ? 'Smart layout' : 'Free move'}</div>
            </div>
            <span className={`rounded-md px-1.5 py-1 text-[9px] font-bold ${state.smartSpacing ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'}`}>
              {layoutKindLabel(classification.kind)}
            </span>
          </div>
          <p className="text-[10px] leading-snug text-slate-600">
            {state.smartSpacing
              ? 'Drag to reorder without breaking the page. Arrow keys nudge 1px; Shift + Arrow nudges 10px.'
              : 'Drag anywhere. The item is detached from page flow and keeps the exact position you choose.'}
          </p>
          {state.smartSpacing && sectionSpacing?.above != null && (
            <div className="mt-3 rounded-lg border border-sky-100 bg-white p-2">
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>Space above</span>
                <span className="tabular-nums text-slate-800">{sectionSpacing.above}px</span>
              </div>
              <NumberField label="Top" value={sectionSpacing.above} onCommit={setSectionSpaceAbove} />
              {sectionSpacing.below != null && sectionSpacing.above !== sectionSpacing.below && (
                <button
                  onClick={() => setSectionSpaceAbove(sectionSpacing.below!)}
                  className="mt-2 w-full rounded-md bg-sky-50 px-2 py-1.5 text-[10px] font-bold text-sky-700 transition-transform duration-150 active:scale-[0.97]"
                >
                  Match space below ({sectionSpacing.below}px)
                </button>
              )}
            </div>
          )}
          {state.smartSpacing && rowRhythm && (
            <div className="mt-3 rounded-lg border border-violet-100 bg-white p-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>Row above</span>
                <span className="tabular-nums text-slate-800">{rowRhythm.visualGap}px visual gap</span>
              </div>
              <button
                onClick={matchRowAbove}
                className="mt-2 w-full rounded-md bg-violet-50 px-2 py-1.5 text-[10px] font-bold text-violet-700 transition-transform duration-150 active:scale-[0.97]"
                title={`Copy gap and distribution from ${rowRhythm.sourceId}`}
              >
                Follow row above spacing
              </button>
            </div>
          )}
          {containingSection?.dataset.vleId && (
            <button
              onClick={() => select(containingSection.dataset.vleId!, false)}
              className="mt-2 w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50"
            >
              Select containing section
            </button>
          )}
          <details className="mt-2 border-t border-slate-200 pt-2">
            <summary className="cursor-pointer text-[10px] font-semibold text-slate-500">Advanced element type</summary>
            <select
              value={layoutOverride}
              onChange={(e) => setLayoutOverride(ids[0], e.target.value as import('../shared-types').LayoutOverride)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
              aria-label="Advanced element type override"
            >
              <option value="auto">Automatic ({layoutKindLabel(classification.kind)})</option>
              <option value="layer">Free-positioned layer</option>
              <option value="flow-item">Item in a row or column</option>
              <option value="section">Whole page section</option>
              <option value="container">Container</option>
            </select>
            <p className="mt-2 text-[10px] leading-snug text-slate-500">{classification.reasons.join('. ')}.</p>
          </details>
        </div>
      )}

      {single && classification?.allowedOperations.includes('swap') && (
        <div className="mb-4 border-b border-slate-100 pb-4">
          <button
            onClick={() => setSwapArmed(state.swapArmedId === ids[0] ? null : ids[0])}
            className={`w-full rounded-lg border px-3 py-2 text-xs font-bold transition-transform duration-150 active:scale-[0.98] ${
              state.swapArmedId === ids[0]
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'
            }`}
          >
            {state.swapArmedId === ids[0] ? 'Now click a sibling to swap' : 'Swap position with...'}
          </button>
          {state.swapArmedId === ids[0] && (
            <p className="mt-2 text-[10px] leading-snug text-violet-600">Only two static JSX siblings can be exchanged. Their content, handlers, and styling stay attached to them.</p>
          )}
        </div>
      )}

      {single && (
        <div className="mb-4 border-b border-slate-100 pb-4">
          <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">Affinity round trip</div>
            <p className="mt-1 text-[10px] leading-snug text-emerald-800">
              Exact mode preserves what the browser shows. Editable mode keeps separate vector objects but may render differently in Affinity.
            </p>
          </div>
          <button
            onClick={() => void handleExportSvg('exact')}
            disabled={exportingSvg !== null}
            className="mb-2 w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-transform duration-150 hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {exportingSvg === 'exact' ? 'Rendering exact SVG…' : 'Export exact for Affinity'}
          </button>
          <button
            onClick={() => void handleExportSvg('editable')}
            disabled={exportingSvg !== null}
            className="mb-2 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm transition-transform duration-150 hover:border-emerald-400 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {exportingSvg === 'editable' ? 'Preparing vector SVG…' : 'Export editable vector version'}
          </button>
          <input
            ref={replaceInputRef}
            type="file"
            accept=".svg,image/*"
            onChange={(e) => {
              void handleReplaceFile(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
            className="hidden"
          />
          <button
            onClick={() => replaceInputRef.current?.click()}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-green-300"
          >
            Replace with edited SVG or image
          </button>
          <p className="mt-2 text-[10px] leading-snug text-slate-500">
            Select the card or section itself before replacing it. Its outer position and click action remain attached.
          </p>
        </div>
      )}

      {single && singleCaps?.classMode === 'dynamic' && (
        <p className="mb-3 rounded-md bg-amber-50 p-2 text-[10px] text-amber-700">
          This element's className is computed dynamically in code — style edits are disabled here to avoid corrupting it.
        </p>
      )}

      {singleHtml && (
        <div className="mb-4 border-b border-slate-100 pb-4">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span>Layer order</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">z {numericZIndex(singleHtml)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleStacking('front')} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:border-green-300">Bring to front</button>
            <button onClick={() => handleStacking('forward')} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:border-green-300">Bring forward</button>
            <button onClick={() => handleStacking('backward')} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:border-green-300">Send backward</button>
            <button onClick={() => handleStacking('back')} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:border-green-300">Send to back</button>
          </div>
        </div>
      )}

      {singleHtml && singleCaps?.classMode === 'static' && (
        <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2 border-b border-slate-100 pb-4">
          {(classification?.kind === 'absolute-layer' || !state.smartSpacing) && <NumberField label="X" value={single.offsetLeft} onCommit={(v) => handleMove('x', v)} />}
          {(classification?.kind === 'absolute-layer' || !state.smartSpacing) && <NumberField label="Y" value={single.offsetTop} onCommit={(v) => handleMove('y', v)} />}
          <NumberField label="W" value={single.offsetWidth} onCommit={(v) => handleResize('w', v)} />
          <NumberField label="H" value={single.offsetHeight} onCommit={(v) => handleResize('h', v)} />
          <NumberField label="Rot" value={readRotationDegrees(single)} onCommit={handleRotate} />
          <button
            onClick={handleCenterHorizontal}
            className="col-span-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 transition-transform duration-150 hover:border-sky-300 active:scale-[0.97]"
            title="Center this element horizontally inside its parent"
          >
            Center horizontally
          </button>
        </div>
      )}

      {single && editableDirectText && (
        <div className="mb-4 block border-b border-slate-100 pb-4 text-xs text-slate-600">
          <span className="mb-1 block font-semibold text-slate-400">Text</span>
          <button
            type="button"
            onClick={() => {
              captureElementBaseline(ids[0]);
              setInlineEditing(ids[0]);
            }}
            className="mb-2 w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-transform duration-150 active:scale-[0.97]"
          >
            Edit directly on canvas
          </button>
          <input
            aria-label="Selected element text"
            defaultValue={editableDirectText.nodeValue ?? ''}
            onBlur={(e) => {
              if (!single) return;
              const id = single.dataset.vleId;
              if (id) captureElementBaseline(id);
              editableDirectText.nodeValue = e.target.value;
              if (id) stageText(id, e.target.value);
            }}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-green-500 focus:outline-none"
          />
        </div>
      )}

      {(!single || single instanceof HTMLElement) && <div className="space-y-3">
        <label className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-400">Background</span>
          <input
            type="color"
            defaultValue={single ? rgbStringToHex(getComputedStyle(single).backgroundColor) : '#ffffff'}
            onChange={(e) => {
              const hex = e.target.value;
              runStyleEdit('background-color', `bg-[${hex}]`, (el) => {
                el.style.backgroundColor = hex;
              });
            }}
            className="h-7 w-10 cursor-pointer rounded border border-slate-200"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-400">Opacity</span>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={single ? Math.round(Number(getComputedStyle(single).opacity) * 100) : 100}
            onChange={(e) => {
              const pct = Number(e.target.value);
              const frac = (pct / 100).toFixed(2);
              runStyleEdit('opacity', `opacity-[${frac}]`, (el) => {
                el.style.opacity = frac;
              });
            }}
            className="w-32"
          />
        </label>

        <NumberField
          label="Rad"
          value={single ? Number.parseFloat(getComputedStyle(single).borderRadius) || 0 : 0}
          onCommit={(n) =>
            runStyleEdit('border-radius', `rounded-[${n}px]`, (el) => {
              el.style.borderRadius = `${n}px`;
            })
          }
        />
        <NumberField
          label="Pad"
          value={single ? Number.parseFloat(getComputedStyle(single).paddingTop) || 0 : 0}
          onCommit={(n) =>
            runStyleEdit('padding', `p-[${n}px]`, (el) => {
              el.style.padding = `${n}px`;
            })
          }
        />
        {classification?.kind === 'container' && (
          <NumberField
            label="Gap"
            value={single ? Number.parseFloat(getComputedStyle(single).gap) || 0 : 0}
            onCommit={(n) =>
              runStyleEdit('gap', `gap-[${n}px]`, (el) => {
                el.style.gap = `${n}px`;
              })
            }
          />
        )}
        <NumberField
          label="Mar"
          value={single ? Number.parseFloat(getComputedStyle(single).marginTop) || 0 : 0}
          onCommit={(n) =>
            runStyleEdit('margin', `m-[${n}px]`, (el) => {
              el.style.margin = `${n}px`;
            })
          }
        />
      </div>}

      <div className="mt-3">
        <WarningList warnings={warnings} />
      </div>
    </div>
  );
}
