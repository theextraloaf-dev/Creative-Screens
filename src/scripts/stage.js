import { dir } from './motion-tokens.js';

/* Vehicle branding story (2D blueprint): one scrubbed timeline on a CSS-sticky stage, one camera, one job.
   Time units are 0 to 100 so beats map directly to scroll share:
   Brief 0-16, Design 16-30, Print 30-46, Cut 46-60, Apply 60-80, Deliver 80-100.
   A beat starts every 2-4 units (roughly every 120px of scroll on a desktop). */
const CHAPTERS = [0, 16, 30, 46, 60, 80];

function init2D(gsap, ScrollTrigger) {
  const stage = document.querySelector('[data-stage]');
  const svg = stage?.querySelector('svg');
  if (!stage || !svg) return;

  const d = dir();
  const rtl = d === -1;
  const q = (s) => svg.querySelector(s);
  const qa = (s) => [...svg.querySelectorAll(s)];
  const num = (k) => Number(svg.dataset[k]);

  const dx = num('dx');
  const dy = num('dy');
  const sqStart = num('sqStart');
  const sqEnd = num('sqEnd');
  const benchX = num('benchX');
  const truckX = num('truckX');
  const proof = stage.querySelector('[data-proof]');
  const art = stage.querySelector('.stage__art');
  const caps = [...stage.querySelectorAll('.cap2')];
  const rail = [...stage.querySelectorAll('.stage__rail--6 li')];

  const world = q('.world');
  const drive = q('.truck-drive');
  const decal = q('.decal');
  const carriage = q('.carriage');
  const cutline = q('.cutline');
  const knife = q('.knife');
  const arm = q('.arm');
  const inkRect = q('.ink-rect');
  const decalOrigin = '280 287.5'; // decal centre, bench space
  const left = 110;
  const right = 450; // decal contour edges, bench space
  const [from, to] = rtl ? [right, left] : [left, right];

  /* camera: a point to look at and a zoom; the world is moved so that point sits in the middle of the frame */
  const cam = { x: 600, y: 300, s: 1 };
  const shots = {
    wide: { x: 600, y: 300, s: 1 },
    truck: { x: truckX + 300, y: 372, s: 1.45 },
    bench: { x: benchX + 280, y: 290, s: 1.55 },
    sheet: { x: truckX + 340, y: 500, s: 0.93 },
  };
  const placeCam = () => world.setAttribute('transform', `translate(${600 - cam.x * cam.s} ${280 - cam.y * cam.s}) scale(${cam.s})`);

  /* blade follows the contour; the carriage tracks it along the rail */
  const cutLen = cutline.getTotalLength();
  const blade = { t: 0 };
  const placeBlade = () => {
    const pt = cutline.getPointAtLength(blade.t * cutLen);
    knife.setAttribute('cx', pt.x);
    knife.setAttribute('cy', pt.y);
    gsap.set(carriage, { x: pt.x });
    arm.setAttribute('x1', pt.x); arm.setAttribute('y1', 162);
    arm.setAttribute('x2', pt.x); arm.setAttribute('y2', pt.y);
    cutline.style.strokeDashoffset = String(1 - blade.t);
  };

  /* wrap panels sweep on in reading direction */
  const panelClips = qa('.panel-clip');
  panelClips.forEach((r) => gsap.set(r, { attr: rtl ? { x: Number(r.dataset.b), width: 0 } : { width: 0 } }));

  /* ---- start state ---- */
  placeCam();
  gsap.set(drive, { x: -1400 }); // parked off-frame until it drives in
  gsap.set(q('.machine'), { y: -40 });
  gsap.set(carriage, { x: from });
  gsap.set(qa('.chip'), { y: 8 });
  gsap.set(inkRect, { attr: { x: rtl ? right + 4 : left - 4, width: 0 } });
  gsap.set(q('.tape'), { scaleY: 0, svgOrigin: '280 212' });
  gsap.set(q('.stamp'), { scale: 1.6, svgOrigin: '540 270' });
  gsap.set(proof, { opacity: 0, y: 14 });

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  // explicit start values so scrubbing from any point (or landing mid-page) renders the same frame
  const shot = (a, b, at, dur) => tl.fromTo(cam, { ...shots[a] }, { ...shots[b], duration: dur, ease: 'power2.inOut', onUpdate: placeCam, immediateRender: false }, at);
  const spin = (from, to, at, dur) => qa('.spoke').forEach((sp) => tl.fromTo(sp, { rotation: from, svgOrigin: `${sp.dataset.wx} 428` }, { rotation: to, svgOrigin: `${sp.dataset.wx} 428`, duration: dur, ease: 'power2.inOut', immediateRender: false }, at));

  /* 1 Brief: the enquiry arrives on WhatsApp, the truck drives in, it is measured */
  tl.to(q('.phone'), { opacity: 1, duration: 1.5 }, 0)
    .to(qa('.msg'), { opacity: 1, duration: 1, stagger: 1.2 }, 0.8)
    .to(q('.phone'), { opacity: 0, y: -20, duration: 2 }, 6)
    .to(drive, { x: 0, duration: 6, ease: 'power2.out' }, 6);
  spin(-792, 0, 6, 6);
  shot('wide', 'truck', 11, 4);
  tl.to(q('.vdims'), { opacity: 1, duration: 2 }, 12.5)
    .to(q('.vdims'), { opacity: 0, duration: 1.5 }, 16.5);

  /* 2 Design: a proof drawn on the truck's own outline, approved, then the logo is traced on the sheet */
  tl.to(q('.proof'), { opacity: 1, duration: 3 }, 17)
    .to(q('.stamp'), { opacity: 1, scale: 1, duration: 1.5, ease: 'back.out(2.5)' }, 23)
    .to([q('.proof'), q('.stamp')], { opacity: 0, duration: 2 }, 27);
  shot('truck', 'bench', 26, 4);
  tl.to(q('.sheet'), { opacity: 1, duration: 2 }, 27)
    .to(q('.trace'), { opacity: 1, duration: 1 }, 28)
    .to(qa('.trace-line'), { strokeDashoffset: 0, duration: 4, ease: 'power1.inOut' }, 28);

  /* 3 Print: machine arrives, colours checked, the head sweeps once, registration marks print */
  tl.to(q('.machine'), { opacity: 1, y: 0, duration: 3, ease: 'power2.out' }, 32)
    .to(qa('.chip'), { opacity: 1, y: 0, duration: 1.5, stagger: 1, ease: 'back.out(2)' }, 35)
    .to(qa('.tick'), { strokeDashoffset: 0, duration: 1, stagger: 1, ease: 'power1.out' }, 36)
    .to(q('.printline'), { opacity: 0.85, duration: 0.5 }, 38)
    .to(carriage, { x: to, duration: 6, ease: 'power1.inOut' }, 38.3)
    .to(inkRect, { attr: rtl ? { x: left - 4, width: right - left + 8 } : { width: right - left + 8 }, duration: 6, ease: 'power1.inOut' }, 38.3)
    .to(q('.printline'), { opacity: 0, duration: 0.5 }, 44.3)
    .to(q('.trace'), { opacity: 0, duration: 1 }, 44)
    .to(q('.chips'), { opacity: 0, duration: 1 }, 45)
    .set(q('.waste'), { opacity: 1 }, 44);
  qa('.reg').forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.6 }, 44 + i * 0.8));

  /* 4 Cut and weed: blade traces the contour, machine lifts, waste peels, transfer tape goes on */
  tl.to([knife, arm], { opacity: 1, duration: 0.5 }, 47)
    .to(blade, { t: 1, duration: 7, ease: 'power1.inOut', onUpdate: placeBlade }, 47)
    .to([knife, arm], { opacity: 0, duration: 0.5 }, 54)
    .to(q('.machine'), { opacity: 0, y: -40, duration: 2, ease: 'power2.in' }, 54)
    .to(qa('.reg'), { opacity: 0, duration: 1 }, 54.5)
    .to(q('.waste'), { x: 40 * d, y: -60, rotation: 6 * d, opacity: 0, svgOrigin: `${rtl ? 480 : 80} 170`, duration: 3, ease: 'power2.in' }, 54.5)
    .to(cutline, { opacity: 0, duration: 1.5 }, 56)
    .to(q('.tape'), { opacity: 1, scaleY: 1, duration: 3, ease: 'power2.out' }, 57.5);

  /* 5 Apply: back to the truck, the wrap goes on panel by panel, then the logo decal on the front door */
  shot('bench', 'truck', 60, 4);
  tl.to(q('.sheet'), { opacity: 0.3, duration: 3 }, 61);
  panelClips.forEach((r, i) => {
    const order = rtl ? panelClips.length - 1 - i : i;
    tl.to(r, { attr: rtl ? { x: Number(r.dataset.a), width: Number(r.dataset.b) - Number(r.dataset.a) } : { width: Number(r.dataset.b) - Number(r.dataset.a) }, duration: 2, ease: 'power1.inOut' }, 64 + order * 2);
  });
  tl.to(q('.doorzone'), { opacity: 1, duration: 1 }, 71)
    .to(decal, { x: dx, y: dy - 10, scale: 0.34, svgOrigin: decalOrigin, duration: 4, ease: 'power2.inOut' }, 72)
    .to(qa('.bubble'), { opacity: 1, duration: 0.6, stagger: 0.3 }, 75.5)
    .to(q('.squeegee'), { opacity: 1, duration: 0.5 }, 76)
    .fromTo(q('.squeegee'), { x: 0 }, { x: sqEnd - sqStart, duration: 3.5, ease: 'power1.inOut' }, 76.3)
    .to(decal, { y: dy, duration: 2.5, ease: 'power2.out' }, 76.3)
    .to(q('.doorzone'), { opacity: 0, duration: 1 }, 77)
    .to(q('.squeegee'), { opacity: 0, duration: 0.5 }, 79.8)
    .to(q('.tape'), { opacity: 0, y: -40, duration: 1.5, ease: 'power2.in' }, 79);
  qa('.bubble').forEach((bb) => {
    const frac = (Number(bb.getAttribute('cx')) - sqStart) / (sqEnd - sqStart);
    tl.to(bb, { opacity: 0, duration: 0.6 }, 76.3 + 3.5 * Math.min(Math.max(frac, 0), 1));
  });

  /* 6 Deliver: quality check, keys handed over, then the multi-view sheet: every panel, every view */
  tl.to(qa('.qc-badge'), { opacity: 1, duration: 1, stagger: 1.6, ease: 'back.out(2)' }, 81)
    .to(qa('.qc-badge'), { opacity: 0, duration: 1 }, 87)
    .fromTo(q('.key'), { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 1.5, ease: 'back.out(2)' }, 87.5)
    .to(q('.key'), { opacity: 0, duration: 1 }, 91.5);
  spin(0, 180, 88, 4);
  shot('truck', 'sheet', 91, 5);
  tl.to(q('.sheet'), { opacity: 0, duration: 2 }, 91)
    .to(q('.views'), { opacity: 1, duration: 3 }, 92.5)
    .to(proof, { opacity: 1, y: 0, duration: 4, ease: 'power2.out' }, 95);
  tl.set({}, {}, 100); // fix the total duration at 100

  /* pointer labels: each names the part on screen right now, pinned to that part */
  const notes = [...stage.querySelectorAll('[data-note]')].map((li) => ({
    li, a: Number(li.dataset.in), b: Number(li.dataset.out), el: svg.querySelector(li.dataset.anchor), at: li.dataset.at,
  }));
  const placeNotes = () => {
    const t = tl.time();
    const box = art.getBoundingClientRect();
    for (const n of notes) {
      const on = t >= n.a && t < n.b && !!n.el;
      n.li.classList.toggle('is-on', on);
      if (!on) continue;
      const bb = n.el.getBBox();
      const ay = n.at === 'below' ? bb.y + bb.height : n.at === 'center' ? bb.y + bb.height / 2 : bb.y;
      const pt = new DOMPoint(bb.x + bb.width / 2, ay).matrixTransform(n.el.getScreenCTM());
      const x = pt.x - box.left;
      const y = pt.y - box.top;
      n.li.style.transform = `translate(${x}px, ${y}px)`;
      n.li.classList.toggle('is-flip', x > box.width * 0.62);
      n.li.classList.toggle('is-below', n.at === 'below' || y < 70); // no room above: hang the label below the part
    }
    const step = CHAPTERS.filter((c) => t >= c).length - 1;
    caps.forEach((c, i) => c.classList.toggle('is-on', i === step));
    rail.forEach((li, i) => li.classList.toggle('is-done', i <= step));
  };
  tl.eventCallback('onUpdate', placeNotes);
  window.addEventListener('resize', placeNotes, { passive: true });

  ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    animation: tl,
  });
  placeNotes();
}


/* 3D first (exploded car in WebGL, via OGL). Falls back to the 2D stage above when WebGL2 is missing,
   the device asks to save data or is very low-memory, the model fails to load, or frames run slow.
   Add ?stage=2d to the URL to force the 2D version. */
function can3D() {
  if (location.search.includes('stage=2d')) return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return false;
  if (navigator.connection?.saveData) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
  return true;
}

export function initStage(gsap, ScrollTrigger) {
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;
  const fallback = () => init2D(gsap, ScrollTrigger);
  if (!can3D()) return fallback();

  let started = false;
  const start = async () => {
    if (started) return; started = true;
    let inst = null;
    try {
      const m = await import('./stage3d.js');
      inst = await m.initStage3D({
        stage, gsap, ScrollTrigger,
        onSlow: () => { inst?.destroy(); fallback(); },
      });
    } catch (e) {
      console.warn('3D stage unavailable, using the 2D stage.', e);
      fallback();
    }
  };
  // nothing is downloaded until the visitor is about to reach the section
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '1200px 0px' });
  io.observe(stage);
}
