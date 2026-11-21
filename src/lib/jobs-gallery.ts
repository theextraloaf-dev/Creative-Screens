/* Pure maths for the light preview (docs/superpowers/specs/2026-11-20-clean-light-jobs-gallery-design.md):
   the pinned jobs gallery, the loader timing, the services list and the torn-paper edges. No DOM here. */
import { jobs, type Job } from '../data/jobs.ts';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** How a card sits by its distance from the anchor (px, card centre minus anchor x): flat and full size at the anchor,
    turning away (up to 18 deg), receding and shrinking as it moves off. */
export function cardPose(offset: number, viewW: number): { rotY: number; z: number; scale: number } {
  const u = clamp(offset / Math.max(1, viewW), -1, 1);
  const a = Math.abs(u);
  return { rotY: u === 0 ? 0 : -18 * u, z: a === 0 ? 0 : -160 * a, scale: 1 - 0.14 * a };
}

/** A slide in the lit WebGL gallery (biegajaca-sztuka.pl's works slider), by s = its start edge minus the frame's start
    edge (px, along the reading direction). Slides ahead recede (0.12 px back per px away) and turn toward the frame
    (0.06 rad per unit, up to 0.35); a slide passing the frame turns the other way and fades out over 1.2 half-widths.
    unit = slide height / 2.6, the slider's own scale. */
export function slidePose(s: number, half: number, unit: number): { z: number; rotY: number; opacity: number } {
  return {
    z: s === 0 ? 0 : -0.12 * Math.abs(s),
    rotY: s === 0 ? 0 : clamp(-0.06 * (s / unit), -0.35, 0.35),
    opacity: clamp(1 + s / (1.2 * half), 0, 1),
  };
}

/** Where the slides should be for a scroll progress (0..1): between the two nearest slide positions, not stepped. */
export function slideTarget(progress: number, positions: number[]): number {
  const n = positions.length;
  if (n < 2) return positions[0] ?? 0;
  const t = clamp(progress, 0, 1) * (n - 1), i = Math.min(Math.floor(t), n - 2);
  return positions[i] + (positions[i + 1] - positions[i]) * (t - i);
}

/** The progress of the slide nearest a scroll progress (where the gallery settles once the scroll stops). */
export const snapStep = (progress: number, n: number) => (n < 2 ? 0 : Math.round(clamp(progress, 0, 1) * (n - 1)) / (n - 1));

/** Index of the card whose centre is nearest the anchor. */
export function activeCard(centers: number[], anchor: number): number {
  let best = 0;
  centers.forEach((c, i) => { if (Math.abs(c - anchor) < Math.abs(centers[best] - anchor)) best = i; });
  return best;
}

/** The card an arrow press goes to, never past either end. */
export const stepTarget = (i: number, delta: 1 | -1, n: number) => clamp(i + delta, 0, n - 1);

/** How far the track moves while the gallery is pinned: what does not fit beside the column. */
export const galleryTravel = (trackW: number, viewW: number, colW: number) => Math.max(0, trackW - (viewW - colW));

/** How much longer the loader stays up so its route can draw (at least 1.1 s on screen). */
export const liftDelay = (elapsedMs: number) => Math.max(0, 1100 - elapsedMs);

export const jobHash = (slug: string) => `#job-${slug}`;
export function jobFromHash(hash: string): Job | undefined {
  const m = /^#job-([a-z0-9-]+)$/.exec(hash || '');
  return m ? jobs.find((j) => j.slug === m[1]) : undefined;
}

/** The live row of the pinned services list for a scroll progress 0..1. */
export const listIndex = (progress: number, n: number) => clamp(Math.floor(clamp(progress, 0, 1) * n), 0, n - 1);

