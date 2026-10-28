/**
 * gen-icons.ts — favicons, touch icon, PWA icons and site.webmanifest from the
 * app icon in src/assets/brand/icon.png (copied by `bun run sync`).
 *
 *   bun run gen:icons        # outputs are committed in public/
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const REPO = resolve(import.meta.dir, '..');
const src = join(REPO, 'src', 'assets', 'brand', 'icon.png');
const pub = join(REPO, 'public');

const png = (size: number) => sharp(src).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 });

await png(180).toFile(join(pub, 'apple-touch-icon.png'));
await png(192).toFile(join(pub, 'icon-192.png'));
await png(512).toFile(join(pub, 'icon-512.png'));
await png(32).toFile(join(pub, 'favicon-32.png'));

// favicon.ico: a single 32×32 PNG-in-ICO (every current browser reads it).
const png32 = await png(32).toBuffer();
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt8(0, 8); // palette
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // planes
header.writeUInt16LE(32, 12); // bpp
header.writeUInt32LE(png32.length, 14); // size
header.writeUInt32LE(22, 18); // offset
await writeFile(join(pub, 'favicon.ico'), Buffer.concat([header, png32]));

// favicon.svg: the icon's mark, drawn in code (DESIGN.md §7), so it stays crisp at any size.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#12233F"/>
<path d="M10 50 C 22 44, 30 34, 44 22" stroke="#B0156E" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 5" fill="none"/>
<circle cx="10" cy="50" r="3.2" fill="#F6B800"/>
<path d="M52 12 L44 26 L48 33 L46 36 L40 30 L31 36 L28 33 L35 26 L24 18 L26 15 L38 20 L46 11 Z" fill="#fff"/>
</svg>
`;
await writeFile(join(pub, 'favicon.svg'), svg);

const manifest = {
  name: 'Planeology: Learn Aviation',
  short_name: 'Planeology',
  description: 'Learn aviation in short lessons: how flight works, aviation history, airliners, military aviation and airports.',
  start_url: '/',
  display: 'browser',
  background_color: '#F5F2EA',
  theme_color: '#12233F',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
};
await writeFile(join(pub, 'site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
console.log('[gen-icons] wrote favicon.ico, favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, site.webmanifest');
