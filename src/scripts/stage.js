import { dir } from './motion-tokens.js';

/* Vehicle graphic sequence (2D blueprint): one scrubbed timeline on a CSS-sticky stage.
   One camera and one object: the camera starts close on the bench and pulls back to the truck while the
   same decal travels to the door. Time units are 0 to 100 so beats map directly to scroll share:
   Design 0-20, Print 20-45, Cut 45-70, Apply 70-100. A beat starts about every 6 units (~150px of scroll). */
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
  const proof = stage.querySelector('[data-proof]');
  const art = stage.querySelector('.stage__art');

  const world = q('.world');
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

  /* ---- start state ---- */
  gsap.set(world, { scale: 1.55, svgOrigin: `${benchX + 280} 290` });
  gsap.set(q('.sheet'), { opacity: 0, y: 16 });
  gsap.set(q('.machine'), { y: -40 });
  gsap.set(carriage, { x: from });
  gsap.set(qa('.chip'), { y: 8 });
  gsap.set(inkRect, { attr: { x: rtl ? right + 4 : left - 4, width: 0 } });
  gsap.set(q('.tape'), { scaleY: 0, svgOrigin: '280 212' });
  gsap.set(proof, { opacity: 0, y: 14 });

  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  /* 1 Design: sheet lands, logo traced to vector, sized, colours checked */
  tl.to(q('.sheet'), { opacity: 1, y: 0, duration: 4, ease: 'power2.out' }, 0)
    .to(qa('.trace-line'), { strokeDashoffset: 0, duration: 9, ease: 'power1.inOut' }, 2)
    .to(q('.dims'), { opacity: 1, duration: 3 }, 9)
    .to(qa('.chip'), { opacity: 1, y: 0, duration: 2.5, stagger: 2.2, ease: 'back.out(2)' }, 13)
    .to(qa('.tick'), { strokeDashoffset: 0, duration: 2, stagger: 2.2, ease: 'power1.out' }, 14.5);

  /* 2 Print: machine arrives, the head sweeps once, registration marks print */
  tl.to(q('.machine'), { opacity: 1, y: 0, duration: 5, ease: 'power2.out' }, 20)
    .to(q('.printline'), { opacity: 0.85, duration: 1 }, 25)
    .to(carriage, { x: to, duration: 16, ease: 'power1.inOut' }, 25.5)
    .to(inkRect, { attr: rtl ? { x: left - 4, width: right - left + 8 } : { width: right - left + 8 }, duration: 16, ease: 'power1.inOut' }, 25.5)
    .to(q('.printline'), { opacity: 0, duration: 1 }, 41.5)
    .to(q('.dims'), { opacity: 0, duration: 2 }, 41)
    .to(q('.trace'), { opacity: 0, duration: 2 }, 41);
  qa('.reg').forEach((r, i) => tl.to(r, { opacity: 1, duration: 1.2 }, 39 + i * 2));
  tl.to(q('.chips'), { opacity: 0, duration: 2 }, 44);

  /* 3 Cut and weed: blade traces the contour, machine lifts, waste peels, transfer tape goes on */
  tl.to([knife, arm], { opacity: 1, duration: 1 }, 46)
    .to(blade, { t: 1, duration: 12, ease: 'power1.inOut', onUpdate: placeBlade }, 46)
    .to([knife, arm], { opacity: 0, duration: 1 }, 58)
    .to(q('.machine'), { opacity: 0, y: -40, duration: 3, ease: 'power2.in' }, 58.5)
    .to(qa('.reg'), { opacity: 0, duration: 2 }, 59)
    .to(q('.waste'), { x: 40 * d, y: -60, rotation: 6 * d, opacity: 0, svgOrigin: `${rtl ? 480 : 80} 170`, duration: 7, ease: 'power2.in' }, 59)
    .to(cutline, { opacity: 0, duration: 3 }, 63)
    .to(q('.tape'), { opacity: 1, scaleY: 1, duration: 5, ease: 'power2.out' }, 65);

  /* 4 Apply: camera pulls back, door marked, decal glides on, squeegee, tape off, wheels turn */
  tl.to(world, { scale: 1, duration: 18, ease: 'power2.inOut' }, 62)
    .to(q('.sheet'), { opacity: 0.35, duration: 6 }, 72)
    .to([q('.doorzone'), q('.doordim')], { opacity: 1, duration: 3 }, 71)
    .to(decal, { x: dx, y: dy - 14, scale: 0.46, svgOrigin: decalOrigin, duration: 12, ease: 'power2.inOut' }, 74)
    .to(qa('.bubble'), { opacity: 1, duration: 2, stagger: 0.5 }, 84)
    .to(q('.squeegee'), { opacity: 1, duration: 1 }, 85.5)
    .fromTo(q('.squeegee'), { x: 0 }, { x: sqEnd - sqStart, duration: 10, ease: 'power1.inOut' }, 86)
    .to(decal, { y: dy, duration: 8, ease: 'power2.out' }, 86)
    .to([q('.doorzone'), q('.doordim')], { opacity: 0, duration: 3 }, 88)
    .to(q('.squeegee'), { opacity: 0, duration: 1.5 }, 96)
    .to(q('.tape'), { opacity: 0, y: -40, duration: 4, ease: 'power2.in' }, 92.5);

  /* bubbles vanish as the squeegee passes them */
  qa('.bubble').forEach((bb) => {
    const frac = (Number(bb.getAttribute('cx')) - sqStart) / (sqEnd - sqStart);
    tl.to(bb, { opacity: 0, duration: 1.5 }, 86 + 10 * Math.min(Math.max(frac, 0), 1));
  });

  /* delivered: wheels turn once as the proof and CTA arrive */
  qa('.spoke').forEach((sp) => tl.to(sp, { rotation: 360, svgOrigin: `${sp.dataset.wx} 424`, duration: 7, ease: 'power2.inOut' }, 93));
  tl.to(proof, { opacity: 1, y: 0, duration: 6, ease: 'power2.out' }, 94);
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
  };
  tl.eventCallback('onUpdate', placeNotes);
  window.addEventListener('resize', placeNotes, { passive: true });

  ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    animation: tl,
    onUpdate: (self) => {
      const p = self.progress;
      stage.dataset.step = p < 0.2 ? '0' : p < 0.45 ? '1' : p < 0.7 ? '2' : '3';
    },
  });
  stage.dataset.step = '0';
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
