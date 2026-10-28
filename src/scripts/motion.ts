/**
 * motion.ts — the site's only motion runtime: an IntersectionObserver that adds
 * `.is-in` to `.rise` and `[data-flip]` elements once they scroll into view.
 * CSS does the rest. Under prefers-reduced-motion nothing animates.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const targets = document.querySelectorAll<HTMLElement>('.rise, [data-flip], [data-draw]');

if (reduced || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
  );
  targets.forEach((el) => io.observe(el));
}
