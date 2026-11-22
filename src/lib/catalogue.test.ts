import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import en from '../i18n/en.json' with { type: 'json' };
import ar from '../i18n/ar.json' with { type: 'json' };
import { subCategories } from '../data/sub-categories.ts';
import { subCategoryProducts } from '../data/sub-category-products.ts';

test('every range has its label in both languages, and every product photo exists', () => {
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

test("LED screens carry FineLED's screen types as five ranges of stock photos, named in both languages", () => {
  assert.deepEqual(subCategories['led-screens'], ['indoor-outdoor', 'creative-led', 'rental-events', 'led-signs', 'installation']);
  let n = 0;
  for (const sub of subCategories['led-screens']) {
    const items = subCategoryProducts[`led-screens/${sub}`] ?? [];
    assert.ok(items.length >= 1, `${sub} has at least one type`);
    for (const p of items) {
      n++;
      assert.equal(p.look, 'photo', `${p.slug} is a photo (fills its card)`);
      assert.ok(p.nameAr && p.nameAr !== p.name, `${p.slug} has an Arabic name`);
      assert.ok(p.image.startsWith('/subcategories/led-screens/'), `${p.slug}: ${p.image}`);
    }
  }
  assert.equal(n, 12);
});
