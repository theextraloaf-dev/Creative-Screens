/* "Our Work": one numbered row per service category (same credits-row device as the About page's
   facts/values), with a placeholder thumbnail ready to swap for a real project photo, and the
   category's own one-line description reused from services.items so each row carries real
   copy even before real photos exist. */
import { hrefFor, messages, type Locale } from '@/i18n';
import { Shell } from './Shell';
import './WorkPage.css';

export function WorkPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.work;
  const services = m.services.items;

  return (
    <Shell locale={locale} routeKey="work">
      <section className="section wp">
        <div className="wrap">
          <p className="eyebrow" data-reveal="fade">{p.eyebrow}</p>
          <h1 data-text-reveal>
            <span className="wp__bold">{p.titleBold}</span> <span className="wp__muted">{p.titleMuted}</span>
          </h1>
          <p className="lead wp__lead" data-reveal>{p.lead}</p>
        </div>
      </section>

      <section className="section wp__list">
        <div className="wrap">
          <ol className="wp__rows">
            {services.map((s, i) => (
              <li key={s.slug} data-reveal data-delay={i * 0.04}>
                <span className="wp__num ltr" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="ph wp__thumb">{p.ph}</div>
                <div className="wp__info">
                  <h2>{s.name}</h2>
                  <p>{s.line}</p>
                </div>
              </li>
            ))}
          </ol>
          <a className="btn" href={`${hrefFor('home', locale)}#quote`}>{p.cta} <span className="arrow" aria-hidden="true">→</span></a>
        </div>
      </section>
    </Shell>
  );
}
