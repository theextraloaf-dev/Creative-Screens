# Diorama v3: the Oman map is the journey

Status: **approved by the user, 2026-11-20** ("build it like this… we can morph to ours").

This builds on [v2](2026-11-20-diorama-v2-polish-interaction-design.md). The reference is the Expedia × Hertz Route 66 site (see the [teardown](2026-11-20-expedia-route66-teardown.md) and the user's six screenshots).

## What we take, and what we morph

| Theirs | Ours (morphed) |
|---|---|
| A 3D US map as the main stage; the van drives the route; each state opens a page | **A 3D Oman map as the main stage.** The van drives a route Muscat → Sohar → Nizwa → Sur → Salalah. Each city is a service stop; the Muscat stop dives into our street diorama (our "Illinois page"); the others open story pages. |
| Warm tilt-shift miniature: textured ground, trees, rocks, grass, a fine cartographic grid, a red route, chunky 3D pins with icons, the van on the map | **The same treatment:** sand, rock and scrub textures; acacia and ghaf trees; rocks; grass tufts; the grid overlay; a **lime** route line; extruded 3D pins (**star** = our work, **signpost** = a service); our van riding the route. |
| A yellow high-roof camper van with a spare wheel and a roof rack | **Our own** high-roof van with a spare wheel on the rear door, a roof rack, black side trim and toy proportions, in **Creative Screens navy with a lime band and the wordmark.** Not Hertz yellow (their trademark), and no manufacturer shape. |
| A full-screen "States" menu: giant stacked type over a dimmed photo | **A full-screen "Services" menu:** our eight services in giant stacked type (our display font) over a dimmed still from our film. Tapping one goes to that stop or its page. |
| A loader: logo lockup, a route line drawing itself, "Did you know" | **A loader:** a paper page with a topographic contour texture, the **Creative Screens** lockup, **Oman's route** drawing itself as progress, and one "Did you know" line. First visit only; it lifts as soon as the map is ready (about 2 s at most when cached). |
| A cinematic photo of a desert road as the intro, with a big title | **Our own near-photoreal render** (Blender Cycles): a Hajar mountain road at golden hour, our van coming towards the camera, under the title lockup. No entry gate and no audio (the user's earlier decision, kept). |
| Motion: postcard tilt, torn-paper reveals, the van along the route, pins popping, type reveals | **The same motion vocabulary,** in our timing. |

## Unchanged from v2

- Arabic: right to left, the van rotated and never mirrored.
- Accessibility: buttons for pins, keyboard support, story sheets with their own URLs, a reduced-motion still.
- Budgets: 12 MB desktop / 5 MB phone. The placeholder "Sample" tags. Everything built live in the user's Blender, with clean, numbered collections.

## Journey structure (new)

1. Loader.
2. Intro render under the title.
3. Postcard tilt into the map.
4. The map journey: scroll or drag drives the van along the route.
   - The camera is close and oblique with tilt-shift, following the van, as theirs does.
   - At each city the van pauses and the pin pops; its postcard opens the story.
5. At Muscat (signage), "Enter the street" dives into the street diorama (v2), then returns to the map.
6. The closing collage and quote.

The Services menu is reachable from the header at any time.
