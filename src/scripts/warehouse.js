import { Renderer, Camera, Transform, Geometry, Program, Mesh, Vec3, Texture } from 'ogl';
import { dir } from './motion-tokens.js';
import { FILL_VS, FILL_FS, fatLineVS, LINE_FS, TEX_VS, TEX_FS } from './shaders.js';
import { declutter } from './callouts.js';
import { fatLines, edgeNormals } from './fatlines.js';

/* The print works, drawn in a calm technical style (after Pala Raiffeisen): cool grey ground, shaded white solids with thin
   navy outlines with a line hierarchy (heavy contours, light interior edges), soft floor shadows, and lime as the only accent. Machines are drawn in line only; COLOUR is reserved for print: CMYK on the machine
   (ink tanks, carriage, colour bars) and the brand colours (lime, navy, white, from the client's logo) on the finished work.
   One scene, flown through by the scroll, four stations, one per chapter:
   1 a brief comes   2 we analyze   3 we print   4 we deliver.
   Z is up, the corridor runs along +Y. Everything is generated here from boxes, cylinders and polylines. */

const PAPER = [0.929, 0.929, 0.929];      // the page ground, cool light grey (also the fog colour)
const WASH = [0.929, 0.929, 0.929];      // solids: white, shaded by the light
const LINE = [0.075, 0.114, 0.153];      // line ink: the logo navy
const LIME = [0.733, 0.831, 0.251];       // logo lime #bbd440
const BLACK = [0.075, 0.114, 0.153];      // logo navy #131d27
const CYAN = [0.0, 0.682, 0.937], MAGENTA = [0.925, 0.0, 0.549], YELLOW = [1.0, 0.949, 0.0];

