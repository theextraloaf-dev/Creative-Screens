/* The light preview's motion (loaded lazily by motion.js when [data-light] is on the page, so only when motion is
   allowed). Desktop (>= 768 px wide and >= 560 px tall): pinned hero postcard, pinned services list, pinned sideways jobs gallery.
   Phones: the same reveals without pinning, and a swipe row for the jobs. gsap.matchMedia builds and tears down
   each mode when the window crosses the breakpoint. */
import { liftDelay, placeAt, placeY } from '../../lib/jobs-gallery.ts';

function runLoader() {
  const screen = document.querySelector('[data-loadscreen]');
  if (!screen || getComputedStyle(screen).display === 'none') return Promise.resolve();
  const num = screen.querySelector('[data-load-count]');
  const t0 = performance.now();
  let loaded = document.readyState === 'complete', p = 0;
  window.addEventListener('load', () => { loaded = true; }, { once: true });
  return new Promise((resolve) => {
    const tick = () => {
      const e = performance.now() - t0;
      const target = loaded ? 1 : Math.min(0.9, e / 1200);
      p += (target - p) * 0.12;
      screen.style.setProperty('--p', p.toFixed(3));
      num.textContent = String(Math.round(p * 100));
      // the route has to draw (at least 1.1 s on screen), and the page never waits more than 2.2 s
      if ((loaded && p > 0.99 && liftDelay(e) === 0) || e > 2200) {
        screen.style.setProperty('--p', '1'); num.textContent = '100';
        screen.classList.add('is-done');
        try { localStorage.setItem('cs-light-loader', '1'); } catch { /* private mode: it shows again next time */ }
        setTimeout(resolve, 250);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* The hero film: 720p on small or data-saving screens, 1080p otherwise; it plays only while the hero is on screen. */
function playHeroFilm() {
  const v = document.querySelector('[data-hero-film]');
  if (!v) return;
  const small = innerWidth < 900 || navigator.connection?.saveData;
  v.src = v.getAttribute(small ? 'data-src-720' : 'data-src-1080');      // dataset keeps "src-1080" (digits are not camel-cased)
  v.addEventListener('playing', () => v.classList.add('is-playing'), { once: true });
  new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.05 }).observe(v);
}

/* Short muted loops (the workshop film, the clips in the service fans): nothing loads until one is near the screen,
   and each plays only while on screen. The workshop film picks its cut: the vertical one on portrait phones, the
   three-panel one otherwise (720p on smaller screens or with data saving). This file only runs when motion is
   allowed, so with reduced motion every clip stays on its still. */
function playClips() {
  const vids = [...document.querySelectorAll('video[data-autoplay]')];
  if (!vids.length) return;
  const portrait = matchMedia('(max-aspect-ratio: 4/5)').matches;
  const small = innerWidth < 1100 || navigator.connection?.saveData;
  const pick = (v) => {
    if (v.dataset.src) return v.dataset.src;
    if (portrait && v.dataset.srcTall) { if (v.dataset.posterTall) v.poster = v.dataset.posterTall; return v.dataset.srcTall; }
    return small ? v.dataset.srcMid : v.dataset.srcWide;
  };
  const seen = new Set();
  const io = new IntersectionObserver((entries) => entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) {
      seen.add(v);
      if (!v.getAttribute('src')) v.src = pick(v);
      v.play().catch(() => {});
    } else { seen.delete(v); if (!v.paused) v.pause(); }
  }), { rootMargin: '200px 0px', threshold: 0.01 });
  vids.forEach((v) => {
    if (portrait && v.dataset.posterTall) v.poster = v.dataset.posterTall;
    io.observe(v);
  });
  // browsers pause video on a hidden tab; carry on with the ones on screen when the visitor comes back
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) seen.forEach((v) => { if (v.paused) v.play().catch(() => {}); });
  });
}

