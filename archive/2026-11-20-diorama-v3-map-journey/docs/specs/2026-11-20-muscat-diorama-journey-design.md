# Muscat street diorama + van journey: design

Status: **approved 2026-11-20**, with the decisions recorded under "Open questions". The Oman map intro was added and approved the same day, including the two public-data downloads. Nothing on the website changes until an implementation plan exists.

## Why

Mid-build, the client asked for a more premium, less "geometrical" homepage. Today the 3D scenes are navy line art on grey paper (raw-shader line drawings: `src/scripts/three-kit.js`, `stage3d.js`, `warehouse.js`). They want lit, solid 3D that reveals itself as you scroll, and they want to keep the blocky display fonts. The new homepage is for the site launch, so it has to feel finished and load fast on Omani mobile connections.

The idea is to show what Creative Screens does without a list of services. A small branded van drives down a toy-like Muscat street. At each stop a plain grey surface (a shop sign, a parked bus, a building screen, a stand, a row of flags) fills with brand colour. That fill is the "we print it" moment, taken from Biegajaca Sztuka's grey-to-colour hero.

## Goals

- A stylised, lit 3D Muscat street that reads as a **diorama**: a cut-out block of city on a plinth, toy-like (rounded edges, soft materials, warm light), never photoreal.
- A branded Creative Screens van that drives through the street as the visitor scrolls, stopping at each service.
- At each stop, one grey "canvas" surface fills with colour, using a lime/navy wipe in the manner of Sweet Tape.
- A chapter progress HUD (which stop you're at, how many are left).
- Captions per stop with a word-by-word highlight in English, and the existing line-by-line reveal in Arabic (never per word or per letter in Arabic).
- Warm late-afternoon light in the manner of Orvae.
- It works in both languages. In Arabic the van drives the other way, but the van model is **never mirrored**, so its Arabic and English livery reads correctly.

## Non-goals

- No long loader, no "Enter" gate, no audio.
- No photoreal city and no real landmarks modelled accurately. The street is Muscat-flavoured (Mutrah and Old Muscat), not a map.
- No changes to the current homepage, service pages or Arabic routes while this is in preview.
- Not a CMS feature. The artwork that fills each canvas is fixed in the build for now.

## Anti-goals (it fails even if it works)

- It looks like a generic low-poly asset pack or a mobile game.
- The first screen takes more than ~3 s to show something on a mid-range phone on 4G, or the scroll stutters.
- Visitors can't tell what Creative Screens sells by the end of the journey.
- Anything mirrored in Arabic: the van, its logo, the signs.
- The scene relies on hover, so it falls apart on touch.

## Constraints

- Stack stays as it is: Next.js 16 static export, GSAP + ScrollTrigger + SplitText, Lenis, Three.js 0.187 (`README.md`). No new framework.
- Rules already in the repo: logical CSS properties only, nothing mirrored, no per-letter animation, none in Arabic. Staging stays `noindex`.
- Reduced motion or no JS: content shows in its final form (the `motion` class is never set). For this scene that means a **static illustration** (one still render) with the stop captions as ordinary text.
- Assets are modelled procedurally in Blender from scripts in `3d/`, the same way as `3d/build_car.py`, so changes are repeatable. Blender 5.3.
- The user's asset library (`F:\Blender Asset Lib`) has birch, cherry and fir trees, which don't grow in Muscat. Palms, bougainvillea and acacia are modelled as simple stylised shapes instead.
- No manufacturer shapes or badges on vehicles. The van and the bus are generic.

## Approaches

| | How it works | Trade-offs |
|---|---|---|
| **A. Real-time Three.js, lighting baked in Blender (recommended)** | Model in Blender, bake the warm light and soft shadows into textures/vertex colour, export one Draco-compressed glTF. Three.js draws it with cheap unlit-plus-baked materials. Only the van and the canvas fills move. | Premium look at low runtime cost; works on phones. The camera can adapt to any screen shape, and the Arabic direction is just the path run backwards. Costs: a bake step in the pipeline, and the light can't change at runtime (it doesn't need to). |
| B. Pre-rendered frames (Cycles), scroll scrubs an image sequence or video | Render the whole journey in Blender, play frames on scroll. | Best possible image quality, but tens of MB, a fixed 16:9 framing that crops badly on phones, a second full render for Arabic, and the canvas artwork can't change without re-rendering. Works against the load-speed anti-goal. |
| C. Real-time with live lights and shadows | Same glTF, but Three.js lights and shadow maps do the lighting. | Fastest to iterate on, but shadows cost the most on phones, and the result looks flatter and more "default Three.js" than a bake. |

**Pick: A.** It's my recommendation and **needs your OK**. B fails the phone and load budget, and C looks cheaper for about the same build effort. B is still used once, for the reduced-motion still and the social image.

## The scene (modelled in this pass)

