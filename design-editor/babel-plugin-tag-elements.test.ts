import path from 'node:path';
import { transformAsync } from '@babel/core';
import { describe, expect, it } from 'vitest';
import { createTagElementsPlugin } from './babel-plugin-tag-elements';

describe('generated element tagging', () => {
  it('adds a runtime instance index to elements rendered by map', async () => {
    const rootDir = path.resolve('fixture-project');
    const filename = path.join(rootDir, 'src', 'Gallery.tsx');
    const result = await transformAsync(
      'export const Gallery = ({ items }) => <>{items.map((item) => <img src={item.src} />)}</>;',
      {
        filename,
        babelrc: false,
        configFile: false,
        parserOpts: { sourceType: 'module', plugins: ['jsx', 'typescript'] },
        plugins: [createTagElementsPlugin(rootDir)],
      },
    );

    expect(result?.code).toMatch(/items\.map\(\(item, _vleIndex\) =>/);
    expect(result?.code).toContain('data-vle-instance={_vleIndex}');
    expect(result?.code).toContain('data-vle-source-mode="generated"');
  });
});
