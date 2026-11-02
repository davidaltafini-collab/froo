/**
 * Builds the two mini-games into fully self-contained HTML documents and emits them as
 * TypeScript string modules for the React Native app.
 *
 * Why self-contained: the native WebView loads these through `source={{ html }}`, so the
 * document must not reference any external file. Every script, stylesheet, and sprite is
 * inlined, which is what makes the games work offline with no host, no LAN address, and no
 * hosting bill.
 *
 * The game code itself is the untouched web implementation from `src/components/games`, so
 * physics, timing, scoring, and artwork stay identical to the localhost reference by
 * construction rather than by reimplementation.
 *
 * Usage: npm run build:mobile-games
 */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(rootDir, 'mobile', 'src', 'components', 'games', 'generated');

/** Dino is deliberately excluded: it is out of scope and must not ship in the app. */
const GAMES = [
  { id: 'brick-breaker', html: 'game-brick-breaker.html', module: 'brickBreakerHtml', file: 'brickBreakerHtml' },
  { id: 'fruit-merge', html: 'game-fruit-merge.html', module: 'fruitMergeHtml', file: 'fruitMergeHtml' },
];

async function buildGame(game) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `froo-game-${game.id}-`));

  await build({
    root: rootDir,
    configFile: false,
    logLevel: 'warn',
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': rootDir } },
    build: {
      outDir: tmpDir,
      emptyOutDir: true,
      target: 'es2020',
      cssCodeSplit: false,
      // Inline every sprite as a data URI. Without this the document would reference
      // /assets/*.webp, which resolves to nothing inside a WebView with no server.
      assetsInlineLimit: 64 * 1024 * 1024,
      modulePreload: { polyfill: false },
      reportCompressedSize: false,
      rollupOptions: {
        input: path.join(rootDir, game.html),
        // One entry per build keeps the output as a single JS chunk we can inline.
        output: { inlineDynamicImports: true, entryFileNames: 'game.js', assetFileNames: '[name][extname]' },
      },
    },
  });

  const html = await inlineDocument(tmpDir, game.html);
  await fs.rm(tmpDir, { recursive: true, force: true });
  return html;
}

/** Folds the emitted JS and CSS back into the HTML so nothing is left to fetch. */
async function inlineDocument(dir, htmlName) {
  let html = await fs.readFile(path.join(dir, htmlName), 'utf8');

  // modulepreload hints point at files that will no longer exist once inlined.
  html = html.replace(/\s*<link[^>]+rel="modulepreload"[^>]*>/g, '');

  // Replacements go through a replacer function so `$&`, `$'` and friends inside minified
  // JS/CSS are treated as literal text rather than String.replace substitution patterns.
  const scriptMatches = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)];
  for (const [tag, src] of scriptMatches) {
    const code = await fs.readFile(path.join(dir, src.replace(/^\//, '')), 'utf8');
    // A literal `</script>` inside the code would close the tag early.
    const safe = code.replace(/<\/script>/gi, '<\\/script>');
    html = html.replace(tag, () => `<script type="module">\n${safe}\n</script>`);
  }

  const linkMatches = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
  for (const [tag, href] of linkMatches) {
    const css = await fs.readFile(path.join(dir, href.replace(/^\//, '')), 'utf8');
    html = html.replace(tag, () => `<style>\n${css}\n</style>`);
  }

  const leftovers = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
  if (leftovers.length > 0) {
    throw new Error(`Document is not self-contained, still references: ${leftovers.join(', ')}`);
  }

  return html;
}

const banner = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by scripts/build-mobile-games.mjs from the web game implementation in
 * src/components/games. Re-run \`npm run build:mobile-games\` from the repository root
 * after changing a game.
 *
 * This is a complete, self-contained HTML document: all JavaScript, CSS, and sprites are
 * inlined, so the native WebView renders it with no network access of any kind.
 */
`;

await fs.mkdir(outDir, { recursive: true });

const summary = [];
for (const game of GAMES) {
  process.stdout.write(`building ${game.id}... `);
  const html = await buildGame(game);
  const target = path.join(outDir, `${game.file}.ts`);
  await fs.writeFile(target, `${banner}\nexport const ${game.module} = ${JSON.stringify(html)};\n`, 'utf8');
  const kb = Math.round(Buffer.byteLength(html) / 1024);
  summary.push({ game: game.id, kb });
  process.stdout.write(`${kb} KB -> ${path.relative(rootDir, target)}\n`);
}

console.table(summary);
