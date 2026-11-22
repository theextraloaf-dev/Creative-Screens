/* "Our clients": the main clients we have worked with, as a rolling row of logos. After the logo carousel on
   Expedia's Route 66 pages: a centred headline, then the logos between hairline rules (one above the row, one under
   each logo) with generous space around each. Theirs is a static row on desktop and a draggable auto-rotating
   carousel on phones; ours rolls on every screen, slowly and endlessly, pausing on hover, on keyboard focus and
   with its pause button. With reduced motion (or no JS) it is Expedia's static row: the clients once, wrapped and
   centred. The belt holds the row twice so the loop is seamless; the second copy is hidden from screen readers.
   Data: src/data/clients.ts (Sample placeholders until the real list arrives). Styles: .lclients in light.css. */
import type { CSSProperties } from 'react';
import { clients } from '@/data/clients';
import { messages, type Locale } from '@/i18n';
import { beltRow } from '@/lib/clients';
import { Ground, Kicker } from './parts';
import { ClientsToggle } from './ClientsToggle';

export function Clients({ locale, id = 'l-clients' }: { locale: Locale; id?: string }) {
  const L = messages(locale).light;
  const row = beltRow(clients, 10);
  const sample = clients.some((c) => c.sample);

  const items = (copy: number) => row.map(({ item: c, repeat, key }) => (
    <li key={`${copy}-${key}`} className={`lclients__item${repeat ? ' is-repeat' : ''}`} aria-hidden={copy > 0 || repeat ? true : undefined}>
      {c.logo
        ? <img src={c.logo} alt={c.name[locale]} loading="lazy" decoding="async" />
        : <span className="lclients__name">{c.name[locale]}</span>}
    </li>
  ));

  return (
    <Ground on="cream" id={id} label={`${id}-t`} className="lclients">
      <div className="lclients__head">
        <Kicker script={L.clientsScript} bold={L.clientsKicker} />
        <h2 id={`${id}-t`} className="lclients__title">{L.clientsTitle}</h2>
        <p className="lclients__lead">{L.clientsLead}{sample && <> <span className="lsample">{L.sample}</span></>}</p>
      </div>
      <div className="lclients__rail" style={{ '--n': row.length } as CSSProperties}>
        <div className="lclients__belt">
          <ul className="lclients__row" aria-label={L.clientsList}>{items(0)}</ul>
          <ul className="lclients__row lclients__row--copy" aria-hidden="true">{items(1)}</ul>
        </div>
      </div>
      <ClientsToggle pause={L.clientsPause} play={L.clientsPlay} />
    </Ground>
  );
}
