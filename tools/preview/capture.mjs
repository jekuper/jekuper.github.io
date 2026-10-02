// Captures public/og-image.png (the link preview) from a running dev server:
//   npm run dev, then: npm run preview:image [-- http://localhost:5173/]
// Uses an installed Edge or Chrome; set BROWSER_CHANNEL=chrome to pick Chrome.
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = fileURLToPath(new URL('../../public/og-image.png', import.meta.url));
const channel = process.env.BROWSER_CHANNEL ?? 'msedge';

const browser = await chromium.launch({ channel, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
// 1201 wide keeps the desktop layout; the capture is the 1200x630 preview size.
const page = await browser.newPage({ viewport: { width: 1201, height: 631 } });
await page.goto(url, { waitUntil: 'networkidle' });

// The "GREAT WORK" bar on top, then the portrait with name, role and education where the bio was.
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
  const name = document.createElement('div');
  name.className = 'preview-name';
  name.innerHTML = '<h1 class="h1-title">Joe Sharipov</h1><h2 class="occupation-title">Software Engineer</h2>';
  document.querySelector('.about-text')?.prepend(name);
  const bar = document.querySelector('.purple-background');
  if (bar) window.scrollBy(0, bar.getBoundingClientRect().top - 24);
});
await page.waitForTimeout(6000);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log(`Saved ${out}`);
