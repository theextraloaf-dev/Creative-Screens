/* Motion lab: every primitive in one place, in this language. Not indexed. */
import { hl, messages, type Locale } from '@/i18n';
import { Shell } from './Shell';
import { Stage } from './Stage';
import './Lab.css';

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const pairs = [
  { name: 'Ink on paper', fg: '#111111', bg: '#f7f5f0', use: 'body text' },
  { name: 'Grey on paper', fg: '#5b5b55', bg: '#f7f5f0', use: 'secondary text' },
  { name: 'Ink on lime', fg: '#111111', bg: '#c8f31d', use: 'buttons' },
  { name: 'Lime on ink', fg: '#c8f31d', bg: '#111111', use: 'button hover' },
  { name: 'Lime on paper', fg: '#c8f31d', bg: '#f7f5f0', use: 'NEVER as text' },
  { name: 'Signal on paper', fg: '#e8432a', bg: '#f7f5f0', use: 'decoration only' },
].map((p) => ({ ...p, r: ratio(p.fg, p.bg) }));

export function Lab({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const L = m.lab;

  return (
    <Shell locale={locale} routeKey="lab">
      <div className="lab-page">
        <section className="section head">
          <div className="wrap">
            <p className="eyebrow">noindex</p>
            <h1 data-text-reveal>{L.title}</h1>
            <p className="lead" data-reveal>{L.intro}</p>
            <p className="eyebrow" data-reveal data-delay="0.1">{L.reduced}</p>
          </div>
        </section>

        <section className="section lab" aria-labelledby="l-type">
          <div className="wrap">
            <h2 id="l-type">{L.type}</h2>
            <div className="specimen">
              <p className="eyebrow">Display / eyebrow</p>
              <p className="d1" dangerouslySetInnerHTML={{ __html: hl(m.hero.title) }} />
              <p>{m.hero.proof} {m.hero.lead}</p>
              <p className="eyebrow">
                {locale === 'ar' ? 'الأرقام تبقى لاتينية:' : 'Digits and contacts:'} <span className="ltr">+968 XXXX XXXX · 2026</span>
              </p>
            </div>
            <table className="contrast">
              <thead><tr><th>Pair</th><th>Use</th><th>Ratio</th><th>AA text</th></tr></thead>
              <tbody>
                {pairs.map((p) => (
                  <tr key={p.name}>
                    <td><span className="chip" style={{ background: p.bg, color: p.fg }}>Aa</span> {p.name}</td>
                    <td>{p.use}</td>
                    <td className="ltr">{p.r.toFixed(1)}:1</td>
                    <td>{p.r >= 4.5 ? 'pass' : 'fail'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section lab" aria-labelledby="l-btn">
          <div className="wrap">
            <h2 id="l-btn">{L.buttons}</h2>
            <div className="row">
              <a className="btn" href="#quote">{m.cta.quote} <span className="arrow" aria-hidden="true">→</span></a>
              <a className="btn btn--ghost" href="#quote">{m.cta.whatsapp}</a>
            </div>
          </div>
        </section>

        <section className="section lab" aria-labelledby="l-rev">
          <div className="wrap">
            <h2 id="l-rev">{L.reveal}</h2>
            <div className="cards">
              <div className="card" data-reveal>up</div>
              <div className="card" data-reveal data-delay="0.08">up + delay</div>
              <div className="card" data-reveal="inline" data-delay="0.16">inline ({locale === 'ar' ? 'RTL' : 'LTR'})</div>
              <div className="card" data-reveal="fade" data-delay="0.24">fade</div>
            </div>
          </div>
        </section>

        <section className="section lab" aria-labelledby="l-text">
          <div className="wrap">
            <h2 id="l-text">{L.text}</h2>
            <p className="statement" data-text-reveal>{L.textSample}</p>
          </div>
        </section>

        <section className="section lab" aria-labelledby="l-blur">
          <div className="wrap">
            <h2 id="l-blur">{L.blur}</h2>
            <p className="statement" data-blur-in>{L.blurSample}</p>
          </div>
        </section>

        <section className="section lab" aria-labelledby="l-clip">
          <div className="wrap">
            <h2 id="l-clip">{L.clip}</h2>
            <div className="clip" data-clip><div className="ph" style={{ minHeight: '18rem' }}>{m.placeholder}</div></div>
          </div>
        </section>

        <section className="section lab" aria-labelledby="l-count">
          <div className="wrap">
            <h2 id="l-count">{L.count}</h2>
            <div className="stats">
              <div className="stat"><span className="n ltr" data-count="21">21</span><span className="eyebrow">{L.years}</span></div>
              <div className="stat"><span className="n ltr" data-count="500">500</span><span className="eyebrow">{L.clients}</span></div>
              <div className="stat"><span className="n ltr" data-count="2000">2000</span><span className="eyebrow">{L.projects}</span></div>
            </div>
          </div>
        </section>

        <Stage locale={locale} id="lab-stage" />

        <section className="section cta" id="quote">
          <div className="wrap"><h2>{m.cta.quoteTitle}</h2></div>
        </section>
      </div>
    </Shell>
  );
}
