/* A finished job as a card (Biegajaca's work card): a portrait picture that takes two ink strokes under the pointer
   and raises a "Quick view" bar (opens the job lightbox), then the title and the client, place and year. The picture
   and the title both lead to the job's own page. Used by the Work grid, a service's jobs and a job's "More jobs". */
import type { Job } from '@/data/jobs';
import { hrefFor, messages, type Locale } from '@/i18n';
import { Ink } from './parts';

export function JobCard({ job, locale, quick = true, hidden = false }: { job: Job; locale: Locale; quick?: boolean; hidden?: boolean }) {
  const m = messages(locale);
  const c = job[locale];
  const href = `${hrefFor('work', locale)}${job.slug}/`;
  return (
    <li className={`lwork is-${job.look}`} data-service={job.service} hidden={hidden}>
      <div className="lwork__media">
        <a href={href} tabIndex={-1} aria-hidden="true">
          <img src={job.photos[0]} alt="" loading="lazy" decoding="async" width={800} height={1000} />
        </a>
        <Ink />
        {job.sample && <span className="lsample lsample--card">{m.light.sample}</span>}
        {quick && <button type="button" className="lwork__quick" data-quick={job.slug} aria-label={`${m.sub.quickView}: ${c.title}`}>{m.sub.quickView}</button>}
      </div>
      <h3 className="lwork__title"><a href={href}>{c.title}</a></h3>
      <p className="lwork__meta">{[c.client, c.place, String(job.year)].join(' · ')}</p>
    </li>
  );
}
