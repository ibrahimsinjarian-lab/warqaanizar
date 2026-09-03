'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDate, path, t, type StringKey } from '@/lib/i18n';
import type { Design, Essay, Locale } from '@/lib/types';

type UI = Record<string, string>;

/**
 * Filtering is done with a data attribute on the container and a CSS rule,
 * not by re-rendering the rows. That keeps the scroll reveal classes intact
 * and makes filtering instant.
 */

export function EssayList({
  locale,
  essays,
  ui
}: {
  locale: Locale;
  essays: Essay[];
  ui: UI;
}) {
  const [filter, setFilter] = useState<'all' | 'general' | 'design'>('all');
  const s = (key: StringKey) => t(locale, key, ui);
  const shown = filter === 'all' ? essays.length : essays.filter((e) => e.category === filter).length;

  const buttons: [typeof filter, StringKey][] = [
    ['all', 'allEssays'],
    ['general', 'generalEssays'],
    ['design', 'designEssays']
  ];

  return (
    <div className="essays">
      <aside className="filters" aria-label={s('filter')}>
        <p className="label bracket filters__title">{s('filter')}</p>
        {buttons.map(([value, key]) => (
          <button
            key={value}
            className="filter"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {s(key)}
          </button>
        ))}
        <p className="label" style={{ marginTop: '1rem' }}>
          {s('showing')} {String(shown).padStart(2, '0')} {s('pieces')}
        </p>
      </aside>

      <div className="essaylist" data-filter={filter}>
        {essays.map((essay, i) => (
          <Link
            key={essay.id}
            className="essayrow"
            data-cat={essay.category}
            data-reveal=""
            style={{ ['--d' as string]: `${Math.min(i, 8) * 40}ms` }}
            href={path(locale, `essays/${essay.slug}`)}
          >
            <span className="essayrow__bg" aria-hidden="true" />
            <span className="essayrow__in">
              <span className="essayrow__num">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span className="essayrow__title">{essay.title}</span>
                {essay.tags.length > 0 && (
                  <span className="essayrow__tags">
                    {essay.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <span className="essayrow__date">{formatDate(essay.published_at, locale)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DesignGrid({
  locale,
  designs,
  ui
}: {
  locale: Locale;
  designs: Design[];
  ui: UI;
}) {
  const [filter, setFilter] = useState<'all' | 'interior' | 'architectural'>('all');
  const s = (key: StringKey) => t(locale, key, ui);
  const shown = filter === 'all' ? designs.length : designs.filter((d) => d.category === filter).length;

  const buttons: [typeof filter, StringKey][] = [
    ['all', 'all'],
    ['interior', 'interior'],
    ['architectural', 'architectural']
  ];

  return (
    <>
      <div className="toolbar">
        <p className="label">
          {s('showing')} {String(shown).padStart(2, '0')} {s('projects')}
        </p>
        <div className="filterbar">
          {buttons.map(([value, key]) => (
            <button
              key={value}
              className="filter"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {s(key)}
            </button>
          ))}
        </div>
      </div>

      <div className="designgrid" data-filter={filter} style={{ marginTop: 'clamp(2rem, 5vw, 4rem)' }}>
        {designs.map((design, i) => (
          <Link
            key={design.id}
            className="designcard"
            data-cat={design.category}
            data-reveal=""
            style={{ ['--d' as string]: `${Math.min(i, 8) * 40}ms` }}
            href={path(locale, `designs/${design.slug}`)}
          >
            <div className="designcard__plate" style={{ ['--ar' as string]: ['3/4', '1/1', '4/5'][i % 3] }}>
              <span className="designcard__dot" aria-hidden="true" />
              <div
                className="plate"
                style={{
                  ['--a' as string]: (i * 53) % 360,
                  ['--m' as string]: 55 + ((i * 7) % 25),
                  ...(i % 3 === 1 ? { ['--tone' as string]: 'var(--olive)' } : {})
                }}
              >
                <div className="plate__mark" aria-hidden="true">
                  <svg viewBox="0 0 60 60">
                    <use href="#star8" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="designcard__foot">
              <span className="designcard__name">{design.title}</span>
              <span className="designcard__arrow" aria-hidden="true">
                &#8599;
              </span>
            </div>
            {design.kind && <p className="designcard__tag label">{design.kind}</p>}
          </Link>
        ))}
      </div>
    </>
  );
}
