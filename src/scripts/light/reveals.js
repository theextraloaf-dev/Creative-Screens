/* The Missouri-style 2D scroll reveals: the hero photo tilting away into a postcard, giant lines rising in, the welcome
   flood with its trail of cards, the pinned services list with its counter and photo, the closing panel
   rising, and the chapter bar. Returns a cleanup for gsap.matchMedia (its context also reverts the tweens). */
import { listIndex } from '../../lib/jobs-gallery.ts';

const smooth = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
const pad = (n) => String(n).padStart(2, '0');

export function initReveals({ root, gsap, ScrollTrigger, pinned, loaderDone }) {
  const offs = [];

  // 1. hero: the title rises once the loader has lifted; then the scroll turns the photo into a postcard
  const heroLines = root.querySelectorAll('.lhero .lline > span');
  gsap.set(heroLines, { yPercent: 110 });
  loaderDone.then(() => gsap.to(heroLines, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09 }));
  const card = root.querySelector('[data-postcard]');
  const hero = root.querySelector('.lhero');
  if (pinned && card) {
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const e = smooth(self.progress / 0.8);
        card.style.transform = `translateY(${-6 * e}vh) scale(${1 - 0.24 * e}) rotate(${-3.2 * e}deg)`;
        card.style.borderRadius = `${22 * e}px`;
        card.style.borderWidth = `${Math.round(12 * e)}px`;
        card.style.setProperty('--lift', e.toFixed(3));
      },
    });
  }
  if (hero) ScrollTrigger.create({ trigger: hero, start: 'bottom 60%', onToggle: (s) => root.classList.toggle('past-hero', s.isActive || s.progress === 1), end: 'max' });

  // paragraphs, cards and rows marked data-rise fade up as they enter, a little staggered when they enter together
  root.querySelectorAll('[data-rise]').forEach((el) => {
    gsap.from(el, { y: 28, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // 2. giant lines rise in as they enter
  root.querySelectorAll('[data-line]').forEach((line) => {
    gsap.from(line.firstElementChild, { yPercent: 110, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: line, start: 'top 88%', once: true } });
  });

  // the welcome (Expedia's Missouri statement): the stage sticks in CSS while the ochre floods up behind the statement
  // (done by the time the first card arrives, so the cards rise on ochre) and carries on into the services section.
  // The cards are placed down the tall section, so they pass at the page's own pace; each one's depth shifts it a
  // little faster or slower than the page. The dallah turns as it drifts across in front.
  const welcome = root.querySelector('[data-flood-section]');
  if (welcome) {
    const flood = welcome.querySelector('[data-flood]');
    ScrollTrigger.create({
      trigger: welcome, refreshPriority: 50, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => { flood.style.transform = `translateY(${(100 - 100 * smooth((self.progress - 0.02) / 0.3)).toFixed(2)}%)`; },
    });
    const drift = (el, from, to) => gsap.fromTo(el, from, { ...to, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    welcome.querySelectorAll('[data-wcard]').forEach((c) => {
      const k = Number(c.dataset.depth || 0);
      drift(c, { y: () => innerHeight * 0.12 * k }, { y: () => -innerHeight * 0.12 * k });
    });
    const cut = welcome.querySelector('[data-cutout]');
    if (cut) drift(cut, { y: () => innerHeight * 0.3, rotate: -14 }, { y: () => -innerHeight * 0.3, rotate: 10 });
  }

  // 3. services: the scroll moves the live row; desktop pins the list, phones light each row as it reaches the middle
  const list = root.querySelector('[data-services-list]');
  if (list) {
    const rows = [...list.querySelectorAll('[data-svc]')];
    const photos = [...list.querySelectorAll('[data-svc-photo]')];
    const count = list.querySelector('[data-svc-count]');
    const body = list.querySelector('[data-svc-body]');            // About: the live value's sentence beside the list
    let live = -1;
    const setLive = (i) => {
      if (i === live) return; live = i;
      rows.forEach((r, k) => r.classList.toggle('is-live', k === i));
      photos.forEach((p, k) => p.classList.toggle('is-live', k === i));
      count.textContent = pad(i + 1);
      if (body) body.textContent = rows[i].dataset.body || '';
    };
    setLive(0);
    if (pinned) {
      ScrollTrigger.create({
        trigger: list, pin: true, refreshPriority: 40, start: 'top top', end: () => `+=${innerHeight * 0.5 * rows.length}`, scrub: true, invalidateOnRefresh: true,
        onUpdate: (self) => setLive(listIndex(self.progress, rows.length)),
      });
    } else {
      rows.forEach((r, k) => ScrollTrigger.create({ trigger: r, start: 'top 60%', end: 'bottom 40%', onToggle: (s) => s.isActive && setLive(k) }));
    }
  }

  // Across Oman: the road draws from the workshop, each city lights as the line reaches it, the kilometres count up
  const route = root.querySelector('[data-route]');
  if (route) {
    const road = route.querySelector('[data-road]');
    const kmEl = route.querySelector('[data-km]');
    const total = Number(route.dataset.totalKm || 0);
    const cities = [...route.querySelectorAll('[data-city]')];
    const stops = [...route.querySelectorAll('[data-stop]')];
    const draw = (p) => {
      road.style.strokeDashoffset = String(1 - p);
      kmEl.textContent = Math.round(p * total).toLocaleString('en');
      cities.forEach((c, i) => { const on = p >= Number(c.dataset.at) - 0.002; c.classList.toggle('is-on', on); stops[i]?.classList.toggle('is-on', on); });
    };
    draw(0);
    const pinBox = route.querySelector('.lroute__pin');
    ScrollTrigger.create(pinned
      ? { trigger: pinBox, pin: true, refreshPriority: 30, start: 'top top', end: () => `+=${innerHeight * 1.6}`, scrub: true, invalidateOnRefresh: true, onUpdate: (st) => draw(smooth(st.progress / 0.92)) }
      : { trigger: pinBox, start: 'top 70%', end: 'bottom 60%', scrub: true, onUpdate: (st) => draw(st.progress) });
  }

  // the corniche under the eroded cream drifts slower than the page
  const closeBg = root.querySelector('[data-close-bg]');
  if (closeBg) {
    gsap.fromTo(closeBg, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: closeBg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // 5. the closing panel rises and grows into place
  const panel = root.querySelector('[data-panel]');
  if (panel) {
    gsap.fromTo(panel, { scale: 0.9, y: '12vh', borderRadius: 48 }, {
      scale: 1, y: 0, borderRadius: 28, ease: 'none',
      scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top 35%', scrub: true },
    });
  }

  // the chapter bar: page progress on the line, the section in view in ink
  const bar = root.querySelector('[data-chapters]');
  if (bar) {
    const links = [...bar.querySelectorAll('[data-chapter]')];
    const secs = links.map((a) => document.querySelector(a.getAttribute('href')));
    // the chapter is whichever section is under the middle of the screen (measured live: pins move everything below them)
    let on = -1;
    const mark = () => {
      const mid = innerHeight / 2;
      const i = secs.findIndex((sec) => { if (!sec) return false; const r = sec.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
      if (i !== -1 && i !== on) { on = i; links.forEach((l, k) => l.classList.toggle('is-on', k === i)); }
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.setProperty('--prog', s.progress.toFixed(4)); mark(); }, onRefresh: mark });
  }

  return () => { offs.forEach((f) => f()); if (card) { card.removeAttribute('style'); } };
}
