'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { slugify, uniqueSlug } from '@/lib/slug';
import { fromDateInput, readingMinutes } from '@/lib/dates';
import { translateFields } from '@/lib/translate';
import { path } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

type Kind = 'essays' | 'designs';

const NOT_WRITTEN =
  'Nothing was saved. Your sign in may have expired. Open the editor in another tab, sign in, then try again.';

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

/**
 * ED 06. When a published piece changes address, the old one is remembered
 * so anyone who shared the link still arrives.
 */
async function rememberOldSlug(kind: Kind, locale: Locale, oldSlug: string, newSlug: string, id: string) {
  if (!oldSlug || oldSlug === newSlug) return;
  const supabase = await supabaseServer();
  await supabase
    .from('slug_history')
    .upsert({ kind, locale, old_slug: oldSlug, piece_id: id }, { onConflict: 'kind,locale,old_slug' });
  // the new address may itself be a retired one: stop it redirecting to itself
  await supabase.from('slug_history').delete().eq('kind', kind).eq('locale', locale).eq('old_slug', newSlug);
}

/** Which button was pressed decides the status, not a hidden dropdown. */
function statusFrom(form: FormData): 'draft' | 'published' {
  const intent = str(form, 'intent');
  if (intent === 'publish') return 'published';
  if (intent === 'unpublish') return 'draft';
  return str(form, 'currentStatus') === 'published' ? 'published' : 'draft';
}

/* -------------------------------------------------------------------- save */

export async function saveEssay(form: FormData) {
  const id = str(form, 'id');
  const locale = str(form, 'locale') as Locale;
  const previousSlug = str(form, 'previousSlug');
  const status = statusFrom(form);
  const body = str(form, 'body');
  const slug = await freeSlug('essays', locale, str(form, 'slug') || str(form, 'title'), id);

  const patch: Record<string, unknown> = {
    title: str(form, 'title'),
    slug,
    excerpt: str(form, 'excerpt') || null,
    body,
    category: str(form, 'category') === 'design' ? 'design' : 'general',
    tags: str(form, 'tags')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    status,
    reading_minutes: readingMinutes(body),
    seo_title: str(form, 'seo_title') || null,
    seo_description: str(form, 'seo_description') || null,
    published_at:
      fromDateInput(str(form, 'published_at'), str(form, 'previousPublishedAt') || null) ??
      (status === 'published' ? new Date().toISOString() : null)
  };

  if (str(form, 'translation_state') === 'machine' && str(form, 'edited') === '1') {
    patch.translation_state = 'machine_edited';
    patch.reviewed_at = new Date().toISOString();
  }

  const supabase = await supabaseServer();
  const { data: written, error } = await supabase.from('essays').update(patch).eq('id', id).select('id');

  if (error) redirect(`/admin/essays/${id}?error=${encodeURIComponent(error.message)}`);
  if (!written || written.length === 0) redirect(`/admin/essays/${id}?error=${encodeURIComponent(NOT_WRITTEN)}`);

  await rememberOldSlug('essays', locale, previousSlug, slug, id);
  refresh('essays', locale, slug, previousSlug);
  redirect(`/admin/essays/${id}?saved=1`);
}

export async function saveDesign(form: FormData) {
  const id = str(form, 'id');
  const locale = str(form, 'locale') as Locale;
  const previousSlug = str(form, 'previousSlug');
  const status = statusFrom(form);
  const slug = await freeSlug('designs', locale, str(form, 'slug') || str(form, 'title'), id);

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
    published_at:
      fromDateInput(str(form, 'published_at'), str(form, 'previousPublishedAt') || null) ??
      (status === 'published' ? new Date().toISOString() : null)
  };

  if (str(form, 'translation_state') === 'machine' && str(form, 'edited') === '1') {
    patch.translation_state = 'machine_edited';
    patch.reviewed_at = new Date().toISOString();
  }

  const supabase = await supabaseServer();
  const { data: written, error } = await supabase.from('designs').update(patch).eq('id', id).select('id');

  if (error) redirect(`/admin/designs/${id}?error=${encodeURIComponent(error.message)}`);
  if (!written || written.length === 0) redirect(`/admin/designs/${id}?error=${encodeURIComponent(NOT_WRITTEN)}`);

  await rememberOldSlug('designs', locale, previousSlug, slug, id);
  refresh('designs', locale, slug, previousSlug);
  redirect(`/admin/designs/${id}?saved=1`);
}

