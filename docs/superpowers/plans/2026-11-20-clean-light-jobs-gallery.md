# Clean Light Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v3 3D journey on `/preview/` and `/ar/preview/` with a clean, light page. It has an Expedia-style loader, the services in giant stacked type, and a Biegajaca-style pinned sideways gallery of finished jobs.

**Architecture:**
- **Markup:** a server component (`LightPreview.tsx`) renders the whole page as plain, readable HTML.
- **Motion:** `src/scripts/light/` adds the motion when it is allowed: loader lift, type reveal, menu, gallery pin, lightbox.
- **Pure logic:** the gallery's maths, the loader timing and the job hashes live in `src/lib/jobs-gallery.ts`, with node tests.

**Tech Stack:** Next.js 16 static export, GSAP 3 ScrollTrigger, Lenis, node:test, fontsource.

**Spec:** `docs/superpowers/specs/2026-11-20-clean-light-jobs-gallery-design.md`

## Global Constraints
- **Light only:**
  - The page tokens are `--cream #efe6cf`, `--cream-2 #e6dabd`, `--sepia #4a3b2c` and `--sepia-2 #8a7860`.
  - Lime is a fill only. There are no dark overlays or navy blocks on this page, and the header is cream/sepia here.
- **Fonts:**
  - Big type is Unbounded (already installed).
  - Script accents are Yellowtail for English (`@fontsource/yellowtail@5.3.0`) and Aref Ruqaa for Arabic (`@fontsource/aref-ruqaa@5.3.0`), used for accents only.
- **Arabic:** right to left. The gallery glides the other way and the column sits on the right; nothing is mirrored.
- **Phones (< 768 px):** no pin; the gallery is a native swipe row with scroll-snap. Reduced motion or no JS: no loader, no pin, the gallery is a plain grid.
- **Loader:** first visit only (`localStorage['cs-light-loader']`), and it lifts within 1100–2200 ms.
- **Placeholders:** placeholder jobs carry `sample: true` and show a "Sample" tag.
- **Local only:** no git. "Commit" steps mean: append a ledger line.

## Review Focus
1. **Resize or rotate mid-gallery:** the pin length and card positions recompute; no blank gap and no stuck pin. Test: `galleryTravel` is called with the new widths on refresh (Task 1 test `travel recomputes from widths`).
2. **Arrows at the ends:** ← is disabled on the first card and → on the last; pressing them never scrolls past the section. Test: `stepTarget` clamps (Task 1).
3. **A shared `#job-<slug>` link:** it opens the lightbox on load, and an unknown slug is ignored without an error. Test: `jobFromHash` (Task 1).
4. **Arabic direction:** → means "next in reading order" in both languages, and the active card is the one nearest the column on its side. Test: `activeCard` with `dir -1` (Task 1).
5. **Keyboard:** Tab reaches every card's button, focusing a card brings it under the column, and Esc closes the lightbox and the menu. Covered by the browser check in Task 4.

---

### Task 1: Jobs data and gallery maths

**Files:**
- Create: `src/data/jobs.ts`
- Create: `src/lib/jobs-gallery.ts`
- Test: `src/lib/jobs.test.ts`

**Interfaces:**
- Produces:
  - `interface JobCopy { title: string; client: string; place: string; line: string }`
  - `interface Job { slug: string; service: ServiceSlug; year: number; sample: boolean; photos: string[]; en: JobCopy; ar: JobCopy }`
  - `jobs: Job[]` (12 placeholders, `photos` are `/diorama/stories/*.webp` paths)
  - `serviceLabel(slug, locale)`, which reads `messages(locale).services.items`
  - `cardPose(offset: number, viewW: number): { rotY: number; z: number; scale: number }`: `offset` is the card centre minus the anchor x, in px. The pose is rotY in degrees, clamped to ±18, with its sign following the offset; z ≤ 0; and scale in 0.86..1. At `offset 0` it is `{0, 0, 1}`.
  - `activeCard(centers: number[], anchor: number): number`: the index of the nearest centre.
  - `stepTarget(i: number, delta: 1 | -1, n: number): number`: clamped to 0..n-1.
  - `galleryTravel(trackW: number, viewW: number, colW: number): number`: the px the track moves, `max(0, trackW - (viewW - colW))`.
  - `liftDelay(elapsedMs: number): number`: `max(0, 1100 - elapsed)`; the caller also forces the lift at 2200.
  - `jobHash(slug)` returns `#job-<slug>`. `jobFromHash(hash)` returns a `Job` or `undefined`.

