import { parseExpression } from '@babel/parser';
import type { JSXElement } from '@babel/types';
import { describe, expect, it } from 'vitest';
import { computeTextMode, getEditableTextChild, isTaggable } from './ast-helpers';

function openingFor(source: string) {
  return (parseExpression(source, { plugins: ['jsx', 'typescript'] }) as JSXElement).openingElement;
}

describe('taggable JSX elements', () => {
  it('tags host elements and styled component usages', () => {
    expect(isTaggable(openingFor('<div />'))).toBe(true);
    expect(isTaggable(openingFor('<Trophy className="w-5 h-5" />'))).toBe(true);
    expect(isTaggable(openingFor('<game.icon className="w-5 h-5" />'))).toBe(true);
  });

  it('does not tag components without a DOM styling surface or fragments', () => {
    expect(isTaggable(openingFor('<GameComponent onDone={done} />'))).toBe(false);
    expect(isTaggable(openingFor('<Fragment><div /></Fragment>'))).toBe(false);
    expect(isTaggable(openingFor('<React.Fragment><div /></React.Fragment>'))).toBe(false);
  });
});

describe('mixed JSX text editing', () => {
  it('targets one direct static text segment without touching a nested badge', () => {
    const element = parseExpression(
      '<h4>Store Runner<span>Live</span></h4>',
      { plugins: ['jsx', 'typescript'] },
    ) as JSXElement;

    expect(computeTextMode(element.children)).toBe('mixed');
    expect(getEditableTextChild(element.children)?.value.trim()).toBe('Store Runner');
    expect(element.children.some((child) => child.type === 'JSXElement')).toBe(true);
  });

  it('refuses ambiguous elements with two direct static text segments', () => {
    const element = parseExpression(
      '<p>First<strong>middle</strong>Second</p>',
      { plugins: ['jsx', 'typescript'] },
    ) as JSXElement;

    expect(getEditableTextChild(element.children)).toBeNull();
  });
});