/* ------------------------------------------------------------------- trash */

/** ED 02. Deleting moves a piece to the trash. Nothing is destroyed here. */
export async function trashPiece(form: FormData) {
  const kind = str(form, 'kind') as Kind;
  const id = str(form, 'id');
  const locale = str(form, 'locale') as Locale;
  const slug = str(form, 'slug');

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from(kind)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');

  if (error) redirect(`/admin/${kind}/${id}?error=${encodeURIComponent(error.message)}`);
  if (!data || data.length === 0) redirect(`/admin/${kind}/${id}?error=${encodeURIComponent(NOT_WRITTEN)}`);

  refresh(kind, locale, slug);
  redirect(`/admin/${kind}?trashed=1`);
}

export async function restorePiece(form: FormData) {
  const kind = str(form, 'kind') as Kind;
  const id = str(form, 'id');

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from(kind)
    .update({ deleted_at: null })
    .eq('id', id)
    .select('id, locale, slug');

  if (error || !data || data.length === 0) redirect(`/admin/${kind}/trash?error=Could+not+restore+it`);

  refresh(kind, data[0].locale as Locale, data[0].slug as string);
  redirect(`/admin/${kind}/${id}?restored=1`);
}

/** Only reachable from the trash, where it says what it will do. */
export async function purgePiece(form: FormData) {
  const kind = str(form, 'kind') as Kind;
  const id = str(form, 'id');

  const supabase = await supabaseServer();
  await supabase.from(kind).delete().eq('id', id);
  redirect(`/admin/${kind}/trash?purged=1`);
}

/* ------------------------------------------------------------ counterpart */

/**
 * ED 05. An English version she writes herself, rather than having to let
 * the machine translate first and then overwrite it.
 */
export async function startCounterpart(form: FormData) {
  const kind = str(form, 'kind') as Kind;
  const id = str(form, 'id');
  const supabase = await supabaseServer();

  const { data: source } = await supabase.from(kind).select('*').eq('id', id).maybeSingle();
  if (!source) redirect(`/admin/${kind}?error=Could+not+read+the+piece`);

  const other: Locale = source.locale === 'ar' ? 'en' : 'ar';
  const slug = await freeSlug(kind, other, String(source.slug), '');

  const row: Record<string, unknown> = {
    group_id: source.group_id,
    locale: other,
    is_source: other === 'ar',
    translation_state: 'human',
    slug,
    title: source.title,
    status: 'draft',
    ...(kind === 'essays'
      ? { body: '', category: source.category, tags: source.tags ?? [] }
      : { concept: '', execution: '', kind: source.kind, category: source.category })
  };

  const { data, error } = await supabase.from(kind).insert(row).select('id').single();
  if (error) redirect(`/admin/${kind}/${id}?error=${encodeURIComponent(error.message)}`);

  redirect(`/admin/${kind}/${data!.id}?fresh=1`);
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

  const { data: sibling } = await supabase
    .from(kind)
    .select('id, translation_state, status')
    .eq('group_id', source.group_id)
    .eq('locale', 'en')
    .maybeSingle();

  if (sibling && sibling.translation_state !== 'machine') {
    redirect(
      `/admin/${kind}/${sibling.id}?error=${encodeURIComponent(
        'This one already has an English version you have worked on. Clear it first if you want a fresh translation.'
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

  const slug = await freeSlug(kind, 'en', translated!.title || String(source.slug), sibling?.id ?? '');

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
          reading_minutes: readingMinutes(translated!.body)
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
  const { data, error } = await supabase.from('site_settings').update(patch).eq('locale', locale).select('locale');

  if (error) redirect(`/admin/settings?locale=${locale}&error=${encodeURIComponent(error.message)}`);
  if (!data || data.length === 0) redirect(`/admin/settings?locale=${locale}&error=${encodeURIComponent(NOT_WRITTEN)}`);

  revalidatePath(path(locale));
  revalidatePath(path(locale, 'essays'));
  revalidatePath(path(locale, 'designs'));
  redirect(`/admin/settings?locale=${locale}&saved=1`);
}
