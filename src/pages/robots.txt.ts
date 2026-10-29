import type { APIRoute } from 'astro';

// /daily is not disallowed on purpose: crawlers must be able to fetch it to see its noindex tag.
import { DOMAIN } from '@/config';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
