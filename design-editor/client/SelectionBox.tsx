// Hover/selection highlight boxes + resize handles + the move (drag) hit area.
// Rects are recomputed every animation frame (not just on click) because the app
// underneath uses motion/react transitions throughout — a one-time measurement
// would drift out of sync as soon as anything animates.
import React from 'react';
import { stageMoveClasses, stageParentRelativeIfNeeded, stageResizeClasses, stageRotationClass } from './commit';
import { canEditDirectText, isFlexParent, probeBasis, promoteToAbsolute, queryByVleId, readRotationDegrees } from './dom-utils';
import { captureElementBaseline, clearSelection, select, setInlineEditing, stageClassTokens, stageReorder, type RulerGuide, useDesignModeStore } from './store';
import { canReorder, classifyElement } from './layout-classifier';
import { InsertionIndicator } from './InsertionIndicator';
import { getReorderInsertion, isSafeSameSourceParent, type ReorderInsertion } from './reorder-engine';
import { computeMoveSnap, type MoveSnapInput, type SnapLocks, type VisibleSnapGuide } from './snap-engine';
import { SnapGuides } from './SnapGuides';

const HANDLE_SIZE = 10;
const OVERLAY_Z = 2147483000;
const ROTATE_HANDLE_OFFSET = 28;
const INLINE_EDIT_DOUBLE_CLICK_MS = 500;
const OWN_ROOT_ID = 'design-editor-root';
const PASSTHROUGH_SELECTOR = '[data-design-mode-passthrough="true"]';

let lastInlineTextClick: { id: string; at: number } | null = null;

/** Tracks editor-level clicks rather than relying on the browser's dblclick.
 * The first click inserts the selection overlay, so the browser sees a different
 * target on click two and otherwise suppresses dblclick entirely. */
export function registerInlineTextClick(id: string, at = performance.now()): boolean {
  const repeated = lastInlineTextClick?.id === id && at - lastInlineTextClick.at <= INLINE_EDIT_DOUBLE_CLICK_MS;
  lastInlineTextClick = repeated ? null : { id, at };
  return repeated;
}

function passthroughAtPoint(x: number, y: number): HTMLElement | null {
  const ownRoot = document.getElementById(OWN_ROOT_ID);
  for (const el of document.elementsFromPoint(x, y)) {
    if (ownRoot?.contains(el)) continue;
    const passthrough = el.closest<HTMLElement>(PASSTHROUGH_SELECTOR);
    if (passthrough) return passthrough;
  }
  return null;
}

function selectableTargetsAtPoint(x: number, y: number): HTMLElement[] {
  const ownRoot = document.getElementById(OWN_ROOT_ID);
  const seen = new Set<Element>();
  const targets: HTMLElement[] = [];
  for (const el of document.elementsFromPoint(x, y)) {
    if (ownRoot?.contains(el)) continue;
    const target = el.closest<HTMLElement>('[data-vle-id]');
    if (!target || seen.has(target)) continue;
    seen.add(target);
    targets.push(target);
  }
  return targets;
}

type HandleDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const HANDLE_DIRS: { dir: HandleDir; fx: number; fy: number; cursor: string }[] = [
  { dir: 'nw', fx: 0, fy: 0, cursor: 'nwse-resize' },
  { dir: 'n', fx: 0.5, fy: 0, cursor: 'ns-resize' },
  { dir: 'ne', fx: 1, fy: 0, cursor: 'nesw-resize' },
  { dir: 'e', fx: 1, fy: 0.5, cursor: 'ew-resize' },
  { dir: 'se', fx: 1, fy: 1, cursor: 'nwse-resize' },
  { dir: 's', fx: 0.5, fy: 1, cursor: 'ns-resize' },
  { dir: 'sw', fx: 0, fy: 1, cursor: 'nesw-resize' },
  { dir: 'w', fx: 0, fy: 0.5, cursor: 'ew-resize' },
];

