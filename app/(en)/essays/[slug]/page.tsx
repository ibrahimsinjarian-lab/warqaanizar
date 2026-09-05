import type { Metadata } from 'next';
import { EssayPage } from '@/components/Pages';
import { getEssay, getEssays } from '@/lib/queries';
import { decodeSlug } from '@/lib/i18n';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getEssays('en');
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  const item = await getEssay('en', slug);
  if (!item) return {};
  return {
    title: item.seo_title ?? item.title,
    description: item.seo_description ?? item.excerpt ?? undefined
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  return <EssayPage locale="en" slug={slug} />;
}