Source: `3d/build_street.py` → `3d/street.blend`. Axes match the car: +X is the driving direction in English, the camera sits on the −Y side looking +Y, +Z is up, metres.

**Diorama block.** A street about 80 m long and 26 m deep sits on a plinth with visible cut edges (sand-coloured soil layers), so it reads as a model on a table. Behind it, low stylised Hajar mountains in brown-ochre. A strip of sea sits at the far end for the corniche feel.

**Street.** A two-lane road with kerbs, a pavement each side, street lamps and palms. Buildings are low white-and-sand cubes with flat roofs, crenellated parapets, arched doorways, wooden window screens (mashrabiya-style grilles) and the odd small dome. The palette is warm off-white, sand, terracotta, teal shutters, and brand navy and lime used only on Creative Screens items.

**The van.** A generic high-roof panel van in brand navy with a lime band, both sides branded. It drives in the lane nearer the camera, the right-hand lane as in Oman.

**The five stops** (my proposal from the last session, **not yet confirmed by you**). Each has one object named `canvas_<n>_<service>`, grey (`#b9b9b4`) in the base scene, with clean 0–1 UVs so the web can fill it with artwork:

| # | Stop | What fills with colour | Rough X |
|---|---|---|---|
| 1 | Shopfront signage | The fascia sign over a café/shop | −28 |
| 2 | Vehicle wrap | The flank of a parked white minibus in a lay-by | −14 |
| 3 | LED screen | A big screen on the front of a taller building | 0.5 |
| 4 | Exhibition stand | The back wall, header and counter of a stand in a small plaza | 14.5 |
| 5 | Flags & banners | Four feather flags and a banner on the corniche sea wall | 35 |

The van stops about 7 m before each canvas (`STOPS` in the script), so the van and the filled surface share the frame. Near-side palms are kept out of the space between the follow camera and the van at each stop, so they never hide it.

Print & stationery, gifts and apparel, and acrylic and awards go in a closing product section after the journey, not in the street.

**Light.** A low warm sun from the front left (late afternoon), a soft blue sky fill and gentle ambient occlusion. Filmic/AgX view with a slightly warm grade.

**Cameras.** One overview camera (the "whole diorama" opening shot) and a follow camera that tracks the van at about 30° above the road on the −Y side. The camera keys per stop live in the .blend and are exported with it.

**Animation.** The van's path is a straight line along the near lane with an ease-in and ease-out at each stop. In the web build, scroll drives position along that path, so nothing is baked into time.

## The Oman map intro (added 2026-11-20, chosen by you)

The page opens on a 3D map of Oman, a cut-out block of the country on a plinth, then dives into Muscat, where the street diorama and the van's journey begin. The reference is the user's Oman 3D map image: carved rocky plinth edges, textured terrain (sand, rock, the green Dhofar coast), deep blue sea with surf and small boats. We design from it but don't copy it: the image is watermarked by geognos.com and never appears on the site.

**What's on the map**
- **True geography:** Oman's real outline including the **Musandam** exclave in its true position, never left out, with terrain heights from public elevation data. Heights are exaggerated about 15× so the Hajar range and Jebel Shams read at this scale.
- **Neighbours:** the UAE, Saudi Arabia and Yemen as flat, plain beige land with no terrain. Borders as thin lines from the same public dataset.
- **A few miniature landmarks** in the street's style, all generic, never accurate replicas: a fort for Nizwa, dunes for the Sharqiya Sands, green hills for Salalah, and a few dhows and ships on the sea.
- **Muscat** marked by a lime pin, the only brand colour on the map.
- **No text baked into the model.** Place labels are HTML in both languages, so Arabic is never mirrored or rasterised.

**The dive (my call on the mechanism)**
The street diorama sits as a tiny tile at Muscat's position on the map. The camera dives toward the pin, the map's terrain fades out around Muscat, and the street tile grows until it fills the frame. Then the scene hands over to the street's own coordinates, so there's no hard cut. The map's sea and plinth style continue into the street, which takes on the same finish: carved rock edges and a darker sea with foam. That keeps the two models from looking like they came from different worlds. The exact timing and easing are left to the builder.

**Data (needs your OK to download)**
- **Outline and borders:** Natural Earth 1:10m Admin-0 countries (public domain, zip of about 5 MB).
- **Terrain:** AWS Terrain Tiles (Terrarium PNG, open data from SRTM, GMTED and others) at zoom 6–7 over Oman, about 30 tiles and 3 MB in total. Its licence asks for a credit line, which goes in the footer or credits.
- Both are processed once in Blender by a script in `3d/`. Nothing is fetched at runtime.

**Budget:** the map adds about 1–1.5 MB (a decimated terrain mesh plus a baked colour/light texture), so the page total is about 4 MB. The map loads first and the street streams in while the visitor reads the intro, so first paint is no later than before. Phones get a smaller map texture.

