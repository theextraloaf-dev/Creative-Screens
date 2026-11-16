import { AboutPage } from '@/components/AboutPage';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('ar');

export const metadata = pageMetadata('about', 'ar', { title: m.meta.aboutTitle, description: m.pages.about.intro[0] });

export default function Page() {
  return <AboutPage locale="ar" />;
}
