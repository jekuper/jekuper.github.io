import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { profiles } from './src/content/profiles';

// GitHub Pages serves a branch's root or its docs/ folder; the site is built into docs/.
const OUT_DIR = 'docs';

/**
 * Static hosts such as GitHub Pages have no rewrites, so every profile path gets
 * its own copy of the page, and 404.html catches anything else.
 */
function profilePages(): Plugin {
  return {
    name: 'profile-pages',
    apply: 'build',
    async closeBundle() {
      const index = join(OUT_DIR, 'index.html');
      for (const id of Object.keys(profiles)) {
        await mkdir(join(OUT_DIR, id), { recursive: true });
        await copyFile(index, join(OUT_DIR, id, 'index.html'));
      }
      await copyFile(index, join(OUT_DIR, '404.html'));
    },
  };
}

export default defineConfig({
  // Absolute, because profile pages live one level down. Set BASE_PATH to serve from a subpath.
  base: process.env.BASE_PATH ?? '/',
  build: { outDir: OUT_DIR },
  plugins: [react(), profilePages()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
