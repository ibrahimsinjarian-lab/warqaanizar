'use client';

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SaveResult } from '@/app/(admin)/actions';
import { ask } from './Ask';
import { NAVIGATING } from './NavProgress';

/** A preview open in another tab listens here, and redraws after each save. */
export const PREVIEW_CHANNEL = 'warqaa-preview';

/**
 * The form around a page she edits: an essay, a project, the front page.
 *
 * Saving no longer reloads the page. The words stay where they are, the
 * cursor stays where it was, and the bar says Saving, then Saved at 14:02.
 *
 * It also knows when something has been typed and not saved. Leaving then,
 * by a link, another button on the page, or closing the tab, asks first.
 * Ctrl+S (Cmd+S on a Mac) saves.
 *
 * Anything inside an element marked data-autosave saves itself, such as
 * picture descriptions, and does not count as unsaved.
 */

type Action = (previous: SaveResult, form: FormData) => Promise<SaveResult>;
type Intent = 'save' | 'publish';

type Shared = {
  dirty: boolean;
  pending: boolean;
  result: SaveResult;
  save: (intent?: Intent, then?: (result: SaveResult) => void) => void;
};

const Context = createContext<Shared | null>(null);

export function useEditorForm(): Shared {
  const shared = useContext(Context);
  if (!shared) throw new Error('useEditorForm must sit inside EditorForm');
  return shared;
}

const LEAVE = {
  title: 'You have changes that are not saved',
  body: 'Save them first, or leave them behind.',
  ok: 'Save, then go on',
  extra: 'Leave without saving',
  cancel: 'Stay here'
};

