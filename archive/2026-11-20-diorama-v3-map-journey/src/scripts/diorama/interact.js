import cfg from '../../data/diorama.json';
import { dragIntent, postcardFor, stopProgress, visitOrder } from '../../lib/diorama-timeline.ts';

/* The interaction layer over the 3D scene. Everything is a real HTML button positioned on a 3D anchor, so it works by
   touch, mouse and keyboard and is announced by screen readers.
   - Hotspots: the live stop's glowing spot (postcardFor). It closes its postcard when the van drives on.
   - Pins: the project pins over the Oman map.
   - Postcards: server-rendered dialogs ([data-postcard]); one opens at a time; Esc, the close button or a click on the
     scene closes it. "See the job" is a link to the story (the sheet takes over in sheet.js).
   - Drive by dragging: a mostly sideways drag scrubs the page scroll (scroll stays the single source of truth); a
     vertical swipe scrolls as usual (touch-action: pan-y); a tap is a tap.
   - Prev/next stop buttons, in visit order. Hint cards, once per browser. A gentle pointer parallax over the map. */

const HINTS_KEY = 'cs-diorama-hints';
const readHints = () => { try { return new Set((localStorage.getItem(HINTS_KEY) || '').split(',').filter(Boolean)); } catch { return new Set(); } };
const saveHint = (h) => { try { const s = readHints(); s.add(h); localStorage.setItem(HINTS_KEY, [...s].join(',')); } catch { /* storage blocked: hints show again */ } };

