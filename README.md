# creativescreens-site (Next.js)

Static bilingual (English default, Arabic RTL) site for Creative Screens. Next.js 16 (App Router, `output: 'export'`), React 19, plain CSS with logical properties, GSAP + ScrollTrigger + SplitText + Lenis, Three.js for the 3D scenes (raw-shader line art; see `src/scripts/three-kit.js`).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/, then the size report
```

## Layout
- `src/app/(en)` and `src/app/ar`: one root layout per language (`lang`/`dir` on `<html>`). Pages: `/`, `/lab/`, `/ar/`, `/ar/lab/`.
- `src/components`: server components, each with its own `.css`. Markup keeps the `data-*` hooks the motion scripts use.
- `src/behaviors`: small DOM behaviours (loader, menu, CTA bar, hero video, hotspot discovery), started from `Behaviors.tsx` after hydration.
- `src/scripts`: motion, 3D stage and warehouse (unchanged from the Astro build; loaded lazily by `motion.js`).
- `src/i18n`: dictionaries and route table. `src/config/site.ts`: placeholder contact details.
- `3d/`: Blender sources for `public/models/car.json`.

## Rules baked in
- Logical CSS properties only; the car is never mirrored; no per-letter animation, none in Arabic.
- Staging is `noindex` unless `NEXT_PUBLIC_STAGING=false` (set at launch only).
- Reduced motion or no JS: the `motion` class is never set, so content shows in its final form.

## Next
Compress the car model to glTF + Draco, then Sanity admin, quote form, hub/work/about pages, Cloudflare Pages deploy.
