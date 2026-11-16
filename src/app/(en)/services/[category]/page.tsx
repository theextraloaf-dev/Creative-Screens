import { notFound } from 'next/navigation';
import { CategoryPage } from '@/components/CategoryPage';
import { subCategories } from '@/data/sub-categories';
import { messages } from '@/i18n';

export function generateStaticParams() {
  return Object.keys(subCategories).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = messages('en').services.items.find((s) => s.slug === category);
  if (!cat) return {};
  return { title: `${cat.name} | Creative Screens`, description: cat.line };
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!subCategories[category]) notFound();
  return <CategoryPage locale="en" category={category} />;
}
