# creativescreens-site (Next.js)

Static bilingual (English default, Arabic RTL) site for Creative Screens. Next.js 16 (App Router, `output: 'export'`), React 19, plain CSS with logical properties, GSAP + ScrollTrigger + Lenis.

**Style (2026-11-20): the light style, sitewide.** It uses cream, ochre, pale sea-blue and peach grounds with warm sepia ink, and lime only on buttons and tags.
- **Type:** giant stacked titles, plus script accents (Yellowtail; Aref Ruqaa in Arabic).
- **Motion:** the paper and its Expedia-style eroded edges are painted by one WebGL canvas behind the page; lines rise in; the welcome statement holds while a trail of same-size cards rises past it on the ochre flood. Pinned lists, a pinned Oman route, and the finished jobs as a lit WebGL row after Biegajaca's works slider (glide, turn, fade under the text, pointer light, snap, drag).
- **Screens:** pinned layouts need at least 768 px wide and 560 px tall; narrower or shorter screens (phones, a phone on its side) get the stacked phone layout. Giant type and pinned columns size by height as well as width. A resize keeps the reader's place.
- **Specs:**
  - `docs/superpowers/specs/2026-11-20-light-style-sitewide-design.md`
  - `docs/superpowers/specs/2026-11-20-clean-light-jobs-gallery-design.md`

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/, then the size report
```

## Layout
- `src/app/(en)` and `src/app/ar`: one root layout per language (`lang`/`dir` on `<html>`). Pages:
  - `/` (the light homepage with the quote form);
  - `/services/` and `/services/<category>/`;
  - `/work/`, `/about/` and `/privacy/`;
  - `/preview/` (a noindex copy of the homepage) and `/lab/` (noindex);
  - each under `/ar/` as well.
- `src/components`: server components, each with its own `.css`. Markup keeps the `data-*` hooks the motion scripts use.
- `src/behaviors`: small DOM behaviours (loader, menu, CTA bar, hero video, hotspot discovery), started from `Behaviors.tsx` after hydration.
- `src/components/light/parts.tsx`: the shared parts every page is built from (Erode, Kicker, Giant, Ground, ServicesPinned, JobsGallery, JobsDialog, ClosingPanel, ServicesMenu, LightPage). Their styles are in `src/styles/light.css`, and the palette is in `src/styles/tokens.css`.
- `src/scripts/light/`: the light style's motion, loaded lazily by `motion.js` for anything inside `[data-light]`.
  - `reveals.js`, `gallery.js`: the reveals and the jobs gallery.
  - `ground.js`: the WebGL paper and eroded edges behind the page (sections declare `data-ground`).
  - `gallery-gl.js`: the lit WebGL jobs row (WebGL2; without it the gallery keeps its DOM cards).
  - `lightbox.js`, `menu.js`, `dialogs.js`: the dialogs, which also run with reduced motion.
  - Pinned sections are created in page order with `refreshPriority`.
- **Subpages** (after biegajaca-sztuka.pl's): each opens with `PageHead` (breadcrumb with structured data, giant title, a count on a listing, lead, one action, a fanned stack of pictures). Services: staggered cards, `Steps`, `Faq` (Sample answers until the client confirms them). A service page: its products, its jobs, the steps and questions, the quote form preset to that service, previous/next service. Work: filters with counts and a grid of `JobCard`s (ink strokes and Quick view under the pointer). Each job has its own page, `/work/<slug>/` (pictures stay in view beside the facts, quote form preset with the job, More jobs); noindex while the jobs are samples.
- `src/data/jobs.ts`: the finished jobs for the gallery. These are Sample placeholders built from the original site's images until the real jobs arrive.
- `src/lib/jobs-gallery.ts`: the pure maths behind the gallery and edges (card and slide poses, slide target and snap, the reader's place through a resize, the eroded-edge shapes), tested in `src/lib/jobs.test.ts`.
- `public/video/hero-light-*`: the homepage drone film (corniche), cropped and encoded from the client's file.
- `src/i18n`: dictionaries and route table. `src/config/site.ts`: placeholder contact details.
- `3d/`: Blender sources from the earlier 3D versions.
- `archive/`: retired versions, kept rather than deleted:
  - `2026-11-20-diorama-v3-map-journey/` (the 3D map journey, with a frozen built site);
  - `2026-11-20-old-site-pages/` (the old homepage sections and page styles).

## Rules baked in
- Logical CSS properties only; the car is never mirrored; no per-letter animation, none in Arabic.
- Staging is `noindex` unless `NEXT_PUBLIC_STAGING=false` (set at launch only).
- Reduced motion or no JS: the `motion` class is never set, so content shows in its final form.

## Next
- The client's real finished jobs (photos, client, place, service, year) go into `src/data/jobs.ts`.
- Confirm the placeholder facts: the route claim "fit on site from Sohar to Salalah", and the placeholder copy in the jobs.
- Then the Sanity admin and the Cloudflare Pages deploy.
