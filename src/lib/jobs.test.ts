import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import en from '../i18n/en.json' with { type: 'json' };
import { jobs } from '../data/jobs.ts';
import {
  activeCard, cardPose, erodePath, galleryTravel, jobFromHash, jobHash, liftDelay, listIndex, moreJobs, placeAt, serviceCounts, placeY, slidePose, slideTarget, snapStep, stepTarget, tornPath,
} from './jobs-gallery.ts';

const SERVICES = en.services.items.map((s) => s.slug);

test('12 jobs with unique slugs, valid services, sample flags', () => {
  assert.equal(jobs.length, 12);
  assert.equal(new Set(jobs.map((j) => j.slug)).size, jobs.length);
  for (const j of jobs) {
    assert.ok(SERVICES.includes(j.service), `${j.slug}: service ${j.service}`);
    assert.equal(j.sample, true, `${j.slug} is a placeholder until the real jobs arrive`);
    assert.ok(j.photos.length >= 1, `${j.slug} photos`);
    for (const p of j.photos) assert.ok(fs.existsSync(path.join('public', p)), `${j.slug}: ${p} exists`);
    assert.ok(j.en.title && j.ar.title && j.en.title !== j.ar.title, `${j.slug}: titles in both languages`);
  }
});

test("jobs use the original site's images only, each with a look that says how to frame it", () => {
  for (const j of jobs) {
    assert.ok(['photo', 'object', 'drawing'].includes(j.look), `${j.slug}: look ${j.look}`);
    for (const p of j.photos) assert.ok(!p.startsWith('/diorama/'), `${j.slug}: ${p} is not a toy render`);
    if (j.look === 'drawing') assert.ok(j.photos.every((p) => p.startsWith('/plates/')), `${j.slug}: drawings are the plates`);
  }
});

test('cardPose is neutral at the anchor and leans away from it', () => {
  assert.deepEqual(cardPose(0, 1440), { rotY: 0, z: 0, scale: 1 });
  const right = cardPose(600, 1440), left = cardPose(-600, 1440);
  assert.ok(right.rotY < 0 && right.scale < 1 && right.z < 0);
  assert.ok(left.rotY > 0);
  assert.ok(Math.abs(cardPose(1e5, 1440).rotY) <= 18);
});

test('activeCard picks the nearest centre (both directions)', () => {
  assert.equal(activeCard([100, 500, 900], 480), 1);
  assert.equal(activeCard([900, 500, 100], 120), 2);
});

test('stepTarget clamps at the ends', () => {
  assert.equal(stepTarget(0, -1, 12), 0);
  assert.equal(stepTarget(11, 1, 12), 11);
  assert.equal(stepTarget(3, 1, 12), 4);
});

test('travel recomputes from widths', () => {
  assert.equal(galleryTravel(5000, 1440, 480), 4040);
  assert.equal(galleryTravel(500, 1440, 480), 0);
});

test('liftDelay keeps the loader up for at least 1.1 s', () => {
  assert.equal(liftDelay(0), 1100);
  assert.equal(liftDelay(1500), 0);
});

test('job hashes round-trip; unknown is undefined', () => {
  assert.equal(jobFromHash(jobHash(jobs[3].slug))?.slug, jobs[3].slug);
  assert.equal(jobFromHash('#job-nope'), undefined);
  assert.equal(jobFromHash(''), undefined);
});

test('listIndex maps scroll to the live service and clamps', () => {
  assert.equal(listIndex(0, 8), 0);
  assert.equal(listIndex(0.5, 8), 4);
  assert.equal(listIndex(1, 8), 7);
  assert.equal(listIndex(-1, 8), 0);
});

