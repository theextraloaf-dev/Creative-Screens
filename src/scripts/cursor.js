/* Invert-disc cursor (as on nocturnaldream.com): a white disc with mix-blend-mode: difference that follows the pointer,
   inverting whatever is under it. Fine pointers only; off for reduced motion. The native cursor stays. */
export function initCursor() {
  if (!matchMedia('(pointer: fine)').matches || !document.documentElement.classList.contains('motion')) return;
  const D = 72;
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { position: 'fixed', left: '0', top: '0', width: D + 'px', height: D + 'px', borderRadius: '50%', background: '#fff', mixBlendMode: 'difference', pointerEvents: 'none', zIndex: '250', opacity: '0', willChange: 'transform', transition: 'opacity .25s' });
  document.body.appendChild(el);
  let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, inside = false, down = false, s = 0, sv = 0, last = performance.now();
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!inside) { x = tx; y = ty; } inside = true; }, { passive: true });
  document.addEventListener('pointerleave', () => (inside = false));
  addEventListener('blur', () => (inside = false));
  addEventListener('pointerdown', () => (down = true));
  addEventListener('pointerup', () => (down = false));
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt * 14);
    x += (tx - x) * k; y += (ty - y) * k;
    const target = inside ? (down ? 0.55 : 0.34) : 0;   // small resting disc, shrinks while pressed
    sv += ((target - s) * 260 - sv * 22) * dt; s += sv * dt;
    el.style.opacity = inside ? '1' : '0';
    el.style.transform = `translate(${x - D / 2}px, ${y - D / 2}px) scale(${Math.max(0, s)})`;
  };
  requestAnimationFrame(frame);
}
