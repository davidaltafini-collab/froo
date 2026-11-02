import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { designEditorPlugin } from './design-editor/vite-plugin';

export default defineConfig(({ command }) => {
  const rootDir = path.resolve(__dirname, '.');
  // Design-mode tooling (element tagging + the save endpoint) must only ever run
  // against the dev server — never `vite build`, and not under vitest either.
  const isDesignModeDev = command === 'serve' && !process.env.VITEST;

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...designEditorPlugin({ rootDir, enabled: isDesignModeDev }),
    ],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Dev-only: lets a tunnel host (localtunnel/ngrok) reach this server so the
      // React Native app's embedded mini-game WebViews can load it from outside the LAN.
      allowedHosts: true,
    },
    build: {
      rollupOptions: {
        input: {
          app: path.resolve(rootDir, 'index.html'),
          'game-dino': path.resolve(rootDir, 'game-dino.html'),
          'game-brick-breaker': path.resolve(rootDir, 'game-brick-breaker.html'),
          'game-fruit-merge': path.resolve(rootDir, 'game-fruit-merge.html'),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
  };
});
