import { describe, expect, it } from 'vitest';
import { classifyElement } from './layout-classifier';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

function tagged(tag = 'div') {
  const el = document.createElement(tag);
  el.dataset.vleId = `src/Test.tsx:${Math.floor(Math.random() * 1000) + 1}:0`;
  el.dataset.vleSourceMode = 'static';
  return el;
}

describe('classifyElement', () => {
  it('classifies absolute elements as coordinate layers', () => {
    const parent = tagged();
    const el = tagged();
    el.style.position = 'absolute';
    parent.appendChild(el);
    document.body.appendChild(parent);
    expect(classifyElement(el).kind).toBe('absolute-layer');
    expect(classifyElement(el).allowedOperations).toContain('move-layer');
    parent.remove();
  });

  it('recognizes semantic sections without relying on a width threshold', () => {
    const parent = tagged('main');
    const section = tagged('section');
    const peer = tagged('section');
    parent.append(section, peer);
    document.body.appendChild(parent);
    expect(classifyElement(section).kind).toBe('section');
    parent.remove();
  });

  it('recognizes containers and exposes structural operations', () => {
    const parent = tagged();
    const container = tagged();
    const child = tagged();
    container.style.display = 'flex';
    container.appendChild(child);
    parent.appendChild(container);
    document.body.appendChild(parent);
    const result = classifyElement(container);
    expect(result.kind).toBe('container');
    expect(result.allowedOperations).toContain('edit-container');
    expect(result.allowedOperations).toContain('reorder');
    parent.remove();
  });

  it('keeps a full-width flex row classified as a container rather than a section', () => {
    const parent = tagged();
    const row = tagged();
    const peer = tagged();
    row.style.display = 'flex';
    row.append(tagged(), tagged(), tagged());
    parent.append(row, peer);
    parent.getBoundingClientRect = () => rect(0, 0, 400, 600);
    row.getBoundingClientRect = () => rect(0, 100, 400, 64);
    peer.getBoundingClientRect = () => rect(0, 200, 400, 64);
    document.body.appendChild(parent);
    expect(classifyElement(row).kind).toBe('container');
    parent.remove();
  });

  it('blocks structural movement for generated JSX', () => {
    const parent = tagged();
    const el = tagged();
    el.dataset.vleSourceMode = 'generated';
    parent.appendChild(el);
    document.body.appendChild(parent);
    const result = classifyElement(el);
    expect(result.kind).toBe('generated');
    expect(result.allowedOperations).not.toContain('reorder');
    parent.remove();
  });

  it('honors an explicit editor override', () => {
    const el = tagged();
    el.getBoundingClientRect = () => rect(0, 0, 100, 40);
    document.body.appendChild(el);
    expect(classifyElement(el, 'layer').kind).toBe('absolute-layer');
    el.remove();
  });
});
