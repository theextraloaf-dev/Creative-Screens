'use client';

/* A job page's pictures (Biegajaca's work page): the main picture stays in view while the details scroll beside it,
   with a thumbnail for each picture to switch between them. */
import { useState } from 'react';
import type { Job } from '@/data/jobs';

export function JobMedia({ job, labels }: { job: Job; labels: string[] }) {
  const [i, setI] = useState(0);
  return (
    <div className="ljob__media">
      <figure className={`ljob__main is-${job.look}`}>
        <img src={job.photos[i]} alt="" decoding="async" />
      </figure>
      {job.photos.length > 1 && (
        <div className="ljob__thumbs">
          {job.photos.map((p, k) => (
            <button key={p} type="button" className={`ljob__thumb${k === i ? ' is-on' : ''}`} aria-pressed={k === i} aria-label={labels[k]} onClick={() => setI(k)}>
              <img src={p} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
