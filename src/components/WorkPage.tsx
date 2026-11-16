/* "Our Work": one placeholder slot per service category, ready to swap for real project photos. */
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
          <h1 data-text-reveal>{p.title}</h1>
          <p className="lead" data-reveal>{p.lead}</p>
          <ul className="wp__grid">
            {services.map((s, i) => (
              <li key={s.slug} data-reveal data-delay={i * 0.06}>
                <div className="ph wp__ph">{p.ph}</div>
                <p className="wp__cap">{s.name}</p>
              </li>
            ))}
          </ul>
          <a className="btn" href={`${hrefFor('home', locale)}#quote`}>{p.cta} <span className="arrow" aria-hidden="true">→</span></a>
        </div>
      </section>
    </Shell>
  );
}
