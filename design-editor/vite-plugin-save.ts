// Dev-only Vite plugin: registers POST /__design-mode/save, which patches the
// requested elements' className/text directly in the on-disk .tsx source using
// magic-string (surgical, offset-based — never re-serializes the whole file).
//
// apply: 'serve' — this must never run during `vite build`; see vite.config.ts.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import type {
  ArrowFunctionExpression,
  CallExpression,
  File,
  FunctionExpression,
  JSXAttribute,
  JSXElement,
  JSXExpressionContainer,
  JSXOpeningElement,
} from '@babel/types';
import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import { applyClassEdit } from './class-algebra';
import {
  computeClassMode,
  computeVleId,
  getEditableTextChild,
  getStaticClassNode,
  parseVleId,
} from './ast-helpers';
import type {
  DesignAssetRef,
  ExportSvgRequestBody,
  ExportSvgResponseBody,
  PendingAssetInsertEdit,
  PendingAssetReplaceEdit,
  PendingClassEdit,
  PendingEdit,
  PendingReorderEdit,
  PendingSwapEdit,
  SaveRequestBody,
  SaveResultItem,
  SelectionContextBody,
  SelectionContextResponseBody,
  UploadAssetRequestBody,
  UploadAssetResponseBody,
} from './shared-types';

// @babel/traverse ships CJS with a `.default` interop shim; guard both shapes.
const traverse = (traverseModule as unknown as { default?: typeof traverseModule }).default ?? traverseModule;

const SAVE_ENDPOINT = '/__design-mode/save';
const UPLOAD_ENDPOINT = '/__design-mode/upload';
const EXPORT_SVG_ENDPOINT = '/__design-mode/export-svg';
const SELECTION_ENDPOINT = '/__design-mode/selection';
const DESIGN_ASSET_DIR = 'assets/.design-editor';
const DESIGN_EXPORT_DIR = 'design-exports';
const DESIGN_EDITOR_STATE_DIR = '.design-editor';
const DESIGN_EDITOR_BACKUP_DIR = `${DESIGN_EDITOR_STATE_DIR}/backups`;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function escapeJsxText(text: string): string {
  return text.replace(/[{}<]/g, (ch) => `{'${ch}'}`);
}

function replaceJsxTextPreservingLayout(original: string, text: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return `${leading}${escapeJsxText(text)}${trailing}`;
}

function escapeJsxAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/{/g, '&#123;');
}

function sanitizeAssetName(name: string): string {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = path
    .basename(name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'asset'}-${Date.now().toString(36)}${ext || '.png'}`;
}

function sanitizeSvgExportName(name: string): string {
  const base = path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${base || 'selected-element'}-${stamp}.svg`;
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  const [, mime, payload] = match;
  const buffer = Buffer.from(payload, 'base64');
  return { mime, buffer };
}

function validateAsset(asset: DesignAssetRef): string | null {
  if (!asset?.importPath?.startsWith('@/assets/.design-editor/')) return 'asset import path is not allowed';
  if (asset.importPath.includes('..') || asset.importPath.includes('\\')) return 'asset import path is malformed';
  return null;
}

function isImgElement(opening: JSXOpeningElement): boolean {
  return opening.name.type === 'JSXIdentifier' && opening.name.name === 'img';
}

export function isReplaceableSelfClosingVisual(opening: JSXOpeningElement): boolean {
  if (!opening.selfClosing) return false;
  if (opening.name.type === 'JSXMemberExpression') return true;
  if (opening.name.type !== 'JSXIdentifier') return false;
  return opening.name.name === 'svg' || /^[A-Z]/.test(opening.name.name);
}

function replacementImageClassAttribute(opening: JSXOpeningElement, code: string): string {
  const existing = getStaticClassNode(opening)?.value.trim() ?? '';
  if (existing) {
    const tokens = new Set(existing.split(/\s+/).filter(Boolean));
    tokens.add('block');
    tokens.add('object-contain');
    return `className="${escapeJsxAttr([...tokens].join(' '))}"`;
  }
  const classAttr = findJsxAttr(opening, 'className');
  if (classAttr?.value?.type === 'JSXExpressionContainer' && classAttr.value.expression.type !== 'JSXEmptyExpression') {
    const expression = classAttr.value.expression;
    if (expression.start != null && expression.end != null) {
      return `className={[${code.slice(expression.start, expression.end)}, "block object-contain"].filter(Boolean).join(" ")}`;
    }
  }
  return 'className="block max-w-full object-contain"';
}

