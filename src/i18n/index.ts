import en from './en.json';
import ar from './ar.json';

export type Locale = 'en' | 'ar';
export const locales: Locale[] = ['en', 'ar'];

const dictionaries = { en, ar } as const;

export const messages = (locale: Locale) => dictionaries[locale];
export const dirOf = (locale: Locale) => (locale === 'ar' ? 'rtl' : 'ltr');
export const otherLocale = (locale: Locale): Locale => (locale === 'ar' ? 'en' : 'ar');

// One entry per page; the same page in the other language is the language switch target.
export const routes = {
  home: { en: '/', ar: '/ar/' },
  lab: { en: '/lab/', ar: '/ar/lab/' },
} as const;
export type RouteKey = keyof typeof routes;

export const hrefFor = (key: RouteKey, locale: Locale) => routes[key][locale];

export const whatsappHref = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

// {phrase} in a string becomes a lime marker highlight (one phrase per sentence, never body copy)
export const hl = (s: string) => s.replace(/\{(.+?)\}/g, '<mark>$1</mark>');
