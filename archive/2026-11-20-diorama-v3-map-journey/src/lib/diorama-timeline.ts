/* The diorama journey as a pure function of scroll progress (0..1).
   Config (stops, lanes, camera keys) lives in src/data/diorama.json and is shared with the Blender scripts in 3d/.
   Coordinates are Blender's (Z up, camera side is -Y); toGl() converts for Three.js. */
import cfg from '../data/diorama.json' with { type: 'json' };

export type Dir = 1 | -1;
export type Phase = 'map' | 'route' | 'dive' | 'street' | 'outro';
export type Vec3 = [number, number, number];
export interface CameraKey { eye: Vec3; target: Vec3; lens: number }
export interface Stop { n: number; service: string; canvasX: number; vanX: number }
export interface DioramaState {
  phase: Phase;
  /** 0..1 along the route across Oman (the van's position on the map path) */
  routeT: number;
  /** index of the city the van is holding at (route phase), else -1 */
  city: number;
  /** 0..1 within the dive phase (0 before, 1 after) */
  dive: number;
  /** 0..1 within the street phase (0 before, 1 after) */
  street: number;
  /** -1 before the first stop, else the visit-order index 0..4 */
  chapter: number;
  vanX: number;
  /** indexed by stop n-1, not visit order */
  fills: number[];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => { const c = clamp01(t); return c * c * (3 - 2 * c); };
const within = ([a, b]: number[], p: number) => clamp01((p - a) / (b - a));

/** Where the van parks for a stop. Right to left it parks just past the canvas from the other side (mirrored about
    the canvas), kept at least 2 m inside the street ends so it never drives off the plinth or backwards to a stop. */
export function stopVanX(stop: Stop, dir: Dir): number {
  if (dir === 1) return stop.vanX;
  return Math.min(cfg.vanEnd - 2, Math.max(cfg.vanStart + 2, 2 * stop.canvasX - stop.vanX));
}

export function stateAt(progress: number, dir: Dir): DioramaState {
  const p = clamp01(progress);
  const { phases, stopShare } = cfg;
  const stops = cfg.stops as Stop[];
  const visits = dir === 1 ? stops : [...stops].reverse();
  const start = dir === 1 ? cfg.vanStart : cfg.vanEnd;
  const exit = dir === 1 ? cfg.vanEnd : cfg.vanStart;

  const phase: Phase = p < phases.route[0] ? 'map' : p < phases.dive[0] ? 'route' : p < phases.street[0] ? 'dive'
    : p < phases.outro[0] ? 'street' : 'outro';
  // the route: one slot per city; the first is a hold at the start, every other drives in (eased) then holds
  const cities = cfg.route.stops;
  const rp = within(phases.route, p) * cities.length;
  const ck = Math.min(cities.length - 1, Math.floor(rp));
  const cu = rp >= cities.length ? 1 : rp - ck;
  const { drive: rd } = cfg.routeShare;
  let routeT = cities[0].t, city = -1;
  if (ck === 0) { routeT = cities[0].t; city = 0; }
  else if (cu < rd) routeT = cities[ck - 1].t + (cities[ck].t - cities[ck - 1].t) * smooth(cu / rd);
  else { routeT = cities[ck].t; city = ck; }
  if (phase !== 'route') city = -1;
  if (p >= phases.route[1]) routeT = 1;
  const dive = within(phases.dive, p);
  const street = within(phases.street, p);

  const fills = stops.map(() => 0);
  let chapter = -1;
  let vanX = start;
  const fillAt = stopShare.drive;
  const holdAt = stopShare.drive + stopShare.fill;

  const slots = street * visits.length;
  visits.forEach((stop, k) => {
    const u = clamp01(slots - k);           // local progress through this slot
    if (slots < k) return;
    const from = k === 0 ? start : stopVanX(visits[k - 1], dir);
    const to = stopVanX(stop, dir);
    vanX = u < fillAt ? from + (to - from) * smooth(u / fillAt) : to;
    fills[stop.n - 1] = clamp01((u - fillAt) / (holdAt - fillAt));
    if (u >= fillAt) chapter = k;
  });

  if (phase === 'outro') {
    const last = stopVanX(visits[visits.length - 1], dir);
    vanX = last + (exit - last) * smooth(within(phases.outro, p));
  }
  return { phase, routeT, city, dive, street, chapter, vanX, fills };
}

/** Stop numbers in the order the van meets them. */
export function visitOrder(dir: Dir): number[] {
  const ns = (cfg.stops as Stop[]).map((s) => s.n);
  return dir === 1 ? ns : [...ns].reverse();
}

/** Scroll progress in the middle of stop n's hold (where prev/next buttons land): filled, van parked. */
export function stopProgress(n: number, dir: Dir): number {
  const k = visitOrder(dir).indexOf(n);
  const { drive, fill, hold } = cfg.stopShare;
  const [a, b] = cfg.phases.street;
  return a + (b - a) * ((k + drive + fill + hold / 2) / cfg.stops.length);
}

/** Pointer gesture on the scene: a mostly sideways drag drives the van, a mostly vertical one scrolls, tiny moves are taps. */
export function dragIntent(dx: number, dy: number): 'drive' | 'scroll' | 'none' {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < 6) return 'none';
  return ax > 1.4 * ay ? 'drive' : 'scroll';
}

