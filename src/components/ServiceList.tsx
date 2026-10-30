/* What we make: eight plain service cards. Each shows the drawing, a one-line promise, a placeholder price and time;
   a click opens the detail view (what is included, typical jobs) with a "get a quote for this" button.
   Plates are concept illustrations (GPT line art processed by scripts/plates/make_plate.py). */
import { serviceFacts } from '@/data/service-facts';
import { servicePhotos } from '@/data/service-photos';
import { messages, type Locale } from '@/i18n';
import { ServiceCards, type CardItem } from './ServiceCards';
import './ServiceList.css';

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export function ServiceList({ locale }: { locale: Locale }) {
  const sv = messages(locale).services;
  const card = sv.card;

  const items: CardItem[] = sv.items.map((s) => {
    const facts = serviceFacts[s.slug];
    return {
      slug: s.slug,
      name: s.name,
      line: s.line,
      makes: s.makes,
      parts: s.parts ?? [],
      photos: servicePhotos[s.slug] ?? [],
      price: fill(card.from, { n: facts.from }),
      time: fill(card.time, { a: facts.days[0], b: facts.days[1] }),
    };
  });

  return (
    <section className="svc section" id="services" aria-labelledby="svc-title">
      <div className="wrap">
        <header className="svc__head">
          <h2 id="svc-title" data-text-reveal>{sv.title}</h2>
          <p className="svc__lead" data-reveal>{card.lead}</p>
        </header>
        <ServiceCards items={items} copy={card} />
      </div>
    </section>
  );
}
