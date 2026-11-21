# Diorama v2: Polish and Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the working v1 diorama into a finished experience at the level of the Expedia Route 66 reference:
- a rendered opening film that tilts away like a postcard;
- a lit, reflective, moving miniature;
- drag-to-drive, hotspots, postcards and story sheets with their own URLs;
- designed chrome and transitions.

All modelling is built live in the user's Blender.

**Architecture:** v1's foundation stays: `diorama.json`, `diorama-timeline.ts`, `3d/build_*.py`, `3d/bake_export.py` and `src/scripts/diorama/*`.
- **Blender:** scripts gain surface detail, anchors and tidy organisation, and run inside the live, MCP-connected Blender through `3d/live.py`. Bakes, exports and film renders stay headless.
- **Web:** the runtime gains a specular layer (normal map plus environment map) over the baked diffuse, shader-driven idle motion, post-processing, and an interaction layer of HTML buttons projected onto 3D anchors.
- **Story content** lives in one data file, rendered as overlay sheets in the journey and as standalone static routes.

**Tech Stack:** Blender 5.3 (MCP plus headless), Python stdlib, Next.js 16 static export, React 19, Three.js 0.187 (GLTFLoader, DRACOLoader, `examples/jsm/postprocessing`), GSAP + ScrollTrigger + SplitText, Lenis, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-20-diorama-v2-polish-interaction-design.md`. It builds on `2026-11-20-muscat-diorama-journey-design.md`, with reference `2026-11-20-expedia-route66-teardown.md`.

## Global Constraints

- Local only, no git (the user's choice): the commit steps are skipped. Keep the ledger at `.superpowers/sdd/2026-11-20-diorama-v2-polish-interaction/progress.md`.
- Budgets:
  - desktop ≤ 12 MB before story photos: film ≈ 5 MB, map ≤ 2.5 MB, street ≤ 3.5 MB, LED loop ≤ 0.5 MB;
  - phone ≤ 5 MB: film ≈ 1.8 MB, map ≤ 1.2 MB, street ≤ 1.5 MB;
  - first paint ≤ 350 KB.
- Palette: navy `#131d27`, lime `#bbd440`, paper `#ededed`, canvas grey `#b9b9b4`, plus the existing type. Nothing from Expedia: no palette, fonts, copy, art, video or code.
- Never mirrored: no negative scale on any model, and no `scale(-1)` except the site's existing direction-arrow rule. In Arabic the van is rotated and uses the far lane, `rtl.laneY = +1.75`.
- No per-letter animation, and none per word in Arabic. Still no entry gate and no audio. The loader never blocks.
- Reduced motion: no live scene. The still image plus hotspot buttons; postcards and sheets open without animation.
- Hotspots and pins are real `<button>`s with labels and keyboard support. Sheets trap focus and return it on close.
- Blender work:
  - modelling runs live in the MCP-connected Blender via `3d/live.py`; headless only for bakes, exports and renders;
  - numbered collections `00 Map`, `10 Street`, `20 Stops`, `30 Van`, `40 Props`, `90 Rig`;
  - descriptive names, no orphans, non-destructive modifiers.
- Placeholders carry `placeholder: true` and show a "sample" tag.

## Review Focus

1. **Fast scrolling or dragging past stops while a postcard or sheet is open.** Opening a sheet pauses the journey (scroll lock). Closing returns to the same progress, and no hotspot or postcard stays open for a stop that's off screen. Pinned by `postcardFor(state) closes when the van leaves the stop` (Task 6) and the sheet history check (Task 7).
2. **Back and forward buttons with a sheet open, and a direct visit to a story URL.** Back closes the overlay. A direct visit gets the standalone page, whose close goes to `/preview/#stop-<n>`. Pinned by the Task 7 history checks.
3. **Touch: a sideways drag vs a vertical scroll on phones.** A mostly-horizontal drag drives; a vertical swipe scrolls; a tap opens a hotspot. Pinned by `dragIntent` tests (Task 6).
4. **Weak GPUs or a lost WebGL context during the session.** The quality tier drops post-processing first. On a lost context the scene falls back to the still with hotspots (`data-failed`). Pinned by the Task 5 forced-failure check.
5. **Arabic everywhere new:** the film direction, the far lane, the visit order in the HUD, prev/next, the sheet's prev/next and Tab order, the postcard layout. Pinned by the `visitOrder` and `rtl lane` tests (Task 1) and the Arabic checks in Tasks 6–9.

