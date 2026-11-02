// Ephemeral, in-memory design-mode state: selection, staged (not-yet-saved) edits,
// undo/redo. Deliberately separate from the app's own AppContext — this state has
// no bearing on the running app and should never leak into it.
import { useSyncExternalStore } from 'react';
import type {
  ClassCategory,
  DesignAssetRef,
  PendingAssetInsertEdit,
  PendingAssetReplaceEdit,
  PendingClassEdit,
  PendingDeleteEdit,
  PendingEdit,
  PendingReorderEdit,
  PendingTextEdit,
  LayoutOverride,
  PendingSwapEdit,
} from '../shared-types';
import { applyClassEdit } from '../class-algebra';
import {
  clearRememberedHover,
  clearRememberedSelection,
  forgetSelectedTargetsForSourceId,
  preferredTargetForSourceId,
  rememberHoveredTarget,
  rememberSelectedTarget,
} from './element-targets';

export const VIRTUAL_ASSET_PREFIX = 'design-insert:';

export interface AssetPreviewStyle {
  top: string;
  left: string;
  width: string;
  height: string;
  rotate: string;
}

export interface PendingAssetLayer extends PendingAssetInsertEdit {
  objectUrl: string;
  previewStyle: AssetPreviewStyle;
}

export interface PendingAssetReplacementLayer extends PendingAssetReplaceEdit {
  objectUrl: string;
}

export interface RulerGuide {
  id: string;
  axis: 'x' | 'y';
  position: number;
}

interface ElementBaseline {
  className: string;
  textContent: string;
  directText?: string;
  display: string;
  styleAttr: string;
  innerHTML: string;
  parentId?: string;
  nextId?: string | null;
  src?: string;
}

interface ElementState {
  classTokensByCategory: Partial<Record<ClassCategory, string[]>>;
  text?: string;
}

export interface State {
  active: boolean;
  /** Changes only when preview DOM should be reconciled. Selection/hover updates
   * must not reset an in-progress pointer gesture. */
  previewRevision: number;
  smartSpacing: boolean;
  rulers: boolean;
  hoveredId: string | null;
  selectedIds: string[];
  inlineEditingId: string | null;
  elements: Record<string, ElementState>;
  baselines: Record<string, ElementBaseline>;
  deletedIds: string[];
  assetInserts: PendingAssetLayer[];
  assetReplacements: PendingAssetReplacementLayer[];
  rulerGuides: RulerGuide[];
  reorders: PendingReorderEdit[];
  swaps: PendingSwapEdit[];
  swapArmedId: string | null;
  layoutOverrides: Record<string, LayoutOverride>;
}

type Listener = () => void;

let state: State = {
  active: false,
  previewRevision: 0,
  smartSpacing: true,
  rulers: false,
  hoveredId: null,
  selectedIds: [],
  inlineEditingId: null,
  elements: {},
  baselines: {},
  deletedIds: [],
  assetInserts: [],
  assetReplacements: [],
  rulerGuides: [],
  reorders: [],
  swaps: [],
  swapArmedId: null,
  layoutOverrides: {},
};
const listeners = new Set<Listener>();
const historyStack: State[] = [];
const redoStack: State[] = [];

function clone(s: State): State {
  return {
    active: s.active,
    previewRevision: s.previewRevision,
    smartSpacing: s.smartSpacing,
    rulers: s.rulers,
    hoveredId: s.hoveredId,
    selectedIds: [...s.selectedIds],
    inlineEditingId: s.inlineEditingId,
    elements: Object.fromEntries(
      Object.entries(s.elements).map(([id, el]) => [
        id,
        { text: el.text, classTokensByCategory: { ...el.classTokensByCategory } },
      ]),
    ),
    baselines: Object.fromEntries(Object.entries(s.baselines).map(([id, baseline]) => [id, { ...baseline }])),
    deletedIds: [...s.deletedIds],
    assetInserts: s.assetInserts.map((insert) => ({
      ...insert,
      asset: { ...insert.asset },
      previewStyle: { ...insert.previewStyle },
    })),
    assetReplacements: s.assetReplacements.map((replacement) => ({ ...replacement, asset: { ...replacement.asset } })),
    rulerGuides: s.rulerGuides.map((guide) => ({ ...guide })),
    reorders: s.reorders.map((reorder) => ({ ...reorder })),
    swaps: s.swaps.map((swap) => ({ ...swap })),
    swapArmedId: s.swapArmedId,
    layoutOverrides: { ...s.layoutOverrides },
  };
}

