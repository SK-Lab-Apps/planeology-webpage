/**
 * check-overflow.ts — loads every built page at 375 and 768 px and fails if the
 * page scrolls sideways. Elements inside .table-wrap (their own scroll container)
 * are allowed to be wider. Needs a built dist/ and local Chrome.
 *
 *   bun run check-overflow
 */
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import puppeteer from 'puppeteer-core';

const REPO = resolve(import.meta.dir, '..');
const DIST = join(REPO, 'dist');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chrome) || !existsSync(join(DIST, 'index.html'))) {
  console.error('[check-overflow] needs local Chrome (CHROME_PATH) and a built dist/');
  process.exit(1);
}
async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const paths = (await walk(DIST)).map((f) => {
  const rel = relative(DIST, f).replace(/\.html$/, '');
  return rel === 'index' ? '/' : '/' + rel;
});
const port = 4396;
const server = Bun.spawn(['bun', join(REPO, 'scripts', 'serve.ts'), String(port)], { stdout: 'ignore', stderr: 'inherit' });
await new Promise((r) => setTimeout(r, 600));
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
const problems: string[] = [];
try {
  for (const width of [375, 768]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 });
  for (const p of paths) {
    await page.goto(`http://localhost:${port}${p}`, { waitUntil: 'load' });
    const res = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflowing: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
        if (el.parentElement?.closest('.table-wrap') || el.closest('svg, [hidden]')) continue;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          overflowing.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} (${Math.round(r.left)}–${Math.round(r.right)})`);
        }
      }
      return { scroll: document.documentElement.scrollWidth, vw, overflowing: overflowing.slice(0, 3) };
    });
    if (res.scroll > res.vw + 1 || res.overflowing.length) {
      problems.push(`${p} @${width}: scrollWidth ${res.scroll} > ${res.vw}; ${res.overflowing.join(', ')}`);
    }
  }
  await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
if (problems.length) {
  for (const p of problems) console.error(`  FAIL  ${p}`);
  console.error(`\n[check-overflow] ${problems.length} page views overflow (${paths.length} pages at 375 and 768 px)`);
  process.exit(1);
}
console.log(`[check-overflow] ok: ${paths.length} pages, nothing scrolls sideways at 375 or 768 px`);
