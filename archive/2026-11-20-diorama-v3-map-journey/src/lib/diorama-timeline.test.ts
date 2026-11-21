import assert from 'node:assert/strict';
import { test } from 'node:test';
import cfg from '../data/diorama.json' with { type: 'json' };
import {
  dragIntent, followCamera, lerpCamera, postcardFor, qualityTier, stateAt, stopProgress, stopVanX, toGl, vanPose, visitOrder, type Dir,
} from './diorama-timeline.ts';

const [S0, S1] = cfg.phases.street;
/** progress at local position u (0..1) inside visit slot k */
const at = (k: number, u: number) => S0 + (S1 - S0) * ((k + u) / 5);
const { drive, fill } = cfg.stopShare;
const visitStop = (k: number, dir: Dir) => (dir === 1 ? k : 4 - k);

const mid = (r: number[]) => (r[0] + r[1]) / 2;
test('phases map to scroll ranges', () => {
  assert.equal(stateAt(0, 1).phase, 'map');
  assert.equal(stateAt(mid(cfg.phases.route), 1).phase, 'route');
  assert.equal(stateAt(mid(cfg.phases.dive), 1).phase, 'dive');
  const d = stateAt(mid(cfg.phases.dive), 1).dive;
  assert.ok(d > 0 && d < 1, `dive ${d}`);
  assert.equal(stateAt(mid(cfg.phases.street), 1).phase, 'street');
  assert.equal(stateAt(0.99, 1).phase, 'outro');
});

// ---- v3: the van drives the route across Oman, pausing at each city
const [R0, R1] = cfg.phases.route;
const routeAt = (k: number, u: number) => R0 + (R1 - R0) * ((k + u) / cfg.route.stops.length);

test('the route starts at the first city and ends at Muscat', () => {
  assert.equal(stateAt(0, 1).routeT, 0);
  assert.equal(stateAt(R1 + 0.001, 1).routeT, 1);
  assert.equal(cfg.route.stops[cfg.route.stops.length - 1].slug, 'muscat');
});

test('the van holds at each city and the city is live while it holds', () => {
  cfg.route.stops.forEach((st, k) => {
    const s = stateAt(routeAt(k, 0.9), 1);
    assert.equal(s.city, k, `city ${st.slug}`);
    assert.ok(Math.abs(s.routeT - st.t) < 1e-9, `parked at ${st.slug}: ${s.routeT} vs ${st.t}`);
  });
});

test('between cities the van is on its way and no city is live', () => {
  for (let k = 1; k < cfg.route.stops.length; k++) {
    const s = stateAt(routeAt(k, 0.3), 1);
    assert.equal(s.city, -1);
    assert.ok(s.routeT > cfg.route.stops[k - 1].t && s.routeT < cfg.route.stops[k].t, `between ${k - 1} and ${k}: ${s.routeT}`);
  }
});

test('route progress only moves forward', () => {
  let prev = -1;
  for (let i = 0; i <= 400; i++) {
    const t = stateAt(i / 400, 1).routeT;
    assert.ok(t >= prev - 1e-12, `routeT went back at ${i / 400}`);
    prev = t;
  }
});

test('stateAt is a pure function of progress', () => {
  for (let i = 0; i < 200; i++) {
    const p = Math.random();
    const first = stateAt(p, 1);
    stateAt(Math.random(), 1);
    stateAt(Math.random(), -1);
    assert.deepEqual(stateAt(p, 1), first);
  }
});

test('fills are 0 before their stop and 1 after it', () => {
  for (const dir of [1, -1] as Dir[]) {
    for (let k = 0; k < 5; k++) {
      const before = stateAt(at(k, 0.001), dir).fills;
      const after = stateAt(at(k, drive + fill + 0.01), dir).fills;
      for (let j = 0; j < 5; j++) {
        const stop = visitStop(j, dir);
        if (j < k) { assert.equal(before[stop], 1); assert.equal(after[stop], 1); }
        if (j === k) { assert.equal(before[stop], 0); assert.equal(after[stop], 1); }
        if (j > k) { assert.equal(before[stop], 0); assert.equal(after[stop], 0); }
      }
    }
  }
});

test('the van is parked during fill and hold', () => {
  for (const u of [drive + 0.01, drive + fill / 2, drive + fill + 0.05, 0.99]) {
    assert.equal(stateAt(at(2, u), 1).vanX, -6.5);
  }
});