function preservedReplacementAttributes(opening: JSXOpeningElement, code: string): string {
  return opening.attributes
    .filter((attr): attr is JSXAttribute => {
      if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') return false;
      const name = attr.name.name;
      return name === 'id' || name === 'role' || name === 'title' || name === 'tabIndex' || name.startsWith('aria-') || name.startsWith('data-') || /^on[A-Z]/.test(name);
    })
    .map((attr) => code.slice(attr.start!, attr.end!))
    .join(' ');
}

export function selfClosingVisualReplacementJsx(
  opening: JSXOpeningElement,
  code: string,
  localName: string,
  alt: string,
): string | null {
  if (!isReplaceableSelfClosingVisual(opening)) return null;
  const preserved = preservedReplacementAttributes(opening, code);
  const classAttribute = replacementImageClassAttribute(opening, code);
  return `<img src={${localName}} alt="${escapeJsxAttr(alt)}" ${classAttribute}${preserved ? ` ${preserved}` : ''} />`;
}

function getLineIndent(code: string, index: number): string {
  const lineStart = code.lastIndexOf('\n', index - 1) + 1;
  return code.slice(lineStart, index).match(/^\s*/)?.[0] ?? '';
}

function collectUsedImportNames(ast: File): Set<string> {
  const names = new Set<string>();
  for (const node of ast.program.body) {
    if (node.type === 'ImportDeclaration') {
      for (const specifier of node.specifiers) names.add(specifier.local.name);
      continue;
    }
    if (node.type === 'FunctionDeclaration' && node.id) names.add(node.id.name);
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        if (declaration.id.type === 'Identifier') names.add(declaration.id.name);
      }
    }
  }
  return names;
}

function ensureAssetImport(
  ms: MagicString,
  ast: File,
  asset: DesignAssetRef,
  ensuredImports: Map<string, string>,
  used: Set<string>,
): string {
  const alreadyEnsured = ensuredImports.get(asset.importPath);
  if (alreadyEnsured) return alreadyEnsured;

  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration' || node.source.value !== asset.importPath) continue;
    const existing = node.specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');
    if (existing) {
      ensuredImports.set(asset.importPath, existing.local.name);
      return existing.local.name;
    }
  }

  let i = 1;
  while (used.has(`designAsset${i}`)) i += 1;
  const localName = `designAsset${i}`;
  used.add(localName);
  ensuredImports.set(asset.importPath, localName);
  const importLine = `import ${localName} from '${asset.importPath}';`;
  const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration');
  if (imports.length) {
    ms.appendLeft(imports[imports.length - 1].end!, `\n${importLine}`);
  } else {
    ms.prepend(`${importLine}\n`);
  }
  return localName;
}

function insertStaticClass(opening: JSXOpeningElement, ms: MagicString, className: string) {
  const insertAfter = opening.attributes.length ? opening.attributes[opening.attributes.length - 1].end! : opening.name.end!;
  ms.appendLeft(insertAfter, ` className=${JSON.stringify(className)}`);
}

function replaceOrInsertSrc(opening: JSXOpeningElement, ms: MagicString, localName: string) {
  const srcAttr = findJsxAttr(opening, 'src');
  if (srcAttr?.value?.start != null && srcAttr.value.end != null) {
    ms.overwrite(srcAttr.value.start, srcAttr.value.end, `{${localName}}`);
    return;
  }
  const insertBefore = opening.selfClosing ? opening.end! - 2 : opening.end! - 1;
  ms.appendLeft(insertBefore, ` src={${localName}}`);
}

function isMapCall(node: CallExpression): boolean {
  return node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'map';
}

