import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { saveEssay, startCounterpart, translatePiece, trashPiece, unpublishPiece } from '@/app/(admin)/actions';
import Flash from '@/components/admin/Flash';
import ClearFlags from '@/components/admin/ClearFlags';
import { LocalePill, StatusPill, TranslationPill } from '@/components/admin/StatusPills';
import { path } from '@/lib/i18n';
import { toDateInput } from '@/lib/dates';
import { toEditorHtml } from '@/lib/render';
import RichText from '@/components/admin/RichText';
import { SinglePicture } from '@/components/admin/Pictures';
import type { Essay, Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EssayEditor({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; state?: string; error?: string; translated?: string; restored?: string; fresh?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;

  const supabase = await supabaseServer();
  const { data } = await supabase.from('essays').select('*, cover:cover_media_id (*)').eq('id', id).maybeSingle();
  if (!data) notFound();

  const essay = data as Essay;
  const locale = essay.locale as Locale;
  const rtl = locale === 'ar';
  const live = essay.status === 'published';

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
        saved={
          flags.saved
            ? flags.state === 'published'
              ? `Published. It is on the site now.`
              : 'Saved as a draft. It is not on the site yet: press Publish it when you are ready.'
            : flags.restored
              ? 'Put back.'
              : undefined
        }
        note={
          flags.translated
            ? 'Translated. Read it through, then press Publish it.'
            : flags.fresh
              ? 'An empty version in the other language. Write it, then publish it.'
              : essay.translation_state === 'machine'
                ? 'A machine wrote this translation and nobody has read it yet. When you are happy with it, press Publish it.'
                : undefined
        }
        error={flags.error}
      />

      <form action={saveEssay.bind(null, live ? 'publish' : 'save')} className="form">
        <input type="hidden" name="id" value={essay.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="previousSlug" value={essay.slug} />
        <input type="hidden" name="translation_state" value={essay.translation_state} />
        <input type="hidden" name="edited" value="1" />
        <input type="hidden" name="currentStatus" value={essay.status} />
        <input type="hidden" name="previousPublishedAt" value={essay.published_at ?? ''} />

        <div className="actionbar">
          <span className="actionbar__state">
            {live ? (
              <>
                <span className="pill pill--live">live</span>
                <span className="mute">Anyone can read this.</span>
              </>
            ) : (
              <>
                <span className="pill pill--draft">draft</span>
                <span className="mute">Only you can see this.</span>
              </>
            )}
          </span>
          <span className="grow" />
          {live ? (
            <button type="submit" className="primary">
              Save and update the page
            </button>
          ) : (
            <>
              <button type="submit">Save draft</button>
              <button type="submit" formAction={saveEssay.bind(null, 'publish')} className="primary">
                Publish it
              </button>
            </>
          )}
        </div>

        <div className="cols">
          <div className="cols__main">
            <div className="card">
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" type="text" defaultValue={essay.title} dir={rtl ? 'rtl' : 'ltr'} required />
                <small>A word between *asterisks* is set in italic, the way the old titles were.</small>
              </div>

              <div className="field">
                <label htmlFor="excerpt">Summary</label>
                <textarea id="excerpt" name="excerpt" defaultValue={essay.excerpt ?? ''} dir={rtl ? 'rtl' : 'ltr'} rows={2} />
                <small>One or two sentences. Used for search results and shared links.</small>
              </div>
            </div>

            <div className="field">
              <label htmlFor="body">The essay</label>
              <RichText
                name="body"
                defaultValue={toEditorHtml(essay.body, essay.content_format)}
                dir={rtl ? 'rtl' : 'ltr'}
                minHeight="30rem"
              />
            </div>
          </div>

          <aside className="cols__rail">
            <SinglePicture
              target={{ type: 'cover', kind: 'essays', groupId: essay.group_id }}
              initial={essay.cover ?? null}
              locale={locale}
              title="Cover picture"
              hint="Optional. Wide at the top of the essay, and when the link is shared."
            />

            <div className="card">
              <h2 className="card__title">About the essay</h2>

              <div className="field">
                <label htmlFor="category">Kind of essay</label>
                <select id="category" name="category" defaultValue={essay.category}>
                  <option value="general">General</option>
                  <option value="design">Design</option>
                </select>
                <small>What the filter on the essays page sorts by.</small>
              </div>

              <div className="field">
                <label htmlFor="tags">Tags</label>
                <input id="tags" name="tags" type="text" defaultValue={essay.tags.join(', ')} dir={rtl ? 'rtl' : 'ltr'} />
                <small>Separated by commas. They show under the title.</small>
              </div>

              <div className="field">
                <label htmlFor="published_at">Date</label>
                <input id="published_at" name="published_at" type="date" defaultValue={toDateInput(essay.published_at)} />
              </div>
            </div>

            <details className="card drawer">
              <summary>Address and search engines</summary>
              <div className="field">
                <label htmlFor="slug">Address</label>
                <input id="slug" name="slug" type="text" defaultValue={essay.slug} />
                <small>
                  {path(locale, 'essays')}/<strong>{essay.slug}</strong>. Leave it and it follows the title.
                </small>
              </div>
              <div className="field">
                <label htmlFor="seo_title">Title for search engines</label>
                <input id="seo_title" name="seo_title" type="text" defaultValue={essay.seo_title ?? ''} />
                <small>Leave empty to use the title above.</small>
              </div>
              <div className="field">
                <label htmlFor="seo_description">Description for search engines</label>
                <input id="seo_description" name="seo_description" type="text" defaultValue={essay.seo_description ?? ''} />
                <small>Leave empty to use the summary.</small>
              </div>
            </details>
          </aside>
        </div>
      </form>

      <details className="drawer drawer--danger">
        <summary>Take it off the site, or delete it</summary>
        <div className="drawer__body">
          {live && (
            <form action={unpublishPiece} className="drawer__row">
              <input type="hidden" name="kind" value="essays" />
              <input type="hidden" name="id" value={essay.id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="slug" value={essay.slug} />
              <p>Unpublishing keeps everything and takes the page off the site. You can publish it again later.</p>
              <button type="submit">Unpublish it</button>
            </form>
          )}
          <div className="drawer__row">
          <p>Deleting moves it to the trash and off the site. You can put it back from the trash.</p>
        <form action={trashPiece}>
          <input type="hidden" name="kind" value="essays" />
          <input type="hidden" name="id" value={essay.id} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={essay.slug} />
          <button type="submit" className="danger">
            Move it to the trash
          </button>
        </form>
          </div>
        </div>
      </details>
    </>
  );
}
