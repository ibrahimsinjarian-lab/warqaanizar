import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { purgePiece, restorePiece } from '@/app/(admin)/actions';
import { LocalePill } from './StatusPills';

interface Row {
  id: string;
  locale: string;
  title: string;
  slug: string;
  deleted_at: string;
}

const WORDS = { essays: 'essays', designs: 'projects' };

export default async function Trash({
  kind,
  message
}: {
  kind: 'essays' | 'designs';
  message?: string;
}) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from(kind)
    .select('id, locale, title, slug, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  const rows = (data as Row[]) ?? [];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Trash</h1>
          <p>Nothing here is on the site. It stays until you empty it.</p>
        </div>
        <div className="actions">
          <Link className="button" href={`/admin/${kind}`}>
            Back to {WORDS[kind]}
          </Link>
        </div>
      </div>

      {message && <div className="note note--ok">{message}</div>}

      {rows.length === 0 ? (
        <div className="rows">
          <span className="row--empty">The trash is empty.</span>
        </div>
      ) : (
        <div className="rows">
          {rows.map((row) => (
            <div className="row" key={row.id} style={{ gridTemplateColumns: '1fr auto auto' }}>
              <div>
                <div className="row__title">{row.title}</div>
                <div className="row__meta">
                  /{row.slug} . removed {new Date(row.deleted_at).toLocaleDateString('en-GB')}
                </div>
              </div>
              <LocalePill locale={row.locale} />
              <div className="actions" style={{ padding: 0 }}>
                <form action={restorePiece}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit">Put it back</button>
                </form>
                <details className="danger-zone" style={{ margin: 0, padding: '.2rem .5rem' }}>
                  <summary>Delete forever</summary>
                  <p>This cannot be undone.</p>
                  <form action={purgePiece}>
                    <input type="hidden" name="kind" value={kind} />
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="danger">
                      Delete it forever
                    </button>
                  </form>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
