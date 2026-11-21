import { hl, messages, whatsappHref, type Locale } from '@/i18n';
import { site } from '@/config/site';
import { ServiceList } from './ServiceList';
import { Shell } from './Shell';
import { ProofStrip } from './ProofStrip';
import { QuoteSection } from './QuoteSection';
import { Warehouse } from './Warehouse';
import { WorkStrip } from './WorkStrip';
import { Why } from './Why';
import './Home.css';

export function Home({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const wa = whatsappHref(site.whatsapp, m.wa.general);
  const T = m.story.ticket;

  return (
    <Shell locale={locale} routeKey="home" world={<div><Warehouse locale={locale} /></div>}>
      {/* Hero: a full-bleed film (like mdscollective), with a poster until it plays. Files in /public/video:
          hero.mp4 (desktop), hero-sm.mp4 (phones), hero-poster.jpg. The current files are a PLACEHOLDER made from a client photo. */}
      <section className="hero" data-chapter="hero">
        <div className="hero__media" aria-hidden="true">
          <video className="hero__video" muted loop playsInline preload="metadata" poster="/video/hero-poster.jpg" data-hero-video>
            <source src="/video/hero-sm.mp4" type="video/mp4" media="(max-width: 700px)" />
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>
          <div className="hero__scrim"></div>
        </div>
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="eyebrow" data-reveal="fade">{m.hero.eyebrow}</p>
            <h1 data-text-reveal dangerouslySetInnerHTML={{ __html: hl(m.hero.title) }} />
            <p className="hero__lead" data-reveal data-delay="0.15">{m.hero.lead}</p>
            <div className="hero__cta" data-reveal data-delay="0.25">
              <a className="btn" href="#quote">{m.cta.quote} <span className="arrow" aria-hidden="true">→</span></a>
              <a className="btn btn--ghost" href={wa} rel="noopener" target="_blank">{m.cta.whatsapp}</a>
            </div>
          </div>
          <p className="hero__proof eyebrow" data-reveal="fade" data-delay="0.35">{m.hero.proof}</p>
        </div>
        <p className="hero__cue eyebrow" aria-hidden="true"><span>{m.numbers.scroll}</span><i></i></p>
      </section>

      <ProofStrip locale={locale} />
      <ServiceList locale={locale} />

      <section className="jintro section" aria-labelledby="jintro-title">
        <div className="wrap">
          <p className="eyebrow" data-reveal="fade">{m.story.intro.eyebrow}</p>
          <h2 id="jintro-title" data-text-reveal dangerouslySetInnerHTML={{ __html: hl(m.story.intro.title) }} />
          <p className="jintro__lead" data-reveal>{m.story.intro.lead}</p>
          <ol className="jintro__steps" aria-hidden="true">
            {T.stages.map((s, i) => <li key={s} data-reveal data-delay={i * 0.1}><b className="ltr">0{i + 1}</b><span>{s}</span></li>)}
          </ol>
        </div>
      </section>

      {/* How a job runs: one caption per step over the 3D print works (src/scripts/journey.js). The scene tells the story; the words swap with the scroll. */}
      <div className="story" data-story>
        <div className="story__pin">
          <ol className="story__rail" data-rail aria-hidden="true">
            {T.stages.map((s, i) => <li key={s}><b className="ltr">0{i + 1}</b><span>{s}</span></li>)}
          </ol>
          <div className="story__track">
            {m.story.chapters.map((c, i) => (
              <section key={c.n} className="chapter" data-chapter={i + 1} aria-labelledby={`ch-${i}`}>
                <p className="chapter__meta">
                  <span className="ltr">{c.n} / 04</span>
                  <span>{T.stages[i]}</span>
                  <span className="chapter__time">{T.time}: {T.times[i]}</span>
                </p>
                <h2 id={`ch-${i}`} className="chapter__title">{c.title}</h2>
                <p className="chapter__text">{c.text}</p>
                <a className="chapter__cta" href="#quote">{T.ctas[i]} <span className="arrow" aria-hidden="true">→</span></a>
              </section>
            ))}
          </div>
        </div>
      </div>

      <WorkStrip locale={locale} />
      <Why locale={locale} />
      <QuoteSection locale={locale} />
    </Shell>
  );
}
