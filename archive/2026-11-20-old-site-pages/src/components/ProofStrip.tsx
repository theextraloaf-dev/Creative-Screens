/* Four short promises right under the hero, so the visitor knows who we are and how to ask before any scrolling story. */
import { messages, type Locale } from '@/i18n';
import './ProofStrip.css';

export function ProofStrip({ locale }: { locale: Locale }) {
  const items = messages(locale).proof.items;

  return (
    <section className="proof" aria-label={locale === 'ar' ? 'لماذا نحن' : 'Why us'}>
      <ul className="wrap proof__list">
        {items.map((t) => <li key={t} data-reveal>{t}</li>)}
      </ul>
    </section>
  );
}
