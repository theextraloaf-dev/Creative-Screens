/* "Services" / categories page: the eight trades as the same illustrative plate cards used on the
   home page (ServiceCards.tsx). Each card is a single link to that category's own page
   (CategoryPage.tsx, /services/[category]/), which switches between its real sub-categories in
   place — a sidebar/tab row, not a separate page per sub-category — and shows the selected one's
   shop-style grid of products (no price), like jasani.ae/shop. */
import { hrefFor, messages, type Locale } from '@/i18n';
import { Shell } from './Shell';
import './ServicesPage.css';

export function ServicesPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.services;
  const servicesHref = hrefFor('services', locale);

  return (
    <Shell locale={locale} routeKey="services">
      <section className="section svp">
        <div className="wrap">
          <p className="eyebrow" data-reveal="fade">{p.eyebrow}</p>
          <h1 data-text-reveal>
            <span className="svp__bold">{p.titleBold}</span> <span className="svp__muted">{p.titleMuted}</span>
          </h1>
          <p className="lead svp__lead" data-reveal>{p.lead}</p>
        </div>
      </section>

      <section className="section svp__list">
        <div className="wrap">
          <ul className="svp__grid">
            {m.services.items.map((s, i) => (
              <li key={s.slug} data-reveal data-delay={Math.min(i * 0.04, 0.2)}>
                <a className="svp__card" href={`${servicesHref}${s.slug}/`}>
                  <span className="svp__art"><img src={`/plates/${s.slug}.png`} alt="" width="1254" height="1254" loading="lazy" decoding="async" /></span>
                  <h2>{s.name}</h2>
                  <p className="svp__line">{s.line}</p>
                  <span className="svp__more">{p.subLead} <span className="arrow" aria-hidden="true">→</span></span>
                </a>
              </li>
            ))}
          </ul>
          <a className="btn" href={`${hrefFor('home', locale)}#quote`}>{p.bottomCta} <span className="arrow" aria-hidden="true">→</span></a>
        </div>
      </section>
    </Shell>
  );
}
