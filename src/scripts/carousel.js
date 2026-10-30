/* Shared by "What we make" and the job tickets: the sideways carousel from the A24 film library.
   Cards sit in a row, tilted like discs on a table and overlapping; page scroll slides the row so one card at a time
   settles in the middle. settle() turns scroll progress into a card position that dwells on each card. */
export function settle(p, n) {
  const raw = Math.min(Math.max(p, 0), 1) * (n - 1);
  const i = Math.floor(raw);
  const t = Math.min(Math.max((raw - i - 0.3) / 0.4, 0), 1); // dwell on each card for ~60% of its share
  return Math.min(i + t * t * (3 - 2 * t), n - 1);
}

export function place(cards, f, spacing, rtl, { tilt = 24, depth = 90, shrink = 0.14 } = {}) {
  const dir = rtl ? -1 : 1;
  cards.forEach((el, i) => {
    const d = i - f;
    const a = Math.abs(d);
    const turn = Math.max(-1.6, Math.min(1.6, d));
    // each card carries its own perspective so the stacking order (z-index) decides what sits in front
    el.style.transform = `translate(-50%, -50%) perspective(1600px) translateX(${(d * spacing * dir).toFixed(1)}px) translateZ(${(-a * depth).toFixed(1)}px) rotateY(${(-turn * tilt * dir).toFixed(2)}deg) rotateZ(${((-3 + d * 1.5) * tilt / 24).toFixed(2)}deg) scale(${(1 - Math.min(a, 2) * shrink).toFixed(3)})`;
    el.style.zIndex = String(100 - Math.round(a * 10));
    el.style.opacity = a > 2.6 ? '0' : a < 0.5 ? '1' : String(Math.max(0.35, 1 - (a - 0.5) * 0.45).toFixed(2));
    el.classList.toggle('is-center', a < 0.5);
  });
}

/* how settled the centre card is: 1 when it is exactly in the middle, 0 half a card away */
export const centred = (f) => 1 - Math.min(Math.abs(f - Math.round(f)) * 2, 1);

/* a hand-drawn loop (a little more than one turn, wobbly) for the ring around the centre card */
export function ringPath(cx = 100, cy = 100, rx = 92, ry = 84, seed = 3) {
  const pts = [];
  const turns = 1.12;
  for (let k = 0; k <= 64; k++) {
    const t = (k / 64) * turns * Math.PI * 2 - 2.3;
    const w = 1 + 0.035 * Math.sin(t * 3 + seed) + 0.02 * Math.sin(t * 7 + seed * 2) + (k / 64) * 0.05;
    pts.push([cx + Math.cos(t) * rx * w, cy + Math.sin(t) * ry * w]);
  }
  return 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L');
}
