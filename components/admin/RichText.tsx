'use client';

import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useRef, useState } from 'react';
import { ask } from './Ask';

/**
 * The writing surface. Buttons instead of remembering that ## means a
 * heading, and the words look like words while they are being written.
 *
 * It keeps a hidden input in step with the content, so the surrounding
 * form posts exactly as it always did, and tells that form when the words
 * change, so leaving with unsaved words asks first.
 */

interface Props {
  name: string;
  defaultValue: string;
  dir?: 'rtl' | 'ltr';
  minHeight?: string;
  /** the id of the visible label for this box */
  labelledBy?: string;
  onChange?: (html: string) => void;
}

/* ----------------------------------------------------------------- icons */

const ICONS = {
  quote: 'M10 7c-3 0-5 2-5 5v4h5v-5H7.2c.3-1.6 1.3-2.6 2.8-2.6zM19 7c-3 0-5 2-5 5v4h5v-5h-2.8c.3-1.6 1.3-2.6 2.8-2.6z',
  bullets: 'M9 7h11M9 12h11M9 17h11',
  numbers: 'M10 7h10M10 12h10M10 17h10',
  divider: 'M4 12h16',
  start: 'M4 6h16M4 10h10M4 14h16M4 18h10',
  center: 'M4 6h16M7 10h10M4 14h16M7 18h10',
  end: 'M4 6h16M10 10h10M4 14h16M10 18h10',
  justify: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'm15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13'
};

function Icon({ d, children }: { d?: string; children?: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d && <path d={d} />}
      {children}
    </svg>
  );
}

/* --------------------------------------------------------------- toolbar */

