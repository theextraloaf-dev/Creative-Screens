import { site } from '@/config/site';
import { messages, type Locale } from '@/i18n';
import { QuoteForm } from './QuoteForm';
import './QuoteForm.css';

/* The one place every call to action leads: a sectioned form that hands the request to WhatsApp or email, beside a
   short "what happens next" so the visitor knows what they get. */
export function QuoteSection({ locale }: { locale: Locale }) {
  const m = messages(locale);
  const q = m.quote;
  const services = m.services.items.map((s) => ({ slug: s.slug, name: s.name }));

  return (
    <section className="section quote" id="quote" aria-labelledby="quote-title">
      <div className="wrap quote__grid">
        <div className="quote__copy">
          <p className="eyebrow">{q.eyebrow}</p>
          <h2 id="quote-title" data-text-reveal>{q.title}</h2>
          <p className="quote__lead" data-reveal>{q.lead}</p>
          <div className="quote__next" data-reveal>
            <h3>{q.next.title}</h3>
            <ol>
              {q.next.steps.map((s, i) => <li key={s}><b className="ltr">0{i + 1}</b><span>{s}</span></li>)}
            </ol>
            <p className="quote__promise">{q.next.promise.map((p) => <span key={p}>{p}</span>)}</p>
          </div>
          <p className="quote__alt" data-reveal>
            <a href={`mailto:${site.email}`} className="ltr">{site.email}</a>
            <span className="ltr">{site.phoneDisplay}</span>
          </p>
        </div>
        <QuoteForm copy={q} services={services} whatsapp={site.whatsapp} email={site.email} />
      </div>
    </section>
  );
}
