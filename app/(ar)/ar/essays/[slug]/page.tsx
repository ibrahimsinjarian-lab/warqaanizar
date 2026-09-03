import type { Metadata } from 'next';
import { EssayPage } from '@/components/Pages';
import { getEssay, getEssays } from '@/lib/queries';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getEssays('ar');
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getEssay('ar', slug);
  if (!item) return {};
  return {
    title: item.seo_title ?? item.title,
    description: item.seo_description ?? item.excerpt ?? undefined
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EssayPage locale="ar" slug={slug} />;
}