test('the van eases between stops and leaves at the end', () => {
  assert.equal(stateAt(0, 1).vanX, cfg.vanStart);
  assert.equal(stateAt(0, -1).vanX, cfg.vanEnd);
  const mid = stateAt(at(1, drive / 2), 1).vanX;
  assert.ok(mid > -35 && mid < -21, `mid ${mid}`);
  assert.equal(stateAt(1, 1).vanX, cfg.vanEnd);
  assert.equal(stateAt(1, -1).vanX, cfg.vanStart);
});

test('rtl visits stops in reverse', () => {
  const first = stateAt(at(0, drive + fill + 0.01), -1).fills;
  assert.equal(first[4], 1);
  assert.equal(first[0], 0);
  const last = stateAt(at(4, drive + fill + 0.01), -1).fills;
  assert.equal(last[0], 1);
  assert.equal(stopVanX(cfg.stops[2], -1), 7.5);
  assert.equal(stateAt(at(0, drive + 0.01), -1).vanX, stopVanX(cfg.stops[4], -1));
});

test('every stop keeps the van on the street, and the van only drives forward', () => {
  for (const dir of [1, -1] as Dir[]) {
    for (const s of cfg.stops) {
      const x = stopVanX(s, dir);
      assert.ok(x >= cfg.vanStart && x <= cfg.vanEnd, `dir ${dir} stop ${s.n} at ${x} is off the street`);
    }
    let prev = stateAt(0, dir).vanX;
    for (let i = 1; i <= 400; i++) {
      const x = stateAt(i / 400, dir).vanX;
      assert.ok(dir === 1 ? x >= prev - 1e-9 : x <= prev + 1e-9, `dir ${dir}: van reverses at ${i / 400} (${prev} -> ${x})`);
      prev = x;
    }
  }
});

test('rtl van is rotated, never mirrored', () => {
  const s = stateAt(0.5, -1);
  const p = vanPose(s, -1);
  assert.equal(p.yaw, Math.PI);
  assert.equal(p.scale, 1);
  assert.equal(p.y, cfg.rtl.laneY);
  assert.equal(vanPose(stateAt(0.5, 1), 1).yaw, 0);
  assert.equal(vanPose(stateAt(0.5, 1), 1).y, cfg.laneY);
});

test('chapter is -1 before the street and counts in visit order', () => {
  assert.equal(stateAt(mid(cfg.phases.route), 1).chapter, -1);
  assert.equal(stateAt(at(0, drive / 2), 1).chapter, -1);
  for (const dir of [1, -1] as Dir[]) {
    assert.equal(stateAt(at(0, drive + 0.01), dir).chapter, 0);
    assert.equal(stateAt(at(3, drive + 0.01), dir).chapter, 3);
  }
  assert.equal(stateAt(0.99, 1).chapter, 4);
});

test('street progress runs 0..1 inside the street phase only', () => {
  assert.equal(stateAt(mid(cfg.phases.dive), 1).street, 0);
  assert.equal(stateAt(0.97, 1).street, 1);
  const s = stateAt((S0 + S1) / 2, 1).street;
  assert.ok(Math.abs(s - 0.5) < 1e-9);
});

test('follow camera mirrors offsets in rtl', () => {
  assert.equal(followCamera(0, -1).eye[0], -3);
  assert.equal(followCamera(0, -1).target[0], -5);
  assert.equal(followCamera(10, 1).eye[0], 13);
  assert.equal(followCamera(10, 1).lens, 35);
});

test('lerpCamera eases from a to b', () => {
  const a = { eye: [0, 0, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number], lens: 20 };
  const b = { eye: [10, 10, 10] as [number, number, number], target: [2, 2, 2] as [number, number, number], lens: 40 };
  assert.deepEqual(lerpCamera(a, b, 0), a);
  assert.deepEqual(lerpCamera(a, b, 1), b);
  assert.deepEqual(lerpCamera(a, b, 0.5).eye, [5, 5, 5]);
  assert.ok(lerpCamera(a, b, 0.25).lens < 25, 'smoothstep is slower than linear at the start');
});

test('toGl swaps axes', () => {
  assert.deepEqual(toGl([1, 2, 3]), [1, 3, -2]);
});

