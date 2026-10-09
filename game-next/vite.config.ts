import { defineConfig } from 'vite';
import { studioPlugin } from './scripts/studio/studioPlugin.ts';

export default defineConfig(({ command }) => {
  return {
    // GitHub Pages serves from /<repo>/; the deploy workflow sets VITE_BASE. Android/dev keep '/'.
    base: process.env.VITE_BASE ?? '/',
    plugins: command === 'serve' ? [studioPlugin()] : [],
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
        },
      },
    },
  };
});
