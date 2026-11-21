# Diorama journey v2: polish and interaction

Status: **approved 2026-11-20** with both open questions answered (see the end).

This builds on [the v1 design](2026-11-20-muscat-diorama-journey-design.md) and on what v1 already built (plan Tasks 1–7: the shared config and timeline, the Oman map and Muscat street scenes, the bake/export pipeline, `/preview/`, the 3D runtime). It replaces v1's Tasks 8–9. The reference is [the Expedia Route 66 teardown](2026-11-20-expedia-route66-teardown.md).

## Why

On seeing the first working build, the user's verdict was that the idea is good but it feels like an early prototype: the polish is lacking and it feels less interactive. The user pointed at Expedia × Hertz "Route 66: 100 Years 100 Stories" as the bar. Its finish comes from four things v1 lacks:
- **Direct interaction:** drag, click, postcards, story sheets.
- **Live, lit, moving rendering:** surface detail, reflections, depth of field, grain, idle motion.
- **A cinematic opening.**
- **Real photos.**

The user chose to spend the weight that takes.

## Decisions taken (by the user, 2026-11-20)

- **Budget:** about **12 MB on desktop, about 5 MB on phones**, streamed behind a light first screen.
- **Approach A:** a short **film rendered in Blender** for the opening, plus a **much richer live 3D scene** for everything interactive.
- **Logo:** the English wordmark on both van flanks (unchanged).
- **Still no entry gate and no audio.**

## Goals

1. **Cinematic opening.** A short looping film of the van rolling down our Muscat street at golden hour, under the headline. On the first scroll the film tilts and shrinks away like a postcard and the live Oman map is behind it.
2. **You can touch it.**
   - On the street, **dragging sideways drives the van** (on touch and mouse), as well as scrolling.
   - Each stop has a **glowing hotspot**. Clicking it opens a **postcard** (photo, job title, client and place, "See the job").
   - "See the job" opens a full-screen **story sheet** with its own link (for example `/preview/signage/`), a photo gallery, previous/close/next controls and the quote button. The back button closes it.
   - **Previous/next stop buttons** jump between stops.
   - **First-visit hint cards** teach one gesture at a time ("Scroll or drag to drive", then "Tap a glowing spot").
   - The map has **clickable pins at real project locations across Oman**, each opening a postcard.
3. **It looks like a real miniature.**
   - Surface detail (normal maps on plaster, asphalt, sand, rock).
   - **Reflections** on glass, water and the van's paint.
   - **Tilt-shift depth of field.**
   - **Film grain, a warm grade and a soft vignette.**
4. **It's alive when nobody scrolls.**
   - Flags and the banner wave, palms sway, and the water moves.
   - **The LED screen plays a looping brand video** once it's "installed".
   - The van idles with a slight bob, and its wheels turn with its speed.
5. **Designed chrome and transitions.**
   - A **chapter progress bar** (Oman · Muscat · the 5 stops · Quote).
   - The quote button is always visible (the existing sticky CTA).
   - **The route draws itself** on the map.
   - **Giant display statements** reveal through **torn-paper edges** between chapters.
   - A **photo-card collage** drifts at different depths in the closing section.
   - Postcard and story-sheet changes use a **WebGL distortion transition** between photos.
6. **A short branded loader.** The Oman outline draws itself as the progress bar, with one "Did you know" line about Creative Screens (for example "21 years of printing in Muscat"). It shows only while assets load: never on a cached visit, never more than about 1.5 s when assets are already there, and the page underneath is never blocked once the first screen is ready.

## Non-goals

- No entry gate, no audio, no vehicle swap, no collectibles. Visiting all five stops ends on the quote button.
- Not a CMS feature yet. Stories and pins are a data file in the repo.
- The homepage stays untouched until launch (unchanged from v1).

## Anti-goals (it fails even if it works)

- **It reads as an Expedia clone.** Their cream, mustard and brown palette, their fonts, their layouts copied one-to-one, their copy, art, video or code: none of it. We use Creative Screens navy `#131d27`, lime `#bbd440`, paper `#ededed` and the existing type.
- The first screen is slower than v1. The film poster and headline must paint as fast as v1's poster.
- Interaction that only works with a mouse. Every hotspot, postcard and sheet works by touch and keyboard, and announces itself to screen readers.
- Fake work presented as real. Placeholder stories and pins are clearly placeholders and never ship to the public homepage.
- Mirrored text or logos in Arabic (unchanged rule).

## Constraints

