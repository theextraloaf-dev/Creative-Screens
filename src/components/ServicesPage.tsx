/* "Services" (after biegajaca-sztuka.pl's Commissions page): the subpage head (breadcrumb, giant title, lead, the
   quote button and a fan of our own pictures), the nine trades as large staggered cards on ochre (each takes the ink
   strokes under the pointer and leads to its page), how an order works, the common questions, and the closing panel.
   Design: docs/superpowers/specs/2026-11-20-light-style-sitewide-design.md */
import { hrefFor, messages, type Locale } from '@/i18n';
import { ClosingPanel, Faq, Ground, Ink, LightPage, PageHead, Steps } from './light/parts';
import { Shell } from './Shell';

const FAN = [
  { src: '/video/hero-poster.jpg', look: 'photo' as const },
  { src: '/subcategories/gifts-apparel/cap-trucker-navy.jpg', look: 'object' as const },
  { src: '/services/printer-banner.webp', look: 'photo' as const },
  { src: '/subcategories/acrylic-awards/trophy-crop.webp', look: 'object' as const },
];

export function ServicesPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.services;
  const L = m.light;
  const S = m.sub;
  const servicesHref = hrefFor('services', locale);

  return (
    <Shell locale={locale} routeKey="services">
      <LightPage locale={locale}>
        <PageHead locale={locale} id="svp-title" trail={[{ label: m.nav.services }]} script={L.servicesScript} bold={p.eyebrow}
          lines={[p.titleBold, p.titleMuted]} lead={p.lead} cta={{ label: p.bottomCta, href: `${hrefFor('home', locale)}#quote` }} fan={FAN} />

        <Ground on="ochre" from="cream" seed={21} className="lsvcs-sec">
          <ol className="lsvcs">
            {m.services.items.map((s, i) => (
              <li key={s.slug} className="lsvcs__item" data-rise>
                <a className="lsvcs__card" href={`${servicesHref}${s.slug}/`}>
                  <span className="lsvcs__art">
                    <img className="is-drawing" src={`/plates/${s.slug}.png`} alt="" width="1254" height="1254" loading="lazy" decoding="async" />
                    <Ink />
                  </span>
                  <span className="lsvcs__num ltr" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="lsvcs__name">{s.name}</h2>
                  <p className="lsvcs__line">{s.line}</p>
                  <span className="lsvcs__more">{S.see} <span className="arrow" aria-hidden="true">→</span></span>
                </a>
              </li>
            ))}
          </ol>
        </Ground>

        <Ground on="cream" from="ochre" seed={25} className="lsub-sec">
          <Steps locale={locale} />
          <Faq locale={locale} />
        </Ground>

        <ClosingPanel locale={locale} from="cream" seed={23} script={S.servicesClose.script} lines={S.servicesClose.lines} cta={S.servicesClose.cta} />
      </LightPage>
    </Shell>
  );
}
