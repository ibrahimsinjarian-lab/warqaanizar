import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { restorePiece } from '@/app/(admin)/actions';
import Flash from './Flash';
import ClearFlags from './ClearFlags';
import PieceRows, { type Group } from './PieceRows';
import { LinkSpinner, SubmitButton } from './Pending';

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
  deleted_at?: string | null;
}

const WORDS = {
  essays: { one: 'essay', many: 'Essays', blurb: 'Everything she has written, in both languages.' },
  designs: { one: 'project', many: 'Projects', blurb: 'Every project, in both languages.' }
};

export default async function PieceList({
  kind,
  message,
  trashed
}: {
  kind: 'essays' | 'designs';
  message: { saved?: string; error?: string; note?: string };
  /** the id of a piece just moved to the trash, to offer it back */
  trashed?: string;
}) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from(kind).select('*').order('updated_at', { ascending: false });

  const rows = ((data as Row[]) ?? []).filter((r) => !r.deleted_at);
  const words = WORDS[kind];

  // the two language versions of one piece sit together
  const byGroup = new Map<string, Row[]>();
  rows.forEach((row) => byGroup.set(row.group_id, [...(byGroup.get(row.group_id) ?? []), row]));

  const groups: Group[] = [...byGroup.values()].map((versions) => {
    const ar = versions.find((v) => v.locale === 'ar') ?? null;
    const en = versions.find((v) => v.locale === 'en') ?? null;
    const pick = (v: Row | null) =>
      v && { id: v.id, title: v.title, slug: v.slug, status: v.status, translation_state: v.translation_state };
    return {
      key: versions[0].group_id,
      ar: pick(ar),
      en: pick(en),
      updated: versions.map((v) => v.updated_at).sort().at(-1) ?? '',
      published: versions.map((v) => v.published_at ?? '').sort().at(-1) ?? ''
    };
  });

  return (
    <>
      <div className="page-title">
        <div>
          <h1>{words.many}</h1>
          <p>{words.blurb}</p>
        </div>
        <div className="actions">
          <Link className="button button--quiet" href={`/admin/${kind}/trash`}>
            Trash
          </Link>
          <Link className="button button--primary" href={`/admin/${kind}/new`}>
            New {words.one}
            <LinkSpinner />
          </Link>
        </div>
      </div>

      <ClearFlags />
      {trashed && (
        <form action={restorePiece} className="note note--ok note--row" style={{ marginBottom: '1.2rem' }}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={trashed} />
          <span>Moved to the trash, and off the site.</span>
          <SubmitButton className="linkish" busy="Putting it back">
            Undo
          </SubmitButton>
        </form>
      )}
      <Flash {...message} />
      {error && <div className="note note--bad">{error.message}</div>}

      {groups.length === 0 ? (
        <div className="rows">
          <span className="row--empty">
            Nothing yet. Start with a new {words.one} in Arabic, and the English version follows from it.
          </span>
        </div>
      ) : (
        <PieceRows kind={kind} groups={groups} />
      )}
    </>
  );
}
