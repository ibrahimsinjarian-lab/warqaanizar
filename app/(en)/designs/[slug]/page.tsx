import type { Metadata } from 'next';
import { DesignPage } from '@/components/Pages';
import { getDesign, getDesigns } from '@/lib/queries';
import { decodeSlug } from '@/lib/i18n';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getDesigns('en');
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  const item = await getDesign('en', slug);
  if (!item) return {};
  return {
    title: item.seo_title ?? item.title,
    description: item.seo_description ?? item.summary ?? undefined
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  return <DesignPage locale="en" slug={slug} />;
}
