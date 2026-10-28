/**
 * lighthouse.ts — mobile Lighthouse runs against the built site, served locally.
 * Reports (HTML + JSON) land in .lighthouse/ (gitignored). Needs local Chrome.
 *
 *   bun run lighthouse [path ...]
 */
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO = resolve(import.meta.dir, '..');
const OUT = join(REPO, '.lighthouse');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chrome)) {
  console.error(`[lighthouse] Chrome not found at ${chrome}. Set CHROME_PATH.`);
  process.exit(1);
}
await mkdir(OUT, { recursive: true });
const port = 4398;
const server = Bun.spawn(['bun', join(REPO, 'scripts', 'serve.ts'), String(port)], { stdout: 'ignore', stderr: 'inherit' });
await new Promise((r) => setTimeout(r, 600));
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/learn/how-do-planes-fly', '/aircraft/boeing-747'];
let worst = 100;
try {
  for (const p of pages) {
    const name = p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '_');
    const base = join(OUT, name);
    const proc = Bun.spawnSync(
      [
        'npx', 'lighthouse', `http://localhost:${port}${p}`, '--quiet', '--chrome-flags=--headless=new --no-sandbox',
        '--preset=perf', '--only-categories=performance,accessibility,best-practices,seo', '--form-factor=mobile',
        '--screenEmulation.mobile', '--output=json', '--output=html', `--output-path=${base}`,
      ],
      { env: { ...process.env, CHROME_PATH: chrome }, stdout: 'inherit', stderr: 'inherit' },
    );
    if (proc.exitCode !== 0) { console.error(`[lighthouse] failed on ${p}`); continue; }
    const report = JSON.parse(await readFile(`${base}.report.json`, 'utf8')) as { categories: Record<string, { score: number }> };
    const scores = Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    for (const s of Object.values(scores)) worst = Math.min(worst, s);
    console.log(`[lighthouse] ${p}: ${Object.entries(scores).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  }
} finally {
  server.kill();
}
console.log(`[lighthouse] lowest score: ${worst}${worst < 95 ? ' (target is 95)' : ''}`);
