import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import en from '../i18n/en.json' with { type: 'json' };
import ar from '../i18n/ar.json' with { type: 'json' };
import { clients } from '../data/clients.ts';
import { beltRow } from './clients.ts';

test('every client has a unique slug, a name in both languages, and a logo file if it has one', () => {
  assert.ok(clients.length > 0);
  assert.equal(new Set(clients.map((c) => c.slug)).size, clients.length);
  for (const c of clients) {
    assert.ok(c.name.en && c.name.ar && c.name.en !== c.name.ar, `${c.slug}: name in both languages`);
    if (c.logo) assert.ok(fs.existsSync(path.join('public', c.logo)), `${c.slug}: ${c.logo} exists`);
  }
});

test('the clients section has its copy in both languages', () => {
  for (const k of ['clientsScript', 'clientsKicker', 'clientsTitle', 'clientsLead', 'clientsList', 'clientsPause', 'clientsPlay'] as const) {
    assert.ok(en.light[k] && ar.light[k] && en.light[k] !== ar.light[k], `light.${k}`);
  }
});

test('the rolling row repeats the clients until it is long enough, marking the repeats', () => {
  const row = beltRow(['a', 'b', 'c'], 8);
  assert.deepEqual(row.map((r) => r.item), ['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c']);
  assert.deepEqual(row.map((r) => r.repeat), [false, false, false, true, true, true, true, true, true]);
  assert.deepEqual(new Set(row.map((r) => r.key)).size, row.length, 'keys are unique');
});

test('a long enough list is not repeated, and an empty one gives an empty row', () => {
  const twelve = Array.from({ length: 12 }, (_, i) => i);
  assert.equal(beltRow(twelve, 10).length, 12);
  assert.ok(beltRow(twelve, 10).every((r) => !r.repeat));
  assert.deepEqual(beltRow([], 10), []);
});
