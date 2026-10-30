import { dir } from './motion-tokens.js';

/* Car sticker sequence: one scrubbed timeline on a CSS-sticky stage.
   Time units are 0 to 100 so beats map directly to scroll share:
   Design 0-20, Print 20-45, Cut 45-70, Apply 70-100. */
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
  const inkRect = q('.ink-rect');
  const proof = stage.querySelector('[data-proof]');
  const origin = '150 220';

  /* One camera, one object: the artwork never leaves frame. The camera starts close on the sheet and
     pulls back to the car while the same shape glides across. */
  const world = q('.world');
  const carX = num('carX');
  const sheetCx = carX + 399 - dx;
  const camStart = { scale: 1.55, svgOrigin: `${sheetCx} 221` };
  const sheet = q('.sheet');
  const chips = qa('.chip');
  const regs = qa('.reg');
  const spokes = qa('.spoke');
  const dieline = q('.dieline');
  const knife = q('.knife');
  const dieLen = dieline.getTotalLength();
  const knifeAt = { t: 0 };
  const placeKnife = () => {
    const pt = dieline.getPointAtLength(knifeAt.t * dieLen);
    knife.setAttribute('cx', pt.x);
    knife.setAttribute('cy', pt.y);
  };

  /* ---- start state ---- */
  gsap.set(world, camStart);
  gsap.set(sheet, { opacity: 0, y: 16 });
  gsap.set(q('.chips'), { opacity: 1 });
  gsap.set(chips, { opacity: 0, y: 8 });
  gsap.set(inkRect, { attr: { x: rtl ? 245 : 55, width: 0 } });
  gsap.set(q('.head'), { opacity: 0, attr: { x: rtl ? 241 : 55 } });
  gsap.set(proof, { opacity: 0, y: 14 });

  /* Time units 0 to 100. Something starts every ~6 units, which is about every 150px of scroll.
     Design 0-20, Print 20-45, Cut 45-70, Apply 70-100. */
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  /* 1 Design: sheet lands, artwork appears, cut line draws, colours get checked one by one */
  tl.to(sheet, { opacity: 1, y: 0, duration: 4, ease: 'power2.out' }, 0)
    .to(q('.art-flat'), { opacity: 1, duration: 6, ease: 'power2.out' }, 3)
    .to(dieline, { strokeDashoffset: 0, duration: 12, ease: 'power1.inOut' }, 6)
    .to(chips, { opacity: 1, y: 0, duration: 2.5, stagger: 2.2, ease: 'back.out(2)' }, 9)
    .to(qa('.tick'), { strokeDashoffset: 0, duration: 2, stagger: 2.2, ease: 'power1.out' }, 11);

  /* 2 Print: ink sweeps across in one pass, print head leads the edge; registration ticks light as it passes */
  tl.to(q('.head'), { opacity: 1, duration: 1.5 }, 20)
    .to(inkRect, { attr: rtl ? { x: 55, width: 190 } : { width: 190 }, duration: 24, ease: 'power2.inOut' }, 20.5)
    .to(q('.head'), { attr: { x: rtl ? 55 : 241 }, duration: 24, ease: 'power2.inOut' }, 20.5)
    .to(q('.head'), { opacity: 0, duration: 1.5 }, 44);
  const regOrder = rtl ? [...regs].reverse() : regs;
  regOrder.forEach((r, i) => tl.to(r, { opacity: 1, duration: 1.2 }, 26 + i * 6));
  tl.to([q('.chips'), ...regs], { opacity: 0, duration: 2 }, 45);

  /* 3 Cut and weed: the blade traces the shape, then the waste peels away and the shape lifts off the backing */
  tl.to(knife, { opacity: 1, duration: 1 }, 46)
    .to(knifeAt, { t: 1, duration: 12, ease: 'power1.inOut', onUpdate: placeKnife }, 46)
    .to(knife, { opacity: 0, duration: 1 }, 58)
    .to(dieline, { opacity: 0, duration: 4 }, 58)
    .to(q('.waste'), { x: 36 * d, y: -50, rotation: 7 * d, opacity: 0, svgOrigin: `${rtl ? 286 : 26} 116`, duration: 10, ease: 'power2.in' }, 59)
    .to(q('.shape-shadow'), { opacity: 0.22, duration: 6 }, 64)
    .to(q('.shape'), { y: -10, duration: 6, ease: 'power2.out' }, 64);

  /* 4 Apply: the camera pulls back as the same shape glides to the door; bubbles, squeegee, settle, delivered */
  tl.to(world, { scale: 1, duration: 18, ease: 'power2.inOut' }, 62)
    .to(q('.shape'), { x: dx, y: dy - 18, scale: 0.85, svgOrigin: origin, duration: 15, ease: 'power2.inOut' }, 70)
    .to(qa('.bubble'), { opacity: 1, duration: 3, stagger: 0.5 }, 83)
    .to(q('.squeegee'), { opacity: 1, duration: 1 }, 85)
    .fromTo(q('.squeegee'), { x: 0 }, { x: sqEnd - sqStart, duration: 14, ease: 'power1.inOut' }, 85)
    .to(q('.shape'), { y: dy, duration: 12, ease: 'power2.out' }, 86)
    .to(q('.shape-shadow'), { opacity: 0, duration: 10 }, 86)
    .to(q('.squeegee'), { opacity: 0, duration: 1.5 }, 98.5);

  /* Bubbles vanish as the squeegee passes them (fraction measured along the sweep) */
  qa('.bubble').forEach((b) => {
    const frac = (Number(b.getAttribute('cx')) - sqStart) / (sqEnd - sqStart);
    tl.to(b, { opacity: 0, duration: 2 }, 85 + 14 * Math.min(Math.max(frac, 0), 1));
  });

  /* Delivered: the wheels turn once as the proof and CTA arrive */
  spokes.forEach((sp) => tl.to(sp, { rotation: 360 * d, svgOrigin: `${carX + Number(sp.dataset.wx)} 302`, duration: 8, ease: 'power2.inOut' }, 92));
  tl.to(proof, { opacity: 1, y: 0, duration: 6, ease: 'power2.out' }, 94);
  tl.set({}, {}, 100); // fix the total duration at 100

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
