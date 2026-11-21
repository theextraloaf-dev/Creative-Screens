import { notFound } from 'next/navigation';
import { JobPage } from '@/components/JobPage';
import { jobs } from '@/data/jobs';

export function generateStaticParams() {
  return jobs.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug);
  if (!job) return {};
  return { title: `${job.ar.title} | كرييتف سكرينز`, description: job.ar.line, robots: { index: false, follow: true } };   // Sample jobs until the real ones land, like /work/
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!jobs.some((j) => j.slug === slug)) notFound();
  return <JobPage locale="ar" slug={slug} />;
}
