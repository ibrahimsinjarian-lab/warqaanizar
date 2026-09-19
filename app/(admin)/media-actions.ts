'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase-server';
import type { Uploaded } from '@/lib/cloudinary';
import { describeImage } from '@/lib/describe';
import type { DesignSection, Media } from '@/lib/types';

/**
 * Pictures are attached straight away, without pressing Save, the way any
 * photo app behaves. So these return an answer instead of redirecting.
 *
 * A picture belongs to the piece, not to one language: the cover and the
 * project pictures are shared by the Arabic and English versions, and only
 * the descriptions and captions differ.
 */

type Kind = 'essays' | 'designs';
type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

const SIGNED_OUT = 'Nothing was saved. You may have been signed out. Open the editor in a new tab and sign in again.';

/** A picture shows on the piece, both lists and the front page: rebuild them all. */
function refreshSite() {
  revalidatePath('/', 'layout');
}

/** Record a picture Cloudinary has just accepted. */
export async function registerMedia(file: Uploaded): Promise<Result<Media>> {
  if (!/^https:\/\/res\.cloudinary\.com\//.test(file.url)) return { ok: false, error: 'That is not a Cloudinary address.' };

  // written by Gemini now, so she only has to read it; empty if Gemini is unavailable
  const words = await describeImage(file.url);

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('media')
    .insert({
      path: file.url,
      width: file.width,
      height: file.height,
      bytes: file.bytes,
      mime: file.mime,
      alt_ar: words?.alt_ar || null,
      alt_en: words?.alt_en || null
    })
    .select('*')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as Media };
}

/** Descriptions are read aloud to people who cannot see the picture, and by search engines. */
export async function describeMedia(id: string, alt_ar: string, alt_en: string): Promise<Result> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('media')
    .update({ alt_ar: alt_ar.trim() || null, alt_en: alt_en.trim() || null })
    .eq('id', id)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

/** The cover is shared by both languages, so it is set on every row of the group. */
export async function setCover(kind: Kind, groupId: string, mediaId: string | null): Promise<Result> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from(kind)
    .update({ cover_media_id: mediaId })
    .eq('group_id', groupId)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

/** The portrait on the front page, the same in both languages. */
export async function setPortrait(mediaId: string | null): Promise<Result> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('site_settings')
    .update({ portrait_media_id: mediaId })
    .in('locale', ['ar', 'en'])
    .select('locale');

  if (error) {
    const missing = /portrait_media_id/.test(error.message);
    return { ok: false, error: missing ? 'Run 011_images.sql in Supabase first, then try again.' : error.message };
  }
  if (!data?.length) return { ok: false, error: SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

/* --------------------------------------------------------- project pictures */

const PLATE_FIELDS = 'id, caption_ar, caption_en, sort, section_id, media:media_id (*)';

export type PlateRow = {
  id: string;
  caption_ar: string | null;
  caption_en: string | null;
  sort: number;
  section_id: string | null;
  media: Media;
};

export async function addPlates(
  groupId: string,
  mediaIds: string[],
  sectionId: string | null = null
): Promise<Result<PlateRow[]>> {
  const supabase = await supabaseServer();

  const { data: last } = await supabase
    .from('design_images')
    .select('sort')
    .eq('group_id', groupId)
    .order('sort', { ascending: false })
    .limit(1);
  const start = ((last?.[0]?.sort as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from('design_images')
    .insert(
      mediaIds.map((media_id, i) => ({
        group_id: groupId,
        media_id,
        sort: start + i,
        ...(sectionId ? { section_id: sectionId } : {})
      }))
    )
    .select(PLATE_FIELDS);

  if (error) return { ok: false, error: error.message };
  refreshSite();
  return { ok: true, data: (data ?? []) as unknown as PlateRow[] };
}

export async function captionPlate(id: string, caption_ar: string, caption_en: string): Promise<Result> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('design_images')
    .update({ caption_ar: caption_ar.trim() || null, caption_en: caption_en.trim() || null })
    .eq('id', id)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

/** The order they are dragged into is the order they appear on the page. */
export async function orderPlates(ids: string[]): Promise<Result> {
  const supabase = await supabaseServer();
  const results = await Promise.all(
    ids.map((id, sort) => supabase.from('design_images').update({ sort }).eq('id', id).select('id'))
  );

  const failed = results.find((r) => r.error || !r.data?.length);
  if (failed) return { ok: false, error: failed.error?.message ?? SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

/** Moves a picture into a section, or out of every section with null. */
export async function assignPlate(id: string, sectionId: string | null): Promise<Result> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('design_images').update({ section_id: sectionId }).eq('id', id).select('id');

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

/* ---------------------------------------------------------------- sections */

/**
 * Adding, removing and reordering sections happen at once, like pictures,
 * because a picture can only be put in a section that exists. The words
 * inside a section are saved with the rest of the page, by Save or Publish.
 */

export async function addSection(groupId: string): Promise<Result<DesignSection>> {
  const supabase = await supabaseServer();
  const { data: last } = await supabase
    .from('design_sections')
    .select('sort')
    .eq('group_id', groupId)
    .order('sort', { ascending: false })
    .limit(1);
  const sort = ((last?.[0]?.sort as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from('design_sections')
    .insert({ group_id: groupId, sort })
    .select('*')
    .single();

  if (error) {
    const missing = /design_sections/.test(error.message);
    return { ok: false, error: missing ? 'Run 012_sections.sql in Supabase first, then try again.' : error.message };
  }
  return { ok: true, data: data as DesignSection };
}

/** Its pictures stay on the project, outside any section, so nothing is lost. */
export async function removeSection(id: string): Promise<Result> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('design_sections').delete().eq('id', id).select('id');

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

export async function orderSections(ids: string[]): Promise<Result> {
  const supabase = await supabaseServer();
  const results = await Promise.all(
    ids.map((id, sort) => supabase.from('design_sections').update({ sort }).eq('id', id).select('id'))
  );

  const failed = results.find((r) => r.error || !r.data?.length);
  if (failed) return { ok: false, error: failed.error?.message ?? SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}

/**
 * Takes the picture off the project. The file stays on Cloudinary: deleting
 * there needs a secret key, and a picture removed by mistake can be found
 * again in the Cloudinary media library.
 */
export async function removePlate(id: string): Promise<Result> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from('design_images').delete().eq('id', id).select('id');

  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: SIGNED_OUT };
  refreshSite();
  return { ok: true, data: null };
}
