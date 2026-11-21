# Archived: diorama v3, the Oman map journey (2026-11-20)

Set aside by the user on 2026-11-20 ("archive this style for later") in favour of a cleaner direction.

## What this style is
- First-visit loader: paper, topographic lines, wordmark, Oman route drawing.
- Intro: a Blender render of our van on a Hajar mountain road at golden hour, under the title (`3d/build_intro.py`).
- The Oman map as the main stage (Three.js / WebGL). Scroll drives the navy/lime van along a road carved into the land: Salalah → Duqm → Sur → Nizwa → Sohar → Muscat, holding at 3D star tokens. Grid overlay, tilt-shift, film grain.
- The dive into the Muscat street diorama, where five grey surfaces fill with the brand (v2), with story sheets at their own URLs.
- A full-screen Services menu in giant stacked type.
- English and Arabic (right to left; the van is rotated, never mirrored).

Spec: `docs/specs/2026-11-20-diorama-v3-map-journey-design.md`. Screenshots: `docs/lookdev/2026-11-20-v3/`.

## View it as it was
The built site is frozen in `site/`. From this folder:

```
python -m http.server 3102 --directory site
```

Then open http://localhost:3102/preview/ (Arabic: /ar/preview/).

## Restore it into the project
Copy each folder back to the same place in the repo:

| Archive | Repo |
|---|---|
| `src/components/*` | `src/components/` |
| `src/scripts/diorama/` | `src/scripts/diorama/` |
| `src/lib/diorama-*.ts` | `src/lib/` |
| `src/data/*` | `src/data/` |
| `src/app/en/preview/` | `src/app/(en)/preview/` |
| `src/app/ar/preview/` | `src/app/ar/preview/` |
| `public/models`, `public/diorama`, `public/draco` | `public/` |
| `3d/*` | `3d/` |

Then:
- For the `diorama` block in `src/i18n/en.json` and `ar.json`, merge it from the copies here rather than overwriting the whole files.
- Run `npm test` and `npm run build`.

The map's source data (Natural Earth and terrain tiles in `3d/map/data/`) is not copied. `npm run diorama:data` fetches it again; it is only needed to rebuild the map in Blender.

## How the pieces are made
- **Blender scenes:** `3d/street.blend`, `3d/oman-map.blend` and `3d/intro.blend`, built by `3d/build_*.py`. They can be built live in Blender via `3d/live.py`, or headless with `node scripts/blender.mjs`.
- **Exports:** bakes and exports come from `3d/bake_export.py --scene street|map|stills|film|led|stories|art`.
- **Checks:** `3d/tests/check_street.py` and `check_map.py`. `CHECK_ALL=1` reports every failure.
