// Dev-only Babel plugin: tags every host JSX element (<div>, <button>, ...) and every
// <motion.*> element under src/ with data-vle-id="src/path.tsx:line:col" plus
// capability flags the client overlay uses to know what's safely editable.
//
// Wired in from vite.config.ts only when `command === 'serve'` — this plugin must
// never run during `vite build` (see vite.config.ts for the gating).
import { types as t } from '@babel/core';
import type { PluginObj, PluginPass } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { CallExpression, JSXElement } from '@babel/types';
import { computeClassMode, computeTextMode, computeVleId, findAttr, isTaggable } from './ast-helpers';

function isMapCall(callPath: NodePath<CallExpression>): boolean {
  const callee = callPath.node.callee;
  return callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'map';
}

function ensureMapIndexParameter(callPath: NodePath<CallExpression>): string | null {
  if (!isMapCall(callPath)) return null;
  const callback = callPath.get('arguments.0');
  if (!(callback.isArrowFunctionExpression() || callback.isFunctionExpression())) return null;

  const existing = callback.node.params[1];
  if (existing?.type === 'Identifier') return existing.name;
  if (existing) return null;

  const index = callback.scope.generateUidIdentifier('vleIndex');
  callback.node.params.push(index);
  return index.name;
}

function generatedInstanceIndex(elPath: NodePath<JSXElement>): string | null {
  let current = elPath.parentPath;
  while (current) {
    if (current.isCallExpression() && isMapCall(current)) {
      return ensureMapIndexParameter(current);
    }
    current = current.parentPath;
  }
  return null;
}

function computeSourceMode(elPath: NodePath<JSXElement>): 'static' | 'conditional' | 'generated' {
  let current = elPath.parentPath;
  let conditional = false;
  while (current) {
    if (
      current.isCallExpression() &&
      current.node.callee.type === 'MemberExpression' &&
      current.node.callee.property.type === 'Identifier' &&
      current.node.callee.property.name === 'map'
    ) {
      return 'generated';
    }
    if (current.isConditionalExpression() || current.isLogicalExpression()) conditional = true;
    current = current.parentPath;
  }
  return conditional ? 'conditional' : 'static';
}

export function createTagElementsPlugin(rootDir: string) {
  return function tagElementsPlugin(): PluginObj<PluginPass> {
    return {
      name: 'design-editor-tag-elements',
      visitor: {
        JSXElement(elPath, state) {
          const filename = state.filename;
          if (!filename) return;

          const opening = elPath.node.openingElement;
          if (!isTaggable(opening) || findAttr(opening, 'data-vle-id')) return;

          const id = computeVleId(rootDir, filename, opening);
          if (!id) return;

          const classMode = computeClassMode(opening);
          const textMode = computeTextMode(elPath.node.children);
          const sourceMode = computeSourceMode(elPath);
          const instanceIndex = sourceMode === 'generated' ? generatedInstanceIndex(elPath) : null;

          opening.attributes.push(
            t.jsxAttribute(t.jsxIdentifier('data-vle-id'), t.stringLiteral(id)),
            t.jsxAttribute(t.jsxIdentifier('data-vle-class-mode'), t.stringLiteral(classMode)),
            t.jsxAttribute(t.jsxIdentifier('data-vle-text-mode'), t.stringLiteral(textMode)),
            t.jsxAttribute(t.jsxIdentifier('data-vle-source-mode'), t.stringLiteral(sourceMode)),
          );
          if (instanceIndex) {
            opening.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier('data-vle-instance'),
                t.jsxExpressionContainer(t.identifier(instanceIndex)),
              ),
            );
          }
        },
      },
    };
  };
}
