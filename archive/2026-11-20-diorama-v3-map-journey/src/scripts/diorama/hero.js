import cfg from '../../data/diorama.json';
import { visitOrder } from '../../lib/diorama-timeline.ts';

/* The opening and the chrome around the journey.
   - The film: muted, inline, the language's own version (1080p, or 720p on phones), loaded only now (never in the
     first paint), played once and left on its last frame (the poster is that same frame). Paused when off-screen.
   - The postcard tilt: across the first part of the map phase the film tilts back, turns a little and shrinks into a
     paper-bordered card, then lifts away, revealing the live map behind it.
   - The chapter bar: Oman · Muscat · the five stops (visit order) · Quote.
   - The closing collage: photo cards drift at different depths. */

export function initHero({ root, dir, tier, gsap, ScrollTrigger }) {
  const hero = root.querySelector('[data-hero]');
  const video = hero?.querySelector('video');
  const chapters = [...root.querySelectorAll('.dchapters [data-ch]')];
  const order = visitOrder(dir);
  const tiltEnd = cfg.phases.map[1] * 0.75;

  if (video) {
    // getAttribute, not dataset: data-src-1080 has no camelCase key (a dash before a digit is not converted)
    video.src = video.getAttribute(tier === 'high' && window.innerWidth >= 1024 ? 'data-src-1080' : 'data-src-720');
    video.addEventListener('canplay', () => hero.classList.add('is-playing'), { once: true });
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !video.ended) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.2 });
    io.observe(hero);
  }

  function update(state, p) {
    // tilt: 0 = full screen film, 1 = gone
    const t = Math.min(1, Math.max(0, p / tiltEnd));
    if (hero) {
      const e = t * t * (3 - 2 * t);
      root.style.setProperty('--tilt', e.toFixed(4));       // on the section: the film and the headline both read it
      hero.style.visibility = e >= 0.999 ? 'hidden' : 'visible';
      root.dataset.hero = e < 0.85 ? 'on' : 'off';          // map labels and pins wait until the film has lifted away
    }
    // chapter bar
    const key = state.phase === 'map' || state.phase === 'route' ? 'map' : state.phase === 'dive' ? 'dive' : state.phase === 'outro' ? 'outro'
      : state.chapter < 0 ? 'dive' : `stop-${order[state.chapter]}`;
    const seq = ['map', 'dive', ...order.map((n) => `stop-${n}`), 'outro'];
    const at = seq.indexOf(key);
    for (const li of chapters) {
      const i = seq.indexOf(li.dataset.ch);
      li.classList.toggle('is-on', i === at);
      li.classList.toggle('is-done', i < at);
      li.style.order = String(i);                       // visit order (Arabic: 05 first), without reordering the DOM
    }
  }

  // closing collage: deeper cards drift further
  const cards = [...document.querySelectorAll('.dcollage__card')];
  const closing = document.querySelector('.diorama__closing');
  if (cards.length && closing) {
    cards.forEach((card) => {
      const depth = Number(card.dataset.depth || 1);
      gsap.fromTo(card, { y: 60 * depth }, { y: -90 * depth, ease: 'none', scrollTrigger: { trigger: closing, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    ScrollTrigger.refresh();
  }

  return { update };
}
