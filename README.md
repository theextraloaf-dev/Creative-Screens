# creativescreens-site

Static bilingual (English default, Arabic RTL) site for Creative Screens. Astro 7, plain CSS with logical properties, GSAP + ScrollTrigger + SplitText + Lenis (all from npm, pinned). Plan: `../docs/BUILD-PLAN.md`. Architecture: `../docs/ARCHITECTURE.md`.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # builds dist/ and prints the size report
npm run preview    # serves dist/
```

## What is here (Phase A, the base)
- `/` and `/ar/`: placeholder home (hero, 8 service tiles, car sticker stage, process, quote area).
- `/lab/` and `/ar/lab/`: motion lab, noindex. Every primitive plus the colour contrast report.
- `src/styles/tokens.css`: light theme tokens, type scale, Arabic overrides. Placeholder fonts until the brand is confirmed.
- `src/scripts/motion.js`: Lenis, reveal, text lines, blur-in, clip image, count-up. `stage.js` (lazy): the car sequence timeline.
- Reduced motion or no JS: the `motion` class is never set, so every start state is absent and the content shows in its final form.

## 3D car (exploded view)
- Source: `3d/build_car.py` + `3d/wrap_and_export.py` (run inside Blender with the MCP add-on, same exec namespace) and `3d/car.blend`.
- Output: `public/models/car.json` (mm integers: positions, triangles, line segments per named part).
- Web: `src/scripts/stage3d.js` (OGL), loaded by `stage.js` only when the section is near; falls back to the 2D stage. `?stage=2d` forces 2D.

## Rules baked in
- Logical CSS properties only; one `dir()` helper for sideways motion; the car is never mirrored.
- No per-letter animation (lines only), none in Arabic.
- Staging is `noindex` unless `PUBLIC_STAGING=false` (set at launch only).
- Contact details in `src/config/site.ts` are placeholders. Arabic strings in `src/i18n/ar.json` are drafts pending native review.
- No secrets in the repo.

## Not built yet
Sanity admin, quote form, hub/work/about pages, real photos, Cloudflare Pages deploy (needs the Extra Loaf Cloudflare project), analytics.
