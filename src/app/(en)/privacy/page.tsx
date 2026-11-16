import { PrivacyPage } from '@/components/PrivacyPage';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';

const m = messages('en');

// noindex until the real policy text replaces the placeholder below
export const metadata = pageMetadata('privacy', 'en', { title: m.meta.privacyTitle, description: m.pages.privacy.lead, noindex: true });

export default function Page() {
  return <PrivacyPage locale="en" />;
}
