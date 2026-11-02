import React from 'react';
import type { LayoutKind, SourceMode } from '../shared-types';
import { classifyElement, layoutKindLabel } from './layout-classifier';
import { preferredTargetForSourceId, runtimeKeyForElement } from './element-targets';
import { changeElementStacking, type StackAction } from './stacking';
import { captureElementBaseline, select, stageReorder, useDesignModeStore } from './store';

const OWN_ROOT_ID = 'design-editor-root';

interface LayerItem {
  key: string;
  id: string;
  el: HTMLElement;
  label: string;
  depth: number;
  parentKey: string | null;
  hasChildren: boolean;
  kind: LayoutKind;
  sourceMode: SourceMode;
}

interface LayerDrop {
  targetKey: string;
  position: 'before' | 'after';
  allowed: boolean;
  reason?: string;
}

function shortText(el: Element): string {
  if (el instanceof HTMLImageElement) return el.alt || 'Image';
  const ownText = [...el.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const text = ownText || (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  return text.length > 30 ? `${text.slice(0, 27)}...` : text;
}

function layerLabel(el: Element): string {
  const pending = el instanceof HTMLElement && el.dataset.vlePendingAsset === 'true';
  const tag = el.tagName.toLowerCase();
  const text = shortText(el);
  if (pending) return text ? `Image: ${text}` : 'Image';
  return text ? `${tag}: ${text}` : tag;
}

function taggedParent(el: Element): HTMLElement | null {
  return el.parentElement?.closest<HTMLElement>('[data-vle-id]') ?? null;
}

function layerDepth(el: Element): number {
  let depth = 0;
  let parent = taggedParent(el);
  while (parent) {
    depth += 1;
    parent = taggedParent(parent);
  }
  return depth;
}

function readLayers(overrides: ReturnType<typeof useDesignModeStore>['layoutOverrides']): LayerItem[] {
  const ownRoot = document.getElementById(OWN_ROOT_ID);
  return [...document.querySelectorAll<HTMLElement>('[data-vle-id]')]
    .filter((el) => !ownRoot?.contains(el))
    .filter((el) => getComputedStyle(el).display !== 'none')
    .map((el) => {
      const id = el.dataset.vleId!;
      const parent = taggedParent(el);
      const classification = classifyElement(el, overrides[id] ?? 'auto');
      return {
        key: runtimeKeyForElement(el),
        id,
        el,
        label: layerLabel(el),
        depth: layerDepth(el),
        parentKey: parent ? runtimeKeyForElement(parent) : null,
        hasChildren: !!el.querySelector(':scope > [data-vle-id]'),
        kind: classification.kind,
        sourceMode: classification.sourceMode,
      };
    });
}

function findChild(layer: LayerItem | undefined): HTMLElement | null {
  return layer?.el.querySelector<HTMLElement>(':scope > [data-vle-id]') ?? null;
}

function findParent(layer: LayerItem | undefined): HTMLElement | null {
  return layer ? taggedParent(layer.el) : null;
}

function isHiddenByCollapsedParent(layer: LayerItem, byKey: Map<string, LayerItem>, collapsed: Set<string>): boolean {
  let parentKey = layer.parentKey;
  while (parentKey) {
    if (collapsed.has(parentKey)) return true;
    parentKey = byKey.get(parentKey)?.parentKey ?? null;
  }
  return false;
}

function badgeClass(kind: LayoutKind) {
  if (kind === 'section') return 'bg-violet-50 text-violet-700 ring-violet-200';
  if (kind === 'absolute-layer') return 'bg-sky-50 text-sky-700 ring-sky-200';
  if (kind === 'container') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (kind === 'generated') return 'bg-slate-100 text-slate-500 ring-slate-200';
  if (kind === 'unsafe') return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
}

function nextTaggedSibling(el: HTMLElement): HTMLElement | null {
  let next = el.nextElementSibling;
  while (next) {
    if (next instanceof HTMLElement && next.dataset.vleId) return next;
    next = next.nextElementSibling;
  }
  return null;
}

export function LayersPanel() {
  const state = useDesignModeStore();
  const [panelOpen, setPanelOpen] = React.useState(() => typeof window === 'undefined' || window.innerWidth >= 1100);
  const [layers, setLayers] = React.useState<LayerItem[]>([]);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [draggedKey, setDraggedKey] = React.useState<string | null>(null);
  const [drop, setDrop] = React.useState<LayerDrop | null>(null);

  React.useEffect(() => {
    if (!state.active) return;
    let raf: number | null = null;
    const update = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        setLayers(readLayers(state.layoutOverrides));
      });
    };
    update();
    const observer = new MutationObserver((records) => {
      if (records.every((record) => document.getElementById(OWN_ROOT_ID)?.contains(record.target))) return;
      update();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'src'] });
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [state.active, state.layoutOverrides, state.assetInserts.length, state.deletedIds.length, state.reorders.length]);

  if (!state.active) return null;

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed left-3 top-3 z-[2147483001] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-lg"
      >
        Layers
      </button>
    );
  }

  const byKey = new Map(layers.map((layer) => [layer.key, layer]));
  const visibleLayers = layers.filter((layer) => !isHiddenByCollapsedParent(layer, byKey, collapsed));
  const selectedId = state.selectedIds[0] ?? null;
  const selectedTarget = selectedId ? preferredTargetForSourceId(selectedId) : null;
  const selectedLayer = selectedTarget ? layers.find((layer) => layer.el === selectedTarget) : undefined;
  const selectedIndex = selectedLayer ? visibleLayers.findIndex((layer) => layer.key === selectedLayer.key) : -1;

  const selectAt = (index: number) => {
    const layer = visibleLayers[index];
    if (layer) select(layer.id, false, layer.el);
  };

  const changeSelectedStacking = (action: StackAction) => {
    if (selectedLayer?.el instanceof HTMLElement) changeElementStacking(selectedLayer.el, action);
  };

  const calculateDrop = (targetKey: string, clientY: number, row: HTMLElement): LayerDrop => {
    const target = byKey.get(targetKey);
    const dragged = draggedKey ? byKey.get(draggedKey) : null;
    const position = clientY < row.getBoundingClientRect().top + row.offsetHeight / 2 ? 'before' : 'after';
    if (!target || !dragged || target.key === dragged.key) return { targetKey, position, allowed: false, reason: 'Choose another sibling' };
    if (target.parentKey !== dragged.parentKey || !target.parentKey) {
      return { targetKey, position, allowed: false, reason: 'Move into another container is not enabled yet' };
    }
    if (target.sourceMode !== 'static' || dragged.sourceMode !== 'static') {
      return { targetKey, position, allowed: false, reason: 'Generated or conditional source cannot be reordered safely' };
    }
    return { targetKey, position, allowed: true };
  };

  const commitDrop = () => {
    if (!drop?.allowed || !draggedKey) return;
    const dragged = byKey.get(draggedKey)?.el;
    const target = byKey.get(drop.targetKey)?.el;
    const parentId = target?.parentElement?.dataset.vleId;
    if (!dragged || !target || !parentId || dragged.parentElement !== target.parentElement) return;
    const before = drop.position === 'before' ? target : nextTaggedSibling(target);
    captureElementBaseline(dragged.dataset.vleId!);
    target.parentElement?.insertBefore(dragged, before);
    stageReorder(dragged.dataset.vleId!, parentId, before?.dataset.vleId ?? null);
  };

  return (
    <div className="fixed left-3 top-3 z-[2147483001] flex max-h-[calc(100vh-84px)] w-72 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/96 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Layers</h3>
          <p className="text-[10px] text-slate-400">Drag siblings to change source order</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-bold tabular-nums text-slate-500">{layers.length}</span>
          <button onClick={() => setPanelOpen(false)} className="flex h-6 w-6 items-center justify-center rounded text-base text-slate-400 hover:bg-slate-100" aria-label="Collapse Layers panel">×</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 border-b border-slate-100 p-2">
        {[
          ['Parent', () => {
            const parent = findParent(selectedLayer);
            if (parent?.dataset.vleId) select(parent.dataset.vleId, false, parent);
          }, !findParent(selectedLayer)],
          ['Child', () => {
            const child = findChild(selectedLayer);
            if (child?.dataset.vleId) select(child.dataset.vleId, false, child);
          }, !findChild(selectedLayer)],
          ['Prev', () => selectAt(Math.max(0, selectedIndex - 1)), selectedIndex <= 0],
          ['Next', () => selectAt(Math.min(visibleLayers.length - 1, selectedIndex + 1)), selectedIndex < 0 || selectedIndex >= visibleLayers.length - 1],
        ].map(([label, action, disabled]) => (
          <button
            key={label as string}
            onClick={action as () => void}
            disabled={disabled as boolean}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 transition-transform duration-150 active:scale-[0.97] disabled:opacity-35"
          >
            {label as string}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1 border-b border-slate-100 p-2 pt-0">
        {[
          ['To back', 'back'],
          ['Backward', 'backward'],
          ['Forward', 'forward'],
          ['To front', 'front'],
        ].map(([label, action]) => (
          <button
            key={action}
            onClick={() => changeSelectedStacking(action as StackAction)}
            disabled={!(selectedLayer?.el instanceof HTMLElement)}
            className="rounded-md border border-slate-200 px-1 py-1 text-[9px] font-bold text-slate-600 transition-transform duration-150 active:scale-[0.97] disabled:opacity-35"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 overflow-y-auto p-2">
        {visibleLayers.map((layer) => {
          const selected = selectedLayer?.key === layer.key;
          const activeDrop = drop?.targetKey === layer.key ? drop : null;
          return (
            <div
              key={layer.key}
              draggable
              onDragStart={(event) => {
                setDraggedKey(layer.key);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/x-design-layer', layer.key);
              }}
              onDragEnd={() => {
                setDraggedKey(null);
                setDrop(null);
              }}
              onDragOver={(event) => {
                if (!draggedKey) return;
                event.preventDefault();
                const nextDrop = calculateDrop(layer.key, event.clientY, event.currentTarget);
                event.dataTransfer.dropEffect = nextDrop.allowed ? 'move' : 'none';
                setDrop(nextDrop);
              }}
              onDrop={(event) => {
                event.preventDefault();
                commitDrop();
                setDraggedKey(null);
                setDrop(null);
              }}
              className="relative mb-0.5"
              title={activeDrop?.reason ?? layer.id}
            >
              {activeDrop && (
                <div className={`pointer-events-none absolute left-1 right-1 z-10 h-0.5 rounded-full ${activeDrop.allowed ? 'bg-green-500' : 'bg-rose-500'} ${activeDrop.position === 'before' ? '-top-px' : '-bottom-px'}`} />
              )}
              <div
                className={`group flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-[11px] transition-colors duration-150 ${
                  selected ? 'bg-green-50 text-green-800 ring-1 ring-inset ring-green-200' : 'text-slate-600 hover:bg-slate-50'
                } ${draggedKey === layer.key ? 'opacity-45' : ''}`}
                style={{ paddingLeft: 6 + Math.min(layer.depth, 10) * 12 }}
              >
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!layer.hasChildren) return;
                    setCollapsed((current) => {
                      const next = new Set(current);
                      if (next.has(layer.key)) next.delete(layer.key);
                      else next.add(layer.key);
                      return next;
                    });
                  }}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] text-slate-400 ${layer.hasChildren ? 'hover:bg-slate-200' : 'opacity-0'}`}
                  aria-label={collapsed.has(layer.key) ? 'Expand layer' : 'Collapse layer'}
                >
                  {collapsed.has(layer.key) ? '›' : '⌄'}
                </button>
                <button onClick={() => select(layer.id, false, layer.el)} className="min-w-0 flex-1 truncate text-left" title={layer.id}>
                  {layer.label}
                </button>
                <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold ring-1 ring-inset ${badgeClass(layer.kind)}`}>
                  {layoutKindLabel(layer.kind)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
