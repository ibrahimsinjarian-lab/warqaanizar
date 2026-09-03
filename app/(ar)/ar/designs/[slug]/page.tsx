import type { Metadata } from 'next';
import { DesignPage } from '@/components/Pages';
import { getDesign, getDesigns } from '@/lib/queries';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getDesigns('ar');
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getDesign('ar', slug);
  if (!item) return {};
  return {
    title: item.seo_title ?? item.title,
    description: item.seo_description ?? item.summary ?? undefined
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DesignPage locale="ar" slug={slug} />;
}
