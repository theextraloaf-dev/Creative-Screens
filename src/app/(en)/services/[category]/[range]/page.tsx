import { notFound } from 'next/navigation';
import { RangePage } from '@/components/RangePage';
import { ranges } from '@/data/ranges';
import { subCategories } from '@/data/sub-categories';
import { messages } from '@/i18n';

export function generateStaticParams() {
  return Object.entries(subCategories).flatMap(([category, subs]) => subs.map((range) => ({ category, range })));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; range: string }> }) {
  const { category, range } = await params;
  const cat = messages('en').services.items.find((s) => s.slug === category);
  const at = subCategories[category]?.indexOf(range) ?? -1;
  if (!cat || at < 0) return {};
  return { title: `${cat.makes[at]} | ${cat.name} | Creative Screens`, description: ranges[`${category}/${range}`]?.intro.en ?? cat.line };
}

export default async function Page({ params }: { params: Promise<{ category: string; range: string }> }) {
  const { category, range } = await params;
  if (!subCategories[category]?.includes(range)) notFound();
  return <RangePage locale="en" category={category} range={range} />;
}
