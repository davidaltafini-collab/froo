import type { ExportSvgResponseBody } from '../shared-types';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface EditableSvgExport {
  fileName: string;
  svg: string;
  warnings: string[];
  savedPath?: string;
}

interface ExportContext {
  rootRect: DOMRect;
  definitions: string[];
  warnings: string[];
  nextId: number;
}

export type AffinityExportMode = 'exact' | 'editable';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function number(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function px(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface SvgPaint {
  color: string;
  opacity: number;
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function byteToHex(value: number): string {
  return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
}

function srgbChannel(linear: number): number {
  const value = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  return clamp(value) * 255;
}

function oklchToPaint(value: string): SvgPaint | null {
  const match = value.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
  if (!match) return null;
  const lightness = match[1].endsWith('%') ? Number.parseFloat(match[1]) / 100 : Number(match[1]);
  const chroma = Number(match[2]);
  const hue = Number(match[3]) * Math.PI / 180;
  const alpha = match[4] ? (match[4].endsWith('%') ? Number.parseFloat(match[4]) / 100 : Number(match[4])) : 1;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  const red = srgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = srgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = srgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return { color: `#${byteToHex(red)}${byteToHex(green)}${byteToHex(blue)}`, opacity: clamp(alpha) };
}

function cssColorToPaint(value: string): SvgPaint | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'transparent') return null;
  const oklch = oklchToPaint(normalized);
  if (oklch) return oklch;

  const hex = normalized.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const expanded = hex.length === 3 || hex.length === 4 ? [...hex].map((character) => character.repeat(2)).join('') : hex;
    const opacity = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
    return { color: `#${expanded.slice(0, 6)}`, opacity };
  }

  const rgb = normalized.match(/^rgba?\(\s*([\d.]+)%?[ ,]+([\d.]+)%?[ ,]+([\d.]+)%?(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (rgb) {
    const percentages = normalized.match(/^rgba?\(\s*[\d.]+%/) != null;
    const multiplier = percentages ? 2.55 : 1;
    const opacity = rgb[4] ? (rgb[4].endsWith('%') ? Number.parseFloat(rgb[4]) / 100 : Number(rgb[4])) : 1;
    return {
      color: `#${byteToHex(Number(rgb[1]) * multiplier)}${byteToHex(Number(rgb[2]) * multiplier)}${byteToHex(Number(rgb[3]) * multiplier)}`,
      opacity: clamp(opacity),
    };
  }

  // Affinity is much more predictable with a conservative sRGB fallback than
  // with browser-only CSS Color 4 syntax.
  return { color: '#000000', opacity: 1 };
}

function isVisibleColor(value: string): boolean {
  return (cssColorToPaint(value)?.opacity ?? 0) > 0;
}

function radiusFor(styleValue: string, width: number, height: number): number {
  const maximum = Math.min(width, height) / 2;
  const parsed = px(styleValue);
  const radius = styleValue.includes('%') ? maximum * parsed / 50 : parsed;
  return clamp(radius, 0, maximum);
}

function affinityFontFamily(value: string): string {
  const families = value.split(',').map((family) => family.trim().replace(/^['"]|['"]$/g, ''));
  return families.find((family) => /^(Segoe UI|Arial|Roboto|Helvetica Neue|Noto Sans)$/i.test(family))
    ?? families.find((family) => family && !/^(sans-serif|serif|monospace|system-ui|ui-)/i.test(family))
    ?? 'Segoe UI';
}

function computedOpacity(style: CSSStyleDeclaration): number {
  const opacity = Number(style.opacity);
  return style.opacity && Number.isFinite(opacity) ? clamp(opacity) : 1;
}

function effectiveBorderWidth(style: CSSStyleDeclaration): number {
  return Math.max(
    style.borderTopStyle === 'none' ? 0 : px(style.borderTopWidth),
    style.borderRightStyle === 'none' ? 0 : px(style.borderRightWidth),
    style.borderBottomStyle === 'none' ? 0 : px(style.borderBottomWidth),
    style.borderLeftStyle === 'none' ? 0 : px(style.borderLeftWidth),
  );
}

function localBox(rect: DOMRect, root: DOMRect) {
  return {
    x: rect.left - root.left,
    y: rect.top - root.top,
    width: rect.width,
    height: rect.height,
  };
}

function nextDefinitionId(context: ExportContext, prefix: string): string {
  const id = `${prefix}-${context.nextId}`;
  context.nextId += 1;
  return id;
}

function gradientFill(backgroundImage: string, context: ExportContext): string | null {
  const colors = backgroundImage.match(/oklch\([^)]*\)|(?:rgba?|hsla?)\([^)]*\)|#[0-9a-f]{3,8}/gi);
  if (!colors?.length) return null;

  const id = nextDefinitionId(context, 'gradient');
  const stops = colors
    .map((color, index) => {
      const offset = colors.length === 1 ? 0 : index / (colors.length - 1);
      const paint = cssColorToPaint(color) ?? { color: '#000000', opacity: 0 };
      return `<stop offset="${number(offset * 100)}%" stop-color="${paint.color}"${paint.opacity !== 1 ? ` stop-opacity="${number(paint.opacity)}"` : ''}/>`;
    })
    .join('');

  if (backgroundImage.startsWith('radial-gradient')) {
    context.definitions.push(`<radialGradient id="${id}" cx="50%" cy="50%" r="70%">${stops}</radialGradient>`);
  } else {
    let coordinates = 'x1="0%" y1="0%" x2="0%" y2="100%"';
    if (/to right bottom|135deg/.test(backgroundImage)) coordinates = 'x1="0%" y1="0%" x2="100%" y2="100%"';
    else if (/to left bottom|45deg/.test(backgroundImage)) coordinates = 'x1="100%" y1="0%" x2="0%" y2="100%"';
    else if (/to right|90deg/.test(backgroundImage)) coordinates = 'x1="0%" y1="0%" x2="100%" y2="0%"';
    else if (/to left|270deg/.test(backgroundImage)) coordinates = 'x1="100%" y1="0%" x2="0%" y2="0%"';
    else if (/to top|0deg/.test(backgroundImage)) coordinates = 'x1="0%" y1="100%" x2="0%" y2="0%"';
    context.definitions.push(`<linearGradient id="${id}" ${coordinates}>${stops}</linearGradient>`);
  }
  return `url(#${id})`;
}

function compatibleBlurShape(style: CSSStyleDeclaration, box: ReturnType<typeof localBox>, context: ExportContext): string | null {
  const match = style.filter.match(/blur\(([\d.]+)px\)/);
  const paint = cssColorToPaint(style.backgroundColor);
  if (!match || !paint) return null;
  const blur = Number(match[1]);
  const expansion = blur * 1.35;
  const id = nextDefinitionId(context, 'soft-glow');
  context.definitions.push(
    `<radialGradient id="${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${paint.color}" stop-opacity="${number(paint.opacity * 0.9)}"/><stop offset="48%" stop-color="${paint.color}" stop-opacity="${number(paint.opacity * 0.55)}"/><stop offset="100%" stop-color="${paint.color}" stop-opacity="0"/></radialGradient>`,
  );
  return `<ellipse cx="${number(box.x + box.width / 2)}" cy="${number(box.y + box.height / 2)}" rx="${number(box.width / 2 + expansion)}" ry="${number(box.height / 2 + expansion)}" fill="url(#${id})"/>`;
}

function compatibleShadow(style: CSSStyleDeclaration, box: ReturnType<typeof localBox>, radius: number): string {
  if (!style.boxShadow || style.boxShadow === 'none') return '';
  return [2, 1]
    .map((spread, index) => `<rect x="${number(box.x - spread)}" y="${number(box.y + 1 - spread)}" width="${number(box.width + spread * 2)}" height="${number(box.height + spread * 2)}" rx="${number(Math.min(radius + spread, Math.min(box.width, box.height) / 2))}" fill="#0f172a" fill-opacity="${index === 0 ? '0.025' : '0.035'}"/>`)
    .join('');
}

function shapeForElement(el: HTMLElement, context: ExportContext): string {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return '';
  const style = getComputedStyle(el);
  const box = localBox(rect, context.rootRect);
  const radius = Math.max(
    radiusFor(style.borderTopLeftRadius, box.width, box.height),
    radiusFor(style.borderTopRightRadius, box.width, box.height),
    radiusFor(style.borderBottomRightRadius, box.width, box.height),
    radiusFor(style.borderBottomLeftRadius, box.width, box.height),
  );
  const backgroundImage = style.backgroundImage;
  const fill = backgroundImage.includes('gradient(')
    ? gradientFill(backgroundImage, context)
    : isVisibleColor(style.backgroundColor)
      ? cssColorToPaint(style.backgroundColor)
      : null;
  const borderWidth = effectiveBorderWidth(style);
  const borderColor = isVisibleColor(style.borderColor) ? cssColorToPaint(style.borderColor) : null;
  if (!fill && (!borderWidth || !borderColor)) return '';

  const compatibleBlur = compatibleBlurShape(style, box, context);
  if (compatibleBlur) return compatibleBlur;
  const fillColor = typeof fill === 'string' ? fill : fill?.color;
  const fillOpacity = typeof fill === 'string' ? 1 : fill?.opacity ?? 0;
  const attributes = [
    `x="${number(box.x)}"`,
    `y="${number(box.y)}"`,
    `width="${number(box.width)}"`,
    `height="${number(box.height)}"`,
    radius ? `rx="${number(radius)}"` : '',
    `fill="${escapeXml(fillColor ?? 'none')}"`,
    fillColor && fillOpacity !== 1 ? `fill-opacity="${number(fillOpacity)}"` : '',
    borderWidth && borderColor ? `stroke="${borderColor.color}"` : '',
    borderWidth && borderColor && borderColor.opacity !== 1 ? `stroke-opacity="${number(borderColor.opacity)}"` : '',
    borderWidth && borderColor ? `stroke-width="${number(borderWidth)}"` : '',
    computedOpacity(style) !== 1 ? `opacity="${number(computedOpacity(style))}"` : '',
  ].filter(Boolean);
  return `${compatibleShadow(style, box, radius)}<rect ${attributes.join(' ')}/>`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not embed an image.'));
    reader.readAsDataURL(blob);
  });
}

async function embeddedImageUrl(source: string, context: ExportContext): Promise<string> {
  if (source.startsWith('data:')) return source;
  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(String(response.status));
    return await blobToDataUrl(await response.blob());
  } catch {
    context.warnings.push('One image could not be embedded. Its original URL remains linked in the SVG.');
    try {
      return new URL(source, window.location.href).href;
    } catch {
      return source;
    }
  }
}

function copyComputedStyles(source: Element, clone: Element) {
  if (!(source instanceof HTMLElement || source instanceof SVGElement)) return;
  if (!(clone instanceof HTMLElement || clone instanceof SVGElement)) return;
  const computed = getComputedStyle(source);
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    if (!property) continue;
    clone.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
  }
  clone.style.setProperty('animation', 'none', 'important');
  clone.style.setProperty('transition', 'none', 'important');
  clone.style.setProperty('caret-color', 'transparent', 'important');
}

async function cloneForBrowserSnapshot(node: Node, context: ExportContext): Promise<Node> {
  if (node instanceof Text) return document.createTextNode(node.nodeValue ?? '');
  if (!(node instanceof Element)) return node.cloneNode(false);

  const clone = node.cloneNode(false) as Element;
  copyComputedStyles(node, clone);
  [...clone.attributes].forEach((attribute) => {
    if (attribute.name.startsWith('data-vle-')) clone.removeAttribute(attribute.name);
  });
  if (node instanceof HTMLImageElement && clone instanceof HTMLImageElement) {
    clone.src = await embeddedImageUrl(node.currentSrc || node.src, context);
    clone.removeAttribute('srcset');
  }
  if (node instanceof HTMLInputElement && clone instanceof HTMLInputElement) clone.value = node.value;
  if (node instanceof HTMLTextAreaElement && clone instanceof HTMLTextAreaElement) clone.value = node.value;

  for (const child of node.childNodes) clone.append(await cloneForBrowserSnapshot(child, context));
  return clone;
}

function loadSvgAsImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The browser could not render the exact Affinity snapshot.'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function browserSnapshotDataUrl(target: HTMLElement, context: ExportContext): Promise<string> {
  const width = context.rootRect.width;
  const height = context.rootRect.height;
  const clone = await cloneForBrowserSnapshot(target, context) as HTMLElement;
  clone.style.setProperty('margin', '0', 'important');
  clone.style.setProperty('width', `${width}px`, 'important');
  clone.style.setProperty('height', `${height}px`, 'important');
  clone.style.setProperty('transform', 'none', 'important');
  const markup = new XMLSerializer().serializeToString(clone);
  const renderSvg = [
    `<svg xmlns="${SVG_NS}" width="${number(width)}" height="${number(height)}" viewBox="0 0 ${number(width)} ${number(height)}">`,
    `<foreignObject x="0" y="0" width="100%" height="100%">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${number(width)}px;height:${number(height)}px;overflow:hidden">${markup}</div>`,
    `</foreignObject></svg>`,
  ].join('');
  const rendered = await loadSvgAsImage(renderSvg);
  const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const drawing = canvas.getContext('2d');
  if (!drawing) throw new Error('The browser could not create the exact Affinity canvas.');
  drawing.scale(scale, scale);
  drawing.drawImage(rendered, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

async function renderImage(el: HTMLImageElement, context: ExportContext): Promise<string> {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return '';
  const style = getComputedStyle(el);
  const box = localBox(rect, context.rootRect);
  const href = await embeddedImageUrl(el.currentSrc || el.src, context);
  const aspect = style.objectFit === 'cover' ? 'xMidYMid slice' : style.objectFit === 'fill' ? 'none' : 'xMidYMid meet';
  const inlineSvg = inlineSvgImage(href, box, aspect, computedOpacity(style));
  if (inlineSvg) return inlineSvg;
  return `<image x="${number(box.x)}" y="${number(box.y)}" width="${number(box.width)}" height="${number(box.height)}" href="${escapeXml(href)}" preserveAspectRatio="${aspect}"${computedOpacity(style) !== 1 ? ` opacity="${number(computedOpacity(style))}"` : ''}/>`;
}

function svgTextFromDataUrl(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:image\/svg\+xml(?:;charset=[^;,]+)?(;base64)?,(.*)$/i);
  if (!match) return null;
  try {
    if (match[1]) {
      const binary = atob(match[2]);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(match[2]);
  } catch {
    return null;
  }
}

function inlineSvgImage(
  dataUrl: string,
  box: ReturnType<typeof localBox>,
  preserveAspectRatio: string,
  opacity: number,
): string | null {
  const source = svgTextFromDataUrl(dataUrl);
  if (!source) return null;
  const documentNode = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (documentNode.querySelector('parsererror') || documentNode.documentElement.tagName.toLowerCase() !== 'svg') return null;
  const svg = documentNode.documentElement;
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('x', number(box.x));
  svg.setAttribute('y', number(box.y));
  svg.setAttribute('width', number(box.width));
  svg.setAttribute('height', number(box.height));
  svg.setAttribute('preserveAspectRatio', preserveAspectRatio);
  if (opacity !== 1) svg.setAttribute('opacity', number(opacity));
  return new XMLSerializer().serializeToString(svg);
}

function renderInlineSvg(el: SVGSVGElement, context: ExportContext): string {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return '';
  const box = localBox(rect, context.rootRect);
  const clone = el.cloneNode(true) as SVGSVGElement;
  const style = getComputedStyle(el);
  const inheritedPaint = cssColorToPaint(style.color) ?? { color: '#000000', opacity: 1 };
  [clone, ...clone.querySelectorAll('*')].forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (attribute.name.startsWith('data-vle-') || attribute.name === 'class') node.removeAttribute(attribute.name);
    });
    for (const attributeName of ['fill', 'stroke'] as const) {
      const value = node.getAttribute(attributeName);
      if (!value || value === 'none' || value.startsWith('url(')) continue;
      const paint = value.toLowerCase() === 'currentcolor' ? inheritedPaint : cssColorToPaint(value);
      if (!paint) continue;
      node.setAttribute(attributeName, paint.color);
      if (paint.opacity !== 1) node.setAttribute(`${attributeName}-opacity`, number(paint.opacity));
    }
    const inlineStyle = node.getAttribute('style');
    if (inlineStyle?.includes('currentColor')) node.setAttribute('style', inlineStyle.replaceAll('currentColor', inheritedPaint.color));
  });
  [...clone.attributes].forEach((attribute) => {
    if (attribute.name.startsWith('data-vle-') || ['class', 'x', 'y', 'width', 'height'].includes(attribute.name)) clone.removeAttribute(attribute.name);
  });
  clone.setAttribute('x', number(box.x));
  clone.setAttribute('y', number(box.y));
  clone.setAttribute('width', number(box.width));
  clone.setAttribute('height', number(box.height));
  clone.setAttribute('color', inheritedPaint.color);
  if (computedOpacity(style) !== 1) clone.setAttribute('opacity', number(computedOpacity(style)));
  return new XMLSerializer().serializeToString(clone);
}

