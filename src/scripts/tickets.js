/* How a job runs: a docket printer at the bottom of the screen feeds out the four job tickets over the 3D print works.
   Each ticket's share of the scroll: rises out of the slot header first (0-0.42, the print head glows), gets stamped
   (from 0.5), then tears off with a tug and flies onto the done pile (0.72-1). The last ticket stays out, stamped. */
const clamp = (v) => Math.min(Math.max(v, 0), 1);
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a, b, t) => a + (b - a) * t;

export function initTickets(gsap, ScrollTrigger) {
  const story = document.querySelector('[data-story]');
  const cards = story ? [...story.querySelectorAll('.chapter')] : [];
  if (!cards.length) return;
  const track = story.querySelector('.story__track');
  const printer = story.querySelector('.story__printer');
  const countN = story.querySelector('[data-tk-n]');
  const countDone = story.querySelector('[data-tk-done]');
  const pileLabel = story.querySelector('.story__pile');
  const rtl = document.documentElement.dir === 'rtl';
  const n = cards.length;
  const pileRot = [-7, 5, -3];
  const pileNudge = [[0, 0], [14, -8], [-10, -16]];

  let M = {};
  const measure = () => {
    const W = cards[0].offsetWidth;
    const H = Math.max(...cards.map((c) => c.offsetHeight));
    const FW = track.clientWidth;
    const FH = track.clientHeight;
    const phone = FW < 760;
    const ps = phone ? 0.3 : 0.44; // pile scale
    const side = rtl ? -1 : 1;
    // tickets stand on the slot (transform origin at their bottom edge); the pile sits on the trailing side,
    // a little above the printer (on phones, top of the leading side)
    const px = phone ? -side * (FW / 2 - (W * ps) / 2 - 14) : side * Math.min(FW / 2 - (W * ps) / 2 - 40, W * 0.95);
    const py = phone ? -(FH - H * ps - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64) - 24) : -FH * 0.18;
    M = { W, H, ps, px, py };
    pileLabel.style.transform = `translateX(-50%) translate(${px.toFixed(1)}px, ${(py + 22).toFixed(1)}px)`;
  };

  let lastP = 0;
  const update = (p = lastP) => {
    lastP = p;
    const raw = clamp(p) * (n - 0.28);
    let printing = false;
    let done = 0;
    cards.forEach((el, i) => {
      const u = clamp(raw - i);
      const feed = easeOut(clamp(u / 0.42));
      const fly = i < n - 1 ? easeInOut(clamp((u - 0.72) / 0.28)) : 0;
      if (u > 0 && u < 0.42) printing = true;
      if (fly >= 1) done++;
      const jerk = Math.sin(clamp((u - 0.72) / 0.12) * Math.PI) * -3.5; // the tug as it tears off
      const [nx, ny] = pileNudge[i % pileNudge.length];
      const x = lerp(0, M.px + nx, fly);
      const y = lerp(M.H + 8, 0, feed) + lerp(0, M.py + ny, fly);
      const rot = lerp(0, pileRot[i % pileRot.length], fly) + (fly < 1 ? jerk : 0);
      const sc = lerp(1, M.ps, fly);
      el.style.visibility = u > 0 ? 'visible' : 'hidden';
      el.style.transform = `translateX(-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      el.style.zIndex = String(10 + i);
      el.classList.toggle('is-stamped', u > 0.5);
    });
    printer.classList.toggle('is-printing', printing);
    countN.textContent = String(Math.min(n, Math.floor(raw) + 1)).padStart(2, '0');
    countDone.textContent = String(done);
  };

  const st = ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', onUpdate: (self) => update(self.progress) });
  window.addEventListener('resize', () => { measure(); update(); }, { passive: true });
  measure();
  update(st.progress);
}
