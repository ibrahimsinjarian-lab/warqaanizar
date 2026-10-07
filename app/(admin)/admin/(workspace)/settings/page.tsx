import type { Metadata } from 'next';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { saveSettings } from '@/app/(admin)/actions';
import Flash from '@/components/admin/Flash';
import ClearFlags from '@/components/admin/ClearFlags';
import RichText from '@/components/admin/RichText';
import EditorForm, { SaveBar } from '@/components/admin/EditorForm';
import { EmphasisField, LineList, PairRows } from '@/components/admin/Fields';
import { SinglePicture } from '@/components/admin/Pictures';
import { toEditorHtml } from '@/lib/render';
import type { Locale, SiteSettings } from '@/lib/types';

export const metadata: Metadata = { title: 'Front page' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ locale?: string; error?: string }>;
}) {
  const params = await searchParams;
  const locale: Locale = params.locale === 'en' ? 'en' : 'ar';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const supabase = await supabaseServer();
  let { data, error } = await supabase
    .from('site_settings')
    .select('*, portrait:portrait_media_id (*)')
    .eq('locale', locale)
    .maybeSingle();
  // before 011 there is no portrait column
  if (error) ({ data } = await supabase.from('site_settings').select('*').eq('locale', locale).maybeSingle());
  const s = (data ?? {}) as SiteSettings;

  return (
    <div className="editor">
      <div className="page-title">
        <div>
          <h1>Front page</h1>
          <p>Every word on the home page, and the contact details. Each language has its own words.</p>
        </div>
        <div className="actions">
          <Link className="button button--quiet" href={locale === 'ar' ? '/ar' : '/'} target="_blank">
            Look at the front page
          </Link>
        </div>
      </div>

      <div className="tabs">
        <Link href="/admin/settings?locale=ar" aria-current={locale === 'ar' ? 'page' : undefined}>
          العربية
        </Link>
        <Link href="/admin/settings?locale=en" aria-current={locale === 'en' ? 'page' : undefined}>
          English
        </Link>
      </div>

      <ClearFlags />
      <Flash error={params.error} />

      {/* the key starts a fresh form for each language, so nothing typed in one leaks into the other */}
      <EditorForm action={saveSettings} key={locale}>
        <input type="hidden" name="locale" value={locale} />

        <SaveBar live plain />

        <div className="cols">
          <div className="cols__main">
            <div className="card">
              <h2 className="card__title">At the top</h2>
              <div className="grid-3">
                <div className="field">
                  <label htmlFor="display_name">Her name</label>
                  <input id="display_name" name="display_name" type="text" dir={dir} defaultValue={s.display_name ?? ''} />
                </div>
                <div className="field">
                  <label htmlFor="roles">Under the name</label>
                  <input id="roles" name="roles" type="text" dir={dir} defaultValue={s.roles ?? ''} />
                </div>
                <div className="field">
                  <label htmlFor="location">City</label>
                  <input id="location" name="location" type="text" dir={dir} defaultValue={s.location ?? ''} />
                </div>
              </div>

              <EmphasisField
                id="statement"
                label="The statement"
                multiline
                rows={3}
                dir={dir}
                defaultValue={s.statement ?? ''}
                hint="The large line under her name. Put a word between *asterisks* to give it the accent colour."
              />

              <LineList
                name="statement_aside"
                label="The words beside it"
                defaultValue={s.statement_aside ?? []}
                dir={dir}
                hint="Four short words work best. The last one takes the accent colour."
                addLabel="Add a word"
              />

              <LineList
                name="marquee"
                label="The moving line"
                defaultValue={s.marquee ?? []}
                dir={dir}
                hint="Each idea scrolls across under the statement, one after another."
                addLabel="Add an idea"
              />
            </div>

            <div className="card">
              <h2 className="card__title">About</h2>

              <EmphasisField
                id="about_quote"
                label="The large line"
                multiline
                rows={2}
                dir={dir}
                defaultValue={s.about_quote ?? ''}
                hint="Put a word between *asterisks* to set it in italic."
              />

              <div className="field">
                <label id="about-label">The paragraphs</label>
                <RichText name="about" labelledBy="about-label" defaultValue={toEditorHtml(s.about, s.content_format)} dir={dir} minHeight="12rem" />
              </div>

              <PairRows
                name="about_meta"
                label="The details underneath"
                defaultValue={s.about_meta ?? []}
                dir={dir}
                names={['Label', 'Value']}
                hint="For example: based in, and Baghdad, Iraq."
                addLabel="Add a detail"
              />

              <div className="field">
                <label htmlFor="portrait_tag">Label on the portrait</label>
                <input id="portrait_tag" name="portrait_tag" type="text" dir={dir} defaultValue={s.portrait_tag ?? ''} />
              </div>
            </div>

            <div className="card">
              <h2 className="card__title">The two doors</h2>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="essays_note">Under Essays</label>
                  <textarea id="essays_note" name="essays_note" dir={dir} defaultValue={s.essays_note ?? ''} rows={3} />
                </div>
                <div className="field">
                  <label htmlFor="designs_note">Under Projects</label>
                  <textarea id="designs_note" name="designs_note" dir={dir} defaultValue={s.designs_note ?? ''} rows={3} />
                </div>
                <div className="field">
                  <label htmlFor="essays_crossnav">Line at the foot of the essays page</label>
                  <input id="essays_crossnav" name="essays_crossnav" type="text" dir={dir} defaultValue={s.essays_crossnav ?? ''} />
                </div>
                <div className="field">
                  <label htmlFor="designs_crossnav">Line at the foot of the projects page</label>
                  <input id="designs_crossnav" name="designs_crossnav" type="text" dir={dir} defaultValue={s.designs_crossnav ?? ''} />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="card__title">Contact</h2>

              <EmphasisField
                id="contact_title"
                label="The heading"
                multiline
                rows={2}
                dir={dir}
                defaultValue={s.contact_title ?? ''}
                hint="A new line breaks the heading in two. Put words between *asterisks* to set them in italic."
              />

              <div className="grid-3">
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" dir="ltr" defaultValue={s.email ?? ''} />
                  <small>Leave empty and it is hidden.</small>
                </div>
                <div className="field">
                  <label htmlFor="whatsapp">WhatsApp</label>
                  <input id="whatsapp" name="whatsapp" type="text" inputMode="tel" dir="ltr" defaultValue={s.whatsapp ?? ''} />
                  <small>Leave empty and it is hidden.</small>
                </div>
                <div className="field">
                  <label htmlFor="instagram">Instagram</label>
                  <input id="instagram" name="instagram" type="text" dir="ltr" defaultValue={s.instagram ?? ''} />
                  <small>Just the handle, without the at sign.</small>
                </div>
              </div>
            </div>
          </div>

          <aside className="cols__rail">
            <SinglePicture
              target={{ type: 'portrait' }}
              initial={s.portrait ?? null}
              title="Portrait"
              hint="The picture in the arch beside About, on the Arabic and English pages alike. A tall picture works best. Saves the moment you choose it."
            />
          </aside>
        </div>
      </EditorForm>
    </div>
  );
}
