import { chromium } from 'playwright';

const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, executablePath });

async function run(width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Design Mode', exact: true }).click();
  await page.getByRole('button', { name: 'Open Froo Games' }).click();
  await page.getByRole('heading', { name: 'Froo Games', exact: true }).waitFor();
  await page.waitForTimeout(800);

  const result = { width, height, errors, steps: [] };
  const record = async (name, target, fx = 0.5, fy = 0.5) => {
    const box = await target.boundingBox();
    if (!box) throw new Error(`${name}: target has no box`);
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
    await page.waitForTimeout(100);
    const state = await page.evaluate(({ box }) => {
      const root = document.getElementById('design-editor-root');
      const outlines = [...(root?.querySelectorAll('div') ?? [])]
        .filter((el) => (el.style.border || '').includes('2px solid') && el.style.pointerEvents === 'none' && el.getBoundingClientRect().width > 10)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        });
      const sourceLabels = [...(root?.querySelectorAll('[title^="src/"]') ?? [])];
      const selectedId = sourceLabels.at(-1)?.getAttribute('title') ?? null;
      return { selectedId, outlines, target: box };
    }, { box });
    const outline = state.outlines[0];
    if (!outline || Math.abs(outline.left - box.x) > 1 || Math.abs(outline.top - box.y) > 1 || Math.abs(outline.width - box.width) > 1 || Math.abs(outline.height - box.height) > 1) {
      throw new Error(`${name}: selection outline does not match the clicked element`);
    }
    result.steps.push({ name, ...state });
  };

  await record('games heading', page.getByRole('heading', { name: 'Froo Games', exact: true }));
  const mascot = page.getByAltText('Froo gamer mascot');
  result.mascot = await mascot.evaluate((el) => ({
    instance: el.dataset.vleInstance ?? null,
    position: getComputedStyle(el).position,
    zIndex: getComputedStyle(el).zIndex,
    isInsideHeader: !!document.querySelector('h2')?.parentElement?.parentElement?.contains(el),
  }));
  if (result.mascot.position !== 'absolute' || result.mascot.zIndex !== '90' || result.mascot.isInsideHeader) {
    throw new Error('Mascot is not an independent layer above the Games header');
  }
  await record('mascot layer', mascot);
  const gameCards = page.locator('button[data-vle-source-mode="generated"]').filter({ has: page.locator('h4') });
  result.gameImages = await gameCards.locator('img').evaluateAll((images) => images.map((image) => ({
    instance: image.dataset.vleInstance,
    src: image.getAttribute('src'),
  })));
  if (result.gameImages.map((image) => image.instance).join(',') !== '0,1') {
    throw new Error('Generated game images do not expose independent runtime indices');
  }
  if (result.gameImages[0].src === result.gameImages[1].src) throw new Error('Game cards still share the same artwork');
  await record('second game card', gameCards.nth(1), 0.03, 0.5);
  await record('nested game title', gameCards.nth(1).locator('h4'));
  if (width < 1100) await page.getByRole('button', { name: 'Properties', exact: true }).click();
  await page.getByRole('button', { name: 'Bring to front', exact: true }).click();
  result.stack = await gameCards.nth(1).locator('h4').evaluate((el) => ({
    zIndex: getComputedStyle(el).zIndex,
    position: getComputedStyle(el).position,
  }));
  if (result.stack.zIndex !== '1' || result.stack.position !== 'relative') throw new Error('Bring to front did not update the selected layer');

  await page.screenshot({ path: `design-editor/selector-smoke-${width}.png`, fullPage: true });
  await page.close();
  return result;
}

const results = [await run(1440, 1000), await run(800, 900), await run(425, 900)];
console.log(JSON.stringify(results, null, 2));
await browser.close();
