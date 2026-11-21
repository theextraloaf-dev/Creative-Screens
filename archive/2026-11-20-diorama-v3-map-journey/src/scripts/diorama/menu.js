/* The Services menu: a full-screen list of the eight services in giant type over a dimmed still of the film.
   Opens from the pill in the pinned scene; Esc, the close button or a pick closes it. A pick with data-story opens
   that job's sheet (sheet.js listens on the document), the others go to the services page. */
export function initMenu({ lenis }) {
  const menu = document.querySelector('[data-services]');
  const opener = document.querySelector('[data-services-open]');
  if (!menu || !opener) return { open() {}, close() {} };
  const closeBtn = menu.querySelector('.dmenu__close');
  let lastFocus = null;

  const focusables = () => [...menu.querySelectorAll('a[href], button')];
  function open() {
    if (!menu.hidden) return;
    lastFocus = document.activeElement;
    menu.hidden = false;
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
    opener.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    closeBtn.focus({ preventScroll: true });
  }
  function close({ restore = true } = {}) {
    if (menu.hidden) return;
    menu.classList.remove('is-open');
    menu.hidden = true;
    document.documentElement.style.overflow = '';
    opener.setAttribute('aria-expanded', 'false');
    lenis?.start();
    if (restore) lastFocus?.focus?.({ preventScroll: true });
  }

  opener.setAttribute('aria-expanded', 'false');
  opener.addEventListener('click', open);
  closeBtn.addEventListener('click', () => close());
  // a pick closes the menu first; a story link then opens its sheet (which takes focus itself)
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close({ restore: false }); }, true);
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, true);
  return { open, close };
}
