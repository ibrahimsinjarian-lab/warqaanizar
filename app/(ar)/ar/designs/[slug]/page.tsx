import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { DesignPage } from '@/components/Pages';
import { getDesign, getDesigns, findRetiredSlug, getCounterpartSlug } from '@/lib/queries';
import { decodeSlug, path } from '@/lib/i18n';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getDesigns('ar');
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  const item = await getDesign('ar', slug);
  if (!item) return {};

  const counterpart = await getCounterpartSlug('designs', 'ar', slug);
  const here = path('ar', `designs/${slug}`);

  return {
    title: item.seo_title ?? item.title,
    description: item.seo_description ?? item.summary ?? undefined,
    alternates: {
      canonical: here,
      languages: counterpart
        ? {
            'ar': here,
            'en': path('en', `designs/${counterpart.slug}`),
            'x-default': path('en', `designs/${counterpart.slug}`)
          }
        : { 'ar': here }
    }
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);

  // an address this piece used to live at still arrives
  const live = await getDesign('ar', slug);
  if (!live) {
    const moved = await findRetiredSlug('designs', 'ar', slug);
    if (moved) permanentRedirect(path('ar', `designs/${moved}`));
  }

  return <DesignPage locale="ar" slug={slug} />;
}