/** The stop whose hotspot is live: from the start of its fill to the end of its slot; none while driving or off the street. */
export function postcardFor(state: DioramaState, dir: Dir): number | null {
  if (state.phase !== 'street') return null;
  const n = cfg.stops.length;
  const slots = state.street * n;
  const k = Math.min(n - 1, Math.floor(slots));
  return slots - k >= cfg.stopShare.drive ? visitOrder(dir)[k] : null;
}

export function vanPose(state: DioramaState, dir: Dir): { x: number; y: number; yaw: number; scale: 1 } {
  return { x: state.vanX, y: dir === 1 ? cfg.laneY : cfg.rtl.laneY, yaw: dir === 1 ? 0 : Math.PI, scale: 1 };
}

export function followCamera(vanX: number, dir: Dir): CameraKey {
  const { eye, target, lens } = cfg.follow;
  return {
    eye: [vanX + dir * eye[0], eye[1], eye[2]],
    target: [vanX + dir * target[0], target[1], target[2]],
    lens,
  };
}

export function lerpCamera(a: CameraKey, b: CameraKey, t: number): CameraKey {
  const s = smooth(t);
  const mix = (x: number, y: number) => x + (y - x) * s;
  const mix3 = (x: Vec3, y: Vec3): Vec3 => [mix(x[0], y[0]), mix(x[1], y[1]), mix(x[2], y[2])];
  return { eye: mix3(a.eye, b.eye), target: mix3(a.target, b.target), lens: mix(a.lens, b.lens) };
}

/** Blender (x, y, z) -> glTF/Three (x, z, -y) */
export const toGl = (v: Vec3): Vec3 => [v[0], v[2], -v[1]];

/** What each quality tier draws after the scene: phones keep the grain and the grade (cheap, most of the "film"
    feel) and drop the tilt-shift blur (two full-screen blur passes). */
export function postFor(tier: 'high' | 'low'): { dof: boolean; grain: boolean; grade: boolean; maxDpr: number } {
  return tier === 'high' ? { dof: true, grain: true, grade: true, maxDpr: 2 } : { dof: false, grain: true, grade: true, maxDpr: 1.5 };
}

export function qualityTier(env: { width: number; deviceMemory?: number; cores?: number }): 'high' | 'low' {
  if (env.width < 768) return 'low';
  if (env.deviceMemory !== undefined && env.deviceMemory <= 4) return 'low';
  if (env.cores !== undefined && env.cores <= 4) return 'low';
  return 'high';
}
