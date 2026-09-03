import { publicClient } from './supabase';
import type { Design, DesignImage, Essay, Locale, SiteSettings } from './types';

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
    ui: {}
  }
};

export async function getSettings(locale: Locale): Promise<SiteSettings> {
  const { data, error } = await publicClient()
    .from('site_settings')
    .select('*')
    .eq('locale', locale)
    .maybeSingle();

  if (error || !data) return FALLBACK_SETTINGS[locale];
  const row = data as SiteSettings;
  return { ...FALLBACK_SETTINGS[locale], ...row, about: asText(row.about), marquee: row.marquee ?? [], ui: row.ui ?? {} };
}

export async function getEssays(locale: Locale): Promise<Essay[]> {
  const { data } = await publicClient()
    .from('essays')
    .select('*')
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });
  return ((data as Essay[]) ?? []).map((row) => ({ ...row, body: asText(row.body), tags: row.tags ?? [] }));
}

export async function getEssay(locale: Locale, slug: string): Promise<Essay | null> {
  const { data } = await publicClient()
    .from('essays')
    .select('*')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!data) return null;
  const row = data as Essay;
  return { ...row, body: asText(row.body), tags: row.tags ?? [] };
}

export async function getDesigns(locale: Locale): Promise<Design[]> {
  const { data } = await publicClient()
    .from('designs')
    .select('*')
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });
  return (data as Design[]) ?? [];
}

export async function getDesign(locale: Locale, slug: string): Promise<Design | null> {
  const { data } = await publicClient()
    .from('designs')
    .select('*')
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
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

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/media/${path}`;
}
