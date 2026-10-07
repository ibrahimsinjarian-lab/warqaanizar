'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LocalePill, StatusPill, TranslationPill } from './StatusPills';

/**
 * The list of essays or projects, with a search box and a choice of order.
 * The whole row opens the piece; the two small buttons on the right open a
 * particular language.
 */

type Version = { id: string; title: string; slug: string; status: string; translation_state: string } | null;
export type Group = { key: string; ar: Version; en: Version; updated: string; published: string };

type Order = 'updated' | 'published' | 'title';
const ORDER_KEY = 'warqaa.list.order';

export default function PieceRows({ kind, groups }: { kind: 'essays' | 'designs'; groups: Group[] }) {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order>('updated');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ORDER_KEY) as Order | null;
      if (saved === 'updated' || saved === 'published' || saved === 'title') setOrder(saved);
    } catch {}
  }, []);

  const choose = (next: Order) => {
    setOrder(next);
    try {
      localStorage.setItem(ORDER_KEY, next);
    } catch {}
  };

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = groups
    .filter((g) => {
      if (!words.length) return true;
      const text = [g.en?.title, g.ar?.title, g.en?.slug, g.ar?.slug].join(' ').toLowerCase();
      return words.every((w) => text.includes(w));
    })
    .sort((a, b) => {
      if (order === 'title') return (a.en ?? a.ar)!.title.localeCompare((b.en ?? b.ar)!.title);
      if (order === 'published') return b.published.localeCompare(a.published);
      return b.updated.localeCompare(a.updated);
    });

  return (
    <>
      <div className="listtools">
        <label className="listtools__search">
          <span className="sr-only">Search</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" placeholder="Search by title, in either language" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="listtools__order">
          <span>Order</span>
          <select value={order} onChange={(e) => choose(e.target.value as Order)}>
            <option value="updated">Last edited</option>
            <option value="published">Publish date</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>

      <div className="rows">
        {shown.length === 0 && <span className="row--empty">Nothing matches “{query.trim()}”.</span>}
        {shown.map(({ key, ar, en }) => {
          // the editor is in English, so the English title leads and the Arabic one sits under it
          const lead = (en ?? ar)!;
          const other = lead === en ? ar : null;

          return (
            <div className="row row--link" key={key}>
              <div>
                <div className="row__title">
                  <Link href={`/admin/${kind}/${lead.id}`}>{lead.title}</Link>
                </div>
                {other && (
                  <div className="row__second" dir="rtl">
                    {other.title}
                  </div>
                )}
                <div className="row__meta">/{lead.slug}</div>
              </div>
              <div className="row__versions">
                {ar && (
                  <Link className="button version" href={`/admin/${kind}/${ar.id}`} aria-label={`Arabic version, ${ar.status === 'published' ? 'live' : 'draft'}`}>
                    <LocalePill locale="ar" />
                    <StatusPill status={ar.status} />
                  </Link>
                )}
                {en ? (
                  <Link className="button version" href={`/admin/${kind}/${en.id}`} aria-label={`English version, ${en.status === 'published' ? 'live' : 'draft'}`}>
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
    </>
  );
}
