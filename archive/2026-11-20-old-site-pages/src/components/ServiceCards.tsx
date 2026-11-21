'use client';

import { useRef, useState } from 'react';
import { SERVICE_EVENT } from './QuoteForm';

export interface CardItem {
  slug: string;
  name: string;
  line: string;
  makes: string[];
  parts: { name: string; line: string }[];
  photos: string[];
  price: string;
  time: string;
}

interface Props {
  items: CardItem[];
  copy: { details: string; quote: string; includes: string; examples: string; fromLabel: string; timeLabel: string; note: string; close: string };
}

type LenisLike = { stop(): void; start(): void; scrollTo(target: string): void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

/* Eight service cards; each opens a detail view with what is included, typical jobs, price and time, and a
   "get a quote for this" button that presets the quote form and scrolls to it. */
export function ServiceCards({ items, copy }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<CardItem | null>(null);

  const show = (item: CardItem) => {
    setOpen(item);
    lenis()?.stop();
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();
  const onClosed = () => { lenis()?.start(); };

  const quote = (item: CardItem) => {
    window.dispatchEvent(new CustomEvent(SERVICE_EVENT, { detail: item.slug }));
    close();
    const go = () => (lenis() ? lenis()?.scrollTo('#quote') : document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' }));
    requestAnimationFrame(go);
  };

  return (
    <>
      <ul className="sc__grid">
        {items.map((s) => (
          <li key={s.slug} data-reveal>
            <button type="button" className="sc" onClick={() => show(s)} data-service={s.slug}>
              <span className="sc__art"><img src={`/plates/${s.slug}.png`} alt="" width="1254" height="1254" loading="lazy" decoding="async" /></span>
              <span className="sc__name">{s.name}</span>
              <span className="sc__line">{s.line}</span>
              <span className="sc__facts"><span>{s.price}</span><span>{s.time}</span></span>
              <span className="sc__more">{copy.details} <span className="arrow" aria-hidden="true">→</span></span>
            </button>
          </li>
        ))}
      </ul>
      <p className="sc__note">{copy.note}</p>

      <dialog ref={dialog} className="sd" aria-labelledby="sd-title" onClose={onClosed} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        {open && (
          <div className="sd__in">
            <button type="button" className="sd__close" onClick={close} aria-label={copy.close}>×</button>
            <div className="sd__art"><img src={`/plates/${open.slug}.png`} alt="" width="1254" height="1254" /></div>
            <div className="sd__body">
              <h3 id="sd-title" className="sd__title">{open.name}</h3>
              <p className="sd__line">{open.line}</p>
              <dl className="sd__facts">
                <div><dt>{copy.fromLabel}</dt><dd>{open.price}</dd></div>
                <div><dt>{copy.timeLabel}</dt><dd>{open.time}</dd></div>
              </dl>
              <h4 className="sd__h">{copy.includes}</h4>
              <ul className="sd__list">{open.makes.map((x) => <li key={x}>{x}</li>)}</ul>
              {open.photos.length > 0 && (
                <ul className={open.photos.length < 4 ? 'sd__photos sd__photos--few' : 'sd__photos'}>
                  {open.photos.map((p) => <li key={p}><img src={p} alt="" width="900" height="900" loading="lazy" decoding="async" /></li>)}
                </ul>
              )}
              {open.parts.length > 0 && (
                <>
                  <h4 className="sd__h">{copy.examples}</h4>
                  <ul className="sd__parts">{open.parts.map((p) => <li key={p.name}><b>{p.name}</b> {p.line}</li>)}</ul>
                </>
              )}
              <button type="button" className="btn" onClick={() => quote(open)}>{copy.quote} <span className="arrow" aria-hidden="true">→</span></button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
