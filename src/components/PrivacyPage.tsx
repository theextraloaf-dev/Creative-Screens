/* Privacy policy: a placeholder page in the light style, so the footer link has somewhere to go until real text lands. */
import { messages, type Locale } from '@/i18n';
import { Crumbs, Giant, Kicker, LightPage } from './light/parts';
import { Shell } from './Shell';

export function PrivacyPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.privacy;

  return (
    <Shell locale={locale} routeKey="privacy">
      <LightPage locale={locale}>
        <section className="lpage-hero lpage-hero--text" aria-labelledby="pp-title">
          <Crumbs locale={locale} trail={[{ label: p.title }]} />
          <Kicker bold={p.eyebrow} />
          <Giant as="h1" id="pp-title" className="lgiant--page" lines={[p.title]} />
          <p className="lpage-lead" data-rise>{p.lead}</p>
        </section>
      </LightPage>
    </Shell>
  );
}