test('tornPath is deterministic and closed', () => {
  const a = tornPath(1440, 3), b = tornPath(1440, 3), c = tornPath(1440, 4);
  assert.ok(a.startsWith('M') && a.trim().endsWith('Z'));
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('erodePath: a coastline edge with floating islands, deterministic and inside its box', () => {
  const a = erodePath(1440, 240, 7), b = erodePath(1440, 240, 7), c = erodePath(1440, 240, 8);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.ok(a.edge.startsWith('M') && a.edge.trim().endsWith('Z'));
  assert.ok((a.edge.match(/M/g) ?? []).length >= 4, 'specks of the image show through the paper (holes)');
  assert.ok(a.islands.length >= 10, 'paper islands float below the edge');
  for (const d of [a.edge, ...a.islands]) {
    for (const [, x, y] of d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
      assert.ok(+x >= -0.01 && +x <= 1440.01 && +y >= -0.01 && +y <= 240.01, `point ${x},${y} inside the box`);
    }
  }
});

// the lit WebGL gallery (after biegajaca-sztuka.pl's works slider): s is a slide's start edge minus the frame's start
// edge (px), half its half-width, unit its height / 2.6
test('slidePose: the slide at the frame is flat, opaque and at depth 0', () => {
  const p = slidePose(0, 400, 250);
  assert.equal(p.z, 0); assert.equal(p.rotY, 0); assert.equal(p.opacity, 1);
});
test('slidePose: slides ahead recede and turn toward the frame, up to 0.35 rad, and stay opaque', () => {
  const next = slidePose(950, 400, 250);
  assert.ok(next.z < 0 && next.rotY < 0 && next.rotY >= -0.35); assert.equal(next.opacity, 1);
  assert.equal(slidePose(1e5, 400, 250).rotY, -0.35);
});
test('slidePose: a slide passing the frame fades out by 1.2 half-widths and turns the other way', () => {
  const going = slidePose(-240, 400, 250);
  assert.ok(going.opacity > 0 && going.opacity < 1 && going.rotY > 0);
  assert.equal(slidePose(-480, 400, 250).opacity, 0);
  assert.equal(slidePose(-950, 400, 250).opacity, 0);
});
test('slideTarget follows the scroll between slide positions and clamps', () => {
  const pos = [0, 1000, 2000, 3000];
  assert.equal(slideTarget(0, pos), 0); assert.equal(slideTarget(1, pos), 3000);
  assert.equal(slideTarget(0.5, pos), 1500); assert.equal(slideTarget(-1, pos), 0); assert.equal(slideTarget(2, pos), 3000);
});
test('snapStep rounds the progress to the nearest slide', () => {
  assert.equal(snapStep(0.04, 12), 0); assert.equal(snapStep(0.5, 12), 6 / 11); assert.equal(snapStep(1, 12), 1); assert.equal(snapStep(0.7, 1), 0);
});

// keeping the reader's place through a resize: the section under the top of the screen and how far into it they are
test('placeAt finds the section under the top of the screen and how far into it', () => {
  const boxes = [{ top: 0, h: 100 }, { top: 100, h: 200 }];
  assert.deepEqual(placeAt(150, boxes), { i: 1, ratio: 0.25 });
  assert.deepEqual(placeAt(-5, boxes), { i: 0, ratio: 0 });
  assert.deepEqual(placeAt(900, boxes), { i: 1, ratio: 1 });
});
test('placeY puts the reader at the same point of the re-measured section', () => {
  assert.equal(placeY({ i: 1, ratio: 0.25 }, [{ top: 0, h: 50 }, { top: 50, h: 400 }]), 150);
  assert.equal(placeY({ i: 5, ratio: 0.5 }, [{ top: 0, h: 50 }]), null);
});

// the Work page's filters and a job page's 'More jobs'
test('serviceCounts lists the services that have jobs, in the services order, counts adding up', () => {
  const order = SERVICES;
  const counts = serviceCounts(jobs, order);
  assert.equal(counts.reduce((a, c) => a + c.n, 0), jobs.length);
  assert.ok(counts.every((c) => c.n > 0));
  assert.deepEqual(counts.map((c) => c.service), order.filter((sv) => jobs.some((j) => j.service === sv)));
});
test('moreJobs leaves out the job itself and puts its own service first', () => {
  const j = jobs.find((x) => jobs.filter((y) => y.service === x.service).length > 1)!;
  const more = moreJobs(jobs, j.slug, 6);
  assert.equal(more.length, Math.min(6, jobs.length - 1));
  assert.ok(!more.some((x) => x.slug === j.slug));
  assert.equal(more[0].service, j.service);
});
