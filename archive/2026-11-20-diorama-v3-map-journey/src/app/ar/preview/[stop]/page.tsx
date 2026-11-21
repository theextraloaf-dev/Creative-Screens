import { notFound } from 'next/navigation';
import { DioramaStory } from '@/components/DioramaStory';
import { Shell } from '@/components/Shell';
import { storyBySlug, storySlugs } from '@/data/diorama-stories';
import { messages } from '@/i18n';
import { pageMetadata } from '@/lib/meta';
import '@/components/Diorama.css';

/* The light standalone story page a shared link opens: no 3D, no film, close returns to the journey at this stop. */
export const dynamicParams = false;
export const generateStaticParams = () => storySlugs().map((stop) => ({ stop }));

export async function generateMetadata({ params }: { params: Promise<{ stop: string }> }) {
  const st = storyBySlug((await params).stop);
  const m = messages('ar');
  return pageMetadata('preview', 'ar', { title: `${st?.ar.title ?? ''} | ${m.meta.previewTitle}`, description: st?.ar.line ?? '', noindex: true });
}

export default async function Page({ params }: { params: Promise<{ stop: string }> }) {
  const st = storyBySlug((await params).stop);
  if (!st) notFound();
  return (
    <Shell locale="ar" routeKey="preview" loader={false}>
      <DioramaStory story={st} locale="ar" mode="page" />
    </Shell>
  );
}