---

## File map (new or changed)

| File | Responsibility |
|---|---|
| `src/data/diorama.json` | + `rtl.laneY: 1.75`, `hotspots` (still-image positions), `pins` |
| `src/data/diorama-stories.ts` | Stop stories and map pins, EN/AR, `placeholder` flags |
| `src/lib/diorama-timeline.ts` | + `visitOrder(dir)`, `stopProgress(n, dir)`, `dragIntent(dx, dy)`, `postcardFor(state, dir)` |
| `3d/live.py` | Runs a build script inside the live Blender (sets `__file__`, calls `build()`, tidies, saves) |
| `3d/kit.py` | + `tidy_scene()`, `surface()` (procedural bump materials), `anchor()` |
| `3d/build_street.py`, `3d/build_map.py` | Polish: surface materials, van refinement, hotspot/pin anchors, route line, numbered collections |
| `3d/bake_export.py` | + normal and roughness bakes, environment map, LED loop, films |
| `3d/tests/check_street.py`, `check_map.py` | + anchors, organisation, names |
| `src/scripts/diorama/materials.js` | + specular layer, water, idle-motion shaders |
| `src/scripts/diorama/post.js` | Tilt-shift, grain, grade, vignette composer with quality tiers |
| `src/scripts/diorama/interact.js` | Hotspots, pins, drag-to-drive, prev/next, hint cards, postcards |
| `src/scripts/diorama/sheet.js` | Story sheet overlay, history, focus trap, distortion transition |
| `src/scripts/diorama/hero.js` | Film playback, postcard tilt, non-blocking Oman-outline loader |
| `src/components/Diorama*.tsx/.css` | Hero, chrome, statements, torn edges, collage, still hotspots |
| `src/app/(en)/preview/[stop]/page.tsx`, `src/app/ar/preview/[stop]/page.tsx` | Standalone story pages |
| `public/diorama/film-{en,ar}-{1080,720}.mp4`, `film-poster-{en,ar}.webp`, `led-loop.mp4`, `env.webp`, `stories/*` | Assets |

---

### Task 1: Config, visit order and interaction maths

**Files:** modify `src/data/diorama.json` and `src/lib/diorama-timeline.ts`; test `src/lib/diorama-timeline.test.ts`.

**Interfaces (produces):**
- `diorama.json`: set `rtl.laneY` to `1.75`. Add `hotspots: { n: number, x: number, y: number }[]` (0..1 still-image coordinates, filled in by Task 4) and `pins: { slug: string, lon: number, lat: number, service: string }[]`. The six placeholder pins are muscat 58.383/23.588 signage, sohar 56.75/24.36 wrap, nizwa 57.53/22.93 stand, sur 59.53/22.57 flags, salalah 54.09/17.02 led, duqm 57.70/19.66 wrap.
- `visitOrder(dir: Dir): number[]` returns stop numbers in visit order: `[1,2,3,4,5]` or `[5,4,3,2,1]`.
- `stopProgress(n: number, dir: Dir): number` returns the scroll progress at the end of stop n's fill share (where prev/next buttons land).
- `dragIntent(dx: number, dy: number): 'drive' | 'scroll' | 'none'` returns `none` below 6 px of travel, `drive` when |dx| > 1.4·|dy|, otherwise `scroll`.
- `postcardFor(state: DioramaState, dir: Dir): number | null` returns the stop number whose hotspot is live (from the start of its fill to the end of its slot), otherwise null.

- [ ] **Step 1: Write the failing tests.**
  - `rtl lane is the far lane`: `vanPose(s,-1).y === 1.75`.
  - `visitOrder follows direction`.
  - `stopProgress lands inside the stop's hold`: `stateAt(stopProgress(n,d),d).fills[n-1] === 1` and the van is parked at `stopVanX`, for every n and both dirs.
  - `dragIntent separates drive, scroll and taps`: (3,2)→none, (40,10)→drive, (10,40)→scroll, (-40,5)→drive.
  - `postcardFor(state) closes when the van leaves the stop`: null in the drive share, n during fill and hold, null in the next slot's drive.
  - `pins are inside Oman`: each pin's lon/lat lies in the bbox 51.8–59.9 / 16.6–26.5.
