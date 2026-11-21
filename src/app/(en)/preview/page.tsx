import { LightPreview } from '@/components/LightPreview';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('en');

export const metadata = pageMetadata('preview', 'en', { title: m.meta.previewTitle, description: m.light.jobsLead, noindex: true });

export default function Page() {
  return <LightPreview locale="en" routeKey="preview" />;
}