function enclosingMapCallback(
  target: NodePath<JSXElement>,
): NodePath<ArrowFunctionExpression | FunctionExpression> | null {
  return target.findParent((candidate) => {
    if (!(candidate.isArrowFunctionExpression() || candidate.isFunctionExpression())) return false;
    const parent = candidate.parentPath;
    return !!parent?.isCallExpression() && isMapCall(parent.node) && parent.node.arguments[0] === candidate.node;
  }) as NodePath<ArrowFunctionExpression | FunctionExpression> | null;
}

function ensureMapCallbackIndex(
  callback: NodePath<ArrowFunctionExpression | FunctionExpression>,
  code: string,
  ms: MagicString,
): string | null {
  const existing = callback.node.params[1];
  if (existing?.type === 'Identifier') return existing.name;
  if (existing) return null;

  const callbackStart = callback.node.start;
  const bodyStart = callback.node.body.start;
  if (callbackStart == null || bodyStart == null) return null;

  const indexName = callback.scope.generateUidIdentifier('vleIndex').name;
  const params = callback.node.params;
  if (!params.length) {
    const header = code.slice(callbackStart, bodyStart);
    const closingParen = header.lastIndexOf(')');
    if (closingParen < 0) return null;
    ms.appendLeft(callbackStart + closingParen, `_item, ${indexName}`);
    return indexName;
  }

  const lastParam = params[params.length - 1];
  if (lastParam.start == null || lastParam.end == null) return null;
  const tail = code.slice(lastParam.end, bodyStart);
  if (params.length === 1 && callback.isArrowFunctionExpression() && !tail.includes(')')) {
    const original = code.slice(lastParam.start, lastParam.end);
    ms.overwrite(lastParam.start, lastParam.end, `(${original}, ${indexName})`);
  } else {
    ms.appendLeft(lastParam.end, `, ${indexName}`);
  }
  return indexName;
}

export function instanceSpecificSrcValue(
  opening: JSXOpeningElement,
  code: string,
  localName: string,
  indexName: string,
  instanceIndex: number,
): string | null {
  const srcAttr = findJsxAttr(opening, 'src');
  if (!srcAttr?.value) return `{${indexName} === ${instanceIndex} ? ${localName} : undefined}`;

  let original: string;
  if (srcAttr.value.type === 'JSXExpressionContainer') {
    const expression = srcAttr.value.expression;
    if (expression.type === 'JSXEmptyExpression' || expression.start == null || expression.end == null) return null;
    original = code.slice(expression.start, expression.end);
  } else if (srcAttr.value.start != null && srcAttr.value.end != null) {
    original = code.slice(srcAttr.value.start, srcAttr.value.end);
  } else {
    return null;
  }
  return `{${indexName} === ${instanceIndex} ? ${localName} : (${original})}`;
}

function replaceOrInsertInstanceSrc(
  opening: JSXOpeningElement,
  code: string,
  ms: MagicString,
  localName: string,
  indexName: string,
  instanceIndex: number,
): boolean {
  const nextValue = instanceSpecificSrcValue(opening, code, localName, indexName, instanceIndex);
  if (!nextValue) return false;
  const srcAttr = findJsxAttr(opening, 'src');
  if (srcAttr?.value?.start != null && srcAttr.value.end != null) {
    ms.overwrite(srcAttr.value.start, srcAttr.value.end, nextValue);
  } else {
    const insertBefore = opening.selfClosing ? opening.end! - 2 : opening.end! - 1;
    ms.appendLeft(insertBefore, ` src=${nextValue}`);
  }
  return true;
}

function ensureAlt(opening: JSXOpeningElement, ms: MagicString, alt: string) {
  const altAttr = findJsxAttr(opening, 'alt');
  if (altAttr) return;
  const insertBefore = opening.selfClosing ? opening.end! - 2 : opening.end! - 1;
  ms.appendLeft(insertBefore, ` alt="${escapeJsxAttr(alt)}"`);
}

function findJsxAttr(opening: JSXOpeningElement, name: string): JSXAttribute | undefined {
  return opening.attributes.find(
    (attr): attr is JSXAttribute => attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === name,
  );
}

