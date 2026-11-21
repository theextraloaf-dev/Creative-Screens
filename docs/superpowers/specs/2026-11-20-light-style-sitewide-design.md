# The light style on every page

Status: **approved by the user, 2026-11-20** ("Go for it").

## Intent
The light preview (docs/superpowers/specs/2026-11-20-clean-light-jobs-gallery-design.md) becomes the whole site's style, not a single page.

**Rules:**
- Light only: cream, ochre, pale sea-blue and peach, with sepia ink.
- Lime only on buttons and tags.
- No navy or dark bands anywhere.

**The vocabulary, everywhere:**
- script kickers;
- giant stacked titles whose lines rise in;
- Expedia's eroded coastline edges between sections;
- photo stickers;
- pinned lists and the pinned sideways gallery;
- the rising closing panel.

## Decisions
- **Homepage:** the light page becomes the homepage (`/`, `/ar/`), with the existing quote form (QuoteSection) added at the end. That is where every "Get a quote" button already points (`/#quote`). The old home goes:
  - the 3D warehouse journey;
  - the navy hero;
  - the proof strip;
  - the service list;
  - the work strip;
  - the "Why" section.

  `/preview/` stays as a noindex copy.
- **Sitewide theme:**
  - the site tokens turn light (`--paper` = cream, `--ink` / `--navy` = sepia, `--grey` = muted sepia);
  - the header, footer, sticky CTA and WhatsApp bubble are light on every page;
  - the script fonts load everywhere.
- **Shared pieces** move out of the preview, so every page builds from the same parts:
  - styles: `src/styles/light.css`;
  - components: `src/components/light/` (Erode, Kicker, Giant, JobsGallery, ServicesPinned, ClosingPanel);
  - motion: `src/scripts/light/` (`[data-light]` on any page). Each section is optional.
- **Per page:**
  - **Services hub:** a light hero, then the eight plate cards on paper (drawings multiplied in), rising in. Ochre ground under an eroded edge, then the closing panel.
  - **A service page:**
    - a light hero with its big plate, a script "Services" kicker and the giant name;
    - sub-category tabs as pills;
    - the products on paper cards (catalogue cut-outs multiplied in);
    - the concept plate when there are no products yet;
    - an ochre body under an eroded edge.
  - **Our Work:** a light hero ("*Our* WORK"), the pinned sideways jobs gallery (the same `src/data/jobs.ts`), then the closing panel.
  - **About:**
    - a "**21** *Years*" lockup over the title;
    - the intro paragraphs rising;
    - the fact sheet as large rows;
    - the core values as a pinned list on ochre (replacing the dark band);
    - the closing panel.
  - **Privacy:** a light text page.
  - **Lab:** internal and noindex, so it only inherits the light tokens.

## Not changing
- Copy and data.
- The quote form's behaviour.
- The routes.
- The Arabic right-to-left layout.
- The fallback with no motion: plain readable pages.
