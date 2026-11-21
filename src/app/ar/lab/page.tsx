import { Lab } from '@/components/Lab';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('ar');

export const metadata = pageMetadata('lab', 'ar', { title: m.meta.labTitle, description: m.lab.intro, noindex: true });

export default function Page() {
  return <Lab locale="ar" />;
}
