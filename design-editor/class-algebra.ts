// Tailwind utility-class algebra shared by the client overlay (live preview) and the
// dev-server save middleware (source patching). Deliberately env-agnostic: no DOM
// APIs, no Node built-ins, so it can be imported from both sides unchanged.
import type { ClassCategory } from './shared-types';

// Order doesn't matter for matching, but keep it stable for readable diffs/tests.
const CATEGORY_PATTERNS: Record<ClassCategory, RegExp> = {
  'position-mode': /^(?:static|relative|absolute|fixed|sticky)$/,
  'position-offset': /^-?(?:top|left|right|bottom)-/,
  width: /^-?w-/,
  height: /^-?h-/,
  'background-color': /^bg-/,
  'border-radius': /^rounded(?:-|$)/,
  opacity: /^opacity-/,
  'z-index': /^-?z-/,
  padding: /^-?p[trblxy]?-/,
  gap: /^gap(?:-[xy])?-/,
  'justify-content': /^justify-(?:normal|start|end|center|between|around|evenly|stretch)$/,
  'margin-top': /^-?mt-/,
  margin: /^-?m[trblxy]?-/,
  rotation: /^-?rotate-/,
};

/** Variant-prefixed tokens (hover:, md:, group-hover:, dark:, ...) are never
 *  touched by category matching/removal — always preserved verbatim. */
export function isVariant(token: string): boolean {
  return token.includes(':');
}

export function categorize(token: string): ClassCategory | null {
  if (!token || isVariant(token)) return null;
  for (const category of Object.keys(CATEGORY_PATTERNS) as ClassCategory[]) {
    if (CATEGORY_PATTERNS[category].test(token)) return category;
  }
  return null;
}

export interface ApplyClassEditResult {
  className: string;
  /** how many existing tokens of each category got dropped, keyed by category */
  removedByCategory: Partial<Record<ClassCategory, number>>;
}

/**
 * Removes existing tokens belonging to `categories`, then appends `add`.
 * Callers should check `collapsesMultipleTokens` before committing an edit that
 * removed more than one token in a category (e.g. four per-corner radius classes) —
 * that's a signal the element had deliberate non-uniform values.
 */
export function applyClassEdit(
  existingClassName: string,
  add: string[],
  categories: ClassCategory[],
): ApplyClassEditResult {
  const clearing = new Set(categories);
  const tokens = existingClassName.split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  const removedByCategory: Partial<Record<ClassCategory, number>> = {};

  for (const token of tokens) {
    const category = categorize(token);
    const clearedBy = category && clearing.has(category)
      ? category
      : category === 'margin-top' && clearing.has('margin')
        ? 'margin'
        : null;
    if (clearedBy) {
      removedByCategory[clearedBy] = (removedByCategory[clearedBy] ?? 0) + 1;
      continue;
    }
    kept.push(token);
  }

  return { className: [...kept, ...add].join(' '), removedByCategory };
}

export function collapsesMultipleTokens(result: ApplyClassEditResult): ClassCategory[] {
  return (Object.entries(result.removedByCategory) as [ClassCategory, number][])
    .filter(([, count]) => count > 1)
    .map(([category]) => category);
}
