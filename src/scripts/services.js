/* Services workshop: the section pins and one camera walks the isometric floor bay by bay.
   Time units 0 to 100: overview 0-6, eight bays of 11 units each (6-94), overview again 94-100. */
const START = 6;
const SPAN = 11;

export function initServices(gsap, ScrollTrigger) {
  const sec = document.querySelector('[data-svc]');
  const svg = sec?.querySelector('.svc__art');
  if (!sec || !svg) return;

  const world = svg.querySelector('.svc-world');
  const frame = sec.querySelector('.svc__frame');
  const pins = [...svg.querySelectorAll('.bay-pin')];
  const hls = [...svg.querySelectorAll('.bay-hl')];
  const cards = [...sec.querySelectorAll('.svc-card')];
  const hud = (k) => sec.querySelector(`[data-hud-${k}]`);
  const hx = hud('x'), hy = hud('y'), hb = hud('bay'), hp = hud('pct'), bar = hud('bar'), cue = hud('scroll');
  const [ox, oy] = sec.dataset.overview.split(',').map(Number);
  const pinXY = pins.map((p) => p.getAttribute('transform').match(/translate\(([\d.]+) ([\d.]+)\)/).slice(1).map(Number));

  const zoom = () => (window.innerWidth < 700 ? 2.6 : 2.05);
  const overview = () => ({ x: ox, y: oy, s: window.innerWidth < 700 ? 1.3 : 1.3 });
  const bayShot = (i) => ({ x: pinXY[i][0], y: pinXY[i][1] + 20, s: zoom() });
  const cam = { ...overview() };
  const place = () => world.setAttribute('transform', `translate(${600 - cam.x * cam.s} ${320 - cam.y * cam.s}) scale(${cam.s})`);

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  let prev = overview();
  pins.forEach((_, i) => {
    const next = bayShot(i);
    tl.fromTo(cam, { ...prev }, { ...next, duration: 3.5, ease: 'power2.inOut', onUpdate: place, immediateRender: false }, START + i * SPAN);
    prev = next;
  });
  tl.fromTo(cam, { ...prev }, { ...overview(), duration: 4, ease: 'power2.inOut', onUpdate: place, immediateRender: false }, START + 8 * SPAN);
  tl.set({}, {}, 100);

  const pad = (n, l) => String(Math.max(0, Math.round(n))).padStart(l, '0');
  const update = () => {
    const t = tl.time();
    const bay = t >= START && t < START + 8 * SPAN ? Math.floor((t - START) / SPAN) : -1;
    const settled = bay >= 0 && t - (START + bay * SPAN) > 2.6;
    hls.forEach((h, i) => h.classList.toggle('is-on', i === bay));
    pins.forEach((p, i) => p.classList.toggle('is-on', i === bay && settled));
    cards.forEach((c, i) => c.classList.toggle('is-on', i === bay && settled));
    hx.textContent = pad(cam.x * 10, 4);
    hy.textContent = pad(cam.y * 10, 4);
    hb.textContent = pad(bay + 1, 2);
    hp.textContent = pad(t, 3);
    bar.style.width = `${t}%`;
    cue.style.opacity = t < 3 ? '1' : '0';

    // the card sits beside the pin; it flips to the other side near the right edge
    if (bay >= 0 && settled && window.innerWidth >= 700) {
      const box = frame.getBoundingClientRect();
      const pt = new DOMPoint(pinXY[bay][0], pinXY[bay][1]).matrixTransform(world.getScreenCTM());
      const x = pt.x - box.left;
      const y = pt.y - box.top;
      const card = cards[bay];
      const flip = x > box.width * 0.55;
      const cx = flip ? x - card.offsetWidth - 28 : x + 28;
      const cy = Math.min(Math.max(y - card.offsetHeight / 2, 36), box.height - card.offsetHeight - 36);
      card.style.transform = `translate(${cx}px, ${cy}px)`;
    }
  };
  tl.eventCallback('onUpdate', update);
  window.addEventListener('resize', update, { passive: true });

  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.5, animation: tl });
  place();
  update();
}
