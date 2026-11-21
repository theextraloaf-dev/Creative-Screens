/* The homepage (also served at /preview/): an Expedia-style loader, the postcard hero, the giant welcome statement with
   its ochre flood, the services as a pinned giant list, the pinned "Across Oman" road, the finished jobs as
   Biegajaca's pinned sideways gallery, the closing panel over the corniche, and the quote form.
   Built from the shared light parts (src/components/light/parts.tsx; styles in src/styles/light.css).
   Design: docs/superpowers/specs/2026-11-20-clean-light-jobs-gallery-design.md and 2026-11-20-light-style-sitewide-design.md */
import type { CSSProperties } from 'react';
import { hrefFor, messages, type Locale } from '@/i18n';
import { ClosingPanel, Erode, Giant, JobsDialog, JobsGallery, Kicker, LightPage, ServicesPinned } from './light/parts';
import { QuoteSection } from './QuoteSection';
import { Shell } from './Shell';

// the journey's road across Oman (lon, lat), drawn as the loader's progress line: Salalah to Muscat
const ROUTE: [number, number][] = [[54.09, 17.02], [54.4, 17.6], [55.3, 18.3], [56.6, 19.1], [57.7, 19.66], [57.65, 20.3],
  [58.0, 21.0], [58.6, 21.5], [59.1, 21.95], [59.4, 22.35], [59.45, 22.52], [59.1, 22.62], [58.53, 22.69], [58.1, 22.7],
  [57.53, 22.93], [57.9, 23.3], [58.2, 23.5], [58.383, 23.588]];
const routeXY = ROUTE.map(([lon, lat]) => [20 + ((lon - 54) / 5.6) * 360, 150 - ((lat - 16.8) / 7.7) * 140] as const);
const routeD = `M${routeXY.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')}`;

// "Across Oman": the same road drawn the other way, from the Muscat workshop out to Salalah, with its six cities and
// the kilometres between them (haversine along the waypoints)
const STOPS: [number, number][] = [[58.383, 23.588], [56.75, 24.3], [57.53, 22.93], [59.45, 22.52], [57.7, 19.66], [54.09, 17.02]];
const ROAD: [number, number][] = [[58.383, 23.588], [58.2, 23.54], [57.9, 23.56], [57.45, 23.72], [57.0, 23.98], [56.75, 24.3],
  [57.2, 23.45], [57.53, 22.93], [58.1, 22.7], [58.53, 22.69], [59.1, 22.62], [59.45, 22.52], [59.4, 22.35], [59.1, 21.95],
  [58.6, 21.5], [58.0, 21.0], [57.65, 20.3], [57.7, 19.66], [56.6, 19.1], [55.3, 18.3], [54.4, 17.6], [54.09, 17.02]];
const km = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const roadKm = ROAD.slice(1).reduce((acc, p, i) => [...acc, acc[i] + km(ROAD[i], p)], [0]);
const ROAD_KM = Math.round(roadKm[roadKm.length - 1]);
const stopAt = STOPS.map((st) => roadKm[ROAD.findIndex((p) => p[0] === st[0] && p[1] === st[1])] / roadKm[roadKm.length - 1]);
const mapXY = ([lon, lat]: [number, number]) => [40 + ((lon - 53.8) / 6.0) * 520 * 0.93, 30 + ((24.6 - lat) / 7.8) * 560] as const;
const roadD = `M${ROAD.map((p) => mapXY(p).map((v) => v.toFixed(1)).join(',')).join(' L')}`;

