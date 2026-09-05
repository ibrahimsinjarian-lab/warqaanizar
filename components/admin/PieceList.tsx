import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { createPiece } from '@/app/(admin)/actions';
import Flash from './Flash';
import { LocalePill, StatusPill, TranslationPill } from './StatusPills';

interface Row {
  id: string;
  group_id: string;
  locale: string;
  title: string;
  slug: string;
  status: string;
  translation_state: string;
  published_at: string | null;
  updated_at: string;
}

const WORDS = {
  essays: { one: 'essay', many: 'Essays', blurb: 'Everything she has written, in both languages.' },
  designs: { one: 'project', many: 'Projects', blurb: 'Every project, in both languages.' }
};

export default async function PieceList({
  kind,
  message
}: {
  kind: 'essays' | 'designs';
  message: { saved?: string; error?: string; note?: string };
}) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from(kind)
    .select('id, group_id, locale, title, slug, status, translation_state, published_at, updated_at')
    .order('updated_at', { ascending: false });

  const rows = (data as Row[]) ?? [];
  const words = WORDS[kind];

  // the two language versions of one piece sit together
  const groups = new Map<string, Row[]>();
  rows.forEach((row) => {
    const list = groups.get(row.group_id) ?? [];
    list.push(row);
    groups.set(row.group_id, list);
  });

  return (
    <>
      <div className="page-title">
        <div>
          <h1>{words.many}</h1>
          <p>{words.blurb}</p>
        </div>
        <div className="actions">
          <form action={createPiece}>
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="locale" value="ar" />
            <button type="submit" className="primary">
              New {words.one} in Arabic
            </button>
          </form>
          <form action={createPiece}>
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="locale" value="en" />
            <button type="submit">In English</button>
          </form>
        </div>
      </div>

      <Flash {...message} />
      {error && <div className="note">{error.message}</div>}

      {groups.size === 0 ? (
        <div className="rows">
          <span className="row--empty">
            Nothing yet. Start with a new {words.one} in Arabic, and the English version follows from it.
          </span>
        </div>
      ) : (
        <div className="rows">
          {[...groups.values()].map((versions) => {
            const ar = versions.find((v) => v.locale === 'ar');
            const en = versions.find((v) => v.locale === 'en');
            const lead = ar ?? en!;

            return (
              <div className="row" key={lead.group_id} style={{ gridTemplateColumns: '1fr auto' }}>
                <div>
                  <div className="row__title">
                    <Link href={`/admin/${kind}/${lead.id}`}>{lead.title}</Link>
                  </div>
                  <div className="row__meta">/{lead.slug}</div>
                </div>
                <div className="actions" style={{ padding: 0 }}>
                  {ar && (
                    <Link className="button" href={`/admin/${kind}/${ar.id}`}>
                      <LocalePill locale="ar" />
                      <StatusPill status={ar.status} />
                    </Link>
                  )}
                  {en ? (
                    <Link className="button" href={`/admin/${kind}/${en.id}`}>
                      <LocalePill locale="en" />
                      <TranslationPill state={en.translation_state} />
                      <StatusPill status={en.status} />
                    </Link>
                  ) : (
                    <span className="pill">no English version</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