/* ---------- geometry batches ---------- */
class Batch {
  constructor(withNormals = false) { this.p = []; this.i = []; this.n = []; this.hasN = withNormals; }
  // nrm (line batches): 6 floats per segment, the two face normals the edge joins; omitted = steady weight
  add(v, idx, nrm) {
    const o = this.p.length / 3; for (const x of v) this.p.push(x); for (const k of idx) this.i.push(o + k);
    if (this.hasN) { if (nrm) for (const x of nrm) this.n.push(x); else for (let q = 0; q < (idx.length / 2) * 6; q++) this.n.push(0); }
  }
  get empty() { return this.i.length === 0; }
}
const BOX_EDGES = [   // vertex pair, then the normals of the two faces the edge joins
  [0, 1, [0, 0, -1], [0, -1, 0]], [1, 2, [0, 0, -1], [1, 0, 0]], [2, 3, [0, 0, -1], [0, 1, 0]], [3, 0, [0, 0, -1], [-1, 0, 0]],
  [4, 5, [0, 0, 1], [0, -1, 0]], [5, 6, [0, 0, 1], [1, 0, 0]], [6, 7, [0, 0, 1], [0, 1, 0]], [7, 4, [0, 0, 1], [-1, 0, 0]],
  [0, 4, [0, -1, 0], [-1, 0, 0]], [1, 5, [0, -1, 0], [1, 0, 0]], [2, 6, [0, 1, 0], [1, 0, 0]], [3, 7, [0, 1, 0], [-1, 0, 0]],
];
/* fine surface detail (panel seams, vents, screws, plinth lines) on large machine boxes: what makes the drawing read as real equipment */
function detail(F, x0, x1, y0, y1, z0, z1) {
  const w = x1 - x0, d = y1 - y0, h = z1 - z0, yy = y0 - 0.004;
  if (w > 1.2 && h > 0.5) {
    for (const t of [0.34, 0.67]) poly(F, [[x0 + w * t, yy, z0 + 0.1], [x0 + w * t, yy, z1 - 0.06]]);
    const vx = x0 + 0.16, vl = Math.min(0.55, w * 0.2);
    for (let k = 0; k < 4; k++) poly(F, [[vx, yy, z1 - 0.16 - k * 0.07], [vx + vl, yy, z1 - 0.16 - k * 0.07]]);
    for (const [sx, sz] of [[x0 + 0.08, z0 + 0.16], [x1 - 0.08, z0 + 0.16], [x0 + 0.08, z1 - 0.08], [x1 - 0.08, z1 - 0.08]]) {
      poly(F, [[sx - 0.025, yy, sz], [sx + 0.025, yy, sz]]); poly(F, [[sx, yy, sz - 0.025], [sx, yy, sz + 0.025]]);
    }
    poly(F, [[x0, yy, z0 + 0.1], [x1, yy, z0 + 0.1]]);
  }
  if (d > 0.9 && h > 0.5) {
    const sx = (x0 + x1) / 2 > 0 ? x0 - 0.004 : x1 + 0.004;
    poly(F, [[sx, y0 + d * 0.5, z0 + 0.1], [sx, y0 + d * 0.5, z1 - 0.06]]);
    poly(F, [[sx, y0, z0 + 0.1], [sx, y1, z0 + 0.1]]);
  }
  if (w > 1.2 && d > 0.8) poly(F, [[x0 + 0.1, (y0 + y1) / 2, z1 + 0.004], [x1 - 0.1, (y0 + y1) / 2, z1 + 0.004]]);
}
function box(B, cx, cy, z0, w, d, h, fill = true) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - d / 2, y1 = cy + d / 2, z1 = z0 + h;
  const v = [x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1];
  if (fill && B.fill) B.fill.add(v, [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
  if (B.shadow && z0 < 0.01 && h > 0.3) B.shadow.add([x0 - 0.1, y0 - 0.05, 0.004, x1 + 0.4, y0 - 0.05, 0.004, x1 + 0.4, y1 + 0.35, 0.004, x0 - 0.1, y1 + 0.35, 0.004], [0, 1, 2, 0, 2, 3]);   // soft drop shadow on the floor
  if (B.fine) detail(B.fine, x0, x1, y0, y1, z0, z1);
  const li = [], ln = [];
  for (const [a, b, n1, n2] of BOX_EDGES) { li.push(a, b); ln.push(...n1, ...n2); }
  B.line.add(v, li, ln);
}
function cyl(B, axis, cx, cy, cz, r, len, seg = 20) {
  const v = [], fi = [], li = [], ln = [];
  const rad = (a) => (axis === 'x' ? [0, Math.cos(a), Math.sin(a)] : [Math.cos(a), 0, Math.sin(a)]);
  const cap = (s) => (axis === 'x' ? [s, 0, 0] : [0, s, 0]);
  for (const t of [0, 1]) for (let k = 0; k < seg; k++) {
    const a = (2 * Math.PI * k) / seg, c = Math.cos(a) * r, s = Math.sin(a) * r, u = (t - 0.5) * len;
    if (axis === 'x') v.push(cx + u, cy + c, cz + s); else v.push(cx + c, cy + u, cz + s);
  }
  for (let r2 = 0; r2 < 2; r2++) for (let k = 0; k < seg; k++) { li.push(r2 * seg + k, r2 * seg + ((k + 1) % seg)); ln.push(...cap(r2 ? 1 : -1), ...rad((2 * Math.PI * (k + 0.5)) / seg)); }
  for (let k = 0; k < seg; k += 4) { li.push(k, seg + k); const a = (2 * Math.PI * k) / seg, e = Math.PI / seg; ln.push(...rad(a - e), ...rad(a + e)); }   // true silhouette lines
  for (let k = 0; k < seg; k++) { const b = (k + 1) % seg; fi.push(k, b, seg + b, k, seg + b, seg + k); }
  if (B.fill) B.fill.add(v, fi);
  B.line.add(v, li, ln);
  if (B.fine && r > 0.15 && len > 1.0) {   // detail: band rings along the body and a flange circle on each end
    const ring = (u, rr) => { const pts = []; for (let k = 0; k < 24; k++) { const a = (2 * Math.PI * k) / 24, c = Math.cos(a) * rr, sn = Math.sin(a) * rr; pts.push(axis === 'x' ? [cx + u, cy + c, cz + sn] : [cx + c, cy + u, cz + sn]); } poly(B.fine, pts, true); };
    for (const t of [-0.32, -0.16, 0.16, 0.32]) ring(t * len, r * 1.003);
    for (const e of [-1, 1]) ring(e * (len / 2 + 0.004), r * 0.6);
  }
}
function poly(L, pts, close = false) {
  const v = [], i = [];
  pts.forEach((p) => v.push(p[0], p[1], p[2]));
  for (let k = 0; k < pts.length - 1; k++) i.push(k, k + 1);
  if (close) i.push(pts.length - 1, 0);
  L.add(v, i);
}
const DASH = false;   // centre lines were visual noise; kept for later
function dashPoly(L, pts, close = false, dl = 0.12, gap = 0.07) {   // dashed polyline: cut paths and dielines only
  const seq = close ? [...pts, pts[0]] : pts;
  for (let i = 0; i < seq.length - 1; i++) {
    const a = seq[i], b = seq[i + 1], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d) || 1;
    for (let t = 0; t < len; t += dl + gap) { const t1 = Math.min(t + dl, len), at = (u) => [a[0] + (d[0] * u) / len, a[1] + (d[1] * u) / len, a[2] + (d[2] * u) / len]; poly(L, [at(t), at(t1)]); }
  }
}
function dash(L, a, b, dl = 0.35, gap = 0.14) {            // dashed line from a to b
  if (!DASH) return;
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d);
  const at = (t) => [a[0] + (d[0] * t) / len, a[1] + (d[1] * t) / len, a[2] + (d[2] * t) / len];
  for (let t = 0; t < len; t += dl + gap) poly(L, [at(t), at(Math.min(t + dl, len))]);
}
function dim(L, a, b, tick = [0, 0, 0.14], head = 0.16) {   // dimension line with ticks and arrowheads
  poly(L, [a, b]);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d) || 1, u = d.map((x) => x / len);
  const tl = Math.hypot(...tick) || 1, t = tick.map((x) => x / tl);
  for (const p of [a, b]) poly(L, [[p[0] - tick[0], p[1] - tick[1], p[2] - tick[2]], [p[0] + tick[0], p[1] + tick[1], p[2] + tick[2]]]);
  const barbs = (p, s) => {
    const q = [p[0] + s * u[0] * head, p[1] + s * u[1] * head, p[2] + s * u[2] * head], w = head * 0.35;
    poly(L, [[q[0] + t[0] * w, q[1] + t[1] * w, q[2] + t[2] * w], p, [q[0] - t[0] * w, q[1] - t[1] * w, q[2] - t[2] * w]]);
  };
  barbs(a, 1); barbs(b, -1);
}
function hatchXZ(L, x0, x1, z0, z1, y, step = 0.35) {       // 45 degree section hatching on a wall face
  const w = x1 - x0, h = z1 - z0;
  for (let c = -h; c < w; c += step) {
    let xa = x0 + c, za = z0, xb = x0 + c + h, zb = z1;
    if (xa < x0) { za += x0 - xa; xa = x0; }
    if (xb > x1) { zb -= xb - x1; xb = x1; }
    if (za < zb) poly(L, [[xa, y, za], [xb, y, zb]]);
  }
}
function stadium(cx, cy, z, a, b, n = 28) {                  // pill outline in the XY plane
  const pts = [];
  for (let k = 0; k <= n / 2; k++) { const t = -Math.PI / 2 + (Math.PI * k) / (n / 2); pts.push([cx + a + b * Math.cos(t), cy + b * Math.sin(t), z]); }
  for (let k = 0; k <= n / 2; k++) { const t = Math.PI / 2 + (Math.PI * k) / (n / 2); pts.push([cx - a + b * Math.cos(t), cy + b * Math.sin(t), z]); }
  return pts;
}
function disc(cx, cy, z, r, n = 18) { const p = []; for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); } return p; }
function fillPoly(F, pts) {                                    // convex fan
  const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
  const v = [...c]; pts.forEach((p) => v.push(...p));
  const idx = []; for (let k = 0; k < pts.length; k++) idx.push(0, 1 + k, 1 + ((k + 1) % pts.length));
  F.add(v, idx);
}
/* the brand mark on finished work: lime pill, two navy stripes, a white dot (concept art, to be replaced by real artwork) */
function brandPill(F, cx, cy, z, a = 0.7, b = 0.26) {
  fillPoly(F.lime, stadium(cx, cy, z, a, b));
  for (const sx of [-0.3, -0.1]) fillPoly(F.black, [[cx + sx - 0.07, cy - b * 0.92, z + 0.004], [cx + sx + 0.03, cy - b * 0.92, z + 0.004], [cx + sx + 0.18, cy + b * 0.92, z + 0.004], [cx + sx + 0.08, cy + b * 0.92, z + 0.004]]);
  fillPoly(F.white, disc(cx + a * 0.62, cy, z + 0.004, b * 0.45));
}

/* ---------- textured quads (the client's artwork) ---------- */
class TexBatch {
  constructor() { this.p = []; this.uv = []; this.i = []; }
  quad(pts, uvs) { const o = this.p.length / 3; pts.forEach((p) => this.p.push(p[0], p[1], p[2])); uvs.forEach((u) => this.uv.push(u[0], u[1])); this.i.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  get empty() { return this.i.length === 0; }
}
// four corners a b c d of an axis-aligned quad, with the image's top edge on the c-d side (far side from the camera)
const UV_UP = [[0, 1], [1, 1], [1, 0], [0, 0]];
function circleXZ(L, cx, y, cz, r, n = 26) {   // a circle in the XZ plane (cylinders seen end-on in a cutaway)
  const pts = []; for (let k = 0; k < n; k++) { const a = (2 * Math.PI * k) / n; pts.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]); }
  poly(L, pts, true);
}