## The page (decided direction, details left to the builder)

- **Route:** its own `noindex` route, `/preview/` and `/ar/preview/`, with the current homepage untouched. This is a proposal **not yet confirmed by you**.
- **Sequence:** the Oman map with the headline, the dive into Muscat, then the street diorama overview, five chapters (one per stop), and the closing product section and call to action.
- **Per chapter:** the van eases into the stop, the camera settles, the canvas fills with a lime then navy wipe that reveals the artwork, the caption comes in, and the HUD advances.
- **Arabic:** the journey runs right to left. The path is reversed and the van rotated 180°, never scaled by −1. The camera stays on the same side, so the visitor sees the van's other flank, which carries its own correct livery.
- **Phones:** a lighter scene (lower texture size, fewer props, simpler pixel ratio), the same story. A fallback to the 2D stage if WebGL fails, as `stage3d.js` already does.
- **Reduced motion / no JS:** one still render of the diorama with all five canvases filled, and the captions as plain text.
- **Budgets (my call, adjustable):** the glTF at most about 2.5 MB with Draco and compressed textures, about 150k triangles, 60 fps on desktop and at least 30 fps on a mid-range Android. First paint with the poster image while the model streams.

## As built (first modelling pass, 2026-11-20)

- `3d/build_street.py` builds everything from code. Run it with `blender --background --factory-startup --python 3d/build_street.py -- --render 3d/renders [--glb out.glb]`. It saves `3d/street.blend`.
- About 106k triangles in 50 objects, already merged per building/prop group. A test GLB with Draco and no baked textures yet is **434 KB**.
- The van carries the real wordmark from `public/img/logo-wordmark.svg` in lime on navy. On the far side it's rotated, not mirrored.
- Wheels turn by a driver from the van's X, so scrubbing the path turns them.
- Renders are in `3d/renders/`: the overview in grey and filled states, plus follow-camera frames at stops 1 and 3.
- **Not done yet:** the light bake, texture atlas, real canvas artwork, an Arabic livery, phone LODs and the web export into `public/models/`. All of these belong to the implementation plan.
- The Blender MCP isn't usable yet: the add-on isn't installed in Blender (Blender Lab extensions repo, `https://lab.blender.org/`), and the MCP's background mode needs `BLENDER_PATH`. Headless Blender from the shell does the same job meanwhile.

## Left to the builder

- Shader details of the wipe (mask shape, edge glow), as long as it reads as lime then navy then artwork.
- Exact camera easing and timings per chapter.
- Bake resolution and atlas layout, within the budget.
- Prop density on phones.
- Placeholder artwork for each canvas until the client supplies real jobs.

## Needs your OK

1. Rendering approach A (real-time, lighting baked in Blender).
2. The five stops above, and print, gifts and awards in a closing section.
3. The `/preview/` route, with the homepage untouched until launch.

## Open questions (from the builder check)

**Decisions (2026-11-20):**
- Q1 and Q2 approved as proposed.
- Q3 (Arabic lane and stop order) is deferred. The scene has both lanes, so it can be settled when the Arabic route is built.
- Q4: the van keeps the **English wordmark on both flanks**. No Arabic livery.
- Q5 has no answer yet, so the proposed look-dev gate stands.

The questions as asked:

1. **At launch, does the diorama replace the whole homepage?** If so, the hero video, the line-art warehouse and car scenes, ServiceList and the "21 years" loader go away. If not, two WebGL scenes share a page on phones. *My proposal:* the diorama replaces the hero and the warehouse "how a job runs" section, ServiceList becomes the closing product section, and the line-art car stage is retired.
2. **Size budget.** `scripts/size-report.mjs` caps lazy JS at 40 KB and the 3D model at 80 KB, citing `docs/ARCHITECTURE.md` §8, which isn't in this folder. The glTF/Draco loaders alone pass 40 KB, and the untextured street is already 434 KB. *My proposal:* a separate budget for `/preview/` and the diorama, of about 2.5 MB of model and textures streamed after first paint, plus about 120 KB of loader JS.
3. **In Arabic, which lane is the van in, and is reverse stop order fine?** Oman drives on the right, so a van going right to left belongs in the far lane. Running the path backwards also means Arabic visitors meet Flags first and Signage last. *My proposal:* the far lane in Arabic, a mirrored set of camera keys (camera moves only, never the model), reverse order accepted, and HUD numbers that count in visit order.
4. **Arabic livery.** There's no Arabic logotype in the repo. *My proposal:* ask the client for their official Arabic logo. Until then both flanks carry the Latin wordmark, and the reduced-motion still is rendered once per language.
5. **Launch date and the client's look sign-off.** *My proposal:* a look-dev gate before the full bake: one baked block, the van and one canvas fill, approved by the client.
