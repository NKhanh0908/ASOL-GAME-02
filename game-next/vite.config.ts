import { defineConfig } from 'vite';
import { studioPlugin } from './scripts/studio/studioPlugin.ts';

export default defineConfig(({ command }) => {
  return {
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
