'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createDraft, publishDraft, saveDraft } from '@/app/(admin)/wizard-actions';
import type { Locale } from '@/lib/types';

type Kind = 'essays' | 'designs';
type Values = Record<string, string>;

interface Field {
  name: string;
  label: string;
  hint?: string;
  type: 'text' | 'area' | 'body' | 'select';
  options?: [string, string][];
  required?: boolean;
  rows?: number;
}

interface Step {
  title: string;
  hint: string;
  fields: Field[];
}

const STEPS: Record<Kind, Step[]> = {
  essays: [
    {
      title: 'What are you writing?',
      hint: 'Just the title for now. Everything after this can be changed later.',
      fields: [{ name: 'title', label: 'Title', type: 'text', required: true }]
    },
    {
      title: 'Write it',
      hint: 'A blank line starts a new paragraph. ## makes a heading, > makes a pulled quote, *word* makes italic.',
      fields: [{ name: 'body', label: 'The essay', type: 'body', required: true }]
    },
    {
      title: 'A few details',
      hint: 'All of these are optional, and all of them can wait.',
      fields: [
        { name: 'excerpt', label: 'One or two sentences about it', type: 'area', rows: 3 },
        {
          name: 'category',
          label: 'Which filter does it belong under?',
          type: 'select',
          options: [
            ['general', 'General essays'],
            ['design', 'Design essays']
          ]
        },
        { name: 'tags', label: 'Tags', hint: 'Separated by commas.', type: 'text' }
      ]
    }
  ],
  designs: [
    {
      title: 'What is the project?',
      hint: 'Just the name for now.',
      fields: [{ name: 'title', label: 'Name of the project', type: 'text', required: true }]
    },
    {
      title: 'In one line',
      hint: 'What someone should understand before they scroll.',
      fields: [
        { name: 'summary', label: 'One line about it', type: 'area', rows: 3 },
        { name: 'kind', label: 'What it is', hint: 'House, school, room decor.', type: 'text' },
        {
          name: 'category',
          label: 'Which filter does it belong under?',
          type: 'select',
          options: [
            ['interior', 'Interior'],
            ['architectural', 'Architectural']
          ]
        }
      ]
    },
    {
      title: 'The thinking',
      hint: 'The idea it came from, and what happened when it was built.',
      fields: [
        { name: 'concept', label: 'The concept', type: 'body', rows: 10 },
        { name: 'execution', label: 'How it was executed', type: 'body', rows: 8 }
      ]
    },
    {
      title: 'Where and when',
      hint: 'These show in the row of details on the project page.',
      fields: [
        { name: 'spec_place', label: 'Where', type: 'text' },
        { name: 'spec_year', label: 'Year', type: 'text' },
        { name: 'spec_status', label: 'Stage', hint: 'Study, proposal, built.', type: 'text' }
      ]
    }
  ]
};

const WORDS: Record<Kind, { one: string; back: string }> = {
  essays: { one: 'essay', back: '/admin/essays' },
  designs: { one: 'project', back: '/admin/designs' }
};

function storageKey(kind: Kind) {
  return `warqaa-wizard-${kind}`;
}