export function SelectionBox() {
  const state = useDesignModeStore();
  const [, forceTick] = React.useState(0);
  const rafRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (!state.active) return;
    const loop = () => {
      forceTick((t) => (t + 1) % 1_000_000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state.active]);

  if (!state.active) return null;

  const hoveredEl = state.hoveredId && !state.selectedIds.includes(state.hoveredId) ? queryByVleId(state.hoveredId) : null;
  const selected = state.selectedIds
    .map((id) => ({ id, el: queryByVleId(id) }))
    .filter((s): s is { id: string; el: HTMLElement } => !!s.el);
  const selectedHtml = selected.filter(({ el }) => el instanceof HTMLElement);
  const canManipulateSelection = selectedHtml.length === selected.length;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: OVERLAY_Z }}>
      {hoveredEl && <OutlineBox el={hoveredEl} variant="hover" />}
      {selected.map(({ id, el }) => (
        <OutlineBox key={id} el={el} variant="selected" />
      ))}
      {canManipulateSelection && selected.length > 0 && !state.inlineEditingId && (
        <MoveLayer
          targets={selected}
          smartSpacing={state.smartSpacing}
          rulerGuides={state.rulerGuides}
          layoutOverrides={state.layoutOverrides}
        />
      )}
      {canManipulateSelection && selected.length === 1 && !state.inlineEditingId && <ResizeHandles id={selected[0].id} el={selected[0].el} />}
      {canManipulateSelection && selected.length === 1 && !state.inlineEditingId && <RotateHandle id={selected[0].id} el={selected[0].el} />}
    </div>
  );
}

interface OrientedBox {
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotation: number;
}

function getOrientedBox(el: HTMLElement): OrientedBox {
  const rect = el.getBoundingClientRect();
  const width = el instanceof HTMLElement && el.offsetWidth > 0 ? el.offsetWidth : rect.width;
  const height = el instanceof HTMLElement && el.offsetHeight > 0 ? el.offsetHeight : rect.height;
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    width: Math.max(1, width),
    height: Math.max(1, height),
    rotation: readRotationDegrees(el),
  };
}

function localPoint(box: OrientedBox, fx: number, fy: number, extraY = 0): { x: number; y: number } {
  const rad = (box.rotation * Math.PI) / 180;
  const localX = (fx - 0.5) * box.width;
  const localY = (fy - 0.5) * box.height + extraY;
  return {
    x: box.cx + localX * Math.cos(rad) - localY * Math.sin(rad),
    y: box.cy + localX * Math.sin(rad) + localY * Math.cos(rad),
  };
}

