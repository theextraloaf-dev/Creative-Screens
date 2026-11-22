import type { ReactNode } from 'react';
import { messages, type Locale, type RouteKey } from '@/i18n';
import { Behaviors } from './Behaviors';
import { Footer } from './Footer';
import { Header } from './Header';
import { Loader } from './Loader';
import { StickyCta } from './StickyCta';

interface Props {
  locale: Locale;
  routeKey: RouteKey;
  /** the same page in the other language, when it is not the section page (a service, a job) */
  alt?: string;
  /** what the page is about, for the first line of a WhatsApp chat started from it */
  waPage?: { service?: string; job?: string };
  world?: ReactNode;
  /** the "21 years" loader; the light preview has its own first-visit loader */
  loader?: boolean;
  children: ReactNode;
}

export function Shell({ locale, routeKey, alt, waPage, world, loader = false, children }: Props) {
  const m = messages(locale);
  return (
    <>
      {loader && <Loader label={m.loader.label} />}
      <a className="skip-link" href="#main">{locale === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
      <Header locale={locale} routeKey={routeKey} alt={alt} />
      {world}
      <main id="main">{children}</main>
      <Footer locale={locale} routeKey={routeKey} alt={alt} waPage={waPage} />
      <StickyCta locale={locale} waPage={waPage} />
      <Behaviors />
    </>
  );
}
