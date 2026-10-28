import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const source = z.object({
  publisher: z.string().min(2),
  title: z.string().min(2),
  url: z.string().regex(/^https:\/\/\S+$/, 'https URL'),
});
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

/** Long-form guides at /learn/<slug>. The file name is the slug. */
const guides = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/guides' }),
  schema: z.object({
    /** The H1. */
    title: z.string().min(10),
    /** <title> text, 60 characters or fewer, without the site name (it is appended). */
    seoTitle: z.string().min(10).max(47),
    description: z.string().min(120).max(155),
    /** One-line dek under the H1. */
    dek: z.string().min(20).max(200),
    /** The 40–60-word direct answer under the H1 (featured-snippet target). */
    answer: z.string().min(150),
    /** The lesson group this guide belongs to (its accent and category label). */
    groupId: z.string(),
    /** The search query this page is written to answer (used as the og alt and keywords). */
    query: z.string(),
    keywords: z.array(z.string()).max(8).default([]),
    datePublished: isoDate,
    dateModified: isoDate,
    /** Lesson illustration id (e.g. "four-forces_c1") used for the hub card and og image. */
    lead: z.string(),
    leadAlt: z.string().min(20),
    /** App lesson ids this guide draws from. */
    lessons: z.array(z.string()).min(1),
    relatedGuides: z.array(z.string()).min(3).max(4),
    relatedAircraft: z.array(z.string()).min(2).max(3),
    /** Three app quiz question ids for "Check yourself". */
    quiz: z.array(z.string()).length(3),
    sources: z.array(source).min(2),
  }),
});

/** Aircraft pages at /aircraft/<id>. Names, tiers, roles and bays come from the app snapshot. */
const aircraft = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/aircraft' }),
  schema: z.object({
    id: z.string(),
    h1: z.string().min(10),
    /** Optional <title> override when "<Name> Facts & Specs" would exceed 60 characters. */
    seoTitle: z.string().max(47).optional(),
    description: z.string().min(120).max(155),
    era: z.enum(['pioneers', 'golden-age', 'wwii', 'jet-age', 'widebody-era', 'modern']),
    roleGroup: z.enum(['airliner', 'military', 'light-aircraft', 'research', 'rotor-evtol', 'transport-special']),
    /** Opening paragraphs: what it is. Inline markup allowed: [text](/path), *em*, **strong**. */
    intro: z.array(z.string().min(40)).min(1),
    whyItMatters: z.array(z.string().min(40)).min(1),
    /** 3–5 notable facts, one or two sentences each. */
    facts: z.array(z.string().min(30)).min(3).max(5),
    /** Only when a source says where a real one is displayed. */
    whereToSee: z.object({ text: z.string().min(30), source: z.number().int().min(1) }).nullable(),
    /** Only rows that can be sourced; `source` is a 1-based index into `sources`. */
    quickFacts: z
      .array(z.object({ label: z.string().min(2), value: z.string().min(1), source: z.number().int().min(1) }))
      .min(3),
    relatedGuides: z.array(z.string()).min(1).max(3),
    relatedAircraft: z.array(z.string()).length(3),
    sources: z.array(source).min(1),
    datePublished: isoDate,
    dateModified: isoDate,
  }),
});

/** Glossary terms, one JSON file. */
const glossary = defineCollection({
  loader: file('./src/content/glossary.json'),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    term: z.string().min(2),
    definition: z.string().min(40).max(520),
    /** Optional links: guide slugs and aircraft ids. */
    guides: z.array(z.string()).max(3).default([]),
    aircraft: z.array(z.string()).max(3).default([]),
    /** The app lesson the definition follows, if any. */
    lesson: z.string().optional(),
  }),
});

export const collections = { guides, aircraft, glossary };
