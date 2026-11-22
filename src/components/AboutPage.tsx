/* "About us" in the light style (real copy from the client's company profile): a "21 Years" lockup over the giant title,
   the intro rising paragraph by paragraph, the fact sheet as large rows, the core values as a pinned list on ochre
   (the live value in full ink, its sentence beside it; replaces the old dark band), then the closing panel.
   Design: docs/superpowers/specs/2026-11-20-light-style-sitewide-design.md */
import { hl, messages, type Locale } from '@/i18n';
import { site } from '@/config/site';
import { ClosingPanel, Crumbs, Fan, Ground, Kicker, LightPage, WorkshopFilm } from './light/parts';
import { Shell } from './Shell';

// the head's fan (as on Biegajaca's About): the workshop, the corniche in the middle, two catalogue pieces
const FAN = [
  { src: '/video/hero-poster.jpg', look: 'photo' as const },
  { src: '/subcategories/acrylic-awards/trophy-crop.webp', look: 'object' as const },
  { src: '/video/hero-light-poster.webp', look: 'photo' as const },
  { src: '/gifts/dallah-set.webp', look: 'object' as const },
  { src: '/services/printer-banner.webp', look: 'photo' as const },
];

export function AboutPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.about;
  const L = m.light;
  const pad = (n: number) => String(n).padStart(2, '0');

  const facts = [
    { dt: p.vision.h, dd: p.vision.body },
    { dt: p.mission.h, dd: p.mission.body },
    { dt: p.experienceLabel, dd: p.experienceValue },
    { dt: p.customersLabel, dd: <span className="ltr">{p.customersValue}</span> },
    { dt: p.hqLabel, dd: site.address },
  ];

  return (
    <Shell locale={locale} routeKey="about">
      <LightPage locale={locale}>
        <section className="lpage-head has-fan is-fan-first labout__hero" aria-labelledby="ap-title">
          <div className="lpage-head__text">
          <Crumbs locale={locale} trail={[{ label: m.nav.about }]} />
          <p className="labout__lockup" aria-hidden="true"><b className="ltr">21</b> <i className="lscript">{L.years}</i></p>
          <Kicker bold={p.eyebrow} />
          <h1 id="ap-title" className="lgiant lgiant--page" data-rise dangerouslySetInnerHTML={{ __html: hl(p.title) }} />
          <div className="labout__intro">
            {p.intro.map((para, i) => <p key={i} className="lpage-lead" data-rise>{para}</p>)}
          </div>
          </div>
          <Fan items={FAN} />
        </section>

        <WorkshopFilm locale={locale} id="l-film" />

        <section className="labout__facts" aria-label={p.eyebrow}>
          <dl className="lfacts">
            {facts.map((f) => (
              <div key={f.dt} className="lfacts__row" data-rise>
                <dt>{f.dt}</dt>
                <dd>{f.dd}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* the values: pinned; the scroll moves the live value down the list (src/scripts/light/reveals.js) */}
        <Ground on="ochre" from="cream" seed={51} id="l-values" label="l-values-t" className="lsvc lvalues">
          <div className="lsvc__pin" data-services-list>
            <div className="lsvc__side">
              <Kicker script={L.valuesScript} bold={L.valuesBold} />
              <h2 id="l-values-t" className="lsvc__kicker">{p.valuesTitle}</h2>
              <p className="lcount"><b className="ltr" data-svc-count>01</b> <span className="ltr">/ {pad(p.values.length)}</span></p>
              <p className="lvalues__body" data-svc-body aria-live="polite">{p.values[0].body}</p>
            </div>
            <ol className="lsvc__list lgiant">
              {p.values.map((v, i) => (
                <li key={v.h} data-svc={i} data-body={v.body} className={i === 0 ? 'is-live' : ''}>
                  <span>{v.h}</span>
                </li>
              ))}
            </ol>
          </div>
        </Ground>

        <ClosingPanel locale={locale} from="ochre" seed={53} />
      </LightPage>
    </Shell>
  );
}
