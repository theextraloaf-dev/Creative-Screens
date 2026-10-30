import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { T, dir, isArabic } from './motion-tokens.js';
import { initCursor } from './cursor.js';

const root = document.documentElement;
const motionOn = root.classList.contains('motion');

/* Without motion (reduced-motion or no JS) the page is already in its final state. */
if (motionOn) {
  // while the "21 years" loader is up, hold the page's motion until it has lifted
  const wait = root.classList.contains('loader-on') ? new Promise((res) => window.addEventListener('cs:loader-done', res, { once: true })) : Promise.resolve();
  wait.then(init);
}

function init() {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- Smooth scroll ---------- */
  const lenis = new Lenis({ lerp: T.lenisLerp, anchors: true });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const done = (el) => {
    el.classList.add('is-in');
    gsap.set(el, { clearProps: 'all' });
  };
  const trigger = (el, extra = {}) => ({ trigger: el, start: T.start, once: true, ...extra });

  /* ---------- Reveal: data-reveal="up|fade|inline" data-delay data-offset ---------- */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const kind = el.dataset.reveal || 'up';
    const offset = Number(el.dataset.offset ?? T.reveal.y);
    const from = { opacity: 0 };
    if (kind === 'up' || kind === '') from.y = offset;
    if (kind === 'inline') from.x = offset * dir();
    gsap.fromTo(el, from, {
      opacity: 1, x: 0, y: 0,
      duration: T.reveal.duration,
      ease: T.reveal.ease,
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: trigger(el),
      onComplete: () => done(el),
    });
  });

  /* ---------- Clip image: data-clip, direction follows the document ---------- */
  document.querySelectorAll('[data-clip]').forEach((el) => {
    const from = dir() === 1 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)';
    const img = el.firstElementChild;
    gsap.fromTo(el, { clipPath: from }, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: T.clip.duration, ease: T.clip.ease,
      scrollTrigger: trigger(el),
      onComplete: () => done(el),
    });
    if (img) gsap.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.1, ease: 'power2.out', scrollTrigger: trigger(el) });
  });

  /* ---------- Blur-in: short English statements only; Arabic falls back to a plain fade ---------- */
  document.querySelectorAll('[data-blur-in]').forEach((el) => {
    const from = isArabic() ? { opacity: 0 } : { opacity: 0, filter: `blur(${T.blur.blur}px)` };
    gsap.fromTo(el, from, {
      opacity: 1, filter: 'blur(0px)',
      duration: T.blur.duration, ease: T.blur.ease,
      scrollTrigger: trigger(el),
      onComplete: () => done(el),
    });
  });

  /* ---------- Count-up: the final number is in the HTML, so it reads without JS ---------- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const state = { v: 0 };
    el.textContent = '0';
    gsap.to(state, {
      v: end, duration: T.count.duration, ease: T.count.ease,
      scrollTrigger: trigger(el, { start: 'top 92%' }),
      onUpdate: () => { el.textContent = String(Math.round(state.v)); },
      onComplete: () => { el.textContent = String(end); },
    });
  });

  /* ---------- Text lines: per-line rise (lines only, so Arabic letters never split) ---------- */
  const textEls = document.querySelectorAll('[data-text-reveal]');
  if (textEls.length) {
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      textEls.forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            el.style.visibility = 'visible';
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: T.text.duration,
              ease: T.text.ease,
              stagger: T.text.stagger,
              delay: Number(el.dataset.delay ?? 0),
              scrollTrigger: trigger(el),
            });
          },
        });
      });
      ScrollTrigger.refresh();
    });
  }

  /* ---------- Sticky stage (car sticker sequence): loaded only where it exists ---------- */
  if (document.querySelector('[data-stage]')) {
    import('./stage.js').then((m) => m.initStage(gsap, ScrollTrigger));
  }

  /* ---------- How a job runs: step captions over the 3D print works (lazy) ---------- */
  if (document.querySelector('[data-story] .chapter')) {
    import('./journey.js').then((m) => m.initJourney(gsap, ScrollTrigger));
  }

  /* ---------- The print works: one persistent 3D warehouse the page scroll flies through (lazy) ---------- */
  if (document.querySelector('[data-warehouse]')) {
    import('./warehouse.js').then((m) => m.initWarehouse({ gsap, ScrollTrigger })).catch((e) => console.warn('Warehouse unavailable', e));
  }

  initCursor();
  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.__motionReady = true;
}