- **Stack:** Next.js static export, Three.js 0.187, GSAP, Lenis. Post-processing uses `three/examples/jsm/postprocessing` (no new dependency). Textures stay WebP inside the GLB: KTX2 would need the KTX-Software CLI, a new install we skip unless the budget forces it.
- **Budgets:**

  | | Desktop | Phone |
  |---|---|---|
  | Film | about 5 MB, 1920×1080 H.264 | about 1.8 MB, 1280×720 |
  | Map | ≤ 2.5 MB | ≤ 1.2 MB |
  | Street | ≤ 3.5 MB | ≤ 1.5 MB |
  | LED loop video | ≤ 0.5 MB | ≤ 0.5 MB |
  | **Total before story photos** | **≤ 12 MB** | **≤ 5 MB** |

  Story photos load only when a postcard or sheet opens. **First paint (poster image, headline, CSS) is at most 350 KB.**
- **Arabic:** the van drives right to left, rotated and never mirrored, and the wipes run right to left (all as v1). Arabic gets **its own film** with the van driving right to left. Each visitor downloads only one film.
- **Reduced motion:**
  - The film poster replaces the film, with no tilt.
  - No idle animation, depth of field or grain.
  - Postcards and sheets still open, without motion.
  - No JS: v1's still image and plain captions, plus links to the story pages.
- **Story pages** are real static routes (`/preview/<stop>/`, `/ar/preview/<stop>/`), so links work without JS and can be shared.

## Approaches (decided)

| | | Trade-off |
|---|---|---|
| **A. Rendered opening film + richer live scene (chosen)** | Blender renders the opening film. The live scene gets surface detail, reflections, post effects, idle motion and interaction. | The best first impression on every device, plus full interaction. Costs a render step and two films (EN/AR). |
| B. Live scene only | All of the budget goes into realtime: bigger textures, real-time shadows. | Simpler, but the first impression depends on the visitor's GPU. |
| C. Mostly pre-rendered | Scroll scrubs rendered clips, with click targets on top. | The most cinematic, but you can't drag the van and every Arabic clip is doubled. Works against the "less interactive" feedback. |

## The experience, in order

1. **Loader** (only while loading): the Oman outline draws itself, with one "Did you know" line.
2. **Opening:** the film fills the screen behind the headline and the "Scroll to explore" cue. The header shows the chapter progress bar.
3. **Postcard tilt:** the first scroll tilts and shrinks the film away (3D rotate and scale, a paper border, a slight drop shadow), revealing the live map behind it.
4. **Oman map:**
   - The route line draws itself to Muscat. The pointer gives a gentle parallax tilt (no full panning).
   - Project pins pulse softly. Clicking one dims and blurs the map and opens its postcard.
5. **The dive into Muscat** (as v1, retimed to sit under a display statement such as "Every street needs a sign").
6. **The street:**
   - The van drives on scroll or sideways drag. At each stop it pulls in, the canvas wipes from grey to the brand job, and the stop's hotspot starts glowing.
   - The caption card shows the stop: the service, one line, and "See the job".
   - Previous/next stop buttons sit beside the HUD.
7. **Story sheet** (from a postcard or a caption): full screen, its own URL. Hero photo, title, client and place, three to six photos with captions, the service link, the quote button, and prev/next stop. Esc, the close button or the back button returns to the same point in the journey.
8. **Closing:**
   - A torn-paper transition into a giant statement.
   - A photo-card collage of print, gifts and awards, drifting at different depths.
   - The quote button, then the credits line.

## Rendering details (decided; tuning left to the builder)

- **Light:** keep v1's AgX-baked diffuse light as the base. The baked colour drives the diffuse look, so there's no double lighting.
- **Reflections and surface detail:** a specular layer on top, from an environment map plus normal maps:
  - normal maps on plaster, asphalt, sand and rock, baked or procedural from Blender;
  - an environment map rendered from our own Blender sky;
  - roughness per material: glass, water and van paint shiny; plaster matte.
- **Water:** scrolling normal maps plus environment reflection, on the street's sea and the map's sea.
- **Post effects:**
  - tilt-shift depth of field, with the focus band on the van or the open postcard's pin;
  - film grain, a warm grade (lift the shadows, warm the highlights) and a vignette.
  - Desktop gets all of it; phones get grain and grade plus a cheaper blur.
- **Idle motion** in shaders, so it costs no CPU:
  - flags and the banner wave along their width;
  - palms sway with height;
  - the van bobs about ±1 cm and its wheels turn with its speed;
  - the LED screen swaps to a looping video texture after its fill.

## The film

