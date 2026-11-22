/* Page addresses and contact links, without the dictionaries: client components import from here, so a page ships
   only the strings it is given as props (importing '@/i18n' would bundle both languages' JSON into the browser). */

// One entry per page; the same page in the other language is the language switch target.
export const routes = {
  home: { en: '/', ar: '/ar/' },
  lab: { en: '/lab/', ar: '/ar/lab/' },
  preview: { en: '/preview/', ar: '/ar/preview/' },
  services: { en: '/services/', ar: '/ar/services/' },
  work: { en: '/work/', ar: '/ar/work/' },
  about: { en: '/about/', ar: '/ar/about/' },
  privacy: { en: '/privacy/', ar: '/ar/privacy/' },
} as const;
export type RouteKey = keyof typeof routes;

export const hrefFor = (key: RouteKey, locale: 'en' | 'ar') => routes[key][locale];

export const whatsappHref = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
