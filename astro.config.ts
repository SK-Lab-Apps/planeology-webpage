import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DOMAIN = 'https://planeology.app';

// Pages that carry <meta name="robots" content="noindex"> stay out of the sitemap.
const NOINDEX = new Set([`${DOMAIN}/daily`, `${DOMAIN}/404`]);

// lastmod per page, read from the content files' frontmatter at config time so the
// sitemap integration can stamp real modification dates on guides and aircraft.
function readLastmod(): Map<string, string> {
  const map = new Map<string, string>();
  const guidesDir = join(process.cwd(), 'src/content/guides');
  for (const file of safeList(guidesDir)) {
    if (!file.endsWith('.mdx')) continue;
    const text = readFileSync(join(guidesDir, file), 'utf8');
    const m = text.match(/^dateModified:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
    if (m) map.set(`${DOMAIN}/learn/${file.replace(/\.mdx$/, '')}`, m[1]);
  }
  const aircraftDir = join(process.cwd(), 'src/content/aircraft');
  for (const file of safeList(aircraftDir)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(readFileSync(join(aircraftDir, file), 'utf8')) as { dateModified?: string };
    if (data.dateModified) map.set(`${DOMAIN}/aircraft/${file.replace(/\.json$/, '')}`, data.dateModified);
  }
  return map;
}
function safeList(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}
const lastmod = readLastmod();
const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
  site: DOMAIN,
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  // Keep whitespace between inline elements (Astro 7's 'jsx' default can glue words together).
  compressHTML: true,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !NOINDEX.has(page.replace(/\/$/, '')),
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        return { ...item, url, lastmod: lastmod.get(url) ?? buildDate };
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  image: {
    // Every drawn image ships as AVIF + WebP at a few widths; sharp is the default service.
    responsiveStyles: true,
  },
});
