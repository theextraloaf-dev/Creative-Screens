/* Diorama journey preview (noindex): the Oman map dives into a toy Muscat street, and the van stops at five services.
   Server markup only; src/scripts/diorama/ takes over when motion is allowed and the models load (data-ready).
   Without motion or JS, or when WebGL fails: the still image and the five captions read as normal content.
   Design: docs/superpowers/specs/2026-11-20-muscat-diorama-journey-design.md */
import fs from 'node:fs';
import path from 'node:path';
import cfg from '@/data/diorama.json';
import { hotspotLabel, pinCopy, pinLabel, stories, storyUrl } from '@/data/diorama-stories';
import { hl, hrefFor, messages, type Locale } from '@/i18n';
import { DioramaStory } from './DioramaStory';
import { Shell } from './Shell';
import './Diorama.css';

export function Diorama({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const D = m.diorama;
  const quote = `${hrefFor('home', locale)}#quote`;
  const pad = (n: number) => String(n).padStart(2, '0');
  // the loader's Oman outline, inlined at build time (6 KB) so it can draw itself as the 3D downloads
  const outline = fs.readFileSync(path.join(process.cwd(), 'public', 'diorama', 'oman-outline.svg'), 'utf8')
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
  const collage = [
    ['/img/print-artwork.jpg', 0.9], ['/subcategories/gifts-apparel/tote-bag.jpg', 1.6], ['/subcategories/acrylic-awards/trophies.jpg', 1.2],
    ['/subcategories/gifts-apparel/cap-purple.jpg', 2.0], ['/subcategories/gifts-apparel/notebook-cork.jpg', 1.4],
    ['/subcategories/acrylic-awards/plaques.jpg', 1.8], ['/gifts/bottle-aluminium.webp', 1.1],
  ] as const;

  // the five journey services open their stories; print, gifts and awards go to the services page
  const storyFor: Record<string, number> = { signage: 1, graphics: 2, 'led-screens': 3, 'exhibitions-events': 4, 'flags-banners': 5 };
  const contours = Array.from({ length: 11 }, (_, i) => {
    const r = 40 + i * 34, w = 6 + i * 2.2;
    const pts = Array.from({ length: 48 }, (_, k) => {
      const a = (k / 48) * Math.PI * 2; const rr = r + Math.sin(a * 3 + i) * w + Math.cos(a * 5 - i * 0.7) * w * 0.6;
      return `${(500 + Math.cos(a) * rr * 1.35).toFixed(1)},${(400 + Math.sin(a) * rr).toFixed(1)}`;
    });
    return `M${pts.join(' L')} Z`;
  });

  return (
    <Shell locale={locale} routeKey="preview" loader={false}>
      {/* first-visit loader (src/scripts/diorama/index.js lifts it when the map is ready) */}
      <script dangerouslySetInnerHTML={{ __html: "try{localStorage.getItem('cs-diorama-loader')&&document.documentElement.classList.add('d-seen')}catch(e){}" }} />
      <div className="dloadscreen" data-loadscreen aria-hidden="true">
        <svg className="dloadscreen__topo" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
          {contours.map((d, i) => <path key={i} d={d} />)}
        </svg>
        <div className="dloadscreen__lockup">
          <span className="dloadscreen__mark" />
          <span className="dloadscreen__years"><b className="ltr">21</b> <i>{D.ui.years}</i></span>
        </div>
        <span className="dloadscreen__route" dangerouslySetInnerHTML={{ __html: outline }} />
        <p className="dloadscreen__fact"><b>{D.ui.didYouKnow}</b><span>{D.ui.fact}</span></p>
      </div>

      {/* the Services menu: giant stacked type over a dimmed still (src/scripts/diorama/menu.js) */}
      <div className="dmenu" data-services role="dialog" aria-modal="true" aria-labelledby="dmenu-title" hidden>
        <img className="dmenu__bg" src="/diorama/still.webp" alt="" loading="lazy" />
        <button type="button" className="dmenu__close" aria-label={D.ui.menuClose}>×</button>
        <p id="dmenu-title" className="dmenu__kicker">{D.ui.servicesTitle}</p>
        <ul className="dmenu__list">
          {m.services.items.map((it) => (
            <li key={it.slug}>
              <a href={storyFor[it.slug] ? storyUrl(storyFor[it.slug], locale) : hrefFor('services', locale)}
                data-story={storyFor[it.slug] || undefined}>{it.name}</a>
            </li>
          ))}
        </ul>
      </div>

      <section className="diorama" data-diorama aria-labelledby="d-title">
        <div className="diorama__pin">
          {/* the opening film (src/scripts/diorama/hero.js picks the language and size; tilts away on the first scroll) */}
          <div className="dhero" data-hero aria-hidden="true">
            {/* v3 intro: our van on a Hajar mountain road at golden hour (3d/build_intro.py; no text, so one render serves both languages) */}
            <img className="dhero__poster" src="/diorama/intro-poster.webp" alt="" width={1920} height={1080} fetchPriority="high" />
            <video className="dhero__film" muted playsInline preload="none" poster="/diorama/intro-poster.webp"
              data-src-1080="/diorama/intro-720.mp4" data-src-720="/diorama/intro-720.mp4" />
          </div>

          <button type="button" className="dmenu-open" data-services-open aria-haspopup="dialog">{D.ui.services} <span aria-hidden="true">≡</span></button>

          <ol className="dchapters" aria-hidden="true">
            <li data-ch="map">{D.ui.oman}</li>
            <li data-ch="dive">{D.labels.muscat}</li>
            {cfg.stops.map((st) => <li key={st.n} data-ch={`stop-${st.n}`} className="ltr">{pad(st.n)}</li>)}
            <li data-ch="outro">{D.ui.quote}</li>
          </ol>

          <header className="diorama__intro">
            <p className="eyebrow">{D.eyebrow}</p>
            <h1 id="d-title" dangerouslySetInnerHTML={{ __html: hl(D.title) }} />
            <p className="diorama__lead">{D.lead}</p>
            <div className="dloader" aria-hidden="true">
              <span className="dloader__outline" dangerouslySetInnerHTML={{ __html: outline }} />
              <span className="dloader__cue">{m.numbers.scroll}</span>
            </div>
          </header>

          <p className="dstatement" aria-hidden="true">{D.ui.statement}</p>

          <div className="diorama__art">
            {/* first paint while the models stream: the map's opening frame */}
            <img className="diorama__poster" src="/diorama/map-poster.webp" alt="" width={1920} height={1080} fetchPriority="high" />
            <div className="diorama__stillwrap">
              <img className="diorama__still" src="/diorama/still.webp" alt={D.stillAlt} width={1920} height={1080} loading="lazy" />
              {/* reduced motion / no JS: the stops are links on the still image to their story pages */}
              {cfg.hotspots.map((h) => (
                <a key={h.n} className="dstill-hot" href={storyUrl(h.n, locale)} style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
                  aria-label={hotspotLabel(h.n, locale)}><b className="ltr">{pad(h.n)}</b></a>
              ))}
            </div>
          </div>

          <div className="diorama__labels" data-labels aria-hidden="true">
            {Object.entries(D.labels).map(([k, v]) => <span key={k} data-label={k}>{v}</span>)}
          </div>

          {/* interaction layer: buttons positioned on 3D anchors by src/scripts/diorama/interact.js */}
          <div className="diorama__hotspots" data-hotspots role="group" aria-label={D.ui.hotspots}>
            {stories.map((st) => (
              <button key={st.n} type="button" className="dhot" data-stop={st.n} hidden aria-label={hotspotLabel(st.n, locale)}>
                <span className="dhot__ring" aria-hidden="true" /><b className="ltr" aria-hidden="true">{pad(st.n)}</b>
              </button>
            ))}
            {cfg.pins.map((p) => (
              <button key={p.slug} type="button" className="dpin" data-pin={p.slug} hidden aria-label={pinLabel(p.slug, locale)}>
                <span aria-hidden="true" />
              </button>
            ))}
          </div>

          {stories.map((st) => (
            <div key={st.n} className="dpostcard" data-postcard={`stop-${st.n}`} role="dialog" aria-labelledby={`dpc-${st.n}`} hidden>
              <figure className="dpostcard__photo"><img src={st.photos[0]} alt="" width={640} height={400} loading="lazy" /></figure>
              <div className="dpostcard__body">
                <p className="dpostcard__meta">{st[locale].client} · {st[locale].place}{st.placeholder && <span className="dsample">{D.ui.sample}</span>}</p>
                <h3 id={`dpc-${st.n}`}>{st[locale].title}</h3>
                <p>{st[locale].line}</p>
                <a className="btn dpostcard__cta" href={storyUrl(st.n, locale)} data-story={st.n}>{D.ui.seeJob} <span className="arrow" aria-hidden="true">→</span></a>
              </div>
              <button type="button" className="dpostcard__close" aria-label={D.ui.close}>×</button>
            </div>
          ))}
          {cfg.pins.map((p) => {
            const pc = pinCopy[p.slug]; const st = stories.find((x) => x.slug === pc.story)!;
            return (
              <div key={p.slug} className="dpostcard dpostcard--pin" data-postcard={`pin-${p.slug}`} role="dialog" aria-labelledby={`dpp-${p.slug}`} hidden>
                <figure className="dpostcard__photo"><img src={pc.photo} alt="" width={640} height={400} loading="lazy" /></figure>
                <div className="dpostcard__body">
                  <p className="dpostcard__meta">{pc[locale].place}{pc.placeholder && <span className="dsample">{D.ui.sample}</span>}</p>
                  <h3 id={`dpp-${p.slug}`}>{pc[locale].title}</h3>
                  <a className="btn dpostcard__cta" href={storyUrl(st.n, locale)} data-story={st.n}>{D.ui.seeService} <span className="arrow" aria-hidden="true">→</span></a>
                </div>
                <button type="button" className="dpostcard__close" aria-label={D.ui.close}>×</button>
              </div>
            );
          })}

          <div className="dstopnav">
            <button type="button" className="dstop-prev" hidden><span className="arrow" aria-hidden="true">←</span> {D.ui.prevStop}</button>
            <button type="button" className="dstop-next" hidden>{D.ui.nextStop} <span className="arrow" aria-hidden="true">→</span></button>
          </div>
          <div className="dhints" aria-live="polite">
            <button type="button" className="dhint" data-hint="drive" hidden>{D.ui.hintDrive}</button>
            <button type="button" className="dhint" data-hint="tap" hidden>{D.ui.hintTap}</button>
          </div>

          <ol className="diorama__hud" data-hud aria-hidden="true">
            {cfg.stops.map((s, i) => (
              <li key={s.n} data-stop={s.n}><b className="ltr">{pad(s.n)}</b><span>{D.stops[i].title}</span></li>
            ))}
          </ol>

          <div className="diorama__chapters">
            {cfg.stops.map((s, i) => (
              <section key={s.n} className="dchapter" data-stop={s.n} aria-labelledby={`dch-${s.n}`}>
                <p className="dchapter__meta"><span className="ltr">{pad(s.n)} / {pad(cfg.stops.length)}</span></p>
                <h2 id={`dch-${s.n}`} className="dchapter__title">{D.stops[i].title}</h2>
                <p className="dchapter__text">{D.stops[i].text}</p>
                <a className="dchapter__cta" href={quote}>{D.stops[i].cta} <span className="arrow" aria-hidden="true">→</span></a>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* story sheets: opened over the journey by src/scripts/diorama/sheet.js (own URL; Back closes) */}
      <div className="dsheets">
        {stories.map((st) => <DioramaStory key={st.n} story={st} locale={locale} mode="overlay" />)}
      </div>

      <section className="diorama__closing section" aria-labelledby="d-closing">
        <svg className="dtorn" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 L0 18 L40 22 L85 12 L130 20 L170 9 L220 17 L265 6 L310 15 L360 8 L400 19 L450 10 L500 16 L545 5 L600 14 L650 9 L700 18 L745 7 L790 16 L840 10 L885 20 L930 8 L980 15 L1030 6 L1075 17 L1120 11 L1160 19 L1200 12 L1200 40 Z" />
        </svg>
        <div className="dcollage" aria-hidden="true">
          {collage.map(([src, depth], i) => (
            <figure key={src} className={`dcollage__card dcollage__card--${i + 1}`} data-depth={depth}><img src={src} alt="" loading="lazy" /></figure>
          ))}
        </div>
        <div className="wrap">
          <h2 id="d-closing" data-text-reveal>{D.closing.title}</h2>
          <p className="diorama__lead" data-reveal>{D.closing.lead}</p>
          <ul className="diorama__products">
            {D.closing.items.map((it) => (
              <li key={it.name} data-reveal><b>{it.name}</b><span>{it.line}</span></li>
            ))}
          </ul>
          <a className="btn" href={quote}>{m.cta.quote} <span className="arrow" aria-hidden="true">→</span></a>
          <p className="diorama__credits">{D.credits}</p>
        </div>
      </section>
    </Shell>
  );
}
