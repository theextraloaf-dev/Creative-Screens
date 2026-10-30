import { Lab } from '@/components/Lab';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('en');

export const metadata = pageMetadata('lab', 'en', { title: m.meta.labTitle, description: m.lab.intro, noindex: true });

export default function Page() {
  return <Lab locale="en" />;
}
