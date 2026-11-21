import { ServicesPage } from '@/components/ServicesPage';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('en');

export const metadata = pageMetadata('services', 'en', { title: m.meta.servicesTitle, description: m.pages.services.lead });

export default function Page() {
  return <ServicesPage locale="en" />;
}