function queryById(id: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const preferred = preferredTargetForSourceId(id);
  if (preferred) return preferred;
  const escaped = id.replace(/["\\]/g, '\\$&');
  return document.querySelector(`[data-vle-id="${escaped}"]`);
}

function captureBaselineInDraft(s: State, id: string) {
  if (isVirtualAssetId(id) || s.baselines[id]) return;
  const el = queryById(id);
  if (!el) return;
  const directTextNodes = [...el.childNodes].filter(
    (node): node is Text => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim().length > 0,
  );
  s.baselines[id] = {
    className: el.className,
    textContent: el.textContent ?? '',
    directText: directTextNodes.length === 1 ? directTextNodes[0].nodeValue ?? '' : undefined,
    display: el.style.display,
    styleAttr: el.getAttribute('style') ?? '',
    innerHTML: el.innerHTML,
    parentId: el.parentElement?.dataset.vleId,
    nextId: el.nextElementSibling instanceof HTMLElement ? el.nextElementSibling.dataset.vleId ?? null : null,
    src: el instanceof HTMLImageElement ? el.src : undefined,
  };
}

export function captureElementBaseline(id: string) {
  setState((s) => {
    captureBaselineInDraft(s, id);
    s.previewRevision += 1;
  });
}

export function isVirtualAssetId(id: string): boolean {
  return id.startsWith(VIRTUAL_ASSET_PREFIX);
}

function parseArbitraryValue(token: string, prefix: string): string | null {
  const match = token.match(new RegExp(`^-?${prefix}-\\[(.+)\\]$`));
  if (!match) return null;
  const value = match[1];
  return token.startsWith('-') ? `-${value}` : value;
}

function applyTokensToPreviewStyle(style: AssetPreviewStyle, category: ClassCategory, tokens: string[]) {
  if (category === 'position-offset') {
    for (const token of tokens) {
      const top = parseArbitraryValue(token, 'top');
      const left = parseArbitraryValue(token, 'left');
      if (top) style.top = top;
      if (left) style.left = left;
    }
  }
  if (category === 'width') {
    const width = tokens.map((token) => parseArbitraryValue(token, 'w')).find(Boolean);
    if (width) style.width = width;
  }
  if (category === 'height') {
    const height = tokens.map((token) => parseArbitraryValue(token, 'h')).find(Boolean);
    if (height) style.height = height;
  }
  if (category === 'rotation') {
    const rotate = tokens.map((token) => parseArbitraryValue(token, 'rotate')).find(Boolean);
    if (rotate) style.rotate = rotate;
  }
}

function applyClassTokensToDraft(s: State, id: string, category: ClassCategory, tokens: string[]) {
  if (isVirtualAssetId(id)) {
    const insert = s.assetInserts.find((assetInsert) => assetInsert.id === id);
    if (!insert) return;
    insert.className = applyClassEdit(insert.className, tokens, [category]).className;
    applyTokensToPreviewStyle(insert.previewStyle, category, tokens);
    return;
  }
  captureBaselineInDraft(s, id);
  const el = s.elements[id] ?? { classTokensByCategory: {} };
  el.classTokensByCategory = { ...el.classTokensByCategory, [category]: tokens };
  s.elements[id] = el;
}

function emit() {
  for (const l of listeners) l();
}

function setState(updater: (draft: State) => void, recordHistory = false) {
  if (recordHistory) {
    historyStack.push(clone(state));
    redoStack.length = 0;
  }
  const draft = clone(state);
  updater(draft);
  state = draft;
  emit();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function useDesignModeStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setActive(active: boolean) {
  setState((s) => {
    s.active = active;
    if (!active) {
      clearRememberedHover();
      clearRememberedSelection();
      s.hoveredId = null;
      s.selectedIds = [];
      s.inlineEditingId = null;
      s.swapArmedId = null;
    }
  });
}

export function setSmartSpacing(smartSpacing: boolean) {
  setState((s) => {
    s.smartSpacing = smartSpacing;
  });
}

export function setRulers(rulers: boolean) {
  setState((s) => {
    s.rulers = rulers;
  });
}

export function addRulerGuide(axis: RulerGuide['axis'], position: number): string {
  const id = `guide:${axis}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  setState((s) => {
    s.rulerGuides.push({ id, axis, position });
  });
  return id;
}

export function updateRulerGuide(id: string, position: number) {
  setState((s) => {
    const guide = s.rulerGuides.find((item) => item.id === id);
    if (guide) guide.position = position;
  });
}

export function removeRulerGuide(id: string) {
  setState((s) => {
    s.rulerGuides = s.rulerGuides.filter((guide) => guide.id !== id);
  });
}

export function setHovered(id: string | null, target?: HTMLElement | null) {
  if (target !== undefined) rememberHoveredTarget(target);
  else if (id === null) clearRememberedHover();
  if (state.hoveredId === id) return;
  setState((s) => {
    s.hoveredId = id;
  });
}

export function select(id: string, additive: boolean, target?: HTMLElement | null) {
  const removing = additive && state.selectedIds.includes(id);
  if (removing) forgetSelectedTargetsForSourceId(id);
  else rememberSelectedTarget(target ?? queryById(id), additive);
  setState((s) => {
    if (s.inlineEditingId && s.inlineEditingId !== id) s.inlineEditingId = null;
    if (additive) {
      const i = s.selectedIds.indexOf(id);
      if (i >= 0) s.selectedIds.splice(i, 1);
      else s.selectedIds.push(id);
    } else {
      s.selectedIds = [id];
    }
  });
}

export function clearSelection() {
  clearRememberedSelection();
  setState((s) => {
    s.selectedIds = [];
    s.inlineEditingId = null;
  });
}

export function setInlineEditing(id: string | null) {
  setState((s) => {
    s.inlineEditingId = id;
    if (id) s.selectedIds = [id];
  });
}

export function setLayoutOverride(id: string, override: LayoutOverride) {
  setState((s) => {
    if (override === 'auto') delete s.layoutOverrides[id];
    else s.layoutOverrides[id] = override;
  });
}

export function setSwapArmed(id: string | null) {
  setState((s) => {
    s.swapArmedId = id;
  });
}

/** recordHistory should be true only on the *final* call of a gesture (pointerup),
 *  not on every intermediate frame, or undo would step one frame at a time. */
export function stageClassTokens(id: string, category: ClassCategory, tokens: string[], recordHistory = true) {
  setState((s) => {
    applyClassTokensToDraft(s, id, category, tokens);
    s.previewRevision += 1;
  }, recordHistory);
}

export function stageClassTokenBatch(
  id: string,
  edits: { category: ClassCategory; tokens: string[] }[],
  recordHistory = true,
) {
  setState((s) => {
    for (const edit of edits) applyClassTokensToDraft(s, id, edit.category, edit.tokens);
    s.previewRevision += 1;
  }, recordHistory);
}

export function stageText(id: string, text: string, recordHistory = true) {
  setState((s) => {
    captureBaselineInDraft(s, id);
    const el = s.elements[id] ?? { classTokensByCategory: {} };
    el.text = text;
    s.elements[id] = el;
    s.previewRevision += 1;
  }, recordHistory);
}

export function stageDelete(id: string, recordHistory = true) {
  setState((s) => {
    s.previewRevision += 1;
    if (isVirtualAssetId(id)) {
      s.assetInserts = s.assetInserts.filter((insert) => insert.id !== id);
      s.selectedIds = s.selectedIds.filter((selectedId) => selectedId !== id);
      if (s.inlineEditingId === id) s.inlineEditingId = null;
      return;
    }
    captureBaselineInDraft(s, id);
    if (!s.deletedIds.includes(id)) s.deletedIds.push(id);
    delete s.elements[id];
    s.assetReplacements = s.assetReplacements.filter((replacement) => replacement.id !== id);
    s.reorders = s.reorders.filter((reorder) => reorder.id !== id && reorder.beforeId !== id && reorder.parentId !== id);
    s.swaps = s.swaps.filter((swap) => swap.id !== id && swap.otherId !== id && swap.parentId !== id);
    if (s.swapArmedId === id) s.swapArmedId = null;
    s.selectedIds = s.selectedIds.filter((selectedId) => selectedId !== id);
    if (s.inlineEditingId === id) s.inlineEditingId = null;
  }, recordHistory);
}

export function stageReorder(id: string, parentId: string, beforeId: string | null, recordHistory = true) {
  setState((s) => {
    s.previewRevision += 1;
    captureBaselineInDraft(s, id);
    s.reorders = s.reorders.filter((reorder) => reorder.id !== id);
    s.reorders.push({ kind: 'reorder', id, parentId, beforeId });
    s.selectedIds = [id];
  }, recordHistory);
}

export function stageSwap(id: string, otherId: string, parentId: string, recordHistory = true) {
  setState((s) => {
    s.previewRevision += 1;
    captureBaselineInDraft(s, id);
    captureBaselineInDraft(s, otherId);
    s.swaps = s.swaps.filter((swap) => ![swap.id, swap.otherId].includes(id) && ![swap.id, swap.otherId].includes(otherId));
    s.swaps.push({ kind: 'swap', id, otherId, parentId });
    s.reorders = s.reorders.filter((reorder) => reorder.id !== id && reorder.id !== otherId);
    s.swapArmedId = null;
    s.inlineEditingId = null;
    s.selectedIds = [id];
  }, recordHistory);
}

export function stageAssetInsert(
  parentId: string,
  asset: DesignAssetRef,
  className: string,
  alt: string,
  objectUrl: string,
  previewStyle: AssetPreviewStyle,
  recordHistory = true,
): string {
  const id = `${VIRTUAL_ASSET_PREFIX}${Date.now()}:${Math.random().toString(36).slice(2)}`;
  setState((s) => {
    s.previewRevision += 1;
    s.assetInserts.push({
      kind: 'insert-asset',
      id,
      parentId,
      asset,
      className,
      alt,
      objectUrl,
      previewStyle,
    });
    s.inlineEditingId = null;
    s.selectedIds = [id];
  }, recordHistory);
  return id;
}

export function stageAssetReplacement(
  id: string,
  asset: DesignAssetRef,
  alt: string,
  objectUrl: string,
  instanceIndex?: number,
  recordHistory = true,
) {
  setState((s) => {
    s.previewRevision += 1;
    captureBaselineInDraft(s, id);
    s.assetReplacements = s.assetReplacements.filter(
      (replacement) => replacement.id !== id || replacement.instanceIndex !== instanceIndex,
    );
    s.assetReplacements.push({ kind: 'replace-with-asset', id, instanceIndex, asset, alt, objectUrl });
    s.deletedIds = s.deletedIds.filter((deletedId) => deletedId !== id);
  }, recordHistory);
}

export function undo() {
  const prev = historyStack.pop();
  if (!prev) return;
  redoStack.push(clone(state));
  prev.previewRevision = state.previewRevision + 1;
  state = prev;
  emit();
}

export function redo() {
  const next = redoStack.pop();
  if (!next) return;
  historyStack.push(clone(state));
  next.previewRevision = state.previewRevision + 1;
  state = next;
  emit();
}

export function clearAllPending() {
  historyStack.length = 0;
  redoStack.length = 0;
  clearRememberedSelection();
  setState((s) => {
    s.previewRevision += 1;
    s.elements = {};
    s.selectedIds = [];
    s.baselines = {};
    s.deletedIds = [];
    s.assetInserts = [];
    s.assetReplacements = [];
    s.reorders = [];
    s.swaps = [];
    s.swapArmedId = null;
    s.inlineEditingId = null;
    s.layoutOverrides = {};
  });
}

export function hasPending(): boolean {
  return pendingCount() > 0;
}

export function pendingCount(): number {
  return (
    Object.keys(state.elements).length +
    state.deletedIds.length +
    state.assetInserts.length +
    state.assetReplacements.length +
    state.reorders.length +
    state.swaps.length
  );
}

export function getPendingEdits(): PendingEdit[] {
  const edits: PendingEdit[] = [];
  const deleted = new Set(state.deletedIds);
  for (const id of state.deletedIds) {
    edits.push({ kind: 'delete', id } as PendingDeleteEdit);
  }
  for (const [id, el] of Object.entries(state.elements)) {
    if (deleted.has(id)) continue;
    const categories = Object.keys(el.classTokensByCategory) as ClassCategory[];
    if (categories.length) {
      const add = categories.flatMap((c) => el.classTokensByCategory[c] ?? []);
      edits.push({ kind: 'class', id, add, categories } as PendingClassEdit);
    }
    if (el.text != null) {
      edits.push({ kind: 'text', id, text: el.text } as PendingTextEdit);
    }
  }
  edits.push(
    ...state.assetInserts.map(({ objectUrl: _objectUrl, previewStyle: _previewStyle, ...insert }) => insert),
    ...state.assetReplacements
      .filter((replacement) => !deleted.has(replacement.id))
      .map(({ objectUrl: _objectUrl, ...replacement }) => replacement),
    ...state.reorders.filter((reorder) => !deleted.has(reorder.id)),
    ...state.swaps.filter((swap) => !deleted.has(swap.id) && !deleted.has(swap.otherId)),
  );
  return edits;
}
