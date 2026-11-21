'use client';

/* The Work page's listing (Biegajaca's works page): filter pills with counts (All, then each service that has jobs),
   and the jobs as a grid of portrait cards. Filtering hides cards in place; the pills are toggle buttons. */
import { useState } from 'react';
import { jobs } from '@/data/jobs';
import { messages, type Locale } from '@/i18n';
import { serviceCounts } from '@/lib/jobs-gallery';
import { JobCard } from './JobCard';

export function WorksGrid({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const S = m.sub;
  const order = m.services.items.map((s) => s.slug);
  const name = (slug: string) => m.services.items.find((s) => s.slug === slug)?.name ?? slug;
  const counts = serviceCounts(jobs, order);
  const [show, setShow] = useState('');

  return (
    <div className="lworks">
      <div className="lworks__filters" role="group" aria-label={S.filterLabel}>
        <button type="button" className={`lpill${show === '' ? ' is-active' : ''}`} aria-pressed={show === ''} onClick={() => setShow('')}>
          {S.all} <span className="ltr">{jobs.length}</span>
        </button>
        {counts.map((c) => (
          <button key={c.service} type="button" className={`lpill${show === c.service ? ' is-active' : ''}`} aria-pressed={show === c.service} onClick={() => setShow(c.service)}>
            {name(c.service)} <span className="ltr">{c.n}</span>
          </button>
        ))}
      </div>
      <ul className="lworks__grid" aria-live="polite">
        {jobs.map((j) => <JobCard key={j.slug} job={j} locale={locale} hidden={show !== '' && j.service !== show} />)}
      </ul>
    </div>
  );
}
