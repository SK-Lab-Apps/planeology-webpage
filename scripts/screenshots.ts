/**
 * screenshots.ts — full-page captures of key pages at 375 and 1440 px, written
 * to .screenshots/ (gitignored). Drives local Chrome through puppeteer-core
 * (installed with Lighthouse). Needs a built dist/.
 *
 *   bun run screenshots [path ...]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const REPO = resolve(import.meta.dir, '..');
const OUT = join(REPO, '.screenshots');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chrome)) {
  console.error(`[screenshots] Chrome not found at ${chrome}. Set CHROME_PATH.`);
  process.exit(1);
}
if (!existsSync(join(REPO, 'dist', 'index.html'))) {
  console.error('[screenshots] dist/ is missing. Run `bun run build` first.');
  process.exit(1);
}
await mkdir(OUT, { recursive: true });
const port = 4399;
const server = Bun.spawn(['bun', join(REPO, 'scripts', 'serve.ts'), String(port)], { stdout: 'ignore', stderr: 'inherit' });
await new Promise((r) => setTimeout(r, 600));

const pages = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/learn/how-do-planes-fly', '/aircraft/boeing-747', '/phonetic-alphabet', '/privacy', '/terms', '/aircraft', '/learn', '/glossary', '/aviation-quiz', '/daily?n=301&s=4&ref=Alex', '/support'];
const sizes = [
  { w: 375, h: 812, tag: 'mobile', mobile: true },
  { w: 1440, h: 1100, tag: 'desktop', mobile: false },
];
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
try {
  for (const p of pages) {
    for (const s of sizes) {
      const page = await browser.newPage();
      await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1, isMobile: s.mobile, hasTouch: s.mobile });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.goto(`http://localhost:${port}${p}`, { waitUntil: 'networkidle0' });
      // Let lazy images below the fold load for the capture.
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.setAttribute('loading', 'eager'));
        await new Promise((r) => setTimeout(r, 400));
      });
      const base = p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '_');
      await page.screenshot({ path: join(OUT, `${base}-${s.tag}.png`), fullPage: true });
      // The first screen at natural scale, for judging the fold.
      await page.screenshot({ path: join(OUT, `${base}-${s.tag}-fold.png`), fullPage: false });
      console.log(`[screenshots] ok  .screenshots/${base}-${s.tag}.png (+ -fold)`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}
