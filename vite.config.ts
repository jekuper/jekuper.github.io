import { copyFile, mkdir } from 'node:fs/promises';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { profiles } from './src/content/profiles';

/**
 * Static hosts such as GitHub Pages have no rewrites, so every profile path gets
 * its own copy of the page, and 404.html catches anything else.
 */
function profilePages(): Plugin {
  return {
    name: 'profile-pages',
    apply: 'build',
    async closeBundle() {
      const index = 'dist/index.html';
      for (const id of Object.keys(profiles)) {
        await mkdir(`dist/${id}`, { recursive: true });
        await copyFile(index, `dist/${id}/index.html`);
      }
      await copyFile(index, 'dist/404.html');
    },
  };
}

export default defineConfig(({ command }) => ({
  // Absolute, because profile pages live one level down. Set BASE_PATH when deploying elsewhere.
  base: command === 'build' ? (process.env.BASE_PATH ?? '/portfolio/') : '/',
  plugins: [react(), profilePages()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
