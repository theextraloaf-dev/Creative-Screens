# Muscat Diorama Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a noindex `/preview/` page (`/ar/preview/` in Arabic) that opens on a 3D map of Oman, dives into Muscat, and drives the branded van down a toy-like Muscat street. At each of five stops a grey surface fills with brand artwork as the visitor scrolls.

**Architecture:** Blender scripts in `3d/` build two scenes procedurally (the map from public geo data, the street from code). They bake lighting into textures and export two Draco glTFs per quality tier into `public/models/`. On the web, one lazy-loaded Three.js scene shows them with unlit baked materials. A pure, tested TypeScript timeline turns scroll progress into the state of the map, the dive, the van, the camera and the fills. One JSON file holds the stops and camera keys, read by both Blender and the web, so they cannot drift apart.

**Tech Stack:** Blender 5.3 (Python, run headless), Python 3.14 stdlib for the data and geo helpers, Next.js 16 static export, React 19, Three.js 0.187 (GLTFLoader, DRACOLoader), GSAP 3.15 with ScrollTrigger and SplitText, Lenis, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-20-muscat-diorama-journey-design.md`

## Before you start

- The project folder is **not a git repository**. Every "Commit" step assumes it is. Ask the user before running `git init` and making a first commit of the current state. If they say no, skip the commit steps.
- Blender: `C:\Program Files\Blender Foundation\Blender 5.3\blender.exe`. Every Blender script runs as `blender --background --factory-startup --python <script> -- <args>`, through the npm wrappers from Task 2. The Blender MCP (port 9876) works while the user has Blender open, so use it to inspect scenes live, but the build always runs from the scripts.
- `3d/build_street.py` already exists. It's the first modelling pass and is extended in Task 3, not rewritten.

## Global Constraints

- The current homepage, service pages and other routes do not change. Everything new lives on `/preview/` and `/ar/preview/`, which are always `noindex`.
- No new runtime dependencies. Three.js loaders come from `three/examples/jsm/…`, and the Draco decoders are served from `public/draco/`.
- Logical CSS properties only. Nothing is ever mirrored: no `scale(-1)`, and no negative scale on the van or any model. In Arabic the van is rotated 180°.
- No per-letter animation. The word-by-word highlight is English only, and Arabic uses whole lines.
- The van carries the **English wordmark on both flanks** (`public/img/logo-wordmark.svg`). There is no Arabic livery.
- No text baked into any model. Map labels are HTML in both languages.
- Reduced motion or no JS: the page shows `public/diorama/still.webp` and all five captions as plain text, with no pinned empty scroll.
- No loader, "Enter" gate or audio on the preview page.
- Colours: navy `#131d27`, lime `#bbd440`, canvas grey `#b9b9b4`, page paper `#ededed`.
- Budgets (gzip or file size): `muscat-street.glb` ≤ 2.5 MB, `oman-map.glb` ≤ 1.5 MB, each `-low` variant ≤ 60% of its high variant, diorama loader JS (lazy) ≤ 120 KB gzip. The page's first paint must not wait for any model.
- The map shows Oman's true outline **including Musandam**, from Natural Earth 1:10m Admin-0. Terrain comes from AWS Terrain Tiles (Terrarium) at zoom 7, with heights exaggerated ×15.
- A credit line on the preview page reads: "Terrain: AWS Terrain Tiles (Mapzen, SRTM, GMTED and others). Borders: Natural Earth."
- Arabic lane is deferred (spec Q3). It's a config value (`rtl.laneY`), defaulting to the near lane `-1.75`, so the later decision is a one-line change.

## Review Focus

1. **Scrolling back, or very fast.** Fills, van position and the chapter come from scroll progress alone. Scrolling back must un-fill, move the van back, and never leave two captions on screen. Pinned by `stateAt is a pure function of progress` and `fills are 0 before their stop and 1 after it` (Task 1), and by the caption-swap check in Task 8.
2. **Arabic direction.** The van drives right to left rotated (yaw π, scale 1), stops are met in reverse, and wipes run right to left without flipping the artwork. Pinned by `rtl van is rotated, never mirrored` and `rtl visits stops in reverse` (Task 1).
3. **WebGL missing, a model 404 or a slow network.** The still stays visible and the page scrolls normally, never a blank pinned section. Pinned by the forced-failure verification in Task 7.
4. **Rotating a phone or resizing mid-journey.** The camera aspect, renderer size and HTML map labels follow the new size. Pinned by the resize verification in Task 7.
5. **Reduced motion and no JS.** The still and five readable captions appear with no pin spacer. Pinned by the built-HTML check in Task 6 and the reduced-motion verification in Task 9.

---

## File map

| File | Responsibility |
|---|---|
| `src/data/diorama.json` | Single source of truth: lanes, the five stops, camera keys, map anchor scale, phase boundaries |
| `src/lib/diorama-timeline.ts` (+ `.test.ts`) | Pure: scroll progress → `DioramaState`; van pose; camera at a state; quality tier |
| `src/lib/diorama-models.test.ts` | Reads the exported GLBs' JSON chunk and checks node names, extras and sizes |
| `scripts/blender.mjs` | Runs a Blender script headless (npm wrappers) |
| `3d/map/geo.py` (+ `test_geo.py`) | Stdlib only: projection, Terrarium decode, shapefile/dbf reading, point-in-polygon |
| `3d/map/fetch_data.py` | One-off download into `3d/map/data/` (gitignored), writes `countries.geojson` |
| `3d/build_street.py` | Street scene (exists; reads `diorama.json`, gets the carved-rock finish) |
| `3d/build_map.py` | Oman map scene |
| `3d/bake_export.py` | Bake light into atlases, export high and low GLBs, render still, poster and placeholder art |
| `3d/tests/check_street.py`, `3d/tests/check_map.py` | Scene assertions run inside Blender; exit code 1 on failure |
| `src/app/(en)/preview/page.tsx`, `src/app/ar/preview/page.tsx` | Routes |
| `src/components/Diorama.tsx`, `Diorama.css` | Page markup: still, captions, HUD, labels layer, closing section, credits |
| `src/scripts/diorama/materials.js` | Baked-unlit material, map fade material, canvas fill material |
| `src/scripts/diorama/scene.js` | Renderer, loading, the scene graph, map labels, resize, per-frame apply of `DioramaState` |
| `src/scripts/diorama/captions.js` | Caption swaps (English word highlight, Arabic lines) and HUD |
| `src/scripts/diorama/index.js` | Entry point: ScrollTrigger wiring and the fallback to the still |
| `public/draco/*` | Copied from `node_modules/three/examples/jsm/libs/draco/gltf/` |
| `public/models/{oman-map,muscat-street}{,-low}.glb`, `public/diorama/*.webp` | Exported assets |

