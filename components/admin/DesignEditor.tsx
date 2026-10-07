import Link from 'next/link';
import { saveDesign, startCounterpart, translatePiece, trashPiece, unpublishPiece } from '@/app/(admin)/actions';
import Flash from './Flash';
import ClearFlags from './ClearFlags';
import { TranslationPill } from './StatusPills';
import { SinglePicture } from './Pictures';
import ProjectBuilder from './ProjectBuilder';
import EditorForm, { SaveBar } from './EditorForm';
import { LinkSpinner, SubmitButton } from './Pending';
import { path } from '@/lib/i18n';
import { toDateInput } from '@/lib/dates';
import type { PlateRow } from '@/app/(admin)/media-actions';
import type { Design, DesignSection, Layout, Locale } from '@/lib/types';

/**
 * The project editor.
 *
 * Writing sits in one column at a readable width; everything about the
 * project rather than in it sits in the rail beside it. There is one
 * bar that changes what readers see, and it is the one place that says
 * whether the page is live.
 */

export type EditorFlags = {
  saved?: string;
  error?: string;
  translated?: string;
  restored?: string;
  fresh?: string;
  unpublished?: string;
  start?: string;
};

/** The messages that arrive in the address, after a step that left the page. */
export function flashFor(flags: EditorFlags, machine: boolean) {
  return {
    saved: flags.saved
      ? 'Saved as a draft. It is not on the site yet: press Publish it when you are ready.'
      : flags.restored
        ? 'Put back from the trash.'
        : flags.unpublished
          ? 'Taken off the site. It is a draft again, and nothing was lost.'
          : undefined,
    note: flags.start
      ? 'Saved as a draft. Add the pictures and a cover below, then press Publish it.'
      : flags.translated
      ? 'Translated. Read it through, then press Publish it.'
      : flags.fresh
        ? 'An empty version in the other language. Write it, then publish it.'
        : machine
          ? 'A machine wrote this translation and nobody has read it yet. When you are happy with it, press Publish it.'
          : undefined,
    error: flags.error
  };
}

