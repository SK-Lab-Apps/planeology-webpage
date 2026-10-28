/**
 * images.ts — the app's drawn art, imported through astro:assets so every use
 * gets responsive AVIF/WebP variants with width and height set.
 */
import type { ImageMetadata } from 'astro';

const aircraftArt = import.meta.glob<{ default: ImageMetadata }>('/src/assets/aircraft/*.webp', { eager: true });
const lessonArt = import.meta.glob<{ default: ImageMetadata }>('/src/assets/lessons/*.webp', { eager: true });
const rankArt = import.meta.glob<{ default: ImageMetadata }>('/src/assets/ranks/*.webp', { eager: true });
const screenshotArt = import.meta.glob<{ default: ImageMetadata }>('/src/assets/screenshots/*.webp', { eager: true });

function pick(map: Record<string, { default: ImageMetadata }>, path: string, kind: string): ImageMetadata {
  const hit = map[path];
  if (!hit) throw new Error(`Missing ${kind} image: ${path}`);
  return hit.default;
}

export const aircraftImage = (id: string) => pick(aircraftArt, `/src/assets/aircraft/${id}.webp`, 'aircraft');
export const lessonImage = (cardId: string) => pick(lessonArt, `/src/assets/lessons/${cardId}.webp`, 'lesson');
export const rankImage = (file: string) => pick(rankArt, `/src/assets/ranks/${file}.webp`, 'rank');
export const screenshot = (name: 'home' | 'lesson' | 'quiz' | 'hangar' | 'daily') =>
  pick(screenshotArt, `/src/assets/screenshots/${name}.webp`, 'screenshot');
export const hasLessonImage = (cardId: string) => `/src/assets/lessons/${cardId}.webp` in lessonArt;
export const lessonImageIds = () => Object.keys(lessonArt).map((p) => p.replace('/src/assets/lessons/', '').replace('.webp', ''));