Coordinate note: Blender is Z-up and glTF is Y-up. The exporter maps Blender `(x, y, z)` to glTF `(x, z, −y)`, so the street's camera side (Blender −Y) becomes glTF **+Z**. `diorama.json` stores **Blender coordinates**. The web converts them with one helper, `toGl([x, y, z]) => [x, z, -y]`, defined in `diorama-timeline.ts`.

---

### Task 1: Shared config and the scroll timeline

**Files:**
- Create: `src/data/diorama.json`
- Create: `src/lib/diorama-timeline.ts`
- Test: `src/lib/diorama-timeline.test.ts`

**Interfaces:**
- Produces, in `src/data/diorama.json`, exactly this shape and these values:
```json
{
  "laneY": -1.75,
  "rtl": { "laneY": -1.75 },
  "vanStart": -39, "vanEnd": 39,
  "stops": [
    { "n": 1, "service": "signage", "canvasX": -28.0, "vanX": -35.0 },
    { "n": 2, "service": "wrap",    "canvasX": -14.0, "vanX": -21.0 },
    { "n": 3, "service": "led",     "canvasX": 0.5,   "vanX": -6.5 },
    { "n": 4, "service": "stand",   "canvasX": 14.5,  "vanX": 7.5 },
    { "n": 5, "service": "flags",   "canvasX": 35.0,  "vanX": 27.0 }
  ],
  "follow": { "eye": [3.0, -24.5, 12.5], "target": [5.0, 4.0, 2.5], "lens": 35 },
  "overview": { "elevationDeg": 31, "azimuthDeg": -5, "distance": 140, "target": [0, 5, 1], "lens": 50 },
  "map": { "streetScale": 0.07, "camera": null },
  "phases": { "map": [0, 0.08], "dive": [0.08, 0.2], "street": [0.2, 0.95], "outro": [0.95, 1] },
  "stopShare": { "drive": 0.55, "fill": 0.25, "hold": 0.2 }
}
```
`map.camera` stays `null` until Task 4 fills it in.
- Produces, in `src/lib/diorama-timeline.ts`:
  - `type Dir = 1 | -1`, `type Phase = 'map' | 'dive' | 'street' | 'outro'`
  - `interface CameraKey { eye: [number, number, number]; target: [number, number, number]; lens: number }` (Blender coordinates)
  - `interface DioramaState { phase: Phase; dive: number; street: number; chapter: number; vanX: number; fills: number[] }`. Here `dive` and `street` are each 0..1 progress within their phase (0 before it, 1 after it), `chapter` is −1 before the first stop and otherwise the **visit-order** index 0..4, and `fills` has 5 entries indexed by **stop n−1** (not visit order).
  - `stateAt(progress: number, dir: Dir): DioramaState`. The street phase is split into 5 equal visit slots. Each slot is `drive` (van eases from the previous stop to this one with ease-in-out), then `fill` (this stop's fill goes 0→1), then `hold`. After the last slot the van eases to the exit (`vanEnd`, or `vanStart` when `dir = -1`) during `outro`. `chapter` changes at the start of each slot's `fill`.
  - `stopVanX(stop, dir: Dir): number` is `stop.vanX` for `dir = 1`, and `2 * stop.canvasX - stop.vanX` for `dir = -1` (the van stops just past the canvas, coming from the other side).
  - `vanPose(state: DioramaState, dir: Dir): { x: number; y: number; yaw: number; scale: 1 }` returns `y = laneY` or `rtl.laneY`, and `yaw = 0` or `Math.PI`.
  - `followCamera(vanX: number, dir: Dir): CameraKey` adds the `follow` offsets to `vanX`, with both x offsets negated when `dir = -1`.
  - `lerpCamera(a: CameraKey, b: CameraKey, t: number): CameraKey` interpolates eye, target and lens linearly after a smoothstep on `t`.
  - `toGl(v: [number, number, number]): [number, number, number]`
  - `qualityTier(env: { width: number; deviceMemory?: number; cores?: number }): 'high' | 'low'` returns `'low'` when `width < 768`, `deviceMemory <= 4` or `cores <= 4`.

- [ ] **Step 1: Write the failing tests** in `src/lib/diorama-timeline.test.ts`, in the style of `quote-message.test.ts` (`node:test`, `assert/strict`):
  - `phases map to scroll ranges`: `stateAt(0,1).phase === 'map'`, `stateAt(0.1,1).phase === 'dive'`, and `stateAt(0.14,1).dive` is strictly between 0 and 1. `stateAt(0.5,1).phase === 'street'` and `stateAt(0.99,1).phase === 'outro'`.
  - `stateAt is a pure function of progress`: for 200 random p, `deepEqual(stateAt(p,1), stateAt(p,1))`, and the same after calling `stateAt` on other values in between.
  - `fills are 0 before their stop and 1 after it`: for each visit slot k (dir 1), at the slot's start `fills[k] === 0`, and at the end of the slot's fill share `fills[k] === 1`. All later stops are 0 and all earlier stops are 1.
  - `the van is parked during fill and hold`: inside slot 3's fill and hold, `vanX === -6.5` (dir 1).
  - `rtl visits stops in reverse`: in `dir = -1`, the first slot fills `fills[4]` (stop 5, flags) and the last slot fills `fills[0]`. `stopVanX(stop3, -1) === 7.5`.
  - `rtl van is rotated, never mirrored`: `vanPose(s,-1)` gives `yaw === Math.PI` and `scale === 1`, and `vanPose(s,1).yaw === 0`.
  - `chapter is -1 before the street and counts in visit order`: `stateAt(0.05,1).chapter === -1`, and the chapter is 0 in the first slot's fill, in both dirs.
  - `follow camera mirrors offsets in rtl`: `followCamera(0,-1).eye[0] === -3` and `.target[0] === -5`.
  - `toGl swaps axes`: `deepEqual(toGl([1,2,3]), [1,3,-2])`.
  - `quality tier`: `qualityTier({width:390}) === 'low'`, `qualityTier({width:1440, deviceMemory:8, cores:8}) === 'high'` and `qualityTier({width:1440, deviceMemory:4}) === 'low'`.
  - `progress is clamped`: `deepEqual(stateAt(-1,1), stateAt(0,1))` and `deepEqual(stateAt(2,1), stateAt(1,1))`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test src/lib/diorama-timeline.test.ts`
Expected: FAIL, cannot find module `./diorama-timeline.ts`.

- [ ] **Step 3: Create `src/data/diorama.json` and implement `src/lib/diorama-timeline.ts`** with the interfaces above. Import the JSON with `import cfg from '../data/diorama.json' with { type: 'json' };`. If Node's type stripping rejects that, read it with `readFileSync` in the test only and have `stateAt` take the config as an optional third parameter that defaults to the imported JSON.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all tests pass, including the existing quote tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/diorama.json src/lib/diorama-timeline.ts src/lib/diorama-timeline.test.ts
git commit -m "feat(diorama): shared config and scroll timeline"
```

---

### Task 2: Geo helpers, map data and the Blender runner

**Files:**
- Create: `3d/map/geo.py`, `3d/map/test_geo.py`, `3d/map/fetch_data.py`, `scripts/blender.mjs`
- Modify: `.gitignore` (add `3d/map/data/`), `package.json` (scripts)

**Interfaces:**
- Produces, in `3d/map/geo.py` (stdlib only, importable from Blender and from system Python):
  - `LON0, LAT0 = 57.0, 21.0`, `KM_PER_DEG_LAT = 110.57`, `KM_PER_DEG_LON = 111.32 * cos(radians(LAT0))`
  - `project(lon: float, lat: float) -> tuple[float, float]` gives local kilometres (equirectangular about LON0/LAT0).
  - `terrarium_height(r: int, g: int, b: int) -> float` returns metres: `r * 256 + g + b / 256 - 32768`.
  - `tile_xy(lon: float, lat: float, z: int) -> tuple[int, int]` (slippy-map tile indices), and `tile_bounds(x: int, y: int, z: int) -> tuple[float, float, float, float]` (west, south, east, north).
  - `read_shp_polygons(shp_path: str) -> list[list[list[tuple[float, float]]]]`, one list of rings per record (shape type 5 only).
  - `read_dbf(dbf_path: str) -> list[dict[str, str]]`
  - `point_in_rings(lon: float, lat: float, rings: list[list[tuple[float, float]]]) -> bool` uses even-odd ray casting across all rings, so holes work.
- Produces, from `3d/map/fetch_data.py` (run once with system Python):
  - `3d/map/data/ne_10m_admin_0_countries.zip` from `https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip`
  - `3d/map/data/countries.geojson`: a FeatureCollection with exactly the features whose `ADMIN` is `Oman`, `United Arab Emirates`, `Saudi Arabia`, `Yemen` or `Iran`, each with `properties.name` = ADMIN.
  - `3d/map/data/terrarium/7/{x}/{y}.png` from `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/7/{x}/{y}.png` for every tile covering lon 51.5–60.5 and lat 16.0–27.0. That's about 20 tiles. Skip files that already exist, and send a generic User-Agent.
- Produces `scripts/blender.mjs`: `node scripts/blender.mjs <script.py> [-- args…]` spawns `process.env.BLENDER ?? 'C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe'` with `--background --factory-startup --python <script> -- …`, pipes its output, and exits with Blender's exit code. Python exceptions inside Blender must turn into exit code 1: wrap each script's `main()` in `try/except: traceback.print_exc(); sys.exit(1)`.
- npm scripts: `"diorama:data": "python 3d/map/fetch_data.py"`, `"diorama:street": "node scripts/blender.mjs 3d/build_street.py"`, `"diorama:map": "node scripts/blender.mjs 3d/build_map.py"`, `"diorama:export": "node scripts/blender.mjs 3d/bake_export.py"`, `"diorama:check": "node scripts/blender.mjs 3d/tests/check_street.py && node scripts/blender.mjs 3d/tests/check_map.py"`, `"test:geo": "python -m unittest 3d/map/test_geo.py"`

- [ ] **Step 1: Write the failing tests** in `3d/map/test_geo.py` (unittest):
  - `test_terrarium_sea_level`: `terrarium_height(128, 0, 0) == 0.0`, and `terrarium_height(128, 11, 184) == 11 + 184/256`.
  - `test_project_origin_and_muscat`: `project(57, 21) == (0, 0)`, and `project(58.383, 23.588)` ≈ `(143.7, 286.2)` within 0.5 km.
  - `test_tile_xy_covers_oman`: `tile_xy(58.383, 23.588, 7) == (84, 55)`.
  - `test_point_in_rings_square_with_hole`: an outer square 0..10 with a hole 4..6. (5, 5) is False, (2, 2) is True and (11, 2) is False.
  - `test_oman_polygon` (skipped unless `3d/map/data/countries.geojson` exists): the Oman rings contain Muscat (58.383, 23.588), Khasab in Musandam (56.25, 26.18) and Salalah (54.09, 17.02), but not Dubai (55.27, 25.20).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:geo`
Expected: FAIL with `ModuleNotFoundError: geo`, or names not defined.

- [ ] **Step 3: Implement `geo.py`.** The shapefile reader follows the ESRI spec: a 100-byte header, then records of big-endian (number, length), a little-endian shape type, a bbox, NumParts, NumPoints, parts[] and points[]. The dbf reader follows the dBase III header: record count at offset 4, header length at 8, record length at 10, and 32-byte field descriptors ending in `0x0D`.

- [ ] **Step 4: Implement `fetch_data.py` and `scripts/blender.mjs`, then run the download**

Run: `npm run diorama:data`
Expected: prints the number of tiles fetched (about 20) and `countries.geojson: 5 features`.

- [ ] **Step 5: Run the tests to verify they pass, including the data test**

Run: `npm run test:geo`
Expected: `OK`, with 5 tests run and none skipped.

- [ ] **Step 6: Commit** (the data folder is gitignored)

```bash
git add 3d/map/geo.py 3d/map/test_geo.py 3d/map/fetch_data.py scripts/blender.mjs .gitignore package.json
git commit -m "feat(diorama): geo helpers, map data fetch, blender runner"
```

---

### Task 3: Street scene: shared config and the carved-rock finish

**Files:**
- Modify: `3d/build_street.py`
- Create: `3d/tests/check_street.py`

**Interfaces:**
- Consumes: `src/data/diorama.json` (Task 1), read with `json.load`. It replaces the script's `STOPS`, `LANE_Y`, `VAN_START`, `VAN_END` constants and the follow/overview camera values in `build_rig`.
- Produces, in `3d/street.blend`, these objects, which Task 5 exports and the web looks up by name:
  - `van` (empty) with children `van_body`, `van_wheel_{fl,rl,fr,rr}`, `van_logo_near`, `van_logo_far`.
  - `canvas_<n>_<service>[_<part>]` meshes with custom props `canvas` (int) and `service` (str), and a single UV map `UVMap` within 0..1. These names exist today: `canvas_1_signage`, `canvas_2_wrap`, `canvas_3_led`, `canvas_4_stand_{wall,header,counter}`, `canvas_5_flags_{flag_1..flag_4,banner}`.
  - `CAM_overview` and `CAM_follow`.
  - New: `street_root` (empty at the origin), parent of everything. Task 7 scales this one node during the dive.

- [ ] **Step 1: Write `3d/tests/check_street.py`** (it opens `3d/street.blend` and runs assertions, exiting 1 on the first failure and printing which one failed):
  - Every stop in `diorama.json` has at least one `canvas_<n>_<service>*` object, and every canvas UV lies within [0, 1].
  - `van_logo_near` and `van_logo_far` have `matrix_world.determinant() > 0` (never mirrored), and `van_logo_far.rotation_euler.z` ≈ π.
  - No mesh object has a negative scale component.
  - No palm trunk base (vertices of the `props` mesh with material `trunk` and z < 0.3) on the near side (y < 0) lies within ±4.0 m in x of any stop's `vanX`.
  - The van's X keyframes include every stop's `vanX` (dir 1).
  - Evaluated triangles total ≤ 150,000.
  - Every object except `street_root` itself is a descendant of `street_root`.
  - New finish: an object `plinth_rock` exists and has ≥ 2,000 vertices (carved, not a box), and an object `sea_foam` exists.

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run diorama:street; node scripts/blender.mjs 3d/tests/check_street.py`
Expected: FAIL on `street_root`, `plinth_rock` or `sea_foam` (the config-driven values already match).

- [ ] **Step 3: Change `build_street.py`:**
  - Read `diorama.json` from `os.path.join(REPO, 'src', 'data', 'diorama.json')`.
  - Add `street_root` and parent all top-level objects to it.
  - Replace the three straight soil, rock and board boxes with `plinth_rock`. Its four side faces are subdivided grids, about 0.5 m, displaced outward by layered noise (`mathutils.noise.fractal`, 3–4 octaves, about 0.35 m amplitude). Use horizontal strata colours from `soil` to `rock` by height, through a vertex colour attribute.
  - Darken the sea from `#2e8c9a` to a gradient: light teal at the sea wall, `#12465a` at the plinth's back. A white `sea_foam` strip of noise-edged quads runs along the sea wall and the plinth cut at the water.
  - Keep everything else as built.

- [ ] **Step 4: Run the build and the check to verify they pass**

Run: `npm run diorama:street; node scripts/blender.mjs 3d/tests/check_street.py`
Expected: `check_street: all N checks passed`, and `BUILD_STREET_RESULT` shows triangles ≤ 150000.

- [ ] **Step 5: Look at the renders**

Run: `node scripts/blender.mjs 3d/build_street.py -- --render 3d/renders`
Expected: `3d/renders/street_overview_grey.png` shows rough rock cut edges and a deeper sea with foam. No palm or lamp hides the van in `street_stop1_follow.png` or `street_stop3_follow.png`.

- [ ] **Step 6: Commit**

```bash
git add 3d/build_street.py 3d/tests/check_street.py
git commit -m "feat(diorama): street reads shared config, carved rock plinth, deeper sea"
```

---

### Task 4: The Oman map scene

**Files:**
- Create: `3d/build_map.py`, `3d/tests/check_map.py`
- Modify: `src/data/diorama.json` (`map.camera`)

**Interfaces:**
- Consumes: `geo.py` and `3d/map/data/*` (Task 2), and `diorama.json` (`map.streetScale`).
- Produces `3d/oman-map.blend` with, in map units of **1 Blender unit = 1 km**:
  - `oman_terrain`: Oman's land, grid sampled at 2 km from the Terrarium tiles, with z = `height_m / 1000 * 15`. Vertices outside Oman's rings are dropped, and boundary vertices are snapped to the nearest point on Oman's outline. Sea-level land sits at z = 0. It includes Musandam and the Madha exclave as separate islands of the same mesh.
  - `oman_plinth`: carved rock skirts along every Oman boundary, from the terrain edge down to z = −30, in the same strata style as the street's `plinth_rock`.
  - `neighbours`: UAE, Saudi Arabia, Yemen and Iran (only the parts within lon 51.5–60.5 and lat 16–27) as flat beige `#d9c7a6` slabs, top at z = −4 and bottom at z = −30. They sit below Oman, so Oman reads raised.
  - `borders`: thin flat ribbons (0.6 km wide, `#8a7a63`) on top of the neighbour slabs along land borders, including the UAE–Oman borders around Musandam and Madha.
  - `sea`: a plane at z = −6 covering lon 51.5–60.5 and lat 16–27. Its vertex colours run from `#2f8fa0` within 15 km of any coast to `#0e3a52` beyond 120 km. Add `sea_foam` ribbons 1–2 km wide hugging Oman's coastline.
  - Terrain colour (vertex colours) in the street's palette:
    - sand `#e3cfa9` by default;
    - rock `#9a7354` to `#c4a07a` with height and slope;
    - green `#5f8a3a` where lon < 55.6 and lat < 17.4 and 50 m < height < 1500 m (Dhofar);
    - a light green strip `#8fae5a` within 12 km of the coast between Muscat and Sohar (lon 56.7–58.6, lat 23.5–24.4).
  - `landmarks`: generic miniatures with no replicas and no text, using the street's builder helpers. Factor `MB`, `palm` and `fort_tower` out of `build_street.py` into `3d/kit.py` so both scripts import them; don't copy them.
    - A fort at Nizwa (57.53, 22.93).
    - A dune field of 8–12 crescent mounds at the Sharqiya Sands (58.6, 22.1).
    - 6 palms on the Batinah coast.
    - 3 dhows and 2 container ships on the sea.
    - Scale each one so a fort is about 8 km across.
  - `muscat_pin`: a lime `#bbd440` map-pin mesh at `project(58.383, 23.588)`, standing 12 km tall.
  - `muscat_anchor`: an empty at Muscat on the terrain surface, with custom prop `street_scale` = `diorama.json` `map.streetScale`. Task 5 exports the street separately. Task 7 places `street_root` under this anchor.
  - `label_<key>` empties for the HTML labels: `muscat`, `nizwa`, `jebel_shams` (57.26, 23.24), `sharqiya` (58.6, 22.1), `salalah` (54.09, 17.02), `musandam` (56.25, 26.18). Each sits 3 km above the terrain.
  - `CAM_map`: frames all of Oman including Musandam at 16:9 with about 8% margin, elevated about 40°, looking north-north-east like the reference. Write its eye, target and lens into `diorama.json` `map.camera` (Blender coords, same `CameraKey` shape).
  - The same warm sun and sky as the street (`build_rig` values), so the two bakes match.

- [ ] **Step 1: Write `3d/tests/check_map.py`** (opens `3d/oman-map.blend`):
  - `oman_terrain` has a vertex within 3 km of `project(56.25, 26.18)` (Musandam) and of `project(54.09, 17.02)` (Salalah), and none within 10 km of `project(55.27, 25.20)` (Dubai).
  - The max z of `oman_terrain` lies between 35 and 50 (Jebel Shams about 3,000 m × 15 / 1000).
  - `muscat_anchor` is within 1 km (xy) of `project(58.383, 23.588)` and has `street_scale == 0.07`.
  - All six `label_*` empties exist.
  - No object of type `FONT`, and no material name containing `text`.
  - Evaluated triangles total ≤ 180,000.
  - `diorama.json` `map.camera` is not null.

- [ ] **Step 2: Run the check to verify it fails**

Run: `node scripts/blender.mjs 3d/tests/check_map.py`
Expected: FAIL, `3d/oman-map.blend` not found.

- [ ] **Step 3: Implement `3d/kit.py` (moved helpers) and `3d/build_map.py`.** Build the terrain with numpy inside Blender, which bundles it. Load each tile with `bpy.data.images.load`, set `colorspace_settings.name = 'Non-Color'`, then read pixels and round `×255` before `terrarium_height`. Decimate the terrain to stay within the triangle budget (`Decimate` modifier, planar or collapse) before the check.

- [ ] **Step 4: Run the build and the check to verify they pass**

Run: `npm run diorama:map; node scripts/blender.mjs 3d/tests/check_map.py; npm run diorama:street; node scripts/blender.mjs 3d/tests/check_street.py`
Expected: both checks pass. The street still passes after the helpers move to `kit.py`.

- [ ] **Step 5: Look at a render**

Run: `node scripts/blender.mjs 3d/build_map.py -- --render 3d/renders`
Expected: `3d/renders/map_overview.png` shows Oman raised on a carved plinth, with Musandam in the north, the green Dhofar coast, the deep sea, a lime pin at Muscat and no text.

- [ ] **Step 6: Commit**

```bash
git add 3d/kit.py 3d/build_map.py 3d/build_street.py 3d/tests/check_map.py src/data/diorama.json
git commit -m "feat(diorama): Oman map scene from Natural Earth + terrain tiles"
```

---

### Task 5: Bake and export

**Files:**
- Create: `3d/bake_export.py`, `src/lib/diorama-models.test.ts`
- Create (generated, committed): `public/models/oman-map.glb`, `public/models/oman-map-low.glb`, `public/models/muscat-street.glb`, `public/models/muscat-street-low.glb`, `public/diorama/still.webp`, `public/diorama/map-poster.webp`, `public/diorama/art/stop-<n>[-<part>].webp`
- Create: `public/draco/` (copy of `node_modules/three/examples/jsm/libs/draco/gltf/*`)

**Interfaces:**
- Consumes: `3d/street.blend` and `3d/oman-map.blend` (Tasks 3 and 4).
- Produces GLBs whose node names the web relies on:
  - Street: `street_root`; `van` (with children `van_body`, `van_wheel_fl`, `van_wheel_rl`, `van_wheel_fr`, `van_wheel_rr` and the two logos); every `canvas_*` node, carrying glTF `extras` `{ canvas, service }`; and `CAM_overview`. Static scenery is joined into at most 8 meshes named `static_<collection>`.
  - Map: `oman_root` (the parent of all), `muscat_anchor` (extras `{ street_scale }`), `muscat_pin`, the six `label_*` nodes and `CAM_map`. Static meshes are joined into at most 6 `static_*` meshes.
- Each static mesh has one baked base-colour texture (lighting included) on its own atlas UV. Each `canvas_*` keeps `UVMap` (0..1) as **TEXCOORD_0** for the artwork, and its baked light (grey lighting) goes to its own small texture through a second UV `bake` (**TEXCOORD_1**). The van and wheels are baked separately (no world shadows), so they light correctly anywhere.
- Command: `npm run diorama:export -- --scene street|map|all`.

- [ ] **Step 1: Write the failing test** `src/lib/diorama-models.test.ts`. It reads each GLB, parses the JSON chunk (12-byte header, then chunk 0 is a uint32 length plus `JSON`), and asserts:
  - `street glb has the nodes the page uses`: every name listed above is present, and there are exactly 11 nodes whose name starts with `canvas_`, each with `extras.canvas` in 1..5.
  - `map glb has anchor, pin, labels and camera`: `muscat_anchor.extras.street_scale === 0.07`, plus all six `label_*` and `CAM_map`.
  - `meshes are draco compressed`: `extensionsUsed` includes `KHR_draco_mesh_compression`.
  - `budgets`: the file sizes are muscat-street ≤ 2.5 MB and oman-map ≤ 1.5 MB, and each `-low` ≤ 0.6 × its high variant.
  - `no node is mirrored`: no node `scale` has a negative component.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/lib/diorama-models.test.ts`
Expected: FAIL, ENOENT `public/models/muscat-street.glb`.

- [ ] **Step 3: Implement `3d/bake_export.py`.** For each scene, it works on a copy, never the source `.blend`:
  1. Apply modifiers and join static meshes per collection into `static_<collection>`.
  2. Add a `bake` UV with Smart UV Project (island margin 0.004) and pack the islands.
  3. Bake Cycles `COMBINED` (64 samples, denoise) into 2048² images for high and 1024² for low (scale the high image down for low; don't bake twice).
  4. Swap each material to Principled with Base Color = the baked image, Emission Color = the same image and strength 1, for previews only, since the web replaces materials anyway.
  5. Export GLB with `export_draco_mesh_compression_enable=True`, `export_image_format='WEBP'`, `export_extras=True` and `export_cameras=True`.
  6. Render `still.webp`: CAM_overview, all canvases filled with the placeholder art, 1920×1080, flattened on `#ededed` as `build_street.py` does.
  7. Render `map-poster.webp`: CAM_map, 1920×1080.
  8. Render each canvas's placeholder art (`art_mat`, flat, emission only) to `public/diorama/art/stop-<n>[-<part>].webp` at 1024 px on the long side, keeping the canvas aspect ratio.

  Copy `public/draco/` with a one-off `cp`.

- [ ] **Step 4: Run the export and the test to verify they pass**

Run: `npm run diorama:export -- --scene all; node --test src/lib/diorama-models.test.ts`
Expected: all five tests pass, and the export log prints each GLB's size.

- [ ] **Step 5: Commit**

```bash
git add 3d/bake_export.py src/lib/diorama-models.test.ts public/models public/diorama public/draco
git commit -m "feat(diorama): bake lighting and export map + street GLBs"
```

---

### Task 6: Preview route and page markup

**Files:**
- Create: `src/app/(en)/preview/page.tsx`, `src/app/ar/preview/page.tsx`, `src/components/Diorama.tsx`, `src/components/Diorama.css`
- Modify: `src/i18n/index.ts` (`routes.preview`), `src/i18n/en.json`, `src/i18n/ar.json` (the `diorama` and `meta.previewTitle` keys)
- Modify: `src/components/Shell.tsx` (new prop `loader?: boolean`, default `true`; the preview passes `false`, because the spec skips loaders and the map poster is the first screen)
- Modify: `src/behaviors/loader.ts`. When `html.loader-on` is set but there is no `[data-loader]` element, remove `loader-on` and dispatch `cs:loader-done` at once. Otherwise `motion.js` waits for an event that never comes, and motion only starts at the head script's 7 s timeout.

**Interfaces:**
- Consumes: `diorama.json` stops (for the five chapters, in stop order), and `public/diorama/still.webp`.
- Produces the markup hooks the scripts in Tasks 7–8 use:
  - `section.diorama[data-diorama]` wraps a pinned `div.diorama__pin`, which contains:
    - `div.diorama__art` (canvas host) containing `img.diorama__still` (`src="/diorama/still.webp"`, alt = `diorama.stillAlt`);
    - `div.diorama__labels[data-labels]` with one `span[data-label="<key>"]` per map label;
    - `ol.diorama__hud[data-hud]` with 5 `li`, each `<b class="ltr">0n</b><span>{service title}</span>`.
  - `div.diorama__chapters` holds `section.dchapter[data-stop="<n>"]` × 5, each with `p.dchapter__meta`, `h2.dchapter__title`, `p.dchapter__text` and `a.dchapter__cta[href="#quote"]`. They come first in the DOM in stop order (Arabic visit order is handled in script).
  - `section.diorama__intro` holds the headline (`data-text-reveal`) and lead. `section.diorama__closing` lists print & stationery, gifts & apparel, and acrylic & awards, reusing the existing service names from the dictionaries. Then `p.diorama__credits` with the credit line from Global Constraints.
  - Without `html.motion`, the CSS shows the still in normal flow and the chapters as a normal list. `.diorama__pin` gets `position: sticky` and the section gets its scroll height only under `html.motion .diorama[data-ready]`, which Task 7 sets after the models load.
- i18n `diorama` keys: `eyebrow`, `title` (one `{phrase}` highlight), `lead`, `stillAlt`, `labels.{muscat,nizwa,jebel_shams,sharqiya,salalah,musandam}`, `stops[5].{title,text,cta}`, `hud.label`, `closing.{title,lead}`, `credits`.
  - Arabic labels exactly: مسقط، نزوى، جبل شمس، رمال الشرقية، صلالة، مسندم.
  - English labels: Muscat, Nizwa, Jebel Shams, Sharqiya Sands, Salalah, Musandam.
  - Stop titles and texts reuse the existing service names and descriptions from `en.json`/`ar.json` for signage, vehicle graphics, LED screens, exhibitions and flags & banners. Mark any new Arabic sentence with a `// client review` note in the PR description, not in the JSON.

- [ ] **Step 1: Write the failing check.** Add to `src/lib/diorama-timeline.test.ts` a test `every stop has copy in both languages`. It imports `en.json` and `ar.json` and asserts that `diorama.stops.length === 5` in both, with non-empty `title` and `text`. It also asserts that every key in `diorama.labels` is the same set as the `label_*` keys from Task 4: `muscat, nizwa, jebel_shams, sharqiya, salalah, musandam`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL, `diorama` undefined in `en.json`.

- [ ] **Step 3: Add the routes, the pages** (copy the `/lab/` pages' pattern with `routeKey="preview"` and `noindex: true`), **`Diorama.tsx`, `Diorama.css`** and the dictionary keys.

- [ ] **Step 4: Run the tests and the build, then check the built HTML**

Run: `npm test; npm run build; node -e "const h=require('fs').readFileSync('out/preview/index.html','utf8'); const n=(h.match(/class=\"dchapter\"/g)||[]).length; if(!h.includes('noindex')||!h.includes('/diorama/still.webp')||n!==5) {console.error('preview html check failed',n); process.exit(1)} console.log('preview html ok')"`
Expected: tests pass, the build succeeds, and `preview html ok`. Repeat the check for `out/ar/preview/index.html`, and confirm neither file contains `data-loader`.

Then, in a fresh browser session (`sessionStorage` empty), open `/preview/`. Expected: no "21 years" loader, and `window.__motionReady === true` within 1 s (console). Open `/` in the same fresh state: the loader still shows there.

- [ ] **Step 5: Commit**

```bash
git add src/app/(en)/preview src/app/ar/preview src/components/Diorama.tsx src/components/Diorama.css src/components/Shell.tsx src/behaviors/loader.ts src/i18n src/lib/diorama-timeline.test.ts
git commit -m "feat(diorama): /preview/ route, markup, copy and still fallback"
```

---

### Task 7: The 3D scene runtime

**Files:**
- Create: `src/scripts/diorama/materials.js`, `src/scripts/diorama/scene.js`, `src/scripts/diorama/index.js`
- Modify: `src/scripts/motion.js` (lazy hook)

**Interfaces:**
- Consumes: `stateAt`, `vanPose`, `followCamera`, `lerpCamera`, `toGl` and `qualityTier` (Task 1); the GLB node names (Task 5); the markup hooks (Task 6).
- Produces:
  - `materials.js`:
    - `bakedMaterial(texture) -> MeshBasicMaterial` (sRGB map, no lighting).
    - `mapFadeMaterial(texture) -> ShaderMaterial` with uniforms `uFade` (0..1) and `uCenter` (vec3, the Muscat anchor world position). It discards fragments farther than `mix(2000.0, 0.0, uFade)` km from `uCenter`, with a 30 km soft dither edge.
    - `fillMaterial({ light, art, dir }) -> ShaderMaterial` with uniform `uProgress` (0..1). It samples `light` on uv1 and `art` on uv0, and `greyAlbedo` is the linear value of `#b9b9b4`. The wipe runs along u, from u = 0 when `dir = 1` and from u = 1 when `dir = −1`. Ahead of the edge is grey (`light`); a 6% lime band sits at the edge, then a 6% navy band, then `art × (light / greyAlbedo)`. The artwork is never flipped.
  - `scene.js`: `createDiorama({ host, labelsRoot, dir, tier }) -> Promise<{ apply(state: DioramaState): void; resize(): void; destroy(): void }>`
    - Loads the map first, then the street, at the `-low` URLs when `tier === 'low'`. DRACOLoader decoder path is `/draco/`.
    - Replaces materials: `static_*` → `bakedMaterial`, map `static_*` → `mapFadeMaterial`, `canvas_*` → `fillMaterial` with art `/diorama/art/stop-<n>[-<part>].webp`.
    - Parents `street_root` under `muscat_anchor` with `scale = street_scale`.
    - `apply()` does the following:
      - **Map phase:** `CAM_map`.
      - **Dive:** camera `lerpCamera(mapCam, streetOverviewInMapSpace, dive)`; `uFade = dive`; `street_root` scale goes from `street_scale` to 1 over the second half of the dive while the map root scales by `1/scale` around the anchor, so the view is continuous. At the end of the dive, hide the map and reset the street to its own coordinates.
      - **Street phase:** camera `lerpCamera(overview, followCamera(vanX, dir), min(1, state.street × 8))`; the van pose from `vanPose`; wheel rotation `−(vanX − vanStart) / 0.38` about the axle; each canvas `uProgress = fills[n−1]`.
      - Projects the `label_*` nodes to the screen and positions the `[data-label]` spans with `translate`. Labels show only in the map and dive phases.
    - Pixel ratio `min(devicePixelRatio, tier === 'high' ? 2 : 1.5)`.
  - `index.js`: `initDiorama({ gsap, ScrollTrigger }) -> Promise<void>`
    - Reads `dir` from `document.dir`.
    - Calls `createDiorama`, and on success sets `data-ready` on `[data-diorama]`, hides the still and creates a ScrollTrigger on `[data-diorama]` (`start: 'top top'`, `end: 'bottom bottom'`, `scrub: true`) whose `onUpdate` calls `apply(stateAt(self.progress, dir))`.
    - On any failure (no WebGL2, fetch error, decoder error) it logs `console.warn('Diorama unavailable', e)`, leaves the still in place and doesn't set `data-ready`.
    - Calls `ScrollTrigger.refresh()` after `data-ready` changes the section's height.
  - `motion.js`: `if (document.querySelector('[data-diorama]')) import('./diorama/index.js').then((m) => m.initDiorama({ gsap, ScrollTrigger })).catch(…)`, following the warehouse pattern.

- [ ] **Step 1: Write the failing verification:** open the page in the built-in browser and confirm the scene is not there yet.

Run: `npm run dev`, then open `http://localhost:3000/preview/` in the Browser pane.
Expected: the still and the captions show, and there is no `canvas` element inside `.diorama__art`.

- [ ] **Step 2: Implement `materials.js`, `scene.js`, `index.js` and the `motion.js` hook.**

- [ ] **Step 3: Verify it in the browser**
  - Reload `/preview/` and check the console has no errors.
  - Scroll top to bottom. The map shows, it dives into Muscat with no hard cut, the van drives and stops five times, and each canvas fills with a lime then navy wipe that reveals the artwork.
  - Scroll back to the top. Every canvas returns to grey and the van returns to the start.
  - Repeat on `/ar/preview/`: the van enters from the right, faces left, its logo reads correctly, wipes run right to left and labels are in Arabic.

- [ ] **Step 4: Verify the failure path** (Review Focus 3): in DevTools, block `*.glb` (or temporarily point the street URL at a missing file), then reload. Expected: the still is visible, the page scrolls normally with no tall empty section, and the console shows `Diorama unavailable`.

- [ ] **Step 5: Verify a resize** (Review Focus 4): mid-journey, switch the Browser pane to the mobile preset, then back to desktop. Expected: no stretched image, labels stay on their places, and the van is still in frame.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/diorama src/scripts/motion.js
git commit -m "feat(diorama): 3D scene runtime with map dive, van and canvas fills"
```

### Checkpoint: client look-dev gate (spec Q5)

Stop here. Send the user a screen recording or screenshots of `/preview/`: the map, the dive and one full stop. They forward it to the client. Continue with Task 8 only when the user confirms the client approved the look. Any change they ask for goes back into Tasks 3–5, which are scripted and re-runnable.

---

### Task 8: Captions and the chapter HUD

**Files:**
- Create: `src/scripts/diorama/captions.js`
- Modify: `src/scripts/diorama/index.js`, `src/components/Diorama.css`

**Interfaces:**
- Consumes: `DioramaState.chapter` (visit order), `dir`, and the `.dchapter` and `[data-hud] li` elements.
- Produces `initCaptions({ root, dir, gsap }) -> { show(chapter: number): void }`. The visit-order chapter k maps to stop `dir === 1 ? k : 4 − k`.
  - The swap animation follows `src/scripts/journey.js`. The outgoing title's lines rise out through a mask and the incoming lines rise in. Everything except the outgoing and incoming captions is hidden at once, so fast scrolling never stacks captions.
  - **English only:** after the lines land, words get the lime marker highlight one by one, using SplitText `type: 'lines,words'` with a 0.06 s stagger on the existing `mark` style background. **Arabic:** lines only, no word split.
  - The HUD marks the current stop's `li` with `is-on` and the ones before it with `is-done`, in visit order. In Arabic the list is visually reversed through flex order, not by reversing the DOM, so screen readers keep stop order.

- [ ] **Step 1: Write the failing verification:** on `/preview/`, scroll into stop 1. Expected now: no caption is shown over the scene.

- [ ] **Step 2: Implement `captions.js`** and call `show(state.chapter)` from the ScrollTrigger `onUpdate` in `index.js`, only when the chapter changes.

- [ ] **Step 3: Verify it in the browser**
  - On `/preview/`, each stop shows exactly one caption, and English words light up in turn.
  - Dragging the scrollbar from top to bottom in one move leaves exactly one caption visible (`document.querySelectorAll('.dchapter[style*="visible"]').length === 1` in the console after it settles).
  - On `/ar/preview/`, the first caption is Flags & Banners, lines rise with no per-word animation, and the HUD advances from the right.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/diorama/captions.js src/scripts/diorama/index.js src/components/Diorama.css
git commit -m "feat(diorama): chapter captions and HUD"
```

---

### Task 9: Budgets, phones and reduced motion

**Files:**
- Modify: `scripts/size-report.mjs`

**Interfaces:**
- Consumes: the built `out/` folder and `public/models/*`.
- Produces size-report lines `Diorama map / street / low variants` and `JS lazy (diorama)`, with the ceilings from Global Constraints. It prints `OVER` next to any line above its ceiling.

- [ ] **Step 1: Add the diorama lines to `size-report.mjs`.** The lazy-JS line counts chunks whose content includes `initDiorama` or `GLTFLoader`. Leave the existing car and lazy lines as they are.

- [ ] **Step 2: Run the build and read the report**

Run: `npm run build`
Expected: the diorama lines print with no `OVER`.

- [ ] **Step 3: Verify phones.** In the Browser pane, set the mobile preset and reload `/preview/`.
  - Expected: the network panel shows `oman-map-low.glb` and `muscat-street-low.glb`, not the high variants.
  - Expected: the journey runs end to end, with the van visible at each stop in portrait.
  - If the van leaves the frame in portrait, raise `follow.eye[1]` (further back) only when `aspect < 1`, through a branch in `followCamera` with its own test in `diorama-timeline.test.ts`.

- [ ] **Step 4: Verify reduced motion** (Review Focus 5). Run in the console `document.documentElement.classList.remove('motion')`, then reload with DevTools rendering set to "prefers-reduced-motion: reduce". Expected: the still and five captions appear as normal content, with no canvas and no pin spacer. Also check with JavaScript disabled.

- [ ] **Step 5: Run the full test suite**

Run: `npm test; npm run test:geo; npm run diorama:check`
Expected: everything passes.

- [ ] **Step 6: Commit**

```bash
git add scripts/size-report.mjs
git commit -m "feat(diorama): size budgets for the preview route"
```

---

## Not in this plan

- The homepage swap at launch (spec Q1): the diorama replaces the hero and the "how a job runs" section, and the line-art car stage is retired. That's a separate plan after the client signs off.
- The Arabic lane decision (spec Q3): change `rtl.laneY` when decided.
- Real client artwork in place of the placeholders: swap the files under `public/diorama/art/`, with the same names and aspect ratios.
