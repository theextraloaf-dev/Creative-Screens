/* One service's own page (e.g. /services/signage/), after biegajaca-sztuka.pl's commission pages: the subpage head
   (breadcrumb, the service's giant name, its line, a quote button that drops to the form below, and a fan of what it
   makes); on ochre, "What we make": its ranges as cards (photo, what the range is, how many types), each opening
   the range's own page (RangePage, after dlxprint.com's range pages); this service's finished jobs; how an order
   works and the common questions; the quote form already set to this service; and the previous and next services.
   Rendered on the server; only the form runs in the browser.
   Design: docs/superpowers/specs/2026-11-20-light-style-sitewide-design.md */
import { notFound } from 'next/navigation';
import { jobs } from '@/data/jobs';
import { hrefFor, messages, otherLocale, type Locale } from '@/i18n';
import { subCategories } from '@/data/sub-categories';
import { subCategoryProducts } from '@/data/sub-category-products';
import { ranges as rangeInfo } from '@/data/ranges';
import { rangePhotos } from '@/data/range-photos';
import { serviceCover, serviceMedia } from '@/data/service-media';
import { Faq, Ground, Ink, JobsDialog, LightPage, PageHead, Steps, type FanItem } from './light/parts';
import { JobCard, cardLabels } from './light/JobCard';
import { QuoteSection } from './QuoteSection';
import { Shell } from './Shell';

export function CategoryPage({ locale, category }: { locale: Locale; category: string }) {
  const m = messages(locale);
  const L = m.light;
  const S = m.sub;
  const servicesHref = hrefFor('services', locale);
  const items = m.services.items;
  const at = items.findIndex((s) => s.slug === category);
  const cat = items[at];
  if (!cat) notFound();

  const subs = subCategories[category] ?? [];
  const prev = items[(at - 1 + items.length) % items.length];
  const next = items[(at + 1) % items.length];
  const ownJobs = jobs.filter((j) => j.service === category);
  const cover = serviceCover[category];
  // each range as a card: its first type photo, else its first catalogue piece, else the service's cover
  const ranges = subs.map((sb, j) => {
    const info = rangeInfo[`${category}/${sb}`];
    const types = info?.types ?? [];
    const products = subCategoryProducts[`${category}/${sb}`] ?? [];
    const photo = types.map((ty) => rangePhotos[`${category}/${ty.slug}`]).find(Boolean);
    const art: FanItem | undefined = photo ? { src: photo.src, look: 'photo' }
      : products[0] ? { src: products[0].image, look: products[0].look ?? 'object' }
      : cover ? { src: cover.src, look: cover.look } : undefined;
    return {
      slug: sb, name: cat.makes[j] ?? sb, intro: info?.intro[locale] ?? '', art, own: !!photo || !!products[0],
      count: types.length ? S.typesCount.replace('{n}', String(types.length)) : S.piecesCount.replace('{n}', String(products.length)),
    };
  });

  // the fan: the ranges' own pictures; a service without them shows its cover and its jobs
  const pieces: FanItem[] = ranges.filter((rg) => rg.own && rg.art).map((rg) => rg.art!).slice(0, 4);
  const workshop: FanItem[] = [{ src: '/video/hero-poster.webp', look: 'photo' }, { src: '/services/printer-banner.webp', look: 'photo' }];
  // the service's own footage or visual goes in the middle of the fan, on top (src/data/service-media.ts)
  const own: FanItem[] = (serviceMedia[category] ?? []).map((md) => ({ src: md.still, look: 'photo', video: md.video, tag: md.tag === 'render' ? S.render : undefined }));
  const twin = own.length ? cover?.src : undefined;   // the cover is a frame of that footage: not shown twice
  const coverItem: FanItem[] = cover ? [{ src: cover.src, look: cover.look, tag: cover.render ? S.render : undefined }] : [];
  const base: FanItem[] = pieces.length >= 2 ? pieces
    : [...coverItem, ...ownJobs.map((j) => ({ src: j.photos[0], look: j.look })), ...workshop]
      .filter((it, k, all) => it.src !== twin && all.findIndex((o) => o.src === it.src) === k).slice(0, 3);   // no picture twice; the workshop fills in
  const fan: FanItem[] = own.length ? [base[0], ...own, ...base.slice(1)].filter(Boolean).slice(0, 4) : base;

  return (
    <Shell locale={locale} routeKey="services" alt={`${hrefFor('services', otherLocale(locale))}${category}/`} waPage={{ service: cat.name }}>
      <LightPage locale={locale}>
        <PageHead locale={locale} id="cat-title" className="lcat__head" trail={[{ label: m.nav.services, href: servicesHref }, { label: cat.name }]}
          script={L.categoryScript} lines={[cat.name]} lead={cat.line} cta={{ label: S.quoteFor.replace('{name}', cat.name), href: '#quote' }} fan={fan} />

        <Ground on="ochre" from="cream" seed={31} className="lcat__body">
          <div className="lcat__layout">
            <h2 className="lsection-title">{S.whatTitle}</h2>
          </div>
          <ol className="lsvcs lsvcs--ranges">
            {ranges.map((rg, i) => (
              <li key={rg.slug} className="lsvcs__item" data-rise>
                <a className="lsvcs__card" href={`${servicesHref}${category}/${rg.slug}/`}>
                  <span className="lsvcs__art">
                    {rg.art && <img className={`is-${rg.art.look}`} src={rg.art.src} alt="" loading="lazy" decoding="async" />}
                    <Ink />
                  </span>
                  <span className="lsvcs__num"><span className="ltr" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span> · {rg.count}</span>
                  <h3 className="lsvcs__name">{rg.name}</h3>
                  <p className="lsvcs__line">{rg.intro}</p>
                  <span className="lsvcs__more">{S.seeRange} <span className="arrow" aria-hidden="true">→</span></span>
                </a>
              </li>
            ))}
          </ol>
        </Ground>

        <Ground on="cream" from="ochre" seed={35} className="lsub-sec">
          {ownJobs.length > 0 && (
            <section className="lsub-jobs" aria-labelledby="cat-jobs-t">
              <h2 id="cat-jobs-t" className="lsection-title">{S.jobsTitle}</h2>
              <ul className="lworks__grid">{ownJobs.map((j) => <JobCard key={j.slug} job={j} locale={locale} labels={cardLabels(m)} />)}</ul>
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
