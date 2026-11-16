'use client';

/* One main category's own page — e.g. /services/flags-banners/ — reached by clicking its card on
   the services hub (ServicesPage.tsx). Its real sub-categories are switched between in place (a
   sidebar on wide screens, a tab row on narrow ones — our own styling, same idea as jasani.ae's
   shop sidebar filter) rather than each opening its own page, so picking "Roll-ups" then "Large
   banners" never reloads anything. The selected sub-category's shop grid shows photo + name only,
   no price; falls back to the category's concept plate when there are no per-product photos yet
   (subCategoryProducts only covers gifts-apparel and two acrylic-awards ranges today). */
import { useState } from 'react';
import { notFound } from 'next/navigation';
import { hrefFor, messages, type Locale } from '@/i18n';
import { subCategories } from '@/data/sub-categories';
import { subCategoryProducts } from '@/data/sub-category-products';
import { Shell } from './Shell';
import './CategoryPage.css';

export function CategoryPage({ locale, category }: { locale: Locale; category: string }) {
  const m = messages(locale);
  const p = m.pages.services;
  const servicesHref = hrefFor('services', locale);
  const cat = m.services.items.find((s) => s.slug === category);
  const subs = subCategories[category] ?? [];
  const [active, setActive] = useState(0);
  if (!cat) notFound();

  const activeSlug = subs[active];
  const activeName = cat.makes[active] ?? cat.name;
  const products = subCategoryProducts[`${category}/${activeSlug}`] ?? [];

  return (
    <Shell locale={locale} routeKey="services">
      <section className="section cgp">
        <div className="wrap">
          <nav className="cgp__crumbs" aria-label="Breadcrumb">
            <a href={servicesHref}>{p.allLabel}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{cat.name}</span>
          </nav>
          <div className="cgp__intro">
            <span className="cgp__art"><img src={`/plates/${cat.slug}.png`} alt="" width="1254" height="1254" loading="lazy" decoding="async" /></span>
            <div>
              <h1 data-text-reveal>{cat.name}</h1>
              <p className="lead cgp__lead" data-reveal>{cat.line}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section cgp__body">
        <div className="wrap cgp__layout">
          <nav className="cgp__tabs" aria-label={p.subLead} role="tablist">
            {subs.map((sub, j) => (
              <button
                key={sub}
                type="button"
                role="tab"
                aria-selected={j === active}
                className={j === active ? 'is-active' : undefined}
                onClick={() => setActive(j)}
              >
                {cat.makes[j]}
              </button>
            ))}
          </nav>

          <div className="cgp__panel" role="tabpanel">
            <h2 className="cgp__panelTitle">{activeName}</h2>
            {products.length > 0 ? (
              <ul className="cgp__grid">
                {products.map((item) => (
                  <li key={item.slug}>
                    <span className="cgp__itemArt"><img src={item.image} alt="" width="600" height="600" loading="lazy" decoding="async" /></span>
                    <span className="cgp__itemName">{item.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <figure className="cgp__plate">
                  <img src={`/plates/${category}.png`} alt="" width="1254" height="1254" loading="lazy" decoding="async" />
                  <figcaption>{p.conceptLabel}</figcaption>
                </figure>
                <p className="cgp__note">{p.comingSoon}</p>
              </>
            )}
            <a className="btn cgp__cta" href={`${hrefFor('home', locale)}#quote`}>{p.cta} <span className="arrow" aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>
    </Shell>
  );
}
