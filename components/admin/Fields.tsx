'use client';

import { useRef, useState } from 'react';
import { Em } from '@/lib/emphasis';

/**
 * Fields that used to need a rule remembered: a word between asterisks,
 * one thing per line, a label and a value with a bar between them. Each one
 * now shows what it will do, or asks for the parts separately, and still
 * posts the same text the save has always read.
 */

/** Tells the form around it that something changed, for the unsaved warning. */
function announce(el: HTMLElement | null) {
  el?.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ------------------------------------------------------------ asterisks */

export function EmphasisField({
  id,
  name = id,
  label,
  defaultValue,
  dir,
  required,
  hint,
  multiline,
  rows = 3
}: {
  id: string;
  name?: string;
  label: string;
  defaultValue: string;
  dir?: 'rtl' | 'ltr';
  required?: boolean;
  hint?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [text, setText] = useState(defaultValue);
  const marked = text.includes('*');
  const stray = (text.match(/\*/g) ?? []).length % 2 === 1;

  const props = {
    id,
    name,
    dir,
    required,
    defaultValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(e.target.value),
    'aria-describedby': `${id}-hint`
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}
      <small id={`${id}-hint`}>{hint}</small>
      {marked && (
        <p className="shows" dir={dir}>
          <span className="shows__label">Shows as</span> <Em text={text} />
        </p>
      )}
      {stray && <small className="warnline">One asterisk has no partner, so it will show as typed.</small>}
    </div>
  );
}

/* ---------------------------------------------------------- one per line */

export function LineList({
  name,
  label,
  defaultValue,
  dir,
  hint,
  addLabel = 'Add a line'
}: {
  name: string;
  label: string;
  defaultValue: string[];
  dir?: 'rtl' | 'ltr';
  hint?: string;
  addLabel?: string;
}) {
  const box = useRef<HTMLFieldSetElement>(null);
  const keys = useRef(0);
  const [lines, setLines] = useState(() => (defaultValue.length ? defaultValue : ['']).map((text) => ({ key: keys.current++, text })));

  const set = (next: typeof lines) => {
    setLines(next);
    queueMicrotask(() => announce(box.current));
  };

  return (
    <fieldset className="field rowlist" ref={box}>
      <legend>{label}</legend>
      {hint && <small>{hint}</small>}
      <input type="hidden" name={name} value={lines.map((l) => l.text.trim()).filter(Boolean).join('\n')} />
      {lines.map((line, i) => (
        <div className="rowlist__row" key={line.key}>
          <span className="rowlist__num">{i + 1}</span>
          <input
            type="text"
            dir={dir}
            value={line.text}
            aria-label={`${label}, line ${i + 1}`}
            onChange={(e) => setLines(lines.map((l) => (l.key === line.key ? { ...l, text: e.target.value } : l)))}
          />
          <button
            type="button"
            className="icon icon--bad"
            aria-label={`Remove line ${i + 1}`}
            title="Remove"
            onClick={() => set(lines.filter((l) => l.key !== line.key))}
          >
            <Cross />
          </button>
        </div>
      ))}
      <button type="button" className="addsection" onClick={() => set([...lines, { key: keys.current++, text: '' }])}>
        {addLabel}
      </button>
    </fieldset>
  );
}

/* -------------------------------------------------------- label and value */

export function PairRows({
  name,
  label,
  defaultValue,
  dir,
  hint,
  names = ['Label', 'Value'],
  addLabel = 'Add a row'
}: {
  name: string;
  label: string;
  defaultValue: { label: string; value: string }[];
  dir?: 'rtl' | 'ltr';
  hint?: string;
  names?: [string, string];
  addLabel?: string;
}) {
  const box = useRef<HTMLFieldSetElement>(null);
  const keys = useRef(0);
  const [rows, setRows] = useState(() =>
    (defaultValue.length ? defaultValue : [{ label: '', value: '' }]).map((r) => ({ key: keys.current++, ...r }))
  );

  const set = (next: typeof rows) => {
    setRows(next);
    queueMicrotask(() => announce(box.current));
  };
  const edit = (key: number, patch: Partial<{ label: string; value: string }>) =>
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // the save reads "label | value", one per line, as it always has
  const posted = rows
    .filter((r) => r.label.trim() || r.value.trim())
    .map((r) => `${r.label.replace(/\|/g, '/').trim()} | ${r.value.trim()}`)
    .join('\n');

  return (
    <fieldset className="field rowlist" ref={box}>
      <legend>{label}</legend>
      {hint && <small>{hint}</small>}
      <input type="hidden" name={name} value={posted} />
      <div className="rowlist__heads" aria-hidden="true">
        <span>{names[0]}</span>
        <span>{names[1]}</span>
      </div>
      {rows.map((row, i) => (
        <div className="rowlist__row rowlist__row--pair" key={row.key}>
          <input
            type="text"
            dir={dir}
            value={row.label}
            aria-label={`${names[0]}, row ${i + 1}`}
            onChange={(e) => edit(row.key, { label: e.target.value })}
          />
          <input
            type="text"
            dir={dir}
            value={row.value}
            aria-label={`${names[1]}, row ${i + 1}`}
            onChange={(e) => edit(row.key, { value: e.target.value })}
          />
          <button
            type="button"
            className="icon icon--bad"
            aria-label={`Remove row ${i + 1}`}
            title="Remove"
            onClick={() => set(rows.filter((r) => r.key !== row.key))}
          >
            <Cross />
          </button>
        </div>
      ))}
      <button type="button" className="addsection" onClick={() => set([...rows, { key: keys.current++, label: '', value: '' }])}>
        {addLabel}
      </button>
    </fieldset>
  );
}

function Cross() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
