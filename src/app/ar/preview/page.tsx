import { LightPreview } from '@/components/LightPreview';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('ar');

export const metadata = pageMetadata('preview', 'ar', { title: m.meta.previewTitle, description: m.light.jobsLead, noindex: true });

export default function Page() {
  return <LightPreview locale="ar" routeKey="preview" />;
}
