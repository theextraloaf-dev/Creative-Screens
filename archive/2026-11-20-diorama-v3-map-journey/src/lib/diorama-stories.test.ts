import assert from 'node:assert/strict';
import { test } from 'node:test';
import cfg from '../data/diorama.json' with { type: 'json' };
import { hotspotLabel, pinCopy, pinLabel, stories, storyBySlug, storySlugs, storyUrl } from '../data/diorama-stories.ts';

test('every hotspot and pin has a label in both languages', () => {
  for (const s of cfg.stops) {
    for (const loc of ['en', 'ar'] as const) {
      const l = hotspotLabel(s.n, loc);
      assert.ok(l.length > 8, `stop ${s.n} ${loc}: "${l}"`);
    }
    assert.notEqual(hotspotLabel(s.n, 'en'), hotspotLabel(s.n, 'ar'));
  }
  for (const p of cfg.pins) {
    assert.ok(pinCopy[p.slug], `pin copy for ${p.slug}`);
    for (const loc of ['en', 'ar'] as const) assert.ok(pinLabel(p.slug, loc).length > 4, `${p.slug} ${loc}`);
  }
});

test('one story per stop, matching its service, with copy in both languages', () => {
  assert.equal(stories.length, cfg.stops.length);
  for (const s of cfg.stops) {
    const st = stories.find((x) => x.n === s.n)!;
    assert.ok(st, `story ${s.n}`);
    for (const loc of ['en', 'ar'] as const) {
      for (const k of ['title', 'client', 'place', 'line', 'body'] as const) assert.ok(st[loc][k].trim(), `${s.n} ${loc} ${k}`);
    }
    assert.ok(st.photos.length >= 3, `story ${s.n} photos`);
    assert.equal(storyBySlug(st.slug)?.n, s.n);
  }
});

test('story urls are static routes in both languages', () => {
  assert.equal(storyUrl(1, 'en'), '/preview/signage/');
  assert.equal(storyUrl(5, 'ar'), '/ar/preview/flags/');
});

test('placeholder stories are flagged until the client sends real jobs', () => {
  for (const st of stories) assert.equal(typeof st.placeholder, 'boolean');
});

test('static story routes: one per stop, in stop order', () => {
  assert.deepEqual(storySlugs(), ['signage', 'wrap', 'led', 'stand', 'flags']);
});