function deleteRangeFor(target: NodePath<JSXElement>): { start: number; end: number } | null {
  if (target.parentPath?.isJSXElement()) return { start: target.node.start!, end: target.node.end! };

  if (target.parentPath?.isJSXExpressionContainer()) {
    const container = target.parentPath as NodePath<JSXExpressionContainer>;
    if (container.parentPath?.isJSXElement()) return { start: container.node.start!, end: container.node.end! };
  }

  const expressionContainer = target.findParent(
    (parent) => parent.isJSXExpressionContainer() && parent.parentPath?.isJSXElement(),
  ) as NodePath<JSXExpressionContainer> | null;
  if (!expressionContainer) return null;
  if (target.findParent((parent) => parent.isCallExpression())) return null;
  if (target.findParent((parent) => parent.isLogicalExpression() || parent.isConditionalExpression())) {
    return { start: expressionContainer.node.start!, end: expressionContainer.node.end! };
  }
  return null;
}

async function handleUpload(rootDir: string, req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  let body: UploadAssetRequestBody;
  try {
    body = (await readJsonBody(req)) as UploadAssetRequestBody;
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'invalid JSON body' } satisfies UploadAssetResponseBody));
    return;
  }

  const parsed = parseDataUrl(body.dataUrl);
  if (!parsed || !parsed.mime.startsWith('image/')) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'only image files are supported' } satisfies UploadAssetResponseBody));
    return;
  }
  if (parsed.buffer.length > MAX_UPLOAD_BYTES) {
    res.statusCode = 413;
    res.end(JSON.stringify({ ok: false, error: 'image is larger than 10MB' } satisfies UploadAssetResponseBody));
    return;
  }

  const outDir = path.resolve(rootDir, DESIGN_ASSET_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  const fileName = sanitizeAssetName(body.name);
  const absPath = path.join(outDir, fileName);
  fs.writeFileSync(absPath, parsed.buffer);

  const asset: DesignAssetRef = {
    importPath: `@/assets/.design-editor/${fileName}`,
    originalName: body.name || fileName,
  };
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, asset } satisfies UploadAssetResponseBody));
}

async function handleSvgExport(rootDir: string, req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  let body: ExportSvgRequestBody;
  try {
    body = (await readJsonBody(req)) as ExportSvgRequestBody;
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'invalid JSON body' } satisfies ExportSvgResponseBody));
    return;
  }

  if (typeof body.svg !== 'string' || !body.svg.includes('<svg') || body.svg.length > MAX_UPLOAD_BYTES) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'invalid or oversized SVG export' } satisfies ExportSvgResponseBody));
    return;
  }

  const outputDirectory = path.resolve(rootDir, DESIGN_EXPORT_DIR);
  const fileName = sanitizeSvgExportName(body.name || 'selected-element.svg');
  const absolutePath = path.resolve(outputDirectory, fileName);
  if (!absolutePath.startsWith(`${outputDirectory}${path.sep}`)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'invalid SVG export path' } satisfies ExportSvgResponseBody));
    return;
  }

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(absolutePath, body.svg, 'utf8');
  const relativePath = path.relative(rootDir, absolutePath).replaceAll('\\', '/');
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, fileName, relativePath, absolutePath } satisfies ExportSvgResponseBody));
}

