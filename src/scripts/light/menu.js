/* The Services menu: the eight services in giant stacked type, full screen on cream. Opens from the menu button in the header pill; Esc, the
   close button or a pick closes it; Tab stays inside while it is open. */
export function initMenu() {
  const menu = document.querySelector('[data-services]');
  const openers = [...document.querySelectorAll('[data-services-open]')];   // the menu button in the header pill
  if (!menu || !openers.length) return { open() {}, close() {} };
  const closeBtn = menu.querySelector('.lmenu__close');
  let lastFocus = null;

  function open() {
    if (!menu.hidden) return;
    lastFocus = document.activeElement;
    menu.hidden = false;
    window.__lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
    openers.forEach((o) => o.setAttribute('aria-expanded', 'true'));
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    closeBtn.focus({ preventScroll: true });
  }
  function close({ restore = true } = {}) {
    if (menu.hidden) return;
    menu.classList.remove('is-open');
    menu.hidden = true;
    document.documentElement.style.overflow = '';
    openers.forEach((o) => o.setAttribute('aria-expanded', 'false'));
    window.__lenis?.start();
    if (restore) lastFocus?.focus?.({ preventScroll: true });
  }

  openers.forEach((o) => o.setAttribute('aria-expanded', 'false'));
  openers.forEach((o) => o.addEventListener('click', open));
  closeBtn.addEventListener('click', () => close());
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close({ restore: false }); }, true);
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...menu.querySelectorAll('a[href], button')];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, true);
  return { open, close };
}
