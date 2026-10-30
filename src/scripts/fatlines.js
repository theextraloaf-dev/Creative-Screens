import { Geometry } from 'ogl';

/* Thick screen-space lines with a LINE HIERARCHY, so a drawing reads as designed instead of random.
   Each segment optionally knows the two face normals it joins (nrm: 6 floats per segment). The vertex shader
   (fatLineVS in shaders.js) then draws: outer contours (one face toward the camera, one away) heavy,
   interior creases (both toward the camera) light, and hidden back edges not at all.
   Segments without normals (dimension lines, outlines, hatching) draw at a steady middle weight.
   pos: flat xyz array; idx: pairs of vertex indices (one pair per segment); nrm: optional per-segment normals. */
export function fatLines(gl, pos, idx, nrm) {
  const n = idx.length / 2;
  const A = new Float32Array(n * 12), O = new Float32Array(n * 12), S = new Float32Array(n * 4), E = new Float32Array(n * 4);
  const N1 = new Float32Array(n * 12), N2 = new Float32Array(n * 12), I = new Uint32Array(n * 6);
  const hasN = nrm && nrm.length >= n * 6;
  for (let k = 0; k < n; k++) {
    const a = idx[2 * k] * 3, c = idx[2 * k + 1] * 3;
    for (let j = 0; j < 4; j++) {
      const o = k * 4 + j;
      A[o * 3] = pos[a]; A[o * 3 + 1] = pos[a + 1]; A[o * 3 + 2] = pos[a + 2];
      O[o * 3] = pos[c]; O[o * 3 + 1] = pos[c + 1]; O[o * 3 + 2] = pos[c + 2];
      S[o] = j & 1 ? 1 : -1; E[o] = j >> 1;
      if (hasN) {
        N1[o * 3] = nrm[k * 6]; N1[o * 3 + 1] = nrm[k * 6 + 1]; N1[o * 3 + 2] = nrm[k * 6 + 2];
        N2[o * 3] = nrm[k * 6 + 3]; N2[o * 3 + 1] = nrm[k * 6 + 4]; N2[o * 3 + 2] = nrm[k * 6 + 5];
      }
    }
    const q = k * 4; I.set([q, q + 1, q + 2, q + 1, q + 3, q + 2], k * 6);
  }
  return new Geometry(gl, {
    position: { size: 3, data: A }, other: { size: 3, data: O }, side: { size: 1, data: S }, endf: { size: 1, data: E },
    n1: { size: 3, data: N1 }, n2: { size: 3, data: N2 }, index: { data: I },
  });
}

/* Face normals for the lines of an indexed mesh (the exported car parts): each line takes the normals of the
   (up to two) triangles that share it; a boundary edge has only one, so it is drawn at the steady middle weight. */
export function edgeNormals(pos, tris, lines, centre) {   // centre (optional): face normals are flipped to point away from it, so open panels with inverted winding still draw their edges
  const key = (a, b) => (a < b ? a * 1048576 + b : b * 1048576 + a);
  const triN = [];
  const adj = new Map();
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t] * 3, b = tris[t + 1] * 3, c = tris[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (centre) { const mx = (pos[a] + pos[b] + pos[c]) / 3 - centre[0], my = (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3 - centre[1], mz = (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3 - centre[2]; if (nx * mx + ny * my + nz * mz < 0) { nx = -nx; ny = -ny; nz = -nz; } }
    const ti = t / 3; triN.push([nx, ny, nz]);
    for (const [p, q] of [[tris[t], tris[t + 1]], [tris[t + 1], tris[t + 2]], [tris[t + 2], tris[t]]]) {
      const k = key(p, q); const list = adj.get(k); if (list) list.push(ti); else adj.set(k, [ti]);
    }
  }
  const out = new Float32Array((lines.length / 2) * 6);
  for (let s = 0; s < lines.length; s += 2) {
    const list = adj.get(key(lines[s], lines[s + 1]));
    if (!list || list.length < 2) continue;      // boundary or unknown: zeros = steady weight
    out.set(triN[list[0]], (s / 2) * 6); out.set(triN[list[1]], (s / 2) * 6 + 3);
  }
  return out;
}