- [ ] **Step 2: Run** `node --test src/lib/diorama-timeline.test.ts`. Expected: fail on the missing exports and lane 1.75.
- [ ] **Step 3: Implement**, and update the earlier `rtl van is rotated` test's `y` expectation to the config value.
- [ ] **Step 4: Run** `npm test`. Expected: all pass.

### Task 2: The live Blender harness and a clean scene

**Files:** create `3d/live.py`; modify `3d/kit.py`, `3d/build_street.py`, `3d/build_map.py` and `3d/tests/check_*.py`.

**Interfaces:**
- `3d/live.py`: `run(script: str) -> dict`, executed through the MCP. It loads `3d/<script>.py` into a namespace with `__file__` and `__name__ = 'diorama_live'`, calls its `build()`, then `tidy_scene()`. It saves to the script's `.blend` and returns the script's result dict. Usage from the MCP: `exec(open(r'<repo>/3d/live.py').read()); result = run('build_street')`.
- `kit.tidy_scene(order: dict[str, str]) -> dict`:
  - moves top collections into the numbered names;
  - purges orphan data (`bpy.data.orphans_purge(do_recursive=True)`);
  - sets every 3D view to Material Preview;
  - adds the saved views (camera bookmarks via the `CAM_*` objects);
  - returns counts.
- The `build()` functions don't save. `main()` (headless) still does.

- [ ] **Step 1: Extend `check_street.py` and `check_map.py`:**
  - top-level collections exactly `{'10 Street','20 Stops','30 Van','40 Props','90 Rig'}` (street) and `{'00 Map','90 Rig'}` (map);
  - no mesh or material named with Blender's default `.001` suffix pattern or `Material`;
  - `bpy.data.meshes` and `materials` have no zero-user blocks.
- [ ] **Step 2: Run both checks.** Expected: fail on collection names.
- [ ] **Step 3: Implement `live.py`, `tidy_scene`,** the collection renames in both builders, and the `build()`/`main()` split.
- [ ] **Step 4: Run in the user's Blender via the MCP:** `run('build_street')`, then screenshot the window. Then run headless: `npm run diorama:check`. Expected: the street is built in the visible window with a tidy outliner, and both checks pass.

### Task 3: Street polish, live

**Files:** modify `3d/build_street.py`, `3d/kit.py` and `3d/tests/check_street.py`.

**Interfaces:**
- `kit.surface(name, hexc, rough, bump: 'plaster'|'asphalt'|'sand'|'rock'|'none', scale)`: a Principled material with a procedural Noise/Voronoi → Bump normal. The bake in Task 4 turns it into a normal-map texture.
- Glass, water and van paint get roughness 0.05–0.25.
- Anchors: empties `hotspot_<n>` 1.2 m in front of each canvas centre, and `film_cam_en` / `film_cam_ar` cameras plus their path.
- **The van, refined:** cut wheel arches (Boolean, applied), separate bumper and mirror meshes with bevels, a roof rack, a window frame inset. All of it under `30 Van`, with the same names the web needs.
- The near-side palm rule still holds.

- [ ] **Step 1: Extend `check_street.py`:**
  - five `hotspot_<n>` empties, each within 2 m of its canvas;
  - every material in `10 Street`/`40 Props` except glass, water and foam has a Bump node;
  - van glass roughness ≤ 0.25;
  - `film_cam_en` and `film_cam_ar` exist.
- [ ] **Step 2: Run the check.** Expected: fail.
- [ ] **Step 3: Implement**, building live with `run('build_street')`, and screenshot the van and a stop from the follow camera.
- [ ] **Step 4: Run** `node scripts/blender.mjs 3d/tests/check_street.py`. Expected: pass, triangles ≤ 170000.

### Task 4: Map polish live, then the v2 bake and export

**Files:** modify `3d/build_map.py`, `3d/bake_export.py` and `src/lib/diorama-models.test.ts`.

**Interfaces:**
- **The map:**
  - a `route_line` mesh: a lime ribbon 1.2 km wide from Musandam's neck down the Batinah coast to Muscat, slightly above the terrain;
  - `pin_<slug>` empties for every `diorama.json` pin;
  - terrain bump.
