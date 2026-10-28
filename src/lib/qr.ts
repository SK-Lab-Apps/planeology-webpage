/** Build-time QR codes (no third-party request): returns an inline SVG string. */
import QRCode from 'qrcode';

const cache = new Map<string, string>();

export async function qrSvg(text: string, opts: { size?: number; color?: string } = {}): Promise<string> {
  const key = `${text}|${opts.size}|${opts.color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const svg = await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,
    color: { dark: opts.color ?? '#12233F', light: '#0000' },
  });
  // Make the SVG scale with its box and stay decorative for assistive tech.
  const sized = svg
    .replace(/<svg([^>]*)>/, `<svg$1 width="${opts.size ?? 112}" height="${opts.size ?? 112}" role="img" aria-hidden="true" focusable="false">`)
    .replace(/\s+/g, ' ');
  cache.set(key, sized);
  return sized;
}