function transformedText(value: string, style: CSSStyleDeclaration): string {
  if (style.textTransform === 'uppercase') return value.toUpperCase();
  if (style.textTransform === 'lowercase') return value.toLowerCase();
  if (style.textTransform === 'capitalize') return value.replace(/\b\w/g, (character) => character.toUpperCase());
  return value;
}

function renderTextNode(node: Text, parent: HTMLElement, context: ExportContext): string {
  const raw = node.nodeValue ?? '';
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const range = document.createRange();
  range.selectNodeContents(node);
  const rect = range.getBoundingClientRect();
  range.detach();
  if (rect.width <= 0 || rect.height <= 0) return '';

  const style = getComputedStyle(parent);
  const box = localBox(rect, context.rootRect);
  const fontSize = px(style.fontSize) || rect.height;
  const lineHeight = style.lineHeight === 'normal' ? fontSize * 1.2 : px(style.lineHeight) || fontSize * 1.2;
  const baseline = box.y + (rect.height - lineHeight) / 2 + fontSize * 0.82;
  const paint = cssColorToPaint(style.color) ?? { color: '#000000', opacity: 1 };
  const attributes = [
    `x="${number(box.x)}"`,
    `y="${number(baseline)}"`,
    `fill="${paint.color}"`,
    paint.opacity !== 1 ? `fill-opacity="${number(paint.opacity)}"` : '',
    `font-family="${escapeXml(affinityFontFamily(style.fontFamily))}"`,
    `font-size="${number(fontSize)}"`,
    `font-weight="${escapeXml(style.fontWeight)}"`,
    style.fontStyle !== 'normal' ? `font-style="${escapeXml(style.fontStyle)}"` : '',
    px(style.letterSpacing) ? `letter-spacing="${number(px(style.letterSpacing))}"` : '',
    computedOpacity(style) !== 1 ? `opacity="${number(computedOpacity(style))}"` : '',
  ].filter(Boolean);
  return `<text ${attributes.join(' ')}>${escapeXml(transformedText(text, style))}</text>`;
}

