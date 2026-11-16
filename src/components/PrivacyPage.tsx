/* Privacy policy: a bare placeholder page, so the footer link has somewhere to go until real text lands. */
import { messages, type Locale } from '@/i18n';
import { Shell } from './Shell';
import './AboutPage.css';

export function PrivacyPage({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const p = m.pages.privacy;

  return (
    <Shell locale={locale} routeKey="privacy">
      <section className="section ap">
        <div className="wrap">
          <p className="eyebrow" data-reveal="fade">{p.eyebrow}</p>
          <h1 data-text-reveal>{p.title}</h1>
          <p className="lead ap__notice" data-reveal>{p.lead}</p>
        </div>
      </section>
    </Shell>
  );
}
