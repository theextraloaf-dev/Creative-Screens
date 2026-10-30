/* Job tickets: the four process tickets as an A24-style carousel (carousel.js). The story block is pinned while the
   3D print works flies through behind it; scroll slides one ticket at a time into the middle, the hand-drawn ring
   loops around it and its rubber stamp thumps on once it has settled. */
import { settle, place, centred } from './carousel.js';

export function initTickets(gsap, ScrollTrigger) {
  const story = document.querySelector('[data-story]');
  const cards = story ? [...story.querySelectorAll('.chapter')] : [];
  if (!cards.length) return;
  const ring = story.querySelector('.story__ring');
  const rtl = document.documentElement.dir === 'rtl';
  const n = cards.length;
  let lastP = 0;
  const update = (p = lastP) => {
    lastP = p;
    const f = settle(p, n);
    place(cards, f, cards[0].offsetWidth * (window.innerWidth < 760 ? 0.86 : 0.9), rtl);
    const a = Math.round(f);
    const c = centred(f);
    cards.forEach((el, i) => el.classList.toggle('is-stamped', i === a && c > 0.92));
    ring.style.setProperty('--ring', (1 - Math.min(Math.max((c - 0.55) / 0.45, 0), 1)).toFixed(3));
  };
  const st = ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', onUpdate: (self) => update(self.progress) });
  window.addEventListener('resize', () => update(), { passive: true });
  update(st.progress);
}
