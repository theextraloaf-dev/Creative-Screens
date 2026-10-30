/* The loader: counts to 21 and stops, then lifts away. Tap or press Escape to skip.
   Runs only when the head script set html.loader-on (motion allowed, first visit this session). */
let started = false;

export function initLoader(): void {
  const d = document.documentElement;
  if (started || !d.classList.contains('loader-on')) return;
  const el = document.querySelector<HTMLElement>('[data-loader]');
  const num = el?.querySelector<HTMLElement>('[data-loader-num]');
  const bar = el?.querySelector<HTMLElement>('[data-loader-bar]');
  if (!el || !num || !bar) return;
  started = true;

  const DURATION = 1500;
  const t0 = performance.now();
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    el.classList.add('is-out');
    setTimeout(() => {
      d.classList.remove('loader-on');
      try { sessionStorage.setItem('cs-loader', '1'); } catch { /* storage blocked: the loader shows again next visit */ }
      window.dispatchEvent(new Event('cs:loader-done'));
    }, 800);
  };

  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / DURATION);
    const e = 1 - Math.pow(1 - t, 3);
    num.textContent = String(Math.round(e * 21));
    bar.style.transform = `scaleX(${e})`;
    if (t < 1) requestAnimationFrame(step);
    else { el.classList.add('is-full'); setTimeout(finish, 700); }
  };

  num.textContent = '0';
  requestAnimationFrame(step);
  el.addEventListener('click', finish);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(); });
  setTimeout(finish, 4500);
}
