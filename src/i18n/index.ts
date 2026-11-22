import en from './en.json';
import ar from './ar.json';

export type Locale = 'en' | 'ar';
export const locales: Locale[] = ['en', 'ar'];

export type Messages = typeof en;
const dictionaries: Record<Locale, Messages> = { en, ar };

export const messages = (locale: Locale): Messages => dictionaries[locale];
export const dirOf = (locale: Locale) => (locale === 'ar' ? 'rtl' : 'ltr');
export const otherLocale = (locale: Locale): Locale => (locale === 'ar' ? 'en' : 'ar');

// addresses and contact links live apart from the dictionaries (client components import them directly)
export { routes, hrefFor, whatsappHref, type RouteKey } from './links';

// {phrase} in a string becomes a lime marker highlight (one phrase per sentence, never body copy)
export const hl = (s: string) => s.replace(/\{(.+?)\}/g, '<mark>$1</mark>');