const P = 4;   // the wide-format printer line sits this far further down the corridor than before

/* ---------- the building ---------- */
function buildScene() {
  const L = { fine: new Batch(true), joint: new Batch(true), grid: new Batch(true), major: new Batch(true), struct: new Batch(true), ink: new Batch(true), cut: new Batch(true), dash: new Batch(true) };
  const F = { floor: new Batch(), shadow: new Batch(), wash: new Batch(), paper: new Batch(), lime: new Batch(), white: new Batch(), black: new Batch(), c: new Batch(), m: new Batch(), y: new Batch(), k: new Batch() };
  const T = new TexBatch();
  const M = { fill: F.wash, line: L.ink, fine: L.fine };       // machines
  const S = { fill: F.paper, line: L.struct };   // structure
  const col = (name) => ({ fill: F[name], line: L.ink });

  // floor: one light plane, with only a faint major grid every 5 m
  const Y0 = -8, Y1 = 66;
  F.floor.add([-10, Y0, -0.004, 10, Y0, -0.004, 10, Y1, -0.004, -10, Y1, -0.004], [0, 1, 2, 0, 2, 3]);
  for (let x = -10; x <= 10; x += 5) poly(L.major, [[x, Y0, 0], [x, Y1, 0]]);
  for (let y = -5; y <= Y1; y += 5) poly(L.major, [[-10, y, 0], [10, y, 0]]);

  // columns and roof trusses every 6 m: the long corridor
  const chord = (x) => 6.5 + 1.3 * (1 - Math.abs(x) / 8);
  for (let y = 0; y <= 60; y += 6) {
    for (const x of [-8, 8]) box(S, x, y, 0, 0.4, 0.4, 6.5);
    poly(L.struct, [[-8, y, 6.5], [0, y, 7.8], [8, y, 6.5]]);
    poly(L.struct, [[-8, y, 6.5], [8, y, 6.5]]);
  }
  for (const x of [-8, 0, 8]) poly(L.struct, [[x, Y0, chord(x)], [x, 62, chord(x)]]);

  // fine detail: floor expansion joints, wall cladding courses with window bands, roof purlins and truss webs
  for (let x = -10; x <= 10; x += 1) poly(L.joint, [[x, Y0, 0], [x, Y1, 0]]);
  for (let y = Y0; y <= Y1; y += 1) poly(L.joint, [[-10, y, 0], [10, y, 0]]);
  for (const wx of [-7.98, 7.98]) {
    for (let z = 0.5; z <= 3.5; z += 0.5) {
      poly(L.fine, [[wx, Y0, z], [wx, 62, z]]);
      const off = Math.round(z / 0.5) % 2 ? 0 : 0.75;
      for (let y = Y0 + off; y <= 62; y += 1.5) poly(L.fine, [[wx, y, z], [wx, y, z + 0.5]]);
    }
    for (let y = 0; y < 60; y += 6) {
      const a = y + 1, b = y + 5;
      poly(L.struct, [[wx, a, 3.8], [wx, b, 3.8], [wx, b, 5.6], [wx, a, 5.6]], true);
      for (let m = a + 1; m < b; m += 1) poly(L.fine, [[wx, m, 3.8], [wx, m, 5.6]]);
      poly(L.fine, [[wx, a, 4.7], [wx, b, 4.7]]);
    }
  }
  for (const x of [-6, -4, -2, 2, 4, 6]) poly(L.fine, [[x, Y0, chord(x)], [x, 62, chord(x)]]);
  for (let y = Y0 + 1.5; y <= 62; y += 1.5) poly(L.fine, [[-8, y, 6.5], [0, y, 7.8], [8, y, 6.5]]);
  for (let y = 0; y <= 60; y += 6) for (const x of [-6, -4, -2, 2, 4, 6]) poly(L.fine, [[x, y, 6.5], [x, y, chord(x)]]);

  // 1 a brief comes: intake desk with job-ticket tab, inbox, letterbox slot, sign board
  box(M, -2.6, 6.2, 0, 2.6, 1.0, 0.85);
  box(M, -7.8, 3.6, 1.9, 0.3, 1.5, 0.45);
  poly(L.ink, [[-7.64, 2.9, 2.0], [-7.64, 4.3, 2.0]]);
  poly(L.ink, [[-3.9, 6.8, 2.4], [-1.3, 6.8, 2.4], [-1.3, 6.8, 3.2], [-3.9, 6.8, 3.2]], true);
  box(col('lime'), -2.6, 5.68, 0.55, 0.9, 0.02, 0.12);

  // 2 we analyze: prepress. Workstations whose screens show the artwork, a light table with the proof and a dieline,
  //   a swatch fan, a colour-viewing booth and a proofing printer.
  for (const x of [-3.9, 3.9]) {
    box(M, x, 18.4, 0, 2.4, 1.0, 0.8);
    box(M, x, 18.7, 0.8, 0.14, 0.14, 0.3);
    box(M, x, 18.8, 1.1, 1.3, 0.07, 0.75);
    T.quad([[x - 0.6, 18.76, 1.15], [x + 0.6, 18.76, 1.15], [x + 0.6, 18.76, 1.8], [x - 0.6, 18.76, 1.8]], UV_UP);
    box(col('lime'), x, 18.05, 0.8, 0.7, 0.2, 0.02);                 // keyboard
  }
  box(M, 0, 19.4, 0.8, 3.4, 1.9, 0.08);
  for (const [lx, ly] of [[-1.55, 18.6], [1.55, 18.6], [-1.55, 20.2], [1.55, 20.2]]) box(M, lx, ly, 0, 0.1, 0.1, 0.8, false);
  T.quad([[-1.5, 18.6, 0.892], [1.5, 18.6, 0.892], [1.5, 20.2, 0.892], [-1.5, 20.2, 0.892]], UV_UP);   // the proof
  poly(L.ink, [[-1.5, 18.6, 0.894], [1.5, 18.6, 0.894], [1.5, 20.2, 0.894], [-1.5, 20.2, 0.894]], true);
  dashPoly(L.cut, stadium(0, 19.4, 0.9, 0.7, 0.26), true);          // the dieline over the artwork
  ['lime', 'k', 'c', 'm', 'y'].forEach((n, i) => {                  // swatch fan
    const a = 0.25 + i * 0.22, px = 1.15, py = 18.75, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, len = 0.62, w = 0.1;
    fillPoly(F[n], [[px, py, 0.9], [px + ux * len, py + uy * len, 0.9], [px + ux * len + vx * w, py + uy * len + vy * w, 0.9], [px + vx * w, py + vy * w, 0.9]]);
  });
  dim(L.ink, [-1.7, 20.55, 0.95], [1.7, 20.55, 0.95], [0, 0.12, 0]);
  dim(L.ink, [1.95, 18.5, 0.95], [1.95, 20.3, 0.95], [0.12, 0, 0]);
  dash(L.dash, [0, 17.4, 0.9], [0, 21.6, 0.9]); dash(L.dash, [-2.0, 19.4, 0.9], [2.0, 19.4, 0.9]);
  box(M, -6.1, 16.0, 0, 1.8, 1.1, 1.7);                              // colour-viewing booth with open front
  poly(L.ink, [[-6.9, 15.44, 0.4], [-5.3, 15.44, 0.4], [-5.3, 15.44, 1.3], [-6.9, 15.44, 1.3]], true);
  [['lime', -0.4], ['white', 0], ['c', 0.4]].forEach(([n, dx]) => box(col(n), -6.1 + dx * 1.1, 15.43, 0.62, 0.3, 0.02, 0.3));
  box(M, 3.9, 17.7, 0.8, 0.9, 0.6, 0.35);                            // proofing printer

  // 3 we print. (a) a sheet-fed offset press, in cutaway so the cylinders show: feeder, four printing units
  //   (K C M Y, each with impression, blanket and plate cylinders, an ink-roller train and a coloured ink fountain), delivery.
  const PC = 28.5;
  box(M, -4.3, PC, 0, 1.4, 1.5, 0.9);
  box(M, -4.3, PC, 0.9, 1.1, 1.2, 1.0);                              // paper pile
  [0.2, 0.42, 0.64, 0.86].forEach((z) => poly(L.ink, [[-4.85, PC - 0.6, 0.9 + z], [-3.75, PC - 0.6, 0.9 + z]]));
  box(M, -4.3, PC, 1.9, 1.3, 1.4, 0.35);                             // feeder head
  [['k', -2.65], ['c', -0.95], ['m', 0.75], ['y', 2.45]].forEach(([n, xi]) => {
    box(M, xi, PC - 0.5, 0, 1.6, 0.14, 3.0); box(M, xi, PC + 0.5, 0, 1.6, 0.14, 3.0); box(M, xi, PC, 3.0, 1.6, 1.14, 0.1);
    const yf = PC - 0.5 - 0.085;
    circleXZ(L.ink, xi, yf, 0.75, 0.40); circleXZ(L.ink, xi, yf, 1.43, 0.30); circleXZ(L.ink, xi, yf, 2.03, 0.30);
    [0.75, 1.43, 2.03].forEach((z) => circleXZ(L.ink, xi, yf, z, 0.05, 10));
    [[-0.3, 2.52], [0.3, 2.52], [0, 2.7], [-0.44, 2.3], [0.44, 2.3]].forEach(([dx, z]) => circleXZ(L.ink, xi + dx, yf, z, 0.09, 12));
    box(col(n), xi, PC, 3.1, 1.1, 0.8, 0.3);                         // ink fountain in the unit's colour
  });
  dash(L.dash, [-3.6, PC - 0.62, 1.12], [3.35, PC - 0.62, 1.12], 0.25, 0.1);   // sheet path through the units
  box(M, 4.3, PC, 0, 1.6, 1.5, 0.9);
  box(M, 4.3, PC, 0.9, 1.2, 1.2, 0.6);                               // delivery stack of printed sheets
  T.quad([[3.7, PC - 0.6, 1.502], [4.9, PC - 0.6, 1.502], [4.9, PC + 0.6, 1.502], [3.7, PC + 0.6, 1.502]], UV_UP);
  box(M, -0.95, PC - 1.7, 0, 1.4, 0.8, 0.9);                         // press console
  box(M, -0.95, PC - 1.7, 0.9, 1.1, 0.07, 0.7);
  T.quad([[-1.45, PC - 1.74, 1.0], [-0.45, PC - 1.74, 1.0], [-0.45, PC - 1.74, 1.55], [-1.45, PC - 1.74, 1.55]], UV_UP);
  dim(L.ink, [-5.0, PC - 2.3, 0.1], [5.0, PC - 2.3, 0.1], [0, 0.12, 0]);        // length of the press line

  //   (b) a gantry large-format printer behind it, with roll feed (after the client's photo)
  box(M, 0, 34.9 + P, 0, 6.2, 2.0, 0.85);
  box(M, -3.35, 34.0 + P, 0, 0.5, 1.4, 1.95); box(M, 3.35, 34.0 + P, 0, 0.5, 1.4, 1.95);
  box(M, 0, 34.0 + P, 0.85, 6.2, 1.2, 0.1);
  box(M, 0, 33.7 + P, 1.6, 6.9, 0.55, 0.38);
  cyl(M, 'x', 0, 33.4 + P, 1.38, 0.05, 6.4, 12);
  for (let k = 0; k < 8; k++) cyl(M, 'x', -2.8 + k * 0.8, 33.45 + P, 1.0, 0.07, 0.3, 10);
  [['c', 0], ['m', 1], ['y', 2], ['k', 3]].forEach(([n, i]) => box(col(n), 2.45 + i * 0.3, 35.6 + P, 0.85, 0.22, 0.3, 0.6));
  [['c', 0], ['m', 1], ['y', 2], ['k', 3]].forEach(([n, i]) => box(col(n), -2.7 + i * 0.35, 33.4 + P, 1.7, 0.26, 0.03, 0.2));
  cyl(M, 'x', 0, 37.0 + P, 2.15, 0.62, 5.4, 28);
  cyl(M, 'x', 0, 37.0 + P, 2.15, 0.1, 5.8, 12);
  for (const x of [-3.1, 3.1]) box(M, x, 37.0 + P, 1.55, 0.12, 0.6, 0.6, false);
  const web = [[-2.6, 36.4 + P, 1.62], [2.6, 36.4 + P, 1.62], [2.6, 34.55 + P, 0.96], [-2.6, 34.55 + P, 0.96]];
  F.paper.add(web.flat(), [0, 1, 2, 0, 2, 3]); poly(L.ink, web, true);
  box(M, 0, 32.2 + P, 0, 5.4, 2.4, 0.5);                             // output table
  dash(L.dash, [-4.6, 34.0 + P, 1.3], [4.6, 34.0 + P, 1.3]); dash(L.dash, [0, 31.0 + P, 0.2], [0, 38.5 + P, 0.2]);
  dim(L.ink, [-3.6, 33.0 + P, 2.55], [3.6, 33.0 + P, 2.55], [0, 0, 0.15]);
  poly(L.ink, [[-3.6, 33.0 + P, 2.0], [-3.6, 33.0 + P, 2.7]]); poly(L.ink, [[3.6, 33.0 + P, 2.0], [3.6, 33.0 + P, 2.7]]);

  // finishing: a roll laminator and a flatbed cutter with a gantry bridge, cutting lime pills along dashed cut paths
  box(M, -3.2, 45.0, 0, 4.2, 1.4, 1.1);
  cyl(M, 'x', -3.2, 44.3, 1.55, 0.34, 3.8, 24); cyl(M, 'x', -3.2, 45.7, 1.55, 0.3, 3.8, 24); cyl(M, 'x', -3.2, 44.5, 0.82, 0.2, 3.8, 18);
  const lweb = [[-5.0, 42.6, 1.12], [-1.4, 42.6, 1.12], [-1.4, 44.3, 1.12], [-5.0, 44.3, 1.12]];
  F.paper.add(lweb.flat(), [0, 1, 2, 0, 2, 3]); poly(L.ink, lweb, true);
  box(M, 3.0, 45.5, 0, 5.0, 2.2, 0.9);
  box(M, 1.6, 45.5, 0.9, 0.3, 2.7, 0.5);
  for (const yy of [44.2, 46.8]) box(M, 1.6, yy, 0, 0.3, 0.3, 0.9, false);
  for (const x of [2.1, 3.0, 3.9]) { fillPoly(F.lime, stadium(x, 45.5, 0.902, 0.26, 0.14, 20)); }

  // 4 we deliver: finishing bench with printed sheets, crates with printed labels, rolled graphics, dock wall
  box(M, 5.4, 53.2, 0, 2.4, 1.2, 0.9);
  T.quad([[4.6, 52.8, 0.93], [6.2, 52.8, 0.93], [6.2, 53.6, 0.93], [4.6, 53.6, 0.93]], UV_UP);
  box(M, -5.6, 49, 0, 1.6, 1.2, 1.2); box(M, -5.6, 49, 1.2, 1.3, 1.0, 0.9); box(M, -4.2, 52.2, 0, 1.2, 1.2, 0.8);
  box(col('white'), -5.6, 48.39, 0.4, 0.7, 0.02, 0.5); box(col('lime'), -4.2, 51.59, 0.25, 0.6, 0.02, 0.4); box(col('black'), -5.6, 48.49, 1.5, 0.5, 0.02, 0.3);
  box(M, 5.2, 47, 0, 1.5, 1.5, 1.0); box(col('lime'), 5.2, 46.24, 0.3, 0.6, 0.02, 0.4);
  [['lime', -0.9], ['white', -0.5], ['black', -0.1]].forEach(([n, x]) => cyl({ fill: F[n], line: L.ink }, 'y', 4.2 + x, 50, 0.22, 0.18, 2.2, 14));
  box(S, -5.9, 61, 0, 4.7, 0.3, 6.5); box(S, 5.9, 61, 0, 4.7, 0.3, 6.5); box(S, 0, 61, 4.0, 7.1, 0.3, 2.5);
  poly(L.ink, [[-3.55, 60.8, 0], [-3.55, 60.8, 4.0], [3.55, 60.8, 4.0], [3.55, 60.8, 0]]);

  const ZONES = [   // x0, x1, y0, y1
    [-5.2, 0.4, 3.2, 9.0], [-5.6, 5.6, 15.2, 22.0], [-5.6, 5.8, 26.2, 31.0], [-4.4, 4.4, 36.2, 45.0], [-6.0, 6.0, 42.2, 48.6], [-6.4, 6.4, 49.0, 59.0],
  ];
  return { L, F, T, ZONES };
}

