'use client';

/* The Work page's listing (Biegajaca's works page): filter pills with counts (All, then each service that has jobs),
   and the jobs as a grid of portrait cards. Filtering hides cards in place; the pills are toggle buttons.
   Its words come in as props from the (server) Work page, so the browser gets only this page's language. */
import { useState } from 'react';
import { jobs } from '@/data/jobs';
import { serviceCounts } from '@/lib/jobs-gallery';
import { JobCard, type CardLabels } from './JobCard';

export function WorksGrid({ locale, services, labels }: {
  locale: 'en' | 'ar';
  /** every service in the site's order, with its name in this language */
  services: { slug: string; name: string }[];
  labels: CardLabels & { filterLabel: string; all: string };
}) {
  const name = (slug: string) => services.find((s) => s.slug === slug)?.name ?? slug;
  const counts = serviceCounts(jobs, services.map((s) => s.slug));
  const [show, setShow] = useState('');

  return (
    <div className="lworks">
      <div className="lworks__filters" role="group" aria-label={labels.filterLabel}>
        <button type="button" className={`lpill${show === '' ? ' is-active' : ''}`} aria-pressed={show === ''} onClick={() => setShow('')}>
          {labels.all} <span className="ltr">{jobs.length}</span>
        </button>
        {counts.map((c) => (
          <button key={c.service} type="button" className={`lpill${show === c.service ? ' is-active' : ''}`} aria-pressed={show === c.service} onClick={() => setShow(c.service)}>
            {name(c.service)} <span className="ltr">{c.n}</span>
          </button>
        ))}
      </div>
      <ul className="lworks__grid" aria-live="polite">
        {jobs.map((j) => <JobCard key={j.slug} job={j} locale={locale} labels={labels} hidden={show !== '' && j.service !== show} />)}
      </ul>
    </div>
  );
}
