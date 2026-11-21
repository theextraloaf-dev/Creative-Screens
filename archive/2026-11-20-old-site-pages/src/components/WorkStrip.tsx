/* Recent work: three labelled photo placeholders until the client sends real photos. Each leads to the quote form. */
import { messages, type Locale } from '@/i18n';
import './WorkStrip.css';

export function WorkStrip({ locale }: { locale: Locale }) {
  const w = messages(locale).work;

  return (
    <section className="work section" aria-labelledby="work-title">
      <div className="wrap">
        <p className="eyebrow">{w.eyebrow}</p>
        <h2 id="work-title" data-text-reveal>{w.title}</h2>
        <ul className="work__grid">
          {w.items.map((t, i) => (
            <li key={t} data-reveal data-delay={i * 0.08}>
              <div className="ph work__ph">{w.ph}</div>
              <p className="work__cap">{t}</p>
            </li>
          ))}
        </ul>
        <a className="btn" href="#quote">{w.cta} <span className="arrow" aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
