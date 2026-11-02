import { afterEach, describe, expect, it } from 'vitest';
import { queryByVleId } from './dom-utils';
import {
  clearRememberedHover,
  clearRememberedSelection,
  rememberHoveredTarget,
  rememberSelectedTarget,
} from './element-targets';

const SOURCE_ID = 'src/Repeated.tsx:10:4';

function repeatedElement(label: string): HTMLElement {
  const el = document.createElement('div');
  el.dataset.vleId = SOURCE_ID;
  el.textContent = label;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  clearRememberedHover();
  clearRememberedSelection();
  document.body.replaceChildren();
});

describe('runtime element targets', () => {
  it('returns the exact repeated instance selected on the canvas', () => {
    repeatedElement('first');
    const second = repeatedElement('second');

    rememberSelectedTarget(second, false);

    expect(queryByVleId(SOURCE_ID)).toBe(second);
  });

  it('updates the preferred hover target when repeated instances share an id', () => {
    const first = repeatedElement('first');
    const second = repeatedElement('second');

    rememberHoveredTarget(first);
    expect(queryByVleId(SOURCE_ID)).toBe(first);
    rememberHoveredTarget(second);
    expect(queryByVleId(SOURCE_ID)).toBe(second);
  });

  it('falls back to a connected matching element after the target unmounts', () => {
    const first = repeatedElement('first');
    const second = repeatedElement('second');
    rememberSelectedTarget(second, false);
    second.remove();

    expect(queryByVleId(SOURCE_ID)).toBe(first);
  });
});
