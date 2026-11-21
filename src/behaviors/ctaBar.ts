/* Phone bottom bar: slides in once the hero has scrolled past, and steps aside while the quote form is on screen. */
export function initCtaBar(): () => void {
  const bar = document.querySelector<HTMLElement>('[data-cta-bar]');
  if (!bar) return () => {};
  const quote = document.getElementById('quote');
  const update = () => {
    const pastHero = window.scrollY > window.innerHeight * 0.6;
    const atQuote = quote ? quote.getBoundingClientRect().top < window.innerHeight * 0.85 : false;
    bar.classList.toggle('is-on', pastHero && !atQuote);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
  return () => window.removeEventListener('scroll', update);
}