- **Rendered in Blender** (EEVEE, AgX, the same light as the bake) from `3d/street.blend`: a low drone shot following the van along the street at golden hour, about 8 s, seamless loop.
- **Exported as H.264 MP4** plus a WebP poster frame: 1920×1080 and 1280×720 variants, EN and AR (Arabic drives right to left), so four files, and a visitor loads one.
- Muted, `playsinline`, autoplay. Paused when off-screen and when reduced motion is on.

## Content (needs the client)

| Content | Needed from the client | Placeholder until then |
|---|---|---|
| Five stop stories | 3–6 real job photos each, plus title, client (or "a café in Qurum"), place, one line, a service | Clearly marked placeholder photos |
| Map pins | Real project locations across Oman, each with one photo and a one-line title | Six placeholder pins: Muscat, Sohar, Nizwa, Sur, Salalah, Duqm |
| LED loop | Brand animation | A generated lime/navy brand loop |
| Loader fact | One true "Did you know" line | "21 years of printing in Muscat" (from the existing loader) |

Data lives in `src/data/diorama-stories.ts` (EN/AR), with a `placeholder: true` flag that the page shows as a small "sample" tag.

## Accessibility

- Hotspots and pins are **HTML buttons** positioned over their 3D points, with labels. Tab moves through them in journey order, Enter opens, and Esc closes.
- The story sheet traps focus, returns focus on close, and has a heading structure.
- The film has no meaning-bearing content, so it's `aria-hidden` and the headline carries the message.

## Left to the builder

- Shader details of the depth of field, grain, grade, water and sway.
- Exact timings and easing of the tilt, the reveals and the distortion transition.
- Atlas layout and normal-map authoring, within the budgets.
- The hint-card wording (short, one gesture each) and when each shows (first visit, dismissed on first use, remembered in `localStorage`).
- Pin and hotspot styling, in the brand palette.

## Calls made after the builder check (mine; correct any of them)

1. **Reduced motion:** the live scene does **not** load. The still image gets the five stop hotspots as HTML buttons at fixed positions (projected from `CAM_overview` at export time and stored in `diorama.json`). Postcards and story sheets open from those buttons and from the plain captions, without animation. *Why:* the motion gating is unchanged, it's accessible, and it costs nothing.
2. **A shared story link** (`/preview/signage/`) opens a **light standalone story page**, with no 3D, the film or the 12 MB. Its close button goes to `/preview/#stop-1`, which scrolls the journey to that stop. Inside the journey, the same sheet opens as an overlay with `history.pushState`, and back closes it. *Why:* a shared link shouldn't cost the full budget.
3. **The loader is non-blocking.** No overlay. The Oman outline draws itself in the opening as the download progress of the map and street, sits under "Scroll to explore", and settles into the cue when they're ready. Scrolling early simply shows the map poster until the scene arrives. *Why:* "never slower than v1" plus "show while loading" leaves no room for an overlay.
4. **Map-pin postcards** have one photo, a one-line title and a **"See this service"** button that opens the matching stop's story. No extra story routes. *Why:* it keeps the client ask at one photo per pin.
5. **A second look-dev gate before the films.** The client sees the upgraded live scene (reflections, depth of field, grain, grade, idle motion) before the four film renders, so look changes aren't paid for twice.
6. **Drag-to-drive** scrubs the same scroll position, so scroll progress stays the only source of truth.

## Answered (by the user, 2026-11-20)

1. **Arabic lane and stop order:** the van uses the **far lane** (`rtl.laneY = +1.75`, correct for right-hand traffic when driving right to left). It meets the stops in **reverse order**, Flags first. The progress bar, previous/next buttons, sheet previous/next and hotspot Tab order all follow the visit order.
2. **The opening film:** the surfaces **fill as the van passes**. A short stretch of street with one or two surfaces wiping into brand colour as the van drives by, in a seamless loop (the camera holds on that stretch).

## How it's built (the user, 2026-11-20): "polished, built live inside Blender, clean and clear"

- **All modelling runs live in the user's open, MCP-connected Blender**, so each piece can be watched as it's built. The Python build scripts in `3d/` stay the single source of truth: they're executed inside the live session, not typed by hand, so everything stays repeatable.
- **Long, blocking work runs headless** in the background (Cycles bakes, film renders, GLB export), because it would freeze the user's window for minutes. The results are opened back in the live window to review.
- **The scene stays clean and clear:**
  - numbered collections (`00 Map`, `10 Street`, `20 Stops`, `30 Van`, `40 Props`, `90 Rig`);
  - every object, mesh and material named for what it is;
  - no stray or orphan data, and non-destructive modifiers;
  - saved camera views and Material Preview set up, so the file opens ready to look at.
