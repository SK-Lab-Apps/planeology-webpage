/** Small text helpers shared by pages and checks. */

export function wordCount(text: string): number {
  return text
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 230));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "October 29, 2026" from a Date or ISO date string (UTC date parts, so builds in any zone agree). */
export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function isoDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Escape text for HTML attributes and content. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * A tiny inline markup for strings kept in JSON: escapes HTML, then allows
 * [text](/path-or-https-url), *emphasis* and **strong**. Nothing else.
 */
export function inlineMarkup(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\[([^\]]+)\]\((\/[^\s)]*|https?:\/\/[^\s)]+)\)/g, (_m, text, href) => {
    const external = href.startsWith('http');
    return `<a href="${href}"${external ? ' rel="noopener"' : ''}>${text}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return out;
}
