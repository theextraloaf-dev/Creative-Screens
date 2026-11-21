import type { ReactNode } from 'react';
import { HtmlShell } from '@/components/HtmlShell';

export { viewport } from '@/components/HtmlShell';

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <HtmlShell locale="en">{children}</HtmlShell>;
}
