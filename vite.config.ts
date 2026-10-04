import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { picker } from './src/content/picker';
import { profiles } from './src/content/profiles';

// GitHub Pages serves a branch's root or its docs/ folder; the site is built into docs/.
const OUT_DIR = 'docs';

/** Absolute site address for link previews; crawlers do not resolve relative URLs. */
const SITE_URL = (process.env.SITE_URL ?? 'https://jekuper.github.io').replace(/\/$/, '');

interface PageMeta {
  /** Page folder under the base path, '' for the root. */
  path: string;
  title: string;
  description: string;
  /** Preview image under public/. */
  image: string;
}

const pages: PageMeta[] = [
  { path: '', title: 'Joe Sharipov', description: picker.description, image: 'og-image.png' },
  ...Object.values(profiles).map((p) => ({
    path: `${p.id}/`,
    title: `Joe Sharipov - ${p.identity.title}`,
    description: p.description,
    image: `og/${p.id}.png`,
  })),
];

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Writes a page's title, description, URL and image into the head; throws if index.html lost a tag. */
function withMeta(html: string, meta: PageMeta, base: string): string {
  const values: [string, string][] = [
    ['name="description"', meta.description],
    ['property="og:url"', `${SITE_URL}${base}${meta.path}`],
    ['property="og:title"', meta.title],
    ['property="og:description"', meta.description],
    ['property="og:image"', `${SITE_URL}${base}${meta.image}`],
  ];
  let out = html;
  for (const [key, value] of values) {
    const tag = new RegExp(`(<meta ${key} content=")[^"]*(")`);
    if (!tag.test(out)) throw new Error(`index.html has no <meta ${key}> to fill`);
    out = out.replace(tag, `$1${escapeAttr(value)}$2`);
  }
  return out.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(meta.title)}</title>`);
}

/**
 * Static hosts such as GitHub Pages have no rewrites, so every profile path gets
 * its own copy of the page, each with its own link preview, and 404.html catches anything else.
 */
function profilePages(): Plugin {
  let outDir = OUT_DIR;
  let base = '/';
  return {
    name: 'profile-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      base = config.base;
    },
    async closeBundle() {
      const index = join(outDir, 'index.html');
      const html = await readFile(index, 'utf8');
      for (const meta of pages) {
        await mkdir(join(outDir, meta.path), { recursive: true });
        await writeFile(join(outDir, meta.path, 'index.html'), withMeta(html, meta, base));
      }
      // Unknown paths show the picker, so they share its preview.
      await writeFile(join(outDir, '404.html'), withMeta(html, pages[0], base));
    },
  };
}

/** The dev server leaves out the Clarity snippet, so working on the site locally is not recorded. */
function noLocalMetrics(): Plugin {
  return {
    name: 'no-local-metrics',
    apply: 'serve',
    transformIndexHtml(html) {
      const block = /\s*<!-- metrics:start -->[\s\S]*?<!-- metrics:end -->/;
      if (!block.test(html)) throw new Error('index.html has no metrics:start / metrics:end block to leave out');
      return html.replace(block, '');
    },
  };
}

export default defineConfig({
  // Absolute, because profile pages live one level down. Set BASE_PATH to serve from a subpath.
  base: process.env.BASE_PATH ?? '/',
  build: { outDir: OUT_DIR },
  plugins: [react(), profilePages(), noLocalMetrics()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
