import { afterEach, describe, expect, it } from 'vitest';
import { previewAssetReplacement } from './replacement-preview';

afterEach(() => document.body.replaceChildren());

describe('asset replacement preview', () => {
  it('uses a valid SVG image node when replacing a rendered icon', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
    document.body.appendChild(svg);

    previewAssetReplacement(svg as unknown as HTMLElement, 'blob:replacement');

    expect(svg.children).toHaveLength(1);
    expect(svg.firstElementChild?.tagName.toLowerCase()).toBe('image');
    expect(svg.firstElementChild?.getAttribute('width')).toBe('100%');
    expect(svg.firstElementChild?.getAttribute('height')).toBe('100%');
    expect(svg.firstElementChild?.getAttribute('href')).toBe('blob:replacement');
  });
});