// faint topographic rings for the loader paper
const contours = Array.from({ length: 12 }, (_, i) => {
  const r = 34 + i * 30, w = 5 + i * 2;
  const pts = Array.from({ length: 56 }, (_, k) => {
    const a = (k / 56) * Math.PI * 2; const rr = r + Math.sin(a * 3 + i) * w + Math.cos(a * 5 - i * 0.7) * w * 0.6;
    return `${(500 + Math.cos(a) * rr * 1.4).toFixed(1)},${(400 + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
});

// the welcome cards (Expedia's Missouri welcome photos, for us the things Muscat reads): one size, frameless, a trail
// that alternates sides; workshop photos fill their card, catalogue pieces sit on a tile of the palette. Each links to
// its service; labels are messages.light.welcomeCards. depth: how much faster (+) or slower (-) than the page it rises.
const CARDS = [
  { src: '/video/hero-poster.jpg', service: 'print-stationery', look: 'photo', shape: 'wide', depth: 0.6 },
  { src: '/subcategories/gifts-apparel/cap-trucker-navy.jpg', service: 'gifts-apparel', look: 'object', tone: 'var(--peach)', shape: 'square', depth: -0.5 },
  { src: '/subcategories/acrylic-awards/trophy-crop.webp', service: 'acrylic-awards', look: 'object', tone: 'var(--sea)', shape: 'square', depth: 1 },
  { src: '/services/printer-banner.webp', service: 'flags-banners', look: 'photo', shape: 'square', depth: 0.2 },
  { src: '/gifts/mug-cork.webp', service: 'gifts-apparel', look: 'object', tone: '#fbf6ea', shape: 'square', depth: -0.3 },
  { src: '/gifts/tumbler-duo.webp', service: 'gifts-apparel', look: 'object', tone: 'var(--peach)', shape: 'wide', depth: 0.8 },
] as const;

export function LightPreview({ locale, routeKey = 'home' }: { locale: Locale; routeKey?: 'home' | 'preview' }) {
  const L = messages(locale).light;

  return (
    <Shell locale={locale} routeKey={routeKey}>
      {/* first visit only: the inline check runs before paint so a returning visitor never sees it flash */}
      <script dangerouslySetInnerHTML={{ __html: "try{localStorage.getItem('cs-light-loader')&&document.documentElement.classList.add('l-seen')}catch(e){}" }} />
      <div className="lload" data-loadscreen aria-hidden="true">
        <svg className="lload__topo" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
          {contours.map((d, i) => <path key={i} d={d} />)}
        </svg>
        <p className="lload__lockup">
          <b className="ltr">21</b> <i className="lscript">{L.years}</i> <b>{L.every}</b> <i className="lscript lscript--soft">{L.street}</i>
        </p>
        <p className="lload__count"><b className="ltr" data-load-count>0</b><span>{L.loading}</span></p>
        <svg className="lload__route" viewBox="0 0 400 160" aria-hidden="true">
          <path d={routeD} pathLength={1} />
          <circle cx={routeXY[0][0]} cy={routeXY[0][1]} r="4.5" />
          <circle cx={routeXY[routeXY.length - 1][0]} cy={routeXY[routeXY.length - 1][1]} r="4.5" />
        </svg>
        <p className="lload__fact"><b>{L.didYouKnow}</b><span>{L.fact}</span></p>
      </div>

      <LightPage locale={locale}>
        <nav className="lchapters" data-chapters aria-label={L.chapters.join(', ')}>
          <span className="lchapters__line"><i data-chapter-fill /></span>
          {L.chapters.map((c, i) => (
            <a key={c} href={`#l-${['start', 'services', 'route', 'work', 'quote'][i]}`} data-chapter={i}>{c}</a>
          ))}
        </nav>

        {/* 1. hero: the drone film of our van on the corniche, tilting away into a postcard as you scroll */}
        <section className="lhero" id="l-start" aria-labelledby="l-title">
          <div className="lhero__pin">
            <figure className="lhero__card" data-postcard>
              <img src="/video/hero-light-poster.webp" alt="" width={1920} height={1080} fetchPriority="high" />
              <video muted loop playsInline preload="none" poster="/video/hero-light-poster.webp" aria-hidden="true"
                data-hero-film data-src-1080="/video/hero-light-1080.mp4" data-src-720="/video/hero-light-720.mp4" />
              <figcaption className="lhero__copy">
                <span className="lscript">{L.heroKicker}</span>
                <h1 id="l-title" className="lgiant">{L.heroLines.map((l) => <span key={l} className="lline"><span>{l}</span></span>)}</h1>
              </figcaption>
            </figure>
            <span className="lhero__cue" aria-hidden="true">{L.scroll} ↓</span>
          </div>
        </section>

        {/* 2. welcome: the statement holds while the ochre floods up behind it; a trail of cards (what we make) rises
            past it, alternating sides, and the dallah turns as it drifts across in front (Expedia's state flower) */}
        <section className="lwelcome" aria-labelledby="l-welcome" data-flood-section data-ground="cream">
          <div className="lwelcome__stage">
            <div className="lwelcome__flood" data-flood data-ground="ochre" aria-hidden="true"><Erode seed={5} from="ochre" flip /></div>
            <Kicker before={L.welcome} script={L.to} bold={L.name} />
            <Giant id="l-welcome" className="lgiant--statement" lines={L.statement} />
          </div>
          <ul className="lwelcome__cards">
            {CARDS.map((c, i) => (
              <li key={c.src} className={`lwcard lwcard--${i + 1} is-${c.look} is-${c.shape}`} data-wcard data-depth={c.depth}>
                <a href={`${hrefFor('services', locale)}${c.service}/`}>
                  <span className="lwcard__art" style={'tone' in c ? ({ '--tone': c.tone } as CSSProperties) : undefined}>
                    <img src={c.src} alt="" loading="lazy" />
                  </span>
                  <span className="lwcard__tag">{L.welcomeCards[i]}</span>
                </a>
              </li>
            ))}
          </ul>
          <img className="lcutout" src="/gifts/dallah-set-cut.webp" alt="" loading="lazy" data-cutout />
        </section>

        {/* 3. services: pinned giant list */}
        <ServicesPinned locale={locale} from="cream" seed={3} script={L.servicesScript} kicker={L.servicesKicker} lead={L.servicesLead} />

        {/* Across Oman: pinned; the road draws from the workshop, the cities light up, the kilometres count */}
        <section className="lroute lground on-sea" id="l-route" data-torn data-ground="sea" data-route data-total-km={ROAD_KM} aria-labelledby="l-route-title">
          <Erode seed={9} from="ochre" />
          <div className="lroute__pin">
            <div className="lroute__side">
              <Kicker script={L.routeScript} bold={L.routeBold} />
              <Giant id="l-route-title" className="lgiant--route" lines={L.routeLines} />
              <p className="lroute__lead">{L.routeLead}</p>
              <ol className="lroute__cities">
                {L.cities.map((c, i) => <li key={c} data-city={i} data-at={stopAt[i].toFixed(4)} className={i === 0 ? 'is-on' : ''}>{c}</li>)}
              </ol>
              <p className="lcount lroute__km"><b className="ltr" data-km>0</b> <span>{L.km}</span></p>
            </div>
            <svg className="lroute__map" viewBox="0 0 600 620" aria-hidden="true">
              <path className="lroute__ghost" d={roadD} />
              <path className="lroute__road" d={roadD} pathLength={1} data-road />
              {STOPS.map((st, i) => {
                const [x, y] = mapXY(st);
                return (
                  <g key={i} className={`lroute__stop${i === 0 ? ' is-on' : ''}`} data-stop={i}>
                    <circle cx={x} cy={y} r="9" />
                    <text x={x + 16} y={y + 5}>{L.cities[i]}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        {/* 4. finished jobs: Biegajaca's pinned sideways gallery */}
        <JobsGallery locale={locale} from="sea" seed={7} />

        {/* 5. closing: the cream wears away onto the corniche and the panel rises; the quote form follows */}
        <ClosingPanel locale={locale} from="cream" seed={11} href="#quote" />
        <div className="lground on-cream lquote" data-torn data-ground="cream">
          <Erode seed={13} from="cream" flip />
          <QuoteSection locale={locale} />
        </div>
      </LightPage>
      <JobsDialog locale={locale} />
    </Shell>
  );
}
