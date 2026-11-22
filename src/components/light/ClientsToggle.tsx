'use client';

/* The clients row's pause / play button (moving content needs a way to stop it). It only shows while the row rolls
   (html.motion); it toggles .is-paused on its section. */
import { useState } from 'react';

export function ClientsToggle({ pause, play }: { pause: string; play: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <button type="button" className="lround lclients__toggle" aria-pressed={paused} aria-label={paused ? play : pause}
      onClick={(e) => {
        const next = !paused;
        setPaused(next);
        e.currentTarget.closest('.lclients')?.classList.toggle('is-paused', next);
      }}>
      <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
    </button>
  );
}
