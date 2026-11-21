import { Group, LineSegments, Mesh, PerspectiveCamera, Scene, Vector3 } from 'three';
import { dir } from './motion-tokens.js';
import { bufferGeometry, createRenderer, inkMaterial } from './three-kit.js';
import { FILL_VS, FILL_FS, lineVS, fatLineVS, LINE_FS } from './shaders.js';
import { fatLines, edgeNormals } from './fatlines.js';
import { declutter } from './callouts.js';

/* 3D car stage: an exploded technical drawing in light theme (ink lines on paper, lime for the graphic).
   The car is a generic sedan modelled in Blender (3d/*.py) and exported as compact JSON.
   One GSAP timeline (units 0..100) is scrubbed by scroll; callouts are HTML so Arabic works.
   Returns { destroy } or throws so the caller can fall back to the 2D stage. */

const PAPER = [0.929, 0.929, 0.929];   // page ground (fog)
const SOLID = [0.929, 0.929, 0.929];   // body panels
const GLASS = [0.929, 0.929, 0.929];
const TIRE = [0.929, 0.929, 0.929];
const INK = [0.075, 0.114, 0.153];   // line ink: the logo navy
const LIME = [0.733, 0.831, 0.251];   // logo lime #bbd440

/* where each panel goes when the car comes apart (metres) */
const EXPLODE = {
  hood: [0.7, 0, 0.8], windshield: [0.2, 0, 1.05], roof: [0, 0, 1.35], rear_glass: [-0.4, 0, 0.8], trunk: [-0.55, 0, 0.95],
  bumper_front: [1.25, 0, 0], bumper_rear: [-1.25, 0, 0],
  door_front_near: [0, -1.15, 0.05], door_rear_near: [0, -1.15, 0.05], side_glass_near: [0, -1.0, 0.65],
  door_front_far: [0, 1.15, 0.05], door_rear_far: [0, 1.15, 0.05], side_glass_far: [0, 1.0, 0.65],
  wheel_front_near: [0.25, -1.0, 0], wheel_rear_near: [-0.25, -1.0, 0], wheel_front_far: [0.25, 1.0, 0], wheel_rear_far: [-0.25, 1.0, 0],
};
const FILM = ['film_backing', 'film_adhesive', 'film_vinyl', 'film_laminate'];
const FILM_TINT = { film_backing: [0.86, 0.83, 0.77], film_adhesive: [0.92, 0.9, 0.78], film_vinyl: [0.97, 0.97, 0.97], film_laminate: [0.9, 0.93, 0.96] };
const FILM_LINE = { film_backing: INK, film_adhesive: INK, film_vinyl: INK, film_laminate: INK };
const DOOR_X = [0.04, 0.86];

/* callouts: key -> which part they follow, anchor (m), visible window on the 0..100 timeline */
const CALLOUTS = {
  hood: { part: 'hood', at: [1.5, 0, 0.9], win: [14, 30] },
  roof: { part: 'roof', at: [-0.3, 0, 1.46], win: [16, 30] },
  door: { part: 'door_front_near', at: [0.45, -0.93, 0.5], win: [19, 30] },
  wheel: { part: 'wheel_front_near', at: [1.35, -0.95, 0.33], win: [20, 30] },
  bumper: { part: 'bumper_front', at: [2.28, 0, 0.46], win: [21, 30] },
  backing: { part: 'film_backing', at: [0.18, -0.93, 0.47], win: [41, 76] },
  adhesive: { part: 'film_adhesive', at: [0.42, -0.93, 0.56], win: [43, 76] },
  vinyl: { part: 'film_vinyl', at: [0.66, -0.93, 0.68], win: [45, 62] },
  laminate: { part: 'film_laminate', at: [0.84, -0.93, 0.8], win: [47, 80] },
  applied: { part: 'film_art', at: [0.45, -0.93, 0.65], win: [92, 101] },
};

