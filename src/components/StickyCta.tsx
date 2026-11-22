import { hrefFor, messages, whatsappHref, type Locale } from '@/i18n';
import { site } from '@/config/site';
import { waGreeting } from '@/lib/quote-message';
import './StickyCta.css';

/* Phones: bottom bar after the hero. Desktop: floating WhatsApp button. The chat opens with the page's subject
   (a service page names the service, a job page the job), so the team knows what it is about from the first line. */
export function StickyCta({ locale, waPage }: { locale: Locale; waPage?: { service?: string; job?: string } }) {
  const m = messages(locale);
  const wa = whatsappHref(site.whatsapp, waGreeting(m.wa, waPage));

  return (
    <>
      <div className="cta-bar" data-cta-bar>
        <a className="btn" href={`${hrefFor('home', locale)}#quote`}>{m.cta.quote}</a>
        <a className="btn btn--ghost" href={wa} rel="noopener" target="_blank">{m.cta.whatsapp}</a>
      </div>
      <a className="wa-float" href={wa} rel="noopener" target="_blank" aria-label={m.cta.whatsapp}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5Z" />
          <path d="M9 9.2c.3 2.6 2.4 4.9 5.8 5.8l1.4-1.5-2.1-1.1-.9.8c-1-.5-1.8-1.4-2.2-2.3l.8-.9-1.1-2.1Z" fill="currentColor" stroke="none" />
        </svg>
      </a>
    </>
  );
}
