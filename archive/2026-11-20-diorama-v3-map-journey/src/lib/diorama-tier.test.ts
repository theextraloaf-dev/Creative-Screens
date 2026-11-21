import assert from 'node:assert/strict';
import { test } from 'node:test';
import { postFor, qualityTier } from './diorama-timeline.ts';

test('post-processing per quality tier: phones keep grain and grade, lose the blur', () => {
  assert.deepEqual(postFor('high'), { dof: true, grain: true, grade: true, maxDpr: 2 });
  assert.deepEqual(postFor('low'), { dof: false, grain: true, grade: true, maxDpr: 1.5 });
});

test('tier follows the device', () => {
  assert.deepEqual(postFor(qualityTier({ width: 390 })), postFor('low'));
  assert.deepEqual(postFor(qualityTier({ width: 1600, deviceMemory: 8, cores: 8 })), postFor('high'));
});
