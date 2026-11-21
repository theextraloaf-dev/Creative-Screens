// Motion tokens. Keep in step with the CSS variables in src/styles/tokens.css.
// Rule: nothing longer than 0.8 s, nothing hides content, everything has a reduced-motion state.
export const T = {
  reveal: { y: 24, duration: 0.5, ease: 'power3.out', stagger: 0.06 },
  text: { duration: 0.6, ease: 'power3.out', stagger: 0.08 },
  clip: { duration: 0.8, ease: 'power2.inOut' },
  blur: { duration: 0.7, ease: 'power2.out', blur: 12 },
  count: { duration: 1.4, ease: 'power2.out' },
  lenisLerp: 0.1,                // measured on Expedia's Route 66 pages (Lenis 1.3.27): ~0.1 per 60 Hz frame
  start: 'top 88%',
};

// Direction: 1 for LTR, -1 for RTL. Every sideways movement multiplies by this.
export const dir = () => (document.documentElement.dir === 'rtl' ? -1 : 1);
export const isArabic = () => document.documentElement.lang === 'ar';
