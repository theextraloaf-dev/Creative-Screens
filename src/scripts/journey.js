/* How a job runs: one caption per step over the 3D workshop, in the manner of a film title card.
   The scene (warehouse.js) does the storytelling; this only swaps the words. Scroll progress picks the step, and
   each swap is a short timeline: the old headline's lines rise out through a mask, the new one rises in, then the
   small print and the call to action settle in. Lines only (never letters), so Arabic is untouched. */
import { SplitText } from 'gsap/SplitText';

export function initJourney(gsap, ScrollTrigger) {
  const story = document.querySelector('[data-story]');
  const steps = story ? [...story.querySelectorAll('.chapter')] : [];
  if (!steps.length) return;
  const rail = [...story.querySelectorAll('[data-rail] li')];
  const n = steps.length;

  const parts = steps.map((el) => {
    const title = el.querySelector('.chapter__title');
    const split = SplitText.create(title, { type: 'lines', mask: 'lines', autoSplit: true });
    return { el, title, split, rest: [...el.querySelectorAll('.chapter__meta, .chapter__text, .chapter__cta')] };
  });

  let active = -1;
  let tl = null;

  const hide = (p) => gsap.set(p.el, { visibility: 'hidden' });
  // where each step begins in the scroll (matches the camera: brief, analysis, production incl. finishing, delivery)
  const STARTS = [0, 0.22, 0.5, 0.84];
  const indexAt = (progress) => STARTS.reduce((k, s, i) => (progress >= s ? i : k), 0);

  function show(next) {
    if (next === active) return;
    const prev = active;
    active = next;
    tl?.kill();
    // a swap killed half way (fast scrolling) would leave an old caption showing over the new one:
    // everything except the outgoing and incoming captions is hidden at once
    parts.forEach((p, i) => { if (i !== prev && i !== next) hide(p); });
    tl = gsap.timeline();

    if (prev >= 0) {
      const out = parts[prev];
      tl.to(out.split.lines, { yPercent: -110, duration: 0.45, ease: 'power3.in', stagger: 0.04 }, 0)
        .to(out.rest, { autoAlpha: 0, y: -10, duration: 0.3, ease: 'power2.in' }, 0)
        .add(() => hide(out), 0.5);
    }

    if (next >= 0) {
      const inn = parts[next];
      const at = prev >= 0 ? 0.42 : 0;
      tl.set(inn.el, { visibility: 'visible' }, at)
        .fromTo(inn.split.lines, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.09 }, at)
        .fromTo(inn.rest, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, at + 0.18);
    }

    rail.forEach((li, i) => li.classList.toggle('is-on', i === next));
    story.style.setProperty('--step', String(next));
  }

  parts.forEach(hide);

  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      story.style.setProperty('--p', self.progress.toFixed(4));
      show(indexAt(self.progress));
    },
    onToggle: (self) => { if (!self.isActive) { show(-1); } },
    onEnter: (self) => show(indexAt(self.progress)),
    onEnterBack: (self) => show(indexAt(self.progress)),
  });
}