function backgroundImageUrl(style: CSSStyleDeclaration): string | null {
  const match = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
  return match?.[1] ?? null;
}

async function renderElement(el: Element, context: ExportContext): Promise<string> {
  if (el instanceof SVGSVGElement) return renderInlineSvg(el, context);
  if (!(el instanceof HTMLElement)) return '';

  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || computedOpacity(style) === 0) return '';
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return '';

  const fragments: string[] = [];
  const shape = shapeForElement(el, context);
  if (shape) fragments.push(shape);

  if (el instanceof HTMLImageElement) {
    fragments.push(await renderImage(el, context));
    return fragments.join('');
  }

  const cssImage = backgroundImageUrl(style);
  if (cssImage) {
    const box = localBox(rect, context.rootRect);
    const href = await embeddedImageUrl(cssImage, context);
    fragments.push(`<image x="${number(box.x)}" y="${number(box.y)}" width="${number(box.width)}" height="${number(box.height)}" href="${escapeXml(href)}" preserveAspectRatio="xMidYMid slice"/>`);
  } else if (style.backgroundImage !== 'none' && !style.backgroundImage.includes('gradient(')) {
    context.warnings.push('One complex CSS background could not be translated into editable SVG objects.');
  }

  const children: string[] = [];
  for (const child of el.childNodes) {
    if (child instanceof Text) children.push(renderTextNode(child, el, context));
    else if (child instanceof Element) children.push(await renderElement(child, context));
  }

  const clipsChildren = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY);
  if (clipsChildren && children.some(Boolean)) {
    const box = localBox(rect, context.rootRect);
    const radius = Math.max(
      radiusFor(style.borderTopLeftRadius, box.width, box.height),
      radiusFor(style.borderTopRightRadius, box.width, box.height),
      radiusFor(style.borderBottomRightRadius, box.width, box.height),
      radiusFor(style.borderBottomLeftRadius, box.width, box.height),
    );
    const id = nextDefinitionId(context, 'clip');
    context.definitions.push(`<clipPath id="${id}"><rect x="${number(box.x)}" y="${number(box.y)}" width="${number(box.width)}" height="${number(box.height)}"${radius ? ` rx="${number(radius)}"` : ''}/></clipPath>`);
    fragments.push(`<g clip-path="url(#${id})">${children.join('')}</g>`);
  } else {
    fragments.push(children.join(''));
  }
  return fragments.join('');
}

