import { describe, expect, it } from 'vitest';
import { elementToEditableSvg } from './export-svg';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('editable SVG export', () => {
  it('keeps backgrounds, text, and inline icon paths as editable SVG objects', async () => {
    const spacingWrapper = document.createElement('div');
    spacingWrapper.dataset.vleId = 'src/views/DashboardView.tsx:119:6';
    spacingWrapper.getBoundingClientRect = () => rect(68, 40, 424, 96);
    const card = document.createElement('section');
    card.dataset.vleId = 'src/views/DashboardView.tsx:120:8';
    card.style.backgroundColor = 'rgb(255, 255, 255)';
    card.style.border = '1px solid rgb(226, 232, 240)';
    card.style.borderRadius = '16px';
    card.style.fontFamily = 'Segoe UI, sans-serif';
    card.textContent = 'Store Runner';
    card.getBoundingClientRect = () => rect(100, 40, 360, 96);

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.innerHTML = '<path d="M4 12h16" stroke="currentColor"/>';
    icon.style.color = 'rgb(100, 116, 139)';
    icon.getBoundingClientRect = () => rect(116, 56, 24, 24);
    card.append(icon);
    spacingWrapper.append(card);
    document.body.append(spacingWrapper);

    const originalRangeRect = Range.prototype.getBoundingClientRect;
    Range.prototype.getBoundingClientRect = () => rect(152, 58, 102, 18);
    try {
      const result = await elementToEditableSvg(spacingWrapper);
      const parsed = new DOMParser().parseFromString(result.svg, 'image/svg+xml');

      expect(parsed.querySelector('parsererror')).toBeNull();
      expect(parsed.documentElement.getAttribute('viewBox')).toBe('0 0 360 96');
      expect(parsed.documentElement.getAttribute('data-design-editor-source-id')).toBe('src/views/DashboardView.tsx:120:8');
      expect(parsed.querySelector('rect')).not.toBeNull();
      expect(parsed.querySelector('text')?.textContent).toBe('Store Runner');
      expect(parsed.querySelector('path')?.getAttribute('d')).toBe('M4 12h16');
      expect(parsed.querySelector('foreignObject')).toBeNull();
      expect(result.svg).not.toMatch(/oklch|currentColor|<filter/i);
      expect(parsed.querySelector('text')?.getAttribute('font-family')).toBe('Segoe UI');
      expect(result.warnings).toContain('The empty spacing wrapper was cropped; the visual card itself was exported.');
      expect(result.fileName).toBe('store-runner-section.svg');
    } finally {
      Range.prototype.getBoundingClientRect = originalRangeRect;
      spacingWrapper.remove();
    }
  });

  it('inlines SVG image assets so Affinity does not lose nested data images', async () => {
    const image = document.createElement('img');
    image.dataset.vleId = 'src/views/DashboardView.tsx:313:16';
    image.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="#006320"/></svg>')}`;
    image.getBoundingClientRect = () => rect(20, 20, 48, 48);
    document.body.append(image);
    try {
      const result = await elementToEditableSvg(image);
      const parsed = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
      expect(parsed.querySelector('parsererror')).toBeNull();
      expect(parsed.querySelectorAll('svg')).toHaveLength(2);
      expect(parsed.querySelector('image')).toBeNull();
      expect(parsed.querySelector('path')?.getAttribute('fill')).toBe('#006320');
    } finally {
      image.remove();
    }
  });
});
