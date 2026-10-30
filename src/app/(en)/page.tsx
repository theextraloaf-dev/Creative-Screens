import { Home } from '@/components/Home';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('en');

export const metadata = pageMetadata('home', 'en', { title: m.meta.homeTitle, description: m.meta.homeDesc });

export default function Page() {
  return <Home locale="en" />;
}