/* ---------- the sedan waiting at the dock, wrap applied ---------- */
async function addCar(scn, at) {
  const res = await fetch('/models/car.json');
  if (!res.ok) return;
  const model = await res.json();
  let ySum = 0, yN = 0;
  for (const [name, d] of Object.entries(model.parts)) {
    if (name.startsWith('film_') && name !== 'film_art') continue;
    const ox = d.o[0] / 1000 + at[0], oy = d.o[1] / 1000 + at[1], oz = d.o[2] / 1000 + at[2];
    const v = [];
    for (let i = 0; i < d.p.length; i += 3) v.push(d.p[i] / 1000 + ox, d.p[i + 1] / 1000 + oy, d.p[i + 2] / 1000 + oz);
    const nrm = edgeNormals(v, d.t, d.l, name.startsWith('wheel') ? [ox, oy, oz] : [at[0], at[1], at[2] + 0.6]);
    if (name === 'film_art') { for (let i = 1; i < v.length; i += 3) { ySum += v[i]; yN++; } scn.F.lime.add(v, d.t); scn.L.ink.add(v, d.l, nrm); }
    else { scn.F.wash.add(v, d.t); scn.L.ink.add(v, d.l, nrm); }
  }
  // the wrap: navy stripes and a white dot on the lime pill (car-local pill centre 0.45, 0.65; half-length 0.31, half-height 0.115)
  const y = (yN ? ySum / yN : at[1] - 0.93) - 0.004;
  const cx = at[0] + 0.45, cz = at[2] + 0.65;
  for (const sx of [-0.12, -0.02]) scn.F.black.add([cx + sx - 0.03, y, cz - 0.105, cx + sx + 0.01, y, cz - 0.105, cx + sx + 0.08, y, cz + 0.105, cx + sx + 0.04, y, cz + 0.105], [0, 1, 2, 0, 2, 3]);
  const dot = []; for (let k = 0; k < 16; k++) { const a = (2 * Math.PI * k) / 16; dot.push(cx + 0.2 + 0.045 * Math.cos(a), y, cz + 0.045 * Math.sin(a)); }
  const di = []; for (let k = 0; k < 16; k++) di.push(0, 1 + k, 1 + ((k + 1) % 16));
  scn.F.white.add([cx + 0.2, y, cz, ...dot], di);
  // centre lines through the wheels and a length dimension: the drafting touch
  for (const wx of [1.35, -1.35]) {
    dash(scn.L.dash, [at[0] + wx, at[1] - 1.1, at[2] + 0.345], [at[0] + wx, at[1] - 0.7, at[2] + 0.345], 0.12, 0.06);
    dash(scn.L.dash, [at[0] + wx, at[1] - 0.95, at[2] - 0.05], [at[0] + wx, at[1] - 0.95, at[2] + 0.8], 0.12, 0.06);
  }
  dim(scn.L.ink, [at[0] - 2.3, at[1] - 1.4, at[2] + 0.02], [at[0] + 2.3, at[1] - 1.4, at[2] + 0.02], [0, 0, 0.12]);
}

