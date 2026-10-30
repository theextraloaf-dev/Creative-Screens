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

  /* ---- start state ---- */
  gsap.set(inkRect, { attr: { x: rtl ? 245 : 55, width: 0 } });
  gsap.set(q('.head'), { opacity: 0, attr: { x: rtl ? 241 : 55 } });
  gsap.set(proof, { opacity: 0, y: 14 });

  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  /* 1 Design: flat artwork appears, the cut line draws itself */
  tl.to(q('.art-flat'), { opacity: 1, duration: 8, ease: 'power2.out' }, 0)
    .to(q('.dieline'), { strokeDashoffset: 0, duration: 16, ease: 'power1.inOut' }, 4);

  /* 2 Print: ink sweeps across in one pass, print head leads the edge */
  tl.to(q('.head'), { opacity: 1, duration: 1.5 }, 20)
    .to(inkRect, { attr: rtl ? { x: 55, width: 190 } : { width: 190 }, duration: 24, ease: 'power2.inOut' }, 20.5)
    .to(q('.head'), { attr: { x: rtl ? 55 : 241 }, duration: 24, ease: 'power2.inOut' }, 20.5)
    .to(q('.head'), { opacity: 0, duration: 1.5 }, 44);

  /* 3 Cut and weed: waste peels away, the shape lifts off the backing */
  tl.to(q('.waste'), { x: 36 * d, y: -50, rotation: 7 * d, opacity: 0, svgOrigin: `${rtl ? 286 : 26} 116`, duration: 22, ease: 'power2.in' }, 47)
    .to(q('.shape-shadow'), { opacity: 0.22, duration: 10 }, 52)
    .to(q('.shape'), { y: -10, duration: 10, ease: 'power2.out' }, 52)
    .to(q('.dieline'), { opacity: 0, duration: 6 }, 60);

  /* 4 Apply: glide to the door, bubbles show, squeegee sweeps and the graphic settles */
  tl.to(q('.shape'), { x: dx, y: dy - 18, scale: 0.85, svgOrigin: origin, duration: 15, ease: 'power2.inOut' }, 70)
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