export default function EditorForm({
  action,
  className = 'form',
  dir,
  children
}: {
  action: Action;
  className?: string;
  dir?: 'rtl' | 'ltr';
  children: React.ReactNode;
}) {
  const [result, dispatch, pending] = useActionState(action, null);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const [dirty, setDirty] = useState(false);
  const dirtyNow = useRef(false);
  const edits = useRef(0);
  const editsWhenSent = useRef(0);
  const then = useRef<((r: SaveResult) => void) | null>(null);

  const mark = (value: boolean) => {
    dirtyNow.current = value;
    setDirty(value);
  };

  function noticed(e: React.SyntheticEvent) {
    // the writing surfaces announce their changes with an input event too
    if ((e.target as HTMLElement).closest?.('[data-autosave]')) return;
    edits.current++;
    if (!dirtyNow.current) mark(true);
  }

  function save(intent: Intent = 'save', after?: (r: SaveResult) => void) {
    const f = form.current;
    if (!f || pending) return;
    if (!f.reportValidity()) return;
    const data = new FormData(f);
    data.set('intent', intent);
    editsWhenSent.current = edits.current;
    then.current = after ?? null;
    startTransition(() => dispatch(data));
  }

  // a save has answered
  useEffect(() => {
    if (!result) return;
    // anything typed while it was saving is still unsaved
    if (result.ok && edits.current === editsWhenSent.current) mark(false);
    const after = then.current;
    then.current = null;
    after?.(result);
  }, [result]);

  /* ------------------------------------------------- before anything leaves */

  useEffect(() => {
    // closing the tab or reloading: only the browser's own question can stop that
    const unload = (e: BeforeUnloadEvent) => {
      if (!dirtyNow.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    async function decide(go: () => void) {
      const answer = await ask(LEAVE);
      if (!answer) return;
      if (answer.choice === 'extra') {
        mark(false);
        return go();
      }
      save('save', (r) => {
        if (r?.ok) {
          mark(false);
          go();
        }
      });
    }

    // a link in the editor: the menu, the other language, the breadcrumbs
    const click = (e: MouseEvent) => {
      if (!dirtyNow.current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.('a');
      if (!(link instanceof HTMLAnchorElement) || !link.href || link.target === '_blank' || link.hasAttribute('download')) return;
      const to = new URL(link.href, location.href);
      if (to.origin !== location.origin) return;
      if (to.pathname === location.pathname && to.search === location.search) return;

      e.preventDefault();
      e.stopPropagation();
      decide(() => {
        window.dispatchEvent(new Event(NAVIGATING));
        router.push(to.pathname + to.search + to.hash);
      });
    };

    // another form on the page: translate, unpublish, trash, sign out
    const submit = (e: SubmitEvent) => {
      const other = e.target as HTMLFormElement;
      if (!dirtyNow.current || other === form.current || other.closest('dialog')) return;
      e.preventDefault();
      e.stopPropagation();
      const button = e.submitter as HTMLButtonElement | null;
      decide(() => other.requestSubmit(button ?? undefined));
    };

    const keys = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      if (document.querySelector('dialog[open]')) return;
      save('save');
    };

    window.addEventListener('beforeunload', unload);
    window.addEventListener('click', click, true);
    window.addEventListener('submit', submit, true);
    window.addEventListener('keydown', keys);
    return () => {
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('click', click, true);
      window.removeEventListener('submit', submit, true);
      window.removeEventListener('keydown', keys);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Context.Provider value={{ dirty, pending, result, save }}>
      <form
        ref={form}
        className={className}
        dir={dir}
        onInput={noticed}
        onChange={noticed}
        onSubmit={(e) => {
          e.preventDefault();
          const button = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          save(button?.value === 'publish' ? 'publish' : 'save');
        }}
      >
        {children}
      </form>
    </Context.Provider>
  );
}

/* ------------------------------------------------------------------ the bar */

const time = (at: number) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(at));

/**
 * The one bar that changes what readers see. It says what state the page
 * is in, once, and whether anything is waiting to be saved.
 */
export function SaveBar({
  live,
  previewUrl,
  plain
}: {
  /** the page is on the site */
  live: boolean;
  /** where Preview opens; it shows the last saved version */
  previewUrl?: string;
  /** the front page: one Save, no drafts */
  plain?: boolean;
}) {
  const { dirty, pending, result, save } = useEditorForm();
  const [shortcut, setShortcut] = useState('Ctrl+S');
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setShortcut('Cmd+S');
  }, []);

  let pill: React.ReactNode = null;
  let line: string;
  if (plain) {
    line = 'Changes show on the site once saved.';
  } else {
    pill = live ? <span className="pill pill--live">live</span> : <span className="pill pill--draft">draft</span>;
    line = live ? 'Anyone can read this.' : 'Only you can see this.';
  }

  let state: 'busy' | 'dirty' | 'ok' | 'idle' = 'idle';
  if (pending) {
    state = 'busy';
    line = 'Saving';
  } else if (dirty) {
    state = 'dirty';
    line = 'Changes not saved yet';
  } else if (result?.ok) {
    state = 'ok';
    line =
      result.change === 'published'
        ? `Published at ${time(result.at)}. It is on the site now.`
        : plain || live
          ? `Saved at ${time(result.at)}. The site shows it now.`
          : `Saved at ${time(result.at)}. Still a draft.`;
  }

  // every save tells an open preview tab to redraw itself
  useEffect(() => {
    if (!result?.ok || !previewUrl || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(PREVIEW_CHANNEL);
    channel.postMessage(previewUrl);
    channel.close();
  }, [result, previewUrl]);

  /**
   * Preview is a plain link, which no browser blocks. A draft with changes
   * is saved on the way: the preview tab opens at once and redraws itself
   * as soon as the save lands. A live page is not saved, because saving it
   * would publish the changes; its preview shows the last save.
   */
  function preview() {
    if (dirty && !live) save('save');
  }
  const previewLabel = !dirty ? 'Preview' : live ? 'Preview the last save' : 'Save and preview';

  return (
    <>
      <div className={`actionbar actionbar--${state}`}>
        <span className="actionbar__state" role="status" aria-live="polite">
          {pill}
          <span className="actionbar__line">{line}</span>
        </span>
        <span className="grow" />
        {previewUrl && (
          <a
            className="button actionbar__quiet"
            href={previewUrl}
            target="_blank"
            rel="noopener"
            onClick={preview}
            title={dirty && live ? 'Your newest changes are not in it until you save, and saving updates the live page.' : undefined}
          >
            {previewLabel}
          </a>
        )}
        {plain || live ? (
          <button type="submit" value="save" className="primary" disabled={pending} title={shortcut}>
            {pending ? 'Saving' : plain ? 'Save' : 'Save and update the page'}
          </button>
        ) : (
          <>
            <button type="submit" value="save" disabled={pending} title={shortcut}>
              Save draft
            </button>
            <button type="submit" value="publish" className="primary" disabled={pending}>
              Publish it
            </button>
          </>
        )}
      </div>
      {result && !result.ok && !pending && (
        <p className="note note--bad" role="alert">
          {result.error}
        </p>
      )}
    </>
  );
}
