import type { ReactNode } from 'react';
import { HtmlShell } from '@/components/HtmlShell';

export { viewport } from '@/components/HtmlShell';

export default function ArabicLayout({ children }: { children: ReactNode }) {
  return <HtmlShell locale="ar">{children}</HtmlShell>;
}
