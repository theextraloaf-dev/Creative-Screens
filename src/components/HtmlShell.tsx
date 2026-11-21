import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/unbounded/wght.css';
import '@fontsource-variable/manrope/wght.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/anton/latin-400.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@fontsource/yellowtail/400.css';
import '@fontsource/aref-ruqaa/400.css';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/light.css';
import { dirOf, type Locale } from '@/i18n';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ededed',
};

/* Motion is allowed only when JS runs and the visitor has not asked to reduce it.
   The "21 years" loader shows once per session, and only when motion is allowed.
   If the motion script has not taken over after 7 s, drop the hidden start states. */
const HEAD_SCRIPT = `(function () {
  var d = document.documentElement;
  d.classList.add('js');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    d.classList.add('motion');
    var seen = false;
    try { seen = sessionStorage.getItem('cs-loader') === '1'; } catch (e) {}
    if (!seen) d.classList.add('loader-on');
    setTimeout(function () {
      if (!window.__motionReady) d.classList.remove('motion', 'loader-on');
    }, 7000);
  }
})();`;

interface Props {
  locale: Locale;
  children: ReactNode;
}

// The html element's classes are set by HEAD_SCRIPT before React hydrates, hence suppressHydrationWarning.
export function HtmlShell({ locale, children }: Props) {
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
