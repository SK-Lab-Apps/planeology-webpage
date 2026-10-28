/**
 * check-brand.ts — nothing from the sibling apps or any placeholder may ship.
 *
 * Bans the listed strings (case-insensitive) everywhere in the repo except
 * node_modules, dist, .git and the lockfile; bans `{{PLACEHOLDER}}` tokens outside
 * the README; bans the source app's palette.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const REPO = resolve(import.meta.dir, '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.astro', '.screenshots', '.lighthouse', 'og']);
const SKIP_FILES = new Set(['bun.lock', 'check-brand.ts']);
const BINARY = /\.(png|jpg|jpeg|webp|avif|ico|woff2?|ttf|otf|pdf|zip|gz|mp4)$/i;

const BANNED_STRINGS = [
  'pistonpath', 'piston path', 'gearhead', 'garage', 'primp', 'rate my fit', 'dopamine menu', 'doomscroll',
  'planelogy', 'planeology.example', 'example.com',
];
const BANNED_COLOURS = ['#00E5FF', '#FF6B35', '#00FF87', '#FF4757', '#0D0D11', '#141418', '#1A1A22'];

const problems: string[] = [];
async function scan(dir: string) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await scan(join(dir, entry.name));
      continue;
    }
    if (SKIP_FILES.has(entry.name) || BINARY.test(entry.name)) continue;
    const p = join(dir, entry.name);
    const rel = p.replace(REPO + '/', '');
    const text = await readFile(p, 'utf8');
    const lower = text.toLowerCase();
    for (const b of BANNED_STRINGS) {
      const i = lower.indexOf(b);
      if (i >= 0) problems.push(`${rel}: contains "${b}" near "${text.slice(Math.max(0, i - 20), i + b.length + 20).replace(/\s+/g, ' ')}"`);
    }
    for (const c of BANNED_COLOURS) {
      if (lower.includes(c.toLowerCase())) problems.push(`${rel}: contains the source app's colour ${c}`);
    }
    // Leftover placeholders look like {{TODO_X}} or {{GOVERNING_LAW}}; JSX object literals ({{ class }}) do not.
    const placeholder = text.match(/\{\{\s*[A-Z_][A-Z0-9_]*\s*\}\}/);
    if (rel !== 'README.md' && placeholder) {
      problems.push(`${rel}: leftover placeholder ${placeholder[0]}`);
    }
  }
}
await scan(REPO);
if (problems.length) {
  for (const p of problems) console.error(`  FAIL  ${p}`);
  console.error(`\n[check-brand] ${problems.length} problem(s)`);
  process.exit(1);
}
console.log('[check-brand] ok');
