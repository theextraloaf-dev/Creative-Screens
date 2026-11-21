import { Diorama } from '@/components/Diorama';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('ar');

export const metadata = pageMetadata('preview', 'ar', { title: m.meta.previewTitle, description: m.diorama.lead, noindex: true });

export default function Page() {
  return <Diorama locale="ar" />;
}
