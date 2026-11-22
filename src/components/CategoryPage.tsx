'use client';

/* One service's own page (e.g. /services/signage/), after biegajaca-sztuka.pl's commission pages: the subpage head
   (breadcrumb, the service's giant name, its line, a quote button that drops to the form below, and a fan of what it
   makes); on ochre, "What we make" with its ranges as pills (switched in place) and the chosen range's catalogue
   pieces, or the concept plate while a range has no photos yet; this service's finished jobs; how an order works and
   the common questions; the quote form already set to this service; and the previous and next services.
   Design: docs/superpowers/specs/2026-11-20-light-style-sitewide-design.md */
import { useState } from 'react';
import { notFound } from 'next/navigation';
import { jobs } from '@/data/jobs';
import { hrefFor, messages, otherLocale, type Locale } from '@/i18n';
import { subCategories } from '@/data/sub-categories';
import { subCategoryProducts } from '@/data/sub-category-products';
import { serviceMedia } from '@/data/service-media';
import { Faq, Ground, JobsDialog, LightPage, PageHead, Steps, type FanItem } from './light/parts';
import { JobCard } from './light/JobCard';
import { QUOTE_EVENT } from './QuoteForm';
import { QuoteSection } from './QuoteSection';
import { Shell } from './Shell';

export function CategoryPage({ locale, category }: { locale: Locale; category: string }) {
  const m = messages(locale);
  const p = m.pages.services;
  const L = m.light;
  const S = m.sub;
  const servicesHref = hrefFor('services', locale);
  const items = m.services.items;
  const at = items.findIndex((s) => s.slug === category);
  const cat = items[at];
  const subs = subCategories[category] ?? [];
  const [active, setActive] = useState(0);
  if (!cat) notFound();

  const prev = items[(at - 1 + items.length) % items.length];
  const next = items[(at + 1) % items.length];
  const activeSlug = subs[active];
  const activeName = cat.makes[active] ?? cat.name;
  const products = subCategoryProducts[`${category}/${activeSlug}`] ?? [];
  const ownJobs = jobs.filter((j) => j.service === category);
  // "Get a quote" beside a range or a product: the form below takes this service and "I'm interested in: …"
  const ask = (name: string) => window.dispatchEvent(new CustomEvent(QUOTE_EVENT, { detail: { service: category, brief: S.rangeBrief.replace('{name}', name) } }));
  // the fan: one catalogue piece from each range; a service without product photos shows its plate and its jobs
  const pieces: FanItem[] = subs.map((sb) => subCategoryProducts[`${category}/${sb}`]?.[0]?.image).filter((src): src is string => !!src)
    .slice(0, 4).map((src) => ({ src, look: 'object' }));
  const workshop: FanItem[] = [{ src: '/video/hero-poster.jpg', look: 'photo' }, { src: '/services/printer-banner.webp', look: 'photo' }];
  const base: FanItem[] = pieces.length >= 2 ? pieces
    : [{ src: `/plates/${category}.png`, look: 'drawing' as const }, ...ownJobs.map((j) => ({ src: j.photos[0], look: j.look })), ...workshop]
      .filter((it, k, all) => all.findIndex((o) => o.src === it.src) === k).slice(0, 3);   // no picture twice; the workshop fills in
  // the service's own footage or visual goes in the middle of the fan, on top (src/data/service-media.ts)
  const own: FanItem[] = (serviceMedia[category] ?? []).map((md) => ({ src: md.still, look: 'photo', video: md.video, tag: md.tag === 'render' ? S.render : undefined }));
  const fan: FanItem[] = own.length ? [base[0], ...own, ...base.slice(1)].filter(Boolean).slice(0, 4) : base;

  return (
    <Shell locale={locale} routeKey="services" alt={`${hrefFor('services', otherLocale(locale))}${category}/`} waPage={{ service: cat.name }}>
      <LightPage locale={locale}>
        <PageHead locale={locale} id="cat-title" className="lcat__head" trail={[{ label: m.nav.services, href: servicesHref }, { label: cat.name }]}
          script={L.categoryScript} lines={[cat.name]} lead={cat.line} cta={{ label: S.quoteFor.replace('{name}', cat.name), href: '#quote' }} fan={fan} />

        <Ground on="ochre" from="cream" seed={31} className="lcat__body">
          <div className="lcat__layout">
            <h2 className="lsection-title">{S.whatTitle}</h2>
            <div className="lpills" role="tablist" aria-label={p.subLead}>
              {subs.map((sub, j) => (
                <button key={sub} type="button" role="tab" aria-selected={j === active}
                  className={`lpill${j === active ? ' is-active' : ''}`} onClick={() => setActive(j)}>
                  {cat.makes[j]}
                </button>
              ))}
            </div>

            <div className="lcat__panel" role="tabpanel" aria-label={activeName}>
              <div className="lcat__panelHead">
                <h3 className="lcat__panelTitle">{activeName}</h3>
                <a className="lbtn" href="#quote" onClick={() => ask(activeName)}>{S.quoteFor.replace('{name}', activeName)}</a>
              </div>
              {products.length > 0 ? (
                <ul className="lproducts">
                  {products.map((item) => (
                    <li key={item.slug} className="lproduct">
                      <span className="lproduct__art"><img className="is-object" src={item.image} alt="" width="600" height="600" loading="lazy" decoding="async" /></span>
                      <span className="lproduct__name">{item.name}</span>
                      <a className="lproduct__quote" href="#quote" onClick={() => ask(`${activeName}: ${item.name}`)}
                        aria-label={S.quoteFor.replace('{name}', item.name)}>
                        {S.quoteShort} <span className="arrow" aria-hidden="true">→</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="lcat__concept">
                  <figure className="lcat__conceptArt">
                    <img className="is-drawing" src={`/plates/${category}.png`} alt="" width="1254" height="1254" loading="lazy" decoding="async" />
                    <figcaption>{p.conceptLabel}</figcaption>
                  </figure>
                  <p className="lcat__note">{p.comingSoon}</p>
                </div>
              )}
            </div>
          </div>
        </Ground>

        <Ground on="cream" from="ochre" seed={35} className="lsub-sec">
          {ownJobs.length > 0 && (
            <section className="lsub-jobs" aria-labelledby="cat-jobs-t">
              <h2 id="cat-jobs-t" className="lsection-title">{S.jobsTitle}</h2>
              <ul className="lworks__grid">{ownJobs.map((j) => <JobCard key={j.slug} job={j} locale={locale} />)}</ul>
            </section>
          )}
          <Steps locale={locale} />
          <Faq locale={locale} />
        </Ground>

        <div className="lground on-cream lquote" data-ground="cream">
          <QuoteSection locale={locale} service={category} />
        </div>

        <nav className="lsvc-nav" aria-label={m.nav.services}>
          <a href={`${servicesHref}${prev.slug}/`} rel="prev"><small>{S.prevService}</small><b>{prev.name}</b></a>
          <a href={`${servicesHref}${next.slug}/`} rel="next"><small>{S.nextService}</small><b>{next.name}</b></a>
        </nav>
      </LightPage>
      <JobsDialog locale={locale} />
    </Shell>
  );
}
