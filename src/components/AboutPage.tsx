/* "About us": real copy from the client's company profile PDF (intro, vision, mission, core values). */
import { messages, type Locale } from '@/i18n';
import { Shell } from './Shell';
import './AboutPage.css';

export function AboutPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.about;

  return (
    <Shell locale={locale} routeKey="about">
      <section className="section ap">
        <div className="wrap">
          <p className="eyebrow" data-reveal="fade">{p.eyebrow}</p>
          <h1 data-text-reveal>{p.title}</h1>
          <div className="ap__intro">
            {p.intro.map((para, i) => <p key={i} className="lead" data-reveal data-delay={i * 0.05}>{para}</p>)}
          </div>

          <div className="ap__vm">
            <div data-reveal>
              <h2>{p.vision.h}</h2>
              <p>{p.vision.body}</p>
            </div>
            <div data-reveal data-delay="0.08">
              <h2>{p.mission.h}</h2>
              <p>{p.mission.body}</p>
            </div>
          </div>

          <h2 className="ap__values-title" data-reveal>{p.valuesTitle}</h2>
          <ul className="ap__values">
            {p.values.map((v, i) => (
              <li key={v.h} data-reveal data-delay={i * 0.05}>
                <h3>{v.h}</h3>
                <p>{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Shell>
  );
}
