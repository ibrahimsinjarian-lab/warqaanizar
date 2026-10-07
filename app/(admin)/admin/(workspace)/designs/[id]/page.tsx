import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import DesignEditor, { type EditorFlags } from '@/components/admin/DesignEditor';
import { formatOf, toEditorHtml } from '@/lib/render';
import type { PlateRow } from '@/app/(admin)/media-actions';
import type { Design, DesignSection, Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DesignEditorPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<EditorFlags>;
}) {
  const { id } = await params;
  const flags = await searchParams;

  const supabase = await supabaseServer();
  const { data } = await supabase.from('designs').select('*, cover:cover_media_id (*)').eq('id', id).maybeSingle();
  if (!data) notFound();

  const design = data as Design;
  const locale = design.locale as Locale;

  // one round trip each, all at once, so opening a project does not wait three times over
  const [siblings, plateRows, sectionRows] = await Promise.all([
    supabase.from('designs').select('id, locale').eq('group_id', design.group_id).neq('id', design.id).maybeSingle(),
    supabase
      .from('design_images')
      .select('id, caption_ar, caption_en, sort, section_id, media:media_id (*)')
      .eq('group_id', design.group_id)
      .order('sort', { ascending: true }),
    supabase.from('design_sections').select('*').eq('group_id', design.group_id).order('sort', { ascending: true })
  ]);

  const plates = ((plateRows.data ?? []) as unknown as PlateRow[]).filter((p) => p.media);
  const sections = (sectionRows.data ?? []) as DesignSection[];

  // sections carried over from the old fields may be Markdown: open them as HTML
  const bodies = Object.fromEntries(
    sections.map((s) => {
      const text = locale === 'ar' ? s.body_ar : s.body_en;
      return [s.id, toEditorHtml(text, formatOf(text))];
    })
  );

  return (
    <DesignEditor
      design={design}
      sibling={(siblings.data as { id: string; locale: string } | null) ?? null}
      plates={plates}
      sections={sections}
      bodies={bodies}
      flags={flags}
    />
  );
}
