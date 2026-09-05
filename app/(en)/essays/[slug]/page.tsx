import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { EssayPage } from '@/components/Pages';
import { getEssay, getEssays, findRetiredSlug, getCounterpartSlug } from '@/lib/queries';
import { decodeSlug, path } from '@/lib/i18n';

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

  const counterpart = await getCounterpartSlug('essays', 'en', slug);
  const here = path('en', `essays/${slug}`);

  return {
    title: item.seo_title ?? item.title,
    description: item.seo_description ?? item.excerpt ?? undefined,
    alternates: {
      canonical: here,
      languages: counterpart
        ? {
            'en': here,
            'ar': path('ar', `essays/${counterpart.slug}`),
            'x-default': path('en', `essays/${slug}`)
          }
        : { 'en': here }
    }
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);

  // an address this piece used to live at still arrives
  const live = await getEssay('en', slug);
  if (!live) {
    const moved = await findRetiredSlug('essays', 'en', slug);
    if (moved) permanentRedirect(path('en', `essays/${moved}`));
  }

  return <EssayPage locale="en" slug={slug} />;
}
