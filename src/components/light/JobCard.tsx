/* A finished job as a card (Biegajaca's work card): a portrait picture that takes two ink strokes under the pointer
   and raises a "Quick view" bar (opens the job lightbox), then the title and the client, place and year. The picture
   and the title both lead to the job's own page. Used by the Work grid, a service's jobs and a job's "More jobs".
   Its two words come in as props (cardLabels), so the Work grid can use it on the client without the dictionaries. */
import type { Job } from '@/data/jobs';
import type { Messages } from '@/i18n';
import { hrefFor } from '@/i18n/links';
import { Ink } from './Ink';

export type CardLabels = { sample: string; quickView: string };
export const cardLabels = (m: Messages): CardLabels => ({ sample: m.light.sample, quickView: m.sub.quickView });

export function JobCard({ job, locale, labels, quick = true, hidden = false }: {
  job: Job; locale: 'en' | 'ar'; labels: CardLabels; quick?: boolean; hidden?: boolean;
}) {
  const c = job[locale];
  const href = `${hrefFor('work', locale)}${job.slug}/`;
  return (
    <li className={`lwork is-${job.look}`} data-service={job.service} hidden={hidden}>
      <div className="lwork__media">
        <a href={href} tabIndex={-1} aria-hidden="true">
          <img src={job.photos[0]} alt="" loading="lazy" decoding="async" width={800} height={1000} />
        </a>
        <Ink />
        {job.sample && <span className="lsample lsample--card">{labels.sample}</span>}
        {quick && <button type="button" className="lwork__quick" data-quick={job.slug} aria-label={`${labels.quickView}: ${c.title}`}>{labels.quickView}</button>}
      </div>
      <h3 className="lwork__title"><a href={href}>{c.title}</a></h3>
      <p className="lwork__meta">{[c.client, c.place, String(job.year)].join(' · ')}</p>
    </li>
  );
}
