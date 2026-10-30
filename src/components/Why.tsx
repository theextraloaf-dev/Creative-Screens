/* Three benefit cards in one outlined container: big stat, bold title, one line (kigo-style).
   Stats are facts we hold (21 years, 8 services, one team); no unconfirmed numbers here. */
import { messages, type Locale } from '@/i18n';
import './Why.css';

export function Why({ locale }: { locale: Locale }) {
  const w = messages(locale).why;

  return (
    <section className="why section" aria-labelledby="why-title">
      <div className="wrap">
        <p className="why__eyebrow">{w.eyebrow}</p>
        <h2 id="why-title" data-text-reveal>{w.title}</h2>
        <ul className="why__grid">
          {w.items.map((c, i) => (
            <li key={c.t} data-reveal data-delay={i * 0.08}>
              <p className="why__stat"><bdi dir="ltr">{c.stat}</bdi><small>{c.unit}</small></p>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
