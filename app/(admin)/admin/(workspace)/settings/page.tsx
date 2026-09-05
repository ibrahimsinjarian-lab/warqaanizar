import type { Metadata } from 'next';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { saveSettings } from '@/app/(admin)/actions';
import Flash from '@/components/admin/Flash';
import type { Locale, SiteSettings } from '@/lib/types';

export const metadata: Metadata = { title: 'Front page' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ locale?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const locale: Locale = params.locale === 'en' ? 'en' : 'ar';
  const rtl = locale === 'ar';

  const supabase = await supabaseServer();
  const { data } = await supabase.from('site_settings').select('*').eq('locale', locale).maybeSingle();
  const s = (data ?? {}) as SiteSettings;

  const metaLines = (s.about_meta ?? []).map((row) => `${row.label} | ${row.value}`).join('\n');

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Front page</h1>
          <p>Every word on the home page, and the contact details. No code involved.</p>
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

      <Flash saved={params.saved ? 'Saved. The front page rebuilds within a second.' : undefined} error={params.error} />

      <form action={saveSettings} className="form" dir={rtl ? 'rtl' : 'ltr'}>
        <input type="hidden" name="locale" value={locale} />

        <div className="grid-3">
          <div className="field">
            <label htmlFor="display_name">Her name</label>
            <input id="display_name" name="display_name" type="text" defaultValue={s.display_name ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="roles">Under the name</label>
            <input id="roles" name="roles" type="text" defaultValue={s.roles ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="location">City</label>
            <input id="location" name="location" type="text" defaultValue={s.location ?? ''} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="statement">The statement</label>
          <textarea id="statement" name="statement" defaultValue={s.statement ?? ''} style={{ minHeight: '6rem' }} />
          <small>The large line under her name. A word between *asterisks* takes the accent colour.</small>
        </div>

        <div className="field">
          <label htmlFor="statement_aside">The four words beside it</label>
          <textarea
            id="statement_aside"
            name="statement_aside"
            defaultValue={(s.statement_aside ?? []).join('\n')}
            style={{ minHeight: '6rem' }}
          />
          <small>One per line. The last one is coloured.</small>
        </div>

        <div className="field">
          <label htmlFor="marquee">The moving line</label>
          <textarea id="marquee" name="marquee" defaultValue={(s.marquee ?? []).join('\n')} style={{ minHeight: '6rem' }} />
          <small>One idea per line. They scroll across under the statement.</small>
        </div>

        <h2 className="section-title">About</h2>

        <div className="field">
          <label htmlFor="about_quote">The large line</label>
          <textarea id="about_quote" name="about_quote" defaultValue={s.about_quote ?? ''} style={{ minHeight: '5rem' }} />
        </div>

        <div className="field">
          <label htmlFor="about">The paragraphs</label>
          <textarea id="about" name="about" className="body" style={{ minHeight: '12rem' }} defaultValue={s.about ?? ''} />
          <small>A blank line starts a new paragraph.</small>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="about_meta">The details underneath</label>
            <textarea id="about_meta" name="about_meta" defaultValue={metaLines} style={{ minHeight: '6rem' }} />
            <small>One per line, as label | value. For example: based in | Baghdad, Iraq</small>
          </div>
          <div className="field">
            <label htmlFor="portrait_tag">Label on the portrait</label>
            <input id="portrait_tag" name="portrait_tag" type="text" defaultValue={s.portrait_tag ?? ''} />
          </div>
        </div>

        <h2 className="section-title">The two doors</h2>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="essays_note">Under Essays</label>
            <textarea id="essays_note" name="essays_note" defaultValue={s.essays_note ?? ''} style={{ minHeight: '5rem' }} />
          </div>
          <div className="field">
            <label htmlFor="designs_note">Under Projects</label>
            <textarea id="designs_note" name="designs_note" defaultValue={s.designs_note ?? ''} style={{ minHeight: '5rem' }} />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="essays_crossnav">Line at the foot of the essays page</label>
            <input id="essays_crossnav" name="essays_crossnav" type="text" defaultValue={s.essays_crossnav ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="designs_crossnav">Line at the foot of the projects page</label>
            <input id="designs_crossnav" name="designs_crossnav" type="text" defaultValue={s.designs_crossnav ?? ''} />
          </div>
        </div>

        <h2 className="section-title">Contact</h2>

        <div className="field">
          <label htmlFor="contact_title">The heading</label>
          <textarea id="contact_title" name="contact_title" defaultValue={s.contact_title ?? ''} style={{ minHeight: '4.5rem' }} />
          <small>A new line here breaks the heading in two. Asterisks make the second half italic.</small>
        </div>

        <div className="grid-3">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="text" dir="ltr" defaultValue={s.email ?? ''} />
            <small>Leave empty and it is hidden.</small>
          </div>
          <div className="field">
            <label htmlFor="whatsapp">WhatsApp</label>
            <input id="whatsapp" name="whatsapp" type="text" dir="ltr" defaultValue={s.whatsapp ?? ''} />
            <small>Leave empty and it is hidden.</small>
          </div>
          <div className="field">
            <label htmlFor="instagram">Instagram</label>
            <input id="instagram" name="instagram" type="text" dir="ltr" defaultValue={s.instagram ?? ''} />
            <small>Just the handle, no at sign.</small>
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="primary">
            Save
          </button>
        </div>
      </form>
    </>
  );
}
