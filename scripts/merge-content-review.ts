/**
 * merge-content-review.ts — folds the per-page fragments in content-review/
 * into CONTENT_REVIEW.md (after its "## Source key" section), in route order.
 *
 *   bun scripts/merge-content-review.ts
 *
 * Fragments are kept; the merged file is what reviewers read.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const REPO = resolve(import.meta.dir, '..');
const dir = join(REPO, 'content-review');
const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort((a, b) => {
  const order = (f: string) => (f.startsWith('learn-') ? 0 : f.startsWith('aircraft-') ? 1 : 2);
  return order(a) - order(b) || a.localeCompare(b);
});
const main = await readFile(join(REPO, 'CONTENT_REVIEW.md'), 'utf8');
const marker = '\n---\n\n## /';
const head = main.includes(marker) ? main.slice(0, main.indexOf(marker)) : main.trimEnd();

const sections: string[] = [];
for (const f of files) {
  const text = (await readFile(join(dir, f), 'utf8')).trim();
  if (!text) continue;
  sections.push(text);
}
const existing = main.includes(marker) ? main.slice(main.indexOf(marker)) : '';
// Keep hand-written sections from the main file whose route has no fragment.
const fragmentRoutes = new Set(sections.map((s) => s.match(/^## (\/\S+)/m)?.[1]).filter(Boolean));
const kept = existing
  .split(/\n(?=## \/)/)
  .map((s) => s.replace(/^\n?---\n\n/, '').trim())
  .filter((s) => s.startsWith('## /') && !fragmentRoutes.has(s.match(/^## (\/\S+)/)?.[1] ?? ''));

const all = [...kept, ...sections].sort((a, b) => {
  const route = (s: string) => s.match(/^## (\/\S+)/)?.[1] ?? '';
  const rank = (r: string) => (r.startsWith('/learn/') ? 0 : r.startsWith('/aircraft/') ? 1 : 2);
  return rank(route(a)) - rank(route(b)) || route(a).localeCompare(route(b));
});
await writeFile(join(REPO, 'CONTENT_REVIEW.md'), `${head.trimEnd()}\n\n---\n\n${all.join('\n\n')}\n`);
console.log(`[merge-content-review] ${all.length} page sections (${sections.length} fragments, ${kept.length} kept)`);
