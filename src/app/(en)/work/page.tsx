import { WorkPage } from '@/components/WorkPage';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('en');

export const metadata = pageMetadata('work', 'en', { title: m.meta.workTitle, description: m.pages.work.lead, noindex: true });

export default function Page() {
  return <WorkPage locale="en" />;
}
