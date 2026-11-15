/* Real product photos per service, shown in the service detail view. To add or swap a photo, drop a file in
   /public/<folder> and edit the list. gifts-apparel are from the Jasani catalogue, plus a supplier drinkware
   set (tumblers, mugs, bottles); graphics and led-screens are free Unsplash photos (see docs/stock-photo-shortlist.md). */
export const servicePhotos: Record<string, string[]> = {
  graphics: ['/services/printer-banner.webp'],
  'led-screens': ['/services/led-building.webp'],
  'gifts-apparel': [
    // bags & apparel
    'backpack', 'crossbody-bag', 'pouch', 'cap',
    // office & tech
    'notebook', 'notebook-spiral', 'speaker', 'earbuds', 'travel-adapter',
    // culture
    'dallah-set', 'uae-flag',
    // tumblers
    'tumbler-glass', 'tumbler-navy', 'tumbler-red', 'tumbler-duo',
    'tumbler-black-cork', 'tumbler-pink-handle', 'tumbler-bronze-straw', 'tumbler-blue',
    // mugs
    'mug-pink', 'mug-grey', 'mug-cork', 'mug-black-cork',
    // bottles
    'bottle', 'bottle-blue', 'bottle-aluminium', 'bottle-aluminium-black',
    'bottle-aluminium-silver', 'bottle-lavender', 'bottle-olive', 'bottle-forest-loop',
    'bottle-temp-display',
  ].map((n) => `/gifts/${n}.webp`),
};
