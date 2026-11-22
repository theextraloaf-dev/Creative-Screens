/* The finished jobs as lit planes in WebGL: the technique of biegajaca-sztuka.pl's "Works waiting for their wall",
   written for our light paper.
   - Every job is a finely divided plane, all of them laid in a row at one height (the frame's), 0.6 units apart
     (a unit is the slide height / 2.6, the slider's own scale). The scroll sets where the row should be; each frame
     the row glides a fraction of the way there, so it never steps with the wheel.
   - By its distance from the frame, a slide recedes, turns toward the frame and, once it has passed, fades out as it
     slides under the column's text (slidePose in src/lib/jobs-gallery.ts).
   - A soft point light sits at the frame's start edge, in front of the slides, and follows the pointer, so the jobs
     catch a moving sheen; slides further from it are a little dimmer (warm, never grey: this is a light page).
   - A fast scroll bends the planes like canvas: a travelling wave plus a bow in the direction of travel, eased in
     quickly and out slowly.
   - Photos fill their slide; catalogue pieces sit on paper with a margin, their white multiplied away.
   Needs WebGL2; without it the gallery keeps its DOM cards. */
import { slidePose } from '../../lib/jobs-gallery.ts';

const VERT = `#version 300 es
in vec2 aPos;                 // the unit grid, -0.5..0.5
uniform vec2 uHost;           // host size (px)
uniform float uFocal;         // camera distance (px): 42 deg vertical field of view, as on Biegajaca
uniform vec3 uCenter;         // slide centre from the host centre (px, y up) and its depth
uniform vec2 uSize;           // slide width, height (px)
uniform float uRotY, uUnit, uBend, uWay, uTime, uPhase;
uniform float uShadow;        // 1: the soft shadow under the slide
out vec2 vUv; out vec2 vLocal; out vec3 vPos; out vec3 vN;
void main() {
  vec2 size = uShadow > 0.5 ? uSize + vec2(140.0) : uSize;
  vec2 local = aPos * size;
  float zd = 0.0; vec3 n = vec3(0.0, 0.0, 1.0);
  if (uShadow < 0.5 && uBend > 0.0005) {
    vec2 q = local / uUnit;
    float a = 1.8 * q.x + 3.0 * uTime + uPhase;
    float wave = sin(a) * cos(0.9 * q.y) * 0.18;
    float bow = (1.0 - min(1.0, q.y * q.y / 2.0)) * uWay * 0.12;
    float dx = 1.8 * cos(a) * cos(0.9 * q.y) * 0.18;
    float dy = -0.9 * sin(a) * sin(0.9 * q.y) * 0.18 + (q.y * q.y < 2.0 ? -q.y * uWay * 0.12 : 0.0);
    zd = (wave + bow) * uBend * uUnit;
    n = normalize(vec3(-dx * uBend, -dy * uBend, 1.0));
  }
  if (uShadow > 0.5) { local.y -= 26.0; zd = -2.0; }
  float c = cos(uRotY), s = sin(uRotY);
  vec3 p = vec3(local.x * c + zd * s, local.y, -local.x * s + zd * c) + uCenter;
  vN = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
  vPos = p; vLocal = local; vUv = aPos + 0.5;
  gl_Position = vec4(p.x / (uHost.x * 0.5), p.y / (uHost.y * 0.5), 0.0, (uFocal - p.z) / uFocal);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; in vec2 vLocal; in vec3 vPos; in vec3 vN;
uniform sampler2D uTex;
uniform float uLoaded, uLook, uImgAspect, uOpacity, uRadius, uUnit, uFocal, uShadow;
uniform vec2 uSize;
uniform vec3 uLight, uPaper;
out vec4 o;
vec3 pic(vec2 t) { vec4 c = texture(uTex, t); return mix(vec3(1.0), c.rgb, c.a); }   // a transparent image sits over white
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  float d = rbox(vLocal, uSize * 0.5, uRadius);
  if (uShadow > 0.5) {                                   // a soft sepia shadow, as the DOM cards had
    float a = (1.0 - smoothstep(-40.0, 64.0, d)) * 0.15 * uOpacity * uOpacity;
    o = vec4(vec3(0.29, 0.23, 0.17) * a, a); return;
  }
  float boxAspect = uSize.x / uSize.y;
  vec3 tex;
  if (uLook < 0.5) {                                     // a photo: cover
    vec2 sc = boxAspect > uImgAspect ? vec2(1.0, uImgAspect / boxAspect) : vec2(boxAspect / uImgAspect, 1.0);
    vec2 uv = (vUv - 0.5) * sc + 0.5;
    tex = pic(vec2(uv.x, 1.0 - uv.y));
  } else {                                               // a catalogue piece: contained on paper, multiplied
    float pad = 0.08;
    vec2 inner = vec2(1.0 - 2.0 * pad / boxAspect, 1.0 - 2.0 * pad);
    float innerAspect = boxAspect * inner.x / inner.y;
    vec2 sc = innerAspect > uImgAspect ? vec2(innerAspect / uImgAspect, 1.0) : vec2(1.0, uImgAspect / innerAspect);
    vec2 t = (vUv - 0.5) / inner * sc + 0.5;
    bool inside = t.x >= 0.0 && t.x <= 1.0 && t.y >= 0.0 && t.y <= 1.0;
    tex = uPaper * (inside ? pic(vec2(t.x, 1.0 - t.y)) : vec3(1.0));
  }
  tex = mix(uPaper, tex, uLoaded);
  // the light: ambient plus a point light with Biegajaca's falloff (decay 1.6, reach 12 units), rolled off above 0.9
  vec3 N = normalize(vN);
  vec3 toL = uLight - vPos;
  float dist = length(toL) / uUnit;
  vec3 L = normalize(toL);
  float fall = pow(max(dist, 0.5), -1.6) * pow(clamp(1.0 - pow(dist / 12.0, 4.0), 0.0, 1.0), 2.0);
  float I = 0.62 + 6.3 * max(dot(N, L), 0.0) * fall;
  I = I < 0.9 ? I : 0.9 + (1.0 - exp(-(I - 0.9) * 4.0)) * 0.16;
  vec3 V = normalize(vec3(0.0, 0.0, uFocal) - vPos);
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 20.0) * 0.08 * min(1.0, 6.3 * fall);
  vec3 tint = mix(vec3(0.93, 0.88, 0.8), vec3(1.0), smoothstep(0.62, 0.98, I));   // shade warms, never greys
  vec3 col = tex * I * tint + spec;
  float a = (1.0 - smoothstep(-0.75, 0.75, d)) * uOpacity;
  o = vec4(col * a, a);
}`;