export default function DesignEditor({
  design,
  sibling,
  plates,
  sections,
  bodies,
  flags
}: {
  design: Design;
  sibling: { id: string; locale: string } | null;
  plates: PlateRow[];
  sections: DesignSection[];
  bodies: Record<string, string>;
  flags: EditorFlags;
}) {
  const locale = design.locale as Locale;
  const rtl = locale === 'ar';
  const live = design.status === 'published';

  return (
    <div className="editor">
      <header className="ehead">
        <div>
          <p className="crumbs">
            <Link href="/admin/designs">Projects</Link>
            <span aria-hidden="true">/</span>
            <span>{locale === 'ar' ? 'Arabic' : 'English'}</span>
          </p>
          <h1 dir={rtl ? 'rtl' : 'ltr'}>{design.title}</h1>
          <p className="chips">
            <TranslationPill state={design.translation_state} />
          </p>
        </div>

        <div className="ehead__tools">
          {live && (
            <Link className="button button--quiet" href={path(locale, `designs/${design.slug}`)} target="_blank">
              View on the site
            </Link>
          )}
          {sibling ? (
            <Link className="button button--quiet" href={`/admin/designs/${sibling.id}`}>
              <LinkSpinner />
              {sibling.locale === 'ar' ? 'Arabic version' : 'English version'}
            </Link>
          ) : (
            <>
              {locale === 'ar' && (
                <form action={translatePiece}>
                  <input type="hidden" name="kind" value="designs" />
                  <input type="hidden" name="id" value={design.id} />
                  <SubmitButton className="button--quiet" busy="Translating, about half a minute">
                    Translate to English
                  </SubmitButton>
                </form>
              )}
              <form action={startCounterpart}>
                <input type="hidden" name="kind" value="designs" />
                <input type="hidden" name="id" value={design.id} />
                <SubmitButton className="button--quiet" busy="Making the other version">
                  Write the other language myself
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      </header>

      <ClearFlags />
      <Flash {...flashFor(flags, design.translation_state === 'machine')} />

      <EditorForm action={saveDesign}>
        <input type="hidden" name="id" value={design.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="previousSlug" value={design.slug} />
        <input type="hidden" name="translation_state" value={design.translation_state} />
        <input type="hidden" name="edited" value="1" />
        <input type="hidden" name="currentStatus" value={design.status} />
        <input type="hidden" name="previousPublishedAt" value={design.published_at ?? ''} />

        <SaveBar live={live} previewUrl={path(locale, `preview/designs/${design.id}`)} />

        <div className="cols">
          <div className="cols__main">
            <div className="card">
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" type="text" defaultValue={design.title} dir={rtl ? 'rtl' : 'ltr'} required />
              </div>

              <div className="field">
                <label htmlFor="summary">One line about it</label>
                <textarea
                  id="summary"
                  name="summary"
                  defaultValue={design.summary ?? ''}
                  dir={rtl ? 'rtl' : 'ltr'}
                  rows={2}
                />
              </div>
            </div>

            <ProjectBuilder
              groupId={design.group_id}
              locale={locale}
              initialLayout={(design.layout ?? 'slideshow') as Layout}
              initialSections={sections}
              initialPlates={plates}
              bodies={bodies}
            />
          </div>

          <aside className="cols__rail">
            <SinglePicture
              target={{ type: 'cover', kind: 'designs', groupId: design.group_id }}
              initial={design.cover ?? null}
              locale={locale}
              title="Cover picture"
              hint="On the projects grid, and when the link is shared. Both languages share it. Saves the moment you choose it."
            />

            <div className="card">
              <h2 className="card__title">About the project</h2>

              <div className="field">
                <label htmlFor="kind">What it is</label>
                <input id="kind" name="kind" type="text" defaultValue={design.kind ?? ''} dir={rtl ? 'rtl' : 'ltr'} />
                <small>House, school, room decor. It shows under the picture on the grid.</small>
              </div>

              <div className="field">
                <label htmlFor="category">Filter</label>
                <select id="category" name="category" defaultValue={design.category}>
                  <option value="interior">Interior</option>
                  <option value="architectural">Architectural</option>
                </select>
                <small>Which button on the projects page shows it.</small>
              </div>

              <div className="pair">
                <div className="field">
                  <label htmlFor="spec_place">Where</label>
                  <input id="spec_place" name="spec_place" type="text" defaultValue={design.spec_place ?? ''} dir={rtl ? 'rtl' : 'ltr'} />
                </div>
                <div className="field">
                  <label htmlFor="spec_year">Year</label>
                  <input id="spec_year" name="spec_year" type="text" inputMode="numeric" defaultValue={design.spec_year ?? ''} />
                </div>
              </div>

              <div className="field">
                <label htmlFor="spec_status">Stage</label>
                <input id="spec_status" name="spec_status" type="text" defaultValue={design.spec_status ?? ''} dir={rtl ? 'rtl' : 'ltr'} />
                <small>Study, proposal, built.</small>
              </div>

              <div className="field">
                <label htmlFor="published_at">Publish date</label>
                <input id="published_at" name="published_at" type="date" defaultValue={toDateInput(design.published_at)} />
                <small>Sets the order of the projects. Leave it empty and it becomes the day you publish.</small>
              </div>
            </div>

            <details className="card drawer">
              <summary>Address and search engines</summary>
              <div className="field">
                <label htmlFor="slug">Address</label>
                <input id="slug" name="slug" type="text" dir="ltr" defaultValue={design.slug} />
                <small>
                  {path(locale, 'designs')}/<strong>{design.slug}</strong>. If it changes, the old address keeps working.
                </small>
              </div>
              <div className="field">
                <label htmlFor="seo_title">Title for search engines</label>
                <input id="seo_title" name="seo_title" type="text" defaultValue={design.seo_title ?? ''} />
                <small>Leave empty to use the title above.</small>
              </div>
              <div className="field">
                <label htmlFor="seo_description">Description for search engines</label>
                <input id="seo_description" name="seo_description" type="text" defaultValue={design.seo_description ?? ''} />
                <small>Leave empty to use the line about it.</small>
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
              <input type="hidden" name="kind" value="designs" />
              <input type="hidden" name="id" value={design.id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="slug" value={design.slug} />
              <p>Unpublishing keeps everything and takes the page off the site. You can publish it again later.</p>
              <SubmitButton busy="Taking it off the site">Unpublish it</SubmitButton>
            </form>
          )}
          <form action={trashPiece} className="drawer__row">
            <input type="hidden" name="kind" value="designs" />
            <input type="hidden" name="id" value={design.id} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="slug" value={design.slug} />
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