- **The bake** additionally writes, per static group:
  - `<group>_normal` (a tangent-space NORMAL bake at half the diffuse size);
  - `<group>_rough` (a ROUGHNESS bake, packed into the G channel of an ORM WebP).
- The exporter wires them as `normalTexture` and `metallicRoughnessTexture`.
- **The environment map:** `public/diorama/env.webp`, a 1024×512 equirect render of the sky world.
- **The LED loop:** `public/diorama/led-loop.mp4`, a 6 s brand loop of 1024×576 H.264, rendered from a generated lime/navy motion-graphic scene.
- **Still hotspots:** after export, project each `hotspot_<n>` through `CAM_overview` and write `diorama.json` `hotspots`.

- [ ] **Step 1: Extend `diorama-models.test.ts`:**
  - the street and map GLBs carry `normalTexture` on every `static_*` primitive;
  - the map has 6 `pin_*` nodes and `route_line`;
  - the street has 5 `hotspot_*` nodes;
  - the budgets become street ≤ 3.5 MB, map ≤ 2.5 MB, each low ≤ 1.5/1.2 MB;
  - `env.webp` and `led-loop.mp4` exist and are ≤ 0.5 MB;
  - `diorama.json` hotspots has 5 entries within 0..1.
- [ ] **Step 2: Run** `npm test`. Expected: the model tests fail.
- [ ] **Step 3: Implement.** Build the map live with `run('build_map')`, then run the bake and export headless (`npm run diorama:export -- --scene all`).
- [ ] **Step 4: Run** `npm test`. Expected: all pass. Open the exported GLB's look in the live Blender (import into a scratch scene) to eyeball the normals.

### Task 5: Runtime rendering upgrade

**Files:** modify `src/scripts/diorama/materials.js` and `scene.js`; create `src/scripts/diorama/post.js`.

**Interfaces:**
- **`litMaterial({ baked, normal, orm, env, kind })`:** a MeshStandardMaterial with:
  - `emissiveMap = baked` (`emissive` white), so the baked light gives the diffuse look;
  - `color = 0x000000`, `normalMap`, `roughnessMap` (from the ORM G channel), `envMap`, `envMapIntensity` by kind (`paint` 0.9, `glass` 1.0, `water` 1.0, `matte` 0.25).
  - The result is baked light plus a specular layer, with no double diffuse.
- **`waterMaterial(...)`:** the same, plus two scrolling normal maps driven by `uTime`.
- **`swayMaterial(base, { axis: 'flag'|'palm', amp })`:** `onBeforeCompile` vertex sway by the uv u axis (flags) or by height (palms), from `uTime`.
- **`createPost(renderer, scene, camera, tier)`** returns `{ render(dt), setFocus(worldPos), resize(w,h), dispose() }`:
  - **high tier:** a tilt-shift blur (two-pass Gaussian weighted by the screen-y distance from the focus band), grain, a grade (lift shadows +0.03, warm highlights), a vignette;
  - **low tier:** grain plus grade only.
- **The scene:**
  - runs a continuous rAF loop while it's in view (pausing when hidden via IntersectionObserver and `visibilitychange`) for idle motion;
  - the van bobs ±0.01 m at 1.3 Hz, and the wheel spin is driven from vanX;
  - the LED canvas swaps to a VideoTexture of `led-loop.mp4` once `fills[2] === 1`;
  - on `webglcontextlost` it sets `data-failed`.

- [ ] **Step 1: Write the failing checks** in a new `src/lib/diorama-tier.test.ts`: `qualityTier` plus a new `postFor(tier)` returns `{ dof: true, grain: true }` for high and `{ dof: false, grain: true }` for low. Move the pure decision into `diorama-timeline.ts`.
- [ ] **Step 2: Run, and see it fail. Step 3: Implement.**
- [ ] **Step 4: Build and verify in the browser** (`diorama-static`):
  - glass and the van reflect, and the water moves;
  - the far street blurs;
  - flags wave and palms sway with no scroll;
  - the LED plays after its fill;
  - forcing a lost context (`WEBGL_lose_context` from the console) gives the still with hotspot buttons.
  - Screenshot each.

### Task 6: Interaction: hotspots, pins, postcards, drag, prev/next, hints

