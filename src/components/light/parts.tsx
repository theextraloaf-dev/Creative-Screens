/* The light style's shared parts, used by every page (docs/superpowers/specs/2026-11-20-light-style-sitewide-design.md).
   Styles: src/styles/light.css. Motion: src/scripts/light/ (anything inside [data-light]; every part is optional). */
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { jobs, type Job } from '@/data/jobs';
import { hrefFor, messages, type Locale } from '@/i18n';
import { erodePath } from '@/lib/jobs-gallery';
import { site } from '@/config/site';

export type Ground = 'cream' | 'ochre' | 'sea' | 'peach';
const pad = (n: number) => String(n).padStart(2, '0');

/** An eroded paper edge (as on the Expedia pages): `from` (the section above) wears away into this section along a
    ragged coastline, with islands of it floating below and specks of this section showing through. */
export function Erode({ seed, from = 'cream', flip = false }: { seed: number; from?: Ground; flip?: boolean }) {
  const { edge, islands } = erodePath(1440, 240, seed);
  return (
    <svg className={`lerode${flip ? ' lerode--up' : ''}`} style={{ '--from': `var(--${from})` } as CSSProperties}
      viewBox="0 0 1440 240" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <path d={edge} fillRule="evenodd" />
      {islands.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/** A small kicker: a script word, then a bold word (either may be left out). */
export function Kicker({ script, bold, before }: { script?: string; bold?: string; before?: string }) {
  return (
    <p className="lkicker">
      {before && <><b>{before}</b> </>}
      {script && <i className="lscript">{script}</i>}{script && bold ? ' ' : ''}{bold && <b>{bold}</b>}
    </p>
  );
}

/** Giant stacked lines that rise in, one by one, as they enter. */
export function Giant({ lines, as: Tag = 'h2', id, className = '' }: { lines: string[]; as?: 'h1' | 'h2'; id?: string; className?: string }) {
  return (
    <Tag id={id} className={`lgiant ${className}`}>
      {lines.map((l) => <span key={l} className="lline" data-line><span>{l}</span></span>)}
    </Tag>
  );
}

/** A page section on one of the light grounds, with the eroded edge of the ground above it. */
export function Ground({ on, from, seed, id, label, className = '', children, ...rest }: {
  on: Ground; from?: Ground; seed?: number; id?: string; label?: string; className?: string; children: ReactNode; [k: `data-${string}`]: unknown;
}) {
  return (
    <section className={`lground on-${on} ${className}`} id={id} aria-labelledby={label} data-torn data-ground={on} {...rest}>
      {from && seed !== undefined && <Erode seed={seed} from={from} />}
      {children}
    </section>
  );
}

/** The services as a pinned giant list: the scroll moves the live row; its plate and counter follow. */
export function ServicesPinned({ locale, from, seed, id = 'l-services', script, kicker, lead }: {
  locale: Locale; from?: Ground; seed?: number; id?: string; script: string; kicker: string; lead: string;
}) {
  const services = messages(locale).services.items;
  return (
    <Ground on="ochre" from={from} seed={seed} id={id} label={`${id}-t`} className="lsvc">
      <div className="lsvc__pin" data-services-list>
        <div className="lsvc__side">
          <Kicker script={script} />
          <h2 id={`${id}-t`} className="lsvc__kicker">{kicker}</h2>
          <p className="lsvc__lead">{lead}</p>
          <p className="lcount"><b className="ltr" data-svc-count>01</b> <span className="ltr">/ {pad(services.length)}</span></p>
          <div className="lsvc__photo" aria-hidden="true">
            {services.map((s, i) => <img key={s.slug} src={`/plates/${s.slug}.png`} alt="" loading="lazy" data-svc-photo={i} className={`is-drawing${i === 0 ? ' is-live' : ''}`} />)}
          </div>
        </div>
        <ol className="lsvc__list lgiant">
          {services.map((s, i) => (
            <li key={s.slug} data-svc={i} className={i === 0 ? 'is-live' : ''}>
              <a href={`${hrefFor('services', locale)}${s.slug}/`}>{s.name}</a>
            </li>
          ))}
        </ol>
      </div>
    </Ground>
  );
}

/** The finished jobs as Biegajaca's pinned sideways gallery (needs <JobsDialog> once on the page). */
export function JobsGallery({ locale, from, seed, on = 'cream', id = 'l-work', titleAs: T = 'h2' }: {
  locale: Locale; from?: Ground; seed?: number; on?: Ground; id?: string; titleAs?: 'h1' | 'h2';
}) {
  const m = messages(locale); const L = m.light;
  const svcName = (slug: string) => m.services.items.find((s) => s.slug === slug)?.name ?? slug;
  const meta = (j: Job) => [j[locale].client, j[locale].place, svcName(j.service), String(j.year)].join(' · ');
  return (
    <Ground on={on} from={from} seed={seed} id={id} label={`${id}-t`} className="ljobs" data-gallery>
      <div className="ljobs__pin">
        <div className="ljobs__col">
          <Kicker script={L.jobsScript} bold={L.jobsKicker} />
          <T id={`${id}-t`} className="ljobs__title">{L.jobsTitle}</T>
          <p className="ljobs__lead">{L.jobsLead}</p>
          <div className="ljobs__now" aria-live="polite">
            <span className="ljobs__progress" aria-hidden="true"><i data-job-progress /></span>
            <p className="lcount"><b className="ltr" data-job-count>01</b> <span className="ltr">/ {pad(jobs.length)}</span>
              {jobs[0].sample && <span className="lsample" data-sample>{L.sample}</span>}</p>
            <h3 className="ljobs__job" data-job-title>{jobs[0][locale].title}</h3>
            <p className="ljobs__meta" data-job-meta>{meta(jobs[0])}</p>
          </div>
          <div className="ljobs__ctl">
            <button type="button" className="lround" data-prev aria-label={L.prev}><span aria-hidden="true">←</span></button>
            <button type="button" className="lround" data-next aria-label={L.next}><span aria-hidden="true">→</span></button>
            <button type="button" className="lbtn" data-see-active>{L.see}</button>
          </div>
        </div>
        <div className="ljobs__viewport">
          {/* where the job at the front sits; the WebGL row (gallery-gl.js) measures it */}
          <div className="ljobs__frame" aria-hidden="true" />
          <ol className="ljobs__track" data-track>
            {jobs.map((j, i) => (
              <li key={j.slug} className={`ljobs__card is-${j.look}`} data-card={i} data-slug={j.slug}>
                <button type="button" className="ljobs__open" data-see={j.slug} aria-label={`${L.see}: ${j[locale].title}`}>
                  <img src={j.photos[0]} alt="" loading={i < 3 ? 'eager' : 'lazy'} width={1280} height={800} />
                </button>
                {j.sample && <span className="lsample lsample--card">{L.sample}</span>}
                <div className="ljobs__cap"><h3>{j[locale].title}</h3><p>{meta(j)}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Ground>
  );
}

/** "See the job": the light lightbox and the jobs data it reads (once per page with a gallery). */
export function JobsDialog({ locale }: { locale: Locale }) {
  const m = messages(locale); const L = m.light;
  const svcName = (slug: string) => m.services.items.find((s) => s.slug === slug)?.name ?? slug;
  const data = jobs.map((j) => ({ slug: j.slug, sample: j.sample, look: j.look, photos: j.photos, ...j[locale], service: svcName(j.service), year: j.year, href: `${hrefFor('work', locale)}${j.slug}/` }));
  return (
    <>
      <dialog className="lbox" data-lightbox aria-labelledby="lbox-title">
        <button type="button" className="lbox__close" data-close aria-label={L.close}>×</button>
        <div className="lbox__strip" data-strip />
        <div className="lbox__text">
          <p className="lcount"><span data-box-meta /> <span className="lsample" data-box-sample hidden>{L.sample}</span></p>
          <h2 id="lbox-title" className="lbox__title" data-box-title />
          <p className="lbox__line" data-box-line />
          <a className="lbtn" href={hrefFor('work', locale)} data-box-link>{m.sub.openJob}</a>
        </div>
      </dialog>
      <script type="application/json" id="l-jobs-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
    </>
  );
}

/** "Made in our workshop": the client's own job footage (printer, wall wraps, 3D letters, a car decal) cut into one
    film. Wide screens get three vertical panels side by side (workshop-1080/720), phones the vertical cut
    (workshop-tall); it plays muted and looped only while on screen, and shows its still with reduced motion. */
export function WorkshopFilm({ locale, from, seed, id = 'l-film' }: { locale: Locale; from?: Ground; seed?: number; id?: string }) {
  const L = messages(locale).light;
  return (
    <Ground on="cream" from={from} seed={seed} id={id} label={`${id}-t`} className="lfilm">
      <div className="lfilm__head">
        <Kicker script={L.filmScript} bold={L.filmBold} />
        <h2 id={`${id}-t`} className="lsection-title">{L.filmTitle}</h2>
        <p className="lfilm__lead" data-rise>{L.filmLead}</p>
      </div>
      <figure className="lfilm__frame" data-rise>
        <video muted loop playsInline preload="none" poster="/video/workshop-poster.webp" aria-hidden="true" data-autoplay
          data-src-wide="/video/workshop-1080.mp4" data-src-mid="/video/workshop-720.mp4"
          data-src-tall="/video/workshop-tall.mp4" data-poster-tall="/video/workshop-tall-poster.webp" />
      </figure>
    </Ground>
  );
}

/** The closing: the ground above wears away onto the corniche photo, and a cream panel rises over it. */
export function ClosingPanel({ locale, from = 'cream', seed = 11, script, lines, cta, href, id = 'l-quote' }: {
  locale: Locale; from?: Ground; seed?: number; script?: string; lines?: string[]; cta?: string; href?: string; id?: string;
}) {
  const L = messages(locale).light;
  return (
    <section className="lclose" id={id} data-torn aria-labelledby={`${id}-t`} data-ground="image" data-ground-src="/video/hero-light-poster.webp">
      <img className="lclose__bg" src="/video/hero-light-poster.webp" alt="" loading="lazy" data-close-bg />
      <Erode seed={seed} from={from} />
      <div className="lclose__panel" data-panel>
        <Kicker script={script ?? L.closingScript} />
        <Giant id={`${id}-t`} className="lgiant--close" lines={lines ?? L.closingLines} />
        <a className="lbtn lbtn--big" href={href ?? `${hrefFor('home', locale)}#quote`}>{cta ?? L.quote}</a>
      </div>
    </section>
  );
}

/** The Services menu: the giant stacked list, full screen on cream, opened from the pill. */
export function ServicesMenu({ locale }: { locale: Locale }) {
  const m = messages(locale); const L = m.light;
  return (
    <>
      <button type="button" className="lmenu-open" data-services-open aria-haspopup="dialog">{L.menu} <span aria-hidden="true">≡</span></button>
      <div className="lmenu" data-services role="dialog" aria-modal="true" aria-labelledby="lmenu-title" hidden>
        <img className="lmenu__bg" src="/video/hero-light-poster.webp" alt="" loading="lazy" />
        <button type="button" className="lmenu__close" aria-label={L.menuClose}>×</button>
        <p id="lmenu-title" className="lmenu__kicker lscript">{L.menu}</p>
        <ul className="lmenu__list lgiant">
          {m.services.items.map((s) => <li key={s.slug}><a href={`${hrefFor('services', locale)}${s.slug}/`}>{s.name}</a></li>)}
        </ul>
      </div>
    </>
  );
}

/** Every light page's frame: the [data-light] root the motion attaches to, and the Services menu. */
export function LightPage({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="light" data-light>
      <ServicesMenu locale={locale} />
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- subpages (after biegajaca-sztuka.pl's)
   Every subpage opens the same way: a breadcrumb, the giant title (with a count on a listing), a lead, one action
   and a fanned stack of pictures; sections below are set apart by rules, the order steps and the questions are
   shared, and a listing's cards answer the pointer with two broad ink strokes. */

/** The breadcrumb at the top of a subpage (Home / Services / Signage), with its structured data. */
export function Crumbs({ locale, trail }: { locale: Locale; trail: { label: string; href?: string }[] }) {
  const S = messages(locale).sub;
  const items = [{ label: S.home, href: hrefFor('home', locale) }, ...trail];
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, ...(it.href ? { item: `${site.url}${it.href}` } : {}) })),
  };
  return (
    <nav className="lcrumbs" aria-label={locale === 'ar' ? 'مسار التنقل' : 'Breadcrumb'}>
      {items.map((it, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {it.href && i < items.length - 1 ? <a href={it.href}>{it.label}</a> : <span aria-current="page">{it.label}</span>}
        </Fragment>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </nav>
  );
}

/** A fan card: a picture, or a short muted loop (video) with the picture as its still; tag labels it (e.g. a render). */
export type FanItem = { src: string; look?: 'photo' | 'object' | 'drawing'; video?: string; tag?: string };

/** A fanned stack of tilted pictures: photos fill their card, catalogue pieces and drawings sit on paper, and a clip
    plays while it is on screen (the motion code, src/scripts/light/index.js; a still with reduced motion). It deals
    out as the page opens and spreads a little under the pointer. */
export function Fan({ items }: { items: FanItem[] }) {
  const mid = (items.length - 1) / 2;
  const tilt = [-7, 4, -3, 6, -5];
  return (
    <div className="lfan" aria-hidden="true">
      {items.map((it, i) => (
        <span key={`${it.src}-${i}`} className={`lfan__card is-${it.look ?? 'photo'}`}
          style={{ '--i': i, '--o': i - mid, '--r': `${tilt[i % tilt.length]}deg`, zIndex: 10 - Math.round(Math.abs(i - mid) * 2) } as CSSProperties}>
          {it.video
            ? <video muted loop playsInline preload="none" poster={it.src} data-autoplay data-src={it.video} />
            : <img src={it.src} alt="" decoding="async" />}
          {it.tag && <span className="lsample lfan__tag">{it.tag}</span>}
        </span>
      ))}
    </div>
  );
}

/** A subpage's head: breadcrumb, giant title (a listing adds its count, raised after the last word), lead, one
    action, and the fan beside it (above it with fanFirst, as on Biegajaca's About). */
export function PageHead({ locale, id, trail, script, bold, lines, count, lead, cta, fan, fanFirst = false, className = '', children }: {
  locale: Locale; id: string; trail: { label: string; href?: string }[]; script?: string; bold?: string; lines: string[];
  count?: string; lead?: string; cta?: { label: string; href: string }; fan?: FanItem[]; fanFirst?: boolean; className?: string; children?: ReactNode;
}) {
  return (
    <section className={`lpage-head${fan ? ' has-fan' : ''}${fanFirst ? ' is-fan-first' : ''} ${className}`} aria-labelledby={id}>
      <div className="lpage-head__text">
        <Crumbs locale={locale} trail={trail} />
        {(script || bold) && <Kicker script={script} bold={bold} />}
        <h1 id={id} className="lgiant lgiant--page">
          {lines.map((l, i) => (
            <span key={l} className="lline" data-line>
              <span>{l}{count && i === lines.length - 1 && <sup className="lpage-head__count ltr">{count}</sup>}</span>
            </span>
          ))}
        </h1>
        {lead && <p className="lpage-lead" data-rise>{lead}</p>}
        {children}
        {cta && <a className="lbtn lbtn--big" href={cta.href} data-rise>{cta.label}</a>}
      </div>
      {fan && <Fan items={fan} />}
    </section>
  );
}

/** "How an order works": four numbered steps, each a one-line heading with its sentence under it, beside the title. */
export function Steps({ locale }: { locale: Locale }) {
  const S = messages(locale).sub;
  return (
    <section className="lsteps lsplit" aria-labelledby="lsteps-t">
      <div className="lsplit__head">
        <h2 id="lsteps-t" className="lsection-title">{S.stepsTitle}</h2>
      </div>
      <ol className="lsteps__list lrows">
        {S.steps.map((st, i) => (
          <li key={st.h} data-rise>
            <b className="lsteps__n ltr">{pad(i + 1)}</b>
            <h3>{st.h}</h3>
            <p>{st.p}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The common questions, set like the steps: numbered rows, each question a one-line heading with its answer under
    it (opened one at a time). The answers are samples until the client confirms them, so they carry the Sample tag and
    are not published as FAQ structured data yet. */
export function Faq({ locale }: { locale: Locale }) {
  const S = messages(locale).sub;
  return (
    <section className="lfaq lsplit" aria-labelledby="lfaq-t">
      <div className="lsplit__head">
        <h2 id="lfaq-t" className="lsection-title">{S.faqTitle}</h2>
        <span className="lsample">{S.faqSample}</span>
      </div>
      <div className="lfaq__list lrows">
        {S.faq.map((f, i) => (
          <details key={f.q} className="lfaq__item" data-rise>
            <summary>
              <b className="lsteps__n ltr">{pad(i + 1)}</b>
              <span className="lfaq__q">{f.q}</span>
              <span className="lfaq__mark" aria-hidden="true" />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Biegajaca's hover on a work, in our colours: two broad strokes, ochre then paper, pulled across the picture like
    ink across a screen. Drawn by CSS (stroke-dashoffset) when the card is hovered or focused. */
export function Ink() {
  return (
    <svg className="link" viewBox="0 0 1000 1250" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="link__a" pathLength={1} d="M-140 210 C 260 40 640 380 1140 170 C 760 440 300 330 -140 650 C 300 690 700 560 1140 860" />
      <path className="link__b" pathLength={1} d="M1140 420 C 720 300 320 560 -140 480 C 240 790 780 690 1140 1010 C 780 1160 320 1060 -140 1290" />
    </svg>
  );
}