/* ---------- camera path ---------- */
const KEYS = [   // story progress, camera position, look-at (look-at sits low so stations stay above the text card)
  [0.00, [0.0, -8.0, 2.0], [0.0, 12.0, 1.4]],
  [0.12, [1.5, -3.0, 2.4], [-1.5, 8.0, 0.8]],
  [0.27, [3.8, -1.5, 2.6], [-2.4, 6.4, 0.0]],     // 1 brief
  [0.38, [0.5, 6.0, 3.0], [0.0, 19.0, 0.3]],
  [0.50, [-0.5, 8.5, 3.0], [0.0, 19.4, -0.2]],    // 2 analyze
  [0.62, [0.0, 19.0, 3.4], [0.0, 29.0, 0.9]],
  [0.68, [7.4, 19.5, 4.3], [0.0, 29.0, 0.9]],     // 3 print: the offset press
  [0.76, [7.2, 28.5, 4.8], [0.0, 39.5, 0.5]],     // 3 print: the wide-format printer
  [0.86, [8.4, 37.5, 4.6], [-0.5, 47.5, 0.2]],    // finishing: laminator and cutter, seen from beside the printer line
  [0.90, [2.5, 40.5, 5.0], [-1.0, 51.5, 0.2]],   // high over the finishing line, clear of the crates
  [0.94, [-6.4, 46.8, 2.5], [0.0, 55.0, 0.1]],    // 4 deliver
  [1.00, [-5.0, 48.5, 2.2], [0.5, 55.0, 0.2]],
];
const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
function sample(p, out, which) {
  let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0])));
  const P0 = KEYS[Math.max(0, i - 1)][which], P1 = a[which], P2 = b[which], P3 = KEYS[Math.min(KEYS.length - 1, i + 2)][which];
  out.set(cr(P0[0], P1[0], P2[0], P3[0], t), cr(P0[1], P1[1], P2[1], P3[1], t), cr(P0[2], P1[2], P2[2], P3[2], t));
}

