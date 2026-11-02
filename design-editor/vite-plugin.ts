import { transformAsync } from '@babel/core';
import path from 'node:path';
import type { Plugin } from 'vite';
import { createTagElementsPlugin } from './babel-plugin-tag-elements';
import { designEditorSavePlugin } from './vite-plugin-save';

const CLIENT_MODULE_ID = 'virtual:design-editor-client';
const RESOLVED_CLIENT_MODULE_ID = `\0${CLIENT_MODULE_ID}`;

export interface DesignEditorPluginOptions {
  rootDir?: string;
  enabled?: boolean;
}

function sourceTaggingPlugin(rootDir: string): Plugin {
  const sourceRoot = `${path.resolve(rootDir, 'src')}${path.sep}`;

  return {
    name: 'design-editor-source-tagging',
    apply: 'serve',
    enforce: 'pre',
    async transform(code, id) {
      const filename = path.normalize(id.split('?', 1)[0]);
      if (!filename.startsWith(sourceRoot) || !/\.[jt]sx$/.test(filename)) return null;

      const result = await transformAsync(code, {
        filename,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        sourceFileName: filename,
        parserOpts: {
          sourceType: 'module',
          plugins: filename.endsWith('.tsx') ? ['jsx', 'typescript'] : ['jsx'],
        },
        plugins: [createTagElementsPlugin(rootDir)],
      });

      return result?.code ? { code: result.code, map: result.map ?? null } : null;
    },
  };
}

function clientMountPlugin(rootDir: string): Plugin {
  const mountPath = path.resolve(rootDir, 'design-editor/client/mount.tsx').replaceAll('\\', '/');

  return {
    name: 'design-editor-client-mount',
    apply: 'serve',
    resolveId(id) {
      return id === CLIENT_MODULE_ID ? RESOLVED_CLIENT_MODULE_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_CLIENT_MODULE_ID) return null;
      return `import { mountDesignEditor } from ${JSON.stringify(mountPath)}; mountDesignEditor();`;
    },
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { type: 'module', src: `/@id/${CLIENT_MODULE_ID}` }, injectTo: 'body' }];
    },
  };
}

/**
 * Drop-in development editor for Vite React projects. Spread the returned
 * plugins into Vite's plugin list; production builds are left untouched.
 */
export function designEditorPlugin(options: DesignEditorPluginOptions = {}): Plugin[] {
  if (options.enabled === false) return [];
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  return [sourceTaggingPlugin(rootDir), designEditorSavePlugin(rootDir), clientMountPlugin(rootDir)];
}
