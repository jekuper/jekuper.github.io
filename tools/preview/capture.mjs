// Captures the link preview images from a running dev server:
//   npm run dev, then: npm run preview:image [-- http://localhost:5173/]
// Writes public/og/<profile>.png for every profile page and public/og-image.png for the
// picker at the site root. Uses an installed Edge or Chrome; set BROWSER_CHANNEL=chrome for Chrome.
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const site = process.argv[2] ?? 'http://localhost:5173/';
const publicDir = new URL('../../public/', import.meta.url);
const channel = process.env.BROWSER_CHANNEL ?? 'msedge';
// 1201 wide keeps the desktop layout; the capture is the 1200x630 preview size.
const VIEWPORT = { width: 1201, height: 631 };
const CLIP = { x: 0, y: 0, width: 1200, height: 630 };
const SETTLE_MS = 6000;

const browser = await chromium.launch({ channel, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function open(path) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(new URL(path, site).href, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.metrics-toast { display: none !important; }' });
  return page;
}

// A profile page: the "GREAT WORK" bar on top, then the portrait with name, role and education where the bio was.
async function captureProfile(id) {
  const page = await open(`${id}/`);
  await page.addStyleTag({
    content: `
      .header-holder, .about-bio, .journey { display: none !important; }
      .about-profile { padding-top: 7vh !important; }
      .preview-name h1, .preview-name h2 { display: block; margin: 0; width: auto; text-transform: none; }
      .preview-name h1 {
        font-family: var(--font-display) !important;
        font-size: 3.6vw !important;
        letter-spacing: 6px !important;
      }
      .preview-name h2 {
        margin-top: 1.4vh !important;
        font-family: var(--font-space) !important;
        font-size: 1.8vw !important;
        font-weight: 300 !important;
        letter-spacing: 3px !important;
        color: #8a8a8a !important;
      }
    `,
  });
  await page.evaluate(() => {
    const role = document.querySelector('.header-holder .occupation-title')?.textContent ?? '';
    const name = document.createElement('div');
    name.className = 'preview-name';
    name.innerHTML = '<h1 class="h1-title">Joe Sharipov</h1><h2 class="occupation-title"></h2>';
    name.querySelector('h2').textContent = role;
    document.querySelector('.about-text')?.prepend(name);
    const bar = document.querySelector('.purple-background');
    if (bar) window.scrollBy(0, bar.getBoundingClientRect().top - 24);
  });
  await page.waitForTimeout(SETTLE_MS);
  const out = fileURLToPath(new URL(`og/${id}.png`, publicDir));
  await page.screenshot({ path: out, clip: CLIP });
  await page.close();
  console.log(`Saved ${out}`);
}

// The picker: heading and the list of profiles, without the paragraph and links that would not fit.
async function captureRoot() {
  const page = await open('');
  await page.addStyleTag({
    content: `
      .picker { padding-top: 9vh !important; }
      .picker-body, .picker-links { display: none !important; }
      .picker-label { margin-top: 5vh !important; }
    `,
  });
  // The dots formed before the list moved up; a resize makes them measure again.
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(SETTLE_MS);
  const out = fileURLToPath(new URL('og-image.png', publicDir));
  await page.screenshot({ path: out, clip: CLIP });
  await page.close();
  console.log(`Saved ${out}`);
}

// Profile ids are the links on the picker, so new profiles are picked up without editing this file.
const ids = await (async () => {
  const page = await open('');
  const hrefs = await page.$$eval('.picker-profile', (links) => links.map((a) => a.getAttribute('href')));
  await page.close();
  return hrefs.map((href) => href.split('/').filter(Boolean).pop());
})();

await mkdir(new URL('og/', publicDir), { recursive: true });
for (const id of ids) await captureProfile(id);
await captureRoot();
await browser.close();
