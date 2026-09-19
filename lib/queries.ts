import { publicClient } from './supabase';
import { supabaseServer } from './supabase-server';
import type { Design, DesignImage, DesignSection, Essay, Locale, Media, SiteSettings } from './types';

/** Bodies are Markdown text. Tolerate the older jsonb columns until 002 has been run. */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const FALLBACK_SETTINGS: Record<Locale, SiteSettings> = {
  en: {
    locale: 'en',
    display_name: 'Warqaa Nizar',
    roles: 'writer, designer',
    statement:
      'Not just a place to read or look at pretty designs. A place to reimagine the ways we turn the spaces around us into homes that reflect us.',
    about: '',
    marquee: [],
    email: null,
    whatsapp: null,
    instagram: 'warqaathinks',
    essays_note: null,
    designs_note: null,
    location: 'Baghdad, Iraq',
    statement_aside: [],
    about_quote: null,
    about_meta: [],
    contact_title: null,
    essays_crossnav: null,
    designs_crossnav: null,
    portrait_tag: null,
    ui: {}
  },
  ar: {
    locale: 'ar',
    display_name: 'ورقاء نزار',
    roles: 'كاتبة ومصمّمة',
    statement: '',
    about: '',
    marquee: [],
    email: null,
    whatsapp: null,
    instagram: 'warqaathinks',
    essays_note: null,
    designs_note: null,
    location: 'بغداد، العراق',
    statement_aside: [],
    about_quote: null,
    about_meta: [],
    contact_title: null,
    essays_crossnav: null,
    designs_crossnav: null,
    portrait_tag: null,
    ui: {}
  }
};

/** Every piece comes with its cover picture, when it has one. */
const WITH_COVER = '*, cover:cover_media_id (*)';

export async function getSettings(locale: Locale): Promise<SiteSettings> {
  let { data, error } = await publicClient()
    .from('site_settings')
    .select('*, portrait:portrait_media_id (*)')
    .eq('locale', locale)
    .maybeSingle();

  // before 011 there is no portrait column: never let that blank the site
  if (error) {
    ({ data, error } = await publicClient().from('site_settings').select('*').eq('locale', locale).maybeSingle());
  }

  if (error || !data) return FALLBACK_SETTINGS[locale];
  const row = data as SiteSettings;
  return { ...FALLBACK_SETTINGS[locale], ...row, about: asText(row.about), marquee: row.marquee ?? [], statement_aside: row.statement_aside ?? [], about_meta: Array.isArray(row.about_meta) ? row.about_meta : [], ui: row.ui ?? {} };
}

export async function getEssays(locale: Locale): Promise<Essay[]> {
  const { data } = await publicClient()
    .from('essays')
    .select(WITH_COVER)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });
  return ((data as Essay[]) ?? []).map((row) => ({ ...row, body: asText(row.body), tags: row.tags ?? [] }));
}

export async function getEssay(locale: Locale, slug: string, preview = false): Promise<Essay | null> {
  const client = preview ? await supabaseServer() : publicClient();
  let query = client.from('essays').select(WITH_COVER).eq('locale', locale).eq('slug', slug);
  query = preview ? query.is('deleted_at', null) : query.eq('status', 'published');
  const { data } = await query.maybeSingle();
  if (!data) return null;
  const row = data as Essay;
  return { ...row, body: asText(row.body), tags: row.tags ?? [] };
}

export async function getDesigns(locale: Locale): Promise<Design[]> {
  const { data } = await publicClient()
    .from('designs')
    .select(WITH_COVER)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });
  const designs = (data as Design[]) ?? [];

  // a project with pictures but no cover shows its first picture on the grid
  const bare = designs.filter((d) => !d.cover).map((d) => d.group_id);
  if (bare.length) {
    const { data: firsts } = await publicClient()
      .from('design_images')
      .select('group_id, sort, media:media_id (*)')
      .in('group_id', bare)
      .order('sort', { ascending: true });
    const first = new Map<string, Media>();
    for (const row of (firsts ?? []) as unknown as { group_id: string; media: Media | null }[]) {
      if (row.media && !first.has(row.group_id)) first.set(row.group_id, row.media);
    }
    for (const d of designs) if (!d.cover) d.cover = first.get(d.group_id) ?? null;
  }
  return designs;
}