- [ ] **Step 1:** Write the tests in `src/lib/jobs.test.ts`:
  - `12 jobs with unique slugs, valid services, sample flags`. Each `service` is one of the eight `services.items` slugs. Every photo file exists under `public/` (`fs.existsSync`). Every job has `sample === true`. The `en` and `ar` titles are non-empty and differ.
  - `cardPose is neutral at the anchor and leans away from it`. At `cardPose(0, 1440)` the pose is `{rotY: 0, z: 0, scale: 1}`. At `cardPose(600, 1440)`, rotY < 0 and scale < 1. At `cardPose(-600, 1440)`, rotY > 0. At `cardPose(1e5, 1440)`, |rotY| ≤ 18.
  - `activeCard picks the nearest centre (both directions)`: `activeCard([100, 500, 900], 480) === 1` and `activeCard([900, 500, 100], 120) === 2`.
  - `stepTarget clamps at the ends`: `stepTarget(0, -1, 12) === 0`, `stepTarget(11, 1, 12) === 11` and `stepTarget(3, 1, 12) === 4`.
  - `travel recomputes from widths`: `galleryTravel(5000, 1440, 480) === 4040` and `galleryTravel(500, 1440, 480) === 0`.
  - `liftDelay`: 1100 at 0, 0 at 1500.
  - `job hashes round-trip; unknown is undefined`: `jobFromHash(jobHash(jobs[3].slug))?.slug === jobs[3].slug`, and `jobFromHash('#job-nope') === undefined`.
- [ ] **Step 2:** Run `npm test`. Expected: the new tests FAIL (module not found).
- [ ] **Step 3:** Implement `src/data/jobs.ts` and `src/lib/jobs-gallery.ts`.
  - For `cardPose`, let `u = clamp(offset / viewW, -1, 1)`. Then `rotY = -18 * u`, `z = -160 * |u|` and `scale = 1 - 0.14 * |u|`.
  - The job copy is placeholder copy, plainly worded, in EN and AR.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Ledger: `Task 1: complete`.

### Task 2: Page, palette, fonts, loader, giant type, menu

**Files:**
- Create: `src/components/LightPreview.tsx`
- Create: `src/components/LightPreview.css`
- Create: `src/scripts/light/index.js` (entry)
- Create: `src/scripts/light/menu.js`
- Modify: `src/app/(en)/preview/page.tsx`, `src/app/ar/preview/page.tsx`, `src/scripts/motion.js` (load `light/index.js` when `[data-light]` is on the page), `src/i18n/{en,ar}.json` (`light` block), `src/components/HtmlShell.tsx` (font imports), `package.json` (two fonts)
- Delete (archived): `src/components/Diorama*.{tsx,css}`, `src/scripts/diorama/`, `src/lib/diorama-*.ts`, `src/data/diorama*.{ts,json}`, `src/app/(en)/preview/[stop]/`, `src/app/ar/preview/[stop]/`, and the v3 strings in the i18n `diorama` block

**Interfaces:**
- Consumes: Task 1 `jobs`, `serviceLabel`, `liftDelay`.
- Produces:
  - The markup hooks `[data-light]` (page root), `[data-loadscreen]`, `[data-hero-type] a[data-service]`, `[data-hero-photo]`, `[data-services]` (menu dialog), `[data-services-open]`, `[data-gallery]`, `[data-track]`, `[data-card]`, `[data-count]`, `[data-job-title]`, `[data-job-meta]`, `[data-prev]`, `[data-next]`, `[data-see]` and `[data-lightbox]`.
  - `initLight({ gsap, ScrollTrigger })` in `index.js`.