function OutlineBox({ el, variant }: { el: HTMLElement; variant: 'hover' | 'selected' }) {
  const box = getOrientedBox(el);
  return (
    <div
      style={{
        position: 'fixed',
        top: box.cy,
        left: box.cx,
        width: box.width,
        height: box.height,
        transform: `translate(-50%, -50%) rotate(${box.rotation}deg)`,
        border: variant === 'selected' ? '2px solid #16a34a' : '1px dashed rgba(22,163,74,0.6)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    />
  );
}

function commitMoveResult(
  el: HTMLElement,
  promoted: NonNullable<ReturnType<typeof promoteToAbsolute>>,
  basis: ReturnType<typeof probeBasis>,
  dx: number,
  dy: number,
) {
  const finalTop = promoted.frozenTop + dy;
  const finalLeft = promoted.frozenLeft + dx;
  el.style.transform = '';
  el.style.top = `${finalTop}px`;
  el.style.left = `${finalLeft}px`;

  const id = el.dataset.vleId;
  if (!id) return;

  stageMoveClasses(id, finalTop, finalLeft, promoted.frozenWidth, promoted.frozenHeight, basis);
  if (promoted.promotedFromFlow) stageClassTokens(id, 'margin', ['m-0'], false);
  stageParentRelativeIfNeeded(promoted);
}

function snapshotRect(rect: DOMRect): MoveSnapInput['rect'] {
  return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
}

function buildSnapFrame(el: HTMLElement, rulerGuides: RulerGuide[]): Omit<MoveSnapInput, 'dx' | 'dy' | 'previousLocks' | 'disabled'> | null {
  const parent = el.parentElement;
  if (!parent) return null;
  const parentStyle = getComputedStyle(parent);
  const siblings = [...parent.children]
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter((child) => child !== el && !!child.dataset.vleId && getComputedStyle(child).display !== 'none')
    .map((child) => ({ id: child.dataset.vleId!, rect: snapshotRect(child.getBoundingClientRect()) }));
  return {
    rect: snapshotRect(el.getBoundingClientRect()),
    parentRect: snapshotRect(parent.getBoundingClientRect()),
    parentPadding: {
      top: Number.parseFloat(parentStyle.paddingTop) || 0,
      right: Number.parseFloat(parentStyle.paddingRight) || 0,
      bottom: Number.parseFloat(parentStyle.paddingBottom) || 0,
      left: Number.parseFloat(parentStyle.paddingLeft) || 0,
    },
    siblings,
    rulerGuides,
  };
}

function MoveLayer({
  targets,
  smartSpacing,
  rulerGuides,
  layoutOverrides,
}: {
  targets: { id: string; el: HTMLElement }[];
  smartSpacing: boolean;
  rulerGuides: RulerGuide[];
  layoutOverrides: Record<string, import('../shared-types').LayoutOverride>;
}) {
  const [snapGuides, setSnapGuides] = React.useState<VisibleSnapGuide[]>([]);
  const [insertion, setInsertion] = React.useState<ReorderInsertion | null>(null);
  const snapLocks = React.useRef<SnapLocks>({});
  const forwardedClickAt = React.useRef(0);
  const draggedAt = React.useRef(0);
  const rects = targets.map((t) => t.el.getBoundingClientRect());
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const passthrough = passthroughAtPoint(e.clientX, e.clientY);
    if (passthrough) {
      e.preventDefault();
      e.stopPropagation();
      forwardedClickAt.current = performance.now();
      clearSelection();
      passthrough.click();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    let lockedAxis: 'x' | 'y' | null = null;
    e.currentTarget.setPointerCapture(e.pointerId);

    const single = targets.length === 1 ? targets[0] : null;
    const singleClassification = single ? classifyElement(single.el, layoutOverrides[single.id] ?? 'auto') : null;
    const flowTarget =
      smartSpacing &&
      single &&
      singleClassification &&
      canReorder(singleClassification) &&
      singleClassification.kind !== 'absolute-layer' &&
      isSafeSameSourceParent(single.el)
        ? single.el
        : null;
    if (flowTarget?.dataset.vleId) captureElementBaseline(flowTarget.dataset.vleId);

    const canMoveAsLayer = targets.every(({ id, el }) => {
      const classification = classifyElement(el, layoutOverrides[id] ?? 'auto');
      if (classification.kind === 'generated' || classification.kind === 'unsafe') return false;
      // Free move is intentionally explicit: switching Smart layout off means
      // any source-backed selection may be detached from document flow.
      return !smartSpacing || classification.kind === 'absolute-layer';
    });
    if (!flowTarget && !canMoveAsLayer) return;

    const snapFrame = canMoveAsLayer && single ? buildSnapFrame(single.el, rulerGuides) : null;
    snapLocks.current = {};

    const drags = flowTarget
      ? []
      : targets
          .map(({ el }) => {
            const id = el.dataset.vleId;
            if (id) captureElementBaseline(id);
            const parentId = (el.offsetParent as HTMLElement | null)?.dataset.vleId;
            if (parentId) captureElementBaseline(parentId);
            const promoted = promoteToAbsolute(el);
            if (!promoted) return null;
            const basis = probeBasis(el, promoted.offsetParent);
            return { el, promoted, basis };
          })
          .filter((d): d is { el: HTMLElement; promoted: NonNullable<ReturnType<typeof promoteToAbsolute>>; basis: ReturnType<typeof probeBasis> } => !!d);

    const getDelta = (ev: PointerEvent) => {
      let dx = ev.clientX - startX;
      let dy = ev.clientY - startY;
      if (ev.shiftKey) {
        if (!lockedAxis && Math.max(Math.abs(dx), Math.abs(dy)) > 3) {
          lockedAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        }
        if (lockedAxis === 'x') dy = 0;
        if (lockedAxis === 'y') dx = 0;
      } else {
        lockedAxis = null;
      }
      if (!smartSpacing || !snapFrame) return { dx, dy };
      const snapped = computeMoveSnap({
        ...snapFrame,
        dx,
        dy,
        previousLocks: snapLocks.current,
        disabled: ev.altKey,
      });
      snapLocks.current = snapped.locks;
      setSnapGuides(snapped.guides);
      return { dx: snapped.dx, dy: snapped.dy };
    };

    const onMove = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 3) draggedAt.current = performance.now();
      const { dx, dy } = getDelta(ev);
      if (flowTarget) {
        flowTarget.style.transform = `translate(${dx}px, ${dy}px)`;
        setInsertion(getReorderInsertion(flowTarget, dx, dy));
        return;
      }
      for (const { el } of drags) el.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const { dx, dy } = getDelta(ev);
      setSnapGuides([]);
      setInsertion(null);
      snapLocks.current = {};
      if (flowTarget) {
        const reorder = getReorderInsertion(flowTarget, dx, dy);
        flowTarget.style.transform = '';
        if (reorder?.changed) {
          const beforeEl = reorder.beforeId ? queryByVleId(reorder.beforeId) : null;
          flowTarget.parentElement?.insertBefore(flowTarget, beforeEl);
          stageReorder(flowTarget.dataset.vleId!, reorder.parentId, reorder.beforeId);
        }
        return;
      }
      for (const { el, promoted, basis } of drags) commitMoveResult(el, promoted, basis, dx, dy);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const singleClassification = targets.length === 1 ? classifyElement(targets[0].el, layoutOverrides[targets[0].id] ?? 'auto') : null;
  const editableTextTarget = targets.length === 1 && canEditDirectText(targets[0].el) ? targets[0] : null;
  const cursor = !smartSpacing
    ? 'move'
    : singleClassification && singleClassification.kind !== 'absolute-layer'
      ? 'grab'
      : 'move';

  return (
    <>
      <SnapGuides guides={snapGuides} />
      <InsertionIndicator insertion={insertion} />
      <div
        onPointerDown={onPointerDown}
        onClick={(event) => {
          if (performance.now() - forwardedClickAt.current < 750) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          if (performance.now() - draggedAt.current < 250) return;
          const candidates = selectableTargetsAtPoint(event.clientX, event.clientY);
          const current = targets.length === 1 ? targets[0].el : null;
          let next: HTMLElement | null = null;
          if (current && (event.metaKey || event.ctrlKey)) {
            const currentIndex = candidates.indexOf(current);
            next = candidates[(currentIndex + 1 + candidates.length) % candidates.length] ?? null;
          } else if (current) {
            next = candidates.find((candidate) => candidate !== current && current.contains(candidate)) ?? current;
          }
          if (next?.dataset.vleId && next !== current) {
            event.preventDefault();
            event.stopPropagation();
            select(next.dataset.vleId, false, next);
            return;
          }
          if (!editableTextTarget || !registerInlineTextClick(editableTextTarget.id)) return;
          event.preventDefault();
          event.stopPropagation();
          captureElementBaseline(editableTextTarget.id);
          setInlineEditing(editableTextTarget.id);
        }}
        onDoubleClick={(event) => {
          if (!editableTextTarget) return;
          event.preventDefault();
          event.stopPropagation();
          captureElementBaseline(editableTextTarget.id);
          setInlineEditing(editableTextTarget.id);
        }}
        title={editableTextTarget ? 'Double-click to edit text' : undefined}
        style={{ position: 'fixed', top, left, width: right - left, height: bottom - top, cursor, pointerEvents: 'auto', touchAction: 'none' }}
      />
    </>
  );
}

function ResizeHandles({ id, el }: { id: string; el: HTMLElement }) {
  const box = getOrientedBox(el);

  const onPointerDown = (dir: HandleDir) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = el.offsetWidth;
    const startHeight = el.offsetHeight;
    const startLeft = el.offsetLeft;
    const startTop = el.offsetTop;
    const rotation = readRotationDegrees(el);
    const rad = (rotation * Math.PI) / 180;
    captureElementBaseline(id);
    const parent = el.offsetParent as HTMLElement | null;
    if (!parent) return;
    const basis = probeBasis(el, parent);
    const staysFlexChild = isFlexParent(el.parentElement) && getComputedStyle(el).position === 'static';

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const localDx = dx * Math.cos(rad) + dy * Math.sin(rad);
      const localDy = -dx * Math.sin(rad) + dy * Math.cos(rad);
      let w = startWidth;
      let h = startHeight;
      let left = startLeft;
      let top = startTop;
      if (dir.includes('e')) w = Math.max(16, startWidth + localDx);
      if (dir.includes('w')) {
        w = Math.max(16, startWidth - localDx);
      }
      if (dir.includes('s')) h = Math.max(16, startHeight + localDy);
      if (dir.includes('n')) {
        h = Math.max(16, startHeight - localDy);
      }
      const dw = startWidth - w;
      const dh = startHeight - h;
      if (dir.includes('w')) {
        left += (dw / 2) * (1 + Math.cos(rad));
        top += (dw / 2) * Math.sin(rad);
      }
      if (dir.includes('n')) {
        left += (-dh / 2) * Math.sin(rad);
        top += (dh / 2) * (1 + Math.cos(rad));
      }
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      if (dir.includes('w')) el.style.left = `${left}px`;
      if (dir.includes('n')) el.style.top = `${top}px`;
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dir.includes('w') || dir.includes('n')) {
        stageMoveClasses(id, el.offsetTop, el.offsetLeft, el.offsetWidth, el.offsetHeight, basis);
      } else {
        stageResizeClasses(id, el.offsetWidth, el.offsetHeight, basis, staysFlexChild);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      {HANDLE_DIRS.map(({ dir, fx, fy, cursor }) => (
        (() => {
          const p = localPoint(box, fx, fy);
          return (
            <div
              key={dir}
              onPointerDown={onPointerDown(dir)}
              style={{
                position: 'fixed',
                top: p.y,
                left: p.x,
                transform: `translate(-50%, -50%) rotate(${box.rotation}deg)`,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                boxSizing: 'border-box',
                background: '#16a34a',
                border: '2px solid white',
                borderRadius: 2,
                cursor,
                pointerEvents: 'auto',
              }}
            />
          );
        })()
      ))}
    </>
  );
}

function RotateHandle({ id, el }: { id: string; el: HTMLElement }) {
  const box = getOrientedBox(el);
  const topEdge = localPoint(box, 0.5, 0);
  const handle = localPoint(box, 0.5, 0, -ROTATE_HANDLE_OFFSET);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    captureElementBaseline(id);

    const applyRotation = (clientX: number, clientY: number) => {
      const degrees = Math.atan2(clientY - box.cy, clientX - box.cx) * (180 / Math.PI) + 90;
      const rounded = Math.round(degrees * 10) / 10;
      el.style.rotate = `${rounded}deg`;
      return rounded;
    };

    const onMove = (ev: PointerEvent) => {
      applyRotation(ev.clientX, ev.clientY);
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      stageRotationClass(id, applyRotation(ev.clientX, ev.clientY));
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: topEdge.y,
          left: topEdge.x,
          width: 1,
          height: ROTATE_HANDLE_OFFSET,
          background: 'rgba(22,163,74,0.65)',
          pointerEvents: 'none',
          transform: `translateY(-${ROTATE_HANDLE_OFFSET}px) rotate(${box.rotation}deg)`,
          transformOrigin: `50% ${ROTATE_HANDLE_OFFSET}px`,
        }}
      />
      <div
        onPointerDown={onPointerDown}
        style={{
          position: 'fixed',
          top: handle.y,
          left: handle.x,
          transform: 'translate(-50%, -50%)',
          width: 14,
          height: 14,
          boxSizing: 'border-box',
          borderRadius: 999,
          background: '#16a34a',
          border: '2px solid white',
          boxShadow: '0 4px 12px rgba(15,23,42,0.18)',
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
      />
    </>
  );
}