async function handleSelectionContext(rootDir: string, req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  let body: SelectionContextBody;
  try {
    body = (await readJsonBody(req)) as SelectionContextBody;
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'invalid JSON body' } satisfies SelectionContextResponseBody));
    return;
  }

  if (!body?.id || typeof body.id !== 'string') {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'missing selected element id' } satisfies SelectionContextResponseBody));
    return;
  }

  const parsedId = parseVleId(body.id);
  if (!parsedId) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'selected element id is malformed' } satisfies SelectionContextResponseBody));
    return;
  }

  const srcRoot = path.resolve(rootDir, 'src') + path.sep;
  const sourcePath = path.resolve(rootDir, parsedId.relPath);
  if (!sourcePath.startsWith(srcRoot) || !fs.existsSync(sourcePath)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'selected source file is unavailable' } satisfies SelectionContextResponseBody));
    return;
  }

  const sourceCode = fs.readFileSync(sourcePath, 'utf-8');
  let sourceContext: Record<string, unknown> = {
    file: parsedId.relPath,
    line: parsedId.line,
    column: parsedId.column,
    fileHash: createHash('sha256').update(sourceCode).digest('hex'),
  };
  try {
    const ast = parse(sourceCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    traverse(ast, {
      JSXElement(elPath: NodePath<JSXElement>) {
        if (sourceContext.start != null) return;
        if (computeVleId(rootDir, sourcePath, elPath.node.openingElement) !== body.id) return;
        const start = elPath.node.start ?? elPath.node.openingElement.start ?? 0;
        const end = elPath.node.end ?? elPath.node.openingElement.end ?? start;
        const excerptStart = Math.max(0, start - 500);
        const excerptEnd = Math.min(sourceCode.length, end + 500);
        const rawExcerpt = sourceCode.slice(excerptStart, excerptEnd);
        const excerpt = rawExcerpt.length <= 12_000
          ? rawExcerpt
          : `${rawExcerpt.slice(0, 9_000)}\n\n/* ... selection excerpt truncated; use source range below ... */\n\n${rawExcerpt.slice(-2_000)}`;
        sourceContext = {
          ...sourceContext,
          start,
          end,
          excerptStart,
          excerptEnd,
          excerpt,
          excerptTruncated: rawExcerpt.length > 12_000,
        };
        elPath.stop();
      },
    });
  } catch (error) {
    sourceContext = { ...sourceContext, parseError: (error as Error).message };
  }

  const outDir = path.resolve(rootDir, DESIGN_EDITOR_STATE_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  const selectionsDir = path.resolve(outDir, 'selections');
  fs.mkdirSync(selectionsDir, { recursive: true });
  const relPath = `${DESIGN_EDITOR_STATE_DIR}/last-selection.json`;
  const absPath = path.resolve(rootDir, relPath);
  const bundleRelPath = `${DESIGN_EDITOR_STATE_DIR}/selections/selection-${Date.now()}.json`;
  const bundle = {
    capturedAt: new Date().toISOString(),
    ...body,
    source: sourceContext,
  };
  const serialized = `${JSON.stringify(bundle, null, 2)}\n`;
  fs.writeFileSync(path.resolve(rootDir, bundleRelPath), serialized, 'utf-8');
  fs.writeFileSync(absPath, serialized, 'utf-8');

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, path: bundleRelPath } satisfies SelectionContextResponseBody));
}

interface FileGroup {
  relPath: string;
  edits: { edit: PendingEdit; line: number; column: number }[];
}

function editSourceId(edit: PendingEdit): string {
  return edit.kind === 'insert-asset' ? edit.parentId : edit.id;
}

function relatedSourceIds(edit: PendingEdit): string[] {
  if (edit.kind === 'insert-asset') return [edit.parentId];
  if (edit.kind === 'reorder') return [edit.id, edit.parentId, ...(edit.beforeId ? [edit.beforeId] : [])];
  if (edit.kind === 'swap') return [edit.id, edit.otherId, edit.parentId];
  return [edit.id];
}

function groupEditsByFile(edits: PendingEdit[]): { groups: FileGroup[]; malformed: SaveResultItem[] } {
  const byFile = new Map<string, FileGroup>();
  const malformed: SaveResultItem[] = [];
  for (const edit of edits) {
    const parsed = parseVleId(editSourceId(edit));
    if (!parsed) {
      malformed.push({ id: edit.id, ok: false, error: 'malformed id' });
      continue;
    }
    let group = byFile.get(parsed.relPath);
    if (!group) {
      group = { relPath: parsed.relPath, edits: [] };
      byFile.set(parsed.relPath, group);
    }
    group.edits.push({ edit, line: parsed.line, column: parsed.column });
  }
  return { groups: [...byFile.values()], malformed };
}

