import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { saveEssay, startCounterpart, translatePiece, trashPiece } from '@/app/(admin)/actions';
import Flash from '@/components/admin/Flash';
import ClearFlags from '@/components/admin/ClearFlags';
import { LocalePill, StatusPill, TranslationPill } from '@/components/admin/StatusPills';
import { path } from '@/lib/i18n';
import { toDateInput } from '@/lib/dates';
import type { Essay, Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EssayEditor({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; translated?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;

  const supabase = await supabaseServer();
  const { data } = await supabase.from('essays').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();

  const essay = data as Essay;
  const locale = essay.locale as Locale;
  const rtl = locale === 'ar';

  const { data: siblingRow } = await supabase
    .from('essays')
    .select('id, locale')
    .eq('group_id', essay.group_id)
    .neq('id', essay.id)
    .maybeSingle();

  return (
    <>
      <div className="page-title">
        <div>
          <h1 dir={rtl ? 'rtl' : 'ltr'}>{essay.title}</h1>
          <p style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <LocalePill locale={locale} />
            <StatusPill status={essay.status} />
            <TranslationPill state={essay.translation_state} />
          </p>
        </div>
        <div className="actions">
          <Link className="button" href={path(locale, `preview/essays/${essay.id}`)} target="_blank">
            Preview
          </Link>
          {essay.status === 'published' && (
            <Link className="button" href={path(locale, `essays/${essay.slug}`)} target="_blank">
              View on the site
            </Link>
          )}
          {siblingRow ? (
            <Link className="button" href={`/admin/essays/${siblingRow.id}`}>
              {siblingRow.locale === 'ar' ? 'Arabic version' : 'English version'}
            </Link>
          ) : (
            <>
              {locale === 'ar' && (
                <form action={translatePiece}>
                  <input type="hidden" name="kind" value="essays" />
                  <input type="hidden" name="id" value={essay.id} />
                  <button type="submit">Translate to English</button>
                </form>
              )}
              <form action={startCounterpart}>
                <input type="hidden" name="kind" value="essays" />
                <input type="hidden" name="id" value={essay.id} />
                <button type="submit">Write the other language myself</button>
              </form>
            </>
          )}
        </div>
      </div>

      <ClearFlags />
      <Flash
        saved={flags.saved ? 'Saved. The page rebuilds within a second.' : undefined}
        note={
          flags.translated
            ? 'Translated. It is a draft until you have read it and pressed publish.'
            : essay.translation_state === 'machine'
              ? 'This English version was translated by a machine and has not been read yet. Saving it marks it as read.'
              : undefined
        }
        error={flags.error}
      />

      <form action={saveEssay} className="form">
        <input type="hidden" name="id" value={essay.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="previousSlug" value={essay.slug} />
        <input type="hidden" name="translation_state" value={essay.translation_state} />
        <input type="hidden" name="edited" value="1" />
        <input type="hidden" name="currentStatus" value={essay.status} />
        <input type="hidden" name="previousPublishedAt" value={essay.published_at ?? ''} />

        <div className="publishbar">
          <span className="publishbar__state">
            {essay.status === 'published' ? (
              <>
                <span className="pill pill--live">live</span>
                <span style={{ color: 'var(--mute)' }}>Anyone can read this.</span>
              </>
            ) : (
              <>
                <span className="pill pill--draft">draft</span>
                <span style={{ color: 'var(--mute)' }}>Only you can see this.</span>
              </>
            )}
          </span>
          <span className="publishbar__grow" />
          <button type="submit" name="intent" value="save">
            Save
          </button>
          {essay.status === 'published' ? (
            <>
              <button type="submit" name="intent" value="unpublish">
                Unpublish
              </button>
              <button type="submit" name="intent" value="publish" className="primary">
                Update the page
              </button>
            </>
          ) : (
            <button type="submit" name="intent" value="publish" className="primary">
              Publish it
            </button>
          )}
        </div>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" defaultValue={essay.title} dir={rtl ? 'rtl' : 'ltr'} required />
          <small>A word between *asterisks* is set in italic, the way the old titles were.</small>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="slug">Address</label>
            <input id="slug" name="slug" type="text" defaultValue={essay.slug} />
            <small>
              {path(locale, 'essays')}/<strong>{essay.slug}</strong>. Leave it and it follows the title.
            </small>
          </div>
          <div className="field">
            <label htmlFor="category">Kind of essay</label>
            <select id="category" name="category" defaultValue={essay.category}>
              <option value="general">General</option>
              <option value="design">Design</option>
            </select>
            <small>This is what the filter on the essays page sorts by.</small>
          </div>
        </div>

        <div className="field">
          <label htmlFor="excerpt">Summary</label>
          <textarea
            id="excerpt"
            name="excerpt"
            defaultValue={essay.excerpt ?? ''}
            dir={rtl ? 'rtl' : 'ltr'}
            style={{ minHeight: '5rem' }}
          />
          <small>One or two sentences. Used for search results and shared links.</small>
        </div>

        <div className="field">
          <label htmlFor="body">The essay</label>
          <textarea
            id="body"
            name="body"
            className="body"
            defaultValue={essay.body}
            dir={rtl ? 'rtl' : 'ltr'}
            required
          />
          <small>
            Markdown: a blank line starts a new paragraph, ## makes a heading, &gt; makes a pulled quote,
            *word* makes italic.
          </small>
        </div>

        <div className="panel">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="published_at">Date</label>
              <input id="published_at" name="published_at" type="date" defaultValue={toDateInput(essay.published_at)} />
            </div>
          </div>

          <div className="field" style={{ marginTop: '1.1rem' }}>
            <label htmlFor="tags">Tags</label>
            <input id="tags" name="tags" type="text" defaultValue={essay.tags.join(', ')} dir={rtl ? 'rtl' : 'ltr'} />
            <small>Separated by commas. They show under the title.</small>
          </div>

          <div className="grid-2" style={{ marginTop: '1.1rem' }}>
            <div className="field">
              <label htmlFor="seo_title">Title for search engines</label>
              <input id="seo_title" name="seo_title" type="text" defaultValue={essay.seo_title ?? ''} />
              <small>Leave empty to use the title above.</small>
            </div>
            <div className="field">
              <label htmlFor="seo_description">Description for search engines</label>
              <input
                id="seo_description"
                name="seo_description"
                type="text"
                defaultValue={essay.seo_description ?? ''}
              />
              <small>Leave empty to use the summary.</small>
            </div>
          </div>
        </div>

      </form>

      <details className="danger-zone">
        <summary>Delete this essay</summary>
        <p>
          It moves to the trash and comes off the site straight away. You can put it back from the
          trash afterwards.
        </p>
        <form action={trashPiece}>
          <input type="hidden" name="kind" value="essays" />
          <input type="hidden" name="id" value={essay.id} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={essay.slug} />
          <button type="submit" className="danger">
            Yes, move it to the trash
          </button>
        </form>
      </details>
    </>
  );
}