function hasOwnVisualSurface(el: HTMLElement): boolean {
  if (el instanceof HTMLImageElement || el instanceof HTMLCanvasElement || el instanceof HTMLVideoElement) return true;
  const style = getComputedStyle(el);
  const borderWidth = effectiveBorderWidth(style);
  const hasDirectText = [...el.childNodes].some((node) => node instanceof Text && !!node.nodeValue?.trim());
  return hasDirectText
    || isVisibleColor(style.backgroundColor)
    || (!!style.backgroundImage && style.backgroundImage !== 'none')
    || borderWidth > 0
    || (!!style.boxShadow && style.boxShadow !== 'none');
}

function visibleDirectChildren(el: HTMLElement): HTMLElement[] {
  return [...el.children].filter((child): child is HTMLElement => {
    if (!(child instanceof HTMLElement)) return false;
    const style = getComputedStyle(child);
    const rect = child.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && computedOpacity(style) > 0 && rect.width > 0 && rect.height > 0;
  });
}

/**
 * A click often selects a spacing wrapper instead of the visual card inside it.
 * Affinity needs the artwork bounds, while replacement needs the interactive
 * card to survive. Descend only through visually empty, single-child wrappers.
 */
export function getSvgRoundTripTarget(selection: HTMLElement): HTMLElement {
  let target = selection;
  for (let depth = 0; depth < 5 && !hasOwnVisualSurface(target); depth += 1) {
    const children = visibleDirectChildren(target);
    if (children.length !== 1) break;
    target = children[0];
  }
  return target;
}

