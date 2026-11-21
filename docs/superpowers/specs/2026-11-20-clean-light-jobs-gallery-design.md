# Clean light preview: loader, giant type, finished-jobs gallery

Status: **approved by the user, 2026-11-20** ("Works lets build it"). This replaces v3 on `/preview/` and `/ar/preview/`. v3 is archived in `archive/2026-11-20-diorama-v3-map-journey/`.

## Intent
The user set aside the 3D map journey for something cleaner. It keeps only three elements from their references:
1. **Expedia × Hertz loader:** cream paper, a faint topographic texture, a bold number plus a script word, a route line drawing between two dots, and "Did you know".
2. **Expedia giant stacked type:** huge, tightly stacked bold capitals with a small script word above.
3. **Biegajaca Sztuka's pinned sideways gallery:** a title column stays put while big cards glide past in perspective as you scroll. A counter and the current card's details update, with arrow buttons too.

**Light only ("no dark colour").** Cream and sand with warm brown ink, no dark overlays or navy blocks. Lime is a small accent.

The cards show **the user's finished jobs**. The user will supply them; until then they are placeholders tagged "Sample".

## Added 2026-11-20: the 2D scroll style of Expedia's Missouri page
The user asked for "the non 3d 2d scroll style" from https://www.expedia.com/route66/state/missouri, "especially the scroll to reveal". I studied the page. These are the reveals we take, in our light palette:
- **Postcard tilt-away:** the full-screen hero photo shrinks into a tilted card, rotated about -3° with rounded corners and a paper border, and slides up. That uncovers the cream page underneath.
- **Giant statement, line by line:** a script kicker ("Welcome *to* …") over a giant stacked statement whose lines rise in as they enter.
- **Torn-paper colour flood:** a ragged, torn edge rises from below, and the next section's colour floods the screen behind it. Ours alternates cream (`--cream`), warm sand (`--sand #e7d5ad`) and a pale lime tint (`--lime-tint #e9efc8`). Ink stays sepia, so nothing goes dark.
- **Parallax photo stickers:** rounded, slightly rotated job photos drift past at different speeds around the statement, and one passes in front of the type.
- **Pinned list with a counter:** like their route list (St. Louis, Cuba, Rolla… with a mileage counter), the section stays put while the scroll moves a highlight down a list. Ours is the eight services in giant stacked type: the live one is full ink, the rest are faint, a counter shows `03 / 08`, and the matching job photo sticker swaps in.
- **Rising rounded panel:** a big rounded photo panel rises and grows into place, with a headline and button inside.
- **A slim sticky top bar** with a chapter progress line.

## Page (top to bottom), revised to include the above
1. **Loader:** the count climbs 0→100 while the Oman route line draws as the progress bar between two ring dots. "**21** *Years* · **Every** *Street*" and "Did you know" stay. It lifts when ready.
2. **Hero postcard:**
   - Content: a full-screen job photo, warm-graded, with "*Since 2004*" in script and a giant headline ("EVERY STREET IN OMAN").
   - Motion: it tilts away into a postcard on scroll.
3. **Welcome statement:**
   - Content: "*Welcome to* Creative Screens", then the giant stacked statement "WE PRINT WHAT MUSCAT READS" (placeholder copy), with parallax job-photo stickers.
   - Exit: a torn edge floods to sand.
4. **Services:** the pinned giant list with a counter and photo swap, as above. It replaces the static hero list of the first draft, and each name still links to its service page.
5. **Finished jobs:**
   - Transition: a torn edge back to cream.
   - Content: the pinned sideways gallery (section 3 of the first draft), unchanged.
6. **Closing:**
   - Transition: a torn edge to the lime tint.
   - Content: a rising rounded panel with the giant "LET'S PUT YOUR BRAND ON THE STREET" and "Get a quote".
7. **Services menu** from the header, and the slim sticky chapter bar.

The first-draft structure below stays for reference. Where the two differ, this revised order wins.

