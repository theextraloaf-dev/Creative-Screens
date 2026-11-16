/* "About us": placeholder sections (story, team, certifications), ready to replace with the real copy. */
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
          <p className="lead ap__notice" data-reveal>{p.lead}</p>
          <div className="ap__sections">
            {p.sections.map((s, i) => (
              <div key={s.h} className="ap__block" data-reveal data-delay={i * 0.08}>
                <h2>{s.h}</h2>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
