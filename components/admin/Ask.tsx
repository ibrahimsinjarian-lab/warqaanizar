'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The editor's own questions, in place of the browser's confirm and prompt
 * boxes. Those cannot say what their buttons do: OK and Cancel had to be
 * explained in the question, sometimes backwards. Here every button says
 * what will happen.
 *
 * ask() can be called from anywhere in the editor. The one AskHost in the
 * layout draws it.
 */

export type AskOptions = {
  title: string;
  body?: string;
  /** the main choice */
  ok: string;
  /** closing without doing anything; Escape does the same */
  cancel?: string;
  /** a second thing to do, beside the main one */
  extra?: string;
  /** the main choice destroys something, so it is red and not the default */
  danger?: boolean;
  /** asks for a line of text, such as a link address */
  input?: { label: string; value?: string; placeholder?: string; type?: 'text' | 'url' };
};

export type Answer = { choice: 'ok' | 'extra'; value: string } | null;

type Opener = (options: AskOptions, done: (answer: Answer) => void) => void;
let opener: Opener | null = null;

export function ask(options: AskOptions): Promise<Answer> {
  return new Promise((resolve) => {
    if (opener) return opener(options, resolve);
    // no host on this page: the browser's own boxes still work
    if (options.input) {
      const value = window.prompt(options.title, options.input.value ?? '');
      return resolve(value === null ? null : { choice: 'ok', value });
    }
    resolve(window.confirm(options.title) ? { choice: 'ok', value: '' } : null);
  });
}

export function AskHost() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<{ options: AskOptions; done: (a: Answer) => void } | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    opener = (options, done) => {
      setValue(options.input?.value ?? '');
      setCurrent({ options, done });
    };
    return () => {
      opener = null;
    };
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (current && d && !d.open) d.showModal();
  }, [current]);

  function finish(answer: Answer) {
    const now = current;
    setCurrent(null);
    if (dialog.current?.open) dialog.current.close();
    now?.done(answer);
  }

  const o = current?.options;

  return (
    <dialog
      ref={dialog}
      className="ask"
      aria-labelledby="ask-title"
      onCancel={(e) => {
        e.preventDefault();
        finish(null);
      }}
      onClick={(e) => {
        // a click on the dimmed backdrop closes it, like Escape
        if (e.target === dialog.current) finish(null);
      }}
    >
      {o && (
        <div className="ask__card">
          <h2 id="ask-title" className="ask__title">
            {o.title}
          </h2>
          {o.body && <p className="ask__body">{o.body}</p>}

          {o.input && (
            <label className="field">
              <span className="ask__label">{o.input.label}</span>
              <input
                type="text"
                inputMode={o.input.type === 'url' ? 'url' : undefined}
                dir="ltr"
                value={value}
                placeholder={o.input.placeholder}
                autoFocus
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  finish({ choice: 'ok', value });
                }}
              />
            </label>
          )}

          <div className="ask__buttons">
            {o.extra && (
              <button type="button" className="ask__extra" onClick={() => finish({ choice: 'extra', value })}>
                {o.extra}
              </button>
            )}
            <span className="grow" />
            <button type="button" onClick={() => finish(null)} autoFocus={o.danger && !o.input}>
              {o.cancel ?? 'Cancel'}
            </button>
            <button
              type="button"
              className={o.danger ? 'danger danger--solid' : 'primary'}
              onClick={() => finish({ choice: 'ok', value })}
              autoFocus={!o.danger && !o.input}
            >
              {o.ok}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
