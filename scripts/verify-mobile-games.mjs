/**
 * Loads each generated self-contained game document in a real Chromium at a chosen viewport
 * and device pixel ratio, then reports console errors, failed network requests, and the
 * canvas CSS/backing-store geometry.
 *
 * This is a pre-flight check only. It proves the offline document boots and that the
 * backing store is scaled by devicePixelRatio; it does not replace physical-device
 * acceptance, which is the gate that actually matters.
 *
 * Usage: node scripts/verify-mobile-games.mjs [--width 330] [--height 644] [--dpr 3]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import { chromium } from 'playwright-core';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

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
const generatedDir = path.join(rootDir, 'mobile', 'src', 'components', 'games', 'generated');
const width = Number(option('width', '330'));
const height = Number(option('height', '644'));
const dpr = Number(option('dpr', '3'));
const outDir = path.resolve(option('out', path.join(rootDir, 'visual-parity', 'games', 'harness')));

const GAMES = [
  { id: 'brick-breaker', module: 'brickBreakerHtml', file: 'brickBreakerHtml' },
  { id: 'fruit-merge', module: 'fruitMergeHtml', file: 'fruitMergeHtml' },
];

/** Pulls the HTML back out of the generated TypeScript string module. */
async function readGameHtml(game) {
  const source = await fs.readFile(path.join(generatedDir, `${game.file}.ts`), 'utf8');
  const match = source.match(new RegExp(`export const ${game.module} = ("[\\s\\S]*");`));
  if (!match) throw new Error(`Could not extract HTML for ${game.id}`);
  return JSON.parse(match[1]);
}

const browser = await chromium.launch({ executablePath: await firstExisting(CHROME_PATHS) });
await fs.mkdir(outDir, { recursive: true });
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'froo-verify-'));

let failed = false;

for (const game of GAMES) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const requestFailures = [];
  const externalRequests = [];
  page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('requestfailed', (req) => requestFailures.push(`${req.url()} — ${req.failure()?.errorText}`));
  page.on('request', (req) => {
    // A self-contained document must never reach out over the network.
    if (/^https?:/i.test(req.url())) externalRequests.push(req.url());
  });

  // Served from a file:// document so nothing can silently fall back to a dev server.
  const file = path.join(tmpDir, `${game.id}.html`);
  await fs.writeFile(file, await readGameHtml(game), 'utf8');
  await page.goto(`file://${file.replace(/\\/g, '/')}`);

  // Let the sprites decode and the loop settle.
  await page.waitForTimeout(2500);

  const geometry = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      cssWidth: Math.round(rect.width),
      cssHeight: Math.round(rect.height),
      backingWidth: canvas.width,
      backingHeight: canvas.height,
      devicePixelRatio: window.devicePixelRatio,
      contextTransform: canvas.getContext('2d').getTransform().a,
    };
  });

  await page.screenshot({ path: path.join(outDir, `${game.id}-${width}x${height}@${dpr}x.png`) });

  const backingRatio = geometry ? geometry.backingWidth / geometry.cssWidth : 0;
  const problems = [];
  if (!geometry) problems.push('no canvas rendered');
  if (geometry && Math.abs(backingRatio - Math.min(dpr, 3)) > 0.02) {
    problems.push(`backing store ratio ${backingRatio.toFixed(3)} != expected ${Math.min(dpr, 3)}`);
  }
  if (geometry && Math.abs(geometry.contextTransform - Math.min(dpr, 3)) > 0.02) {
    problems.push(`context scaled ${geometry.contextTransform} times, expected exactly ${Math.min(dpr, 3)}`);
  }
  if (consoleErrors.length) problems.push(`console errors: ${consoleErrors.join(' | ')}`);
  if (requestFailures.length) problems.push(`failed requests: ${requestFailures.join(' | ')}`);
  if (externalRequests.length) problems.push(`network requests escaped the bundle: ${externalRequests.join(' | ')}`);

  console.log(`\n${game.id}`);
  console.log('  geometry:', JSON.stringify(geometry));
  console.log('  verdict :', problems.length === 0 ? 'PASS' : `FAIL — ${problems.join('; ')}`);
  if (problems.length > 0) failed = true;

  await context.close();
}

await browser.close();
await fs.rm(tmpDir, { recursive: true, force: true });
console.log(`\nscreenshots: ${path.relative(rootDir, outDir)}`);
process.exit(failed ? 1 : 0);
