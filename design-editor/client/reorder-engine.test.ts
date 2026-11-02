import { describe, expect, it } from 'vitest';
import { getReorderInsertion, isSafeSameSourceParent } from './reorder-engine';

function domRect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

function element(id: string, box: DOMRect) {
  const el = document.createElement('div');
  el.dataset.vleId = `src/Test.tsx:${id}:0`;
  el.dataset.vleSourceMode = 'static';
  el.getBoundingClientRect = () => box;
  return el;
}

describe('reorder engine', () => {
  it('uses horizontal insertion slots for a flex row', () => {
    const parent = element('1', domRect(0, 0, 360, 100));
    parent.style.display = 'flex';
    parent.style.flexDirection = 'row';
    const a = element('2', domRect(0, 0, 100, 80));
    const b = element('3', domRect(120, 0, 100, 80));
    const c = element('4', domRect(240, 0, 100, 80));
    parent.append(a, b, c);
    document.body.appendChild(parent);

    const insertion = getReorderInsertion(a, 180, 0);
    expect(insertion?.beforeId).toBe(c.dataset.vleId);
    expect(insertion?.indicator.axis).toBe('x');
    expect(insertion?.changed).toBe(true);
    parent.remove();
  });

  it('uses vertical insertion slots for page-flow sections', () => {
    const parent = element('10', domRect(0, 0, 400, 600));
    const a = element('11', domRect(0, 0, 400, 160));
    const b = element('12', domRect(0, 180, 400, 160));
    const c = element('13', domRect(0, 360, 400, 160));
    parent.append(a, b, c);
    document.body.appendChild(parent);

    const insertion = getReorderInsertion(c, 0, -420);
    expect(insertion?.beforeId).toBe(a.dataset.vleId);
    expect(insertion?.indicator.axis).toBe('y');
    parent.remove();
  });

  it('rejects generated and cross-file moves before previewing a source reorder', () => {
    const parent = element('20', domRect(0, 0, 400, 400));
    const generated = element('21', domRect(0, 0, 100, 100));
    generated.dataset.vleSourceMode = 'generated';
    parent.appendChild(generated);
    document.body.appendChild(parent);
    expect(isSafeSameSourceParent(generated)).toBe(false);

    generated.dataset.vleSourceMode = 'static';
    generated.dataset.vleId = 'src/Other.tsx:1:0';
    expect(isSafeSameSourceParent(generated)).toBe(false);
    parent.remove();
  });
});

