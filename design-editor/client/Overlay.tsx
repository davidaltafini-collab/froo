// Top-level design-mode chrome: the on/off toggle, the document-capture-phase
// hover/click interceptor (mirrors the app's own capture-phase listener pattern
// in src/App.tsx for haptic feedback, so selecting something in the tool doesn't
// also fire the app's real onClick), and the save/undo/redo toolbar.
import React from 'react';
import { applyClassEdit } from '../class-algebra';
import type { ClassCategory } from '../shared-types';
import { altFromFileName, uploadDesignAsset } from './assets';
import { stageMoveClasses, stageParentRelativeIfNeeded } from './commit';
import { canEditDirectText, findTaggedAncestor, formatMeasurement, getEditableDirectTextNode, probeBasis, promoteToAbsolute, queryByVleId } from './dom-utils';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { AiEditDrawer } from './AiEditDrawer';
import { InlineTextEditor } from './InlineTextEditor';
import { RulersOverlay } from './RulersOverlay';
import { saveDesignModeEdits } from './save';
import { registerInlineTextClick, SelectionBox } from './SelectionBox';
import { previewAssetReplacement } from './replacement-preview';
import { SpacingGuides } from './SpacingGuides';
import {
  captureElementBaseline,
  clearSelection,
  getPendingEdits,
  redo,
  select,
  setActive,
  setHovered,
  getSnapshot,
  setInlineEditing,
  setRulers,
  setSwapArmed,
  setSmartSpacing,
  stageAssetInsert,
  stageAssetReplacement,
  stageClassTokenBatch,
  stageClassTokens,
  stageDelete,
  stageSwap,
  undo,
  useDesignModeStore,
} from './store';

const Z = 2147483002;

const OWN_ROOT_ID = 'design-editor-root';
const PASSTHROUGH_SELECTOR = '[data-design-mode-passthrough="true"]';

/** True for clicks/moves landing on the overlay's own toolbar/panel/handles —
 *  those must reach React's normal handlers untouched, not get treated as an
 *  app-element pick or have their propagation stopped. */
function isWithinOwnUI(target: EventTarget | null): boolean {
  const root = document.getElementById(OWN_ROOT_ID);
  return !!root && target instanceof Node && root.contains(target);
}

