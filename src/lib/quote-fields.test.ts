import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerRows, formatSize, type FieldDef } from './quote-fields.ts';

const sizeLabels = { width: 'Width', height: 'Height' };
const fields: FieldDef[] = [
  { key: 'type', kind: 'chips', label: 'Type', options: ['Shopfront', 'Neon'] },
  { key: 'lit', kind: 'select', label: 'Lighting', options: ['Lit', 'Unlit'] },
  { key: 'qty', kind: 'text', label: 'Quantity' },
  { key: 'size', kind: 'size', label: 'Size' },
  { key: 'when', kind: 'date', label: 'Event date' },
];

test('size joins width and height with the unit, and copes with one side', () => {
  assert.equal(formatSize('3', '1.2', 'm', sizeLabels), '3 × 1.2 m');
  assert.equal(formatSize('300', '', 'cm', sizeLabels), 'Width 300 cm');
  assert.equal(formatSize('', '90', 'cm', sizeLabels), 'Height 90 cm');
  assert.equal(formatSize('', '', 'm', sizeLabels), '');
});

test('only answered fields become rows, in the order asked, trimmed', () => {
  const rows = answerRows(fields, { type: 'Neon', qty: '  2 ', size_w: '4', size_h: '1', size_u: 'm', when: '2026-12-01' }, sizeLabels);
  assert.deepEqual(rows, [['Type', 'Neon'], ['Quantity', '2'], ['Size', '4 × 1 m'], ['Event date', '2026-12-01']]);
});

test('a choice that is not one of the options is dropped (left over from another service)', () => {
  const rows = answerRows(fields, { type: 'Roll-up banner', lit: 'Lit' }, sizeLabels);
  assert.deepEqual(rows, [['Lighting', 'Lit']]);
});

test('the message uses the short label when a field has one', () => {
  const rows = answerRows([{ key: 'k', kind: 'text', label: 'What do you need from us?', short: 'Scope' }], { k: 'Install' }, sizeLabels);
  assert.deepEqual(rows, [['Scope', 'Install']]);
});

test('nothing answered gives no rows', () => {
  assert.deepEqual(answerRows(fields, {}, sizeLabels), []);
});
