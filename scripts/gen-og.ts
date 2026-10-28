/**
 * gen-og.ts — Open Graph images (1200×630), rendered with sharp at build time.
 *
 *   bun run gen:og
 *
 *   public/og.png                 the default card (icon, wordmark, tagline)
 *   public/og/learn/<slug>.png    each guide's lead lesson illustration + title
 *   public/og/aircraft/<id>.png   each aircraft's art + name
 *
 * Titles are set in Barlow Condensed from src/assets/fonts (the OFL TTFs the app
 * ships), converted to SVG paths with opentype.js so no system font is involved.
 * The output folder is gitignored and rebuilt by `bun run build`.
 */
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import opentype from 'opentype.js';

const REPO = resolve(import.meta.dir, '..');
const FONT_DIR = join(REPO, 'src', 'assets', 'fonts');

// Titles are converted to SVG paths with opentype.js, so the result is identical on
// every machine and no system font or fontconfig is involved.
const fonts = {
  display: opentype.parse((await readFile(join(FONT_DIR, 'BarlowCondensed-Bold.ttf'))).buffer.slice(0)),
  body: opentype.parse((await readFile(join(FONT_DIR, 'Barlow-SemiBold.ttf'))).buffer.slice(0)),
  mono: opentype.parse((await readFile(join(FONT_DIR, 'IBMPlexMono-SemiBold.ttf'))).buffer.slice(0)),
};
type FontKey = keyof typeof fonts;

const NAVY = '#12233F';
const PAPER = '#F5F2EA';
const MAGENTA = '#B0156E';
const SIGNAL = '#F6B800';
const W = 1200;
const H = 630;

function measure(font: opentype.Font, text: string, size: number, tracking = 0) {
  return font.getAdvanceWidth(text, size) + tracking * Math.max(0, text.length - 1);
}

/** Wrap words so each line fits `maxWidth` at `size`. */
function wrap(font: opentype.Font, text: string, size: number, maxWidth: number, tracking = 0): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (measure(font, trial, size, tracking) <= maxWidth || !line) line = trial;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** SVG <path> elements for lines of text, top-left anchored at (x, y). */
function textPaths(key: FontKey, lines: string[], x: number, y: number, size: number, fill: string, lineHeight = 1.05, tracking = 0): string {
  const font = fonts[key];
  const ascent = (font.ascender / font.unitsPerEm) * size;
  let out = '';
  lines.forEach((line, i) => {
    const baseline = y + ascent + i * size * lineHeight;
    if (tracking === 0) {
      out += `<path fill="${fill}" d="${font.getPath(line, x, baseline, size).toPathData(2)}"/>`;
    } else {
      let cx = x;
      for (const ch of line) {
        out += `<path fill="${fill}" d="${font.getPath(ch, cx, baseline, size).toPathData(2)}"/>`;
        cx += font.getAdvanceWidth(ch, size) + tracking;
      }
    }
  });
  return out;
}

/** The night band at the bottom: route line, eyebrow and title. */
function titleBand(title: string, eyebrow: string) {
  const bandH = 200;
  const titleSize = 64;
  const lines = wrap(fonts.display, title, titleSize, W - 120).slice(0, 2);
  const svg = `<svg width="${W}" height="${bandH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${bandH}" fill="${NAVY}"/>
    <path d="M 0 2 C 300 -20, 800 60, 1200 2" fill="none" stroke="${MAGENTA}" stroke-width="4" stroke-dasharray="12 14" stroke-linecap="round"/>
    <circle cx="1120" cy="12" r="7" fill="${SIGNAL}"/>
    ${textPaths('mono', [eyebrow.toUpperCase()], 60, 34, 20, '#FFC72C', 1, 3)}
    ${textPaths('display', lines, 60, lines.length > 1 ? 62 : 80, titleSize, '#FFFFFF', 1.02)}
  </svg>`;
  return { svg: Buffer.from(svg), bandH };
}

async function artCard(artPath: string, title: string, eyebrow: string, out: string, fit: 'cover' | 'contain') {
  const band = titleBand(title, eyebrow);
  const artH = H - band.bandH;
  const art = await sharp(artPath)
    .resize(W, artH, fit === 'cover' ? { fit: 'cover', position: 'centre' } : { fit: 'contain', background: PAPER })
    .toBuffer();
  await sharp({ create: { width: W, height: H, channels: 4, background: PAPER } })
    .composite([
      { input: art, left: 0, top: 0 },
      { input: band.svg, left: 0, top: artH },
    ])
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);
}