function fileNameFor(el: HTMLElement): string {
  const label = (el.getAttribute('aria-label') || el.textContent || el.tagName)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${label || 'selected-element'}-section.svg`;
}

export async function elementToExactAffinitySvg(el: HTMLElement): Promise<EditableSvgExport> {
  const target = getSvgRoundTripTarget(el);
  const rootRect = target.getBoundingClientRect();
  if (rootRect.width <= 0 || rootRect.height <= 0) throw new Error('The selected element has no visible size to export.');
  const context: ExportContext = { rootRect, definitions: [], warnings: [], nextId: 1 };
  const snapshot = await browserSnapshotDataUrl(target, context);
  const id = target.dataset.vleId ?? el.dataset.vleId ?? '';
  const title = (target.getAttribute('aria-label') || target.textContent || 'Selected element').replace(/\s+/g, ' ').trim().slice(0, 120);
  const metadata = JSON.stringify({
    format: 'design-editor-exact-affinity-v1',
    sourceId: id,
    exportedAt: new Date().toISOString(),
    width: Number(rootRect.width.toFixed(2)),
    height: Number(rootRect.height.toFixed(2)),
    pixelRatio: Math.max(2, Math.min(3, window.devicePixelRatio || 2)),
  });
  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="${SVG_NS}" width="${number(rootRect.width)}" height="${number(rootRect.height)}" viewBox="0 0 ${number(rootRect.width)} ${number(rootRect.height)}" data-design-editor-source-id="${escapeXml(id)}" data-design-editor-export="exact-affinity-v1">`,
    `<title>${escapeXml(title)}</title><metadata>${escapeXml(metadata)}</metadata>`,
    `<image x="0" y="0" width="${number(rootRect.width)}" height="${number(rootRect.height)}" href="${snapshot}" preserveAspectRatio="none"/>`,
    `</svg>`,
  ].join('');
  const baseName = fileNameFor(target).replace(/-section\.svg$/, '');
  return {
    fileName: `${baseName}-exact-affinity.svg`,
    svg,
    warnings: ['Exact Affinity mode uses one high-resolution image layer so no browser styling can be reinterpreted or lost.'],
  };
}

