import { AboutPage } from '@/components/AboutPage';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('ar');

// noindex until the real company story replaces the placeholder sections below
export const metadata = pageMetadata('about', 'ar', { title: m.meta.aboutTitle, description: m.pages.about.lead, noindex: true });

export default function Page() {
  return <AboutPage locale="ar" />;
}