export async function getDesign(locale: Locale, slug: string, preview = false): Promise<Design | null> {
  const client = preview ? await supabaseServer() : publicClient();
  let query = client.from('designs').select(WITH_COVER).eq('locale', locale).eq('slug', slug);
  query = preview ? query.is('deleted_at', null) : query.eq('status', 'published');
  const { data } = await query.maybeSingle();
  if (!data) return null;
  const row = data as Design;
  return { ...row, concept: asText(row.concept), execution: asText(row.execution) };
}

export async function getDesignImages(groupId: string): Promise<DesignImage[]> {
  const { data } = await publicClient()
    .from('design_images')
    .select('*, media:media_id (*)')
    .eq('group_id', groupId)
    .order('sort', { ascending: true });
  return (data as DesignImage[]) ?? [];
}

/**
 * A project's sections, in order. Preview reads with the editor's own
 * session, so a project that is not live yet still shows its text.
 * Empty before 012 has been run, and the page then falls back to the old fields.
 */
export async function getDesignSections(groupId: string, preview = false): Promise<DesignSection[]> {
  const client = preview ? await supabaseServer() : publicClient();
  const { data, error } = await client
    .from('design_sections')
    .select('*')
    .eq('group_id', groupId)
    .order('sort', { ascending: true });
  if (error) return [];
  return (data as DesignSection[]) ?? [];
}

/** The same piece in the other language, when it exists and is published. */
export async function getSibling(
  table: 'essays' | 'designs',
  groupId: string,
  locale: Locale
): Promise<{ slug: string } | null> {
  const { data } = await publicClient()
    .from(table)
    .select('slug')
    .eq('group_id', groupId)
    .eq('locale', locale)
    .eq('status', 'published')
    .maybeSingle();
  return (data as { slug: string }) ?? null;
}

/** Preview reads by id, with the editor's own session, so drafts are visible. */
export async function getPieceById(kind: 'essays' | 'designs', id: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from(kind).select(WITH_COVER).eq('id', id).maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    ...row,
    body: asText(row.body),
    concept: asText(row.concept),
    execution: asText(row.execution),
    tags: (row.tags as string[]) ?? []
  };
}

/** ED 06. An address that used to belong to a piece, so old links still work. */
export async function findRetiredSlug(
  kind: 'essays' | 'designs',
  locale: Locale,
  slug: string
): Promise<string | null> {
  const { data } = await publicClient()
    .from('slug_history')
    .select('piece_id')
    .eq('kind', kind)
    .eq('locale', locale)
    .eq('old_slug', slug)
    .maybeSingle();

  if (!data) return null;

  const { data: piece } = await publicClient()
    .from(kind)
    .select('slug')
    .eq('id', data.piece_id)
    .eq('status', 'published')
    .maybeSingle();

  return (piece?.slug as string) ?? null;
}

/** ED 13. The same piece in the other language, for the hreflang tags. */
export async function getCounterpartSlug(
  kind: 'essays' | 'designs',
  locale: Locale,
  slug: string
): Promise<{ locale: Locale; slug: string } | null> {
  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const { data: mine } = await publicClient()
    .from(kind)
    .select('group_id')
    .eq('locale', locale)
    .eq('slug', slug)
    .maybeSingle();
  if (!mine) return null;

  const { data: theirs } = await publicClient()
    .from(kind)
    .select('slug')
    .eq('group_id', mine.group_id)
    .eq('locale', other)
    .eq('status', 'published')
    .maybeSingle();

  return theirs ? { locale: other, slug: theirs.slug as string } : null;
}

export { mediaUrl } from './media';
