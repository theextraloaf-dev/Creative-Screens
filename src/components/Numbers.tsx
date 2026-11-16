/* "Done so far": big condensed numerals in vertical hairline columns (after Hello World's "Done so far").
   The numbers themselves live in src/data/company-stats.ts (one place, not per-language); this file only
   supplies the translated labels, in the same order. Only "years" is confirmed by the client. */
import { messages, type Locale } from '@/i18n';
import { companyStats } from '@/data/company-stats';
import './Numbers.css';

const order = ['years', 'projects', 'vehicles', 'signs', 'events'] as const;

export function Numbers({ locale }: { locale: Locale }) {
  const n = messages(locale).numbers;
  // English heading: two lines, "Done" over "so far" (the second line never breaks). Arabic keeps its own wrapping.
  const [first, ...rest] = n.title.split(' ');
  const twoLines = locale !== 'ar' && rest.length > 0;

  return (
    <section className="num" aria-labelledby="num-title">
      <div className="wrap num__grid">
        <div className="num__head">
          <p className="eyebrow num__eyebrow" data-reveal="fade">{n.eyebrow}</p>
          <h2 id="num-title" className="num__title" data-reveal>
            {twoLines ? <><span className="num__l1">{first}</span> <span className="num__l2">{rest.join(' ')}</span></> : n.title}
          </h2>
        </div>
        <ol className="num__cols">
          {n.items.map((it, i) => {
            const stat = companyStats[order[i]];
            return (
              <li key={it.l} data-reveal data-delay={i * 0.08}>
                <span className="num__idx ltr">0{i + 1}</span>
                <span className="num__val ltr" data-count={stat.value}>{stat.value}</span>
                <span className="num__lab">{it.l}</span>
              </li>
            );
          })}
        </ol>
        <p className="num__note">{n.note}</p>
      </div>
    </section>
  );
}
