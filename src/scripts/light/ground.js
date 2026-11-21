/* The paper, painted in WebGL behind the page (the method Expedia's Route 66 pages use): one fixed canvas draws every
   section's ground colour, with Expedia's worn coastline edges between them.
   - Sections declare their ground with data-ground="cream|ochre|sea|peach|image" (the image ground also carries
     data-ground-src). Each frame the canvas reads where they sit on screen, so pinned sections, the rising flood and
     everything else stay exactly in step with the scroll.
   - At each ground's top edge, fractal noise displaces the boundary both ways, which gives the coastline, the islands
     floating below it and the specks above it. The noise rides with the page (page coordinates) and its warp changes
     with the edge's position on screen, so the coast keeps reshaping as it travels instead of sliding as a fixed shape.
   - Paper grain and a faint vignette sit over everything. It redraws only while the scroll moves.
   Without WebGL the page keeps its CSS grounds and SVG edges (the .has-ground class is never set). */

const KINDS = { cream: 0, ochre: 1, sea: 2, peach: 3, image: 4 };
const MAX = 16;

const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `precision highp float;
uniform vec2 uRes;            // CSS px
uniform float uDpr;
uniform float uScroll;        // page scroll, CSS px
uniform int uCount;
uniform vec4 uBand[${MAX}];   // screen top (CSS px), kind, seed, unused; sorted by top
uniform vec3 uCol[4];         // cream, ochre, sea, peach (sRGB)
uniform sampler2D uImg;
uniform vec4 uImgRect;        // top, height (screen CSS px), image aspect, loaded
uniform float uAmp;           // how far the coast reaches either side of the boundary (CSS px)

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; }
  return s / 0.96875;
}
vec3 ground(float kind, vec2 px) {
  if (kind < 0.5) return uCol[0];
  if (kind < 1.5) return uCol[1];
  if (kind < 2.5) return uCol[2];
  if (kind < 3.5) return uCol[3];
  // the photograph ground: cover-fit across the screen width and the ground's height, drifting a little slower
  float h = max(uImgRect.y, 1.0);
  float boxAspect = uRes.x / h;
  vec2 uv = vec2(px.x / uRes.x, (px.y - uImgRect.x) / h);
  vec2 scale = boxAspect > uImgRect.z ? vec2(1.0, uImgRect.z / boxAspect) : vec2(boxAspect / uImgRect.z, 1.0);
  uv = (uv - 0.5) * scale + 0.5;
  vec3 photo = texture2D(uImg, vec2(uv.x, uv.y)).rgb;
  return mix(uCol[3], photo, uImgRect.w);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;   // CSS px, y down
  float pageY = px.y + uScroll;
  float kind = 0.0;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec4 b = uBand[i];
    float top = b.x;
    // the coast fades out as an edge reaches the very top, so a pinned ground stays clean there
    float amp = uAmp * smoothstep(0.0, uAmp * 0.8, top);
    float d = 0.0;
    if (amp > 0.5 && abs(px.y - top) < amp) {
      vec2 p = vec2(px.x, pageY) / 230.0 + b.z;
      float travel = clamp(top / uRes.y, -0.2, 1.2);
      vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
      float n = fbm(p + q * mix(2.8, 0.7, travel));                     // the warp changes as the edge travels
      d = (n - 0.5) * 2.0 * amp;
    }
    if (px.y + d >= top) kind = b.y;
  }
  vec3 col = ground(kind, px);
  // paper: a fine grain fixed to the page, long faint fibres, a soft vignette
  float grain = hash(floor(vec2(px.x, pageY) * 0.9));
  float fibre = fbm(vec2(px.x * 0.012, pageY * 0.0035));
  col *= 0.982 + 0.03 * grain;
  col *= 0.985 + 0.03 * fibre;
  vec2 v = px / uRes - 0.5;
  col *= 1.0 - 0.07 * dot(v, v);
  gl_FragColor = vec4(col, 1.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function initGround({ root, gsap }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lground-gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('Ground shader unavailable', e); return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U('uRes'), dpr: U('uDpr'), scroll: U('uScroll'), count: U('uCount'), band: U('uBand'), col: U('uCol'), img: U('uImg'), imgRect: U('uImgRect'), amp: U('uAmp') };

  const css = getComputedStyle(document.documentElement);
  const tok = (n, d) => (css.getPropertyValue(n).trim() || d);
  gl.uniform3fv(u.col, new Float32Array([tok('--cream', '#efe6cf'), tok('--ochre', '#ecd49b'), tok('--sea', '#d6e6ee'), tok('--peach', '#f3d1b2')].flatMap(hex)));

  // the photograph ground's texture (one per page)
  const imgEl = root.querySelector('[data-ground="image"]');
  let imgAspect = 16 / 9, imgReady = 0;
  const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([243, 209, 178, 255]));
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((w) => gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(u.img, 0);
  if (imgEl?.dataset.groundSrc) {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); imgAspect = im.width / im.height; imgReady = 1; dirty = true; };
    im.src = imgEl.dataset.groundSrc;
  }

  const els = () => [...root.querySelectorAll('[data-ground]')];
  let list = els();
  const seeds = list.map((_, i) => (i * 7.31) % 13.7);
  let dpr = 1, w = 0, h = 0, dirty = true, lastY = -1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    list = els(); dirty = true;
  };
  const bands = new Float32Array(MAX * 4);
  const draw = () => {
    const y = window.scrollY;
    if (!dirty && y === lastY) return;
    dirty = false; lastY = y;
    // a hidden ground (display: none measures 0 x 0 at the top of the screen) would paint from there down, so skip it
    const rows = list.map((el, i) => { const r = el.getBoundingClientRect(); return { top: r.top, h: r.height, kind: KINDS[el.dataset.ground] ?? 0, seed: seeds[i] ?? i, i }; })
      .filter((r) => r.h > 0).sort((a, b) => a.top - b.top || a.i - b.i).slice(0, MAX);
    bands.fill(0);
    rows.forEach((r, k) => { bands[k * 4] = r.top; bands[k * 4 + 1] = r.kind; bands[k * 4 + 2] = r.seed; });
    const imgRect = imgEl ? imgEl.getBoundingClientRect() : { top: 0, height: 1 };
    // the photograph drifts slower than the page while its ground passes the screen
    const drift = imgEl ? (imgRect.top + imgRect.height / 2 - h / 2) * 0.12 : 0;
    gl.uniform2f(u.res, w, h); gl.uniform1f(u.dpr, dpr); gl.uniform1f(u.scroll, y);
    gl.uniform1i(u.count, rows.length); gl.uniform4fv(u.band, bands);
    gl.uniform4f(u.imgRect, imgRect.top - drift, imgRect.height, imgAspect, imgReady);
    gl.uniform1f(u.amp, Math.min(220, h * 0.24));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  resize();
  document.body.prepend(canvas);
  root.classList.add('has-ground');
  gsap.ticker.add(draw);
  window.addEventListener('resize', resize);
  window.addEventListener('load', () => { dirty = true; }, { once: true });
  canvas.addEventListener('webglcontextlost', () => { root.classList.remove('has-ground'); gsap.ticker.remove(draw); canvas.remove(); });
  return { redraw: () => { dirty = true; } };
}
