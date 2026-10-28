import type { APIRoute } from 'astro';
import { DOMAIN } from '@/config';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /daily\n\nSitemap: ${DOMAIN}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