export function initInteract({ root, scene, dir, lenis }) {
  const pin = root.querySelector('.diorama__pin');
  const hotspots = [...root.querySelectorAll('button.dhot')].map((el) => ({ el, n: Number(el.dataset.stop), obj: scene.object(`hotspot_${el.dataset.stop}`) }));
  // v3: the pin buttons sit on the 3D tokens' heads (pin3d_*, ~14 km tall on the map)
  const pins = [...root.querySelectorAll('button.dpin')].map((el) => ({ el, slug: el.dataset.pin, obj: scene.object(`pin3d_${el.dataset.pin}`) || scene.object(`pin_${el.dataset.pin}`), up: 10 }));
  const cards = new Map([...root.querySelectorAll('[data-postcard]')].map((el) => [el.dataset.postcard, el]));
  const prevBtn = root.querySelector('.dstop-prev');
  const nextBtn = root.querySelector('.dstop-next');
  const hintEls = new Map([...root.querySelectorAll('[data-hint]')].map((el) => [el.dataset.hint, el]));
  const seen = readHints();
  const order = visitOrder(dir);
  let state = null, open = null, opener = null;

  const place = (el, obj, up = 0) => {
    const p = scene.toScreen(obj, up);
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    return p.visible;
  };

  // ---------------------------------------------------------------- postcards
  function openCard(key, from, anchor) {
    closeCard(false);
    const card = cards.get(key);
    if (!card) return;
    open = key; opener = from;
    card.hidden = false;
    root.dataset.cardOpen = key;                 // not data-postcard: closest('[data-postcard]') must only find cards
    scene.setFocusOn(anchor);
    requestAnimationFrame(() => card.querySelector('.dpostcard__close')?.focus());
  }
  function closeCard(restoreFocus = true) {
    if (!open) return;
    cards.get(open).hidden = true;
    delete root.dataset.cardOpen;
    open = null;
    if (restoreFocus && opener && !opener.hidden) opener.focus();
    opener = null;
  }
  for (const card of cards.values()) card.querySelector('.dpostcard__close')?.addEventListener('click', () => closeCard());
  document.addEventListener('keydown', (e) => {
    // Esc belongs to an open story sheet first (it steps back through history); the postcard under it stays
    if (e.key === 'Escape' && open && !document.documentElement.classList.contains('dsheet-open')) closeCard();
  });

  for (const h of hotspots) h.el.addEventListener('click', () => {
    openCard(`stop-${h.n}`, h.el, h.obj);
    dismissHint('tap');
  });
  for (const p of pins) p.el.addEventListener('click', () => openCard(`pin-${p.slug}`, p.el, p.obj));

  // ---------------------------------------------------------------- hints (one gesture at a time, once per browser)
  function showHint(h) {
    if (seen.has(h)) return;
    for (const [k, el] of hintEls) el.hidden = k !== h;
  }
  function dismissHint(h) {
    if (seen.has(h)) return;
    seen.add(h); saveHint(h);
    const el = hintEls.get(h); if (el) el.hidden = true;
  }
  for (const [k, el] of hintEls) el.addEventListener('click', () => dismissHint(k));

  // ---------------------------------------------------------------- prev / next stop
  const sectionY = (p) => {
    const top = root.getBoundingClientRect().top + window.scrollY;
    return top + p * (root.offsetHeight - window.innerHeight);
  };
  function goStop(delta) {
    if (!state) return;
    const k = Math.max(-1, state.chapter);
    const i = Math.min(order.length - 1, Math.max(0, k + delta));
    const n = order[i];
    closeCard(false);
    lenis?.scrollTo(sectionY(stopProgress(n, dir)), { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3) });
    dismissHint('drive');
  }
  prevBtn?.addEventListener('click', () => goStop(-1));
  nextBtn?.addEventListener('click', () => goStop(+1));

  // ---------------------------------------------------------------- drive by dragging
  let drag = null;
  pin.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button, a, [data-postcard]')) return;
    drag = { x: e.clientX, y: e.clientY, intent: 'none', start: lenis ? lenis.scroll : window.scrollY };
  });
  window.addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (drag.intent === 'none') drag.intent = dragIntent(dx, dy);
      if (drag.intent === 'drive') {
        e.preventDefault();
        const range = root.offsetHeight - window.innerHeight;
        const k = (0.15 * range) / Math.max(320, window.innerWidth);       // a screen-wide drag is about one stop
        lenis?.scrollTo(drag.start + dx * dir * k, { immediate: true });
        pin.classList.add('is-driving');
        dismissHint('drive');
        if (open) closeCard(false);
      }
      return;
    }
    if (state?.phase === 'map' && e.pointerType === 'mouse') {         // a gentle parallax over the map
      const r = pin.getBoundingClientRect();
      scene.setParallax(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    }
  }, { passive: false });
  const endDrag = () => { if (drag?.intent === 'drive') pin.classList.remove('is-driving'); drag = null; };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  pin.addEventListener('click', (e) => {                                 // a click on the scene closes the postcard
    if (open && !e.target.closest('[data-postcard], button.dhot, button.dpin')) closeCard();
  });

  // ---------------------------------------------------------------- every scroll/state change
  function update(next) {
    state = next;
    const live = postcardFor(next, dir);
    for (const h of hotspots) {
      const on = h.n === live && h.obj && place(h.el, h.obj);
      h.el.hidden = !on;
    }
    const onMap = next.phase === 'map' || next.phase === 'route';
    const order3 = (cfg.route?.stops ?? []).map((s) => s.slug);
    for (const p of pins) {
      const on = onMap && p.obj && place(p.el, p.obj, p.up);
      p.el.hidden = !on;
      p.el.classList.toggle('is-live', next.phase === 'route' && order3[next.city] === p.slug);
    }
    // a stop's postcard closes when the van leaves the stop; a pin's when the map goes
    if (open?.startsWith('stop-') && Number(open.slice(5)) !== live) closeCard(false);
    if (open?.startsWith('pin-') && !onMap) closeCard(false);
    // prev/next only on the street
    const onStreet = next.phase === 'street' || next.phase === 'outro';
    if (prevBtn) prevBtn.hidden = !onStreet || next.chapter <= 0;
    if (nextBtn) nextBtn.hidden = !onStreet || next.chapter >= order.length - 1;
    if (next.phase === 'street' && next.chapter < 0) showHint('drive');
    else if (live && seen.has('drive')) showHint('tap');
    else if (!onStreet) for (const el of hintEls.values()) el.hidden = true;
  }

  // wheel or keyboard scrolling also counts as having learnt to drive
  window.addEventListener('wheel', () => { if (state?.phase === 'street') dismissHint('drive'); }, { passive: true });

  return { update, closeCard };
}
