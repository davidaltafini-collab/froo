// Source ids identify JSX nodes, but one JSX node can render many DOM instances
// (lists, tables, grids, repeated cards). Keep the exact live target separately
// so canvas selection does not jump to the first matching source id.
let selectedTargets: HTMLElement[] = [];
let hoveredTarget: HTMLElement | null = null;
let nextRuntimeKey = 1;
const runtimeKeys = new WeakMap<HTMLElement, string>();

function connectedMatch(el: HTMLElement | null, sourceId: string): boolean {
  return !!el && el.isConnected && el.dataset.vleId === sourceId;
}

export function rememberHoveredTarget(el: HTMLElement | null) {
  hoveredTarget = el?.isConnected ? el : null;
}

export function rememberSelectedTarget(el: HTMLElement | null, additive: boolean) {
  if (!el?.isConnected) {
    if (!additive) selectedTargets = [];
    return;
  }
  if (!additive) {
    selectedTargets = [el];
    return;
  }
  const index = selectedTargets.indexOf(el);
  if (index >= 0) selectedTargets.splice(index, 1);
  else selectedTargets.push(el);
}

export function clearRememberedHover() {
  hoveredTarget = null;
}

export function clearRememberedSelection() {
  selectedTargets = [];
}

export function forgetSelectedTargetsForSourceId(sourceId: string) {
  selectedTargets = selectedTargets.filter((el) => el.dataset.vleId !== sourceId);
}

export function preferredTargetForSourceId(sourceId: string): HTMLElement | null {
  selectedTargets = selectedTargets.filter((el) => el.isConnected);
  const selected = selectedTargets.find((el) => connectedMatch(el, sourceId));
  if (selected) return selected;
  if (connectedMatch(hoveredTarget, sourceId)) return hoveredTarget;
  if (hoveredTarget && !hoveredTarget.isConnected) hoveredTarget = null;
  return null;
}

export function runtimeKeyForElement(el: HTMLElement): string {
  let key = runtimeKeys.get(el);
  if (!key) {
    key = `vle-runtime-${nextRuntimeKey++}`;
    runtimeKeys.set(el, key);
  }
  return key;
}
