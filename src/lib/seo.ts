/**
 * seo.ts — head metadata and JSON-LD builders. Every page passes a `Seo` to the
 * Base layout; the builders here keep the structured data consistent.
 */
import { DOMAIN, SITE_NAME, STORE_NAME, APP_STORE_URL, PUBLISHER, absoluteUrl } from '@/config';

export type Seo = {
  /** <title>, 60 characters or fewer. */
  title: string;
  /** Meta description, 120–155 characters. */
  description: string;
  /** Path such as "/learn/how-do-planes-fly" (no trailing slash). */
  path: string;
  noindex?: boolean;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  /** Preload the LCP image: absolute or root-relative URL. */
  preloadImage?: { href: string; imagesrcset?: string; imagesizes?: string };
};

export const ORG_ID = `${DOMAIN}/#organization`;
export const WEBSITE_ID = `${DOMAIN}/#website`;

export function organization() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: `${DOMAIN}/`,
    logo: { '@type': 'ImageObject', url: `${DOMAIN}/icon-512.png`, width: 512, height: 512 },
    founder: { '@type': 'Person', name: PUBLISHER },
  };
}

export function website(description: string) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: `${DOMAIN}/`,
    description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  };
}

export function mobileApplication(description: string) {
  return {
    '@type': 'MobileApplication',
    name: STORE_NAME,
    alternateName: SITE_NAME,
    operatingSystem: 'iOS',
    applicationCategory: 'EducationalApplication',
    description,
    url: `${DOMAIN}/`,
    installUrl: APP_STORE_URL,
    image: `${DOMAIN}/icon-512.png`,
    publisher: { '@id': ORG_ID },
    author: { '@id': ORG_ID },
  };
}

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function article(opts: {
  headline: string;
  description: string;
  path: string;
  image: string;
  datePublished: string;
  dateModified: string;
  wordCount?: number;
  keywords?: string[];
  section?: string;
}) {
  return {
    '@type': 'Article',
    '@id': `${absoluteUrl(opts.path)}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(opts.path) },
    headline: opts.headline,
    description: opts.description,
    image: [opts.image],
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
    ...(opts.keywords?.length ? { keywords: opts.keywords.join(', ') } : {}),
    ...(opts.section ? { articleSection: opts.section } : {}),
  };
}

export function faqPage(items: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: { '@type': 'Answer', text: it.answer },
    })),
  };
}

export function definedTermSet(opts: { name: string; path: string; terms: { id: string; term: string; definition: string }[] }) {
  return {
    '@type': 'DefinedTermSet',
    '@id': `${absoluteUrl(opts.path)}#terms`,
    name: opts.name,
    url: absoluteUrl(opts.path),
    hasDefinedTerm: opts.terms.map((t) => ({
      '@type': 'DefinedTerm',
      '@id': `${absoluteUrl(opts.path)}#${t.id}`,
      name: t.term,
      description: t.definition,
      inDefinedTermSet: `${absoluteUrl(opts.path)}#terms`,
    })),
  };
}

/** Wrap a list of nodes in one @graph document. */
export function graph(nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

/** Serialise JSON-LD so it can never close its own <script> tag. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
