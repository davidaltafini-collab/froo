import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse, parseExpression } from '@babel/parser';
import type { JSXElement } from '@babel/types';
import { describe, expect, it } from 'vitest';
import {
  applyDesignEditsToFile,
  instanceSpecificSrcValue,
  isReplaceableSelfClosingVisual,
  selfClosingVisualReplacementJsx,
} from './vite-plugin-save';

function openingFor(source: string) {
  return (parseExpression(source, { plugins: ['jsx', 'typescript'] }) as JSXElement).openingElement;
}

describe('self-closing visual asset replacement', () => {
  it('replaces a component icon while preserving its size and click behavior', () => {
    const source = '<game.icon className="w-7 h-7 text-white" onClick={openGame} />';
    const jsx = selfClosingVisualReplacementJsx(openingFor(source), source, 'designAsset1', 'game badge');

    expect(jsx).toBe('<img src={designAsset1} alt="game badge" className="w-7 h-7 text-white block object-contain" onClick={openGame} />');
  });

  it('preserves a dynamic sizing class expression', () => {
    const source = '<Icon className={active ? "w-8 h-8" : "w-5 h-5"} />';
    const jsx = selfClosingVisualReplacementJsx(openingFor(source), source, 'designAsset2', 'status');

    expect(jsx).toContain('className={[active ? "w-8 h-8" : "w-5 h-5", "block object-contain"].filter(Boolean).join(" ")}');
  });

  it('does not replace self-closing form controls as artwork', () => {
    expect(isReplaceableSelfClosingVisual(openingFor('<input className="w-full" />'))).toBe(false);
  });

  it('keeps the original image for other instances in a generated list', () => {
    const source = '<img src={game.image} alt={game.title} />';
    const value = instanceSpecificSrcValue(openingFor(source), source, 'designAsset3', 'gameIndex', 1);

    expect(value).toBe('{gameIndex === 1 ? designAsset3 : (game.image)}');
    expect(() => parseExpression(`<img src=${value} />`, { plugins: ['jsx', 'typescript'] })).not.toThrow();
  });

  it('patches only one mapped image instance and adds an index parameter', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-editor-repeat-'));
    const relPath = 'src/Gallery.tsx';
    const absPath = path.join(rootDir, relPath);
    const source = 'export const Gallery = ({ items }) => <div>{items.map((item) => <img src={item.src} alt="item" />)}</div>;\n';
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, source, 'utf8');

    try {
      const id = `${relPath}:1:${source.indexOf('<img')}`;
      const results = applyDesignEditsToFile(rootDir, relPath, [{
        kind: 'replace-with-asset',
        id,
        instanceIndex: 1,
        asset: { importPath: '@/assets/.design-editor/second.png', originalName: 'second.png' },
        alt: 'second',
      }]);
      const saved = fs.readFileSync(absPath, 'utf8');

      expect(results).toEqual([{ id, ok: true }]);
      expect(saved).toContain('items.map((item, _vleIndex) =>');
      expect(saved).toContain('src={_vleIndex === 1 ? designAsset1 : (item.src)}');
      expect(() => parse(saved, { sourceType: 'module', plugins: ['jsx', 'typescript'] })).not.toThrow();
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
