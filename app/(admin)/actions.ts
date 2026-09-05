'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { slugify, uniqueSlug } from '@/lib/slug';
import { translateFields } from '@/lib/translate';
import { path } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

type Kind = 'essays' | 'designs';

/** Rebuild only the pages this change can be seen on. */
function refresh(kind: Kind, locale: Locale, ...slugs: (string | null | undefined)[]) {
  revalidatePath(path(locale));
  revalidatePath(path(locale, kind));
  slugs.filter(Boolean).forEach((slug) => revalidatePath(path(locale, `${kind}/${slug}`)));
}

function str(form: FormData, name: string): string {
  return String(form.get(name) ?? '').trim();
}

async function freeSlug(kind: Kind, locale: Locale, wanted: string, id: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from(kind).select('slug, id').eq('locale', locale);
  const taken = (data ?? []).filter((r) => r.id !== id).map((r) => r.slug as string);
  return uniqueSlug(slugify(wanted), taken);
}

/* ------------------------------------------------------------------ create */

export async function createPiece(form: FormData) {
  const kind = str(form, 'kind') as Kind;
  const locale = (str(form, 'locale') || 'ar') as Locale;
  const supabase = await supabaseServer();

  const stamp = Date.now().toString(36);
  const base: Record<string, unknown> = {
    locale,
    is_source: locale === 'ar',
    translation_state: 'original',
    slug: `untitled-${stamp}`,
    title: locale === 'ar' ? 'بدون عنوان' : 'Untitled',
    status: 'draft'
  };
  if (kind === 'designs') base.category = 'interior';

  const { data, error } = await supabase.from(kind).insert(base).select('id').single();

  if (error) redirect(`/admin/${kind}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/${kind}/${data!.id}`);
}

/* -------------------------------------------------------------------- save */

