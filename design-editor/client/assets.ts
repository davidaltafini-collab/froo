import type { DesignAssetRef, UploadAssetResponseBody } from '../shared-types';

export interface UploadedDesignAsset {
  asset: DesignAssetRef;
  objectUrl: string;
  width: number;
  height: number;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('failed to read file'));
    reader.readAsDataURL(file);
  });
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 120, height: img.naturalHeight || 120 });
    img.onerror = () => resolve({ width: 120, height: 120 });
    img.src = url;
  });
}

export async function uploadDesignAsset(file: File): Promise<UploadedDesignAsset> {
  const isSvg = file.name.toLowerCase().endsWith('.svg');
  if (!file.type.startsWith('image/') && !isSvg) throw new Error('Choose an image or an edited SVG file.');

  const objectUrl = URL.createObjectURL(file);
  let dataUrl = await readAsDataUrl(file);
  if (isSvg && !dataUrl.startsWith('data:image/svg+xml')) {
    const encoded = btoa(unescape(encodeURIComponent(await file.text())));
    dataUrl = `data:image/svg+xml;base64,${encoded}`;
  }
  const size = await readImageSize(objectUrl);
  const res = await fetch('/__design-mode/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, type: isSvg ? 'image/svg+xml' : file.type, dataUrl }),
  });
  const body = (await res.json()) as UploadAssetResponseBody;
  if (!res.ok || !body.ok || !body.asset) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(body.error ?? `upload failed (${res.status})`);
  }
  return { asset: body.asset, objectUrl, width: size.width, height: size.height };
}

export function altFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}
