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
  world?: ReactNode;
  children: ReactNode;
}

export function Shell({ locale, routeKey, world, children }: Props) {
  const m = messages(locale);
  return (
    <>
      <Loader label={m.loader.label} />
      <a className="skip-link" href="#main">{locale === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
      <Header locale={locale} routeKey={routeKey} />
      {world}
      <main id="main">{children}</main>
      <Footer locale={locale} routeKey={routeKey} />
      <StickyCta locale={locale} />
      <Behaviors />
    </>
  );
}
