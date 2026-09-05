import type { MetadataRoute } from 'next';
import { getDesigns, getEssays } from '@/lib/queries';
import { path } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

/** ED 14. Every published page, in both languages, straight from the database. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://warqaanizar.vercel.app';
  const locales: Locale[] = ['en', 'ar'];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const [essays, designs] = await Promise.all([getEssays(locale), getDesigns(locale)]);

    entries.push({ url: `${base}${path(locale)}`, changeFrequency: 'monthly', priority: 1 });
    entries.push({ url: `${base}${path(locale, 'essays')}`, changeFrequency: 'weekly', priority: 0.8 });
    entries.push({ url: `${base}${path(locale, 'designs')}`, changeFrequency: 'weekly', priority: 0.8 });

    essays.forEach((essay) =>
      entries.push({
        url: `${base}${path(locale, `essays/${essay.slug}`)}`,
        lastModified: essay.updated_at ? new Date(essay.updated_at) : undefined,
        priority: 0.7
      })
    );

    designs.forEach((design) =>
      entries.push({
        url: `${base}${path(locale, `designs/${design.slug}`)}`,
        lastModified: design.updated_at ? new Date(design.updated_at) : undefined,
        priority: 0.7
      })
    );
  }

  return entries;
}
