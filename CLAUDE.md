# Planeology website — rules for every session

This repo is the marketing site for **Planeology: Learn Aviation** (iPhone), at https://planeology.app. The app itself lives at `../Planeology` and is **read-only** from here: never edit anything outside this repo.

## Stack

- Astro (static output), TypeScript strict, Tailwind CSS v4 (`@tailwindcss/vite`), `@astrojs/sitemap`, `@astrojs/mdx`, `astro:assets` + sharp.
- **No UI framework.** Interactive pieces are small vanilla-TS `<script>` blocks inside Astro components. Every page must read fully with JavaScript off.
- **bun** is the package manager and the runtime: every script runs Astro, `astro check` and ESLint with `bunx --bun`, because Astro 7 needs Node ≥ 22.23.4 and the owner's machine stays on Node 22.22. **Never change the system or global Node version** (no `nvm use`, `nvm alias`, or `.nvmrc`); run tools through Bun instead. The repo `.npmrc` pins the public npm registry, and `bun.lock` must never contain a private registry URL.
- **Zero third-party requests at runtime.** Fonts, the Apple badge and QR codes are self-hosted or generated at build. No Google Fonts, embeds, analytics, pixels or CDNs. The privacy policy promises this (section 10) and `check-dist` enforces it.
- One source of truth for domain, store URL, campaign tokens, publisher, email, governing law and legal dates: `src/config.ts`.
- Counts shown on the site (lessons, questions, aircraft) come from `src/data/app/counts.json`, written by `bun run sync`. Never type them by hand.
- URLs are lower-case with no trailing slash (`trailingSlash: 'never'`, `build.format: 'file'`, Vercel `cleanUrls`).

## Content rules (from the app's CONTENT_STYLE.md; they apply to every page)

- Reader: a curious adult who has flown as a passenger. US English. Warm, curious and precise, like a good museum guide. No hype, no emoji in text, at most one aviation pun per section and none inside guide bodies.
- **Hard scope: no flight training of any kind.** No checklists, procedures, piloting technique, exam or licence prep, "how to fly" steps, medical or physiology advice, legal or regulatory advice. Explaining *why* a wing stalls is fine; how to recover is not.
- **Banned words in content files** (guides, aircraft, glossary, quiz, home copy): checklist, procedure, certified, certification, "you should", "you must", flight training, flight school, student pilot, ground school, checkride, "how to fly", "step by step", exam, medical advice. Write around them ("approved", "cleared for service", "the standard way crews handle it"). Only the FAQ, Terms and Support pages may say "not flight training".
- Every number, date and record ("first", "fastest", "biggest") is sourced on its page. Reuse the app's verified facts and sources (`../Planeology/CONTENT_REVIEW.md`). Log every **site-only** fact with its source in this repo's `CONTENT_REVIEW.md`.
- Where good sources disagree, say so in the text. Date time-sensitive claims ("as of October 2026").
- Original words only: never copy or closely paraphrase a source sentence. The app's own text is ours to adapt.
- Accidents: factual and respectful, following the official report, focused on what changed afterwards, no graphic detail.
- Claims: no ratings, review counts, user counts, testimonials, "#1" or "best"; no `aggregateRating` in JSON-LD. No prices, no "free", no free-trial claims. Never say Android is coming. The only numbers about the app are counts of its own content.
- Never mention that content is app material: no "free sample", "preview", "free lesson" or "from the app". CTA voice sells the format ("Learn this in five-minute lessons, then prove it in a quiz."), never the paywall.
- Never show the hidden ranks "Hall of Famer" or "Sky Sage".
- Brand hygiene: nothing from the sibling apps this site's patterns came from (no strings, colours or assets). `scripts/check-brand.ts` lists the banned strings and colours and enforces it.
- Imagery: only the app's own drawn art, real screenshots and inline SVG diagrams in the same style. No airline liveries, logos, manufacturer logos, stock photos or AI images.

## SEO and technical rules

- Per page: unique `<title>` ≤ 60 characters, meta description 120–155 characters, canonical, robots, OG + Twitter tags, `og:image`, `lang="en-US"`, exactly one `<h1>`, visible breadcrumbs + `BreadcrumbList`.
- JSON-LD: Home = `WebSite` + `Organization` + `MobileApplication` (iOS, EducationalApplication, installUrl, no offers/ratings); guides and aircraft = `Article` with real dates; glossary = `DefinedTermSet`; home FAQ and support = `FAQPage`.
- Internal linking: each guide links ≥ 3 guides and ≥ 2 aircraft pages; every aircraft page links a guide; hubs link everything.
- Performance: mobile Lighthouse ≥ 95 in all categories on `/`, a guide and an aircraft page; LCP image preloaded; below-the-fold lazy; no layout shift; article pages < ~30 KB JS.
- Accessibility: WCAG AA, skip link, visible focus rings, keyboard-operable quiz and converter, descriptive alt text, reduced-motion path.
- `/privacy` must answer 200 with no redirect (the app ships that URL). `/.well-known/apple-app-site-association` is served with `Content-Type: application/json`.

## Checks to run before finishing any change

```sh
bun run typecheck      # astro check
bun run lint           # eslint
bun run check-content  # word ranges, sources, titles, alt text, banned words, links, hidden ranks
bun run check-brand    # banned strings, colours and placeholders
bun run build          # gen:og + astro build + check-dist
```

`bun run sync` re-snapshots the app's content and art (commit its outputs). `bun run check-overflow` (375 and 768 px), `bun run screenshots` and `bun run lighthouse` need local Chrome; run them after layout changes.

Layout rules learned the hard way: use rem (not ch) for widths that wrap text, give grid tracks `minmax(0, 1fr)` when they hold images or tables, keep tables inside `.table-wrap`, and give anything above the fold a size that doesn't depend on its children.

## Adding content

- **Guide:** add `src/content/guides/<slug>.mdx` with the frontmatter in `src/content.config.ts`; 1,200–2,000 words; a 40–60-word `answer`; 2–4 `<Figure>`s; one `<DidYouKnow>`; one `<AppCard />` about 40% down; H2s phrased as real questions; `quiz` = 3 app question ids; `sources` numbered. Log site-only facts in `CONTENT_REVIEW.md`.
- **Aircraft:** edit `src/content/aircraft/<id>.json`. Only sourced quick-fact rows; `source` is a 1-based index into `sources`.
- **Glossary:** `src/content/glossary.json`.
