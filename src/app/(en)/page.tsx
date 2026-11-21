import { LightPreview } from '@/components/LightPreview';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('en');

export const metadata = pageMetadata('home', 'en', { title: m.meta.homeTitle, description: m.meta.homeDesc });

export default function Page() {
  return <LightPreview locale="en" />;
}
