/* The light preview's two dialogs (job lightbox, Services menu). Started by the always-on behaviours
   (src/components/Behaviors.tsx), so "See the job" and shared #job- links work with reduced motion too;
   the motion code (index.js) reuses the same instance. */
import { initLightbox } from './lightbox.js';
import { initMenu } from './menu.js';

let made = null;
export function initDialogs() {
  if (made) return made;
  const root = document.querySelector('[data-light]');
  if (!root) return null;
  const jobs = JSON.parse(document.getElementById('l-jobs-data')?.textContent || '[]');
  const box = initLightbox({ jobs });
  initMenu();
  root.classList.add('has-dialogs');
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-see]'); if (b && !root.classList.contains('is-ready')) box.open(b.dataset.see); });
  // a listing card's Quick view (Work page, a service's jobs, More jobs) opens the same lightbox, with or without motion
  root.addEventListener('click', (e) => { const q = e.target.closest('[data-quick]'); if (q) { e.preventDefault(); box.open(q.dataset.quick); } });
  made = { box, jobs };
  return made;
}
