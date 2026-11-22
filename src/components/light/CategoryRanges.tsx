'use client';

/* A service page's "What we make": its ranges as pills (switched in place) and the chosen range's catalogue pieces,
   each with its own "Get a quote"; a range with no product photos yet shows the service's cover picture and a note.
   The only interactive part of the page, so the only part that runs in the browser: its words come in as props from
   the (server) service page, so the browser gets only that page's language. */
import { useState } from 'react';
import type { ServiceCover } from '@/data/service-media';
import { QUOTE_EVENT } from '../QuoteForm';

export type Range = { name: string; products: { slug: string; name: string; image: string; look: 'photo' | 'object' }[] };

export function CategoryRanges({ category, ranges, cover, t }: {
  category: string;
  ranges: Range[];
  cover?: ServiceCover;
  t: { tabsLabel: string; quoteFor: string; quoteShort: string; rangeBrief: string; comingSoon: string };
}) {
  const [active, setActive] = useState(0);
  const range = ranges[active] ?? ranges[0];
  if (!range) return null;
  const quoteFor = (name: string) => t.quoteFor.replace('{name}', name);
  // "Get a quote" beside a range or a product: the form below takes this service and "I'm interested in: …"
  const ask = (name: string) => window.dispatchEvent(new CustomEvent(QUOTE_EVENT, { detail: { service: category, brief: t.rangeBrief.replace('{name}', name) } }));

  return (
    <>
      <div className="lpills" role="tablist" aria-label={t.tabsLabel}>
        {ranges.map((r, j) => (
          <button key={r.name} type="button" role="tab" aria-selected={j === active}
            className={`lpill${j === active ? ' is-active' : ''}`} onClick={() => setActive(j)}>
            {r.name}
          </button>
        ))}
      </div>

      <div className="lcat__panel" role="tabpanel" aria-label={range.name}>
        <div className="lcat__panelHead">
          <h3 className="lcat__panelTitle">{range.name}</h3>
          <a className="lbtn" href="#quote" onClick={() => ask(range.name)}>{quoteFor(range.name)}</a>
        </div>
        {range.products.length > 0 ? (
          <ul className="lproducts">
            {range.products.map((item) => (
              <li key={item.slug} className="lproduct">
                <span className="lproduct__art"><img className={`is-${item.look}`} src={item.image} alt="" width="600" height="600" loading="lazy" decoding="async" /></span>
                <span className="lproduct__name">{item.name}</span>
                <a className="lproduct__quote" href="#quote" onClick={() => ask(`${range.name}: ${item.name}`)} aria-label={quoteFor(item.name)}>
                  {t.quoteShort} <span className="arrow" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="lcat__concept">
            {cover && (
              <figure className="lcat__conceptArt">
                <img className={`is-${cover.look}`} src={cover.src} alt="" loading="lazy" decoding="async" />
              </figure>
            )}
            <p className="lcat__note">{t.comingSoon}</p>
          </div>
        )}
      </div>
    </>
  );
}
