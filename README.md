# Planeology website

The marketing site for **Planeology: Learn Aviation**, an iPhone app for aviation enthusiasts, at https://www.planeology.app. Guides that rank for what curious people ask about planes, an aircraft Hangar, a glossary, the phonetic alphabet, a quiz, and the legal and support pages the app links to.

The app lives in `../Planeology` and is read-only from here. `CLAUDE.md` has the rules every change must follow; `CONTENT_REVIEW.md` is the fact log for site-only facts.

## Stack

| Concern | Choice |
|---|---|
| Framework | [Astro](https://astro.build) 7, static output, TypeScript strict |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), tokens in `src/styles/global.css` from the app's `DESIGN.md` |
| Content | Guides as MDX in `src/content/guides/`; aircraft pages as JSON in `src/content/aircraft/`; glossary in `src/content/glossary.json`; the app snapshot in `src/data/app/` |
| Images | `astro:assets` + sharp: AVIF/WebP at several widths, width and height always set |
| Interactivity | Small vanilla-TS `<script>` blocks; every page reads fully with JavaScript off |
| SEO | `@astrojs/sitemap`, per-page meta and JSON-LD in `src/lib/seo.ts`, OG images rendered with sharp |
| Hosting | Vercel (`vercel.json`); the output is plain static files, so any static host works |
| Package manager | bun, pinned to the public npm registry by `.npmrc` |

No UI framework, no third-party requests at runtime: fonts, the Apple badge and QR codes are self-hosted or generated at build.

**Runtime:** Astro 7 refuses to start on Node older than 22.23.4, so every script runs Astro, `astro check` and ESLint on Bun's own runtime (`bunx --bun …`). Bun is all you need; your system Node version doesn't matter and never has to change. Only `bun run lighthouse` uses Node, and any Node from 22.19 works.

## Commands

```sh
bun install
bun run dev              # dev server
bun run build            # gen:og → astro build → check-dist
bun run preview          # serve dist/ (or: bun scripts/serve.ts 4321, which mimics Vercel's clean URLs)

bun run typecheck        # astro check
bun run lint             # eslint
bun run check-content    # word ranges, sources, titles, alt text, banned words, links, hidden ranks
bun run check-brand      # banned strings, colours and placeholders
bun run check            # all four

bun run sync             # re-snapshot the app's content and art (commit the outputs)
bun run gen:og           # OG images into public/og/ (also run by build)
bun run gen:icons        # favicons and manifest from the app icon
bun run screenshots      # .screenshots/ at 375 and 1440 px (needs local Chrome)
bun run lighthouse       # mobile Lighthouse on /, a guide and an aircraft page (needs local Chrome)
bun run check-overflow   # every built page at 375 and 768 px must not scroll sideways (needs local Chrome)
```

## How it fits together

- **`src/config.ts`** is the single source of truth: domain, App Store id and link, the campaign-link builder (`storeLink(ct)`), publisher, contact email, governing law, legal dates, Apple team id and bundle id. Nothing else hardcodes these.
- **`scripts/sync-from-app.ts`** reads the app (`PLANEOLOGY_APP_DIR`, default `../Planeology`) and writes `src/data/app/*.json` (groups, lessons, aircraft, questions, ranks, counts, meta with the app's git commit) and copies the art into `src/assets/`. Every count on the site comes from `counts.json`.
- **Guides** (`src/content/guides/<slug>.mdx`) use `<Figure>`, `<DidYouKnow>` and `<AppCard>`; the page template at `src/pages/learn/[slug].astro` adds the direct answer, the boarding-pass CTA, "Check yourself" (three app questions), related pages and the numbered sources from frontmatter. The schema is in `src/content.config.ts`.
- **Aircraft pages** (`src/content/aircraft/<id>.json`) hold only the words and the sourced quick facts; name, tier, role, power, bay and the lesson that awards each aircraft come from the app snapshot.
- **Legal:** `/privacy` is ported faithfully from the app's drafted policy (`src/pages/privacy.astro`); `/terms` is data in `src/content/legal.ts`. No banners on either (App Review reads them).
- **Universal Links:** `public/.well-known/apple-app-site-association` is served as `application/json` by a header rule in `vercel.json`. `/daily` reads the shared-result parameters client-side, validates them and renders them as text only.
- **Checks** run in `bun run build` (`check-dist` over `dist/`) and `bun run check` (source). Both must pass before a change ships. The three Chrome-based checks (`check-overflow`, `lighthouse`, `screenshots`) run locally, not on Vercel.
- **Fonts and layout shift.** Each web font has a metric-matched local fallback (`size-adjust` fitted to real text), and layout widths use rem, not ch, so nothing moves when the fonts arrive. Phone frames reserve their size with a fixed width and aspect ratio.

### Adding a guide

1. Create `src/content/guides/<slug>.mdx` with the frontmatter fields in `src/content.config.ts` (`seoTitle` ≤ 47 characters, `description` 120–155, a 40–60-word `answer`, `lead` = a lesson card id, `quiz` = three app question ids, `sources`).
2. Write 1,200–2,000 words: H2s phrased as real questions, 2–4 `<Figure id="<cardId>" alt="…" caption="…" />`, one `<DidYouKnow source="…">`, one `<AppCard />` about 40% down, links to three guides and two aircraft pages.
3. Log every site-only fact in `CONTENT_REVIEW.md`. Run `bun run check-content guides/<slug>`.

### Updating an aircraft page

Edit `src/content/aircraft/<id>.json`. Only sourced quick-fact rows (`source` is a 1-based index into `sources`). Run `bun run check-content aircraft/<id>`.

### Re-syncing from the app

```sh
bun run sync && bun run gen:icons && bun run check
```

Review the diff in `src/data/app/` and `src/assets/`, then commit. If a lesson or aircraft id changed, the content checks will point at every page that references it.

## Deploy

1. **Vercel project.** Import the repo; framework preset Astro; build command `bun run build`; output `dist`; install command `bun install`. Vercel installs with Bun because of `bun.lock`, and the build runs Astro on Bun's runtime, so the project's Node version setting doesn't matter. `vercel.json` sets clean URLs, the AASA content type and long caching for hashed assets. It contains no host redirects: www/apex redirects belong to Vercel's domain settings only.
2. **Domains.** In Vercel: `www.planeology.app` serves Production, and `planeology.app` 308-redirects to `www.planeology.app`. www is canonical, and every canonical tag, Open Graph URL and sitemap entry uses it (`DOMAIN` in `src/config.ts`). Never add a www→apex redirect to `vercel.json`: combined with the domain setting it loops forever.
3. **DNS at Hostinger.** In the domain's DNS zone: an `A` record for `@` → `76.76.21.21`, and a `CNAME` for `www` → `cname.vercel-dns.com`. Vercel shows the exact values it wants on the domain page; use those if they differ. Remove any parking records on `@` and `www`. Propagation usually takes minutes, sometimes hours.
4. **Verify.**
   ```sh
   curl -I https://www.planeology.app/privacy                                 # 200, no Location header
   curl -I https://www.planeology.app/.well-known/apple-app-site-association  # 200, Content-Type: application/json, no redirect
   curl -I https://planeology.app/support                                     # 308 → https://www.planeology.app/support
   curl -s https://www.planeology.app/robots.txt
   ```
5. **Search Console and Bing Webmaster Tools.** Add `planeology.app` as a Domain property in Google Search Console and verify with the DNS `TXT` record it gives you (add it at Hostinger); submit `https://www.planeology.app/sitemap-index.xml`. Do the same in Bing Webmaster Tools (it can import the Search Console property), and submit the sitemap there too.
6. **App Store campaign links.** In App Store Connect open Analytics → Campaigns and create a campaign; the generated link contains your provider token (`pt=`). Put that token in `APP_STORE_PROVIDER_TOKEN` in `src/config.ts`. Every store link then carries `pt`, a placement `ct` (`home-hero`, `guide-<slug>`, `aircraft-<id>`, …) and `mt=8`.

## Pre-launch checklist

Search the repo for `TODO(you)` to find each item in context.

- [ ] ⬜ **Contact mailbox.** `CONTACT_EMAIL` in `src/config.ts` is `support@planeology.app`. Create the mailbox (or set up forwarding) and confirm someone reads it; it appears on `/privacy`, `/terms` and `/support`, and App Store Connect's support URL points at `/support`.
- [ ] ⬜ **Governing law.** `GOVERNING_LAW` in `src/config.ts` is `null`, so `/terms` uses a jurisdiction-neutral clause. Set the jurisdiction (for example `'the State of Delaware, United States'`).
- [ ] ⬜ **Legal review.** `/privacy` was ported from the app's drafted policy, checked against the app's code on 2026-10-28; `/terms` was written from the app's actual behaviour and the App Store rules. Neither is lawyer-reviewed. Have counsel review both, then bump `LEGAL_UPDATED`.
- [ ] ⬜ **App Store provider token** (`APP_STORE_PROVIDER_TOKEN`): see Deploy step 6. Until the app is approved, the plain link `https://apps.apple.com/app/id6826630278` goes nowhere useful; it goes live with the app.
- [ ] ⬜ **Deploy and DNS**: Deploy steps 1–4.
- [ ] ⬜ **Search Console and Bing**: Deploy step 5.
- [ ] ⬜ **Google Play.** `GOOGLE_PLAY_URL` stays `null` until a Play listing exists; the Play badge is hidden and the site never promises Android. When there is a Play app with a signing certificate, add `public/.well-known/assetlinks.json` with its SHA-256 fingerprint so Android App Links open `/daily` in the app, and set the URL in `src/config.ts`.
- [ ] ⬜ **App Store Connect fields.** Support URL `https://www.planeology.app/support`, privacy policy URL `https://www.planeology.app/privacy`, marketing URL `https://www.planeology.app`. The app's `constants/identity.json` still carries the placeholder domain; set `webDomain` to `planeology.app` there so the app's own privacy link and share links match.
- [ ] ⬜ **Time-sensitive facts.** Guides that say "as of October 2026" (supersonic projects, eVTOL status, the An-225, fighter programs) should be re-checked every few months; `CONTENT_REVIEW.md` lists each one with its source.
- [ ] ⬜ **Content follow-ups** (rows marked ⚠️ in `CONTENT_REVIEW.md`; each says what was done):
  - **ICAO pages blocked automated access.** The accident statistics on `/learn/how-safe-is-flying` and the alphabet history on `/phonetic-alphabet` were read through search-engine copies of icao.int pages. Open those two ICAO sources in a browser once and confirm the figures.
  - **Two app Hangar cards to review in the app repo** (the site was written around them, and the app was not modified): the Beechcraft Bonanza card says it "first flew in 1947", while 1947 is when it was introduced (the site says "introduced in 1947"); the Consolidated NY-2 card's "One radial engine" has no source row in the app's `CONTENT_REVIEW.md`.
  - **Museum display claims** change. The B-17G at the RAF Museum London is dated "as of October 2026" from the museum's own listing; re-check "where to see one" entries once a year.

## Notes and deliberate choices

- **No prices, no "free", no free-trial wording** anywhere on the site: prices are being finalized and shown in the app. The FAQ explains the Boarding Pass without quoting a price.
- **No ratings, testimonials or user counts**, and no `aggregateRating` in JSON-LD. The only numbers are counts of the app's own content.
- **iPhone only.** No Android claims.
- **No third-party requests.** Section 10 of the privacy policy promises it; `check-dist` fails the build if any script, style, font, image or iframe comes from another origin.
- **Hidden ranks** ("Hall of Famer" and "Sky Sage") never appear; `check-content` enforces it.
- The OG images in `public/og/` are generated at build and gitignored; the default `public/og.png` and the icons are committed.
