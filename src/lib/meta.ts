import type { Metadata } from 'next';
import { site, isStaging } from '@/config/site';
import { hrefFor, type Locale, type RouteKey } from '@/i18n';

interface PageMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

export function pageMetadata(routeKey: RouteKey, locale: Locale, { title, description, noindex = false }: PageMeta): Metadata {
  const hidden = noindex || isStaging;
  return {
    metadataBase: new URL(site.url),
    title,
    description,
    robots: hidden ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical: hrefFor(routeKey, locale),
      languages: {
        en: hrefFor(routeKey, 'en'),
        ar: hrefFor(routeKey, 'ar'),
        'x-default': hrefFor(routeKey, 'en'),
      },
    },
  };
}
