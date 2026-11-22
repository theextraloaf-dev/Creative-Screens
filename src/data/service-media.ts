/* Real footage and visuals per service, shown in each service page's fan (src/components/CategoryPage.tsx).
   Clips are short muted loops cut from the client's own job videos (4:5, 400x500); `still` is the first frame shown
   before the clip plays (and instead of it with reduced motion). `tag: 'render'` marks a design visual, not a photo
   of finished work. The LED promo and the branded posters were left out on purpose (AI scenes; concept brands). */
export interface ServiceMedia { still: string; video?: string; tag?: 'render' }

export const serviceMedia: Record<string, ServiceMedia[]> = {
  'print-stationery': [{ still: '/video/svc/print-stationery.webp', video: '/video/svc/print-stationery.mp4' }],
  signage: [{ still: '/video/svc/signage.webp', video: '/video/svc/signage.mp4' }],
  graphics: [{ still: '/video/svc/graphics.webp', video: '/video/svc/graphics.mp4' }],
  'exhibitions-events': [{ still: '/video/svc/exhibitions-events.webp', video: '/video/svc/exhibitions-events.mp4', tag: 'render' }],
  'flags-banners': [{ still: '/services/roll-banner.webp' }],
};

/* One picture per service wherever a service is shown whole: the home services list, the Services page cards, a
   service page's fan, and a range with no product photos yet. The client's own footage (stills cut at 800x1000 from
   the same shots as the clips above), else a photo or a catalogue piece; never a drawing. */
export interface ServiceCover { src: string; look: 'photo' | 'object'; /** a design visual, not a photo of finished work (labelled in a fan) */ render?: boolean }
export const serviceCover: Record<string, ServiceCover> = {
  'gifts-apparel': { src: '/gifts/dallah-set.webp', look: 'object' },
  graphics: { src: '/services/cover-graphics.webp', look: 'photo' },
  'print-stationery': { src: '/services/cover-print-stationery.webp', look: 'photo' },
  signage: { src: '/services/cover-signage.webp', look: 'photo' },
  'flags-banners': { src: '/services/roll-banner.webp', look: 'photo' },
  'exhibitions-events': { src: '/services/cover-exhibitions-events.webp', look: 'photo', render: true },
  'event-setup': { src: '/services/cover-exhibitions-events.webp', look: 'photo', render: true },
  'led-screens': { src: '/services/led-building.webp', look: 'photo' },
  'acrylic-awards': { src: '/subcategories/acrylic-awards/trophy-crop.webp', look: 'object' },
};
