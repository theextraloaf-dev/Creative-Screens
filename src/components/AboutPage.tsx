/* "About us": real copy from the client's company profile PDF, styled as a credits-sheet (the A24-style
   fact rows already used as a reference elsewhere on this site) instead of plain boxed cards, with the
   core values as big numbered rows on a dark band instead of a small card grid. */
import { hl, messages, type Locale } from '@/i18n';
import { site } from '@/config/site';
import { Shell } from './Shell';
import './AboutPage.css';

export function AboutPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.about;

  const facts = [
    { dt: p.vision.h, dd: p.vision.body },
    { dt: p.mission.h, dd: p.mission.body },
    { dt: p.experienceLabel, dd: p.experienceValue },
    { dt: p.hqLabel, dd: site.address },
  ];

  return (
    <Shell locale={locale} routeKey="about">
      <section className="section ap">
        <div className="wrap ap__intro-wrap">
          <span className="ap__num" aria-hidden="true">21</span>
          <p className="eyebrow" data-reveal="fade">{p.eyebrow}</p>
          <h1 data-text-reveal dangerouslySetInnerHTML={{ __html: hl(p.title) }} />
          <div className="ap__intro">
            {p.intro.map((para, i) => <p key={i} className="lead" data-reveal data-delay={i * 0.05}>{para}</p>)}
          </div>
        </div>
      </section>

      <section className="section ap__facts">
        <div className="wrap">
          <dl className="ap__factsheet">
            {facts.map((f, i) => (
              <div key={f.dt} data-reveal data-delay={i * 0.05}>
                <dt>{f.dt}</dt>
                <dd>{f.dd}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section ap__values">
        <div className="wrap">
          <h2 data-reveal>{p.valuesTitle}</h2>
          <ol className="ap__valuelist">
            {p.values.map((v, i) => (
              <li key={v.h} data-reveal data-delay={i * 0.04}>
                <span className="ap__valuenum ltr" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{v.h}</h3>
                <p>{v.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Shell>
  );
}
