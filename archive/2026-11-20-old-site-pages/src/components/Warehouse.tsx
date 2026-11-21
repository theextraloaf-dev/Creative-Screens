/* Fixed canvas behind the journey: the 3D print works the scroll flies through (see src/scripts/warehouse.js).
   Besides the scene it carries a few labels pinned to the machines the camera is looking at (data-co keys match
   CALLOUTS in warehouse.js). Hidden when motion is off or WebGL is unavailable; the captions read fine without it. */
import { messages, type Locale } from '@/i18n';
import './Warehouse.css';

const KEYS = ['brief', 'artwork', 'dimensions', 'press', 'printer', 'laminator', 'finishing', 'applied', 'dock'] as const;

export function Warehouse({ locale }: { locale: Locale }) {
  const w = messages(locale).wh;
  return (
    <div className="wh" data-warehouse data-station="0" aria-hidden="true">
      <canvas></canvas>
      <ul className="wh__co">
        {KEYS.map((k) => (
          <li key={k} data-co={k} className={k === 'applied' ? 'is-up' : undefined}>
            <span className="co"><i></i><b><span className="co__t">{w[k]}</span><span className="co__d">{w.disc[k]}</span></b></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
