import type { SelectionContextBody, SelectionContextResponseBody } from '../shared-types';
import { queryByVleId } from './dom-utils';
import { classifyElement } from './layout-classifier';
import { getSnapshot } from './store';

function attributesFor(el: HTMLElement): Record<string, string> {
  return Object.fromEntries([...el.attributes].map((attr) => [attr.name, attr.value]));
}

function pickedComputedStyle(el: HTMLElement): Record<string, string> {
  const style = getComputedStyle(el);
  const properties = [
    'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height',
    'min-width', 'max-width', 'min-height', 'max-height', 'box-sizing',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'gap', 'row-gap', 'column-gap', 'flex-direction', 'flex-wrap',
    'justify-content', 'align-items', 'align-self', 'order',
    'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
    'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
    'background-color', 'color', 'border-radius', 'opacity', 'transform',
  ];
  return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
}

export async function sendSelectionContext(id: string, prompt?: string): Promise<SelectionContextResponseBody> {
  const el = queryByVleId(id);
  if (!el) return { ok: false, error: 'selected element is no longer in the DOM' };

  const rect = el.getBoundingClientRect();
  const state = getSnapshot();
  const body: SelectionContextBody = {
    version: 1,
    id,
    tagName: el.tagName.toLowerCase(),
    className: el.className,
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 500),
    route: `${location.pathname}${location.search}${location.hash}`,
    prompt: prompt?.trim() || undefined,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    },
    rect: {
      top: Math.round(rect.top * 10) / 10,
      left: Math.round(rect.left * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
    },
    parentId: el.parentElement?.closest<HTMLElement>('[data-vle-id]')?.dataset.vleId,
    childIds: [...el.querySelectorAll<HTMLElement>('[data-vle-id]')].map((child) => child.dataset.vleId!).slice(0, 100),
    siblingIds: el.parentElement
      ? [...el.parentElement.children]
          .filter((child): child is HTMLElement => child instanceof HTMLElement && child !== el && !!child.dataset.vleId)
          .map((sibling) => sibling.dataset.vleId!)
          .slice(0, 100)
      : [],
    attributes: attributesFor(el),
    computedStyle: pickedComputedStyle(el),
    layout: classifyElement(el, state.layoutOverrides[id] ?? 'auto'),
  };

  const res = await fetch('/__design-mode/selection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as SelectionContextResponseBody;
}
