/**
 * config.ts — the single source of truth for everything that names, links or
 * dates this site. Nothing else in the repo hardcodes a domain, a store URL,
 * an email address or a legal date; they all read from here.
 *
 * Items marked TODO(you) are listed in the README's pre-launch checklist.
 */

/** The production origin. The apex is canonical; www redirects to it (vercel.json). */
export const DOMAIN = 'https://planeology.app';

export const SITE_NAME = 'Planeology';
export const STORE_NAME = 'Planeology: Learn Aviation';
export const TAGLINE = 'Learn aviation, one short lesson at a time';

/** Who publishes the app and this site. */
export const PUBLISHER = 'Kshitiz Sachan';

/** TODO(you): confirm this mailbox exists and is read before launch. */
export const CONTACT_EMAIL = 'support@planeology.app';

/**
 * TODO(you): the jurisdiction whose laws govern the Terms, for example
 * 'the State of Delaware, United States' or 'England and Wales'. While it is
 * null the Terms use a jurisdiction-neutral clause (see src/content/legal.ts).
 */
export const GOVERNING_LAW: string | null = null;

/** The "Last updated" date shown on /privacy and /terms (ISO date). */
export const LEGAL_UPDATED = '2026-10-29';

/** Apple identity, used for Universal Links (public/.well-known) and the Smart App Banner. */
export const APPLE_TEAM_ID = 'Y2V3U7CSV9';
export const IOS_BUNDLE_ID = 'com.planeologylearnaviation.app';
export const APP_STORE_ID = '6826630278';

/** The plain App Store link. The app is being prepared for review; the link goes live with the app. */
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

/**
 * TODO(you): the App Store Connect provider token (Analytics → Campaigns →
 * your provider id). While null, every store link is the plain APP_STORE_URL.
 * Once set, links become campaign links carrying a `ct` per placement.
 */
export const APP_STORE_PROVIDER_TOKEN: string | null = null;

/**
 * TODO(you): the Google Play listing URL, once a Play app exists. While null the
 * Play badge is hidden everywhere and the site never promises Android.
 */
export const GOOGLE_PLAY_URL: string | null = null;

/** Campaign tokens (`ct`, max 40 chars) for App Store campaign links. */
export type Campaign =
  | 'home-hero'
  | 'home-final'
  | `guide-${string}`
  | `aircraft-${string}`
  | 'quiz'
  | 'phonetic'
  | 'glossary'
  | 'daily-share'
  | 'support';

/** Every store link on the site goes through this. */
export function storeLink(ct: Campaign): string {
  if (!APP_STORE_PROVIDER_TOKEN) return APP_STORE_URL;
  const campaign = ct.slice(0, 40);
  return `https://apps.apple.com/app/apple-store/id${APP_STORE_ID}?pt=${encodeURIComponent(
    APP_STORE_PROVIDER_TOKEN,
  )}&ct=${encodeURIComponent(campaign)}&mt=8`;
}

/** Apple's standard EULA, which licenses the iOS app (linked from /terms and the app). */
export const APPLE_STANDARD_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

/** Apple's own help pages, linked from /support and /terms. */
export const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://support.apple.com/en-us/118428';
export const APPLE_REFUND_URL = 'https://support.apple.com/en-us/118223';
export const APPLE_RESTORE_PURCHASES_URL = 'https://support.apple.com/en-us/118222';

/** Names the app uses for its own concepts. Keep them in step with the app's copy. */
export const NOUNS = {
  pass: 'Boarding Pass',
  daily: 'Daily Departure',
  collection: 'Hangar',
} as const;

/** Site routes, so links never hardcode a path. */
export const ROUTES = {
  home: '/',
  learn: '/learn',
  aircraft: '/aircraft',
  glossary: '/glossary',
  phonetic: '/phonetic-alphabet',
  quiz: '/aviation-quiz',
  daily: '/daily',
  support: '/support',
  privacy: '/privacy',
  terms: '/terms',
} as const;

export const guidePath = (slug: string) => `${ROUTES.learn}/${slug}`;
export const aircraftPath = (id: string) => `${ROUTES.aircraft}/${id}`;
export const absoluteUrl = (path: string) => `${DOMAIN}${path === '/' ? '/' : path}`;
