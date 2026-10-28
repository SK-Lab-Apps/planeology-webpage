/**
 * app-data.ts — typed access to the app snapshot in src/data/app/ (written by
 * scripts/sync-from-app.ts). Nothing on the site types these facts by hand.
 */
import groupsJson from '@/data/app/groups.json';
import lessonsJson from '@/data/app/lessons.json';
import aircraftJson from '@/data/app/aircraft.json';
import questionsJson from '@/data/app/questions.json';
import ranksJson from '@/data/app/ranks.json';
import countsJson from '@/data/app/counts.json';
import metaJson from '@/data/app/meta.json';

export type Tier = 'common' | 'rare' | 'epic' | 'legendary';
export type SourceRef = { url: string; publisher: string; title: string };

export type AppGroup = {
  id: string; index: number; code: string; flight: string; title: string;
  description: string; accent: string; lessonIds: string[];
};
export type AppLesson = {
  id: string; index: number; title: string; subtitle: string; groupId: string; groupTitle: string;
  accent: string; cards: { id: string; title: string }[]; funFact: { text: string; source: SourceRef };
  sources: SourceRef[]; aircraftId: string;
};
export type AppAircraft = {
  id: string; bay: number; bayCode: string; name: string; description: string; tier: Tier; tierLabel: string;
  tierColor: string; role: string; power: string; awardedFor: string; lessonId: string | null;
  lessonTitle: string | null; groupId: string | null; sources: SourceRef[];
};
export type AppQuestion = {
  id: string; lessonId: string; groupId: string; question: string; options: string[];
  correctIndex: number; explanation: string;
};
export type AppRank = { index: number; title: string; subtitle: string; color: string; lessons: number; image: string };

export const groups = groupsJson as AppGroup[];
export const lessons = lessonsJson as AppLesson[];
export const aircraft = aircraftJson as AppAircraft[];
export const questions = questionsJson as AppQuestion[];
export const ranks = ranksJson as AppRank[];
export const counts = countsJson;
export const appMeta = metaJson;

const groupById = new Map(groups.map((g) => [g.id, g]));
const lessonById = new Map(lessons.map((l) => [l.id, l]));
const aircraftById = new Map(aircraft.map((a) => [a.id, a]));
const questionById = new Map(questions.map((q) => [q.id, q]));

export function getGroup(id: string): AppGroup {
  const g = groupById.get(id);
  if (!g) throw new Error(`Unknown lesson group: ${id}`);
  return g;
}
export function getLesson(id: string): AppLesson {
  const l = lessonById.get(id);
  if (!l) throw new Error(`Unknown lesson: ${id}`);
  return l;
}
export function getAircraft(id: string): AppAircraft {
  const a = aircraftById.get(id);
  if (!a) throw new Error(`Unknown aircraft: ${id}`);
  return a;
}
export function getQuestion(id: string): AppQuestion {
  const q = questionById.get(id);
  if (!q) throw new Error(`Unknown question: ${id}`);
  return q;
}
export const hasLesson = (id: string) => lessonById.has(id);
export const hasAircraft = (id: string) => aircraftById.has(id);
export const hasQuestion = (id: string) => questionById.has(id);

export const tierClass: Record<Tier, string> = {
  common: 'pill-standard',
  rare: 'pill-rare',
  epic: 'pill-iconic',
  legendary: 'pill-legendary',
};