const SEG_X = 32, SEG_Y = 40;

function grid() {
  const v = [], idx = [];
  for (let y = 0; y <= SEG_Y; y++) for (let x = 0; x <= SEG_X; x++) v.push(x / SEG_X - 0.5, y / SEG_Y - 0.5);
  for (let y = 0; y < SEG_Y; y++) for (let x = 0; x < SEG_X; x++) {
    const a = y * (SEG_X + 1) + x, b = a + 1, c = a + SEG_X + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  return { v: new Float32Array(v), idx: new Uint16Array(idx) };
}

/** host: the pinned element the canvas fills; frame: the element marking where the active slide sits;
    items: [{ src, look }]; dir: 1 left to right, -1 in Arabic (the row mirrors, the photos never do). */
export function createGalleryScene({ host, frame, items, dir, gsap }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ljobs__gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const { v, idx } = grid();
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  const U = {};
  ['uHost', 'uFocal', 'uCenter', 'uSize', 'uRotY', 'uUnit', 'uBend', 'uWay', 'uTime', 'uPhase', 'uShadow', 'uTex', 'uLoaded', 'uLook',
    'uImgAspect', 'uOpacity', 'uRadius', 'uLight', 'uPaper'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform1i(U.uTex, 0); gl.uniform3f(U.uPaper, 251 / 255, 246 / 255, 234 / 255);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');

  let alive = true, running = false, dirty = true;
  const slides = items.map((it) => {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([251, 246, 234, 255]));
    return { tex, look: it.look === 'photo' ? 0 : 1, aspect: 1.6, loaded: 0, fade: 0, phase: Math.random() * Math.PI * 2, src: it.src };
  });
  // the photos load once the gallery is near, scaled to at most 1280 px wide, with mipmaps for the receding slides
  const load = (sl) => {
    const im = new Image(); im.decoding = 'async';
    im.onload = async () => {
      if (!alive) return;
      const w = Math.min(1280, im.naturalWidth), h = Math.round(im.naturalHeight * (w / im.naturalWidth));
      const bmp = await createImageBitmap(im, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high', premultiplyAlpha: 'none' }).catch(() => im);
      if (!alive) return;
      gl.bindTexture(gl.TEXTURE_2D, sl.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      sl.aspect = w / h; sl.loaded = 1; bmp.close?.(); wake();
    };
    im.src = sl.src;
  };

  // layout (px): measured from the host and the frame on every resize and refresh
  const L = { W: 1, H: 1, focal: 1, w: 1, h: 1, unit: 1, gap: 0, start: 0, cy: 0, dpr: 1 };
  const positions = [];
  const resize = () => {
    const hr = host.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    if (!hr.width || !fr.height) return;
    L.W = hr.width; L.H = hr.height; L.dpr = Math.min(devicePixelRatio || 1, 1.75);
    L.focal = (L.H / 2) / Math.tan((21 * Math.PI) / 180);
    L.h = fr.height; L.w = fr.width; L.unit = L.h / 2.6; L.gap = 0.6 * L.unit;
    L.start = (dir === 1 ? fr.left : fr.right) - hr.left - L.W / 2;
    L.cy = -(fr.top - hr.top + L.h / 2 - L.H / 2);
    canvas.width = Math.round(L.W * L.dpr); canvas.height = Math.round(L.H * L.dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    positions.length = 0; slides.forEach((_, i) => positions.push(i * (L.w + L.gap)));
    light.x = light.tx = L.start; light.y = light.ty = L.cy;
    wake();
  };

  let target = 0, current = 0, bend = 0, way = 0, time = 0;
  const light = { x: 0, y: 0, tx: 0, ty: 0 };
  const radius = 14;

  const draw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uHost, L.W, L.H); gl.uniform1f(U.uFocal, L.focal); gl.uniform2f(U.uSize, L.w, L.h);
    gl.uniform1f(U.uUnit, L.unit); gl.uniform1f(U.uBend, bend); gl.uniform1f(U.uWay, way); gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uRadius, radius); gl.uniform3f(U.uLight, light.x, light.y, 2.2 * L.unit);
    const half = L.w / 2;
    const vis = [];
    slides.forEach((sl, i) => {
      const s = positions[i] - current;
      if (s > 12 * L.unit) return;
      const pose = slidePose(s, half, L.unit);
      if (pose.opacity < 0.01) return;
      vis.push({ sl, x: L.start + dir * (s + half), z: pose.z, rot: dir * pose.rotY, op: pose.opacity });
    });
    vis.sort((a, b) => a.z - b.z);                       // far ones first
    gl.activeTexture(gl.TEXTURE0);
    for (const pass of [1, 0]) {
      gl.uniform1f(U.uShadow, pass);
      for (const it of vis) {
        gl.uniform3f(U.uCenter, it.x, L.cy, it.z); gl.uniform1f(U.uRotY, it.rot); gl.uniform1f(U.uOpacity, it.op);
        gl.uniform1f(U.uPhase, it.sl.phase);
        if (!pass) {
          gl.bindTexture(gl.TEXTURE_2D, it.sl.tex);
          gl.uniform1f(U.uLoaded, it.sl.fade); gl.uniform1f(U.uLook, it.sl.look); gl.uniform1f(U.uImgAspect, it.sl.aspect);
        }
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }
    }
  };

  let settled = 0;
  const tick = (_t, dtMs) => {
    if (!running) return;
    const dt = Math.min(dtMs / 1000, 0.05) || 0.016;
    time += dt;
    const was = current;
    current += (target - current) * (1 - Math.pow(0.9, 60 * dt));
    const speed = (current - was) / Math.max(dt, 0.001) / L.unit;   // units per second
    const want = Math.min(1, 0.35 * Math.abs(speed));
    bend += (want - bend) * (1 - Math.pow(want > bend ? 0.8 : 0.94, 60 * dt));
    if (Math.abs(speed) > 0.01) way = Math.sign(speed);
    light.x += (light.tx - light.x) * (1 - Math.pow(0.88, 60 * dt));
    light.y += (light.ty - light.y) * (1 - Math.pow(0.88, 60 * dt));
    let fading = false;
    slides.forEach((sl) => { if (sl.fade < sl.loaded) { sl.fade = Math.min(1, sl.fade + dt * 2.5); fading = true; } });
    draw();
    const still = Math.abs(target - current) < 0.05 && bend < 0.001 && Math.abs(light.tx - light.x) < 0.3 && Math.abs(light.ty - light.y) < 0.3 && !fading;
    settled = still ? settled + 1 : 0;
    if (settled > 8 && !dirty) running = false;
    dirty = false;
  };
  function wake() { dirty = true; if (!alive) return; if (!running) { running = true; settled = 0; } }

  host.prepend(canvas);
  resize();
  gsap.ticker.add(tick);
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { slides.forEach((sl) => { if (!sl.started) { sl.started = true; load(sl); } }); io.disconnect(); } }, { rootMargin: '150% 0px' });
  io.observe(host);
  const ro = new ResizeObserver(resize); ro.observe(host);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); destroy(); onLost?.(); });
  let onLost = null;

  function destroy() {
    if (!alive) return;
    alive = false; running = false; gsap.ticker.remove(tick); io.disconnect(); ro.disconnect();
    slides.forEach((sl) => gl.deleteTexture(sl.tex));
    canvas.remove();
  }

  return {
    canvas,
    positions,
    resize,
    /** where the row should be (px along the row); jump: put it there at once (after a refresh) */
    setTarget(x, jump = false) { target = x; if (jump) current = x; wake(); },
    /** the pointer over the host, -1..1 each way (y up): the light follows it */
    setPointer(nx, ny) { light.tx = L.start + 3.5 * L.unit * nx; light.ty = L.cy + 2 * L.unit * ny; wake(); },
    /** the light back to rest at the frame's start edge */
    clearPointer() { light.tx = L.start; light.ty = L.cy; wake(); },
    /** the slide under a point (host px from its top-left), or -1 */
    hit(px, py) {
      const x = px - L.W / 2, y = -(py - L.H / 2), half = L.w / 2;
      let best = -1, bestOp = 0;
      slides.forEach((_, i) => {
        const s = positions[i] - current, pose = slidePose(s, half, L.unit);
        if (pose.opacity < 0.5) return;
        const k = L.focal / (L.focal - pose.z), cx = (L.start + dir * (s + half)) * k;
        const hw = half * Math.cos(pose.rotY) * k, hh = (L.h / 2) * k, cy = L.cy * k;
        if (Math.abs(x - cx) <= hw && Math.abs(y - cy) <= hh && pose.opacity > bestOp) { best = i; bestOp = pose.opacity; }
      });
      return best;
    },
    onLost(fn) { onLost = fn; },
    destroy,
  };
}
