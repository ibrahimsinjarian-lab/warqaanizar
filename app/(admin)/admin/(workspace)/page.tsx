import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { StatusPill, TranslationPill, LocalePill } from '@/components/admin/StatusPills';

export const dynamic = 'force-dynamic';

interface Piece {
  id: string;
  locale: string;
  title: string;
  slug: string;
  status: string;
  translation_state: string;
  updated_at: string;
}

async function recent(kind: 'essays' | 'designs'): Promise<Piece[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from(kind)
    .select('id, locale, title, slug, status, translation_state, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(6);
  return (data as Piece[]) ?? [];
}

function List({ kind, items }: { kind: 'essays' | 'designs'; items: Piece[] }) {
  if (items.length === 0) {
    return (
      <div className="rows">
        <span className="row--empty">Nothing here yet.</span>
      </div>
    );
  }
  return (
    <div className="rows">
      {items.map((item) => (
        <div className="row" key={item.id}>
          <div>
            <div className="row__title">
              <Link href={`/admin/${kind}/${item.id}`}>{item.title}</Link>
            </div>
            <div className="row__meta">/{item.slug}</div>
          </div>
          <LocalePill locale={item.locale} />
          <TranslationPill state={item.translation_state} />
          <StatusPill status={item.status} />
        </div>
      ))}
    </div>
  );
}

export default async function Overview() {
  const [essays, designs] = await Promise.all([recent('essays'), recent('designs')]);

  const waiting = [...essays, ...designs].filter((p) => p.translation_state === 'machine').length;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Overview</h1>
          <p>Everything you have written, and what is waiting for you.</p>
        </div>
        <div className="actions">
          <Link className="button button--primary" href="/admin/essays/new">
            New essay
          </Link>
          <Link className="button" href="/admin/designs/new">
            New project
          </Link>
        </div>
      </div>

      {waiting > 0 && (
        <div className="note" style={{ marginBottom: '1.4rem' }}>
          {waiting === 1 ? 'One English translation is' : `${waiting} English translations are`} waiting
          to be read before publishing.
        </div>
      )}

      <h2 className="section-title">Recent essays</h2>
      <List kind="essays" items={essays} />

      <h2 className="section-title">Recent projects</h2>
      <List kind="designs" items={designs} />
    </>
  );
}
