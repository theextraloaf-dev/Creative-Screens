'use client';

import { useEffect } from 'react';
import { initCtaBar } from '@/behaviors/ctaBar';
import { initHeroVideo } from '@/behaviors/heroVideo';
import { initLoader } from '@/behaviors/loader';
import { initMenu } from '@/behaviors/menu';

/* All page behaviour hangs off data-attributes in server-rendered markup and starts after hydration, so the
   DOM the scripts touch never disagrees with what React rendered. Motion (GSAP, Lenis, 3D) loads lazily. */
export function Behaviors() {
  useEffect(() => {
    initLoader(); // before motion: motion waits for cs:loader-done when the loader is up
    const cleanups = [initMenu(), initCtaBar(), initHeroVideo()];
    if (document.querySelector('[data-light]')) {
      // the light preview's lightbox and menu work with or without motion
      (window as unknown as { __lightDialogs?: Promise<unknown> }).__lightDialogs = import('@/scripts/light/dialogs.js').then((m) => m.initDialogs());
    }
    import('@/scripts/motion.js').catch((e: unknown) => console.warn('Motion unavailable', e));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
