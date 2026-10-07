import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { saveEssay, startCounterpart, translatePiece, trashPiece, unpublishPiece } from '@/app/(admin)/actions';
import Flash from '@/components/admin/Flash';
import ClearFlags from '@/components/admin/ClearFlags';
import { TranslationPill } from '@/components/admin/StatusPills';
import EditorForm, { SaveBar } from '@/components/admin/EditorForm';
import { LinkSpinner, SubmitButton } from '@/components/admin/Pending';
import { flashFor, type EditorFlags } from '@/components/admin/DesignEditor';
import { path } from '@/lib/i18n';
import { toDateInput } from '@/lib/dates';
import { toEditorHtml } from '@/lib/render';
import RichText from '@/components/admin/RichText';
import { SinglePicture } from '@/components/admin/Pictures';
import { EmphasisField } from '@/components/admin/Fields';
import type { Essay, Locale } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EssayEditor({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<EditorFlags>;
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
    <div className="editor">
      <header className="ehead">
        <div>
          <p className="crumbs">
            <Link href="/admin/essays">Essays</Link>
            <span aria-hidden="true">/</span>
            <span>{locale === 'ar' ? 'Arabic' : 'English'}</span>
          </p>
          <h1 dir={rtl ? 'rtl' : 'ltr'}>{essay.title}</h1>
          <p className="chips">
            <TranslationPill state={essay.translation_state} />
          </p>
        </div>
        <div className="ehead__tools">
          {live && (
            <Link className="button button--quiet" href={path(locale, `essays/${essay.slug}`)} target="_blank">
              View on the site
            </Link>
          )}
          {siblingRow ? (
            <Link className="button button--quiet" href={`/admin/essays/${siblingRow.id}`}>
              <LinkSpinner />
              {siblingRow.locale === 'ar' ? 'Arabic version' : 'English version'}
            </Link>
          ) : (
            <>
              {locale === 'ar' && (
                <form action={translatePiece}>
                  <input type="hidden" name="kind" value="essays" />
                  <input type="hidden" name="id" value={essay.id} />
                  <SubmitButton className="button--quiet" busy="Translating, about half a minute">
                    Translate to English
                  </SubmitButton>
                </form>
              )}
              <form action={startCounterpart}>
                <input type="hidden" name="kind" value="essays" />
                <input type="hidden" name="id" value={essay.id} />
                <SubmitButton className="button--quiet" busy="Making the other version">
                  Write the other language myself
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      </header>

      <ClearFlags />
      <Flash {...flashFor(flags, essay.translation_state === 'machine')} />

      <EditorForm action={saveEssay}>
        <input type="hidden" name="id" value={essay.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="previousSlug" value={essay.slug} />
        <input type="hidden" name="translation_state" value={essay.translation_state} />
        <input type="hidden" name="edited" value="1" />
        <input type="hidden" name="currentStatus" value={essay.status} />
        <input type="hidden" name="previousPublishedAt" value={essay.published_at ?? ''} />

        <SaveBar live={live} previewUrl={path(locale, `preview/essays/${essay.id}`)} />

        <div className="cols">
          <div className="cols__main">
            <div className="card">
              <EmphasisField
                id="title"
                label="Title"
                defaultValue={essay.title}
                dir={rtl ? 'rtl' : 'ltr'}
                required
                hint="Put a word between *asterisks* to set it in italic."
              />

              <div className="field">
                <label htmlFor="excerpt">Summary</label>
                <textarea id="excerpt" name="excerpt" defaultValue={essay.excerpt ?? ''} dir={rtl ? 'rtl' : 'ltr'} rows={2} />
                <small>One or two sentences. Used for search results and shared links.</small>
              </div>
            </div>

            <div className="field">
              <label id="body-label">The essay</label>
              <RichText
                name="body"
                labelledBy="body-label"
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
              hint="Optional. Wide at the top of the essay, and when the link is shared. Saves the moment you choose it."
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
                <label htmlFor="published_at">Publish date</label>
                <input id="published_at" name="published_at" type="date" defaultValue={toDateInput(essay.published_at)} />
                <small>Shown on the essay, and sets the order. Leave it empty and it becomes the day you publish.</small>
              </div>
            </div>

            <details className="card drawer">
              <summary>Address and search engines</summary>
              <div className="field">
                <label htmlFor="slug">Address</label>
                <input id="slug" name="slug" type="text" dir="ltr" defaultValue={essay.slug} />
                <small>
                  {path(locale, 'essays')}/<strong>{essay.slug}</strong>. Leave it and it follows the title. If it changes, the old
                  address keeps working.
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
      </EditorForm>

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
              <SubmitButton busy="Taking it off the site">Unpublish it</SubmitButton>
            </form>
          )}
          <form action={trashPiece} className="drawer__row">
            <input type="hidden" name="kind" value="essays" />
            <input type="hidden" name="id" value={essay.id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="slug" value={essay.slug} />
            <p>Deleting moves it to the trash and off the site. You can put it back from the trash.</p>
            <SubmitButton className="danger" busy="Moving it to the trash">
              Move it to the trash
            </SubmitButton>
          </form>
        </div>
      </details>
    </div>
  );
}