**Files:** create `src/scripts/diorama/interact.js`; modify `index.js`, `Diorama.tsx` and `Diorama.css`.

**Interfaces:**
- **`initInteract({ root, scene, dir, lenis, stories })`:**
  - projects `hotspot_<n>` and `pin_<slug>` anchors each frame onto `button.dhot[data-stop]` and `button.dpin[data-pin]` (labels from the stories);
  - shows a hotspot only while `postcardFor(state)` is that stop, and pins only in the map phase.
- **The postcard:** `div.dpostcard[role=dialog]` with a tilted photo card, the title, "client · place", the button "See the job" / "See this service", and a close button.
  - It opens on a hotspot or pin click, or Enter.
  - The scene dims and blurs: post focus on the anchor, plus a CSS backdrop.
  - Esc closes it.
- **Drag:** pointer events on the canvas host. `dragIntent` decides; `drive` scrubs `lenis.scrollTo(current + dx * k)`.
- **Prev/next:** `button.dstop-prev` and `button.dstop-next` beside the HUD → `lenis.scrollTo(top + stopProgress(n,dir)·range)`, over 1.2 s, eased.
- **Hint cards:** `.dhint` has two steps ("Scroll or drag to drive", "Tap a glowing spot"). Each is dismissed on first use and stored as `localStorage['cs-diorama-hints']`, wrapped in try/catch.
- **Map parallax:** the pointer tilts the map camera by up to ±1.5°.

- [ ] **Step 1: Write the failing test:** `dragIntent` and `postcardFor` (already in Task 1). Here, add `hotspotLabel(n, locale)` in `diorama-stories.ts` with test `every hotspot and pin has a label in both languages`.
- [ ] **Step 2: Run, and see it fail. Step 3: Implement.**
- [ ] **Step 4: Verify in the browser at desktop and phone sizes, EN and AR:**
  - a hotspot appears at each stop;
  - Tab reaches it, Enter opens the postcard, Esc closes it;
  - a sideways drag drives, a vertical swipe scrolls on the phone preset;
  - prev/next land on the stops in visit order (Arabic: Flags first);
  - hints show once, and not after a reload;
  - pins open postcards in the map phase.
  - Screenshot each.

### Task 7: Story sheets and story pages

**Files:** create `src/data/diorama-stories.ts`, `src/scripts/diorama/sheet.js`, `src/components/DioramaStory.tsx` (shared by the overlay and the page) and `src/app/(en)/preview/[stop]/page.tsx` + `src/app/ar/preview/[stop]/page.tsx`. Generate placeholder photos into `public/diorama/stories/`, rendered from the street at each stop with the canvases filled: a hero shot plus 3 detail crops.

**Interfaces:**
- `stories: Record<1|2|3|4|5, { slug, service, placeholder, photos: string[], en: {title, client, place, line, body}, ar: {...} }>`; slugs `signage`, `wrap`, `led`, `stand`, `flags`. `pins` reference a `service` and a photo.
- **The overlay:** `openSheet(n, { push })` locks the scroll (`lenis.stop()`), `history.pushState({ sheet: n }, '', storyUrl(n, locale))`, focus-traps, and runs prev/next in visit order. A distortion transition (displacement-map shader on a small canvas) runs between the hero photos. `popstate` closes it. On close it restores scroll and focus.
- **Placeholders:** any story or pin with `placeholder: true` shows a small "Sample" / "نموذج" tag on its postcard and sheet.
- **The standalone page** at `/preview/<slug>/` renders `DioramaStory` with a close link to `/preview/#stop-<n>`, and `noindex`. The journey reads `#stop-<n>` on load and scrolls to `stopProgress(n)`.

- [ ] **Step 1: Write the failing tests:** `storyUrl(n, locale)` gives `/preview/signage/` and `/ar/preview/signage/`; every story has ≥ 3 photos and copy in both languages; `generateStaticParams` returns the 5 slugs.
- [ ] **Step 2: Run, and see it fail. Step 3: Implement.**
- [ ] **Step 4: Build, then check.**
  - `out/preview/signage/index.html` and `out/ar/preview/flags/index.html` exist, with noindex.
  - In the browser: open the sheet from a postcard and the URL changes; Back closes it and the van is at the same stop; the direct URL shows the light page with no canvas, and its close lands on stop 1.

