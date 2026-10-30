/* What we make: exploded-view plates in an A24-style carousel (carousel.js). The section is pinned; scroll slides
   one plate at a time into the middle. The centre plate draws itself in: public/plates/<slug>-order.png holds ink
   (alpha) and drawing order (grey); a WebGL shader shows ink whose order is below the progress, with a lime pen tip
   on the leading edge. Neighbours show the finished plate, faded. Without WebGL the centre plate wipes in. */
import { settle, place, centred } from './carousel.js';
const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main() { uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `#version 300 es
precision mediump float;
in vec2 uv; out vec4 o;
uniform sampler2D tex; uniform float prog; uniform vec3 ink; uniform vec3 tip;
void main() {
  vec4 t = texture(tex, uv);           // LUMINANCE_ALPHA: r = order, a = ink
  float w = 0.035;
  float shown = clamp((prog - t.r) / w, 0.0, 1.0);
  float edge = clamp(1.0 - abs(prog - t.r) / w, 0.0, 1.0) * step(prog, 0.999);
  float a = t.a * shown;
  vec3 c = mix(ink, tip, edge);
  o = vec4(c * a, a);                  // premultiplied
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

function makeGL(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const u = (n) => gl.getUniformLocation(prog, n);
  gl.uniform3fv(u('ink'), hex('#131d27'));
  gl.uniform3fv(u('tip'), hex('#bbd440'));
  return { gl, uProg: u('prog') };
}

export function initPlates(gsap, ScrollTrigger) {
  const sec = document.querySelector('[data-plates]');
  if (!sec) return;
  const cards = [...sec.querySelectorAll('.pl-card')];
  const credits = [...sec.querySelectorAll('[data-cr]')];
  const quotes = [...sec.querySelectorAll('[data-q]')];
  const index = [...sec.querySelectorAll('[data-goto]')];
  const ring = sec.querySelector('.pl-car__ring');
  const n = cards.length;
  sec.style.setProperty('--n', n);
  const rtl = document.documentElement.dir === 'rtl';
  const hudN = sec.querySelector('[data-hud-n]');
  const hudBar = sec.querySelector('[data-hud-bar]');

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const G = makeGL(canvas);
  const tex = new Map(); // slug -> texture (or 'loading')
  let active = -1;
  let draw = 0;
  let approach = 0; // 0..1 while the section rises into view, so the first plate starts drawing on arrival

  const load = (slug) => {
    if (!G || !slug || tex.has(slug)) return;
    tex.set(slug, 'loading');
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const { gl } = G;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      tex.set(slug, t);
      render();
    };
    img.src = `/plates/${slug}-order.png`;
  };

  const render = () => {
    const card = cards[active];
    if (!card) return;
    if (G) {
      const { gl, uProg } = G;
      const r = card.getBoundingClientRect();
      const px = Math.max(1, Math.round(card.offsetWidth * Math.min(window.devicePixelRatio || 1, 2)));
      if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const t = tex.get(card.dataset.slug);
      if (t && t !== 'loading' && r.width) {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.uniform1f(uProg, draw);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    } else {
      const img = card.querySelector('img');
      img.style.opacity = '1';
      img.style.clipPath = `inset(0 ${((1 - draw) * 100).toFixed(1)}% 0 0)`;
    }
  };

  const setActive = (i) => {
    if (i === active) return;
    const prev = cards[active];
    if (prev) {
      prev.classList.remove('is-live', 'is-ready');
      prev.querySelectorAll('.is-open').forEach((o) => o.classList.remove('is-open'));
      const img = prev.querySelector('img');
      img.style.opacity = ''; img.style.clipPath = '';
    }
    active = i;
    const card = cards[i];
    credits.forEach((c, k) => c.classList.toggle('is-on', k === i));
    quotes.forEach((q, k) => q.classList.toggle('is-on', k === i));
    index.forEach((b, k) => b.classList.toggle('is-on', k === i));
    if (G) { card.append(canvas); card.classList.add('is-live'); }
    load(card.dataset.slug);
    load(cards[i + 1]?.dataset.slug); // fetch the next drawing ahead of time
    card.querySelectorAll('.pl-spots li').forEach((li, k) => li.style.setProperty('--d', (k * 0.07).toFixed(2)));
    hudN.textContent = String(i + 1).padStart(2, '0');
  };

  let lastP = 0;
  const update = (p = lastP) => {
    lastP = p;
    const spacing = cards[0].offsetWidth * (window.innerWidth < 760 ? 0.9 : 0.78);
    const f = settle(p, n);
    place(cards, f, spacing, rtl, { tilt: 9, depth: 40, shrink: 0.12 }); // full bleed: flatter, the plate is the page
    const a = Math.round(f);
    setActive(a);
    // the centre plate draws in as it arrives; the first one draws while the section rises into view
    const raw = p * (n - 1);
    draw = a === 0 ? Math.min(1, approach + Math.max(0, raw) / 0.2) : Math.min(Math.max((raw - (a - 0.5)) / 0.42, 0), 1);
    const c = centred(f);
    cards[a].classList.toggle('is-ready', draw >= 1 && c > 0.8);
    ring.style.setProperty('--ring', (1 - Math.min(Math.max((c - 0.55) / 0.45, 0), 1) * Math.min(draw * 1.4, 1)).toFixed(3));
    hudBar.style.width = `${(p * 100).toFixed(1)}%`;
    render();
  };

  const st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (self) => update(self.progress) });
  ScrollTrigger.create({ trigger: sec, start: 'top 75%', end: 'top top', onUpdate: (self) => { approach = self.progress; update(); } });

  // index: jump so that plate sits in the middle
  index.forEach((b, k) => b.addEventListener('click', () => {
    const y = st.start + (st.end - st.start) * (k / (n - 1));
    window.__lenis ? window.__lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  // hotspots: hover or hold opens the part card; tap toggles it
  sec.querySelectorAll('.pl-spots li').forEach((li) => {
    const b = li.querySelector('button');
    const open = (v) => {
      if (v) li.parentElement.querySelectorAll('.is-open').forEach((o) => o !== li && o.classList.remove('is-open'));
      li.classList.toggle('is-open', v);
    };
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(true); });
    b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') open(false); });
    b.addEventListener('click', () => open(!li.classList.contains('is-open')));
  });

  window.addEventListener('resize', () => update(), { passive: true });
  update(st.progress); // the module can load after the visitor has already scrolled
}
