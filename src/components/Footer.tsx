import { hrefFor, messages, otherLocale, type Locale, type RouteKey } from '@/i18n';
import { site } from '@/config/site';
import './Footer.css';

interface Props { locale: Locale; routeKey: RouteKey }

export function Footer({ locale, routeKey }: Props) {
  const m = messages(locale);
  const other = otherLocale(locale);

  return (
    <footer className="ftr" id="contact">
      <div className="wrap ftr__grid">
        <div>
          <span className="ftr__logo" role="img" aria-label={site.name}></span>
          <span className="ftr__tag" aria-hidden="true"></span>
          <p className="ftr__muted ftr__city">{m.footer.city}</p>
        </div>
        <dl className="ftr__list">
          <div><dt>{m.footer.phone}</dt><dd><span className="ltr">{site.phoneDisplay}</span></dd></div>
          <div><dt>{m.footer.email}</dt><dd><span className="ltr">{site.email}</span></dd></div>
          <div><dt>{m.footer.hours}</dt><dd>{m.footer.hoursValue}</dd></div>
        </dl>
        <p><a className="ftr__lang" href={hrefFor(routeKey, other)} hrefLang={other} lang={other} data-lang-switch={other}>{m.lang.label}</a></p>
      </div>
      <div className="wrap ftr__base">
        <span>© {new Date().getFullYear()} {locale === 'ar' ? 'كرييتف سكرينز' : 'Creative Screens'}. {m.footer.rights}.</span>
        <span className="ftr__muted">{locale === 'ar' ? 'محتوى مؤقت قيد الإعداد' : 'Staging build: placeholder content'}</span>
      </div>
      <div className="ftr__word" aria-hidden="true" data-reveal data-offset="90">
        <i className="w1"></i><i className="w2"></i>
      </div>
    </footer>
  );
}
