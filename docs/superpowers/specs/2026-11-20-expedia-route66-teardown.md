# Teardown: Expedia × Hertz "Route 66: 100 Years 100 Stories"

Studied on 2026-11-20 at `expedia.com/route66/` (the 3D map) and `expedia.com/route66/state/illinois` (a state page), because the user felt our first diorama build reads as an early prototype: the polish is lacking and it feels less interactive. We take their techniques and interaction model, built on our own Muscat scene and brand. We don't take their artwork, text, video or code.

## Stack (same as ours)

Three.js, GSAP, Lenis and React. The state page is a one-screen document whose content is driven by a virtual scroll. The 3D map page uses three WebGL canvases.

## What makes it feel finished

**Interaction (the biggest gap; ours is scroll-only)**
- **Drag to drive.** Dragging the 3D map moves the van along the route and the camera follows.
- **Clickable pins.** Clicking one dims and blurs the map, and a tilted "postcard" pops up with a photo, the place name, an "Explore" button, and next/previous stop arrows.
- **Onboarding hint cards** in a corner teach one gesture at a time: "Travel Route 66: drag the map", then "Explore POIs: click on POIs".
- **Stories** are a large rounded card with five numbered stories, previous/next buttons, a "Read the story" button and a wavy route line of round thumbnails as navigation.
- **"Read the story"** opens a full-screen sheet with its own URL (`/illinois/andys-jazz-club`), so it can be shared and works with the back button. The sheet has previous/close/next controls and scrolls on its own.
- **Light game layer:** a "Swap vehicle" button and a collectible counter ("Collect all state key chains 1/8").

**Rendering (why it looks premium)**
- **Live lighting** (PBR) with a normal map per region, an environment map and an animated normal-mapped water shader. Ours is flat baked colour.
- **Strong depth of field** (tilt-shift): the far map is blurred, so it reads as a miniature.
- **Photoreal textures, film grain and a warm colour grade** on everything.
- **The scene is alive at rest:** water moves and markers bob. Ours freezes when the scroll stops.

**Transitions and type**
- The hero is a full-bleed aerial film of the van. On the first scroll it tilts and shrinks away like a postcard onto the paper background.
- **A chapter progress bar** in the header (Welcome · Stories · Deals) plus a persistent "Start planning" CTA.
- **Giant condensed display statements**, then a reveal with a ragged, torn-paper edge, then a collage of photo cards and 3D objects (a bust, a statue) drifting at different depths.
- **The route line draws itself** on scroll and ends in a mileage counter ("301 MILES") over a town-by-town timeline.
- **Story changes** use a WebGL distortion transition (RGB-split ripple) between photos.
- **The loader is branded:** the route draws itself as the progress bar, with a "Did you know" fact underneath.

**Weight:** about 30 MB on first visit, including 14.6 MB of KTX2 textures, a 7 MB title video, a 4 MB van transition sprite sheet and 1.3 MB of GLB. Ours: about 2.5 MB of models plus 120 KB of loader JS.

## Things they do that we decided against earlier
The "Start your journey" entry gate and the audio toggle. The user skipped these on 2026-11-20. The branded loader is short and doubles as a progress bar, so it's a candidate to revisit.

## Gap list for our build (input to the next design pass)
1. No direct interaction. Add drag-to-drive on the street, clickable stops with postcard previews, story sheets with their own URLs, prev/next controls and onboarding hints.
2. Flat, unlit look. Add live lighting with normal maps and an environment map, or at least a tilt-shift blur, an animated water shader, grain and a grade.
3. A static scene. Add idle life: waving flags, swaying palms, an LED screen playing a loop, a gently bobbing van, moving water.
4. Placeholder artwork. The stops should be real Creative Screens jobs (photos, before/after), which is exactly what their "stories" are.
5. Weak UI chrome. Add a chapter progress bar, a persistent quote CTA, the route line with a counter, torn-edge section transitions and photo-card collages.
