'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase-server';
import { slugify, uniqueSlug } from '@/lib/slug';
import { path } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

/**
 * The wizard calls these from the browser and reads the answer, so unlike
 * the form actions they return a result instead of redirecting.
 */

type Kind = 'essays' | 'designs';
export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

async function freeSlug(kind: Kind, locale: Locale, wanted: string, id: string | null) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from(kind).select('slug, id').eq('locale', locale);
  const taken = (data ?? []).filter((r) => r.id !== id).map((r) => r.slug as string);
  return uniqueSlug(slugify(wanted), taken);
}

/** Step one creates the row, so the words have somewhere to live from then on. */
export async function createDraft(
  kind: Kind,
  locale: Locale,
  title: string
): Promise<Result<{ id: string }>> {
  const supabase = await supabaseServer();

  const row: Record<string, unknown> = {
    locale,
    is_source: locale === 'ar',
    translation_state: 'original',
    title: title.trim() || (locale === 'ar' ? 'بدون عنوان' : 'Untitled'),
    slug: await freeSlug(kind, locale, title || `untitled-${Date.now().toString(36)}`, null),
    status: 'draft'
  };
  if (kind === 'designs') row.category = 'interior';

  const { data, error } = await supabase.from(kind).insert(row).select('id').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { id: data.id as string } };
}

/** Called on every step, so leaving the wizard never loses a step's work. */
export async function saveDraft(
  kind: Kind,
  id: string,
  locale: Locale,
  values: Record<string, string>
): Promise<Result<{ slug: string }>> {
  const supabase = await supabaseServer();

  const list = (name: string) =>
    (values[name] ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

  const slug = await freeSlug(kind, locale, values.slug || values.title || '', id);

  const patch: Record<string, unknown> =
    kind === 'essays'
      ? {
          title: values.title ?? '',
          slug,
          excerpt: values.excerpt || null,
          body: values.body ?? '',
          category: values.category === 'design' ? 'design' : 'general',
          tags: list('tags'),
          reading_minutes: readingMinutes(values.body ?? '')
        }
      : {
          title: values.title ?? '',
          slug,
          summary: values.summary || null,
          concept: values.concept ?? '',
          execution: values.execution ?? '',
          kind: values.kind || null,
          category: values.category === 'architectural' ? 'architectural' : 'interior',
          spec_place: values.spec_place || null,
          spec_year: values.spec_year || null,
          spec_status: values.spec_status || null
        };

  const { data, error } = await supabase.from(kind).update(patch).eq('id', id).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: 'Nothing was saved. You may have been signed out. Open the editor in a new tab and sign in again.' };
  }

  return { ok: true, data: { slug } };
}

/** Words a minute, rounded up, never zero. */
function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function publishDraft(
  kind: Kind,
  id: string,
  locale: Locale
): Promise<Result<{ url: string }>> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from(kind)
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select('slug');

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: 'Nothing was published. You may have been signed out.' };
  }

  const slug = data[0].slug as string;
  revalidatePath(path(locale));
  revalidatePath(path(locale, kind));
  revalidatePath(path(locale, `${kind}/${slug}`));

  return { ok: true, data: { url: path(locale, `${kind}/${slug}`) } };
}