- [ ] **Step 1:** Install `npm i @fontsource/yellowtail@5.3.0 @fontsource/aref-ruqaa@5.3.0`, then import their 400 css in `HtmlShell.tsx`. Add the `--font-script` token, which is Yellowtail, or Aref Ruqaa under `[lang=ar]`.
- [ ] **Step 2:** Write `LightPreview.tsx`, following the spec's page order (loader, hero type, jobs gallery, closing).
  - Hero: the eight service names come from `m.services.items`, each as `<a data-service href={hrefFor('services')}{slug}/>`. Each service's job photo is preloaded lazily and comes from the first job with that service, or from any job if none has it.
  - Gallery markup without JS: a heading column plus a grid of `<article data-card>` (photo, title, meta, "Sample" tag, a "See the job" button with `data-see`). It reads as content.
  - A `<dialog data-lightbox>`.
  - The menu dialog reuses the same stacked list.
- [ ] **Step 3:** Write `LightPreview.css`.
  - Scope it under `.light`, with the tokens from Global Constraints.
  - Header overrides apply under `body:has(.light) .hdr`: cream bar, sepia text.
  - The giant type is `clamp(2.6rem, 1rem + 6.4vw, 8rem)` at line-height 0.92.
  - The `.light__script` class uses `--font-script` in sepia-2.
  - Topographic contour paths are stroked `rgb(74 59 44 / .07)`.
  - Phone and reduced-motion layouts follow Global Constraints.
- [ ] **Step 4:** Write `index.js`: the loader (first visit; lift via `liftDelay`, forced at 2200), the hero type rise (GSAP, staggered 0.05), hover/focus fading the hero photo, and `initMenu`, ported from the archived `menu.js`. Wire it into `motion.js`.
- [ ] **Step 5:** Run `npx tsc --noEmit` and `npm test`, then `npm run build`. Expected: clean, all pass, exit 0.
- [ ] **Step 6:** Ledger: `Task 2: complete`.

### Task 3: Pinned sideways gallery and lightbox

**Files:**
- Create: `src/scripts/light/gallery.js`
- Create: `src/scripts/light/lightbox.js`
- Modify: `src/scripts/light/index.js`, `LightPreview.css`

**Interfaces:**
- Consumes: Task 1 `cardPose`, `activeCard`, `stepTarget`, `galleryTravel`, `jobHash` and `jobFromHash`, plus Task 2's hooks.
- Produces: `initGallery({ root, gsap, ScrollTrigger, dir, lenis })` and `initLightbox({ root, lenis })`, which returns `{ open(slug), close() }`.

- [ ] **Step 1:** In `gallery.js`, at ≥ 768 px with motion allowed:
  - **Pin:** a ScrollTrigger pins `[data-gallery]` for `galleryTravel(...)` px (`invalidateOnRefresh`). The scroll maps to `x = -dir * travel * progress` on `[data-track]`.
  - **Every frame:** each card gets `transform: perspective(1200px) translateZ(z) rotateY(rotY) scale(scale)` from `cardPose(cardCentre - anchor, innerWidth)`. The anchor is the column's inner edge plus half a card.
  - **Active card:** `activeCard` updates the count (`03 / 12`), title and meta, with a short cross-fade.
  - **Arrows:** they scroll Lenis to the scroll position that centres `stepTarget(...)`, and are disabled at the ends.
  - **Focus:** focusing a card scrolls it to the anchor.
  - **Phones / reduced motion:** below 768 px, a native `scroll-snap` row whose `scroll` events update the counter. With reduced motion: nothing (grid).
