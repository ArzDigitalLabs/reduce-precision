import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(import.meta.dirname),
  build: {
    outDir: resolve(import.meta.dirname, '../demo-dist'),
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
