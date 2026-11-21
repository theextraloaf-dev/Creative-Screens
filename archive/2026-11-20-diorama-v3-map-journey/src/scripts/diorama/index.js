import { qualityTier, stateAt } from '../../lib/diorama-timeline.ts';

/* Diorama journey entry (loaded lazily by motion.js when [data-diorama] is on the page).
   Scroll progress through the section -> stateAt() -> the scene. Any failure (no WebGL2, a model or decoder that
   does not load) leaves the still image and the plain captions in place: data-failed, never a blank pinned section. */

function hasWebGL2() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export async function initDiorama({ gsap, ScrollTrigger }) {
  const root = document.querySelector('[data-diorama]');
  if (!root) return null;
  const host = root.querySelector('.diorama__art');
  const labelsRoot = root.querySelector('[data-labels]');
  const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
  const tier = qualityTier({ width: window.innerWidth, deviceMemory: navigator.deviceMemory, cores: navigator.hardwareConcurrency });

  // the first-visit loader: lifts when the map is ready (or fails), never before ~1.1 s (the route draws) nor after ~2.2 s
  const screen = document.querySelector('[data-loadscreen]');
  const shownAt = performance.now();
  let lifted = false;
  const lift = () => {
    if (lifted || !screen) return; lifted = true;
    const wait = Math.max(0, 1100 - (performance.now() - shownAt));
    setTimeout(() => {
      screen.classList.add('is-done');
      try { localStorage.setItem('cs-diorama-loader', '1'); } catch { /* private mode: it shows again next time */ }
    }, wait);
  };
  setTimeout(lift, 2200);

  let scene;
  try {
    if (!hasWebGL2()) throw new Error('WebGL2 is not available');
    const { createDiorama } = await import('./scene.js');
    scene = await createDiorama({
      host, labelsRoot, dir, tier,
      onProgress: (f) => root.style.setProperty('--load', f.toFixed(3)),
      // the GPU dropped the context (driver reset, too many tabs): back to the still with plain captions
      onLost: () => { root.removeAttribute('data-ready'); root.setAttribute('data-failed', ''); ScrollTrigger.refresh(); },
    });
  } catch (e) {
    console.warn('Diorama unavailable', e);
    lift();
    root.setAttribute('data-failed', '');
    ScrollTrigger.refresh();
    return null;
  }

  root.setAttribute('data-ready', '');
  root.dataset.tier = tier;
  lift();
  const listeners = new Set();
  let current = null;
  const update = (p) => {
    const state = stateAt(p, dir);
    if (root.dataset.phase !== state.phase) root.dataset.phase = state.phase;
    scene.apply(state, p);
    current = state;
    listeners.forEach((fn) => fn(state, p));
  };

  // hotspots, pins, postcards, drag-to-drive, prev/next, hints
  const { initInteract } = await import('./interact.js');
  const ui = initInteract({ root, scene, dir, lenis: window.__lenis });
  listeners.add(ui.update);
  const { initHero } = await import('./hero.js');
  const hero = initHero({ root, dir, tier, gsap, ScrollTrigger });
  listeners.add(hero.update);
  const { initSheets } = await import('./sheet.js');
  initSheets({ root, dir, lenis: window.__lenis });
  const { initMenu } = await import('./menu.js');
  initMenu({ lenis: window.__lenis });

  ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => update(self.progress),
    onRefresh: (self) => { scene.resize(); update(self.progress); },
  });
  window.addEventListener('resize', () => scene.resize());
  ScrollTrigger.refresh();     // the section just became tall (data-ready)
  if (!current) update(0);

  return { root, dir, gsap, onState: (fn) => { listeners.add(fn); if (current) fn(current); } };
}