function processFileGroup(rootDir: string, group: FileGroup): SaveResultItem[] {
  const results: SaveResultItem[] = [];
  const srcRoot = path.resolve(rootDir, 'src') + path.sep;
  const absPath = path.resolve(rootDir, group.relPath);

  if (!absPath.startsWith(srcRoot)) {
    return group.edits.map(({ edit }) => ({ id: edit.id, ok: false, error: 'path outside src/' }));
  }
  if (!fs.existsSync(absPath)) {
    return group.edits.map(({ edit }) => ({ id: edit.id, ok: false, error: 'file not found' }));
  }

  const code = fs.readFileSync(absPath, 'utf-8');
  let ast: File;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (err) {
    return group.edits.map(({ edit }) => ({
      id: edit.id,
      ok: false,
      error: `source failed to parse: ${(err as Error).message}`,
    }));
  }

  const wantedIds = new Set(group.edits.flatMap(({ edit }) => relatedSourceIds(edit)));
  const found = new Map<string, NodePath<JSXElement>>();
  traverse(ast, {
    JSXElement(elPath: NodePath<JSXElement>) {
      const id = computeVleId(rootDir, absPath, elPath.node.openingElement);
      if (id && wantedIds.has(id)) found.set(id, elPath);
    },
  });

  const ms = new MagicString(code);
  const ensuredImports = new Map<string, string>();
  const usedImportNames = collectUsedImportNames(ast);
  let dirty = false;

  for (const { edit } of group.edits) {
    const target = found.get(editSourceId(edit));
    if (!target) {
      results.push({ id: edit.id, ok: false, error: 'element not found (source changed since page load?)' });
      continue;
    }
    const opening = target.node.openingElement;

    if (edit.kind === 'swap') {
      const swap = edit as PendingSwapEdit;
      const other = found.get(swap.otherId);
      const parent = found.get(swap.parentId);
      if (!other || !parent) {
        results.push({ id: edit.id, ok: false, error: 'swap target or parent was not found' });
        continue;
      }
      const firstRange = deleteRangeFor(target);
      const secondRange = deleteRangeFor(other);
      if (!firstRange || !secondRange) {
        results.push({ id: edit.id, ok: false, error: 'swap is unsafe for this JSX shape' });
        continue;
      }
      const jsxParentFor = (item: NodePath<JSXElement>) =>
        item.parentPath?.isJSXElement()
          ? item.parentPath
          : item.parentPath?.isJSXExpressionContainer() && item.parentPath.parentPath?.isJSXElement()
            ? item.parentPath.parentPath
            : null;
      if (jsxParentFor(target)?.node !== parent.node || jsxParentFor(other)?.node !== parent.node) {
        results.push({ id: edit.id, ok: false, error: 'swap only supports direct siblings in the same JSX parent' });
        continue;
      }
      if (
        (firstRange.start <= secondRange.start && firstRange.end >= secondRange.start) ||
        (secondRange.start <= firstRange.start && secondRange.end >= firstRange.start)
      ) {
        results.push({ id: edit.id, ok: false, error: 'swap source ranges overlap' });
        continue;
      }
      const firstSource = code.slice(firstRange.start, firstRange.end);
      const secondSource = code.slice(secondRange.start, secondRange.end);
      ms.overwrite(firstRange.start, firstRange.end, secondSource);
      ms.overwrite(secondRange.start, secondRange.end, firstSource);
      dirty = true;
      results.push({ id: edit.id, ok: true });
      continue;
    }

    if (edit.kind === 'reorder') {
      const reorder = edit as PendingReorderEdit;
      const parent = found.get(reorder.parentId);
      if (!parent?.node.closingElement?.start) {
        results.push({ id: edit.id, ok: false, error: 'reorder parent not found or cannot accept children' });
        continue;
      }

      const range = deleteRangeFor(target);
      if (!range) {
        results.push({ id: edit.id, ok: false, error: 'reorder is unsafe for this JSX shape' });
        continue;
      }

      const before = reorder.beforeId ? found.get(reorder.beforeId) : null;
      if (reorder.beforeId && !before) {
        results.push({ id: edit.id, ok: false, error: 'reorder target position was not found' });
        continue;
      }

      const targetParent = target.parentPath?.isJSXElement()
        ? target.parentPath
        : target.parentPath?.isJSXExpressionContainer() && target.parentPath.parentPath?.isJSXElement()
          ? target.parentPath.parentPath
          : null;
      const beforeParent = before
        ? before.parentPath?.isJSXElement()
          ? before.parentPath
          : before.parentPath?.isJSXExpressionContainer() && before.parentPath.parentPath?.isJSXElement()
            ? before.parentPath.parentPath
            : null
        : parent;

      if (targetParent?.node !== parent.node || beforeParent?.node !== parent.node) {
        results.push({ id: edit.id, ok: false, error: 'reorder only supports siblings in the same parent' });
        continue;
      }

      const insertAt = before ? deleteRangeFor(before)?.start : parent.node.closingElement.start;
      if (insertAt == null || (insertAt >= range.start && insertAt <= range.end)) {
        results.push({ id: edit.id, ok: true });
        continue;
      }

      ms.move(range.start, range.end, insertAt);
      dirty = true;
      results.push({ id: edit.id, ok: true });
      continue;
    }

    if (edit.kind === 'delete') {
      const range = deleteRangeFor(target);
      if (!range) {
        results.push({ id: edit.id, ok: false, error: 'delete is unsafe for this JSX shape' });
        continue;
      }
      ms.remove(range.start, range.end);
      dirty = true;
      results.push({ id: edit.id, ok: true });
      continue;
    }

    if (edit.kind === 'insert-asset') {
      const assetEdit = edit as PendingAssetInsertEdit;
      const assetError = validateAsset(assetEdit.asset);
      if (assetError) {
        results.push({ id: edit.id, ok: false, error: assetError });
        continue;
      }
      if (!target.node.closingElement?.start) {
        results.push({ id: edit.id, ok: false, error: 'cannot insert into a self-closing element' });
        continue;
      }
      const localName = ensureAssetImport(ms, ast, assetEdit.asset, ensuredImports, usedImportNames);
      const indent = getLineIndent(code, target.node.closingElement.start);
      const childIndent = `${indent}  `;
      const jsx = `\n${childIndent}<img src={${localName}} alt="${escapeJsxAttr(assetEdit.alt)}" className="${escapeJsxAttr(assetEdit.className)}" />\n${indent}`;
      ms.appendLeft(target.node.closingElement.start, jsx);
      dirty = true;
      results.push({ id: edit.id, ok: true });
      continue;
    }

    if (edit.kind === 'replace-with-asset') {
      const assetEdit = edit as PendingAssetReplaceEdit;
      const assetError = validateAsset(assetEdit.asset);
      if (assetError) {
        results.push({ id: edit.id, ok: false, error: assetError });
        continue;
      }
      const localName = ensureAssetImport(ms, ast, assetEdit.asset, ensuredImports, usedImportNames);
      if (isImgElement(opening)) {
        if (assetEdit.instanceIndex != null) {
          const callback = enclosingMapCallback(target);
          const indexName = callback ? ensureMapCallbackIndex(callback, code, ms) : null;
          if (!indexName || !replaceOrInsertInstanceSrc(opening, code, ms, localName, indexName, assetEdit.instanceIndex)) {
            results.push({ id: edit.id, ok: false, error: 'cannot isolate this repeated image instance in its source map' });
            continue;
          }
        } else {
          replaceOrInsertSrc(opening, ms, localName);
        }
        ensureAlt(opening, ms, assetEdit.alt);
      } else if (isReplaceableSelfClosingVisual(opening)) {
        const start = target.node.start;
        const end = target.node.end;
        if (start == null || end == null) {
          results.push({ id: edit.id, ok: false, error: 'cannot locate the selected visual component in source' });
          continue;
        }
        const jsx = selfClosingVisualReplacementJsx(opening, code, localName, assetEdit.alt)!;
        ms.overwrite(start, end, jsx);
      } else {
        const closing = target.node.closingElement;
        if (!closing?.start || opening.end == null) {
          results.push({ id: edit.id, ok: false, error: 'this self-closing element is not a replaceable visual component' });
          continue;
        }
        const indent = getLineIndent(code, closing.start);
        const childIndent = `${indent}  `;
        const jsx = `\n${childIndent}<img src={${localName}} alt="${escapeJsxAttr(assetEdit.alt)}" className="block h-full w-full object-contain pointer-events-none" />\n${indent}`;
        ms.overwrite(opening.end, closing.start, jsx);
      }
      dirty = true;
      results.push({ id: edit.id, ok: true });
      continue;
    }

    if (edit.kind === 'class') {
      if (computeClassMode(opening) !== 'static') {
        results.push({ id: edit.id, ok: false, error: 'className is dynamic, cannot patch' });
        continue;
      }
      const classEdit = edit as PendingClassEdit;
      const existing = getStaticClassNode(opening);
      const nextClassName = applyClassEdit(existing?.value ?? '', classEdit.add, classEdit.categories).className;

      if (existing) {
        ms.overwrite(existing.start, existing.end, JSON.stringify(nextClassName));
      } else {
        insertStaticClass(opening, ms, nextClassName);
      }
      dirty = true;
      results.push({ id: edit.id, ok: true });
      continue;
    }

    // text edit
    const textNode = getEditableTextChild(target.node.children);
    if (!textNode) {
      results.push({ id: edit.id, ok: false, error: 'no single static direct text segment found' });
      continue;
    }
    const originalTextSource = code.slice(textNode.start!, textNode.end!);
    ms.overwrite(
      textNode.start!,
      textNode.end!,
      replaceJsxTextPreservingLayout(originalTextSource, edit.text),
    );
    dirty = true;
    results.push({ id: edit.id, ok: true });
  }

  if (dirty) {
    const nextCode = ms.toString();
    try {
      parse(nextCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    } catch (error) {
      return results.map((result) => result.ok
        ? { ...result, ok: false, error: `save would produce invalid source: ${(error as Error).message}` }
        : result);
    }

    // Every source write gets a recoverable snapshot. A visual regression can
    // then be restored without relying on editor state or browser history.
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.resolve(rootDir, DESIGN_EDITOR_BACKUP_DIR, stamp, group.relPath);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, code, 'utf-8');
    fs.writeFileSync(absPath, nextCode, 'utf-8');
  }
  return results;
}

