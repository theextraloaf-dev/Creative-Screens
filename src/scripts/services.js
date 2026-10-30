/* Services background story. The workshop drawing is a sticky full-screen layer behind the service cards.
   1. While the section rises out of the hero, the building assembles: floor, walls, partitions.
   2. While it is pinned, each card (two services) builds its two bays one part at a time while the camera frames them.
   Main timeline units 0 to 100; card k (0 intro, 1-4 bay pairs, 5 outro) is centred on screen at k * 20. */
const at = (k) => k * 20;

export function initServices(gsap, ScrollTrigger) {
  const sec = document.querySelector('[data-svc]');
  const svg = sec?.querySelector('.svc__art');
  if (!sec || !svg) return;

  const bg = sec.querySelector('.svc__bg');
  const world = svg.querySelector('.svc-world');
  const hls = [...svg.querySelectorAll('.bay-hl')];
  const group = (g) => [...svg.querySelectorAll(`.pc[data-g="${g}"]`)];
  const hud = (k) => sec.querySelector(`[data-hud-${k}]`);
  const hx = hud('x'), hy = hud('y'), hb = hud('bay'), hp = hud('pct'), bar = hud('bar');
  const rtl = document.documentElement.dir === 'rtl';
  const [ox, oy] = sec.dataset.overview.split(',').map(Number);
  const anchors = sec.dataset.anchors.split(';').map((a) => a.split(',').map(Number));

  /* the view matches the screen's shape, 1200 units wide; framing depends on the layout */
  let W = 1200, H = 640, layout = {};
  const measure = () => {
    const r = bg.getBoundingClientRect();
    H = Math.round((1200 * r.height) / Math.max(r.width, 1));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const phone = r.width < 700;
    layout = phone
      ? { all: { fx: 0.5, fy: 0.36, s: 1.3 }, bay: { fx: 0.5, fy: 0.3, s: 2.5 } }
      : { all: { fx: rtl ? 0.4 : 0.6, fy: 0.55, s: Math.min(0.88, (H * 0.72) / 600) * 1.2 }, bay: { fx: rtl ? 0.36 : 0.64, fy: 0.56, s: Math.min(1.35, (H * 0.62) / 330) } };
  };
  measure();

  const cam = { x: ox, y: oy, s: 1, f: 0 }; // f blends overview framing (0) to bay framing (1)
  const place = () => {
    const a = layout.all, b = layout.bay;
    const fx = a.fx + (b.fx - a.fx) * cam.f;
    const fy = a.fy + (b.fy - a.fy) * cam.f;
    world.setAttribute('transform', `translate(${fx * W - cam.x * cam.s} ${fy * H - cam.y * cam.s}) scale(${cam.s})`);
  };
  const shotAll = () => ({ x: ox, y: oy, s: layout.all.s, f: 0 });
  const shotBay = (i) => ({ x: anchors[i][0], y: anchors[i][1], s: layout.bay.s, f: 1 });
  Object.assign(cam, shotAll());

  /* 1. building assembles as the section rises out of the hero */
  const rise = (els) => gsap.set(els, { opacity: 0, y: 30 });
  ['floor', 'wall', 'part'].forEach((g) => rise(group(g)));
  const build = gsap.timeline({ defaults: { ease: 'power2.out' } })
    .to(group('floor'), { opacity: 1, y: 0, duration: 0.3, stagger: 0.02 }, 0)
    .to(group('wall'), { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 }, 0.3)
    .to(group('part'), { opacity: 1, y: 0, duration: 0.25, stagger: 0.03 }, 0.55);
  ScrollTrigger.create({ trigger: sec, start: 'top 85%', end: 'top 5%', scrub: 0.5, animation: build });

  /* 2. pinned: each service builds its bay part by part while the camera frames it */
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  let prev = shotAll();
  anchors.forEach((_, j) => {
    const c = at(j + 1);
    const next = shotBay(j);
    tl.fromTo(cam, { ...prev }, { ...next, duration: 8, ease: 'power2.inOut', onUpdate: place, immediateRender: false }, c - 15);
    [j * 2, j * 2 + 1].forEach((i, n) => {
      const parts = group(String(i));
      gsap.set(parts, { opacity: 0, y: -40 });
      tl.to(parts, { opacity: 1, y: 0, duration: 1.4, stagger: 7 / Math.max(parts.length, 1), ease: 'back.out(1.6)' }, c - 14 + n * 7);
    });
    prev = next;
  });
  tl.fromTo(cam, { ...prev }, { ...shotAll(), duration: 10, ease: 'power2.inOut', onUpdate: place, immediateRender: false }, at(5) - 15);
  tl.set({}, {}, 100);

  const pad = (n, l) => String(Math.max(0, Math.round(n))).padStart(l, '0');
  const update = () => {
    const t = tl.time();
    const card = Math.round(t / 20) - 1; // card nearest the middle of the screen
    const on = card >= 0 && card < 4 ? card : -1;
    hls.forEach((h, i) => h.classList.toggle('is-on', on >= 0 && Math.floor(i / 2) === on));
    hx.textContent = pad(cam.x * 10, 4);
    hy.textContent = pad(cam.y * 10, 4);
    hb.textContent = on >= 0 ? `${pad(on * 2 + 1, 2)}–${pad(on * 2 + 2, 2)}` : '00';
    hp.textContent = pad(t, 3);
    bar.style.width = `${t}%`;
  };
  tl.eventCallback('onUpdate', update);
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.5, animation: tl });

  window.addEventListener('resize', () => { measure(); place(); }, { passive: true });
  place();
  update();
}
