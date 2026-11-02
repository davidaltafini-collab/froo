# Portable Design Editor

This folder is a development-only visual editor for Vite React projects. It
tags rendered JSX with source locations, mounts the editor UI, and provides the
local save endpoints through one Vite integration.

Copy `design-editor/` into a project and add the plugin:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { designEditorPlugin } from './design-editor/vite-plugin';

export default defineConfig({
  plugins: [react(), ...designEditorPlugin()],
});
```

No application entry-point changes are required. The editor runs only under the
Vite development server and does not enter production builds.

The host project needs `@babel/core`, `@babel/parser`, `@babel/traverse`,
`magic-string`, React, and Vite. Source-backed editing currently targets files
under `src/` and supports JSX/TSX host elements, `motion.*`, and component usages
that expose a `className` styling surface.