export async function elementToEditableSvg(el: HTMLElement): Promise<EditableSvgExport> {
  const target = getSvgRoundTripTarget(el);
  const rootRect = target.getBoundingClientRect();
  if (rootRect.width <= 0 || rootRect.height <= 0) throw new Error('The selected element has no visible size to export.');

  const context: ExportContext = { rootRect, definitions: [], warnings: [], nextId: 1 };
  if (target !== el) context.warnings.push('The empty spacing wrapper was cropped; the visual card itself was exported.');
  const content = await renderElement(target, context);
  const id = target.dataset.vleId ?? el.dataset.vleId ?? '';
  const title = (target.getAttribute('aria-label') || target.textContent || 'Selected element').replace(/\s+/g, ' ').trim().slice(0, 120);
  const metadata = JSON.stringify({
    format: 'design-editor-editable-dom-v1',
    sourceId: id,
    exportedAt: new Date().toISOString(),
    width: Number(rootRect.width.toFixed(2)),
    height: Number(rootRect.height.toFixed(2)),
  });
  const definitions = context.definitions.length ? `<defs>${context.definitions.join('')}</defs>` : '';
  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="${SVG_NS}" width="${number(rootRect.width)}" height="${number(rootRect.height)}" viewBox="0 0 ${number(rootRect.width)} ${number(rootRect.height)}" data-design-editor-source-id="${escapeXml(id)}" data-design-editor-export="editable-dom-v1">`,
    `<title>${escapeXml(title)}</title>`,
    `<metadata>${escapeXml(metadata)}</metadata>`,
    definitions,
    content,
    `</svg>`,
  ].join('');
  return { fileName: fileNameFor(target), svg, warnings: context.warnings };
}

export async function downloadElementAsSvg(el: HTMLElement, mode: AffinityExportMode = 'exact'): Promise<EditableSvgExport> {
  const result = mode === 'exact' ? await elementToExactAffinitySvg(el) : await elementToEditableSvg(el);
  let savedPath: string | undefined;
  try {
    const response = await fetch('/__design-mode/export-svg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: result.fileName, svg: result.svg }),
    });
    const body = (await response.json()) as ExportSvgResponseBody;
    if (!response.ok || !body.ok || !body.absolutePath) throw new Error(body.error ?? `export failed (${response.status})`);
    savedPath = body.absolutePath;
  } catch (error) {
    result.warnings.push(`The project copy could not be written: ${(error as Error).message}`);
  }

  const blob = new Blob([result.svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = result.fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return { ...result, savedPath };
}
