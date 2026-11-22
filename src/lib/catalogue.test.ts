import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import en from '../i18n/en.json' with { type: 'json' };
import ar from '../i18n/ar.json' with { type: 'json' };
import { subCategories } from '../data/sub-categories.ts';
import { subCategoryProducts } from '../data/sub-category-products.ts';
import { ranges } from '../data/ranges.ts';
import { rangePhotos } from '../data/range-photos.ts';

test('every range has its label in both languages, and every catalogue photo exists', () => {
  for (const [cat, subs] of Object.entries(subCategories)) {
    const e = en.services.items.find((s) => s.slug === cat);
    const a = ar.services.items.find((s) => s.slug === cat);
    assert.equal(e?.makes.length, subs.length, `${cat}: English range names`);
    assert.equal(a?.makes.length, subs.length, `${cat}: Arabic range names`);
    for (const sub of subs) {
      for (const p of subCategoryProducts[`${cat}/${sub}`] ?? []) assert.ok(fs.existsSync(path.join('public', p.image)), `${cat}/${sub}: ${p.image} exists`);
    }
  }
});

test('every range has a page: an explanation, and types (or catalogue pieces) named and explained in both languages', () => {
  const keys = Object.entries(subCategories).flatMap(([cat, subs]) => subs.map((sub) => `${cat}/${sub}`));
  assert.deepEqual(Object.keys(ranges).sort(), [...keys].sort(), 'one entry per range, no strays');
  for (const key of keys) {
    const info = ranges[key];
    assert.ok(info.intro.en && info.intro.ar && info.intro.en !== info.intro.ar, `${key}: explanation in both languages`);
    assert.ok(info.types.length > 0 || (subCategoryProducts[key] ?? []).length > 0, `${key}: has types or catalogue pieces`);
    for (const ty of info.types) {
      for (const f of ['name', 'line'] as const) assert.ok(ty[f].en && ty[f].ar && ty[f].en !== ty[f].ar, `${key}/${ty.slug}: ${f} in both languages`);
    }
  }
});

test('type slugs are unique within a service (they name its photos)', () => {
  for (const cat of Object.keys(subCategories)) {
    const slugs = Object.entries(ranges).filter(([k]) => k.startsWith(`${cat}/`)).flatMap(([, v]) => v.types.map((ty) => ty.slug));
    assert.equal(new Set(slugs).size, slugs.length, `${cat}: ${slugs.join(', ')}`);
  }
});

test('every type photo exists, belongs to a type and says where it came from', () => {
  const typeKeys = new Set(Object.entries(ranges).flatMap(([k, v]) => v.types.map((ty) => `${k.split('/')[0]}/${ty.slug}`)));
  for (const [key, ph] of Object.entries(rangePhotos)) {
    assert.ok(typeKeys.has(key), `${key} is a type`);
    assert.ok(fs.existsSync(path.join('public', ph.src)), `${key}: ${ph.src} exists`);
    assert.ok(['Unsplash', 'Pexels', 'Pixabay'].includes(ph.site) && /^https:\/\/(unsplash\.com|www\.pexels\.com|pixabay\.com)\//.test(ph.source), `${key}: free stock source`);
  }
});

test("LED screens carry FineLED's screen types as five ranges, every type with its photo", () => {
  assert.deepEqual(subCategories['led-screens'], ['indoor-outdoor', 'creative-led', 'rental-events', 'led-signs', 'installation']);
  const types = subCategories['led-screens'].flatMap((sub) => ranges[`led-screens/${sub}`].types);
  assert.equal(types.length, 12);
  for (const ty of types) assert.ok(rangePhotos[`led-screens/${ty.slug}`], `${ty.slug} has a photo`);
});