## Page (top to bottom), first draft
1. **Loader (first visit only).**
   - Content: cream paper and topographic lines. "**21** *Years* · **Every** *Street*": bold Unbounded numbers and words, with script accent words.
   - Motion: Oman's route draws as a thin brown line between two ring dots, and "DID YOU KNOW" plus one line sit below.
   - Timing: it lifts when the page is ready, within about 1.1–2.2 s.
2. **Hero: Services in giant stacked type.**
   - Layout: a script "Services" above the eight service names in giant stacked Unbounded capitals, centred on cream.
   - Interaction: each name links to its service page (`/services/<slug>/`). On hover or focus, that service's job photo fades in behind the type, sepia-washed at low contrast on cream (never darkened).
   - Motion: names rise in on load.
3. **Finished jobs: pinned sideways gallery.**
   - Left column (stays put): kicker, title "Work out on the street", one-line lead, a counter (`03 / 12`), and the current job's title and meta (client · place · service · year). Below them sit ← → buttons and "See the job".
   - Cards: big job photos glide right to left as you scroll. Each card turns slightly in perspective by its position on screen, as on Biegajaca, and the counter, title and meta update to the card nearest the column.
   - "See the job" opens a light lightbox with that job's photos and details. Esc, the close button and Back all close it, and it has its own `#job-<slug>` hash.
4. **Closing:** a short line and "Get a quote", plus the site's own footer.
5. **Services menu:** the same giant stacked type, full screen on cream, opened from a "Services" button in the header area of this page.

## Global
- **Palette (scoped to the preview page):**

  | Token | Colour |
  |---|---|
  | `--cream` | `#efe6cf` |
  | `--cream-2` | `#e6dabd` |
  | `--sepia` (ink) | `#4a3b2c` |
  | `--sepia-2` (muted) | `#8a7860` |
  | `--lime` | the existing lime, as a fill only |

  The site header is restyled cream/sepia on this page.
- **Fonts:**
  - Big type is Unbounded, kept because the client wants the blocky font.
  - Accent words use a script: Yellowtail (`@fontsource/yellowtail`) for English, Aref Ruqaa (`@fontsource/aref-ruqaa`) for Arabic, used only for accents.
  - Body text keeps the site fonts.
- **Arabic:** right to left. The gallery glides the other way, and the column sits on the right.
- **Phones (< 768 px):** no pinning; the gallery is a native swipe row with snap, and the counter updates on scroll.
- **Reduced motion or no JS:** no loader, no pin; the gallery is a plain grid and the type is static.
- **Data:** `src/data/jobs.ts` holds the jobs (slug, title EN/AR, client, place, service slug, year, photos[], sample flag). Placeholders come from the 20 existing photos in `public/diorama/stories/` and are tagged "Sample".
- **Stack:** Next.js static export, GSAP ScrollTrigger and Lenis, as already used. No WebGL and no 3D.

## Approaches
1. **GSAP ScrollTrigger pin plus a transform on the track, with per-card perspective from the card's screen position (chosen).** It's already in the stack, gives exact Biegajaca behaviour, and degrades to a CSS scroll-snap row.
2. **CSS-only scroll-driven animations (`animation-timeline: view()`).** Lighter, but there's no Safari support for pinning-style effects yet and the counter sync is awkward.
3. **WebGL card plane with a distortion shader.** The most dramatic, but it's the opposite of "clean", and heavier.

## Builder's calls (mine, open to correction)
- The loader copy ("21 Years · Every Street") and the "Did you know" line.
- The gallery title "Work out on the street".
- 12 placeholder jobs, until the user's jobs arrive.
- The lightbox for "See the job", rather than separate job pages.
- Removing the v3 parts (the 3D scene, map, van and story sheets) from the preview route, since they're archived.
- The `/preview/[stop]` story routes go away too.

## Out of scope
- The live homepage and other pages, apart from the header styling on `/preview/`.
- The 3D/Blender work.
- Real job content, which comes from the user.
