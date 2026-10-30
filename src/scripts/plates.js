/* What we make: exploded-view plates that draw themselves. The section is pinned; scroll walks plate to plate.
   Per plate (one equal share of the scroll): draw in 0-0.45, hold 0.45-0.85 (part hotspots shown), un-draw 0.85-1.
   Drawing: public/plates/<slug>-order.png holds ink (alpha) and drawing order (grey); a WebGL shader shows ink whose
   order is below the progress, with a lime pen tip on the leading edge. Without WebGL the plate image wipes in. */
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
  const items = [...sec.querySelectorAll('.pl-item')];
  const index = [...sec.querySelectorAll('[data-goto]')];
  const n = items.length;
  sec.style.setProperty('--n', n);
  const hudN = sec.querySelector('[data-hud-n]');
  const hudBar = sec.querySelector('[data-hud-bar]');

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const G = makeGL(canvas);
  if (G) sec.classList.add('has-gl');
  const tex = new Map(); // slug -> texture (or 'loading')

  const load = (slug) => {
    if (!G || tex.has(slug)) return;
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
      render(true);
    };
    img.src = `/plates/${slug}-order.png`;
  };

  let active = -1;
  let draw = 0;
  const size = () => {
    const fig = canvas.parentElement;
    if (!fig) return;
    const r = fig.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(1, Math.round(Math.min(r.width, r.height) * dpr));
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
  };
  const render = () => {
    const it = items[active];
    if (!it) return;
    const slug = it.dataset.slug;
    if (G) {
      const { gl, uProg } = G;
      size();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const t = tex.get(slug);
      if (t && t !== 'loading') {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.uniform1f(uProg, draw);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    } else {
      const img = it.querySelector('.pl-item__img');
      if (img) img.style.clipPath = `inset(0 ${(1 - draw) * 100}% 0 0)`;
    }
  };

  const setActive = (i) => {
    if (i === active) return;
    active = i;
    items.forEach((it, k) => it.classList.toggle('is-on', k === i));
    index.forEach((b, k) => b.classList.toggle('is-on', k === i));
    const it = items[i];
    if (it.dataset.ready === '1') {
      it.querySelector('.pl-item__fig').append(canvas);
      load(it.dataset.slug);
    } else canvas.remove();
    // fetch the next plate's drawing ahead of time
    if (items[i + 1]?.dataset.ready === '1') load(items[i + 1].dataset.slug);
    hudN.textContent = String(i + 1).padStart(2, '0');
  };

  const showSpots = (it, on) => it.querySelectorAll('.pl-spots li').forEach((li, k) => {
    li.style.setProperty('--d', on ? (k * 0.08).toFixed(2) : 0);
    li.style.opacity = on ? '1' : '';
    li.style.transform = on ? 'none' : '';
    if (!on) li.classList.remove('is-open');
  });

  const update = (p) => {
    const f = Math.min(p * n, n - 0.0001);
    const i = Math.floor(f);
    const local = f - i;
    setActive(i);
    draw = local < 0.45 ? local / 0.45 : local < 0.85 || i === n - 1 ? 1 : 1 - (local - 0.85) / 0.15;
    if (i === 0 && p === 0) draw = 0;
    items.forEach((it, k) => showSpots(it, k === i && draw > 0.97));
    hudBar.style.width = `${(p * 100).toFixed(1)}%`;
    render();
  };

  const st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (self) => update(self.progress) });

  // index: jump to the middle of that plate's hold
  index.forEach((b, k) => b.addEventListener('click', () => {
    const y = st.start + (st.end - st.start) * ((k + 0.65) / n);
    window.__lenis ? window.__lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  // hotspots: hover or hold opens the part card; tap or Enter toggles it
  sec.querySelectorAll('.pl-spots li').forEach((li) => {
    const b = li.querySelector('button');
    const open = (v) => {
      if (v) li.parentElement.querySelectorAll('.is-open').forEach((o) => o !== li && o.classList.remove('is-open'));
      li.classList.toggle('is-open', v);
    };
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') open(true); });
    b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') open(false); });
    b.addEventListener('click', () => open(!li.classList.contains('is-open')));
    b.addEventListener('focus', () => open(true));
    b.addEventListener('blur', () => open(false));
  });

  window.addEventListener('resize', () => render(), { passive: true });
  update(st.progress); // the module can load after the visitor has already scrolled
}