export async function saveEssay(form: FormData) {
  const id = str(form, 'id');
  const locale = str(form, 'locale') as Locale;
  const previousSlug = str(form, 'previousSlug');
  const status = str(form, 'status') === 'published' ? 'published' : 'draft';
  const wanted = str(form, 'slug') || str(form, 'title');
  const slug = await freeSlug('essays', locale, wanted, id);

  const publishedAt = str(form, 'published_at');
  const minutes = str(form, 'reading_minutes');

  const patch: Record<string, unknown> = {
    title: str(form, 'title'),
    slug,
    excerpt: str(form, 'excerpt') || null,
    body: str(form, 'body'),
    category: str(form, 'category') === 'design' ? 'design' : 'general',
    tags: str(form, 'tags')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    status,
    reading_minutes: minutes ? Number(minutes) : null,
    seo_title: str(form, 'seo_title') || null,
    seo_description: str(form, 'seo_description') || null,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : status === 'published' ? new Date().toISOString() : null
  };

  // a translation she has edited is no longer a machine translation
  if (str(form, 'translation_state') === 'machine' && str(form, 'edited') === '1') {
    patch.translation_state = 'machine_edited';
    patch.reviewed_at = new Date().toISOString();
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.from('essays').update(patch).eq('id', id);

  if (error) redirect(`/admin/essays/${id}?error=${encodeURIComponent(error.message)}`);

  refresh('essays', locale, slug, previousSlug);
  redirect(`/admin/essays/${id}?saved=1`);
}

export async function saveDesign(form: FormData) {
  const id = str(form, 'id');
  const locale = str(form, 'locale') as Locale;
  const previousSlug = str(form, 'previousSlug');
  const status = str(form, 'status') === 'published' ? 'published' : 'draft';
  const slug = await freeSlug('designs', locale, str(form, 'slug') || str(form, 'title'), id);
  const publishedAt = str(form, 'published_at');

  const patch: Record<string, unknown> = {
    title: str(form, 'title'),
    slug,
    summary: str(form, 'summary') || null,
    concept: str(form, 'concept'),
    execution: str(form, 'execution'),
    kind: str(form, 'kind') || null,
    category: str(form, 'category') === 'architectural' ? 'architectural' : 'interior',
    spec_place: str(form, 'spec_place') || null,
    spec_year: str(form, 'spec_year') || null,
    spec_status: str(form, 'spec_status') || null,
    status,
    seo_title: str(form, 'seo_title') || null,
    seo_description: str(form, 'seo_description') || null,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : status === 'published' ? new Date().toISOString() : null
  };

  if (str(form, 'translation_state') === 'machine' && str(form, 'edited') === '1') {
    patch.translation_state = 'machine_edited';
    patch.reviewed_at = new Date().toISOString();
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.from('designs').update(patch).eq('id', id);

  if (error) redirect(`/admin/designs/${id}?error=${encodeURIComponent(error.message)}`);

  refresh('designs', locale, slug, previousSlug);
  redirect(`/admin/designs/${id}?saved=1`);
}

/* ------------------------------------------------------------------ delete */

export async function deletePiece(form: FormData) {
  const kind = str(form, 'kind') as Kind;
  const id = str(form, 'id');
  const locale = str(form, 'locale') as Locale;
  const slug = str(form, 'slug');

  const supabase = await supabaseServer();
  const { error } = await supabase.from(kind).delete().eq('id', id);

  if (error) redirect(`/admin/${kind}/${id}?error=${encodeURIComponent(error.message)}`);

  refresh(kind, locale, slug);
  redirect(`/admin/${kind}?deleted=1`);
}

/* --------------------------------------------------------------- translate */

export async function translatePiece(form: FormData) {
  const kind = str(form, 'kind') as Kind;
  const id = str(form, 'id');
  const supabase = await supabaseServer();

  const { data: source, error } = await supabase.from(kind).select('*').eq('id', id).single();
  if (error || !source) redirect(`/admin/${kind}/${id}?error=Could+not+read+the+piece`);

  if (source.locale !== 'ar') {
    redirect(`/admin/${kind}/${id}?error=${encodeURIComponent('Only Arabic pieces are translated automatically.')}`);
  }

  // never overwrite English she has already worked on
  const { data: sibling } = await supabase
    .from(kind)
    .select('id, translation_state, status')
    .eq('group_id', source.group_id)
    .eq('locale', 'en')
    .maybeSingle();

  if (sibling && sibling.translation_state !== 'machine') {
    redirect(
      `/admin/${kind}/${sibling.id}?error=${encodeURIComponent(
        'This one already has an English version you have edited. Clear it first if you want a fresh translation.'
      )}`
    );
  }

  const fields: Record<string, string> =
    kind === 'essays'
      ? { title: String(source.title), excerpt: String(source.excerpt ?? ''), body: String(source.body ?? '') }
      : {
          title: String(source.title),
          summary: String(source.summary ?? ''),
          concept: String(source.concept ?? ''),
          execution: String(source.execution ?? '')
        };

  let translated: Record<string, string>;
  try {
    translated = await translateFields(fields);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Translation failed.';
    redirect(`/admin/${kind}/${id}?error=${encodeURIComponent(message)}`);
  }

  const slug = await freeSlug(kind, 'en', translated!.title || source.slug, sibling?.id ?? '');

  const row: Record<string, unknown> = {
    group_id: source.group_id,
    locale: 'en',
    is_source: false,
    translation_state: 'machine',
    translated_at: new Date().toISOString(),
    reviewed_at: null,
    slug,
    title: translated!.title,
    status: 'draft',
    published_at: null,
    ...(kind === 'essays'
      ? {
          excerpt: translated!.excerpt || null,
          body: translated!.body,
          category: source.category,
          tags: source.tags ?? [],
          reading_minutes: source.reading_minutes
        }
      : {
          summary: translated!.summary || null,
          concept: translated!.concept,
          execution: translated!.execution,
          kind: source.kind,
          category: source.category,
          spec_place: source.spec_place,
          spec_year: source.spec_year,
          spec_status: source.spec_status
        })
  };

  const write = sibling
    ? await supabase.from(kind).update(row).eq('id', sibling.id).select('id').single()
    : await supabase.from(kind).insert(row).select('id').single();

  if (write.error) redirect(`/admin/${kind}/${id}?error=${encodeURIComponent(write.error.message)}`);

  redirect(`/admin/${kind}/${write.data!.id}?translated=1`);
}

/* ---------------------------------------------------------------- settings */

export async function saveSettings(form: FormData) {
  const locale = str(form, 'locale') as Locale;

  const lines = (name: string) =>
    str(form, name)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

  const meta = lines('about_meta').map((line) => {
    const [label, ...rest] = line.split('|');
    return { label: (label ?? '').trim(), value: rest.join('|').trim() };
  });

  const patch = {
    display_name: str(form, 'display_name') || null,
    roles: str(form, 'roles') || null,
    location: str(form, 'location') || null,
    statement: str(form, 'statement') || null,
    statement_aside: lines('statement_aside'),
    about_quote: str(form, 'about_quote') || null,
    about: str(form, 'about'),
    about_meta: meta,
    portrait_tag: str(form, 'portrait_tag') || null,
    essays_note: str(form, 'essays_note') || null,
    designs_note: str(form, 'designs_note') || null,
    essays_crossnav: str(form, 'essays_crossnav') || null,
    designs_crossnav: str(form, 'designs_crossnav') || null,
    contact_title: str(form, 'contact_title') || null,
    marquee: lines('marquee'),
    email: str(form, 'email') || null,
    whatsapp: str(form, 'whatsapp') || null,
    instagram: str(form, 'instagram') || null
  };

  const supabase = await supabaseServer();
  const { error } = await supabase.from('site_settings').update(patch).eq('locale', locale);

  if (error) redirect(`/admin/settings?locale=${locale}&error=${encodeURIComponent(error.message)}`);

  revalidatePath(path(locale));
  revalidatePath(path(locale, 'essays'));
  revalidatePath(path(locale, 'designs'));
  redirect(`/admin/settings?locale=${locale}&saved=1`);
}
