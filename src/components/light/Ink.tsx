/* No imports on purpose: client components (JobCard in the Work grid) use it without pulling in the dictionaries. */

/** Biegajaca's hover on a work, in our colours: two broad strokes, ochre then paper, pulled across the picture like
    ink across a screen. Drawn by CSS (stroke-dashoffset) when the card is hovered or focused. */
export function Ink() {
  return (
    <svg className="link" viewBox="0 0 1000 1250" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="link__a" pathLength={1} d="M-140 210 C 260 40 640 380 1140 170 C 760 440 300 330 -140 650 C 300 690 700 560 1140 860" />
      <path className="link__b" pathLength={1} d="M1140 420 C 720 300 320 560 -140 480 C 240 790 780 690 1140 1010 C 780 1160 320 1060 -140 1290" />
    </svg>
  );
}
