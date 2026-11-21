/* One stop's story: hero photo, title, client and place, the job in a few lines, a gallery, the quote button and
   prev/next in visit order. Rendered twice from the same markup:
   - mode "overlay": hidden inside the journey; src/scripts/diorama/sheet.js opens it over the scene (own URL, Back closes);
   - mode "page": the light standalone page a shared link opens (/preview/<slug>/), no 3D; close returns to the journey
     at this stop (/preview/#stop-<n>). */
import { hrefFor, messages, type Locale } from '@/i18n';
import { stories, storyUrl, type Story } from '@/data/diorama-stories';

export function DioramaStory({ story, locale, mode }: { story: Story; locale: Locale; mode: 'overlay' | 'page' }) {
  const m = messages(locale);
  const D = m.diorama;
  const c = story[locale];
  const order = [...stories].sort((a, b) => a.n - b.n);
  if (locale === 'ar') order.reverse();                      // Arabic meets the stops in reverse (visit order)
  const i = order.findIndex((s) => s.n === story.n);
  const prev = order[i - 1], next = order[i + 1];
  const pad = (n: number) => String(n).padStart(2, '0');
  const journey = `${hrefFor('preview', locale)}#stop-${story.n}`;
  const Tag = mode === 'overlay' ? 'section' : 'article';

  return (
    <Tag
      className={`dsheet dsheet--${mode}`}
      data-sheet={mode === 'overlay' ? story.n : undefined}
      hidden={mode === 'overlay' ? true : undefined}
      role={mode === 'overlay' ? 'dialog' : undefined}
      aria-modal={mode === 'overlay' ? true : undefined}
      aria-labelledby={`dsheet-${mode}-${story.n}`}
    >
      <nav className="dsheet__bar">
        {prev ? <a className="dsheet__go" href={storyUrl(prev.n, locale)} data-sheet-go={prev.n}><span className="arrow" aria-hidden="true">←</span> {D.ui.prevStop}</a> : <span />}
        {mode === 'overlay'
          ? <button type="button" className="dsheet__close">{D.ui.close} <span aria-hidden="true">×</span></button>
          : <a className="dsheet__close" href={journey}>{D.ui.close} <span aria-hidden="true">×</span></a>}
        {next ? <a className="dsheet__go" href={storyUrl(next.n, locale)} data-sheet-go={next.n}>{D.ui.nextStop} <span className="arrow" aria-hidden="true">→</span></a> : <span />}
      </nav>
      <div className="dsheet__scroll">
        <header className="dsheet__head">
          <p className="dsheet__badge"><b className="ltr">{pad(story.n)}</b>{story.placeholder && <span className="dsample">{D.ui.sample}</span>}</p>
          <h2 id={`dsheet-${mode}-${story.n}`} className="dsheet__title">{c.title}</h2>
          <p className="dsheet__meta">{c.client} · {c.place}</p>
        </header>
        <figure className="dsheet__hero" data-sheet-hero>
          <img src={story.photos[0]} alt={c.title} width={1280} height={800} loading={mode === 'page' ? 'eager' : 'lazy'} />
        </figure>
        <div className="dsheet__text">
          <p className="dsheet__line">{c.line}</p>
          <p>{c.body}</p>
        </div>
        <ul className="dsheet__gallery">
          {story.photos.slice(1).map((src) => (
            <li key={src}><img src={src} alt="" width={1280} height={800} loading="lazy" /></li>
          ))}
        </ul>
        <p className="dsheet__cta">
          <a className="btn" href={`${hrefFor('home', locale)}#quote`}>{m.cta.quote} <span className="arrow" aria-hidden="true">→</span></a>
          <a className="dsheet__service" href={hrefFor('services', locale)}>{m.services.viewAll}</a>
        </p>
      </div>
    </Tag>
  );
}