- [ ] **Step 2:** In `lightbox.js`, `[data-see]` opens `<dialog>` with the job's photos (a swipeable strip) and copy, and sets `location.hash = jobHash(slug)` via `history.pushState`. Esc, the close button and Back close it. On load, `jobFromHash(location.hash)` opens it if valid.
- [ ] **Step 3:** Run `npm run build`, then serve `out/` on 3101.
- [ ] **Step 4:** Ledger: `Task 3: complete`.

### Task 3b: Missouri-style 2D scroll reveals (added by the user mid-plan)

**Files:**
- Create: `src/scripts/light/reveals.js`
- Modify: `LightPreview.tsx`, `LightPreview.css`, `src/lib/jobs-gallery.ts` (+ test)

**Interfaces:**
- Produces:
  - `listIndex(progress: number, n: number): number`, which gives `min(n - 1, floor(progress * n))`, so `listIndex(1, 8) === 7` and `listIndex(0, 8) === 0`.
  - `tornPath(width: number, seed: number, amp = 18): string`, an SVG path whose top edge is ragged and deterministic, closed to the bottom (the test checks it starts with `M` and ends with `Z` and is stable for the same seed).
  - `initReveals({ root, gsap, ScrollTrigger, dir })`.

- [ ] **Step 1: Write the tests.**
  - `listIndex maps scroll to the live service and clamps`.
  - `tornPath is deterministic and closed`.

  Run `npm test` and expect them to FAIL.
- [ ] **Step 2: Implement both functions, then run `npm test`.** Expect PASS.
- [ ] **Step 3: Add the reveals in `reveals.js`.**
  - **Hero postcard:** a scrubbed tween on `[data-postcard]` takes it from `scale 1, rotate 0, radius 0` to `scale .78, rotate -3deg, radius 18px, y -8vh`. A cream border appears, and the page shows behind it.
  - **Statement lines:** each `.light__line` rises from `yPercent 110` inside an `overflow: hidden` mask as it enters (start `top 85%`).
  - **Stickers:** `[data-sticker]` gets `data-speed` parallax (`y` from `-speed*120` to `speed*120` across the section), with a small rotation.
  - **Torn edges:** `[data-torn]` sections carry an absolutely placed SVG (`tornPath`) at their top edge, in the section's own colour. The section background takes over the viewport as the edge passes, since it's in normal flow and the edge is part of it.
  - **Pinned services:** a ScrollTrigger pins `[data-services-list]` for `n * 60vh`. `listIndex(progress, 8)` sets `.is-live` and updates the counter `[data-svc-count]` and the photo `[data-svc-photo]` (cross-fade).
  - **Rising panel:** `[data-panel]` goes from `scale .9, y 12vh, radius 40px` to `1, 0, 24px`, scrubbed.
  - **Chapter bar:** `[data-chapters]` shows after the hero and fills its line with page progress.
  - **Phones:** the same reveals, but the services list is not pinned (it highlights per item as each scrolls to the centre). With reduced motion, none of it runs.
- [ ] **Step 4:** Run `npm run build` (exit 0). Ledger: `Task 3b: complete`.

### Task 4: Verify and finish

- [ ] **Step 1:** In the browser, check at 1440×900 in EN:
  - the loader (first visit; it does not show again on reload);
  - the hero type and the photo on hover;
  - the menu (opens, Esc, Tab trap);
  - the gallery (pin, perspective, counter, arrows disabled at the ends, Tab to cards);
  - the lightbox (open, hash, Back, a shared-hash load);
  - no console errors.
- [ ] **Step 2:** In AR, check the direction and the column side. On a phone (375×812), check the swipe row and counter. With reduced motion (CSS media emulation via the `motion` class absent), check the grid.
- [ ] **Step 3:** Run `npm test` and `npm run build`. Save screenshots to `docs/superpowers/lookdev/2026-11-20-light/`.
- [ ] **Step 4:** Final review (one fresh reviewer). Ledger the rulings and tell the user it's ready to view.
