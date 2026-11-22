/* One range of a service (e.g. /services/signage/3d-letters/), after dlxprint.com's range pages: the subpage head
   (breadcrumb Services › Signage › 3D letters, the range's giant name, what the range is, a quote button, and a fan
   of its photos); on ochre, every type in the range with its photo (a free stock photo of that kind of product, said
   so under the grid), its line and its own "Get a quote"; the catalogue pieces where the range has them (gifts,
   awards); the service's other ranges; the quote form set to this service and range; previous and next range.
   Copy: src/data/ranges.ts. Photos: src/data/range-photos.ts. */
import { notFound } from 'next/navigation';
import { hrefFor, messages, otherLocale, type Locale } from '@/i18n';
import { ranges } from '@/data/ranges';
import { rangePhotos } from '@/data/range-photos';
import { subCategories } from '@/data/sub-categories';
import { subCategoryProducts } from '@/data/sub-category-products';
import { serviceCover, serviceMedia } from '@/data/service-media';
import { Ground, LightPage, PageHead, type FanItem } from './light/parts';
import { QuoteLink } from './light/QuoteLink';
import { QuoteSection } from './QuoteSection';
import { Shell } from './Shell';

const pad = (n: number) => String(n).padStart(2, '0');

export function RangePage({ locale, category, range }: { locale: Locale; category: string; range: string }) {
  const m = messages(locale);
  const S = m.sub;
  const cat = m.services.items.find((s) => s.slug === category);
  const subs = subCategories[category] ?? [];
  const at = subs.indexOf(range);
  const info = ranges[`${category}/${range}`];
  if (!cat || at < 0 || !info) notFound();

  const servicesHref = hrefFor('services', locale);
  const serviceHref = `${servicesHref}${category}/`;
  const name = cat.makes[at] ?? range;
  const types = info.types.map((ty) => ({ ...ty, photo: rangePhotos[`${category}/${ty.slug}`] }));
  const pieces = (subCategoryProducts[`${category}/${range}`] ?? []).map((pr) => ({ ...pr, label: locale === 'ar' && pr.nameAr ? pr.nameAr : pr.name }));
  const brief = (what: string) => S.rangeBrief.replace('{name}', what);
  const quote = S.quoteShort;

  // the fan (three or four pictures): the range's own photos, then its catalogue pieces, then the service's cover and
  // footage stills, then the workshop; no picture twice
  const cover = serviceCover[category];
  const fan: FanItem[] = [
    ...types.filter((ty) => ty.photo).map((ty) => ({ src: ty.photo!.src, look: 'photo' as const })),
    ...pieces.map((pr) => ({ src: pr.image, look: pr.look ?? ('object' as const) })),
    ...(cover ? [{ src: cover.src, look: cover.look }] : []),
    ...(serviceMedia[category] ?? []).map((md) => ({ src: md.still, look: 'photo' as const })),
    { src: '/video/hero-poster.webp', look: 'photo' as const }, { src: '/services/printer-banner.webp', look: 'photo' as const },
  ].filter((it, k, all) => all.findIndex((o) => o.src === it.src) === k).slice(0, 4);

  const prev = subs[(at - 1 + subs.length) % subs.length];
  const next = subs[(at + 1) % subs.length];

  return (
    <Shell locale={locale} routeKey="services" alt={`${hrefFor('services', otherLocale(locale))}${category}/${range}/`} waPage={{ service: `${cat.name}: ${name}` }}>
      <LightPage locale={locale}>
        <PageHead locale={locale} id="range-title" className="lcat__head"
          trail={[{ label: m.nav.services, href: servicesHref }, { label: cat.name, href: serviceHref }, { label: name }]}
          script={cat.name} lines={[name]} lead={info.intro[locale]}
          count={types.length > 1 ? pad(types.length) : undefined}
          cta={{ label: S.quoteFor.replace('{name}', name), href: '#quote' }} fan={fan.length ? fan : undefined} />

        <Ground on="ochre" from="cream" seed={33} className="lcat__body">
          <div className="lcat__layout">
            {types.length > 0 && (
              <section className="ltypes-sec" aria-labelledby="types-t">
                <h2 id="types-t" className="lsection-title">{S.typesTitle}</h2>
                <ol className="ltypes">
                  {types.map((ty, i) => (
                    <li key={ty.slug} className="ltype">
                      <span className={`ltype__art${ty.photo ? '' : ' is-text'}`} aria-hidden={ty.photo ? undefined : true}>
                        {ty.photo
                          ? <img src={ty.photo.src} alt="" width="800" height="800" loading="lazy" decoding="async" />
                          : <b className="ltr">{pad(i + 1)}</b>}
                      </span>
                      <span className="ltype__num ltr" aria-hidden="true">{pad(i + 1)}</span>
                      <h3 className="ltype__name">{ty.name[locale]}</h3>
                      <p className="ltype__line">{ty.line[locale]}</p>
                      <QuoteLink service={category} brief={brief(`${name}: ${ty.name[locale]}`)} label={S.quoteFor.replace('{name}', ty.name[locale])}>
                        {quote} <span className="arrow" aria-hidden="true">→</span>
                      </QuoteLink>
                    </li>
                  ))}
                </ol>
                {types.some((ty) => ty.photo) && (
                  <p className="ltypes__note">{S.stockNote} <a href={hrefFor('work', locale)}>{S.stockLink}</a></p>
                )}
              </section>
            )}

            {pieces.length > 0 && (
              <section className="ltypes-sec" aria-labelledby="pieces-t">
                <h2 id="pieces-t" className="lsection-title">{types.length ? S.piecesTitle : S.whatTitle}</h2>
                <ul className="lproducts">
                  {pieces.map((pr) => (
                    <li key={pr.slug} className="lproduct">
                      <span className="lproduct__art"><img className={`is-${pr.look ?? 'object'}`} src={pr.image} alt="" width="600" height="600" loading="lazy" decoding="async" /></span>
                      <span className="lproduct__name">{pr.label}</span>
                      <QuoteLink service={category} brief={brief(`${name}: ${pr.label}`)} label={S.quoteFor.replace('{name}', pr.label)}>
                        {quote} <span className="arrow" aria-hidden="true">→</span>
                      </QuoteLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <nav className="lranges-nav" aria-label={S.otherRanges.replace('{name}', cat.name)}>
              <h2 className="lranges-nav__title">{S.otherRanges.replace('{name}', cat.name)}</h2>
              <div className="lpills">
                {subs.map((sb, j) => (
                  <a key={sb} href={`${serviceHref}${sb}/`} className={`lpill${sb === range ? ' is-active' : ''}`} aria-current={sb === range ? 'page' : undefined}>
                    {cat.makes[j]}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </Ground>

        <div className="lground on-cream lquote" data-ground="cream">
          <QuoteSection locale={locale} service={category} brief={brief(name)} />
        </div>

        <nav className="lsvc-nav" aria-label={cat.name}>
          <a href={`${serviceHref}${prev}/`} rel="prev"><small>{S.prevRange}</small><b>{cat.makes[subs.indexOf(prev)]}</b></a>
          <a href={`${serviceHref}${next}/`} rel="next"><small>{S.nextRange}</small><b>{cat.makes[subs.indexOf(next)]}</b></a>
        </nav>
      </LightPage>
    </Shell>
  );
}
