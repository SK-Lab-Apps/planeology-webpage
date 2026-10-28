/**
 * check-content.ts — the content rules, enforced.
 *
 *   bun run check-content                 # everything
 *   bun run check-content guides/<slug>   # one guide
 *   bun run check-content aircraft/<id>   # one aircraft page
 *
 * Checks: word ranges and the 40–60-word lead answer; sources on every guide and
 * aircraft page and on every quick-facts row; title and description lengths and
 * uniqueness; alt text on every image; the banned scope words; internal links;
 * the hidden ranks; and that every id referenced (lesson, aircraft, question,
 * guide, glossary) exists.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const REPO = resolve(import.meta.dir, '..');
const only = process.argv[2];
const problems: string[] = [];
const warnings: string[] = [];
const fail = (where: string, msg: string) => problems.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

const SITE_NAME_SUFFIX = ' | Planeology'.length; // 13
const TITLE_MAX = 60;

// Words that put a page out of scope (CONTENT_STYLE.md §3). Matched as whole words, any case.
const BANNED = [
  'checklist', 'checklists', 'procedure', 'procedures', 'certified', 'certification',
  'you should', 'you must', 'flight training', 'flight school', 'student pilot', 'ground school',
  'checkride', 'how to fly', 'step by step', 'step-by-step', 'exam', 'exams', 'medical advice',
];
// Pages allowed to say "not flight training" (and only that phrasing).
const NOT_TRAINING_OK = new Set(['src/pages/index.astro', 'src/pages/support.astro', 'src/content/legal.ts', 'src/pages/terms.astro', 'src/content/faq.ts']);
const HIDDEN_RANKS = ['Hall of Famer', 'Sky Sage'];
const CLAIM_WORDS = [/\b#1\b/i, /\bbest (app|aviation app)\b/i, /\bfree trial\b/i, /\btestimonial/i, /\bandroid (is )?coming\b/i, /\bcoming (soon )?to android\b/i, /\bfree sample\b/i, /\bfree lesson\b/i, /\bfrom the app\b/i, /\bpreview of the app\b/i, /\bunlock the rest\b/i];

function words(text: string): number {
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}
function bannedIn(text: string, where: string, allowNotTraining = false) {
  const lower = text.toLowerCase();
  for (const b of BANNED) {
    const re = new RegExp(`(^|[^a-z])${b.replace(/[-\s]/g, '[\\s-]')}([^a-z]|$)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower))) {
      const idx = m.index;
      if (allowNotTraining && b === 'flight training') {
        const before = lower.slice(Math.max(0, idx - 12), idx + 1);
        if (/(not|isn't|isn’t|never|no)\s$/.test(before) || /(not|isn't|isn’t|never|no)\s[a-z]*$/.test(before)) continue;
      }
      const ctx = text.slice(Math.max(0, idx - 30), idx + b.length + 30).replace(/\s+/g, ' ');
      fail(where, `banned scope word "${b}" near: …${ctx}…`);
    }
  }
  for (const r of HIDDEN_RANKS) if (text.includes(r)) fail(where, `hidden rank "${r}" must never appear`);
  for (const re of CLAIM_WORDS) {
    const m = text.match(re);
    if (m) fail(where, `claim rule: "${m[0]}" is not allowed`);
  }
}

// ── app snapshot ──────────────────────────────────────────────────────────────
const app = join(REPO, 'src', 'data', 'app');
const lessons = JSON.parse(await readFile(join(app, 'lessons.json'), 'utf8')) as { id: string; cards: { id: string }[] }[];
const aircraft = JSON.parse(await readFile(join(app, 'aircraft.json'), 'utf8')) as { id: string; name: string }[];
const questions = JSON.parse(await readFile(join(app, 'questions.json'), 'utf8')) as { id: string }[];
const lessonIds = new Set(lessons.map((l) => l.id));
const cardIds = new Set(lessons.flatMap((l) => l.cards.map((c) => c.id)));
const aircraftIds = new Set(aircraft.map((a) => a.id));
const aircraftNames = new Map(aircraft.map((a) => [a.id, a.name]));
const questionIds = new Set(questions.map((q) => q.id));

// ── collections on disk ───────────────────────────────────────────────────────
const guidesDir = join(REPO, 'src', 'content', 'guides');
const aircraftDir = join(REPO, 'src', 'content', 'aircraft');
const guideFiles = (await readdir(guidesDir)).filter((f) => f.endsWith('.mdx'));
const aircraftFiles = (await readdir(aircraftDir)).filter((f) => f.endsWith('.json'));
const guideSlugs = new Set(guideFiles.map((f) => f.replace(/\.mdx$/, '')));
const aircraftPages = new Set(aircraftFiles.map((f) => f.replace(/\.json$/, '')));
const glossaryPath = join(REPO, 'src', 'content', 'glossary.json');
const glossary = existsSync(glossaryPath) ? (JSON.parse(await readFile(glossaryPath, 'utf8')) as { id: string; term: string; definition: string; guides?: string[]; aircraft?: string[]; lesson?: string }[]) : [];
const glossaryIds = new Set(glossary.map((g) => g.id));

const STATIC_ROUTES = new Set(['/', '/learn', '/aircraft', '/glossary', '/phonetic-alphabet', '/aviation-quiz', '/daily', '/support', '/privacy', '/terms']);
// The guides planned in the brief. While they are being written, links to them are valid; the full run fails if any is missing.
const PLANNED_GUIDES = ['how-do-planes-fly', 'why-do-planes-fly-so-high', 'is-turbulence-dangerous', 'how-safe-is-flying', 'why-are-black-boxes-orange', 'why-are-airplane-windows-round', 'how-jet-engines-work', 'what-do-runway-numbers-mean', 'airport-codes-explained', 'how-air-traffic-control-works', 'what-are-contrails', 'why-flying-east-is-faster', 'what-is-a-stall', 'how-does-autopilot-work', 'wright-brothers-first-flight', 'boeing-vs-airbus', 'why-was-concorde-retired', 'fastest-planes-ever', 'biggest-planes-in-the-world', 'how-do-helicopters-fly', 'how-does-stealth-work', 'what-is-mach-1', 'what-do-flaps-and-slats-do', 'how-to-learn-about-aviation'];
const guideTargets = new Set([...guideSlugs, ...PLANNED_GUIDES]);
function linkOk(href: string): boolean {
  const [path, hash] = href.split('#');
  if (path === '' && hash) return true;
  if (STATIC_ROUTES.has(path)) {
    if (path === '/glossary' && hash) return glossaryIds.has(hash);
    return true;
  }
  if (path.startsWith('/learn/')) return guideTargets.has(path.slice('/learn/'.length));
  if (path.startsWith('/aircraft/')) return aircraftIds.has(path.slice('/aircraft/'.length));
  return false;
}
function checkLinks(text: string, where: string) {
  const re = /\]\((\/[^)\s]*)\)|href="(\/[^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const href = m[1] ?? m[2];
    if (!linkOk(href)) fail(where, `internal link does not resolve: ${href}`);
  }
}

const titles = new Map<string, string>();
const descriptions = new Map<string, string>();
function unique(map: Map<string, string>, value: string, where: string, what: string) {
  const prev = map.get(value.toLowerCase());
  if (prev) fail(where, `${what} duplicates ${prev}: "${value}"`);
  else map.set(value.toLowerCase(), where);
}

// ── guides ────────────────────────────────────────────────────────────────────
const LONG_GUIDES = new Set(['how-do-planes-fly', 'how-to-learn-about-aviation']);
for (const file of guideFiles) {
  const slug = file.replace(/\.mdx$/, '');
  if (only && only !== `guides/${slug}`) continue;
  const where = `guides/${slug}`;
  const raw = await readFile(join(guidesDir, file), 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) { fail(where, 'missing frontmatter'); continue; }
  let fm: Record<string, unknown>;
  try { fm = parseYaml(fmMatch[1]) as Record<string, unknown>; } catch (e) { fail(where, `frontmatter YAML: ${(e as Error).message}`); continue; }
  const body = fmMatch[2];

  const str = (k: string) => (typeof fm[k] === 'string' ? (fm[k] as string) : '');
  const arr = (k: string) => (Array.isArray(fm[k]) ? (fm[k] as unknown[]) : []);

  // Titles and descriptions
  const seoTitle = str('seoTitle');
  if (seoTitle.length + SITE_NAME_SUFFIX > TITLE_MAX) fail(where, `seoTitle too long for a 60-character <title> (${seoTitle.length + SITE_NAME_SUFFIX})`);
  unique(titles, seoTitle, where, 'seoTitle');
  const desc = str('description');
  if (desc.length < 120 || desc.length > 155) fail(where, `description must be 120–155 characters (${desc.length})`);
  unique(descriptions, desc, where, 'description');
  if (!str('title')) fail(where, 'missing title');
  unique(titles, str('title'), where, 'title');

  // The direct answer
  const answerWords = words(str('answer'));
  if (answerWords < 40 || answerWords > 60) fail(where, `answer must be 40–60 words (${answerWords})`);

  // Body length
  const bodyText = body
    .replace(/^import .*$/gm, '')
    .replace(/<DidYouKnow[^>]*>[\s\S]*?<\/DidYouKnow>/g, (m) => m.replace(/<[^>]+>/g, ' '))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ');
  const n = words(bodyText);
  const max = LONG_GUIDES.has(slug) ? 2500 : 2000;
  if (n < 1200 || n > max) fail(where, `body must be 1,200–${max.toLocaleString()} words (${n})`);

  // Structure
  const h2s = body.match(/^## .+$/gm) ?? [];
  if (h2s.length < 4) fail(where, `needs at least 4 H2s (${h2s.length})`);
  for (const h of h2s) if (!/\?\s*$/.test(h) && !/^## (Sources|What to watch for|Where to)/.test(h)) warn(where, `H2 not phrased as a question: "${h.slice(3)}"`);
  if (/^# /m.test(body)) fail(where, 'body must not contain an H1 (the layout renders it)');
  const figures = body.match(/<Figure\b[^>]*\/>/g) ?? [];
  const svgs = body.match(/<svg\b/g) ?? [];
  if (figures.length + svgs.length < 2 || figures.length > 4) fail(where, `needs 2–4 figures (found ${figures.length} Figure, ${svgs.length} inline svg)`);
  for (const f of figures) {
    const id = f.match(/\bid="([^"]+)"/)?.[1];
    const alt = f.match(/\balt="([^"]*)"/)?.[1] ?? '';
    if (!id || !cardIds.has(id)) fail(where, `Figure id not in the app's lesson art: ${id}`);
    if (words(alt) < 6) fail(where, `Figure ${id} needs a descriptive alt (≥ 6 words)`);
  }
  const dyk = (body.match(/<DidYouKnow\b/g) ?? []).length;
  if (dyk !== 1) fail(where, `needs exactly one <DidYouKnow> (${dyk})`);
  const appCards = (body.match(/<AppCard\b/g) ?? []).length;
  if (appCards !== 1) fail(where, `needs exactly one <AppCard /> (${appCards})`);
  else {
    const idx = body.indexOf('<AppCard');
    const before = words(body.slice(0, idx).replace(/^import .*$/gm, '').replace(/<[^>]+>/g, ' '));
    const ratio = before / n;
    if (ratio < 0.3 || ratio > 0.55) fail(where, `<AppCard /> should sit about 40% down the body (it is at ${Math.round(ratio * 100)}%)`);
  }

  // References
  for (const l of arr('lessons')) if (!lessonIds.has(String(l))) fail(where, `unknown lesson id: ${l}`);
  const rg = arr('relatedGuides').map(String);
  if (rg.length < 3) fail(where, 'needs at least 3 relatedGuides');
  for (const g of rg) { if (!guideTargets.has(g)) fail(where, `relatedGuides: no guide "${g}"`); if (g === slug) fail(where, 'relatedGuides includes itself'); }
  const ra = arr('relatedAircraft').map(String);
  if (ra.length < 2 || ra.length > 3) fail(where, 'needs 2–3 relatedAircraft');
  for (const a of ra) if (!aircraftIds.has(a)) fail(where, `relatedAircraft: unknown aircraft "${a}"`);
  const quiz = arr('quiz').map(String);
  if (quiz.length !== 3) fail(where, 'quiz needs exactly 3 question ids');
  for (const q of quiz) if (!questionIds.has(q)) fail(where, `quiz: unknown question id "${q}"`);
  const sources = arr('sources') as { publisher?: string; title?: string; url?: string }[];
  if (sources.length < 2) fail(where, 'needs at least 2 sources');
  for (const s of sources) {
    if (!s.publisher || !s.title || !s.url) fail(where, `source missing publisher/title/url: ${JSON.stringify(s)}`);
    else if (!s.url.startsWith('https://')) fail(where, `source must be https: ${s.url}`);
    if (s.url && /wikipedia\.org/i.test(s.url)) fail(where, `Wikipedia is never a source: ${s.url}`);
  }
  const lead = str('lead');
  if (!cardIds.has(lead)) fail(where, `lead must be a lesson card id with art: ${lead}`);
  if (words(str('leadAlt')) < 6) fail(where, 'leadAlt needs a descriptive alt');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str('datePublished')) || !/^\d{4}-\d{2}-\d{2}$/.test(str('dateModified'))) fail(where, 'dates must be YYYY-MM-DD');

  // Links and scope
  checkLinks(body, where);
  bannedIn(`${str('title')} ${str('dek')} ${str('answer')} ${desc} ${body}`, where);
  // Internal links to other guides and aircraft: dense linking.
  const guideLinks = new Set([...body.matchAll(/\]\(\/learn\/([a-z0-9-]+)\)/g)].map((m) => m[1]));
  const aircraftLinks = new Set([...body.matchAll(/\]\(\/aircraft\/([a-z0-9-]+)\)/g)].map((m) => m[1]));
  const totalGuideLinks = new Set([...guideLinks, ...rg]).size;
  const totalAircraftLinks = new Set([...aircraftLinks, ...ra]).size;
  if (totalGuideLinks < 3) fail(where, `links to fewer than 3 other guides (${totalGuideLinks})`);
  if (totalAircraftLinks < 2) fail(where, `links to fewer than 2 aircraft pages (${totalAircraftLinks})`);
}

// ── aircraft ──────────────────────────────────────────────────────────────────
for (const file of aircraftFiles) {
  const id = file.replace(/\.json$/, '');
  if (only && only !== `aircraft/${id}`) continue;
  const where = `aircraft/${id}`;
  let d: Record<string, unknown>;
  try { d = JSON.parse(await readFile(join(aircraftDir, file), 'utf8')); } catch (e) { fail(where, `invalid JSON: ${(e as Error).message}`); continue; }
  if (!aircraftIds.has(id)) fail(where, 'file name is not an aircraft id in the app snapshot');
  if (d.id !== id) fail(where, `"id" must equal the file name (${d.id})`);
  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '');
  const arr = (k: string) => (Array.isArray(d[k]) ? (d[k] as unknown[]) : []);
  const name = aircraftNames.get(id) ?? id;
  const title = str('seoTitle') || `${name} Facts & Specs`;
  if (title.length + SITE_NAME_SUFFIX > TITLE_MAX) fail(where, `<title> would exceed 60 characters ("${title}", ${title.length + SITE_NAME_SUFFIX}); set a shorter seoTitle`);
  unique(titles, title, where, 'title');
  unique(titles, str('h1'), where, 'h1');
  const desc = str('description');
  if (desc.length < 120 || desc.length > 155) fail(where, `description must be 120–155 characters (${desc.length})`);
  unique(descriptions, desc, where, 'description');
  const sources = arr('sources') as { publisher?: string; title?: string; url?: string }[];
  if (sources.length < 1) fail(where, 'needs at least 1 source');
  for (const s of sources) {
    if (!s.publisher || !s.title || !s.url) fail(where, `source missing publisher/title/url: ${JSON.stringify(s)}`);
    else if (!s.url.startsWith('https://')) fail(where, `source must be https: ${s.url}`);
    if (s.url && /wikipedia\.org/i.test(s.url)) fail(where, `Wikipedia is never a source: ${s.url}`);
  }
  const qf = arr('quickFacts') as { label?: string; value?: string; source?: number }[];
  if (qf.length < 3) fail(where, 'needs at least 3 quick facts');
  for (const q of qf) {
    if (!q.label || !q.value) fail(where, `quick fact row is blank: ${JSON.stringify(q)}`);
    if (typeof q.source !== 'number' || q.source < 1 || q.source > sources.length) fail(where, `quick fact "${q.label}" has no valid source index`);
  }
  const wts = d.whereToSee as { text?: string; source?: number } | null;
  if (wts && (typeof wts.source !== 'number' || wts.source < 1 || wts.source > sources.length)) fail(where, 'whereToSee needs a valid source index');
  const text = [...arr('intro'), ...arr('whyItMatters'), ...arr('facts'), wts?.text ?? ''].map(String).join(' ');
  const n = words(text);
  if (n < 400 || n > 800) fail(where, `body must be 400–800 words (${n})`);
  const facts = arr('facts');
  if (facts.length < 3 || facts.length > 5) fail(where, `needs 3–5 notable facts (${facts.length})`);
  const rg = arr('relatedGuides').map(String);
  if (rg.length < 1) fail(where, 'needs at least 1 related guide');
  for (const g of rg) if (!guideTargets.has(g)) fail(where, `relatedGuides: no guide "${g}"`);
  const ra = arr('relatedAircraft').map(String);
  if (ra.length !== 3) fail(where, 'needs exactly 3 relatedAircraft');
  for (const a of ra) { if (!aircraftIds.has(a)) fail(where, `relatedAircraft: unknown "${a}"`); if (a === id) fail(where, 'relatedAircraft includes itself'); }
  if (!['pioneers', 'golden-age', 'wwii', 'jet-age', 'widebody-era', 'modern'].includes(str('era'))) fail(where, `bad era "${str('era')}"`);
  if (!['airliner', 'military', 'light-aircraft', 'research', 'rotor-evtol', 'transport-special'].includes(str('roleGroup'))) fail(where, `bad roleGroup "${str('roleGroup')}"`);
  checkLinks(text, where);
  bannedIn(`${str('h1')} ${desc} ${text}`, where);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str('datePublished')) || !/^\d{4}-\d{2}-\d{2}$/.test(str('dateModified'))) fail(where, 'dates must be YYYY-MM-DD');
}

// ── glossary ──────────────────────────────────────────────────────────────────
if (!only) {
  const where = 'glossary';
  if (glossary.length < 120 || glossary.length > 150) fail(where, `needs 120–150 terms (${glossary.length})`);
  const seen = new Set<string>();
  for (const g of glossary) {
    if (seen.has(g.id)) fail(where, `duplicate id ${g.id}`);
    seen.add(g.id);
    const sentences = g.definition.split(/(?<=[.!?])\s+/).filter(Boolean).length;
    if (sentences < 1 || sentences > 3) fail(where, `${g.id}: definition should be 1–3 sentences (${sentences})`);
    for (const s of g.guides ?? []) if (!guideTargets.has(s)) fail(where, `${g.id}: no guide "${s}"`);
    for (const a of g.aircraft ?? []) if (!aircraftIds.has(a)) fail(where, `${g.id}: unknown aircraft "${a}"`);
    if (g.lesson && !lessonIds.has(g.lesson)) fail(where, `${g.id}: unknown lesson "${g.lesson}"`);
    bannedIn(`${g.term} ${g.definition}`, `${where}/${g.id}`);
  }
}

// ── static pages and shared copy: scope words and hidden ranks ────────────────
if (!only) {
  const scan = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) { await scan(p); continue; }
      if (!/\.(astro|ts|json|mdx)$/.test(entry.name)) continue;
      const rel = p.replace(REPO + '/', '');
      if (rel.startsWith('src/content/guides') || rel.startsWith('src/content/aircraft') || rel === 'src/content/glossary.json') continue;
      if (rel.startsWith('src/data/app/')) continue; // the app's own text, checked in the app
      if (rel === 'src/env.d.ts') continue;
      const text = await readFile(p, 'utf8');
      // Only check human-readable strings in code files: skip import lines and comments.
      const stripped = text.replace(/^\s*(import|\/\/|\*|\/\*\*).*$/gm, '');
      bannedIn(stripped, rel, NOT_TRAINING_OK.has(rel));
    }
  };
  await scan(join(REPO, 'src'));
  // Every aircraft in the app has a page.
  for (const a of aircraft) if (!aircraftPages.has(a.id)) fail('aircraft', `no page for ${a.id}`);
  // Every guide planned in the brief exists.
  for (const p of PLANNED_GUIDES) if (!guideSlugs.has(p)) fail('guides', `planned guide not written: ${p}`);
}

for (const w of warnings) console.warn(`  warn  ${w}`);
if (problems.length) {
  for (const p of problems) console.error(`  FAIL  ${p}`);
  console.error(`\n[check-content] ${problems.length} problem(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`[check-content] ok: ${guideFiles.length} guides, ${aircraftFiles.length} aircraft pages, ${glossary.length} glossary terms, ${warnings.length} warning(s)`);
