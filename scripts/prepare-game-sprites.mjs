/**
 * Turns a rendered product image into a game sprite: removes the backdrop, crops to the
 * subject, downscales, and writes a webp sized like the existing tier sprites.
 *
 * The source renders have an opaque backdrop with a soft glow around the subject. A
 * contiguous flood fill from the borders using a *local* colour tolerance walks smoothly
 * through both the gradient and the glow but stops at the subject's hard edge, which is
 * what separates them cleanly. The alpha edge is then eroded and feathered by a pixel to
 * drop the last of the backdrop colour fringe.
 *
 * Usage: node scripts/prepare-game-sprites.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright-core';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next installed browser.
    }
  }
  throw new Error('No supported Chrome or Edge executable was found.');
}

const rootDir = path.resolve(import.meta.dirname, '..');
const dir = path.join(rootDir, 'assets', 'games', 'froomerge');

const SPRITES = [
  { source: 'sauce.png', out: 'powerup-sauce.webp', maxSize: 320, tolerance: 26 },
  { source: 'slurpee.png', out: 'powerup-shake.webp', maxSize: 320, tolerance: 18 },
  { source: 'mediumdish.png', out: 'paddle-dish-medium.webp', maxSize: 512, tolerance: 16 },
  { source: 'largedish.png', out: 'paddle-dish-large.webp', maxSize: 512, tolerance: 16 },
];

const browser = await chromium.launch({ executablePath: await firstExisting(CHROME_PATHS) });
const page = await browser.newPage();

const report = [];

for (const sprite of SPRITES) {
  const sourceBuffer = await fs.readFile(path.join(dir, sprite.source));
  const result = await page.evaluate(
    async ({ url, maxSize, tolerance }) => {
      const img = new Image();
      img.src = url;
      await img.decode();

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const source = document.createElement('canvas');
      source.width = w;
      source.height = h;
      const sctx = source.getContext('2d', { willReadFrequently: true });
      sctx.drawImage(img, 0, 0);
      const image = sctx.getImageData(0, 0, w, h);
      const px = image.data;

      // Contiguous flood fill from every border pixel. A neighbour joins the backdrop when
      // it is within `tolerance` of the pixel we reached it from, so smooth gradients and
      // glows are followed while a hard subject edge halts the fill.
      const isBackdrop = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let head = 0;
      let tail = 0;

      function push(p) {
        if (!isBackdrop[p]) {
          isBackdrop[p] = 1;
          queue[tail++] = p;
        }
      }
      for (let x = 0; x < w; x++) {
        push(x);
        push((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        push(y * w);
        push(y * w + w - 1);
      }

      const tolSq = tolerance * tolerance * 3;
      while (head < tail) {
        const p = queue[head++];
        const i = p * 4;
        const px0 = px[i];
        const px1 = px[i + 1];
        const px2 = px[i + 2];
        const x = p % w;
        const y = (p / w) | 0;
        const neighbours = [
          x > 0 ? p - 1 : -1,
          x < w - 1 ? p + 1 : -1,
          y > 0 ? p - w : -1,
          y < h - 1 ? p + w : -1,
        ];
        for (const n of neighbours) {
          if (n < 0 || isBackdrop[n]) continue;
          const j = n * 4;
          const dr = px[j] - px0;
          const dg = px[j + 1] - px1;
          const db = px[j + 2] - px2;
          if (dr * dr + dg * dg + db * db <= tolSq) push(n);
        }
      }

      // Erode the subject by one pixel so no backdrop-tinted fringe survives, then use the
      // eroded mask to build a feathered alpha.
      const alpha = new Float32Array(w * h);
      for (let p = 0; p < w * h; p++) alpha[p] = isBackdrop[p] ? 0 : 1;
      const eroded = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = y * w + x;
          let min = alpha[p];
          if (x > 0) min = Math.min(min, alpha[p - 1]);
          if (x < w - 1) min = Math.min(min, alpha[p + 1]);
          if (y > 0) min = Math.min(min, alpha[p - w]);
          if (y < h - 1) min = Math.min(min, alpha[p + w]);
          eroded[p] = min;
        }
      }
      // 3x3 box blur of the eroded mask = a one pixel feather on the cut edge.
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              sum += eroded[ny * w + nx];
              count++;
            }
          }
          px[(y * w + x) * 4 + 3] = Math.round((sum / count) * 255);
        }
      }
      // The renders sit on a cast shadow that the fill cannot always reach, which survives as
      // a detached grey smudge. Keep only the largest opaque region: a contact shadow touching
      // the subject stays, anything floating beside it goes.
      const visited = new Uint8Array(w * h);
      let bestSize = 0;
      let bestLabel = 0;
      const label = new Int32Array(w * h);
      let nextLabel = 0;
      for (let start = 0; start < w * h; start++) {
        if (visited[start] || px[start * 4 + 3] <= 12) continue;
        nextLabel++;
        let size = 0;
        head = 0;
        tail = 0;
        visited[start] = 1;
        queue[tail++] = start;
        while (head < tail) {
          const p = queue[head++];
          label[p] = nextLabel;
          size++;
          const x = p % w;
          const y = (p / w) | 0;
          const neighbours = [
            x > 0 ? p - 1 : -1,
            x < w - 1 ? p + 1 : -1,
            y > 0 ? p - w : -1,
            y < h - 1 ? p + w : -1,
          ];
          for (const n of neighbours) {
            if (n < 0 || visited[n] || px[n * 4 + 3] <= 12) continue;
            visited[n] = 1;
            queue[tail++] = n;
          }
        }
        if (size > bestSize) {
          bestSize = size;
          bestLabel = nextLabel;
        }
      }
      for (let p = 0; p < w * h; p++) {
        if (label[p] !== bestLabel) px[p * 4 + 3] = 0;
      }

      sctx.putImageData(image, 0, 0);

      // Crop to whatever still has meaningful opacity.
      let minX = w, minY = h, maxX = -1, maxY = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (px[(y * w + x) * 4 + 3] > 12) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) return { error: 'nothing left after background removal' };

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      const scale = Math.min(1, maxSize / Math.max(cropW, cropH));
      const outW = Math.max(1, Math.round(cropW * scale));
      const outH = Math.max(1, Math.round(cropH * scale));

      const out = document.createElement('canvas');
      out.width = outW;
      out.height = outH;
      const octx = out.getContext('2d');
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(source, minX, minY, cropW, cropH, 0, 0, outW, outH);

      return {
        dataUrl: out.toDataURL('image/webp', 0.9),
        sourceSize: [w, h],
        cropped: [cropW, cropH],
        output: [outW, outH],
        subjectPercent: +((cropW * cropH) / (w * h) * 100).toFixed(1),
      };
    },
    {
      url: `data:image/png;base64,${sourceBuffer.toString('base64')}`,
      maxSize: sprite.maxSize,
      tolerance: sprite.tolerance,
    },
  );

  if (result.error) throw new Error(`${sprite.source}: ${result.error}`);

  const buffer = Buffer.from(result.dataUrl.split(',')[1], 'base64');
  await fs.writeFile(path.join(dir, sprite.out), buffer);
  report.push({
    sprite: sprite.out,
    source: `${result.sourceSize[0]}x${result.sourceSize[1]}`,
    output: `${result.output[0]}x${result.output[1]}`,
    kb: Math.round(buffer.length / 1024),
    from: `${Math.round(sourceBuffer.length / 1024)} KB`,
  });
}

await browser.close();
console.table(report);
