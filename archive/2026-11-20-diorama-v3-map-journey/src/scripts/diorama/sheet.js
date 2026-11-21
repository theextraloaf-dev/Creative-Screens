import { stopProgress } from '../../lib/diorama-timeline.ts';

/* Story sheets over the journey. Opening one (from a postcard's "See the job", or its prev/next) pushes its own URL
   (/preview/<slug>/), stops the page scrolling and traps focus; Back, Esc or Close returns to the same point in the
   journey with focus where it was. Between stories the hero photos change with a WebGL distortion transition (an
   RGB-split ripple), falling back to a cross-fade without WebGL or with reduced motion.
   A direct visit to /preview/#stop-<n> (the standalone page's close link) scrolls the journey to that stop. */

const TRANSITION_FS = `#version 300 es
precision highp float;
uniform sampler2D uFrom; uniform sampler2D uTo; uniform float uT; uniform vec2 uRes;
in vec2 vUv; out vec4 o;
void main() {
  float t = uT;
  vec2 c = vUv - 0.5;
  float ripple = sin(length(c * uRes / min(uRes.x, uRes.y)) * 28.0 - t * 14.0) * 0.025 * sin(t * 3.14159);
  vec2 dir = normalize(c + 1e-4) * ripple;
  float split = 0.012 * sin(t * 3.14159);
  vec4 a = vec4(texture(uFrom, vUv + dir + vec2(split, 0)).r, texture(uFrom, vUv + dir).g, texture(uFrom, vUv + dir - vec2(split, 0)).b, 1.0);
  vec4 b = vec4(texture(uTo, vUv - dir + vec2(split, 0)).r, texture(uTo, vUv - dir).g, texture(uTo, vUv - dir - vec2(split, 0)).b, 1.0);
  o = mix(a, b, smoothstep(0.2, 0.8, t));
}`;
const TRANSITION_VS = `#version 300 es
in vec2 p; out vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(p, 0.0, 1.0); }`;

/** Play the distortion transition from one image to another over `host`; resolves when done (or at once without GL). */
function distort(host, fromImg, toImg, ms = 750) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  const gl = !reduce && canvas.getContext('webgl2', { premultipliedAlpha: false });
  if (!gl || !fromImg.complete || !toImg.complete || !fromImg.naturalWidth || !toImg.naturalWidth) return Promise.resolve();
  const r = host.getBoundingClientRect();
  canvas.width = Math.round(r.width * Math.min(devicePixelRatio, 2)); canvas.height = Math.round(r.height * Math.min(devicePixelRatio, 2));
  canvas.className = 'dsheet__fx';
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, TRANSITION_VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, TRANSITION_FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = (img, unit) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  };
  tex(fromImg, 0); tex(toImg, 1);
  gl.uniform1i(gl.getUniformLocation(prog, 'uFrom'), 0); gl.uniform1i(gl.getUniformLocation(prog, 'uTo'), 1);
  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), canvas.width, canvas.height);
  const uT = gl.getUniformLocation(prog, 'uT');
  gl.viewport(0, 0, canvas.width, canvas.height);
  host.appendChild(canvas);
  return new Promise((done) => {
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (t < 1) requestAnimationFrame(step);
      else { canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); done(); }
    };
    requestAnimationFrame(step);
  });
}

export function initSheets({ root, dir, lenis }) {
  const sheets = new Map([...document.querySelectorAll('[data-sheet]')].map((el) => [Number(el.dataset.sheet), el]));
  const journeyUrl = location.pathname;                       // /preview/ or /ar/preview/
  let current = null, returnFocus = null, scrollY = 0;

  const focusables = (el) => [...el.querySelectorAll('a[href], button:not([disabled])')].filter((x) => !x.closest('[hidden]'));
  function trap(e) {
    if (!current) return;
    const el = sheets.get(current);
    if (e.key === 'Escape') { e.preventDefault(); history.back(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(el); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', trap);

  async function show(n, { from } = {}) {
    const el = sheets.get(n);
    if (!el) return;
    if (current && current !== n) {
      const prev = sheets.get(current);
      const a = prev.querySelector('[data-sheet-hero] img'), b = el.querySelector('[data-sheet-hero] img');
      b.loading = 'eager';
      el.hidden = false; el.classList.add('is-entering');
      await distort(el.querySelector('[data-sheet-hero]'), a, b);
      prev.hidden = true; el.classList.remove('is-entering');
    } else if (!current) {
      returnFocus = from || document.activeElement;
      scrollY = window.scrollY;
      lenis?.stop();
      document.documentElement.classList.add('dsheet-open');
      el.hidden = false;
    }
    current = n;
    el.querySelector('.dsheet__scroll')?.scrollTo(0, 0);
    requestAnimationFrame(() => el.querySelector('.dsheet__close')?.focus());
  }

  function hide() {
    if (!current) return;
    sheets.get(current).hidden = true;
    current = null;
    document.documentElement.classList.remove('dsheet-open');
    lenis?.start();
    window.scrollTo(0, scrollY);
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
  }

  // open from postcards and from prev/next inside a sheet: intercept the links (they still work without JS)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-story], a[data-sheet-go]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const n = Number(a.dataset.story || a.dataset.sheetGo);
    if (!sheets.has(n)) return;
    e.preventDefault();
    history.pushState({ sheet: n }, '', a.getAttribute('href'));
    show(n, { from: a });
  });
  for (const el of sheets.values()) el.querySelector('.dsheet__close')?.addEventListener('click', () => history.back());

  window.addEventListener('popstate', (e) => {
    const n = e.state?.sheet;
    if (n && sheets.has(n)) show(n); else hide();
  });

  // /preview/#stop-<n>: scroll the journey to that stop (the standalone page's close link lands here)
  const m = /^#stop-(\d)$/.exec(location.hash);
  if (m) {
    const n = Number(m[1]);
    const top = root.getBoundingClientRect().top + window.scrollY;
    requestAnimationFrame(() => lenis?.scrollTo(top + stopProgress(n, dir) * (root.offsetHeight - innerHeight), { immediate: true }));
    history.replaceState(null, '', journeyUrl);
  }
  return { show, hide };
}