export async function initStage3D({ stage, gsap, ScrollTrigger, onSlow }) {
  const holder = stage.querySelector('.stage__art');
  const calloutRoot = stage.querySelector('[data-callouts]');
  const proof = stage.querySelector('[data-proof]');
  if (!holder) throw new Error('no holder');

  const res = await fetch('/models/car.json');
  if (!res.ok) throw new Error('model');
  const model = await res.json();

  const canvas = document.createElement('canvas');
  canvas.className = 'stage__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  holder.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
  let renderer;
  try { renderer = createRenderer(canvas, dpr); } catch (e) { canvas.remove(); throw e; }   // no WebGL2: the caller falls back to the 2D stage

  const camera = new PerspectiveCamera(28, 1, 0.5, 60);
  camera.up.set(0, 0, 1);
  const scene = new Scene();
  const fogCommon = { uFog: { value: PAPER }, uFogRange: { value: [7, 22] } };
  const lineRes = { value: [1, 1] };

  /* ---------- parts ---------- */
  const parts = {};
  for (const [name, d] of Object.entries(model.parts)) {
    const pos = new Float32Array(d.p.length);
    for (let i = 0; i < pos.length; i++) pos[i] = d.p[i] / 1000;
    const isFilm = name.startsWith('film_');
    const isArt = name === 'film_art';
    const isGlass = /glass|windshield/.test(name);
    const isWheel = name.startsWith('wheel');

    const node = new Group();
    scene.add(node);
    const base = [d.o[0] / 1000, d.o[1] / 1000, d.o[2] / 1000];

    const fillColor = isArt ? LIME : isFilm ? FILM_TINT[name] : isGlass ? GLASS : isWheel ? TIRE : SOLID;
    const fillU = {
      uColor: { value: fillColor }, uAlpha: { value: 1 }, uSweep: { value: -1 },
      uXr: { value: [DOOR_X[0] + 0.1, DOOR_X[1] - 0.1, dir()] }, uYon: { value: 0 }, uYmin: { value: 0 }, ...fogCommon,
    };
    const fillProg = inkMaterial({ vertex: FILL_VS, fragment: FILL_FS, uniforms: fillU, blended: true });
    const fillGeo = bufferGeometry({ position: [pos, 3] }, new Uint16Array(d.t));
    const fill = new Mesh(fillGeo, fillProg); node.add(fill); fill.frustumCulled = false;

    let along = null;
    if (isArt) {  // outline draws itself: ring vertices come first in order
      const n = pos.length / 3 - 1; along = new Float32Array(n + 1);
      for (let i = 0; i < n; i++) along[i] = i / n;
    }
    const lineU = {
      uColor: { value: isFilm ? FILM_LINE[name] : INK }, uAlpha: { value: 1 }, uDraw: { value: 2 }, ...fogCommon,
    };
    let lines;
    let lineProg;
    if (along) {   // the artwork outline draws itself: thin line with a per-vertex progress attribute
      lineProg = inkMaterial({ vertex: lineVS(true), fragment: LINE_FS, uniforms: lineU, blended: true, depthWrite: false });
      lines = new LineSegments(bufferGeometry({ position: [pos, 3], along: [along, 1] }, new Uint16Array(d.l)), lineProg);
    } else {       // everything else: thick screen-space lines
      Object.assign(lineU, { uRes: lineRes, uWidth: { value: 1.15 * dpr } });
      lineProg = inkMaterial({ vertex: fatLineVS, fragment: LINE_FS, uniforms: lineU, blended: true, depthWrite: false });
      lines = new Mesh(fatLines(pos, d.l, edgeNormals(pos, d.t, d.l, name.startsWith('wheel') ? [0, 0, 0] : [-base[0], -base[1], 0.6 - base[2]])), lineProg);
    }
    node.add(lines); lines.frustumCulled = false; lines.renderOrder = 5;   // lines after fills
    // s = animated state, driven by the timeline
    const s = { x: 0, y: 0, z: 0, a: isFilm ? 0 : 1, la: isFilm ? 0 : 1 };
    parts[name] = { node, base, s, fillProg, lineProg, fillU, lineU, isFilm, isArt };
  }

  /* squeegee: a small lime bar with ink edges */
  const squeegee = (() => {
    const w = 0.03, h = 0.5, dd = 0.14;
    const V = [], I = [], L = [];
    for (const x of [-w, w]) for (const y of [-dd, dd]) for (const z of [-h / 2, h / 2]) V.push(x, y, z);
    const q = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
    q.forEach(([a, b, c, e]) => { I.push(a, b, c, a, c, e); L.push(a, b, b, c, c, e, e, a); });
    const pos = new Float32Array(V);
    const node = new Group(); scene.add(node);
    const fu = { uColor: { value: LIME }, uAlpha: { value: 1 }, uSweep: { value: -1 }, uXr: { value: [0, 1, 1] }, uYon: { value: 0 }, uYmin: { value: 0 }, ...fogCommon };
    const lu = { uColor: { value: INK }, uAlpha: { value: 1 }, uDraw: { value: 2 }, ...fogCommon };
    const fp = inkMaterial({ vertex: FILL_VS, fragment: FILL_FS, uniforms: fu, blended: true });
    const lp = inkMaterial({ vertex: lineVS(false), fragment: LINE_FS, uniforms: lu, blended: true, depthWrite: false });
    node.add(new Mesh(bufferGeometry({ position: [pos, 3] }, new Uint16Array(I)), fp));
    node.add(new LineSegments(bufferGeometry({ position: [pos, 3] }, new Uint16Array(L)), lp));
    return { node, s: { x: DOOR_X[0], a: 0 }, fu, lu };
  })();

  /* ground grid: a faint floor so the car has somewhere to stand, and depth to drift against */
  const grid = (() => {
    const V = [], L = []; const R = 14, step = 1;
    let n = 0;
    for (let i = -R; i <= R; i += step) { V.push(i, -R, 0, i, R, 0, -R, i, 0, R, i, 0); L.push(n, n + 1, n + 2, n + 3); n += 4; }
    const node = new Group(); scene.add(node); node.position.z = 0.0;
    const u = { uColor: { value: INK }, uAlpha: { value: 0.12 }, uDraw: { value: 2 }, ...fogCommon };
    const p = inkMaterial({ vertex: lineVS(false), fragment: LINE_FS, uniforms: u, blended: true, depthWrite: false });
    node.add(new LineSegments(bufferGeometry({ position: [new Float32Array(V), 3] }, new Uint16Array(L)), p));
    return { node };
  })();

  const art = parts.film_art;
  const sweepState = { v: 0 };
  art.lineU.uDraw.value = 0;

  /* ---------- callouts (HTML) ---------- */
  const co = {};
  calloutRoot?.querySelectorAll('[data-co]').forEach((el) => { co[el.dataset.co] = { el, on: false }; });

  /* ---------- camera state ---------- */
  const cam = { az: 0.62, el: 0.2, dist: 7.0, tx: 0, ty: 0, tz: 0.72 };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let W = 1, H = 1, aspect = 1;

  function resize() {
    const r = holder.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height); aspect = W / H;
    renderer.setSize(W, H);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    lineRes.value = [W * dpr, H * dpr];
  }
  const ro = new ResizeObserver(resize); ro.observe(holder); resize();

  const onMove = (e) => { pointer.x = (e.clientX / innerWidth - 0.5) * 2; pointer.y = (e.clientY / innerHeight - 0.5) * 2; };
  const fine = matchMedia('(pointer: fine)').matches;
  if (fine) window.addEventListener('pointermove', onMove, { passive: true });

  /* ---------- timeline ---------- */
  const d = dir();
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  const S = (n) => parts[n].s;
  const T = (target, vars, dur, at, ease = 'power2.inOut') => tl.to(target, { ...vars, duration: dur, ease }, at);

  // camera: 3/4 view -> anatomy -> door close-up (oblique so the layers separate on screen) -> pull back
  T(cam, { az: 0.5, el: 0.28, dist: 8.6 }, 22, 6);
  T(cam, { az: 0.66, el: 0.16, dist: 4.4, tx: 0.45, ty: -0.9, tz: 0.66 }, 12, 28);
  T(cam, { az: 0.56, el: 0.14, dist: 5.0 }, 40, 40, 'none');
  T(cam, { az: 0.34, el: 0.14, dist: 6.6, tx: 0, ty: 0, tz: 0.72 }, 14, 84);

  // 1 anatomy: the car comes apart, then closes up
  Object.entries(EXPLODE).forEach(([n, [x, y, z]], i) => T(S(n), { x, y, z }, 18, 7 + i * 0.35));
  Object.keys(EXPLODE).forEach((n, i) => T(S(n), { x: 0, y: 0, z: 0 }, 8, 28 + i * 0.1));

  // everything except the door ghosts to a wireframe
  Object.keys(parts).filter((n) => !parts[n].isFilm && n !== 'door_front_near').forEach((n) => T(S(n), { a: 0.08, la: 0.9 }, 5, 34, 'power1.out'));

  // 2 print: the four layers appear and separate; ink sweeps over the artwork
  const alphas = { film_backing: 0.4, film_adhesive: 0.32, film_vinyl: 0.6, film_laminate: 0.16 };
  FILM.forEach((n) => T(S(n), { a: alphas[n], la: 1 }, 5, 36));
  T(S('film_art'), { a: 1, la: 1 }, 4, 42);
  const offs = { film_backing: 0, film_adhesive: -0.24, film_vinyl: -0.48, film_laminate: -0.72, film_art: -0.485 };
  Object.entries(offs).forEach(([n, y]) => T(S(n), { y }, 12, 38));
  T(sweepState, { v: 1 }, 14, 44, 'power1.inOut');

  // 3 cut: outline draws, the surrounding sheet peels away
  tl.fromTo(art.lineU.uDraw, { value: 0 }, { value: 1, duration: 12, ease: 'power1.inOut' }, 52);
  T(S('film_vinyl'), { y: -1.5, z: 0.7, a: 0, la: 0 }, 12, 62, 'power2.in');

  // 4 apply: liner and adhesive go, artwork settles on the door, squeegee sweeps, car restores
  T(S('film_backing'), { z: 0.5, a: 0, la: 0 }, 6, 72, 'power2.in');
  T(S('film_adhesive'), { z: 0.5, a: 0, la: 0 }, 6, 74, 'power2.in');
  T(S('film_art'), { y: 0 }, 12, 74);
  T(S('film_laminate'), { y: 0, a: 0, la: 0 }, 12, 76);
  tl.set(squeegee.s, { a: 1 }, 80);
  tl.fromTo(squeegee.s, { x: d > 0 ? DOOR_X[0] : DOOR_X[1] }, { x: d > 0 ? DOOR_X[1] : DOOR_X[0], duration: 11, ease: 'power1.inOut' }, 80);
  T(squeegee.s, { a: 0 }, 1.5, 91);
  Object.keys(parts).filter((n) => !parts[n].isFilm && n !== 'door_front_near').forEach((n) => T(S(n), { a: 1, la: 1 }, 8, 88));
  if (proof) { gsap.set(proof, { opacity: 0, y: 14 }); tl.to(proof, { opacity: 1, y: 0, duration: 6, ease: 'power2.out' }, 94); }
  tl.set({}, {}, 100);

  const trigger = ScrollTrigger.create({
    trigger: stage, start: 'top top', end: 'bottom bottom', scrub: 0.5, animation: tl,
    onUpdate: (self) => {
      const p = self.progress;
      stage.dataset.step = p < 0.28 ? '0' : p < 0.5 ? '1' : p < 0.74 ? '2' : '3';
    },
  });
  stage.dataset.step = '0';

  /* ---------- render loop ---------- */
  const v3 = new Vector3(); const tgt = new Vector3();
  let visible = false, frames = 0, slow = 0, last = performance.now(), dead = false;

  function frame() {
    const now = performance.now(); const dt = now - last; last = now;
    if (++frames > 40 && dt > 45) slow++; else if (dt < 30) slow = Math.max(0, slow - 1);
    if (slow > 40 && !dead) { onSlow?.(); return; }

    pointer.sx += (pointer.x - pointer.sx) * 0.06; pointer.sy += (pointer.y - pointer.sy) * 0.06;
    const az = cam.az + pointer.sx * 0.07 * d;
    const el = cam.el - pointer.sy * 0.04;
    // narrower stage (phones): pull the camera back so the whole exploded car fits
    const fit = aspect < 1.5 ? 1.5 / aspect : 1;
    const dist = cam.dist * Math.min(fit, 1.9);
    camera.position.set(
      cam.tx + dist * Math.sin(az) * Math.cos(el),
      cam.ty - dist * Math.cos(az) * Math.cos(el),
      cam.tz + dist * Math.sin(el));
    tgt.set(cam.tx, cam.ty, cam.tz);
    camera.lookAt(tgt);
    camera.updateMatrixWorld();

    for (const [name, p] of Object.entries(parts)) {
      p.node.position.set(p.base[0] + p.s.x, p.base[1] + p.s.y, p.base[2] + p.s.z);
      const solid = p.s.a > 0.98;
      p.fillU.uAlpha.value = p.s.a;
      p.fillProg.transparent = !solid; p.fillProg.depthWrite = solid;
      p.lineU.uAlpha.value = p.s.la;
      p.node.visible = p.s.a > 0.005 || p.s.la > 0.005;
    }
    art.fillU.uSweep.value = sweepState.v;
    art.fillU.uXr.value = [DOOR_X[0] + 0.12, DOOR_X[1] - 0.12, d];
    squeegee.node.position.set(squeegee.s.x, -0.93, 0.65);
    squeegee.fu.uAlpha.value = squeegee.s.a; squeegee.lu.uAlpha.value = squeegee.s.a;
    squeegee.node.visible = squeegee.s.a > 0.01;

    renderer.render(scene, camera);

    // callouts follow their parts; labels that would overlap are pushed apart
    const prog = (trigger.progress ?? 0) * 100;
    const shown = [];
    for (const [key, c] of Object.entries(CALLOUTS)) {
      const o = co[key]; if (!o) continue;
      const part = parts[c.part]; const on = prog >= c.win[0] && prog <= c.win[1] && part.node.visible;
      if (on !== o.on) { o.on = on; o.el.classList.toggle('is-on', on); }
      if (!on) continue;
      v3.set(c.at[0] + part.s.x, c.at[1] + part.s.y, c.at[2] + part.s.z);
      v3.project(camera);
      shown.push({ o, x: Math.min(Math.max((v3.x * 0.5 + 0.5) * W, 14), W - 14), y: Math.min(Math.max((1 - (v3.y * 0.5 + 0.5)) * H, 12), H - 12) });
    }
    declutter(shown, 26, 190);
    for (const { o, x, y } of shown) {
      o.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      o.el.classList.toggle('is-flip', x > W * 0.6);
    }
  }

  const tick = () => frame();
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !visible) { visible = true; last = performance.now(); frames = 0; gsap.ticker.add(tick); }
    else if (!e.isIntersecting && visible) { visible = false; gsap.ticker.remove(tick); }
  }, { rootMargin: '150px' });
  io.observe(stage);
  frame(); // first frame = the assembled car

  stage.dataset.mode = '3d';

  return {
    destroy() {
      dead = true; gsap.ticker.remove(tick); io.disconnect(); ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      trigger.kill(); tl.kill(); canvas.remove();
      calloutRoot?.querySelectorAll('[data-co]').forEach((el) => el.classList.remove('is-on'));
      stage.dataset.mode = '2d';
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
