import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { deletePiece, saveDesign, translatePiece } from '@/app/(admin)/actions';
import Flash from '@/components/admin/Flash';
import { LocalePill, StatusPill, TranslationPill } from '@/components/admin/StatusPills';
import { path } from '@/lib/i18n';
import type { Design, Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

function dateValue(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export default async function DesignEditor({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; translated?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;

  const supabase = await supabaseServer();
  const { data } = await supabase.from('designs').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();

  const design = data as Design;
  const locale = design.locale as Locale;
  const rtl = locale === 'ar';

  const { data: siblingRow } = await supabase
    .from('designs')
    .select('id, locale')
    .eq('group_id', design.group_id)
    .neq('id', design.id)
    .maybeSingle();

  return (
    <>
      <div className="page-title">
        <div>
          <h1 dir={rtl ? 'rtl' : 'ltr'}>{design.title}</h1>
          <p style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <LocalePill locale={locale} />
            <StatusPill status={design.status} />
            <TranslationPill state={design.translation_state} />
          </p>
        </div>
        <div className="actions">
          {design.status === 'published' && (
            <Link className="button" href={path(locale, `designs/${design.slug}`)} target="_blank">
              View on the site
            </Link>
          )}
          {siblingRow ? (
            <Link className="button" href={`/admin/designs/${siblingRow.id}`}>
              {siblingRow.locale === 'ar' ? 'Arabic version' : 'English version'}
            </Link>
          ) : (
            locale === 'ar' && (
              <form action={translatePiece}>
                <input type="hidden" name="kind" value="designs" />
                <input type="hidden" name="id" value={design.id} />
                <button type="submit">Translate to English</button>
              </form>
            )
          )}
        </div>
      </div>

      <Flash
        saved={flags.saved ? 'Saved. The page rebuilds within a second.' : undefined}
        note={
          flags.translated
            ? 'Translated. It is a draft until you have read it and pressed publish.'
            : design.translation_state === 'machine'
              ? 'This English version was translated by a machine and has not been read yet. Saving it marks it as read.'
              : undefined
        }
        error={flags.error}
      />

      <form action={saveDesign} className="form">
        <input type="hidden" name="id" value={design.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="previousSlug" value={design.slug} />
        <input type="hidden" name="translation_state" value={design.translation_state} />
        <input type="hidden" name="edited" value="1" />

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" defaultValue={design.title} dir={rtl ? 'rtl' : 'ltr'} required />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="slug">Address</label>
            <input id="slug" name="slug" type="text" defaultValue={design.slug} />
            <small>
              {path(locale, 'designs')}/<strong>{design.slug}</strong>
            </small>
          </div>
          <div className="field">
            <label htmlFor="category">Filter</label>
            <select id="category" name="category" defaultValue={design.category}>
              <option value="interior">Interior</option>
              <option value="architectural">Architectural</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="summary">One line about it</label>
          <textarea
            id="summary"
            name="summary"
            defaultValue={design.summary ?? ''}
            dir={rtl ? 'rtl' : 'ltr'}
            style={{ minHeight: '4.5rem' }}
          />
        </div>

        <div className="field">
          <label htmlFor="concept">The concept</label>
          <textarea
            id="concept"
            name="concept"
            className="body"
            style={{ minHeight: '14rem' }}
            defaultValue={design.concept}
            dir={rtl ? 'rtl' : 'ltr'}
          />
        </div>

        <div className="field">
          <label htmlFor="execution">How it was executed</label>
          <textarea
            id="execution"
            name="execution"
            className="body"
            style={{ minHeight: '11rem' }}
            defaultValue={design.execution}
            dir={rtl ? 'rtl' : 'ltr'}
          />
        </div>

        <div className="panel">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="kind">What it is</label>
              <input id="kind" name="kind" type="text" defaultValue={design.kind ?? ''} dir={rtl ? 'rtl' : 'ltr'} />
              <small>House, school, room decor. This shows under the picture on the grid.</small>
            </div>
            <div className="field">
              <label htmlFor="spec_place">Where</label>
              <input
                id="spec_place"
                name="spec_place"
                type="text"
                defaultValue={design.spec_place ?? ''}
                dir={rtl ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '1.1rem' }}>
            <div className="field">
              <label htmlFor="spec_year">Year</label>
              <input id="spec_year" name="spec_year" type="text" defaultValue={design.spec_year ?? ''} />
            </div>
            <div className="field">
              <label htmlFor="spec_status">Stage</label>
              <input
                id="spec_status"
                name="spec_status"
                type="text"
                defaultValue={design.spec_status ?? ''}
                dir={rtl ? 'rtl' : 'ltr'}
              />
              <small>Study, proposal, built.</small>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={design.status}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '1.1rem' }}>
            <div className="field">
              <label htmlFor="published_at">Date</label>
              <input id="published_at" name="published_at" type="date" defaultValue={dateValue(design.published_at)} />
            </div>
            <div className="field">
              <label htmlFor="seo_title">Title for search engines</label>
              <input id="seo_title" name="seo_title" type="text" defaultValue={design.seo_title ?? ''} />
            </div>
            <div className="field">
              <label htmlFor="seo_description">Description for search engines</label>
              <input
                id="seo_description"
                name="seo_description"
                type="text"
                defaultValue={design.seo_description ?? ''}
              />
            </div>
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="primary">
            Save
          </button>
        </div>
      </form>

      <form action={deletePiece} style={{ marginTop: '2.5rem' }}>
        <input type="hidden" name="kind" value="designs" />
        <input type="hidden" name="id" value={design.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="slug" value={design.slug} />
        <button type="submit" className="danger">
          Delete this project
        </button>
      </form>
    </>
  );
}
