/**
 * sync-from-app.ts — snapshot the Planeology app's content and art into this repo.
 *
 *   bun run sync            # reads ../Planeology, or PLANEOLOGY_APP_DIR
 *
 * It never writes to the app. It:
 *   1. imports the app's constants (modules, quizzes, collectibles, ranks, sources)
 *      with bun, from inside the app so its `@/` paths resolve;
 *   2. writes JSON snapshots to src/data/app/, stamped with the app's git commit;
 *   3. copies the aircraft, lesson and rank art into src/assets/ and converts the
 *      store screenshots and the app icon for the web.
 *
 * Commit the outputs. Every count the site shows comes from counts.json.
 */
import { $ } from 'bun';
import { mkdir, readFile, writeFile, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import sharp from 'sharp';

const REPO = resolve(import.meta.dir, '..');
const APP = resolve(process.env.PLANEOLOGY_APP_DIR ?? join(REPO, '..', 'Planeology'));
if (!existsSync(join(APP, 'constants', 'modules.ts'))) {
  console.error(`[sync] Planeology app not found at ${APP}. Set PLANEOLOGY_APP_DIR.`);
  process.exit(1);
}
const OUT = join(REPO, 'src', 'data', 'app');
const ASSETS = join(REPO, 'src', 'assets');
await mkdir(OUT, { recursive: true });

// 1. Load the app's constants. Bun resolves the app's `@/` alias through its own tsconfig.
const mods = await import(join(APP, 'constants', 'modules.ts'));
const quiz = await import(join(APP, 'constants', 'quizzes.ts'));
const coll = await import(join(APP, 'constants', 'collectibles.ts'));
const ranks = await import(join(APP, 'constants', 'ranks.ts'));
const srcs = await import(join(APP, 'constants', 'sources.ts'));
const appPkg = JSON.parse(await readFile(join(APP, 'package.json'), 'utf8')) as { version?: string };

const commit = (await $`git -C ${APP} rev-parse HEAD`.text()).trim();
const commitDate = (await $`git -C ${APP} log -1 --format=%cI`.text()).trim();
const dirty = (await $`git -C ${APP} status --porcelain`.text()).trim().length > 0;

type Group = { id: string; title: string; description: string; accentColor: string; icon: string };
type Card = { id: string; title: string; content: string };
type Module = {
  id: string; title: string; subtitle: string; groupId: string; accentColor: string;
  cards: Card[]; funFact: { text: string; source: string }; sources: string[];
};
type Question = { id: string; question: string; options: string[]; correctIndex: number; explanation: string };
type ModuleQuiz = { moduleId: string; questions: Question[] };
type Collectible = {
  id: string; name: string; description: string; tier: 'common' | 'rare' | 'epic' | 'legendary';
  source: string; role: string; power: string; sources: string[];
};

const groups = mods.moduleGroups as Group[];
const modules = mods.modules as Module[];
const quizzes = quiz.moduleQuizzes as ModuleQuiz[];
const starter = coll.starterCollectible as Collectible;
const rewards = coll.lessonRewards as Record<string, Collectible>;
const tierLabels = coll.tierLabels as Record<string, string>;
const tierColors = coll.tierColors as Record<string, string>;
const sourceLabel = srcs.sourceLabel as (url: string) => { publisher: string; title: string };
const rankTitles = ranks.RANK_TITLES as { title: string; subtitle: string; color: string }[];
const rankThresholds = ranks.RANK_THRESHOLDS as number[];

const groupIndex = new Map(groups.map((g, i) => [g.id, i]));
const label = (url: string) => {
  const l = sourceLabel(url);
  return { url, publisher: l.publisher, title: l.title };
};

// 2. Snapshots.
const meta = {
  app: 'Planeology',
  appVersion: appPkg.version ?? null,
  appCommit: commit,
  appCommitDate: commitDate,
  appWorkingTreeDirty: dirty,
  syncedAt: new Date().toISOString(),
  source: 'scripts/sync-from-app.ts',
};

const groupsOut = groups.map((g, i) => ({
  id: g.id,
  index: i + 1,
  code: `LEG ${String(i + 1).padStart(2, '0')}`,
  flight: `PL ${101 + i}`,
  title: g.title,
  description: g.description,
  accent: g.accentColor,
  lessonIds: modules.filter((m) => m.groupId === g.id).map((m) => m.id),
}));

const lessonsOut = modules.map((m, i) => ({
  id: m.id,
  index: i + 1,
  title: m.title,
  subtitle: m.subtitle,
  groupId: m.groupId,
  groupTitle: groups[groupIndex.get(m.groupId)!].title,
  accent: m.accentColor,
  cards: m.cards.map((c) => ({ id: c.id, title: c.title })),
  funFact: { text: m.funFact.text, source: label(m.funFact.source) },
  sources: m.sources.map(label),
  aircraftId: rewards[m.id].id,
}));

const aircraftOut = [starter, ...modules.map((m) => rewards[m.id])].map((c, i) => {
  const lesson = modules.find((m) => rewards[m.id]?.id === c.id);
  return {
    id: c.id,
    bay: i + 1,
    bayCode: `BAY ${String(i + 1).padStart(2, '0')}`,
    name: c.name,
    description: c.description,
    tier: c.tier,
    tierLabel: tierLabels[c.tier],
    tierColor: tierColors[c.tier],
    role: c.role,
    power: c.power,
    awardedFor: c.source,
    lessonId: lesson?.id ?? null,
    lessonTitle: lesson?.title ?? null,
    groupId: lesson?.groupId ?? null,
    sources: c.sources.map(label),
  };
});

const questionsOut = quizzes.flatMap((q) =>
  q.questions.map((qq) => ({
    id: qq.id,
    lessonId: q.moduleId,
    groupId: modules.find((m) => m.id === q.moduleId)!.groupId,
    question: qq.question,
    options: qq.options,
    correctIndex: qq.correctIndex,
    explanation: qq.explanation,
  })),
);

const counts = {
  lessons: modules.length,
  groups: groups.length,
  cards: modules.reduce((n, m) => n + m.cards.length, 0),
  questions: questionsOut.length,
  aircraft: aircraftOut.length,
  dailyQuestions: 5,
  dailySeconds: 60,
  passPercent: Math.round(((quiz.PASS_THRESHOLD as number) ?? 0.8) * 100),
};

// Only the ranks a person can reach with the current catalog are public.
const reachable = rankThresholds
  .map((t, i) => ({ threshold: t, ...rankTitles[i] }))
  .filter((r) => r.threshold <= counts.lessons)
  .map((r, i) => ({ index: i + 1, title: r.title, subtitle: r.subtitle, color: r.color, lessons: r.threshold, image: `rank-${r.title.toLowerCase().replace(/\s+/g, '-')}` }));

const write = (name: string, data: unknown) =>
  writeFile(join(OUT, name), JSON.stringify(data, null, 2) + '\n');
await write('meta.json', meta);
await write('groups.json', groupsOut);
await write('lessons.json', lessonsOut);
await write('aircraft.json', aircraftOut);
await write('questions.json', questionsOut);
await write('ranks.json', reachable);
await write('counts.json', counts);

// 3. Art. The drawn art is already optimised WebP from the app's build; it is copied
//    as-is so the site shows exactly what the app shows. Screenshots and the icon are
//    converted for the web.
for (const [from, to] of [
  ['assets/aircraft', 'aircraft'],
  ['assets/lessons', 'lessons'],
] as const) {
  await mkdir(join(ASSETS, to), { recursive: true });
  for (const f of await readdir(join(APP, from))) {
    if (f.endsWith('.webp')) await copyFile(join(APP, from, f), join(ASSETS, to, f));
  }
}
await mkdir(join(ASSETS, 'ranks'), { recursive: true });
for (const r of reachable) {
  await copyFile(join(APP, 'assets', 'ranks', `${r.image}.webp`), join(ASSETS, 'ranks', `${r.image}.webp`));
}

await mkdir(join(ASSETS, 'screenshots'), { recursive: true });
const shots: Record<string, string> = {
  '1-home.png': 'home',
  '2-lesson.png': 'lesson',
  '3-quiz.png': 'quiz',
  '4-hangar.png': 'hangar',
  '5-daily.png': 'daily',
};
for (const [file, name] of Object.entries(shots)) {
  await sharp(join(APP, 'store', 'screenshots', 'raw', file))
    .resize({ width: 780 })
    .webp({ quality: 86 })
    .toFile(join(ASSETS, 'screenshots', `${name}.webp`));
}

await mkdir(join(ASSETS, 'brand'), { recursive: true });
await copyFile(join(APP, 'assets', 'images', 'icon.png'), join(ASSETS, 'brand', 'icon.png'));

// The TTFs (SIL OFL 1.1) are only used by scripts/gen-og.ts to render titles into
// the Open Graph images; the pages themselves load the woff2 files in public/fonts.
await mkdir(join(ASSETS, 'fonts'), { recursive: true });
for (const f of ['BarlowCondensed-Bold.ttf', 'Barlow-SemiBold.ttf', 'IBMPlexMono-SemiBold.ttf', 'OFL-Barlow.txt', 'OFL-BarlowCondensed.txt', 'OFL-IBMPlexMono.txt']) {
  await copyFile(join(APP, 'assets', 'fonts', f), join(ASSETS, 'fonts', f));
}

console.log(`[sync] app ${commit.slice(0, 7)}${dirty ? ' (dirty)' : ''}: ${counts.lessons} lessons, ${counts.questions} questions, ${counts.aircraft} aircraft`);
console.log(`[sync] wrote src/data/app/*.json and src/assets/{aircraft,lessons,ranks,screenshots,brand}`);
