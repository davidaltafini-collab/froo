const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

export function previewAssetReplacement(el: HTMLElement, objectUrl: string) {
  if (el instanceof HTMLImageElement) {
    el.src = objectUrl;
    return;
  }

  if (el instanceof SVGElement) {
    const image = document.createElementNS(SVG_NS, 'image');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', '100%');
    image.setAttribute('height', '100%');
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    image.setAttribute('href', objectUrl);
    image.setAttributeNS(XLINK_NS, 'href', objectUrl);
    el.replaceChildren(image);
    return;
  }

  const rect = el.getBoundingClientRect();
  const img = document.createElement('img');
  img.src = objectUrl;
  img.alt = '';
  img.style.display = 'block';
  img.style.width = '100%';
  img.style.height = rect.height > 0 ? `${rect.height}px` : 'auto';
  img.style.maxWidth = '100%';
  img.style.objectFit = 'contain';
  img.style.pointerEvents = 'none';
  el.replaceChildren(img);
}