export async function initLight({ gsap, ScrollTrigger }) {
  const root = document.querySelector('[data-light]');
  if (!root) return null;
  const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
  const lenis = window.__lenis;
  const [{ initReveals }, { initGallery }, { initGround }, dialogs] = await Promise.all([
    import('./reveals.js'), import('./gallery.js'), import('./ground.js'),
    window.__lightDialogs ?? import('./dialogs.js').then((m) => m.initDialogs()),
  ]);
  const { box, jobs } = dialogs;
  root.classList.add('is-ready');
  // the paper and its worn edges, painted in WebGL behind the page (falls back to the CSS grounds without WebGL)
  try { initGround({ root, gsap }); } catch (e) { console.warn('Ground unavailable', e); }

  const loaderDone = runLoader();
  playHeroFilm();
  playClips();
  const mm = gsap.matchMedia();
  // pinning needs room both ways: a phone on its side (wide but short) gets the phone layout
  mm.add({ pinned: '(min-width: 768px) and (min-height: 560px)', phone: '(max-width: 767px), (max-height: 559px)' }, (ctx) => {
    const pinned = !!ctx.conditions.pinned;
    root.classList.toggle('is-pinned', pinned);
    root.classList.toggle('is-phone', !pinned);
    const undo = [
      initReveals({ root, gsap, ScrollTrigger, dir, pinned, loaderDone }),
      initGallery({ root, gsap, ScrollTrigger, dir, lenis, pinned, jobs, box }),
    ];
    // refresh in page order: the gallery's pin is created after the triggers below it, and they must see its spacing
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => { undo.forEach((u) => u?.()); root.classList.remove('is-pinned', 'is-phone'); };
  });
  // every later re-measure (load, resize, fonts) keeps the pins in page order, so one pin's spacing is always counted
  // before the sections below it are measured
  const remeasure = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  window.addEventListener('load', remeasure, { once: true });
  document.fonts?.ready.then(remeasure);

  // a resize keeps the reader's place. While they scroll, note the section under the top of the screen (a pinned one
  // by its spacer, so its progress counts) and how far into it they are; after the re-measure that follows a resize
  // (section heights change, pins come and go as phone and desktop layouts swap) put them back at the same point.
  // A phone's address bar showing or hiding (height only, on a touch screen) is not a real resize: ignored.
  const sections = () => [...root.querySelectorAll(':scope > section, :scope > .pin-spacer > section, :scope > div[data-ground]'), document.querySelector('.ftr')].filter(Boolean);
  const boxes = (list) => list.map((s) => {
    const el = s.parentElement?.classList.contains('pin-spacer') ? s.parentElement : s;
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height };
  });
  let place = null, placeEls = [], holding = false, noteT = 0, holdT = 0, rt = 0;
  const note = () => { if (holding) return; placeEls = sections(); place = placeAt(scrollY, boxes(placeEls)); };
  const noteSoon = () => { clearTimeout(noteT); noteT = setTimeout(note, 150); };
  lenis ? lenis.on('scroll', noteSoon) : window.addEventListener('scroll', noteSoon, { passive: true });
  note();
  ScrollTrigger.addEventListener('refresh', () => {
    if (!holding || !place) return;
    const y = placeY(place, boxes(placeEls));
    if (y !== null && Math.abs(y - scrollY) > 2) { lenis?.resize(); lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }
    clearTimeout(holdT); holdT = setTimeout(() => { holding = false; note(); }, 400);   // after the last re-measure
  });
  let lastW = innerWidth, lastH = innerHeight;
  window.addEventListener('resize', () => {
    const barOnly = innerWidth === lastW && Math.abs(innerHeight - lastH) < 160 && matchMedia('(pointer: coarse)').matches;
    lastW = innerWidth; lastH = innerHeight;
    if (barOnly) return;
    holding = true; clearTimeout(noteT); clearTimeout(holdT);
    holdT = setTimeout(() => { holding = false; note(); }, 2500);                         // if no re-measure comes
    clearTimeout(rt); rt = setTimeout(remeasure, 200);
  });
  return { root, box };
}