const CAR_AT = [0, 54.5, 0];
const CALLOUTS = {   // key: [x, y, z, from, to]
  brief: [-2.6, 6.2, 1.5, 0.2, 0.36],
  artwork: [-0.7, 18.7, 0.95, 0.42, 0.56],
  dimensions: [1.95, 20.55, 1.0, 0.43, 0.56],
  press: [0.75, 27.9, 3.5, 0.62, 0.73],
  cmyk: [-2.65, 28.5, 3.35, 0.63, 0.73],
  printer: [0, 34.0 + P, 2.25, 0.73, 0.82],
  roll: [0, 37.0 + P, 2.9, 0.74, 0.82],
  dimW: [0, 33.0 + P, 2.55, 0.74, 0.82],
  laminator: [-3.2, 45.0, 1.9, 0.8, 0.9],
  finishing: [1.2, 45.5, 1.0, 0.82, 0.9],
  applied: [CAR_AT[0] + 0.45, CAR_AT[1] - 0.94, 0.62, 0.87, 1.01],
  dimL: [0, CAR_AT[1] - 1.4, 0.05, 0.9, 1.01],
  dock: [0, 61, 3.6, 0.9, 1.01],
};
const STATION_AT = [0.4, 0.58, 0.8];   // title block: where the drawing sheet changes

