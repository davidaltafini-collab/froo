// Node-side helpers shared by the tagging plugin (compile time) and the save
// middleware (save time) so both agree on exactly what's "safely editable" —
// the tagging plugin computes these flags to show the client, the save
// middleware re-derives them independently from the on-disk source as a guard
// against a stale/spoofed client sending an edit for a dynamic className.
import path from 'node:path';
import type { JSXAttribute, JSXElement, JSXOpeningElement, JSXText } from '@babel/types';

const HOST_ELEMENT_RE = /^[a-z]/;

export function toPosixRelative(rootDir: string, filename: string): string {
  return path.relative(rootDir, filename).split(path.sep).join('/');
}

export function isTaggable(opening: JSXOpeningElement): boolean {
  const name = opening.name;
  if (name.type === 'JSXIdentifier') {
    if (name.name === 'Fragment') return false;
    return HOST_ELEMENT_RE.test(name.name) || !!findAttr(opening, 'className');
  }
  if (name.type === 'JSXMemberExpression' && name.object.type === 'JSXIdentifier') {
    if (name.object.name === 'React' && name.property.type === 'JSXIdentifier' && name.property.name === 'Fragment') return false;
    return name.object.name === 'motion' || !!findAttr(opening, 'className');
  }
  return false;
}

export function findAttr(opening: JSXOpeningElement, name: string): JSXAttribute | undefined {
  return opening.attributes.find(
    (a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === name,
  );
}

export function computeClassMode(opening: JSXOpeningElement): 'static' | 'dynamic' {
  const attr = findAttr(opening, 'className');
  if (!attr || !attr.value) return 'static';
  if (attr.value.type === 'StringLiteral') return 'static';
  if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'StringLiteral') {
    return 'static';
  }
  return 'dynamic';
}

export function computeTextMode(children: JSXElement['children']): 'text' | 'mixed' | 'none' {
  const nonWhitespace = children.filter((c) => (c.type === 'JSXText' ? c.value.trim().length > 0 : true));
  if (nonWhitespace.length === 0) return 'none';
  if (nonWhitespace.length === 1 && nonWhitespace[0].type === 'JSXText') return 'text';
  return 'mixed';
}

/** The single string literal node backing a static className, whichever of the
 *  two shapes (`className="x"` or `className={"x"}`) it's written as. */
export function getStaticClassNode(
  opening: JSXOpeningElement,
): { value: string; start: number; end: number } | null {
  const attr = findAttr(opening, 'className');
  if (!attr || !attr.value) return null;
  if (attr.value.type === 'StringLiteral' && attr.value.start != null && attr.value.end != null) {
    return { value: attr.value.value, start: attr.value.start, end: attr.value.end };
  }
  if (
    attr.value.type === 'JSXExpressionContainer' &&
    attr.value.expression.type === 'StringLiteral' &&
    attr.value.expression.start != null &&
    attr.value.expression.end != null
  ) {
    return { value: attr.value.expression.value, start: attr.value.expression.start, end: attr.value.expression.end };
  }
  return null;
}

export function computeVleId(rootDir: string, filename: string, opening: JSXOpeningElement): string | null {
  const relPath = toPosixRelative(rootDir, filename);
  if (!relPath.startsWith('src/')) return null;
  const loc = opening.loc;
  if (!loc) return null;
  return `${relPath}:${loc.start.line}:${loc.start.column}`;
}

/** The single direct, non-whitespace JSXText child. Nested JSX children may
 * coexist (for example "Store Runner" beside a <span>Live</span> badge); only
 * the static text segment is returned and edited. */
export function getEditableTextChild(children: JSXElement['children']): JSXText | null {
  const nodes = children.filter((c): c is JSXText => c.type === 'JSXText' && c.value.trim().length > 0);
  if (nodes.length !== 1) return null;
  const node = nodes[0];
  return node.start != null && node.end != null ? node : null;
}

/** Splits a data-vle-id ("src/views/Foo.tsx:12:4") back into its parts. Ids are always
 *  built from a posix-relative path (never contains ':'), so the last two ':'-segments
 *  are always the line/column and everything before them is the path. */
export function parseVleId(id: string): { relPath: string; line: number; column: number } | null {
  const parts = id.split(':');
  if (parts.length < 3) return null;
  const column = Number(parts.pop());
  const line = Number(parts.pop());
  const relPath = parts.join(':');
  if (!relPath || !Number.isFinite(line) || !Number.isFinite(column)) return null;
  return { relPath, line, column };
}
