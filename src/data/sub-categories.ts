/* Sub-categories per main category, English-keyed and in the same order as that category's
   `makes` list in the dictionaries (src/i18n/en.json, ar.json) — slug[i] is the stable id for
   makes[i]'s localized label, so no sub-category name needs to be duplicated here. Used by
   CategoryPage.tsx to build /services/{category}/'s sidebar/tab switcher and its shop-style
   grids (no separate page per sub-category). */
export const subCategories: Record<string, string[]> = {
  'print-stationery': ['business-cards', 'brochures', 'letterheads', 'packaging'],
  signage: ['shop-fronts', '3d-letters', 'lightboxes', 'wayfinding'],
  graphics: ['window-film', 'wall-murals', 'floor-graphics', 'fleet-wraps'],
  'flags-banners': ['feather-flags', 'pole-flags', 'roll-ups', 'large-banners'],
  'exhibitions-events': ['booths', 'fabrication'],
  'event-setup': ['stage-backdrops', 'event-branding'],
  'led-screens': ['indoor-led-walls', 'outdoor-led-walls', 'installation'],
  /* Renamed/expanded 2026-11-17 to match jasani.ae's own category names (jasani.ae/shop's sidebar
     filter and homepage tiles) — Creative Screens' gifts-apparel is the same kind of catalogue, so
     the sub-categories should read the way a buyer already expects from that market. Apparel &
     Clothing was deliberately left out: every usable photo either showed an identifiable model's
     face or, in one case, an actual AT&T logo used as a branding sample — see
     docs/stock-photo-shortlist.md. */
  'gifts-apparel': ['drinkware', 'bags-travel', 'headwear', 'technology', 'office-writing', 'home-living', 'outdoor-recreation', 'culture-gifts'],
  'acrylic-awards': ['laser-cut-acrylic', 'plaques', 'trophies', 'display-stands'],
};
