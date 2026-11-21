/* "See the job": a light lightbox with the job's photos and copy. It has its own #job-<slug> hash, so a shared link
   opens it and Back closes it; Esc, the close button and a click on the backdrop close it too.
   Every way of closing ends in the dialog's own `close` event, which is the one place that restarts the page scroll,
   restores focus and settles the hash (Chrome may close the dialog natively on Esc, without a cancelable event). */
import { jobFromHash, jobHash } from '../../lib/jobs-gallery.ts';

export function initLightbox({ jobs }) {
  const dlg = document.querySelector('[data-lightbox]');
  if (!dlg) return { open() {}, close() {} };
  const strip = dlg.querySelector('[data-strip]');
  const title = dlg.querySelector('[data-box-title]');
  const meta = dlg.querySelector('[data-box-meta]');
  const line = dlg.querySelector('[data-box-line]');
  const sample = dlg.querySelector('[data-box-sample]');
  const link = dlg.querySelector('[data-box-link]');                  // the job's own page
  let lastFocus = null;
  const onJob = () => !!jobFromHash(location.hash);

  function open(slug, push = true) {
    const j = jobs.find((x) => x.slug === slug);
    if (!j) return;
    strip.replaceChildren(...j.photos.map((src) => Object.assign(document.createElement('img'), { src, alt: '', loading: 'lazy', className: `is-${j.look}` })));
    title.textContent = j.title;
    meta.textContent = [j.client, j.place, j.service, j.year].join(' · ');
    line.textContent = j.line;
    sample.hidden = !j.sample;
    if (link && j.href) link.href = j.href;
    if (!dlg.open) { lastFocus = document.activeElement; dlg.showModal(); window.__lenis?.stop(); }
    if (push && location.hash !== jobHash(slug)) history.pushState({ job: slug }, '', jobHash(slug));
  }
  // ask to close: walk back through history when the lightbox added an entry (so Back and the button agree)
  function requestClose() {
    if (onJob() && history.state?.job) history.back();
    else if (dlg.open) dlg.close();
  }
  dlg.addEventListener('close', () => {
    window.__lenis?.start();
    lastFocus?.focus?.({ preventScroll: true });
    if (onJob()) {
      if (history.state?.job) history.back();
      else history.replaceState(null, '', location.pathname + location.search);
    }
  });

  dlg.querySelector('[data-close]').addEventListener('click', requestClose);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) requestClose(); });
  window.addEventListener('popstate', () => {
    const j = jobFromHash(location.hash);
    if (j) open(j.slug, false);
    else if (dlg.open) dlg.close();
  });

  // a shared link straight to a job
  const first = jobFromHash(location.hash);
  if (first) open(first.slug, false);
  return { open, close: requestClose };
}