### Task 8: Hero film, chrome, statements, transitions, the reduced-motion still

**Files:** create `src/scripts/diorama/hero.js`; modify `Diorama.tsx`, `Diorama.css` and `bake_export.py` (`--scene film`).

**Interfaces:**
- **The film render** (headless EEVEE): `film_cam_en` / `film_cam_ar`, 8 s at 30 fps. Over the stretch for stops 2–3, the van passes and the canvases wipe in through the art material's keyframed wipe factor. The loop is seamless: the start and end frames match.
- The film outputs H.264 to `public/diorama/film-{en,ar}-{1080,720}.mp4`, plus `film-poster-{en,ar}.webp`.
- **`initHero({ root, dir, tier })`:**
  - picks the right film (`<video muted playsinline loop autoplay preload=metadata>`), with the poster as the first paint;
  - on the first scroll, a GSAP-scrubbed postcard tilt (rotateX 18°, rotateZ −4° LTR / +4° RTL, scale 0.62, a paper border, a shadow) reveals the map;
  - pauses the video when it's off-screen;
  - **the loader:** an SVG of the Oman outline (from `countries.geojson` and the projection, written at build time to `public/diorama/oman-outline.svg`) whose `stroke-dashoffset` follows map and street download progress (`GLTFLoader` onProgress). It sits under "Scroll to explore" and never covers the page.
- **The route draws itself:** the `route_line` material reveals along its uv u by map-phase progress, from 0 to 1 by the start of the dive. Its leading end has a soft lime glow.
- **Chrome:**
  - a chapter progress bar in the header area (`.dchapters`: Oman · Muscat · 01–05 · Quote), filled from progress;
  - giant display statements between phases, revealed by line (no per-letter animation, Arabic by line);
  - torn-paper SVG edges between sections;
  - the closing photo-card collage with depth parallax (GSAP).
- **Reduced motion:** `img.diorama__still` plus `button.dhot` at the `diorama.json` `hotspots` positions, opening postcards and sheets with no motion.

- [ ] **Step 1: Write the failing checks:** extend `diorama-models.test.ts` so the four films exist (1080 ≤ 5.2 MB, 720 ≤ 1.9 MB) and so do both posters (≤ 250 KB); extend the built-HTML check so `/preview/` contains `video.dhero__film`, `.dchapters` and five `button.dhot`.
- [ ] **Step 2: Run, and see it fail. Step 3: Implement**, rendering the films headless (`npm run diorama:export -- --scene film`).
- [ ] **Step 4: Verify in the browser, EN and AR:**
  - the film plays under the headline, and the first scroll tilts it away into the map;
  - the loader outline draws while loading and settles;
  - the chapter bar advances;
  - statements and torn edges reveal;
  - with reduced motion emulated (CSS media emulation through `matchMedia` override, plus the `motion` class removed), the still with five working hotspot buttons;
  - Arabic film drives right to left in the far lane.

### Checkpoint: client look-dev gate 2

Stop. Send the user screenshots of the upgraded scene, a postcard, a sheet and the hero. Re-render the films only if the look changes.

### Task 9: Budgets, phones, accessibility, final review

**Files:** modify `scripts/size-report.mjs`.

**Interfaces:**
- Size-report lines for the v2 budgets, with `OVER` flags.
- The lazy-JS line counts only chunks that contain `initDiorama`, `GLTFLoader` or `EffectComposer`.
- The first-load line is relabelled "all chunks (Turbopack places every chunk here)" with no ceiling, and a new first-paint line measures the preview HTML + CSS + poster ≤ 350 KB.

- [ ] **Step 1: Implement**, then run `npm run build`. Expected: no `OVER` lines.
- [ ] **Step 2: Phone portrait:** the van is in frame at every stop. If not, add a portrait branch in `followCamera` with its own test.
- [ ] **Step 3: Keyboard-only pass:** the whole journey works through Tab, Enter and Esc. Screen reader labels are present (`read_page`).
- [ ] **Step 4: Run** `npm test; npm run test:geo; npm run diorama:check`. Expected: all pass.
- [ ] **Step 5: Final review.** Dispatch a fresh reviewer on the most capable model with the plan, the spec, this Review Focus and the ledger rulings.

## Not in this plan
The homepage swap at launch, real client photos and pins (swap the data and the files), and a CMS.
