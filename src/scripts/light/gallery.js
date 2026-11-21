/* The finished-jobs gallery (after biegajaca-sztuka.pl): desktop pins the section, the column stays and the cards glide
   past it, each turned in perspective by its distance from the anchor beside the column; the counter, title and meta
   follow the card nearest the anchor. Phones: a native swipe row whose counter follows the card in the middle. */
import { activeCard, cardPose, galleryTravel, slideTarget, snapStep, stepTarget } from '../../lib/jobs-gallery.ts';
import { createGalleryScene } from './gallery-gl.js';

const pad = (n) => String(n).padStart(2, '0');
const inOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function initGallery({ root, gsap, ScrollTrigger, dir, lenis, pinned, jobs, box }) {
  const sec = root.querySelector('[data-gallery]');
  if (!sec) return () => {};
  const pin = sec.querySelector('.ljobs__pin');
  const col = sec.querySelector('.ljobs__col');
  const track = sec.querySelector('[data-track]');
  const cards = [...track.querySelectorAll('[data-card]')];
  const now = sec.querySelector('.ljobs__now');
  const count = sec.querySelector('[data-job-count]');
  const title = sec.querySelector('[data-job-title]');
  const meta = sec.querySelector('[data-job-meta]');
  const sample = sec.querySelector('[data-sample]');
  const prev = sec.querySelector('[data-prev]');
  const next = sec.querySelector('[data-next]');
  const n = cards.length;
  let active = -1;
  const ac = new AbortController();
  const on = (el, ev, fn, opt) => el?.addEventListener(ev, fn, { signal: ac.signal, ...opt });

  const show = (i) => {
    if (!Number.isFinite(i) || i === active) return;
    active = i;
    const j = jobs[i];
    count.textContent = pad(i + 1);
    if (sample) sample.hidden = !j?.sample;
    // aria-disabled, not disabled: the button keeps keyboard focus at either end
    prev?.setAttribute('aria-disabled', String(i === 0));
    next?.setAttribute('aria-disabled', String(i === n - 1));
    if (!title || !j) return;
    now.classList.add('is-swap');
    setTimeout(() => {
      title.textContent = j.title;
      meta.textContent = [j.client, j.place, j.service, j.year].join(' · ');
      now.classList.remove('is-swap');
    }, 180);
  };

  on(track, 'click', (e) => { const b = e.target.closest('[data-see]'); if (b) box.open(b.dataset.see); });
  on(sec.querySelector('[data-see-active]'), 'click', () => box.open(jobs[Math.max(0, active)].slug));

  if (!pinned) {
    // phones: a swipe row; the counter follows the card nearest the middle
    const update = () => {
      const mid = innerWidth / 2;
      show(activeCard(cards.map((c) => { const r = c.getBoundingClientRect(); return r.left + r.width / 2; }), mid));
    };
    on(track, 'scroll', update, { passive: true });
    update();
    return () => ac.abort();
  }

  const progressBar = sec.querySelector('[data-job-progress]');
  const goTo = (i, st) => {
    const y = st.start + (n > 1 ? (i / (n - 1)) * (st.end - st.start) : 0);
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: 'smooth' });
  };

  // desktop with WebGL2: the jobs as lit planes (gallery-gl.js, Biegajaca's works slider). The pin holds 0.6 screens
  // of scroll per job; the scroll sets where the row should be and the scene glides it there; when the scroll stops the
  // page eases to the nearest job. The light follows the pointer, a mouse can drag the row, and a click opens the job
  // at the frame (or brings another one to it). The DOM cards stay, hidden, for screen readers.
  sec.classList.add('has-gl');
  let scene = null;
  try {
    scene = createGalleryScene({ host: pin, frame: sec.querySelector('.ljobs__frame'), items: jobs.map((j) => ({ src: j.photos[0], look: j.look })), dir, gsap });
  } catch (e) { console.warn('Gallery WebGL unavailable', e); }
  if (scene) {
    const canvas = scene.canvas;
    const seeButtons = cards.map((c) => c.querySelector('[data-see]'));
    seeButtons.forEach((b) => b?.setAttribute('tabindex', '-1'));         // the column's arrows and button do the work
    const apply = (p, jump = false) => {
      scene.setTarget(slideTarget(p, scene.positions), jump);
      show(Math.round(p * (n - 1)));
      progressBar?.style.setProperty('--p', p.toFixed(4));
    };
    const st = ScrollTrigger.create({
      trigger: sec, pin, refreshPriority: 20, start: 'top top', end: () => `+=${innerHeight * (n - 1) * 0.6}`, invalidateOnRefresh: true,
      onRefresh: (self) => { scene.resize(); apply(self.progress, true); },
      onUpdate: (self) => apply(self.progress),
    });
    apply(st.progress, true);

    // the snap: once the scroll has come to rest inside the pin, ease to the nearest job
    let snapTimer = 0, dragging = false, moved = 0, lastX = 0;
    const snapNow = () => {
      const p = st.progress;
      if (dragging || p <= 0.0005 || p >= 0.9995) return;
      const y = st.start + snapStep(p, n) * (st.end - st.start), from = lenis ? lenis.targetScroll : scrollY;
      if (Math.abs(y - from) < 2) return;
      const duration = Math.min(0.6, Math.max(0.25, Math.abs(y - from) / 700));
      lenis ? lenis.scrollTo(y, { duration, easing: inOut }) : scrollTo({ top: y, behavior: 'smooth' });
    };
    const onScroll = () => {
      clearTimeout(snapTimer);
      if (lenis && Math.abs(lenis.velocity) > 4) return;
      snapTimer = setTimeout(snapNow, 120);
    };
    lenis ? lenis.on('scroll', onScroll) : on(window, 'scroll', onScroll, { passive: true });

    // the pointer: the light follows it; over the job at the frame the cursor offers to open it
    const local = (e) => { const r = pin.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
    on(pin, 'pointermove', (e) => {
      const [x, y, r] = local(e);
      scene.setPointer((x / r.width) * 2 - 1, -((y / r.height) * 2 - 1));
      if (dragging) {
        const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
        const k = (st.end - st.start) / (1.4 * innerWidth);
        const y2 = Math.min(st.end, Math.max(st.start, (lenis ? lenis.targetScroll : scrollY) - dx * k * dir));
        lenis ? lenis.scrollTo(y2, { immediate: true }) : scrollTo(0, y2);
      } else if (e.target === canvas) {
        canvas.style.cursor = scene.hit(x, y) === active ? 'pointer' : '';
      }
    });
    on(pin, 'pointerleave', () => scene.clearPointer());
    on(canvas, 'pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = 0; lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging');
    });
    const endDrag = () => { if (!dragging) return; dragging = false; canvas.classList.remove('is-dragging'); onScroll(); };
    on(canvas, 'pointerup', endDrag); on(canvas, 'pointercancel', endDrag);
    on(canvas, 'click', (e) => {
      if (moved > 6) { moved = 0; return; }                               // that was a drag
      const [x, y] = local(e), i = scene.hit(x, y);
      if (i < 0) return;
      if (i === active) box.open(jobs[i].slug); else goTo(i, st);
    });
    on(prev, 'click', () => { if (active > 0) goTo(stepTarget(active, -1, n), st); });
    on(next, 'click', () => { if (active < n - 1) goTo(stepTarget(active, 1, n), st); });
    scene.onLost(() => sec.classList.remove('has-gl'));                     // the DOM cards come back

    return () => {
      ac.abort(); clearTimeout(snapTimer); lenis?.off('scroll', onScroll); st.kill(true); scene.destroy();
      sec.classList.remove('has-gl'); seeButtons.forEach((b) => b?.removeAttribute('tabindex'));
      progressBar?.style.removeProperty('--p');
    };
  }
  sec.classList.remove('has-gl');

  // desktop without WebGL2: the column stays, the track moves; the first card starts at the anchor and the last one ends there.
  // As on Biegajaca, the scroll only sets where the cards should be; a damped follower glides them there each frame,
  // so the row never steps with the wheel. Card positions are measured once (no layout reads while moving).
  let travel = 0, anchor = 0, trackLeft = 0, st = null, mids = [];
  let target = 0, current = 0, resting = true;
  const viewport = sec.querySelector('.ljobs__viewport');
  const measure = () => {
    viewport.scrollLeft = 0; pin.scrollLeft = 0;
    track.style.transform = '';
    cards.forEach((c) => { c.style.transform = ''; });
    const viewW = innerWidth, colW = col.offsetWidth, cardW = cards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const room = viewW - colW;
    anchor = dir === 1 ? colW + room * 0.42 : viewW - colW - room * 0.42;
    const padStart = Math.max(0, room * 0.42 - cardW / 2);
    track.style.paddingInlineStart = `${padStart}px`;
    track.style.paddingInlineEnd = `${Math.max(0, room - padStart - cardW)}px`;
    travel = galleryTravel(track.scrollWidth, viewW, colW);
    trackLeft = track.getBoundingClientRect().left;            // untransformed; offsetLeft is physical in both directions
    mids = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
    if (n > 1 && travel < (n - 1) * (cardW + gap) - 2) travel = (n - 1) * (cardW + gap);
  };
  const render = (p) => {
    const progress = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
    const x = -dir * travel * progress;
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    const centers = mids.map((m) => trackLeft + x + m);
    cards.forEach((c, i) => {
      const { rotY, z, scale } = cardPose(centers[i] - anchor, innerWidth);
      c.style.transform = `translateZ(${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      // light and shade by the turn (like Biegajaca's lit panels): the side turning away darkens
      c.style.setProperty('--shadeL', Math.max(0, rotY / 18).toFixed(3));
      c.style.setProperty('--shadeR', Math.max(0, -rotY / 18).toFixed(3));
    });
    show(activeCard(centers, anchor));
    progressBar?.style.setProperty('--p', progress.toFixed(4));
  };
  const follow = (_time, dt) => {
    const gap = target - current;
    if (Math.abs(gap) < 0.00004) { if (!resting) { current = target; render(current); resting = true; } return; }
    resting = false;
    current += gap * (1 - Math.exp(-(dt / 1000) * 6.5));
    render(current);
  };
  measure();
  st = ScrollTrigger.create({
    trigger: sec, pin, refreshPriority: 20, start: 'top top', end: () => `+=${travel}`, invalidateOnRefresh: true,
    onRefreshInit: measure,
    onRefresh: (self) => { target = current = self.progress; render(current); },
    onUpdate: (self) => { target = self.progress; },
  });
  render(0);
  gsap.ticker.add(follow);

  // the arrows step in reading order, so in Arabic -> is still "next" (it points the way the cards come from)
  on(prev, 'click', () => { if (active > 0) goTo(stepTarget(active, -1, n), st); });
  on(next, 'click', () => { if (active < n - 1) goTo(stepTarget(active, 1, n), st); });
  // keyboard: focusing a card brings it to the anchor
  cards.forEach((c, i) => on(c.querySelector('[data-see]'), 'focus', (e) => {
    viewport.scrollLeft = 0;
    if (i !== active && e.target.matches(':focus-visible')) goTo(i, st);  // a mouse click opens the job instead
  }));

  return () => {
    ac.abort(); st?.kill(true); gsap.ticker.remove(follow);
    track.removeAttribute('style'); cards.forEach((c) => c.removeAttribute('style'));
  };
}
