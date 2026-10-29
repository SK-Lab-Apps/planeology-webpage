/**
 * check-dist.ts — checks the built site in dist/ (run by `bun run build`).
 *
 * One <h1> per page; canonical, title and description present and within
 * limits; JSON-LD parses; the sitemap matches the indexable pages; no resource
 * from any other origin in scripts, styles, fonts, images or iframes; the AASA
 * file exists; og images exist; article pages ship under ~30 KB of JS.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const REPO = resolve(import.meta.dir, '..');
const DIST = join(REPO, 'dist');
const DOMAIN = 'https://www.planeology.app';
const problems: string[] = [];
const fail = (where: string, msg: string) => problems.push(`${where}: ${msg}`);

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('[check-dist] dist/index.html is missing. Run astro build first.');
  process.exit(1);
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1] ?? tag.match(new RegExp(`\\s${name}='([^']*)'`, 'i'))?.[1];
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const indexable = new Set<string>();
const titles = new Map<string, string>();
const descriptions = new Map<string, string>();
const jsBudgetPages: string[] = [];

for (const file of htmlFiles) {
  const rel = relative(DIST, file);
  const html = await readFile(file, 'utf8');
  const url = rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, '').replace(/\/index$/, '');
  const where = url;

  // one h1
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(where, `expected exactly one <h1>, found ${h1s.length}`);

  // title
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  if (!title) fail(where, 'missing <title>');
  else {
    if (title.length > 60) fail(where, `<title> is ${title.length} characters (max 60): "${title}"`);
    const prev = titles.get(title);
    if (prev) fail(where, `duplicate <title> with ${prev}: "${title}"`);
    titles.set(title, where);
  }
  // description
  const descTag = html.match(/<meta\s+name="description"[^>]*>/)?.[0];
  const desc = descTag ? decode(attr(descTag, 'content') ?? '') : '';
  if (!desc) fail(where, 'missing meta description');
  else {
    if (desc.length < 120 || desc.length > 155) fail(where, `meta description is ${desc.length} characters (120–155)`);
    const prev = descriptions.get(desc);
    if (prev) fail(where, `duplicate meta description with ${prev}`);
    descriptions.set(desc, where);
  }
  // canonical + robots
  const canonical = attr(html.match(/<link\s+rel="canonical"[^>]*>/)?.[0] ?? '', 'href');
  if (!canonical) fail(where, 'missing canonical');
  else if (rel !== '404.html' && canonical !== `${DOMAIN}${url === '/' ? '/' : url}`) fail(where, `canonical ${canonical} does not match ${url}`);
  const robots = attr(html.match(/<meta\s+name="robots"[^>]*>/)?.[0] ?? '', 'content') ?? '';
  if (!robots) fail(where, 'missing robots meta');
  const noindex = /noindex/.test(robots);
  if (!noindex && rel !== '404.html') indexable.add(`${DOMAIN}${url === '/' ? '/' : url}`);
  if (!/<html[^>]*lang="en-US"/.test(html)) fail(where, 'html lang must be en-US');

  // og image exists locally
  const og = attr(html.match(/<meta\s+property="og:image"[^>]*>/)?.[0] ?? '', 'content');
  if (!og) fail(where, 'missing og:image');
  else if (og.startsWith(DOMAIN)) {
    const local = join(DIST, og.slice(DOMAIN.length));
    if (!existsSync(local)) fail(where, `og:image not in dist: ${og}`);
  } else fail(where, `og:image must be on ${DOMAIN}: ${og}`);

  // JSON-LD parses
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const doc = JSON.parse(m[1]);
      const text = JSON.stringify(doc);
      if (/aggregateRating/.test(text)) fail(where, 'JSON-LD must not contain aggregateRating');
    } catch (e) {
      fail(where, `JSON-LD does not parse: ${(e as Error).message}`);
    }
  }

  // no cross-origin resources
  const resourceTags = html.match(/<(script|link|img|source|iframe|video|audio|embed|object)\b[^>]*>/g) ?? [];
  for (const tag of resourceTags) {
    const isLink = /^<link/.test(tag);
    const relAttr = attr(tag, 'rel') ?? '';
    if (isLink && /canonical|alternate|sitemap/.test(relAttr)) continue;
    for (const name of ['src', 'href', 'srcset', 'imagesrcset', 'poster', 'data']) {
      const v = attr(tag, name);
      if (!v) continue;
      const urls = name.includes('srcset') ? v.split(',').map((s) => s.trim().split(/\s+/)[0]) : [v];
      for (const u of urls) {
        if (/^(https?:)?\/\//i.test(u) && !u.startsWith(DOMAIN)) fail(where, `cross-origin resource: ${u.slice(0, 80)}`);
      }
    }
  }
  if (/<iframe/.test(html)) fail(where, 'iframes are not allowed');
  // inline styles/url() pointing elsewhere
  for (const m of html.matchAll(/url\((['"]?)(https?:\/\/[^)'"]+)\1\)/g)) {
    if (!m[2].startsWith(DOMAIN)) fail(where, `cross-origin url(): ${m[2].slice(0, 80)}`);
  }

  if (url.startsWith('/learn/') || url.startsWith('/aircraft/')) jsBudgetPages.push(file);
}

// CSS files: fonts and images must be local
for (const css of files.filter((f) => f.endsWith('.css'))) {
  const text = await readFile(css, 'utf8');
  for (const m of text.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) {
    if (/^(https?:)?\/\//i.test(m[2]) && !m[2].startsWith(DOMAIN)) fail(relative(DIST, css), `cross-origin url(): ${m[2].slice(0, 80)}`);
  }
  if (/@import\s+url\(/.test(text)) fail(relative(DIST, css), 'remote @import');
}

// JS budget on article pages: the sum of <script src> files referenced.
for (const file of jsBudgetPages) {
  const html = await readFile(file, 'utf8');
  let bytes = 0;
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*>/g)) {
    const p = join(DIST, m[1]);
    if (existsSync(p)) bytes += (await stat(p)).size;
  }
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) bytes += m[1].length;
  if (bytes > 30 * 1024) fail(relative(DIST, file), `ships ${Math.round(bytes / 1024)} KB of JS (budget ~30 KB)`);
}

// Sitemap matches indexable pages
const sitemapFiles = files.filter((f) => /sitemap-\d+\.xml$/.test(f));
if (!existsSync(join(DIST, 'sitemap-index.xml')) || sitemapFiles.length === 0) fail('sitemap', 'sitemap-index.xml or sitemap-0.xml missing');
const inSitemap = new Set<string>();
for (const f of sitemapFiles) {
  const xml = await readFile(f, 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) inSitemap.add(m[1].replace(/\/$/, '') || DOMAIN);
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) if (!/<lastmod>/.test(m[1])) fail('sitemap', `entry without lastmod: ${m[1].match(/<loc>([^<]+)/)?.[1]}`);
}
const norm = (u: string) => (u === `${DOMAIN}/` ? DOMAIN : u.replace(/\/$/, ''));
const want = new Set([...indexable].map(norm));
const have = new Set([...inSitemap].map(norm));
for (const u of want) if (!have.has(u)) fail('sitemap', `indexable page missing from sitemap: ${u}`);
for (const u of have) if (!want.has(u)) fail('sitemap', `sitemap lists a page that is not indexable or does not exist: ${u}`);

// robots.txt points at the sitemap
const robotsTxt = existsSync(join(DIST, 'robots.txt')) ? await readFile(join(DIST, 'robots.txt'), 'utf8') : '';
if (!robotsTxt.includes(`${DOMAIN}/sitemap-index.xml`)) fail('robots.txt', 'must point at the sitemap index');

// AASA
const aasa = join(DIST, '.well-known', 'apple-app-site-association');
if (!existsSync(aasa)) fail('aasa', 'dist/.well-known/apple-app-site-association is missing');
else {
  try {
    const doc = JSON.parse(await readFile(aasa, 'utf8')) as { applinks?: { details?: { appIDs?: string[]; components?: unknown[] }[] } };
    const d = doc.applinks?.details?.[0];
    if (!d?.appIDs?.includes('Y2V3U7CSV9.com.planeologylearnaviation.app')) fail('aasa', 'appIDs must list Y2V3U7CSV9.com.planeologylearnaviation.app');
    if (!d?.components?.length) fail('aasa', 'components missing');
  } catch (e) {
    fail('aasa', `not valid JSON: ${(e as Error).message}`);
  }
}
// Required files
for (const f of ['privacy.html', 'terms.html', 'support.html', '404.html', 'og.png', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest', 'badges/download-on-the-app-store.svg']) {
  if (!existsSync(join(DIST, f))) fail('dist', `missing ${f}`);
}

if (problems.length) {
  for (const p of problems) console.error(`  FAIL  ${p}`);
  console.error(`\n[check-dist] ${problems.length} problem(s) across ${htmlFiles.length} pages`);
  process.exit(1);
}
console.log(`[check-dist] ok: ${htmlFiles.length} pages, ${indexable.size} indexable, sitemap matches, no cross-origin resources`);
