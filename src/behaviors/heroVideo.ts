/* Play the hero film only when motion is welcome; otherwise the poster stays. */
type NetworkInfo = { saveData?: boolean };

export function initHeroVideo(): () => void {
  const v = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  if (!v || !document.documentElement.classList.contains('motion') || conn?.saveData) return () => {};

  v.muted = true;
  const go = () => { v.play().catch(() => { /* autoplay blocked: the poster stays */ }); };
  go();
  // some browsers hold autoplay until the first interaction
  const events = ['pointerdown', 'keydown', 'scroll'] as const;
  const retry = () => { if (v.paused) go(); };
  events.forEach((ev) => window.addEventListener(ev, retry, { once: true, passive: true }));
  return () => events.forEach((ev) => window.removeEventListener(ev, retry));
}
