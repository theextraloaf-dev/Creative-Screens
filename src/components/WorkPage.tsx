/* "Our work" (after biegajaca-sztuka.pl's Works page): the subpage head with the jobs' count raised after the title
   and a fan of jobs, then on ochre the filter pills (All and each service, with counts) and the jobs as portrait
   cards (ink strokes and "Quick view" under the pointer, each leading to the job's own page), then the closing panel.
   The jobs are src/data/jobs.ts (Sample placeholders until the client's jobs arrive); the homepage keeps the gallery.
   Design: docs/superpowers/specs/2026-11-20-light-style-sitewide-design.md */
import { jobs } from '@/data/jobs';
import { hrefFor, messages, type Locale } from '@/i18n';
import { ClosingPanel, Ground, JobsDialog, LightPage, PageHead } from './light/parts';
import { WorksGrid } from './light/WorksGrid';
import { cardLabels } from './light/JobCard';
import { Shell } from './Shell';

export function WorkPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const L = m.light;
  const S = m.sub;
  const fan = jobs.filter((j) => j.look === 'photo' || j.look === 'object').slice(0, 4).map((j) => ({ src: j.photos[0], look: j.look }));

  return (
    <Shell locale={locale} routeKey="work">
      <LightPage locale={locale}>
        <PageHead locale={locale} id="wp-title" trail={[{ label: m.nav.work }]} script={L.workScript} lines={[S.workTitle]}
          count={String(jobs.length).padStart(3, '0')} lead={L.workLead} fan={fan} />
        <Ground on="ochre" from="cream" seed={41} className="lworks-sec">
          <WorksGrid locale={locale} services={m.services.items.map((s) => ({ slug: s.slug, name: s.name }))}
            labels={{ ...cardLabels(m), filterLabel: S.filterLabel, all: S.all }} />
        </Ground>
        <ClosingPanel locale={locale} from="ochre" seed={43} lines={S.workClose.lines} cta={S.workClose.cta} href={`${hrefFor('home', locale)}#quote`} />
      </LightPage>
      <JobsDialog locale={locale} />
    </Shell>
  );
}