/** Applies a known single-file edit group. Exported so the source patching path
 * can be regression-tested without starting a Vite server. */
export function applyDesignEditsToFile(rootDir: string, relPath: string, edits: PendingEdit[]): SaveResultItem[] {
  return processFileGroup(rootDir, {
    relPath,
    edits: edits.map((edit) => ({ edit, line: 0, column: 0 })),
  });
}

export function designEditorSavePlugin(rootDir: string): Plugin {
  return {
    name: 'design-editor-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(UPLOAD_ENDPOINT, async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') return next();
        await handleUpload(rootDir, req, res);
      });

      server.middlewares.use(EXPORT_SVG_ENDPOINT, async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') return next();
        await handleSvgExport(rootDir, req, res);
      });

      server.middlewares.use(SELECTION_ENDPOINT, async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') return next();
        await handleSelectionContext(rootDir, req, res);
      });

      server.middlewares.use(SAVE_ENDPOINT, async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') return next();

        res.setHeader('Content-Type', 'application/json');
        let body: SaveRequestBody;
        try {
          body = (await readJsonBody(req)) as SaveRequestBody;
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ results: [], error: 'invalid JSON body' }));
          return;
        }

        const edits = Array.isArray(body?.edits) ? body.edits : [];
        const { groups, malformed } = groupEditsByFile(edits);

        const results: SaveResultItem[] = [...malformed];
        for (const group of groups) {
          try {
            results.push(...processFileGroup(rootDir, group));
          } catch (err) {
            for (const { edit } of group.edits) {
              results.push({ id: edit.id, ok: false, error: (err as Error).message });
            }
          }
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ results }));
      });
    },
  };
}
