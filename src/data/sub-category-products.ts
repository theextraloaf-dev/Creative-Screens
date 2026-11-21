/* Real product photos, grouped into the shop-style sub-category grids (the jasani.ae-style listing
   under each sub-category). gifts-apparel's photos are from the Jasani catalogue — the original
   bags/drinkware/office set, plus two 2026-11-16 top-ups (headwear/technology/office-writing/
   bags-travel, then home-living/outdoor-recreation/culture-gifts) — see
   docs/stock-photo-shortlist.md for exactly which, and why apparel/clothing was skipped entirely.
   Also includes a supplier drinkware set (see service-photos.ts). acrylic-awards/trophies and
   /plaques are also from Jasani's own Awards & Trophies catalogue (clean product shots, no
   watermark) — Jasani doesn't sell laser-cut acrylic or display stands, so those two stay on the
   concept plate. The five remaining categories (print-stationery, signage, graphics,
   flags-banners, exhibitions-events, led-screens) aren't things Jasani sells either, so they're
   still on the concept plate too — see docs/stock-photo-shortlist.md (a dlxprint.com-sourced pass
   on 2026-11-16 was reverted the same day: every photo checked carried either dlxprint's own
   watermark or a real client's logo). Product names are kept in English on both locales since
   these are supplier SKU names, not site copy. Key is `${category}/${subcategory}`. */
export interface SubProduct { slug: string; name: string; image: string }

const gift = (slug: string, name: string): SubProduct => ({ slug, name, image: `/gifts/${slug}.webp` });
const award = (slug: string, name: string): SubProduct => ({ slug, name, image: `/subcategories/acrylic-awards/${slug}.jpg` });
const more = (slug: string, name: string): SubProduct => ({ slug, name, image: `/subcategories/gifts-apparel/${slug}.jpg` });

export const subCategoryProducts: Record<string, SubProduct[]> = {
  'acrylic-awards/trophies': [award('trophies', 'Beech Wood & Marble Award')],
  'acrylic-awards/plaques': [award('plaques', 'Wood & Mirror Plaque')],

  'gifts-apparel/bags-travel': [
    gift('backpack', 'Backpack'),
    gift('crossbody-bag', 'Crossbody Bag'),
    gift('pouch', 'Pouch'),
    more('tote-bag', 'Recycled Cotton Tote Bag'),
    more('drawstring-bag', 'Reflective Drawstring Bag'),
  ],
  'gifts-apparel/headwear': [
    gift('cap', 'Cap'),
    more('cap-purple', 'Seamless 6-Panel Cap — Purple'),
    more('cap-trucker-navy', 'Trucker Cap — Navy/White'),
    more('cap-stone', 'Seamless 6-Panel Cap — Stone'),
  ],
  'gifts-apparel/technology': [
    gift('speaker', 'Speaker'),
    gift('earbuds', 'Earbuds'),
    gift('travel-adapter', 'Travel Adapter'),
    more('powerbank', '20,000mAh Fast-Charge Power Bank'),
  ],
  'gifts-apparel/office-writing': [
    gift('notebook', 'Notebook'),
    gift('notebook-spiral', 'Spiral Notebook'),
    more('notebook-cork', 'Cork Spiral Notebook'),
  ],
  'gifts-apparel/home-living': [
    more('coasters-cork', 'Cork Coaster Set with Stand'),
    more('cutlery-bamboo', 'Bamboo Travel Cutlery Set'),
    more('games-box', '4-in-1 Wooden Games Box'),
  ],
  'gifts-apparel/outdoor-recreation': [
    more('frisbee-navy', 'Foldable Frisbee — Navy'),
  ],
  'gifts-apparel/culture-gifts': [
    gift('dallah-set', 'Dallah Set'),
    gift('uae-flag', 'UAE Flag'),
    more('camel-plush', 'Camel Plush Toy'),
  ],
  'gifts-apparel/drinkware': [
    gift('tumbler-glass', 'Glass Tumbler'),
    gift('tumbler-navy', 'Tumbler — Navy'),
    gift('tumbler-red', 'Tumbler — Red'),
    gift('tumbler-duo', 'Tumbler Duo Set'),
    gift('tumbler-black-cork', 'Tumbler — Black Cork'),
    gift('tumbler-pink-handle', 'Tumbler — Pink Handle'),
    gift('tumbler-bronze-straw', 'Tumbler — Bronze Straw'),
    gift('tumbler-blue', 'Tumbler — Blue'),
    gift('mug-pink', 'Mug — Pink'),
    gift('mug-grey', 'Mug — Grey'),
    gift('mug-cork', 'Mug — Cork Base'),
    gift('mug-black-cork', 'Mug — Black Cork Base'),
    gift('bottle', 'Bottle'),
    gift('bottle-blue', 'Bottle — Blue'),
    gift('bottle-aluminium', 'Aluminium Bottle'),
    gift('bottle-aluminium-black', 'Aluminium Bottle — Black'),
    gift('bottle-aluminium-silver', 'Aluminium Bottle — Silver'),
    gift('bottle-lavender', 'Bottle — Lavender'),
    gift('bottle-olive', 'Bottle — Olive'),
    gift('bottle-forest-loop', 'Bottle — Forest Loop'),
    gift('bottle-temp-display', 'Bottle — Temp Display'),
  ],
};
