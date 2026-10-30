/* Real product photos per service, shown in the service detail view. To add or swap a photo, drop a file in
   /public/<folder> and edit the list. gifts-apparel are from the Jasani catalogue; graphics and led-screens are free Unsplash photos (see docs/stock-photo-shortlist.md). */
export const servicePhotos: Record<string, string[]> = {
  graphics: ['/services/printer-banner.webp'],
  'led-screens': ['/services/led-building.webp'],
  'gifts-apparel': [
    'backpack', 'crossbody-bag', 'pouch', 'bottle', 'cap', 'dallah-set',
    'notebook', 'notebook-spiral', 'speaker', 'earbuds', 'travel-adapter', 'uae-flag',
  ].map((n) => `/gifts/${n}.webp`),
};