async function defaultCard(out: string, chip: string) {
  const icon = await sharp(join(REPO, 'src', 'assets', 'brand', 'icon.png')).resize(220, 220).png().toBuffer();
  const rounded = Buffer.from(`<svg width="220" height="220"><rect width="220" height="220" rx="48" fill="#fff"/></svg>`);
  const iconRounded = await sharp(icon).composite([{ input: rounded, blend: 'dest-in' }]).png().toBuffer();
  const bg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C3160"/><stop offset="0.55" stop-color="${NAVY}"/><stop offset="1" stop-color="#0A1529"/></linearGradient>
      <pattern id="grat" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="rgba(255,255,255,0.07)"/></pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#grat)"/>
    <g fill="none" stroke="rgba(255,255,255,0.1)"><circle cx="1100" cy="-40" r="220"/><circle cx="1100" cy="-40" r="420"/><circle cx="1100" cy="-40" r="640"/></g>
    <path d="M -40 600 C 350 580, 760 160, 1260 40" fill="none" stroke="${MAGENTA}" stroke-width="5" stroke-dasharray="14 16" stroke-linecap="round"/>
    <circle cx="300" cy="536" r="9" fill="${SIGNAL}"/><circle cx="700" cy="370" r="9" fill="${SIGNAL}"/><circle cx="1020" cy="160" r="9" fill="${SIGNAL}"/>
    ${textPaths('display', ['Planeology'], 332, 112, 118, '#FFFFFF')}
    ${textPaths('body', ['Learn aviation, one short lesson at a time'], 336, 244, 40, '#C9D2E3')}
    ${textPaths('mono', [chip], 338, 318, 21, '#FFC72C', 1, 3)}
  </svg>`;
  await sharp(Buffer.from(bg))
    .composite([{ input: iconRounded, left: 80, top: 120 }])
    .png({ compressionLevel: 9 })
    .toFile(out);
}

// ── run ────────────────────────────────────────────────────────────────────────
const counts = JSON.parse(await readFile(join(REPO, 'src', 'data', 'app', 'counts.json'), 'utf8')) as { lessons: number; questions: number; aircraft: number };
const outDir = join(REPO, 'public', 'og');
await mkdir(join(outDir, 'learn'), { recursive: true });
await mkdir(join(outDir, 'aircraft'), { recursive: true });

const only = process.argv[2];
if (!only || only === 'default') await defaultCard(join(REPO, 'public', 'og.png'), `${counts.lessons} LESSONS · ${counts.questions} QUESTIONS · ${counts.aircraft} AIRCRAFT · IPHONE`);

const aircraft = JSON.parse(await readFile(join(REPO, 'src', 'data', 'app', 'aircraft.json'), 'utf8')) as { id: string; name: string; role: string }[];
let n = 0;
if (!only || only === 'aircraft') {
  for (const a of aircraft) {
    const art = join(REPO, 'src', 'assets', 'aircraft', `${a.id}.webp`);
    await artCard(art, `${a.name}: facts and specs`, `The Hangar · ${a.role}`, join(outDir, 'aircraft', `${a.id}.png`), 'cover');
    n++;
  }
}
if (!only || only === 'guides') {
  const guidesDir = join(REPO, 'src', 'content', 'guides');
  if (existsSync(guidesDir)) {
    for (const file of await readdir(guidesDir)) {
      if (!file.endsWith('.mdx')) continue;
      const slug = file.replace(/\.mdx$/, '');
      const fm = await readFile(join(guidesDir, file), 'utf8');
      const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? slug;
      const lead = fm.match(/^lead:\s*["']?([\w-]+)["']?\s*$/m)?.[1];
      const cat = fm.match(/^category:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? 'Guide';
      if (!lead) continue;
      const art = join(REPO, 'src', 'assets', 'lessons', `${lead}.webp`);
      if (!existsSync(art)) continue;
      await artCard(art, title.replace(/\\"/g, '"'), `Guide · ${cat}`, join(outDir, 'learn', `${slug}.png`), 'cover');
      n++;
    }
  }
}
console.log(`[gen-og] wrote og.png and ${n} page cards into public/og/`);
