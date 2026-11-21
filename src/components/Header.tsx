import { hrefFor, messages, otherLocale, type Locale, type RouteKey } from '@/i18n';
import { site } from '@/config/site';
import './Header.css';

interface Props { locale: Locale; routeKey: RouteKey; alt?: string }

export function Header({ locale, routeKey, alt }: Props) {
  const m = messages(locale);
  const other = otherLocale(locale);
  const home = hrefFor('home', locale);
  const quoteHref = `${home}#quote`;
  const nav: { label: string; href: string | null }[] = [
    { label: m.nav.services, href: hrefFor('services', locale) },
    { label: m.nav.work, href: hrefFor('work', locale) },
    { label: m.nav.about, href: hrefFor('about', locale) },
    { label: m.nav.contact, href: quoteHref },
  ];

  return (
    <header className="hdr" data-header>
      <div className="hdr__bar">
        <a className="hdr__logo" href={home} aria-label={site.name}>
          <span className="hdr__wordmark" role="img" aria-label={site.name}></span>
        </a>

        <nav className="hdr__nav" aria-label={m.nav.primary}>
          {nav.map((i) => (i.href ? <a key={i.label} href={i.href}>{i.label}</a> : <span key={i.label} className="is-soon">{i.label}</span>))}
        </nav>

        <div className="hdr__actions">
          <a
            className="hdr__lang"
            href={alt ?? hrefFor(routeKey, other)}
            hrefLang={other}
            lang={other}
            aria-label={m.lang.aria}
            data-lang-switch={other}>{m.lang.label}</a>
          <a className="btn hdr__quote" href={quoteHref}>{m.cta.quote}</a>
          <button className="hdr__menu" type="button" aria-expanded="false" aria-controls="menu-panel" data-menu-toggle>
            <span className="sr-only">{m.nav.menu}</span>
            <span className="hdr__burger" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <div className="hdr__panel" id="menu-panel" data-menu-panel hidden>
        <nav aria-label={m.nav.primary}>
          {nav.map((i) => (i.href ? <a key={i.label} href={i.href} data-menu-link>{i.label}</a> : <span key={i.label} className="is-soon">{i.label}</span>))}
        </nav>
        <a className="btn" href={quoteHref} data-menu-link>{m.cta.quote}</a>
      </div>
    </header>
  );
}
