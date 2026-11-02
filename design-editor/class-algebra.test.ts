import { describe, expect, it } from 'vitest';
import { applyClassEdit, categorize, collapsesMultipleTokens, isVariant } from './class-algebra';

describe('categorize', () => {
  it('matches basic categories', () => {
    expect(categorize('top-[12%]')).toBe('position-offset');
    expect(categorize('-left-4')).toBe('position-offset');
    expect(categorize('absolute')).toBe('position-mode');
    expect(categorize('relative')).toBe('position-mode');
    expect(categorize('w-[212px]')).toBe('width');
    expect(categorize('h-full')).toBe('height');
    expect(categorize('bg-white/95')).toBe('background-color');
    expect(categorize('rounded-[22px]')).toBe('border-radius');
    expect(categorize('rounded-tl-none')).toBe('border-radius');
    expect(categorize('opacity-[0.36]')).toBe('opacity');
    expect(categorize('z-[120]')).toBe('z-index');
    expect(categorize('-z-[2]')).toBe('z-index');
    expect(categorize('px-4')).toBe('padding');
    expect(categorize('py-1.5')).toBe('padding');
    expect(categorize('p-4')).toBe('padding');
    expect(categorize('gap-[18px]')).toBe('gap');
    expect(categorize('gap-x-4')).toBe('gap');
    expect(categorize('justify-around')).toBe('justify-content');
    expect(categorize('mt-2')).toBe('margin-top');
    expect(categorize('mx-auto')).toBe('margin');
    expect(categorize('-mr-16')).toBe('margin');
  });

  it('does not false-positive on lookalike utilities', () => {
    // real classNames pulled from src/ — these must NOT be caught by padding/margin/width
    expect(categorize('pointer-events-none')).toBeNull();
    expect(categorize('place-items-center')).toBeNull();
    expect(categorize('min-h-screen')).toBeNull();
    expect(categorize('max-w-xs')).toBeNull();
    expect(categorize('whitespace-nowrap')).toBeNull();
  });

  it('treats any variant-prefixed token as untouchable (returns null)', () => {
    expect(isVariant('hover:bg-green-700')).toBe(true);
    expect(categorize('hover:bg-green-700')).toBeNull();
    expect(categorize('md:max-w-[425px]')).toBeNull();
    expect(categorize('group-hover:translate-x-1')).toBeNull();
  });
});

describe('applyClassEdit', () => {
  it('replaces a single-token category cleanly', () => {
    // DashboardView.tsx progress bar: w-[60%] -> w-[75%]
    const result = applyClassEdit(
      'bg-gradient-to-r from-yellow-500 to-yellow-300 h-full w-[60%] rounded-full',
      ['w-[75%]'],
      ['width'],
    );
    expect(result.className).toBe(
      'bg-gradient-to-r from-yellow-500 to-yellow-300 h-full rounded-full w-[75%]',
    );
    expect(collapsesMultipleTokens(result)).toEqual([]);
  });

  it('never removes variant-suffixed classes sharing the same base utility', () => {
    // App.tsx Scan FAB: bg-green-600 hover:bg-green-700 ...
    const result = applyClassEdit(
      'bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-2xl',
      ['bg-[#123456]'],
      ['background-color'],
    );
    expect(result.className).toContain('hover:bg-green-700');
    expect(result.className).not.toContain('bg-green-600');
    expect(result.className).toContain('bg-[#123456]');
  });

  it('flags a multi-token collapse instead of silently discarding per-corner radius', () => {
    // DashboardView.tsx Claim button: four distinct corner-radius classes
    const existing =
      'absolute top-0 right-0 rounded-tl-none rounded-br-none rounded-tr-[32px] rounded-bl-[26px] px-5';
    const result = applyClassEdit(existing, ['rounded-2xl'], ['border-radius']);
    const collapsed = collapsesMultipleTokens(result);
    expect(collapsed).toContain('border-radius');
    expect(result.removedByCategory['border-radius']).toBe(4);
    expect(result.className).toContain('rounded-2xl');
    expect(result.className).not.toContain('rounded-tl-none');
  });

  it('flags a multi-token collapse for px/py padding pairs', () => {
    const result = applyClassEdit('px-4 py-1.5 text-xs', ['p-3'], ['padding']);
    expect(result.removedByCategory.padding).toBe(2);
    expect(collapsesMultipleTokens(result)).toContain('padding');
  });

  it('promotes position-mode alongside position-offset without touching unrelated classes', () => {
    const result = applyClassEdit(
      'w-36 h-auto object-contain pointer-events-none select-none z-20',
      ['absolute', 'top-[41.2%]', 'left-[85.6%]'],
      ['position-mode', 'position-offset'],
    );
    expect(result.className).toContain('absolute');
    expect(result.className).toContain('top-[41.2%]');
    expect(result.className).toContain('pointer-events-none');
    expect(result.className).toContain('object-contain');
  });

  it('can edit top spacing without removing horizontal margins', () => {
    const result = applyClassEdit('mx-auto mt-24 mb-3', ['mt-[32px]'], ['margin-top']);
    expect(result.className).toContain('mx-auto');
    expect(result.className).toContain('mb-3');
    expect(result.className).not.toContain('mt-24');
    expect(result.className).toContain('mt-[32px]');
  });
});
