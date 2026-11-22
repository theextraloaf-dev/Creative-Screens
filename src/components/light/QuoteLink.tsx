'use client';

/* "Get a quote" beside one thing we make: drops to the form below and sets its service and the brief's first line
   ("I'm interested in: …"), through the form's cs:quote event. The only part of a range page that runs in the
   browser. */
import type { ReactNode } from 'react';
import { QUOTE_EVENT } from '../QuoteForm';

export function QuoteLink({ service, brief, label, className = 'lproduct__quote', children }: {
  service: string; brief: string; label?: string; className?: string; children: ReactNode;
}) {
  return (
    <a className={className} href="#quote" aria-label={label}
      onClick={() => window.dispatchEvent(new CustomEvent(QUOTE_EVENT, { detail: { service, brief } }))}>
      {children}
    </a>
  );
}
