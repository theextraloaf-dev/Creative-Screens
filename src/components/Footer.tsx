import { hrefFor, messages, otherLocale, whatsappHref, type Locale, type RouteKey } from '@/i18n';
import { site } from '@/config/site';
import { waGreeting } from '@/lib/quote-message';
import { Erode } from './light/parts';
import './Footer.css';

interface Props { locale: Locale; routeKey: RouteKey; alt?: string; waPage?: { service?: string; job?: string } }

export function Footer({ locale, routeKey, alt, waPage }: Props) {
  const m = messages(locale);
  const other = otherLocale(locale);

  const socials = Object.entries(site.socials).filter(([, href]) => href);

  return (
    <footer className="ftr" id="contact">
      <Erode seed={17} from="ochre" flip />
      <div className="wrap ftr__grid">
        <div>
          <span className="ftr__logo" role="img" aria-label={site.name}></span>
          <span className="ftr__tag" aria-hidden="true"></span>
          <p className="ftr__muted ftr__city">{site.address || m.footer.city}</p>
          {socials.length > 0 && (
            <ul className="ftr__socials">
              {socials.map(([key, href]) => (
                <li key={key}><a href={href} target="_blank" rel="noopener noreferrer">{key[0].toUpperCase() + key.slice(1)}</a></li>
              ))}
            </ul>
          )}
        </div>
        <dl className="ftr__list">
          <div><dt>{m.footer.phone}</dt><dd><span className="ltr">{site.phoneDisplay}</span></dd></div>
          <div><dt>{m.footer.whatsapp}</dt><dd><a className="ltr" href={whatsappHref(site.whatsapp, waGreeting(m.wa, waPage))} target="_blank" rel="noopener">{site.whatsappDisplay}</a></dd></div>
          <div><dt>{m.footer.email}</dt><dd><span className="ltr">{site.email}</span></dd></div>
          <div><dt>{m.footer.hours}</dt><dd>{m.footer.hoursValue}</dd></div>
        </dl>
        <p><a className="ftr__lang" href={alt ?? hrefFor(routeKey, other)} hrefLang={other} lang={other} data-lang-switch={other}>{m.lang.label}</a></p>
      </div>
      <div className="wrap ftr__base">
        <span>© {new Date().getFullYear()} {locale === 'ar' ? 'كرييتف سكرينز' : 'Creative Screens'}. {m.footer.rights}.</span>
        <a className="ftr__muted" href={hrefFor('privacy', locale)}>{m.footer.privacy}</a>
        <span className="ftr__muted">{locale === 'ar' ? 'محتوى مؤقت قيد الإعداد' : 'Staging build: placeholder content'}</span>
      </div>
      <div className="ftr__word" aria-hidden="true" data-reveal data-offset="90">
        <i className="w1"></i><i className="w2"></i>
      </div>
    </footer>
  );
}
