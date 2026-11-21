/* Vehicle branding story, drawn as a blueprint. One camera, one job: an enquiry arrives, the double-cab pickup
   drives in and is measured, a proof is approved, the Creative Screens logo is printed and cut on a print-and-cut
   machine, every panel is wrapped, the work is checked and handed over, and the film ends on a multi-view sheet.
   Concept illustration, never client work. The truck is never mirrored; in Arabic the bench sits on the right. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CSSProperties } from 'react';
import { messages, type Locale } from '@/i18n';
import './Stage.css';

const logo = (name: string) => readFileSync(join(process.cwd(), 'public/img', name), 'utf8');
const creativeSvg = logo('logo-creative.svg');
const screensSvg = logo('logo-screens.svg');

interface Props { locale: Locale; id?: string }

export function Stage({ locale, id = 'process' }: Props) {

  const m = messages(locale);
  const rtl = locale === 'ar';
  const pathOf = (svg: string) => svg.match(/ d="([^"]+)"/)?.[1] ?? '';

  // Layout numbers (SVG user units, viewBox 0 0 1200 560). Bench and truck each draw in their own local space.
  // Truck scale: 600 units = 5,330 mm (a double-cab pickup); ground at y 470, roof at y 266.
  const truckX = rtl ? 20 : 580;
  const benchX = rtl ? 640 : 0;
  const rr = (x: number, y: number, w: number, h: number, r: number) =>
    `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  const sheet = { x: 80, y: 170, w: 400, h: 230 };
  const dc = { x: 110, y: 220, w: 340, h: 135, cx: 280, cy: 287.5 }; // decal contour (bench space)
  const contour = rr(dc.x, dc.y, dc.w, dc.h, 20);
  const logoS = 0.616;
  const creativeT = `translate(${dc.cx - (487 * logoS) / 2} 240) scale(${logoS})`;
  const screensT = `translate(${dc.cx - (468 * logoS) / 2} ${240 + 66 * logoS + 14}) scale(${logoS})`;
  const door = { cx: 398, cy: 386 }; // front door panel centre (truck space)
  const decalScale = 0.34;
  const dx = truckX + door.cx - (benchX + dc.cx);
  const dy = door.cy - dc.cy;
  const sqA = door.cx - 64;
  const sqB = door.cx + 64;
  const bubbles = [[350, 372], [380, 400], [414, 374], [444, 398]];
  const regs = rtl ? [[465, 185], [95, 185], [465, 385]] : [[95, 185], [465, 185], [95, 385]];
  const ticks = Array.from({ length: 21 }, (_, i) => sheet.x + i * 20);
  const spokes = (cx: number, cy: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (k * Math.PI) / 3 - Math.PI / 2;
      const p = (r: number, off: number) => `${(cx + r * Math.cos(a + off)).toFixed(1)} ${(cy + r * Math.sin(a + off)).toFixed(1)}`;
      return `M${p(9, -0.28)} L${p(25, -0.1)} M${p(9, 0.28)} L${p(25, 0.1)}`;
    }).join(' ');
  const dim = (x1: number, x2: number, y: number) => `M${x1} ${y} H${x2} M${x1} ${y - 7} V${y + 7} M${x2} ${y - 7} V${y + 7}`;
  const vdim = (x: number, y1: number, y2: number) => `M${x} ${y1} V${y2} M${x - 7} ${y1} H${x + 7} M${x - 7} ${y2} H${x + 7}`;

  // Double-cab pickup, side elevation (front to the right)
  const body = 'M0 436 V352 H232 V284 Q234 270 248 268 L404 266 Q418 266 428 278 L470 330 L574 340 Q596 344 600 364 V436 H530 A52 52 0 0 0 426 436 H172 A52 52 0 0 0 68 436 Z';
  // wrap panels (truck space x ranges) in the order they are applied
  const panels: [number, number][] = [[-10, 236], [236, 330], [330, 466], [466, 612]];
  const stripe = '0,404 0,384 610,322 610,342';
  // multi-view sheet positions (world space, relative to the side view)
  const frontX = truckX + 770;
  const rearX = truckX - 170;
  const topY = 530;
  const mono = 'DM Mono, ui-monospace, monospace';

  // Pointer labels: [timeline in, out, anchor selector, anchor point], one per entry in m.sequence.notes
  const noteAt: [number, number, string, string][] = [
    [0, 6, '.phone', 'top'], [6, 12, '.truck-body', 'top'], [12, 17, '.vdims', 'top'], [17, 23, '.proof', 'top'],
    [23, 28, '.stamp', 'top'], [28, 32, '.trace', 'top'], [32, 35, '.rail', 'top'], [35, 38, '.chips', 'top'],
    [38, 44, '.carriage', 'top'], [44, 47, '.reg', 'top'], [47, 54, '.knife', 'top'], [54, 57, '.waste', 'top'],
    [57, 61, '.tape', 'top'], [64, 72, '.livery', 'top'], [72, 76, '.decal', 'top'], [76, 80, '.squeegee', 'top'],
    [80, 87, '.qc', 'top'], [87, 92, '.key', 'top'], [93, 101, '.views-top', 'top'],
  ];
  const ink = '#131d27';
  const lime = '#bbd440';
  const cutRed = '#e8432a';
  const glass = '#eef1f4';
  return (
    <section className="stage" data-stage id={id} aria-labelledby={`${id}-title`}>
      <div className="stage__pin">
        <div className="wrap stage__inner">
          <div className="stage__top">
            <p className="eyebrow">{m.sequence.concept}</p>
            <a className="stage__skip" href="#quote">{m.cta.skip}</a>
          </div>
          <h2 id={`${id}-title`} data-text-reveal>{m.sequence.title}</h2>
    
          <div className="stage__art">
            <svg
              viewBox="0 0 1200 560"
              role="img"
              aria-label={m.sequence.static}
              data-dx={dx}
              data-dy={dy}
              data-sq-start={rtl ? sqB : sqA}
              data-sq-end={rtl ? sqA : sqB}
              data-bench-x={benchX}
              data-truck-x={truckX}
              style={{ "--static-shift": `${600 - (truckX + 300)}px` } as CSSProperties}
              data-rtl={rtl ? '1' : '0'}>
              <defs>
                <pattern id={`${id}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0 H0 V40" fill="none" stroke={ink} strokeOpacity="0.07" strokeWidth="1"></path>
                </pattern>
                {/* the printed decal: navy ground, lime logo */}
                <g id={`${id}-art`}>
                  <path d={contour} fill={ink}></path>
                  <path d={pathOf(creativeSvg)} transform={creativeT} fill={lime} fillRule="evenodd"></path>
                  <path d={pathOf(screensSvg)} transform={screensT} fill={lime} fillRule="evenodd"></path>
                </g>
                <clipPath id={`${id}-ink`}><rect className="ink-rect" x={dc.x - 4} y={dc.y - 6} width="0" height={dc.h + 12}></rect></clipPath>
                <clipPath id={`${id}-body`}><path d={body}></path></clipPath>
                {panels.map(([a, b], i) => (
                  <clipPath key={i} id={`${id}-p${i}`}><rect className="panel-clip" data-a={a} data-b={b} x={a} y="250" width={b - a} height="200"></rect></clipPath>
                ))}
                <g id={`${id}-wheel`}>
                  <circle r="42" fill="#fff"></circle>
                  <circle r="36" fill="none" strokeWidth="1" strokeDasharray="3 4"></circle>
                  <circle r="27" fill="none" strokeWidth="1.5"></circle>
                  <circle r="6" fill="#fff" strokeWidth="1.5"></circle>
                </g>
              </defs>
    
              <g className="world">
                <rect x="-1200" y="-600" width="3600" height="1800" fill={`url(#${id}-grid)`}></rect>
    
                {/* ===== Double-cab pickup, side elevation (never mirrored) ===== */}
                <g className="truck" transform={`translate(${truckX} 0)`}>
                  <path d="M-60 470 H660" fill="none" stroke={ink} strokeWidth="1.5"></path>
                  <g className="truck-drive" fill="#fff" stroke={ink} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M120 372 V490 M478 372 V490" fill="none" strokeWidth="1" strokeDasharray="10 4 2 4" strokeOpacity="0.45"></path>
                    <path className="truck-body" d={body}></path>
                    {/* livery: four wrap panels clipped to the body, applied one by one */}
                    <g className="livery" clipPath={`url(#${id}-body)`} stroke="none">
                      {panels.map(([a, b], i) => (
                        <g key={i} clipPath={`url(#${id}-p${i})`}>
                          <rect x={a} y="392" width={b - a} height="50" fill={ink}></rect>
                          <polygon points={stripe} fill={lime}></polygon>
                        </g>
                      ))}
                    </g>
                    <path d="M246 280 H326 V330 H246 Z" fill={glass} strokeWidth="1.5"></path>
                    <path d="M334 280 H404 Q412 280 418 288 L452 330 H334 Z" fill={glass} strokeWidth="1.5"></path>
                    <path d="M240 272 V432 M330 272 V432 M466 334 V432 M240 334 H466 M8 360 H228 M12 354 V432 M8 392 H596" fill="none" strokeWidth="1.5"></path>
                    <path d="M214 352 L222 296 H234" fill="none" strokeWidth="2"></path>
                    <path d="M412 266 L400 238" fill="none" strokeWidth="1.2"></path>
                    <rect x="296" y="344" width="20" height="5" rx="2.5" strokeWidth="1.5"></rect>
                    <rect x="410" y="344" width="20" height="5" rx="2.5" strokeWidth="1.5"></rect>
                    <path d="M448 312 H466 V326 H448 Z" strokeWidth="1.5"></path>
                    <path d="M572 344 L598 356 V372 L570 362 Z" fill={glass} strokeWidth="1.5"></path>
                    <circle cx="590" cy="414" r="5" strokeWidth="1.2"></circle>
                    <circle cx="196" cy="378" r="7" strokeWidth="1.2"></circle>
                    <rect x="0" y="360" width="8" height="26" strokeWidth="1.5"></rect>
                    <rect x="-6" y="412" width="18" height="22" rx="3" strokeWidth="1.5"></rect>
                    <rect x="596" y="398" width="10" height="34" rx="3" strokeWidth="1.5"></rect>
                    <rect x="240" y="440" width="226" height="7" rx="3" strokeWidth="1.5"></rect>
                    <path d="M62 436 A58 58 0 0 1 178 436 M420 436 A58 58 0 0 1 536 436" fill="none" strokeWidth="2.5"></path>
                    {[120, 478].map((cx) => (
                      <g key={cx} className={cx === 478 ? 'wheel wheel-front' : 'wheel wheel-rear'}>
                        <use href={`#${id}-wheel`} x={cx} y="428" stroke={ink} strokeWidth="2"></use>
                        <path className="spoke" data-wx={cx} d={spokes(cx, 428)} fill="none" strokeWidth="1.3"></path>
                      </g>
                    ))}
                  </g>
    
                  {/* brief: overall dimensions */}
                  <g className="vdims anim-only" opacity="0" fill="none" stroke={ink} strokeWidth="1.2">
                    <path d={dim(0, 600, 500)}></path>
                    <text x="300" y="524" textAnchor="middle" stroke="none" fill={ink} fontSize="16" fontFamily={mono}>5,330 mm</text>
                    <path d={vdim(-24, 266, 470)}></path>
                    <text x="0" y="0" transform="translate(-36 368) rotate(-90)" textAnchor="middle" stroke="none" fill={ink} fontSize="16" fontFamily={mono}>1,815 mm</text>
                  </g>
                  {/* design: proof outlines and approval stamp */}
                  <g className="proof anim-only" opacity="0" clipPath={`url(#${id}-body)`} fill="none" stroke={lime} strokeWidth="2.5" strokeDasharray="7 5">
                    <polygon points={stripe}></polygon>
                    <path d="M2 392 H598"></path>
                    <rect x={door.cx - 60} y={door.cy - 24} width="120" height="48" rx="6"></rect>
                  </g>
                  <g className="stamp anim-only" opacity="0" transform="translate(540 270) rotate(-12)" fill="none" stroke={ink} strokeWidth="2.5">
                    <circle r="30"></circle><circle r="24" strokeWidth="1.2"></circle>
                    <path d="M-11 0 L-3 9 L13 -9" stroke={lime} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
    
                  {/* apply: target zone, bubbles, squeegee */}
                  <rect className="doorzone anim-only" x={door.cx - 64} y={door.cy - 28} width="128" height="56" rx="6" fill="none" stroke={ink} strokeWidth="1.5" strokeDasharray="6 5" opacity="0"></rect>
                  <use className="static-only" href={`#${id}-art`} transform={`translate(${door.cx} ${door.cy}) scale(${decalScale}) translate(${-dc.cx} ${-dc.cy})`}></use>
                  <g className="anim-only" fill="#fff" fillOpacity="0.7" stroke={ink} strokeWidth="1.2">
                    {bubbles.map(([cx, cy]) => <circle key={cx} className="bubble" cx={cx} cy={cy} r="5" opacity="0"></circle>)}
                  </g>
                  <g className="anim-only squeegee" opacity="0" stroke="none">
                    <rect x={(rtl ? sqB : sqA) - 5} y={door.cy - 40} width="10" height="80" rx="4" fill={ink}></rect>
                    <rect x={(rtl ? sqB : sqA) - 5} y={door.cy - 40} width="10" height="11" rx="4" fill={lime}></rect>
                  </g>
    
                  {/* deliver: quality check badges and the keys */}
                  <g className="qc anim-only" stroke={ink} strokeWidth="1.5">
                    {[[150, 330], [398, 300], [560, 318]].map(([x, y]) => (
                      <g key={x} className="qc-badge" opacity="0" transform={`translate(${x} ${y})`}>
                        <circle r="13" fill={lime}></circle>
                        <path d="M-6 0 L-2 5 L7 -5" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      </g>
                    ))}
                  </g>
                  <g className="key anim-only" opacity="0" transform="translate(330 226)" fill="none" stroke={ink} strokeWidth="2">
                    <circle cx="-14" cy="0" r="10" fill="#fff"></circle><circle cx="-14" cy="0" r="3"></circle>
                    <path d="M-4 0 H26 M18 0 V8 M24 0 V6" strokeLinecap="round"></path>
                  </g>
                </g>
    
                {/* ===== Multi-view sheet: front, rear and top views with the same livery (end of the film) ===== */}
                <g className="views anim-only" opacity="0" fill="#fff" stroke={ink} strokeWidth="1.8" strokeLinejoin="round">
                  <g className="views-front" transform={`translate(${frontX} 0)`}>
                    <rect x="-100" y="420" width="28" height="50" rx="5" fill={ink}></rect><rect x="72" y="420" width="28" height="50" rx="5" fill={ink}></rect>
                    <path d="M-104 444 V372 Q-104 352 -92 346 L-78 300 Q-74 270 -50 268 H50 Q74 270 78 300 L92 346 Q104 352 104 372 V444 Z"></path>
                    <path d="M-66 300 Q-62 282 -46 280 H46 Q62 282 66 300 L74 340 H-74 Z" fill={glass} strokeWidth="1.5"></path>
                    <rect x="-122" y="316" width="18" height="16" rx="3"></rect><rect x="104" y="316" width="18" height="16" rx="3"></rect>
                    <rect x="-96" y="352" width="36" height="16" rx="4" fill={glass}></rect><rect x="60" y="352" width="36" height="16" rx="4" fill={glass}></rect>
                    <rect x="-52" y="352" width="104" height="34" rx="4"></rect><path d="M-46 363 H46 M-46 375 H46" strokeWidth="1.2"></path>
                    <rect x="-104" y="396" width="208" height="28" rx="6" fill={ink}></rect>
                    <rect x="-104" y="424" width="208" height="5" fill={lime} stroke="none"></rect>
                    <rect x="-24" y="402" width="48" height="13" rx="2" strokeWidth="1.2"></rect>
                    <path d="M-140 470 H140" fill="none" strokeWidth="1.5"></path>
                  </g>
                  <g className="views-rear" transform={`translate(${rearX} 0)`}>
                    <rect x="-100" y="420" width="28" height="50" rx="5" fill={ink}></rect><rect x="72" y="420" width="28" height="50" rx="5" fill={ink}></rect>
                    <path d="M-104 444 V352 H-74 L-70 272 Q-68 266 -60 266 H60 Q68 266 70 272 L74 352 H104 V444 Z"></path>
                    <path d="M-62 280 H62 V322 H-62 Z" fill={glass} strokeWidth="1.5"></path>
                    <path d="M-80 352 L-74 296 H74 L80 352" fill="none" strokeWidth="2"></path>
                    <rect x="-96" y="356" width="192" height="62" rx="4" fill={ink}></rect>
                    <use href={`#${id}-art`} transform={`translate(0 387) scale(0.5) translate(${-dc.cx} ${-dc.cy})`} stroke="none"></use>
                    <rect x="-104" y="358" width="12" height="30" fill={glass}></rect><rect x="92" y="358" width="12" height="30" fill={glass}></rect>
                    <rect x="-104" y="422" width="208" height="20" rx="4"></rect>
                    <path d="M-140 470 H140" fill="none" strokeWidth="1.5"></path>
                  </g>
                  <g className="views-top" transform={`translate(${truckX} ${topY})`}>
                    <path d="M0 14 Q0 0 14 0 H560 Q600 2 604 40 V170 Q600 208 560 210 H14 Q0 210 0 196 Z"></path>
                    <rect x="10" y="18" width="220" height="174" rx="4" fill="#f7f8fa" strokeWidth="1.5"></rect>
                    <path d={Array.from({ length: 7 }, (_, i) => `M${30 + i * 28} 34 V176`).join(' ')} fill="none" strokeWidth="1" strokeOpacity="0.5"></path>
                    <rect x="240" y="18" width="186" height="174" rx="10" fill={ink}></rect>
                    <use href={`#${id}-art`} transform={`translate(333 105) scale(0.5) translate(${-dc.cx} ${-dc.cy})`} stroke="none"></use>
                    <path d="M426 22 L470 40 V170 L426 188 Z" fill={glass} strokeWidth="1.5"></path>
                    <path d="M470 40 H560 Q590 44 594 70 V140 Q590 166 560 170 H470 Z"></path>
                    <polygon points="470,96 594,90 594,120 470,114" fill={lime} stroke="none"></polygon>
                    <rect x="452" y="-12" width="18" height="12" rx="3"></rect><rect x="452" y="210" width="18" height="12" rx="3"></rect>
                  </g>
                  <g fill="none" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5">
                    <path d={`M${truckX - 20} 266 H${frontX + 140} M${truckX - 20} 470 H${frontX + 140}`}></path>
                  </g>
                </g>
    
                {/* ===== Bench: phone (brief), then the vinyl sheet on the print-and-cut machine ===== */}
                <g className="anim-only bench" transform={`translate(${benchX} 0)`}>
                  <g className="phone" opacity="0" stroke={ink} strokeWidth="2">
                    <rect x="220" y="170" width="120" height="236" rx="16" fill="#fff"></rect>
                    <rect x="230" y="190" width="100" height="196" rx="4" fill="#f7f8fa" strokeWidth="1"></rect>
                    <rect x="264" y="178" width="32" height="5" rx="2.5" fill={ink} stroke="none"></rect>
                    <g className="msg" opacity="0"><rect x="236" y="200" width="70" height="22" rx="7" fill="#fff" strokeWidth="1.2"></rect><path d="M244 211 H294" strokeWidth="2" strokeOpacity="0.4"></path></g>
                    <g className="msg" opacity="0"><rect x="236" y="230" width="80" height="54" rx="7" fill="#fff" strokeWidth="1.2"></rect>
                      <path d="M244 270 V256 H266 V246 H286 L296 256 H306 V270 Z" fill="none" strokeWidth="1.2"></path><circle cx="256" cy="272" r="5" fill="#fff" strokeWidth="1.2"></circle><circle cx="294" cy="272" r="5" fill="#fff" strokeWidth="1.2"></circle></g>
                    <g className="msg" opacity="0"><rect x="236" y="292" width="76" height="22" rx="7" fill="#fff" strokeWidth="1.2"></rect><path d="M244 303 H300" strokeWidth="2" strokeOpacity="0.4"></path></g>
                    <g className="msg" opacity="0"><rect x="262" y="324" width="62" height="22" rx="7" fill={lime} strokeWidth="1.2"></rect><path d="M270 335 H314" strokeWidth="2" strokeOpacity="0.5"></path></g>
                  </g>
    
                  <g className="sheet" opacity="0">
                    <rect x={sheet.x} y={sheet.y} width={sheet.w} height={sheet.h} fill="#fff" stroke={ink} strokeWidth="1.5"></rect>
                    <path d={ticks.map((x, i) => `M${x} ${sheet.y - (i % 5 === 0 ? 12 : 6)} V${sheet.y}`).join(' ')} stroke={ink} strokeWidth="1" fill="none"></path>
                  </g>
                  <path className="waste" opacity="0" fillRule="evenodd" fill="#f4f6f8" stroke="none" d={`M${sheet.x} ${sheet.y} H${sheet.x + sheet.w} V${sheet.y + sheet.h} H${sheet.x} Z ${contour}`}></path>
    
                  <g className="regs" fill="none" stroke={ink} strokeWidth="1.5">
                    {regs.map(([x, y]) => (
                      <g key={`${x}-${y}`} className="reg" opacity="0"><circle cx={x} cy={y} r="6"></circle><path d={`M${x - 10} ${y} H${x + 10} M${x} ${y - 10} V${y + 10}`}></path></g>
                    ))}
                  </g>
    
                  {/* the decal: traced outline, printed ink, cut line, transfer tape */}
                  <g className="decal">
                    <g className="trace" fill="none" stroke={ink} opacity="0">
                      <path d={contour} strokeWidth="1.2" strokeDasharray="6 5" strokeOpacity="0.6"></path>
                      <path className="trace-line" d={pathOf(creativeSvg)} transform={creativeT} pathLength="1" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeDasharray="1" strokeDashoffset="1"></path>
                      <path className="trace-line" d={pathOf(screensSvg)} transform={screensT} pathLength="1" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeDasharray="1" strokeDashoffset="1"></path>
                    </g>
                    <use href={`#${id}-art`} clipPath={`url(#${id}-ink)`}></use>
                    <path className="cutline" d={contour} pathLength="1" fill="none" stroke={cutRed} strokeWidth="2.5" strokeDasharray="1" strokeDashoffset="1"></path>
                    <rect className="tape" x={dc.x - 8} y={dc.y - 8} width={dc.w + 16} height={dc.h + 16} rx="4" fill={ink} fillOpacity="0.08" stroke={ink} strokeWidth="1.2" strokeDasharray="4 4" opacity="0"></rect>
                  </g>
    
                  <g className="chips" fill="none" stroke={ink} strokeWidth="1.5">
                    {[[ink, 230], [lime, 280], ['#ffffff', 330]].map(([c, x]) => (
                      <g key={x} className="chip" opacity="0">
                        <rect x={Number(x) - 16} y="428" width="32" height="24" rx="3" fill={String(c)}></rect>
                        <path className="tick" d={`M${Number(x) - 6} 440 L${Number(x) - 1} 445 L${Number(x) + 7} 435`} pathLength="1" stroke={c === ink ? '#fff' : ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" strokeDashoffset="1"></path>
                      </g>
                    ))}
                  </g>
    
                  {/* print-and-cut machine: rail, housings, moving carriage, blade */}
                  <g className="machine" opacity="0" stroke={ink} strokeWidth="1.5">
                    <rect x="40" y="118" width="32" height="296" rx="4" fill="#fff"></rect>
                    <rect x="488" y="118" width="32" height="296" rx="4" fill="#fff"></rect>
                    <rect className="rail" x="40" y="128" width="480" height="18" rx="3" fill={glass}></rect>
                    <line className="arm" x1="0" y1="0" x2="0" y2="0" strokeWidth="1.2" strokeDasharray="3 3" opacity="0"></line>
                    <circle className="knife" cx="0" cy="0" r="6" fill={cutRed} stroke="#fff" strokeWidth="2" opacity="0"></circle>
                    <g className="carriage">
                      <rect className="printline" x="-2" y="152" width="4" height="248" fill={lime} stroke="none" opacity="0"></rect>
                      <rect x="-20" y="112" width="40" height="50" rx="5" fill={ink}></rect>
                      <rect x="-12" y="120" width="24" height="6" rx="2" fill={lime} stroke="none"></rect>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
            <ol className="stage__notes" aria-hidden="true">
              {m.sequence.notes.map((t, i) => (
                <li key={i} data-note data-in={noteAt[i][0]} data-out={noteAt[i][1]} data-anchor={noteAt[i][2]} data-at={noteAt[i][3]}>
                  <span className="note"><b>{t}</b><i></i><em></em></span>
                </li>
              ))}
            </ol>
            <ul className="stage__callouts" data-callouts aria-hidden="true">
              {[['hood', m.anatomy.hood], ['windshield', m.anatomy.windshield], ['roof', m.anatomy.roof], ['boot', m.anatomy.boot],
                ['glass', m.anatomy.glass], ['door', m.anatomy.door], ['wheel', m.anatomy.wheel], ['bumper', m.anatomy.bumper],
                ['backing', m.layers.backing], ['adhesive', m.layers.adhesive], ['vinyl', m.layers.vinyl], ['laminate', m.layers.laminate],
                ['applied', m.anatomy.applied]].map(([k, t]) => (
                <li key={k} data-co={k}><span className="co"><i></i><b>{t}</b></span></li>
              ))}
            </ul>
          </div>
    
          <div className="stage__live" aria-hidden="true">
            <div className="stage__caption">
              {m.sequence.steps.map((s, i) => (
                <p key={i} className={`cap cap-${i}`}><strong>{i + 1}. {s.title}</strong> {s.caption}</p>
              ))}
            </div>
            <ol className="stage__rail">
              {m.sequence.steps.map((s) => <li key={s.title}><span>{s.title}</span></li>)}
            </ol>
          </div>
    
          <div className="stage__live2" aria-hidden="true">
            <div className="stage__caption">
              {m.sequence.story.map((s, i) => (
                <p key={i} className="cap2"><strong>{i + 1}. {s.title}</strong> {s.caption}</p>
              ))}
            </div>
            <ol className="stage__rail stage__rail--6">
              {m.sequence.story.map((s) => <li key={s.title}><span>{s.title}</span></li>)}
            </ol>
          </div>
    
          <div className="stage__proof" data-proof>
            <div className="ph">{m.sequence.proof}</div>
            <a className="btn" href="#quote">{m.sequence.cta} <span className="arrow" aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    
      {/* Always in the DOM: the readable version of the six beats. Cards when motion is off. */}
      <ol className="stage__list wrap">
        {m.sequence.story.map((s, i) => (
          <li key={s.title}><span className="eyebrow">0{i + 1}</span><h3>{s.title}</h3><p>{s.caption}</p></li>
        ))}
      </ol>
    </section>
  );
}