test('quality tier', () => {
  assert.equal(qualityTier({ width: 390 }), 'low');
  assert.equal(qualityTier({ width: 1440, deviceMemory: 8, cores: 8 }), 'high');
  assert.equal(qualityTier({ width: 1440, deviceMemory: 4 }), 'low');
  assert.equal(qualityTier({ width: 1440, cores: 4 }), 'low');
});

test('every stop has copy in both languages', async () => {
  const en = (await import('../i18n/en.json', { with: { type: 'json' } })).default as Record<string, any>;
  const ar = (await import('../i18n/ar.json', { with: { type: 'json' } })).default as Record<string, any>;
  for (const [lang, m] of [['en', en], ['ar', ar]] as const) {
    assert.ok(m.diorama, `${lang}: diorama block`);
    assert.equal(m.diorama.stops.length, 5, `${lang}: five stops`);
    for (const s of m.diorama.stops) assert.ok(s.title.trim() && s.text.trim() && s.cta.trim(), `${lang}: stop copy`);
    assert.deepEqual(Object.keys(m.diorama.labels).sort(),
      ['jebel_shams', 'musandam', 'muscat', 'nizwa', 'salalah', 'sharqiya'], `${lang}: map labels`);
    for (const k of ['eyebrow', 'title', 'lead', 'stillAlt', 'credits']) assert.ok(m.diorama[k]?.trim(), `${lang}: ${k}`);
    assert.ok(m.meta.previewTitle, `${lang}: meta.previewTitle`);
  }
  assert.equal(ar.diorama.labels.muscat, 'مسقط');
  assert.equal(ar.diorama.labels.musandam, 'مسندم');
});

test('progress is clamped', () => {
  assert.deepEqual(stateAt(-1, 1), stateAt(0, 1));
  assert.deepEqual(stateAt(2, 1), stateAt(1, 1));
});

test('rtl lane is the far lane', () => {
  assert.equal(cfg.rtl.laneY, 1.75);
  assert.equal(vanPose(stateAt(0.5, -1), -1).y, 1.75);
  assert.equal(vanPose(stateAt(0.5, 1), 1).y, -1.75);
});

test('visitOrder follows direction', () => {
  assert.deepEqual(visitOrder(1), [1, 2, 3, 4, 5]);
  assert.deepEqual(visitOrder(-1), [5, 4, 3, 2, 1]);
});

test("stopProgress lands inside the stop's hold", () => {
  for (const dir of [1, -1] as Dir[]) {
    for (const s of cfg.stops) {
      const st = stateAt(stopProgress(s.n, dir), dir);
      assert.equal(st.fills[s.n - 1], 1, `dir ${dir} stop ${s.n} filled`);
      assert.equal(st.vanX, stopVanX(s, dir), `dir ${dir} stop ${s.n} parked`);
    }
  }
});

test('dragIntent separates drive, scroll and taps', () => {
  assert.equal(dragIntent(3, 2), 'none');
  assert.equal(dragIntent(40, 10), 'drive');
  assert.equal(dragIntent(-40, 5), 'drive');
  assert.equal(dragIntent(10, 40), 'scroll');
  assert.equal(dragIntent(20, 18), 'scroll');
});

test('postcardFor(state) closes when the van leaves the stop', () => {
  for (const dir of [1, -1] as Dir[]) {
    const order = visitOrder(dir);
    for (let k = 0; k < 5; k++) {
      assert.equal(postcardFor(stateAt(at(k, drive / 2), dir), dir), null, `dir ${dir} slot ${k} driving`);
      assert.equal(postcardFor(stateAt(at(k, drive + 0.01), dir), dir), order[k], `dir ${dir} slot ${k} fill`);
      assert.equal(postcardFor(stateAt(at(k, 0.97), dir), dir), order[k], `dir ${dir} slot ${k} hold`);
    }
    assert.equal(postcardFor(stateAt(0.01, dir), dir), null, 'none over the map');
  }
});

test('pins are inside Oman', () => {
  assert.equal(cfg.pins.length, 6);
  for (const p of cfg.pins) {
    assert.ok(p.lon >= 51.8 && p.lon <= 59.9 && p.lat >= 16.6 && p.lat <= 26.5, p.slug);
    assert.ok(cfg.stops.some((s) => s.service === p.service), `${p.slug} service ${p.service}`);
  }
});
