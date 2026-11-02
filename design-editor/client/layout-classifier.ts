import type {
  EditorOperationKind,
  LayoutClassificationSummary,
  LayoutKind,
  LayoutOverride,
  ParentLayout,
  SourceMode,
} from '../shared-types';

const SECTION_TAGS = new Set(['section', 'main', 'header', 'footer', 'article', 'nav', 'aside']);
const CONTAINER_DISPLAYS = new Set(['flex', 'inline-flex', 'grid', 'inline-grid']);

function sourceModeFor(el: HTMLElement): SourceMode {
  const mode = el.dataset.vleSourceMode;
  if (mode === 'static' || mode === 'conditional' || mode === 'generated') return mode;
  return 'unknown';
}

export function parentLayoutFor(parent: HTMLElement | null): ParentLayout {
  if (!parent) return 'unknown';
  const style = getComputedStyle(parent);
  if (style.display === 'grid' || style.display === 'inline-grid') return 'grid';
  if (style.display === 'flex' || style.display === 'inline-flex') {
    if (style.flexWrap !== 'nowrap') return 'flex-wrap';
    return style.flexDirection.startsWith('row') ? 'flex-row' : 'flex-column';
  }
  if (style.display === 'block' || style.display === 'flow-root' || style.display === 'list-item') return 'block';
  return 'unknown';
}

function visibleTaggedSiblings(el: HTMLElement): HTMLElement[] {
  const parent = el.parentElement;
  if (!parent) return [];
  return [...parent.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child !== el &&
      !!child.dataset.vleId &&
      getComputedStyle(child).display !== 'none',
  );
}

function looksLikeSection(el: HTMLElement, parentLayout: ParentLayout): { yes: boolean; reason?: string } {
  const tag = el.tagName.toLowerCase();
  if (SECTION_TAGS.has(tag)) return { yes: true, reason: `semantic <${tag}> element` };

  const parent = el.parentElement;
  if (!parent) return { yes: false };
  const rect = el.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const siblings = visibleTaggedSiblings(el);
  if (!siblings.length || rect.height < 48 || parentRect.width <= 0) return { yes: false };

  const fullWidth = rect.width >= parentRect.width * 0.72;
  const verticalPageFlow = parentLayout === 'block' || parentLayout === 'flex-column';
  const sectionPeers = siblings.filter((sibling) => {
    const siblingRect = sibling.getBoundingClientRect();
    return siblingRect.height >= 48 && siblingRect.width >= parentRect.width * 0.72;
  });
  if (fullWidth && verticalPageFlow && sectionPeers.length > 0) {
    return { yes: true, reason: 'large sibling block in vertical page flow' };
  }
  return { yes: false };
}

function allowedFor(kind: LayoutKind, sourceMode: SourceMode): EditorOperationKind[] {
  if (kind === 'unsafe') return [];
  if (kind === 'generated' || sourceMode === 'generated') return ['edit-container', 'resize', 'edit-content'];
  if (sourceMode === 'conditional') return ['move-layer', 'resize', 'edit-container', 'edit-content'];
  if (kind === 'absolute-layer') return ['move-layer', 'resize', 'reorder', 'swap', 'edit-content'];
  if (kind === 'section') return ['reorder', 'reparent', 'swap', 'edit-container', 'resize', 'edit-content'];
  if (kind === 'container') return ['reorder', 'reparent', 'swap', 'edit-container', 'resize', 'edit-content'];
  return ['reorder', 'reparent', 'swap', 'resize', 'edit-content'];
}

function overrideKind(override: LayoutOverride): LayoutKind | null {
  if (override === 'layer') return 'absolute-layer';
  if (override === 'flow-item') return 'flow-item';
  if (override === 'section') return 'section';
  if (override === 'container') return 'container';
  return null;
}

export function classifyElement(el: HTMLElement, override: LayoutOverride = 'auto'): LayoutClassificationSummary {
  const style = getComputedStyle(el);
  const sourceMode = sourceModeFor(el);
  const parentLayout = parentLayoutFor(el.parentElement);
  const reasons: string[] = [];
  let kind: LayoutKind;
  let confidence: LayoutClassificationSummary['confidence'] = 'high';

  const forced = overrideKind(override);
  if (forced) {
    kind = forced;
    reasons.push(`editor override: ${override}`);
  } else if (!el.dataset.vleId) {
    kind = 'unsafe';
    reasons.push('element has no source-backed editor id');
  } else if (sourceMode === 'generated') {
    kind = 'generated';
    reasons.push('rendered from generated JSX such as .map()');
  } else if (style.position === 'absolute' || style.position === 'fixed') {
    kind = 'absolute-layer';
    reasons.push(`computed position is ${style.position}`);
  } else if (CONTAINER_DISPLAYS.has(style.display)) {
    // An explicit flex/grid formatting context is an editable row/container,
    // even when it spans the full width of a vertical page. Checking section
    // geometry first misclassified ordinary rows as whole page sections.
    kind = 'container';
    reasons.push(`computed display is ${style.display}`);
  } else {
    const section = looksLikeSection(el, parentLayout);
    if (section.yes) {
      kind = 'section';
      reasons.push(section.reason!);
    } else if (el.querySelector(':scope > [data-vle-id]')) {
      kind = 'container';
      reasons.push('contains editable children');
    } else {
      kind = 'flow-item';
      reasons.push(`participates in ${parentLayout.replace('-', ' ')} layout`);
    }
  }

  if (sourceMode === 'conditional') {
    reasons.push('inside a conditional source branch');
    confidence = 'medium';
  } else if (sourceMode === 'unknown') {
    reasons.push('source shape metadata is unavailable');
    confidence = forced ? 'high' : 'medium';
  }

  return {
    kind,
    confidence,
    reasons,
    allowedOperations: allowedFor(kind, sourceMode),
    parentLayout,
    sourceMode,
  };
}

export function canReorder(classification: LayoutClassificationSummary): boolean {
  return classification.allowedOperations.includes('reorder');
}

export function layoutKindLabel(kind: LayoutKind): string {
  if (kind === 'absolute-layer') return 'Layer';
  if (kind === 'flow-item') return 'Flow';
  if (kind === 'section') return 'Section';
  if (kind === 'container') return 'Container';
  if (kind === 'generated') return 'Generated';
  return 'Unsafe';
}