function isDesignModePassthrough(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(PASSTHROUGH_SELECTOR);
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function deleteSelected(ids: string[]) {
  for (const id of ids) {
    captureElementBaseline(id);
    const el = queryByVleId(id);
    if (el) el.style.display = 'none';
    stageDelete(id, true);
  }
}

function numericPosition(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Keyboard movement is deliberately available in both interaction styles.
 * Smart layout keeps a flow item's original space and applies a small visual
 * offset; Free move detaches it and updates its absolute X/Y position. */
function nudgeSelected(ids: string[], dx: number, dy: number, freeMove: boolean): { moved: number; skipped: number } {
  let moved = 0;
  let skipped = 0;
  for (const id of ids) {
    const el = queryByVleId(id);
    if (!el || el.dataset.vleClassMode !== 'static' || el.dataset.vleSourceMode === 'generated') {
      skipped += 1;
      continue;
    }

    captureElementBaseline(id);
    const computed = getComputedStyle(el);
    const positioned = computed.position === 'absolute' || computed.position === 'fixed';
    if (freeMove || positioned) {
      const parentId = (el.offsetParent as HTMLElement | null)?.dataset.vleId;
      if (parentId) captureElementBaseline(parentId);
      const promoted = promoteToAbsolute(el);
      if (!promoted) {
        skipped += 1;
        continue;
      }
      const basis = probeBasis(el, promoted.offsetParent);
      const top = promoted.frozenTop + dy;
      const left = promoted.frozenLeft + dx;
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      stageMoveClasses(id, top, left, promoted.frozenWidth, promoted.frozenHeight, basis);
      if (promoted.promotedFromFlow) stageClassTokens(id, 'margin', ['m-0'], false);
      stageParentRelativeIfNeeded(promoted);
      moved += 1;
      continue;
    }

    const top = numericPosition(computed.top) + dy;
    const left = numericPosition(computed.left) + dx;
    el.style.position = 'relative';
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    stageClassTokenBatch(id, [
      { category: 'position-mode', tokens: ['relative'] },
      { category: 'position-offset', tokens: [`top-[${Math.round(top)}px]`, `left-[${Math.round(left)}px]`] },
    ]);
    moved += 1;
  }
  return { moved, skipped };
}

function previewInsert(parent: HTMLElement, id: string, objectUrl: string, top: number, left: number, width: number, height: number) {
  const img = document.createElement('img');
  img.dataset.vleId = id;
  img.dataset.vleClassMode = 'static';
  img.dataset.vleTextMode = 'none';
  img.dataset.vlePendingAsset = 'true';
  img.src = objectUrl;
  img.alt = '';
  img.style.position = 'absolute';
  img.style.top = `${top}px`;
  img.style.left = `${left}px`;
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;
  img.style.objectFit = 'contain';
  img.style.userSelect = 'none';
  img.style.zIndex = '1';
  parent.appendChild(img);
}

function tokenValue(token: string, prefix: string): string | null {
  const match = token.match(new RegExp(`^-?${prefix}-\\[(.+)\\]$`));
  if (!match) return null;
  return token.startsWith('-') ? `-${match[1]}` : match[1];
}

function applyPreviewTokens(el: HTMLElement, category: ClassCategory, tokens: string[]) {
  if (category === 'position-mode') {
    const position = tokens.find((token) => ['static', 'relative', 'absolute', 'fixed', 'sticky'].includes(token));
    if (position) el.style.position = position;
  }
  if (category === 'position-offset') {
    for (const token of tokens) {
      const top = tokenValue(token, 'top');
      const left = tokenValue(token, 'left');
      if (top) el.style.top = top;
      if (left) el.style.left = left;
    }
  }
  if (category === 'width') {
    const width = tokens.map((token) => tokenValue(token, 'w')).find(Boolean);
    if (width) el.style.width = width;
  }
  if (category === 'height') {
    const height = tokens.map((token) => tokenValue(token, 'h')).find(Boolean);
    if (height) el.style.height = height;
  }
  if (category === 'background-color') {
    const color = tokens.map((token) => tokenValue(token, 'bg')).find(Boolean);
    if (color) el.style.backgroundColor = color;
  }
  if (category === 'opacity') {
    const opacity = tokens.map((token) => tokenValue(token, 'opacity')).find(Boolean);
    if (opacity) el.style.opacity = opacity;
  }
  if (category === 'z-index') {
    const zIndex = tokens.map((token) => tokenValue(token, 'z')).find(Boolean);
    if (zIndex) el.style.zIndex = zIndex;
  }
  if (category === 'border-radius') {
    const radius = tokens.map((token) => tokenValue(token, 'rounded')).find(Boolean);
    if (radius) el.style.borderRadius = radius;
  }
  if (category === 'padding') {
    const padding = tokens.map((token) => tokenValue(token, 'p')).find(Boolean);
    if (padding) el.style.padding = padding;
  }
  if (category === 'gap') {
    const gap = tokens.map((token) => tokenValue(token, 'gap')).find(Boolean);
    if (gap) el.style.gap = gap;
  }
  if (category === 'justify-content') {
    const token = tokens.find((item) => item.startsWith('justify-'));
    const values: Record<string, string> = {
      'justify-normal': 'normal',
      'justify-start': 'flex-start',
      'justify-end': 'flex-end',
      'justify-center': 'center',
      'justify-between': 'space-between',
      'justify-around': 'space-around',
      'justify-evenly': 'space-evenly',
      'justify-stretch': 'stretch',
    };
    if (token && values[token]) el.style.justifyContent = values[token];
  }
  if (category === 'margin') {
    const margin = tokens.map((token) => tokenValue(token, 'm')).find(Boolean);
    if (margin) el.style.margin = margin;
  }
  if (category === 'margin-top') {
    const marginTop = tokens.map((token) => tokenValue(token, 'mt')).find(Boolean);
    if (marginTop) el.style.marginTop = marginTop;
  }
  if (category === 'rotation') {
    const rotate = tokens.map((token) => tokenValue(token, 'rotate')).find(Boolean);
    if (rotate) el.style.rotate = rotate;
  }
}

function moveElementBefore(id: string, parentId: string | undefined, beforeId: string | null | undefined) {
  if (!parentId) return;
  const el = queryByVleId(id);
  const parent = queryByVleId(parentId);
  if (!el || !parent || el.parentElement !== parent) return;
  const beforeEl = beforeId ? queryByVleId(beforeId) : null;
  if (beforeEl === el || (beforeEl && beforeEl.parentElement !== parent)) return;
  if (el.nextElementSibling === beforeEl) return;
  parent.insertBefore(el, beforeEl);
}

function swapElements(first: HTMLElement, second: HTMLElement): boolean {
  const parent = first.parentElement;
  if (!parent || second.parentElement !== parent || first === second) return false;
  if (first.nextElementSibling === second) {
    parent.insertBefore(second, first);
    return true;
  }
  if (second.nextElementSibling === first) {
    parent.insertBefore(first, second);
    return true;
  }
  const firstNext = first.nextSibling;
  const secondNext = second.nextSibling;
  parent.insertBefore(first, secondNext);
  parent.insertBefore(second, firstNext);
  return true;
}

function syncPreviewDom(state: ReturnType<typeof useDesignModeStore>) {
  const pendingInsertIds = new Set(state.assetInserts.map((insert) => insert.id));
  document.querySelectorAll<HTMLElement>('[data-vle-pending-asset="true"]').forEach((el) => {
    const id = el.dataset.vleId;
    if (!id || !pendingInsertIds.has(id)) el.remove();
  });

  for (const insert of state.assetInserts) {
    const parent = queryByVleId(insert.parentId);
    if (!parent) continue;
    let el = queryByVleId(insert.id) as HTMLImageElement | null;
    if (!el) {
      el = document.createElement('img');
      el.dataset.vleId = insert.id;
      el.dataset.vleClassMode = 'static';
      el.dataset.vleTextMode = 'none';
      el.dataset.vlePendingAsset = 'true';
      parent.appendChild(el);
    }
    el.src = insert.objectUrl;
    el.alt = insert.alt;
    el.className = insert.className;
    el.style.position = 'absolute';
    el.style.top = insert.previewStyle.top;
    el.style.left = insert.previewStyle.left;
    el.style.width = insert.previewStyle.width;
    el.style.height = insert.previewStyle.height;
    el.style.rotate = insert.previewStyle.rotate;
    el.style.objectFit = 'contain';
    el.style.userSelect = 'none';
    el.style.zIndex = '1';
    el.style.pointerEvents = 'auto';
  }

  for (const [id, baseline] of Object.entries(state.baselines)) {
    const el = queryByVleId(id);
    if (!el) continue;
    const isDeleted = state.deletedIds.includes(id);
    const replacement = state.assetReplacements.find((item) => item.id === id);
    if (baseline.styleAttr) el.setAttribute('style', baseline.styleAttr);
    else el.removeAttribute('style');
    el.style.display = isDeleted ? 'none' : baseline.display;

    if (replacement) {
      if (el instanceof HTMLImageElement) {
        el.src = replacement.objectUrl;
        el.alt = replacement.alt;
      } else if (el.dataset.vleReplaced !== 'true') {
        previewAssetReplacement(el, replacement.objectUrl);
        el.dataset.vleReplaced = 'true';
      }
    } else if (el.dataset.vleReplaced === 'true') {
      if (el instanceof HTMLImageElement && baseline.src) el.src = baseline.src;
      else el.innerHTML = baseline.innerHTML;
      delete el.dataset.vleReplaced;
    }

    const elementState = state.elements[id];
    if (elementState) {
      const categories = Object.keys(elementState.classTokensByCategory) as ClassCategory[];
      const add = categories.flatMap((category) => elementState.classTokensByCategory[category] ?? []);
      el.className = applyClassEdit(baseline.className, add, categories).className;
      for (const category of categories) applyPreviewTokens(el, category, elementState.classTokensByCategory[category] ?? []);
      if (elementState.text != null) {
        const directText = getEditableDirectTextNode(el);
        if (directText) directText.nodeValue = elementState.text;
        else if (el.children.length === 0) el.textContent = elementState.text;
      }
    } else if (!replacement) {
      el.className = baseline.className;
      const directText = getEditableDirectTextNode(el);
      if (directText && baseline.directText != null && directText.nodeValue !== baseline.directText) {
        directText.nodeValue = baseline.directText;
      } else if (el.textContent !== baseline.textContent && baseline.textContent && el.children.length === 0) {
        el.textContent = baseline.textContent;
      }
    }
  }

  const reorderedIds = new Set(state.reorders.map((reorder) => reorder.id));
  for (const [id, baseline] of Object.entries(state.baselines)) {
    if (!reorderedIds.has(id)) moveElementBefore(id, baseline.parentId, baseline.nextId);
  }
  for (const reorder of state.reorders) {
    moveElementBefore(reorder.id, reorder.parentId, reorder.beforeId);
  }
  for (const swap of state.swaps) {
    const first = queryByVleId(swap.id);
    const second = queryByVleId(swap.otherId);
    if (first && second) swapElements(first, second);
  }
}

export function Overlay() {
  const state = useDesignModeStore();
  const [dropStatus, setDropStatus] = React.useState<string | null>(null);
  const [aiOpen, setAiOpen] = React.useState(false);

  React.useEffect(() => {
    if (!state.active) return;
    syncPreviewDom(state);
    // Selection and hover updates happen continuously during pointer gestures.
    // Reconcile only after an actual edit, otherwise those harmless updates can
    // restore baseline styles in the middle of a drag and make selection jump.
  }, [state.active, state.previewRevision]);

  React.useEffect(() => {
    if (!state.active) return;
    let raf: number | null = null;
    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const latest = getSnapshot();
        syncPreviewDom(latest);
        if (latest.hoveredId && !queryByVleId(latest.hoveredId)) setHovered(null);
        if (latest.selectedIds.some((id) => !queryByVleId(id))) clearSelection();
      });
    };

    const observer = new MutationObserver((records) => {
      const ownRoot = document.getElementById(OWN_ROOT_ID);
      if (records.every((record) => ownRoot?.contains(record.target))) return;
      schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [state.active]);

  React.useEffect(() => {
    if (!state.active) return;

    const onMouseMove = (e: MouseEvent) => {
      if (isWithinOwnUI(e.target)) return;
      if (isDesignModePassthrough(e.target)) {
        setHovered(null);
        return;
      }
      const target = findTaggedAncestor(e.target as Element);
      setHovered(target?.dataset.vleId ?? null, target);
    };

    const onClick = (e: MouseEvent) => {
      if (isWithinOwnUI(e.target)) return; // let our own toolbar/panel/handles work normally
      if (isDesignModePassthrough(e.target)) {
        clearSelection();
        setHovered(null);
        return;
      }
      const inlineEditor = state.inlineEditingId ? queryByVleId(state.inlineEditingId) : null;
      if (inlineEditor?.contains(e.target as Node)) {
        // Preserve the browser's native caret placement while editing in place.
        e.stopPropagation();
        return;
      }
      if (inlineEditor) inlineEditor.blur();
      const target = findTaggedAncestor(e.target as Element);
      e.preventDefault();
      e.stopPropagation();
      if (state.swapArmedId) {
        const first = queryByVleId(state.swapArmedId);
        if (!target?.dataset.vleId || !first) {
          setSwapArmed(null);
          setDropStatus('Swap cancelled.');
          return;
        }
        if (target === first) return;
        if (
          first.parentElement !== target.parentElement ||
          first.dataset.vleSourceMode !== 'static' ||
          target.dataset.vleSourceMode !== 'static' ||
          !first.parentElement?.dataset.vleId
        ) {
          setDropStatus('Swap requires two static JSX siblings in the same parent.');
          return;
        }
        captureElementBaseline(state.swapArmedId);
        captureElementBaseline(target.dataset.vleId);
        if (swapElements(first, target)) {
          stageSwap(state.swapArmedId, target.dataset.vleId, first.parentElement.dataset.vleId);
          setDropStatus('Element positions swapped.');
        }
        return;
      }
      if (!target?.dataset.vleId) {
        clearSelection();
        return;
      }
      if (canEditDirectText(target)) {
        const repeatedTextClick = registerInlineTextClick(target.dataset.vleId);
        if (repeatedTextClick) {
          captureElementBaseline(target.dataset.vleId);
          setInlineEditing(target.dataset.vleId);
          return;
        }
      }
      select(target.dataset.vleId, e.shiftKey || e.metaKey || e.ctrlKey, target);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextEntryTarget(e.target)) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (meta && e.key.toLowerCase() === 'k' && state.selectedIds.length === 1) {
        e.preventDefault();
        setAiOpen(true);
      } else if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        state.selectedIds.length > 0 &&
        !isTextEntryTarget(e.target)
      ) {
        e.preventDefault();
        const amount = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -amount : e.key === 'ArrowRight' ? amount : 0;
        const dy = e.key === 'ArrowUp' ? -amount : e.key === 'ArrowDown' ? amount : 0;
        const result = nudgeSelected(state.selectedIds, dx, dy, !state.smartSpacing);
        if (result.skipped > 0 && result.moved === 0) {
          setDropStatus('This generated or dynamic element cannot be moved safely in source.');
        } else {
          setDropStatus(`Moved ${amount}px. Hold Shift for 10px steps.`);
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isTextEntryTarget(e.target)) {
        if (state.selectedIds.length) {
          e.preventDefault();
          deleteSelected(state.selectedIds);
        }
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    document.addEventListener('mousemove', onMouseMove, { capture: true });
    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('mousemove', onMouseMove, { capture: true });
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [state.active, state.inlineEditingId, state.selectedIds, state.smartSpacing, state.swapArmedId]);

  React.useEffect(() => {
    if (!state.active) return;

    const onDragOver = (e: DragEvent) => {
      if (isWithinOwnUI(e.target)) return;
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    const onDrop = async (e: DragEvent) => {
      if (isWithinOwnUI(e.target)) return;
      const file = [...(e.dataTransfer?.files ?? [])].find((item) => item.type.startsWith('image/'));
      if (!file) return;

      e.preventDefault();
      e.stopPropagation();
      setDropStatus('Uploading asset...');

      try {
        const uploaded = await uploadDesignAsset(file);
        const target = findTaggedAncestor(document.elementFromPoint(e.clientX, e.clientY));
        const selectedId = state.selectedIds.length === 1 ? state.selectedIds[0] : null;
        const selected = selectedId ? queryByVleId(selectedId) : null;
        const alt = altFromFileName(file.name);

        if (selectedId && selected && target && selected.contains(target)) {
          captureElementBaseline(selectedId);
          previewAssetReplacement(selected, uploaded.objectUrl);
          const instanceIndex = selected.dataset.vleInstance;
          stageAssetReplacement(
            selectedId,
            uploaded.asset,
            alt,
            uploaded.objectUrl,
            instanceIndex == null ? undefined : Number(instanceIndex),
          );
          setDropStatus('Replacement staged.');
          return;
        }

        const parent = target ?? selected;
        const parentId = parent?.dataset.vleId;
        if (!parent || !parentId) throw new Error('Drop onto an editable element or select a container first.');

        const rect = parent.getBoundingClientRect();
        const maxWidth = Math.max(48, Math.min(160, rect.width * 0.5 || 160));
        const maxHeight = Math.max(48, Math.min(160, rect.height * 0.5 || 160));
        const scale = Math.min(maxWidth / uploaded.width, maxHeight / uploaded.height, 1);
        const width = Math.max(24, Math.round(uploaded.width * scale));
        const height = Math.max(24, Math.round(uploaded.height * scale));
        const left = clamp(e.clientX - rect.left - width / 2, 0, Math.max(0, rect.width - width));
        const top = clamp(e.clientY - rect.top - height / 2, 0, Math.max(0, rect.height - height));

        if (getComputedStyle(parent).position === 'static') {
          captureElementBaseline(parentId);
          parent.style.position = 'relative';
          if (parent.dataset.vleClassMode === 'static') {
            stageClassTokens(parentId, 'position-mode', ['relative'], false);
          }
        }

        const className = [
          'absolute',
          `top-[${formatMeasurement(top, rect.height, rect.height > 0)}]`,
          `left-[${formatMeasurement(left, rect.width, rect.width > 0)}]`,
          `w-[${formatMeasurement(width, rect.width, rect.width > 0)}]`,
          `h-[${formatMeasurement(height, rect.height, rect.height > 0)}]`,
          'object-contain',
          'select-none',
        ].join(' ');

        const id = stageAssetInsert(
          parentId,
          uploaded.asset,
          className,
          alt,
          uploaded.objectUrl,
          {
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
            rotate: '0deg',
          },
        );
        previewInsert(parent, id, uploaded.objectUrl, top, left, width, height);
        setDropStatus('Asset staged.');
      } catch (err) {
        setDropStatus((err as Error).message);
      }
    };

    document.addEventListener('dragover', onDragOver, { capture: true });
    document.addEventListener('drop', onDrop, { capture: true });
    return () => {
      document.removeEventListener('dragover', onDragOver, { capture: true });
      document.removeEventListener('drop', onDrop, { capture: true });
    };
  }, [state.active, state.selectedIds]);

  return (
    <>
      <SelectionBox />
      <InlineTextEditor />
      <SpacingGuides />
      <RulersOverlay />
      <LayersPanel />
      <PropertiesPanel />
      <Toolbar dropStatus={dropStatus} onClearDropStatus={() => setDropStatus(null)} onOpenAi={() => setAiOpen(true)} />
      {aiOpen && state.selectedIds.length === 1 && (
        <AiEditDrawer selectedId={state.selectedIds[0]} onClose={() => setAiOpen(false)} />
      )}
    </>
  );
}

function Toolbar({
  dropStatus,
  onClearDropStatus,
  onOpenAi,
}: {
  dropStatus: string | null;
  onClearDropStatus: () => void;
  onOpenAi: () => void;
}) {
  const state = useDesignModeStore();
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [reviewingSave, setReviewingSave] = React.useState(false);
  const pendingEdits = getPendingEdits();
  const count = pendingEdits.length;
  const textEdits = pendingEdits.filter((edit) => edit.kind === 'text');
  const layoutEdits = pendingEdits.filter((edit) => edit.kind !== 'text');

  const runSave = async (edits = pendingEdits) => {
    setSaving(true);
    setStatus(null);
    setReviewingSave(false);
    const outcome = await saveDesignModeEdits(edits);
    setSaving(false);
    if (!outcome.ok) {
      const firstError = outcome.results.find((r) => !r.ok)?.error;
      setStatus(firstError ? `Save failed: ${firstError}` : 'Save failed');
    }
    // on success the page reloads (see save.ts), so no success state to show here
  };

  const onSave = () => {
    if (textEdits.length > 0 && layoutEdits.length > 0) {
      setReviewingSave(true);
      return;
    }
    void runSave();
  };

  return (
    <div className="fixed bottom-3 left-3 z-[2147483002] flex items-center gap-2" style={{ zIndex: Z }}>
      <button
        onClick={() => setActive(!state.active)}
        className={`rounded-full px-4 py-2 text-xs font-bold shadow-lg transition-colors ${
          state.active ? 'bg-green-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
        }`}
      >
        {state.active ? 'Design Mode: On' : 'Design Mode'}
      </button>

      {state.active && (
        <>
          <button
            onClick={() => deleteSelected(state.selectedIds)}
            disabled={state.selectedIds.length === 0}
            className="rounded-full bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg disabled:opacity-40"
          >
            Delete
          </button>
          <button
            onClick={() => setSmartSpacing(!state.smartSpacing)}
            title={state.smartSpacing
              ? 'Smart layout: drag to reorder, snapping and spacing guides are on. Click for Free move.'
              : 'Free move: drag any source-backed item anywhere. Click for Smart layout.'}
            aria-label={state.smartSpacing ? 'Switch from Smart layout to Free move' : 'Switch from Free move to Smart layout'}
            className={`rounded-full border px-3 py-2 text-xs font-semibold shadow-lg ${
              state.smartSpacing ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-amber-300 bg-amber-50 text-amber-800'
            }`}
          >
            {state.smartSpacing ? 'Smart layout' : 'Free move'}
          </button>
          <button
            onClick={() => setRulers(!state.rulers)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold shadow-lg ${
              state.rulers ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Rulers
          </button>
          <button
            onClick={onOpenAi}
            disabled={state.selectedIds.length !== 1}
            className="rounded-full bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg disabled:opacity-40"
          >
            Edit with AI
          </button>
          <button onClick={undo} className="rounded-full bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg">
            Undo
          </button>
          <button onClick={redo} className="rounded-full bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg">
            Redo
          </button>
          <button
            onClick={onSave}
            disabled={saving || count === 0}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-40"
          >
            {saving ? 'Saving…' : count > 0 ? `Save (${count})` : 'Save'}
          </button>
          {reviewingSave && (
            <div className="absolute bottom-12 left-0 w-72 rounded-xl border border-amber-200 bg-white p-3 text-left shadow-2xl">
              <div className="text-xs font-bold text-slate-900">Text and layout drafts are mixed</div>
              <p className="mt-1 text-[10px] leading-snug text-slate-600">
                Saving everything would also write {layoutEdits.length} earlier layout {layoutEdits.length === 1 ? 'change' : 'changes'}.
              </p>
              <button
                onClick={() => void runSave(textEdits)}
                className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-transform duration-150 active:scale-[0.97]"
              >
                Save text only
              </button>
              <button
                onClick={() => void runSave(pendingEdits)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-transform duration-150 active:scale-[0.97]"
              >
                Save all {pendingEdits.length} edits
              </button>
              <button onClick={() => setReviewingSave(false)} className="mt-2 w-full px-2 py-1 text-[10px] font-semibold text-slate-400">
                Cancel
              </button>
            </div>
          )}
          {(status || dropStatus) && (
            <button
              onClick={() => {
                setStatus(null);
                onClearDropStatus();
              }}
              className="max-w-xs rounded-md bg-white px-2 py-1 text-left text-[10px] text-slate-600 shadow-lg"
            >
              {status ?? dropStatus}
            </button>
          )}
        </>
      )}
    </div>
  );
}
