/* Mobile menu panel, and a remembered language choice (never a forced redirect). */
type LenisLike = { stop(): void; start(): void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

export function initMenu(): () => void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  const cleanups: (() => void)[] = [];
  const on = <K extends keyof DocumentEventMap>(t: Document, ev: K, fn: (e: DocumentEventMap[K]) => void) => {
    t.addEventListener(ev, fn);
    cleanups.push(() => t.removeEventListener(ev, fn));
  };

  const setOpen = (open: boolean) => {
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
      lenis()?.stop();
    } else {
      panel.classList.remove('is-open');
      setTimeout(() => { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 460);
      lenis()?.start();
    }
  };

  const onToggle = () => setOpen(toggle?.getAttribute('aria-expanded') !== 'true');
  toggle?.addEventListener('click', onToggle);
  cleanups.push(() => toggle?.removeEventListener('click', onToggle));

  panel?.querySelectorAll('[data-menu-link]').forEach((a) => {
    const close = () => setOpen(false);
    a.addEventListener('click', close);
    cleanups.push(() => a.removeEventListener('click', close));
  });
  on(document, 'keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  document.querySelectorAll<HTMLElement>('[data-lang-switch]').forEach((a) => {
    const remember = () => {
      try { localStorage.setItem('cs-lang', a.dataset.langSwitch ?? ''); } catch { /* storage blocked */ }
    };
    a.addEventListener('click', remember);
    cleanups.push(() => a.removeEventListener('click', remember));
  });

  return () => cleanups.forEach((fn) => fn());
}
