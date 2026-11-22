/* One finished job's own page (e.g. /work/staff-caps/), after biegajaca-sztuka.pl's work pages: the pictures stay
   in view on one side while the other carries the breadcrumb, the Sample tag, the giant title, the facts (client,
   place, service, year) and the job's line; then the quote form already set to this service with a first line of
   brief ("Something like: ..."); then more jobs, its own service first. */
import { notFound } from 'next/navigation';
import { jobs } from '@/data/jobs';
import { hrefFor, messages, otherLocale, type Locale } from '@/i18n';
import { moreJobs } from '@/lib/jobs-gallery';
import { Ground, JobsDialog, Kicker, LightPage, Crumbs } from './light/parts';
import { JobCard, cardLabels } from './light/JobCard';
import { JobMedia } from './light/JobMedia';
import { QuoteSection } from './QuoteSection';
import { Shell } from './Shell';

export function JobPage({ locale, slug }: { locale: Locale; slug: string }) {
  const m = messages(locale);
  const L = m.light;
  const S = m.sub;
  const job = jobs.find((j) => j.slug === slug);
  if (!job) notFound();
  const c = job[locale];
  const svc = m.services.items.find((s) => s.slug === job.service);
  const workHref = hrefFor('work', locale);
  const facts = [
    { dt: S.labels.client, dd: c.client },
    { dt: S.labels.place, dd: c.place },
    { dt: S.labels.service, dd: svc ? <a href={`${hrefFor('services', locale)}${svc.slug}/`}>{svc.name}</a> : job.service },
    { dt: S.labels.year, dd: <span className="ltr">{job.year}</span> },
  ];

  return (
    <Shell locale={locale} routeKey="work" alt={`${hrefFor('work', otherLocale(locale))}${job.slug}/`} waPage={{ service: svc?.name, job: c.title }}>
      <LightPage locale={locale}>
        <article className="ljob" aria-labelledby="job-title">
          <JobMedia job={job} labels={job.photos.map((_, i) => `${L.photos} ${i + 1} ${L.of} ${job.photos.length}`)} />
          <div className="ljob__info">
            <Crumbs locale={locale} trail={[{ label: S.workTitle, href: workHref }, { label: c.title }]} />
            {job.sample && <span className="lsample">{L.sample}</span>}
            <h1 id="job-title" className="lgiant lgiant--job">{c.title}</h1>
            <dl className="ljob__facts">
              {facts.map((f) => <div key={f.dt}><dt>{f.dt}</dt><dd>{f.dd}</dd></div>)}
            </dl>
            <p className="ljob__line">{c.line}</p>
            <a className="lbtn lbtn--big" href="#quote">{S.askTitle}</a>
          </div>
        </article>

        <div className="lground on-cream lquote" data-ground="cream">
          <QuoteSection locale={locale} service={job.service} brief={S.askBrief.replace('{title}', c.title)} />
        </div>

        <Ground on="ochre" from="cream" seed={47} className="lsub-sec lmore">
          <section className="lsub-jobs" aria-labelledby="more-t">
            <Kicker script={L.jobsScript} bold={L.jobsKicker} />
            <h2 id="more-t" className="lsection-title">{S.moreJobs}</h2>
            <ul className="lworks__grid">{moreJobs(jobs, job.slug, 4).map((j) => <JobCard key={j.slug} job={j} locale={locale} labels={cardLabels(m)} />)}</ul>
          </section>
        </Ground>
      </LightPage>
      <JobsDialog locale={locale} />
    </Shell>
  );
}