function Button({
  onClick,
  active,
  disabled,
  label,
  children
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="rt__btn"
      aria-pressed={active === undefined ? undefined : active}
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, dir }: { editor: Editor; dir: 'rtl' | 'ltr' }) {
  // TipTap 3 does not redraw on every keystroke or cursor move, so the
  // buttons ask for exactly what they show, and light up as the cursor moves
  const on = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      quote: e.isActive('blockquote'),
      bullets: e.isActive('bulletList'),
      numbers: e.isActive('orderedList'),
      start: e.isActive({ textAlign: 'start' }),
      center: e.isActive({ textAlign: 'center' }),
      end: e.isActive({ textAlign: 'end' }),
      justify: e.isActive({ textAlign: 'justify' }),
      link: e.isActive('link'),
      undo: e.can().undo(),
      redo: e.can().redo()
    })
  });

  async function link() {
    const previous = editor.getAttributes('link').href as string | undefined;
    const answer = await ask({
      title: previous ? 'Change the link' : 'Add a link',
      ok: previous ? 'Change it' : 'Add the link',
      extra: previous ? 'Remove the link' : undefined,
      input: { label: 'Address', value: previous ?? '', placeholder: 'https://', type: 'url' }
    });
    if (!answer) return editor.commands.focus();

    let href = answer.value.trim();
    if (answer.choice === 'extra' || href === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    // "instagram.com/x" means a web address, not a page of this site
    if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) href = `https://${href}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  // in Arabic the start of a line is on the right, so the pictures swap
  const rtl = dir === 'rtl';

  return (
    <div className="rt__bar" role="toolbar" aria-label="Formatting">
      <Button label="Bold" active={on.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </Button>
      <Button label="Italic" active={on.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i className="rt__serif">I</i>
      </Button>
      <Button label="Underline" active={on.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </Button>
      <Button label="Strike through" active={on.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </Button>

      <span className="rt__sep" />

      <Button label="Heading" active={on.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <span className="rt__h">H</span>
      </Button>
      <Button label="Smaller heading" active={on.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <span className="rt__h rt__h--small">H</span>
      </Button>
      <Button label="Pulled quote" active={on.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Icon d={ICONS.quote} />
      </Button>

      <span className="rt__sep" />

      <Button label="Bulleted list" active={on.bullets} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <Icon d={ICONS.bullets}>
          <circle cx="4.5" cy="7" r="1" fill="currentColor" />
          <circle cx="4.5" cy="12" r="1" fill="currentColor" />
          <circle cx="4.5" cy="17" r="1" fill="currentColor" />
        </Icon>
      </Button>
      <Button label="Numbered list" active={on.numbers} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <Icon d={ICONS.numbers}>
          <path d="M4 5.5 5.5 5v4M3.5 11.5c.6-.7 2.4-.7 2.4.5 0 1-2.4 1.6-2.4 2.6h2.6M3.6 16.4c.8-.6 2.3-.4 2.3.5 0 .5-.5.8-1.1.8.7 0 1.2.3 1.2.9 0 1-1.6 1.2-2.4.5" strokeWidth="1.3" />
        </Icon>
      </Button>
      <Button label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Icon d={ICONS.divider}>
          <path d="M4 7h16M4 17h16" opacity=".35" />
        </Icon>
      </Button>

      <span className="rt__sep" />

      <Button label="Align to the start" active={on.start} onClick={() => editor.chain().focus().setTextAlign('start').run()}>
        <Icon d={rtl ? ICONS.end : ICONS.start} />
      </Button>
      <Button label="Centre" active={on.center} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <Icon d={ICONS.center} />
      </Button>
      <Button label="Align to the end" active={on.end} onClick={() => editor.chain().focus().setTextAlign('end').run()}>
        <Icon d={rtl ? ICONS.start : ICONS.end} />
      </Button>
      <Button label="Justify" active={on.justify} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        <Icon d={ICONS.justify} />
      </Button>

      <span className="rt__sep" />

      <Button label={on.link ? 'Change the link' : 'Link'} active={on.link} onClick={link}>
        <Icon d={ICONS.link} />
      </Button>

      <span className="rt__grow" />

      <Button label="Undo" disabled={!on.undo} onClick={() => editor.chain().focus().undo().run()}>
        <Icon d={ICONS.undo} />
      </Button>
      <Button label="Redo" disabled={!on.redo} onClick={() => editor.chain().focus().redo().run()}>
        <Icon d={ICONS.redo} />
      </Button>
    </div>
  );
}

/* --------------------------------------------------------------- surface */

const minutes = (words: number) => {
  const m = Math.max(1, Math.round(words / 200));
  return m === 1 ? 'about 1 minute to read' : `about ${m} minutes to read`;
};

export default function RichText({ name, defaultValue, dir = 'ltr', minHeight = '22rem', labelledBy, onChange }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [words, setWords] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['start', 'center', 'end', 'justify'] })
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: 'rt__surface',
        dir,
        role: 'textbox',
        'aria-multiline': 'true',
        ...(labelledBy ? { 'aria-labelledby': labelledBy } : {}),
        style: `min-height:${minHeight}`
      }
    },
    onCreate: ({ editor: e }) => setWords(count(e)),
    onUpdate: ({ editor: e }) => {
      const next = e.getHTML();
      setHtml(next);
      setWords(count(e));
      onChange?.(next);
      // a toolbar button changes the words without typing: say so
      box.current?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // the label above the box puts the cursor in it, as a label does for a field
  useEffect(() => {
    if (!editor || !labelledBy) return;
    const label = document.getElementById(labelledBy);
    const focus = () => editor.commands.focus();
    label?.addEventListener('click', focus);
    return () => label?.removeEventListener('click', focus);
  }, [editor, labelledBy]);

  return (
    <div className="rt" ref={box}>
      {editor && <Toolbar editor={editor} dir={dir} />}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
      <p className="rt__count">
        {words} {words === 1 ? 'word' : 'words'}
        {words > 0 && <>, {minutes(words)}</>}
      </p>
    </div>
  );
}

function count(editor: Editor) {
  return editor.getText().trim().split(/\s+/).filter(Boolean).length;
}