/** A torn-paper top edge, deterministic per seed, closed down to a 100-unit-high box (viewBox 0 0 width 100). */
export function tornPath(width: number, seed: number, amp = 18): string {
  let s = (seed * 9301 + 49297) % 233280;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pts: string[] = [];
  const step = Math.max(8, width / 90);
  for (let x = 0; x <= width + 0.01; x += step) {
    const y = amp * 0.5 + (rnd() - 0.5) * amp + Math.sin(x / (width / 6) + seed) * amp * 0.35;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M0,100 L${pts.join(' L')} L${width},100 Z`;
}

/** An eroded paper edge, like the Expedia pages: the upper colour wears away along a ragged coastline into what lies
    below, leaving paper islands floating under the edge and a few specks of the lower layer showing through the paper.
    Box 0 0 width height; the paper is the top. `edge` is filled with evenodd (its extra subpaths are the holes). */
export function erodePath(width: number, height: number, seed: number): { edge: string; islands: string[] } {
  let s = (seed * 2654435761) >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const cl = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const f = (v: number) => v.toFixed(1);
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const base = height * 0.38, amp = height * 0.2;
  const boundary = (x: number) => cl(base + amp * (0.55 * Math.sin(x / width * 5.1 + ph[0]) + 0.3 * Math.sin(x / width * 13.7 + ph[1])
    + 0.18 * Math.sin(x / width * 31 + ph[2]) + 0.1 * Math.sin(x / width * 67 + ph[3])), 6, height * 0.78);
  const blob = (cx: number, cy: number, r: number, n: number) => {
    const pts: string[] = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, rr = r * (0.6 + rnd() * 0.65);
      pts.push(`${f(cl(cx + Math.cos(a) * rr * 1.4, 0, width))},${f(cl(cy + Math.sin(a) * rr, 0, height))}`);
    }
    return `M${pts.join(' L')} Z`;
  };
  // the coastline: fine jagged steps on top of the long swell
  const pts: string[] = [];
  const step = width / 220;
  for (let x = 0; x <= width + 0.01; x += step) pts.push(`${f(cl(x, 0, width))},${f(cl(boundary(x) + (rnd() - 0.5) * height * 0.06, 0, height))}`);
  let edge = `M0,0 L${pts.join(' L')} L${f(width)},0 Z`;
  // specks of the lower layer showing through the paper, just above the coast
  for (let i = 0; i < 9; i++) {
    const x = rnd() * width, y = boundary(x) - (8 + rnd() * height * 0.14);
    if (y > 4) edge += ` ${blob(x, y, 2 + rnd() * 6, 9)}`;
  }
  // paper islands floating below the coast, bigger near it
  const islands: string[] = [];
  for (let i = 0; i < 22; i++) {
    const x = rnd() * width, d = rnd() ** 1.6;
    const y = boundary(x) + 10 + d * (height - boundary(x) - 16);
    islands.push(blob(x, Math.min(y, height - 4), (1 - d) * (6 + rnd() * 22) + 2, 11));
  }
  return { edge, islands };
}

/** Where the reader is: the section (by index) under the top of the screen, and how far into it (0..1). Boxes are
    the sections' page top and height, in page order; above the first counts as its start, past the last as its end. */
export function placeAt(y: number, boxes: { top: number; h: number }[]): { i: number; ratio: number } {
  const i = boxes.findIndex((b) => y < b.top + b.h);
  if (i === -1) return { i: boxes.length - 1, ratio: 1 };
  const b = boxes[i];
  return { i, ratio: b.h > 0 ? clamp((y - b.top) / b.h, 0, 1) : 0 };
}

/** The scroll that puts the reader back at a place after the sections were re-measured (null if it is gone). */
export function placeY(place: { i: number; ratio: number }, boxes: { top: number; h: number }[]): number | null {
  const b = boxes[place.i];
  return b ? Math.round(b.top + place.ratio * b.h) : null;
}

/** The Work page's filters: each service that has jobs, in the given service order, with how many. */
export function serviceCounts(list: Job[], order: string[]): { service: string; n: number }[] {
  return order.map((service) => ({ service, n: list.filter((j) => j.service === service).length })).filter((c) => c.n > 0);
}

/** A job page's "More jobs": every other job, its own service first, then the rest in list order. */
export function moreJobs(list: Job[], slug: string, n: number): Job[] {
  const self = list.find((j) => j.slug === slug);
  const others = list.filter((j) => j.slug !== slug);
  const same = others.filter((j) => j.service === self?.service);
  return [...same, ...others.filter((j) => j.service !== self?.service)].slice(0, n);
}
