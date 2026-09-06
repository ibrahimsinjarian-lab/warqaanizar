'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useState } from 'react';

/**
 * The writing surface. Buttons instead of remembering that ## means a
 * heading, and the words look like words while they are being written.
 *
 * It keeps a hidden input in step with the content, so the surrounding
 * form posts exactly as it always did.
 */

interface Props {
  name: string;
  defaultValue: string;
  dir?: 'rtl' | 'ltr';
  minHeight?: string;
  onChange?: (html: string) => void;
}

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
      aria-pressed={active ? true : undefined}
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

function Toolbar({ editor }: { editor: Editor }) {
  const link = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('Address to link to', previous ?? 'https://');
    if (href === null) return;
    if (href === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="rt__bar" role="toolbar" aria-label="Formatting">
      <Button label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </Button>
      <Button label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </Button>
      <Button
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <u>U</u>
      </Button>
      <Button label="Strike through" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </Button>

      <span className="rt__sep" />

      <Button
        label="Heading"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H1
      </Button>
      <Button
        label="Smaller heading"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H2
      </Button>
      <Button
        label="Pulled quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &rdquo;
      </Button>

      <span className="rt__sep" />

      <Button label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        &bull;
      </Button>
      <Button
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </Button>
      <Button label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        &mdash;
      </Button>

      <span className="rt__sep" />

      <Button label="Align to the start" active={editor.isActive({ textAlign: 'start' })} onClick={() => editor.chain().focus().setTextAlign('start').run()}>
        &#8676;
      </Button>
      <Button label="Centre" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        &#8596;
      </Button>
      <Button label="Align to the end" active={editor.isActive({ textAlign: 'end' })} onClick={() => editor.chain().focus().setTextAlign('end').run()}>
        &#8677;
      </Button>
      <Button label="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        &#9776;
      </Button>

      <span className="rt__sep" />

      <Button label="Link" active={editor.isActive('link')} onClick={link}>
        &#128279;
      </Button>

      <span className="rt__grow" />

      <Button label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        &#8630;
      </Button>
      <Button label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        &#8631;
      </Button>
    </div>
  );
}

export default function RichText({ name, defaultValue, dir = 'ltr', minHeight = '22rem', onChange }: Props) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['start', 'center', 'end', 'justify'] })
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: 'rt__surface',
        dir,
        style: `min-height:${minHeight}`
      }
    },
    onUpdate: ({ editor: e }) => {
      const next = e.getHTML();
      setHtml(next);
      onChange?.(next);
    }
  });

  // the words count, so she can see the length without leaving the page
  const [words, setWords] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const count = () => setWords(editor.getText().trim().split(/\s+/).filter(Boolean).length);
    count();
    editor.on('update', count);
    return () => {
      editor.off('update', count);
    };
  }, [editor]);

  return (
    <div className="rt">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
      <p className="rt__count">
        {words} {words === 1 ? 'word' : 'words'}
        {words > 0 && <> . about {Math.max(1, Math.round(words / 200))} minutes to read</>}
      </p>
    </div>
  );
}