export async function initWarehouse({ gsap, ScrollTrigger }) {
  const wrap = document.querySelector('[data-warehouse]');
  const story = document.querySelector('[data-story]');
  if (!wrap || !story) return;
  if (location.search.includes('stage=2d')) return;
  const probe = document.createElement('canvas').getContext('webgl2');
  if (!probe || navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory < 2)) return;

  const canvas = wrap.querySelector('canvas');
  const renderer = new Renderer({ canvas, alpha: true, antialias: true, depth: true, webgl: 2, dpr: Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 1.75) });
  const gl = renderer.gl;
  if (!renderer.isWebgl2) return;
  gl.clearColor(0, 0, 0, 0);
  const camera = new Camera(gl, { fov: 44, near: 0.3, far: 140 });
  camera.up.set(0, 0, 1);
  const scene = new Transform();
  const blend = { src: gl.SRC_ALPHA, dst: gl.ONE_MINUS_SRC_ALPHA };
  const fog = { uFog: { value: PAPER }, uFogRange: { value: [8, 70] } };
  const dpr = renderer.dpr;
  const res = { value: [1, 1] };

  // fills are opaque (no blending: cheap, and they draw before the lines); only soft shadows blend
  const fillProg = (color, extra = {}, blended = false) => new Program(gl, { vertex: FILL_VS, fragment: FILL_FS, uniforms: { uColor: { value: color }, uAlpha: { value: 1 }, uSweep: { value: -1 }, uXr: { value: [0, 1, 1] }, uYon: { value: 0 }, uYmin: { value: 0 }, ...fog, ...extra }, cullFace: null, transparent: blended, blendFunc: blended ? blend : undefined });
  const lineProg = (color, alpha, width = 1.4) => new Program(gl, { vertex: fatLineVS, fragment: LINE_FS, uniforms: { uColor: { value: color }, uAlpha: { value: alpha }, uDraw: { value: 2 }, uRes: res, uWidth: { value: width * dpr }, ...fog }, cullFace: null, transparent: true, blendFunc: blend, depthWrite: false });
  const geo = (b) => new Geometry(gl, { position: { size: 3, data: new Float32Array(b.p) }, index: { data: new Uint32Array(b.i) } });
  const addFill = (b, prog, parent = scene) => { const m = new Mesh(gl, { geometry: geo(b), program: prog }); m.frustumCulled = false; m.setParent(parent); return m; };
  const addLines = (b, prog, parent = scene) => { const m = new Mesh(gl, { geometry: fatLines(gl, b.p, b.i, b.n), program: prog }); m.frustumCulled = false; m.renderOrder = 5; m.setParent(parent); return m; };   // lines after fills (OGL otherwise sorts by shader id)

  // the client's printed artwork (cropped from their printer photo); falls back to flat lime if it cannot load
  const img = new Image(); img.src = '/img/print-artwork.jpg';
  try { await img.decode(); } catch { /* handled below */ }
  let texSource = img;
  if (!img.naturalWidth) { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.fillStyle = '#c8f31d'; g.fillRect(0, 0, 2, 2); texSource = c; }
  const tex = new Texture(gl, { image: texSource, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR, flipY: false, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
  const texProg = (extra = {}) => new Program(gl, { vertex: TEX_VS, fragment: TEX_FS, uniforms: { uTex: { value: tex }, uYon: { value: 0 }, uYmin: { value: 0 }, ...fog, ...extra }, cullFace: null });
  const texGeo = (b) => new Geometry(gl, { position: { size: 3, data: new Float32Array(b.p) }, uv: { size: 2, data: new Float32Array(b.uv) }, index: { data: new Uint32Array(b.i) } });
  const addTex = (b, prog, parent = scene) => { const m = new Mesh(gl, { geometry: texGeo(b), program: prog }); m.frustumCulled = false; m.setParent(parent); return m; };

  const scn = buildScene();
  await addCar(scn, CAR_AT);
  const FILL_COLOUR = { floor: PAPER, shadow: [0, 0, 0], wash: WASH, paper: PAPER, lime: LIME, white: PAPER, black: BLACK, c: CYAN, m: MAGENTA, y: YELLOW, k: BLACK };
  const FILL_ALPHA = { shadow: 0.1 };
  for (const [n, b] of Object.entries(scn.F)) if (!b.empty && n !== 'shadow') addFill(b, fillProg(FILL_COLOUR[n], FILL_ALPHA[n] ? { uAlpha: { value: FILL_ALPHA[n] } } : {}, !!FILL_ALPHA[n]));
  addTex(scn.T, texProg());
  addLines(scn.L.joint, lineProg(LINE, 0.13, 0.7));
  addLines(scn.L.fine, lineProg(LINE, 0.42, 0.8));
  addLines(scn.L.major, lineProg(LINE, 0.1, 1.0));
  addLines(scn.L.struct, lineProg(LINE, 0.4, 0.9));
  addLines(scn.L.ink, lineProg(LINE, 1, 1.2));
  addLines(scn.L.cut, lineProg(LINE, 1, 1.0));
  // the active station is marked on the floor: a lime wash inside a crisp navy outline
  const zones = scn.ZONES.map(([x0, x1, y0, y1]) => {
    const lb = new Batch(true); poly(lb, [[x0, y0, 0.012], [x1, y0, 0.012], [x1, y1, 0.012], [x0, y1, 0.012]], true);
    const crisp = lineProg(LINE, 0, 1.2); addLines(lb, crisp);
    const fb = new Batch(); fb.add([x0, y0, 0.009, x1, y0, 0.009, x1, y1, 0.009, x0, y1, 0.009], [0, 1, 2, 0, 2, 3]);
    const wash = fillProg(LIME, { uAlpha: { value: 0 } }, true); addFill(fb, wash);
    return { crisp, wash, a: 0 };
  });

  /* ---------- things that move with the scroll ---------- */
  // a node with coloured fills and blue lines built from batches
  const dyn = (fills, line, lineAlpha = 1) => {
    const node = new Transform(); node.setParent(scene);
    for (const [n, b] of Object.entries(fills)) if (!b.empty) addFill(b, fillProg(FILL_COLOUR[n]), node);
    if (line && !line.empty) addLines(line, lineProg(LINE, lineAlpha, 1.0), node);
    return node;
  };

  // briefs: three sheets slide from the letterbox slot to the desk (white sheet, lime header, blue text lines)
  const sheets = [0, 1, 2].map(() => {
    const f = { paper: new Batch(), lime: new Batch() }, l = new Batch(true);
    const w = 0.55, h = 0.75;
    f.paper.add([-w / 2, 0, 0, w / 2, 0, 0, w / 2, 0, h, -w / 2, 0, h], [0, 1, 2, 0, 2, 3]);
    f.lime.add([-w / 2 + 0.03, -0.004, h - 0.17, w / 2 - 0.03, -0.004, h - 0.17, w / 2 - 0.03, -0.004, h - 0.03, -w / 2 + 0.03, -0.004, h - 0.03], [0, 1, 2, 0, 2, 3]);
    l.add([-w / 2, 0, 0, w / 2, 0, 0, w / 2, 0, h, -w / 2, 0, h], [0, 1, 1, 2, 2, 3, 3, 0]);
    for (let r = 0; r < 5; r++) { const z = h - 0.27 - r * 0.1; l.add([-w / 2 + 0.07, 0, z, w / 2 - 0.07 - (r % 3) * 0.08, 0, z], [0, 1]); }
    return dyn(f, l);
  });

  // gantry carriage: slides along the beam while the printer runs; CMYK blocks on its face
  const carriage = (() => {
    const f = { wash: new Batch(), c: new Batch(), m: new Batch(), y: new Batch(), k: new Batch() }, l = new Batch(true);
    box({ fill: f.wash, line: l }, 0, 33.25 + P, 1.0, 0.95, 0.7, 0.75);
    [['c', 0], ['m', 1], ['y', 2], ['k', 3]].forEach(([n, i]) => box({ fill: f[n], line: l }, -0.33 + i * 0.22, 32.88 + P, 1.2, 0.16, 0.03, 0.32));
    return dyn(f, l);
  })();

  // the printed sheet: the client's artwork, revealed from the platen toward the output table as the printer runs
  const YA = 33.4 + P, YB = 32.0 + P, YC = 31.0 + P;      // platen edge, bend, far end
  const clipY = { value: YA + 0.1 };
  (() => {
    const zOf = (y) => (y >= YA ? 0.95 : y >= YB ? 0.58 + ((y - YB) / (YA - YB)) * 0.37 : 0.57 + ((y - YC) / (YB - YC)) * 0.01) + 0.006;
    const ys = (ya, yb) => [...new Set([yb, YA, YB, ya].filter((y) => y <= yb && y >= ya))].sort((p, q) => q - p);
    const strip = (B, x0, x1, ya, yb, lift = 0) => {
      const list = ys(ya, yb);
      for (let k = 0; k < list.length - 1; k++) {
        const y0 = list[k], y1 = list[k + 1];
        B.add([x0, y0, zOf(y0) + lift, x1, y0, zOf(y0) + lift, x1, y1, zOf(y1) + lift, x0, y1, zOf(y1) + lift], [0, 1, 2, 0, 2, 3]);
      }
    };
    const f = { paper: new Batch(), c: new Batch(), m: new Batch(), y: new Batch(), k: new Batch() };
    strip(f.paper, -2.6, 2.6, YC, YA);
    [['c', 0], ['m', 1], ['y', 2], ['k', 3]].forEach(([n, i]) => strip(f[n], -2.45 + i * 0.4, -2.17 + i * 0.4, YC + 0.08, YC + 0.24, 0.004));   // colour bar
    const yp = { uYon: { value: 1 }, uYmin: clipY };
    const node = new Transform(); node.setParent(scene);
    for (const [n, b] of Object.entries(f)) addFill(b, fillProg(FILL_COLOUR[n], yp), node);
    // the artwork, as textured strips split at the bends (image top toward the platen)
    const tb = new TexBatch(), x0 = -2.45, x1 = 2.45, ya = YC + 0.3, yb = YA - 0.2, lift = 0.004;
    const list = ys(ya, yb);
    for (let k = 0; k < list.length - 1; k++) {
      const y0 = list[k], y1 = list[k + 1], v0 = (yb - y0) / (yb - ya), v1 = (yb - y1) / (yb - ya);
      tb.quad([[x0, y0, zOf(y0) + lift], [x1, y0, zOf(y0) + lift], [x1, y1, zOf(y1) + lift], [x0, y1, zOf(y1) + lift]], [[0, v0], [1, v0], [1, v1], [0, v1]]);
    }
    addTex(tb, texProg(yp), node);
    const outline = new Batch(true);
    poly(outline, [[-2.6, YC, zOf(YC)], [2.6, YC, zOf(YC)], [2.6, YA, zOf(YA)], [-2.6, YA, zOf(YA)]], true);
    addLines(outline, lineProg(LINE, 1, 1.0), node);
  })();

  // dock door: roller slats that lift away as the journey ends
  const door = (() => {
    const f = { paper: new Batch() }, l = new Batch(true);
    f.paper.add([-3.55, 0, 0, 3.55, 0, 0, 3.55, 0, 4, -3.55, 0, 4], [0, 1, 2, 0, 2, 3]);
    for (let z = 0.5; z < 4; z += 0.5) l.add([-3.55, 0, z, 3.55, 0, z], [0, 1]);
    const node = dyn(f, l, 0.4); node.position.set(0, 61.1, 0);
    return node;
  })();

  /* ---------- callouts (HTML, so Arabic works) ---------- */
  const co = {};
  wrap.querySelectorAll('[data-co]').forEach((el) => { co[el.dataset.co] = { el, on: false }; });

  /* ---------- driving the camera from the scroll ---------- */
  let W = 1, H = 1, aspect = 1;
  const resize = () => {
    W = window.innerWidth; H = window.innerHeight; aspect = W / H;
    renderer.setSize(W, H);
    res.value = [W * dpr, H * dpr];
    camera.perspective({ aspect, fov: 44 + Math.max(0, 1 - aspect) * 14 });
    camera.projectionMatrix[8] = W >= 900 ? -0.3 * dir() : 0;   // off-axis: scene sits opposite the text on wide screens
  };
  resize();
  new ResizeObserver(resize).observe(document.documentElement);

  const target = { p: 0.18 }; const cur = { p: 0.18 };
  ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', onUpdate: (s) => { target.p = 0.18 + 0.82 * s.progress; }, onRefresh: (s) => { target.p = 0.18 + 0.82 * s.progress; } });

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  if (matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth - 0.5) * 2; pointer.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });

  const pos = new Vec3(), look = new Vec3(), v3 = new Vec3();
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const ease = (t) => t * t * (3 - 2 * t);
  let visible = false, last = performance.now(), slow = 0, frames = 0, dead = false, station = -1, lastPct = -1;

  function frame() {
    const now = performance.now(), dt = now - last; last = now;
    if (++frames > 50 && dt > 45) slow++; else if (dt < 30) slow = Math.max(0, slow - 1);
    if (slow > 50 && !dead) { dead = true; wrap.classList.add('is-off'); gsap.ticker.remove(tick); return; }

    cur.p += (target.p - cur.p) * 0.1;
    const p = cur.p;
    pointer.sx += (pointer.x - pointer.sx) * 0.05; pointer.sy += (pointer.y - pointer.sy) * 0.05;
    sample(p, pos, 1); sample(p, look, 2);
    pos.x += pointer.sx * 0.35 * dir(); pos.z += -pointer.sy * 0.12;
    camera.position.copy(pos); camera.lookAt(look); camera.updateMatrixWorld();

    sheets.forEach((n, k) => {
      const t = ease(clamp01((p - 0.06 - k * 0.045) / 0.15));
      const lx = -3.2 + k * 0.62, ly = 5.84 - k * 0.02;                 // they land fanned out on the desk top (top = 0.85)
      n.position.set(-7.6 + (lx + 7.6) * t, 3.6 + (ly - 3.6) * t, 2.35 + (0.862 + k * 0.006 - 2.35) * t + Math.sin(t * Math.PI) * 0.5);
      n.rotation.z = (1 - t) * 0.5 * (k % 2 ? -1 : 1) + t * [-0.14, 0.08, -0.04][k];
      n.rotation.x = -(1 - t) * 0.2 - t * (Math.PI / 2);
      n.visible = t > 0.001;
    });
    // printing: the carriage sweeps the beam, the sheet is revealed as it leaves the platen
    const run = clamp01((p - 0.74) / 0.08);
    carriage.position.x = run > 0 && run < 1 ? Math.sin(run * 26) * 2.5 : -2.9;
    clipY.value = YA + 0.05 - ease(run) * 2.5;
    const lift = ease(clamp01((p - 0.88) / 0.09));
    door.scale.z = 1 - lift * 0.94; door.position.z = 4 * lift * 0.94;

    renderer.render({ scene, camera, sort: true, frustumCull: false });

    const zi = p < 0.36 ? 0 : p < 0.58 ? 1 : p < 0.72 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5;
    zones.forEach((z, i) => { z.a += ((i === zi ? 1 : 0) - z.a) * 0.12; z.crisp.uniforms.uAlpha.value = z.a; z.wash.uniforms.uAlpha.value = z.a * 0.1; });
    // title block: which sheet of the drawing set we are on
    const st = p < STATION_AT[0] ? 0 : p < STATION_AT[1] ? 1 : p < STATION_AT[2] ? 2 : 3;
    if (st !== station) { station = st; wrap.dataset.station = String(st); }
    // tracker: whole-percent progress through the story, read by CSS (bar width and counter)
    const pct = Math.round(clamp01((p - 0.18) / 0.82) * 100);
    if (pct !== lastPct) { lastPct = pct; wrap.style.setProperty('--pct', String(pct)); }

    const shown = [];
    for (const [key, c] of Object.entries(CALLOUTS)) {
      const o = co[key]; if (!o) continue;
      const on = p >= c[3] && p <= c[4];
      if (on !== o.on) { o.on = on; o.el.classList.toggle('is-on', on); }
      if (!on) continue;
      v3.set(c[0], c[1], c[2]); camera.project(v3);
      if (v3.z > 1) { o.el.classList.remove('is-on'); o.on = false; continue; }
      shown.push({ o, x: Math.min(Math.max((v3.x * 0.5 + 0.5) * W, 14), W - 14), y: Math.min(Math.max((1 - (v3.y * 0.5 + 0.5)) * H, 90), H - 120) });
    }
    declutter(shown, 28, 200);
    for (const { o, x, y } of shown) {
      o.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      o.el.classList.toggle('is-flip', x > W * 0.6);
    }
  }
  const tick = () => frame();
  new IntersectionObserver(([e]) => {
    const on = e.isIntersecting;
    wrap.classList.toggle('is-on', on);
    if (on && !visible) { visible = true; last = performance.now(); frames = 0; gsap.ticker.add(tick); }
    else if (!on && visible) { visible = false; gsap.ticker.remove(tick); }
  }, { rootMargin: '100px' }).observe(story);

  cur.p = target.p; frame();
  wrap.classList.add('is-ready');
  document.documentElement.classList.add('has-warehouse');
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
