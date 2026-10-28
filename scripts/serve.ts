/**
 * serve.ts — a tiny static server for dist/ that behaves like Vercel with
 * cleanUrls: `/privacy` serves privacy.html, extensionless well-known files get
 * the right content type, unknown paths get 404.html with a 404 status.
 *
 *   bun scripts/serve.ts [port]
 */
import { existsSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

const DIST = resolve(import.meta.dir, '..', 'dist');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
function resolveFile(pathname: string): { file: string; status: number } {
  let p = decodeURIComponent(pathname);
  if (p.endsWith('/') && p !== '/') return { file: '', status: 308 };
  if (p === '/') p = '/index.html';
  const direct = join(DIST, p);
  if (existsSync(direct) && statSync(direct).isFile()) return { file: direct, status: 200 };
  if (existsSync(direct + '.html')) return { file: direct + '.html', status: 200 };
  if (existsSync(join(direct, 'index.html'))) return { file: join(direct, 'index.html'), status: 200 };
  return { file: join(DIST, '404.html'), status: 404 };
}
Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    const { file, status } = resolveFile(url.pathname);
    if (status === 308) return new Response(null, { status: 308, headers: { location: url.pathname.replace(/\/+$/, '') + url.search } });
    const ext = extname(file);
    const headers: Record<string, string> = { 'content-type': types[ext] ?? 'application/octet-stream' };
    if (url.pathname === '/.well-known/apple-app-site-association') headers['content-type'] = 'application/json';
    if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/fonts/')) headers['cache-control'] = 'public, max-age=31536000, immutable';
    else if (/\.(png|svg|ico|webmanifest|xml|txt)$/.test(url.pathname)) headers['cache-control'] = 'public, max-age=86400';
    return new Response(Bun.file(file), { status, headers });
  },
});
console.log(`[serve] dist/ on http://localhost:${port}`);