export default function Wizard({ kind }: { kind: Kind }) {
  const steps = STEPS[kind];
  const words = WORDS[kind];

  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [step, setStep] = useState(0);
  const [id, setId] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>('ar');
  const [values, setValues] = useState<Values>({ category: kind === 'essays' ? 'general' : 'interior' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ url: string } | null>(null);

  const dirty = useRef(false);

  /* ---------- remember everything, even a refresh mid sentence ---------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(kind));
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          setStep(Math.min(Number(saved.step) || 0, steps.length));
          setId(saved.id ?? null);
          setLocale(saved.locale === 'en' ? 'en' : 'ar');
          setValues(saved.values ?? {});
          setRestored(Boolean(saved.values && Object.keys(saved.values).length));
        }
      }
    } catch {
      // storage blocked, the wizard still works, it just forgets
    }
    setReady(true);
  }, [kind, steps.length]);

  useEffect(() => {
    if (!ready) return;
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey(kind), JSON.stringify({ step, id, locale, values, at: Date.now() }));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [ready, kind, step, id, locale, values]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  /* ---------- moving between steps ---------- */

  const set = (name: string, value: string) => {
    dirty.current = true;
    setValues((v) => ({ ...v, [name]: value }));
  };

  /** ED 03. The remembered piece is gone: keep the words, forget the row. */
  const startOver = () => {
    setId(null);
    setError(null);
    setDone(null);
  };

  const clearAll = () => {
    try {
      localStorage.removeItem(storageKey(kind));
    } catch {
      /* ignore */
    }
    dirty.current = false;
  };

  async function next() {
    setError(null);
    const current = steps[step];

    const missing = current.fields.find((f) => f.required && !(values[f.name] ?? '').trim());
    if (missing) {
      setError(`${missing.label} is needed before you can go on.`);
      return;
    }

    setBusy(true);
    try {
      let pieceId = id;

      if (!pieceId) {
        const created = await createDraft(kind, locale, values.title ?? '');
        if (!created.ok) {
          setError(created.error);
          return;
        }
        pieceId = created.data.id;
        setId(pieceId);
      }

      const saved = await saveDraft(kind, pieceId, locale, values);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }

      dirty.current = false;
      setStep((s) => Math.min(s + 1, steps.length));
    } finally {
      setBusy(false);
    }
  }

  async function finish(publish: boolean) {
    if (!id) return;
    setError(null);
    setBusy(true);
    try {
      const saved = await saveDraft(kind, id, locale, values);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      if (!publish) {
        clearAll();
        window.location.href = `/admin/${kind}/${id}?saved=1`;
        return;
      }
      const published = await publishDraft(kind, id, locale);
      if (!published.ok) {
        setError(published.error);
        return;
      }
      clearAll();
      setDone({ url: published.data.url });
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <p style={{ color: 'var(--mute)' }}>One moment.</p>;

  /* ---------- published ---------- */

  if (done) {
    return (
      <div className="wizard">
        <div className="panel" style={{ display: 'grid', gap: '1rem', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>It is live.</h1>
          <p style={{ color: 'var(--mute)', margin: '0 auto' }}>
            The page is on the site now. It can still be changed at any time.
          </p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <a className="button button--primary" href={done.url} target="_blank" rel="noopener">
              Look at it
            </a>
            <Link className="button" href={`/admin/${kind}/${id}`}>
              Keep editing
            </Link>
            <Link className="button" href={words.back}>
              Done
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onReview = step >= steps.length;
  const current = steps[Math.min(step, steps.length - 1)];
  const wordCount = (values.body ?? values.concept ?? '').trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="wizard">
      <div className="wizard__rail" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s.title} className={`wizard__tick${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`} />
        ))}
        <span className={`wizard__tick${onReview ? ' is-now' : ''}`} />
      </div>

      <p className="eyebrow">
        Step {Math.min(step + 1, steps.length + 1)} of {steps.length + 1}
        {id && <span className="wizard__kept"> . kept safe, you can close this</span>}
      </p>

      {restored && (
        <div className="note" style={{ marginBottom: '1rem', display: 'grid', gap: '.6rem' }}>
          <span>Picking up where you left off.</span>
          <span className="actions" style={{ padding: 0 }}>
            <button type="button" onClick={() => setRestored(false)}>
              Carry on with this one
            </button>
            <button
              type="button"
              onClick={() => {
                clearAll();
                window.location.reload();
              }}
            >
              {id ? 'Leave it as a draft and start a new one' : 'Start again'}
            </button>
          </span>
        </div>
      )}

      {onReview ? (
        <>
          <h1 className="wizard__title">Ready?</h1>
          <p className="wizard__hint">
            Publishing puts it on the site straight away. Saving keeps it private until you come back.
          </p>

          <div className="panel wizard__review">
            <div>
              <span className="eyebrow">Title</span>
              <p dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ fontSize: '1.15rem' }}>
                {values.title}
              </p>
            </div>
            <div>
              <span className="eyebrow">Language</span>
              <p>{locale === 'ar' ? 'العربية' : 'English'}</p>
            </div>
            {wordCount > 0 && (
              <div>
                <span className="eyebrow">Length</span>
                <p>
                  {wordCount} words, about {Math.max(1, Math.round(wordCount / 200))} minutes to read
                </p>
              </div>
            )}
          </div>

          {error && <div className="note">{error}</div>}

          <div className="wizard__nav">
            <button type="button" onClick={() => setStep(step - 1)} disabled={busy}>
              Back
            </button>
            <span style={{ flex: 1 }} />
            <button type="button" onClick={() => finish(false)} disabled={busy}>
              Save without publishing
            </button>
            <button type="button" className="primary" onClick={() => finish(true)} disabled={busy}>
              {busy ? 'Working' : 'Publish it'}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="wizard__title">{current.title}</h1>
          <p className="wizard__hint">{current.hint}</p>

          {step === 0 && (
            <div className="field" style={{ marginBottom: '1.2rem' }}>
              <label>Which language are you writing in?</label>
              <div className="segmented">
                <button
                  type="button"
                  aria-pressed={locale === 'ar'}
                  onClick={() => setLocale('ar')}
                  disabled={Boolean(id)}
                >
                  العربية
                </button>
                <button
                  type="button"
                  aria-pressed={locale === 'en'}
                  onClick={() => setLocale('en')}
                  disabled={Boolean(id)}
                >
                  English
                </button>
              </div>
              <small>
                {id
                  ? 'The language is set once the piece exists.'
                  : 'Arabic pieces can be translated to English afterwards, with one button.'}
              </small>
            </div>
          )}

          <div className="form">
            {current.fields.map((field) => (
              <div className="field" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>

                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    value={values[field.name] ?? field.options?.[0]?.[0] ?? ''}
                    onChange={(e) => set(field.name, e.target.value)}
                  >
                    {field.options?.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'text' ? (
                  <input
                    id={field.name}
                    type="text"
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                    value={values[field.name] ?? ''}
                    onChange={(e) => set(field.name, e.target.value)}
                    autoFocus={field.required}
                  />
                ) : (
                  <textarea
                    id={field.name}
                    className={field.type === 'body' ? 'body' : undefined}
                    rows={field.rows}
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                    value={values[field.name] ?? ''}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                )}

                {field.hint && <small>{field.hint}</small>}
              </div>
            ))}
          </div>

          {current.fields.some((f) => f.type === 'body') && wordCount > 0 && (
            <p className="wizard__count">{wordCount} words so far</p>
          )}

          {error && (
            <div className="note" style={{ marginTop: '1rem', display: 'grid', gap: '.6rem' }}>
              <span>{error}</span>
              {id && (
                <span className="actions" style={{ padding: 0 }}>
                  <button type="button" onClick={startOver}>
                    Start a new piece, keeping what I have typed
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="wizard__nav">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} disabled={busy}>
                Back
              </button>
            ) : (
              <Link className="button" href={words.back}>
                Cancel
              </Link>
            )}
            <span style={{ flex: 1 }} />
            <button type="button" className="primary" onClick={next} disabled={busy}>
              {busy ? 'Saving' : step === steps.length - 1 ? 'Almost done' : 'Next'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
