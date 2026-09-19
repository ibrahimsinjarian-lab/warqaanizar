'use client';

import { useRef, useState } from 'react';
import { uploadImage, uploadsReady } from '@/lib/cloudinary';
import { mediaUrl } from '@/lib/media';
import {
  addPlates,
  captionPlate,
  describeMedia,
  orderPlates,
  registerMedia,
  removePlate,
  setCover,
  setPortrait,
  type PlateRow
} from '@/app/(admin)/media-actions';
import type { Locale, Media } from '@/lib/types';

/**
 * Pictures save the moment they are added, dragged or described. There is
 * no Save button to forget, and nothing here touches the text form above.
 */

type Target = { type: 'cover'; kind: 'essays' | 'designs'; groupId: string } | { type: 'portrait' };

/* ------------------------------------------------------------ shared bits */

function useUploader() {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: File[]): Promise<Media[]> {
    setError(null);
    const done: Media[] = [];
    for (const [i, file] of files.entries()) {
      const prefix = files.length > 1 ? `${i + 1} of ${files.length}: ` : '';
      try {
        setProgress(`${prefix}preparing`);
        const up = await uploadImage(file, (f) => setProgress(`${prefix}uploading ${Math.round(f * 100)}%`));
        setProgress(`${prefix}saving`);
        const saved = await registerMedia(up);
        if (!saved.ok) throw new Error(saved.error);
        done.push(saved.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'The upload failed.');
      }
    }
    setProgress(null);
    return done;
  }

  return { upload, progress, error, setError };
}

function Drop({
  multiple,
  busy,
  onFiles,
  children
}: {
  multiple?: boolean;
  busy: boolean;
  onFiles: (files: File[]) => void;
  children: React.ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      className={`drop${over ? ' is-over' : ''}${busy ? ' is-busy' : ''}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setOver(false);
        if (!busy) onFiles(Array.from(e.dataTransfer.files).slice(0, multiple ? 30 : 1));
      }}
    >
      {children}
      <button type="button" disabled={busy} onClick={() => input.current?.click()}>
        {multiple ? 'Choose pictures' : 'Choose a picture'}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}

/** One text field that saves itself when you leave it. */
function AutoField({
  label,
  value,
  dir,
  needed,
  onSave
}: {
  label: string;
  value: string;
  dir: 'rtl' | 'ltr';
  needed?: boolean;
  onSave: (value: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(value);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function commit() {
    if (text === saved) return;
    setState('saving');
    const result = await onSave(text);
    if (result.ok) {
      setSaved(text);
      setState('saved');
    } else setState('error');
  }

  return (
    <label className="pic__field">
      <span>
        {label}
        {needed && !text.trim() && <em className="pic__needed"> needed to publish</em>}
        {state === 'saving' && <em> saving</em>}
        {state === 'saved' && <em className="pic__ok"> saved</em>}
        {state === 'error' && <em className="pic__needed"> not saved, try again</em>}
      </span>
      <input type="text" value={text} dir={dir} onChange={(e) => setText(e.target.value)} onBlur={commit} />
    </label>
  );
}

function Descriptions({ media, locale }: { media: Media; locale?: Locale }) {
  // both fields are saved together, so each needs to know the other's latest value
  const latest = useRef({ ar: media.alt_ar ?? '', en: media.alt_en ?? '' });
  const save = (which: 'ar' | 'en') => async (value: string) => {
    latest.current[which] = value;
    return describeMedia(media.id, latest.current.ar, latest.current.en);
  };

  return (
    <>
      <AutoField
        label="Description in Arabic"
        value={media.alt_ar ?? ''}
        dir="rtl"
        needed={!locale || locale === 'ar'}
        onSave={save('ar')}
      />
      <AutoField
        label="Description in English"
        value={media.alt_en ?? ''}
        dir="ltr"
        needed={!locale || locale === 'en'}
        onSave={save('en')}
      />
    </>
  );
}

function Captions({ plate }: { plate: PlateRow }) {
  const latest = useRef({ ar: plate.caption_ar ?? '', en: plate.caption_en ?? '' });
  const save = (which: 'ar' | 'en') => async (value: string) => {
    latest.current[which] = value;
    return captionPlate(plate.id, latest.current.ar, latest.current.en);
  };

  return (
    <>
      <AutoField label="Caption in Arabic" value={plate.caption_ar ?? ''} dir="rtl" onSave={save('ar')} />
      <AutoField label="Caption in English" value={plate.caption_en ?? ''} dir="ltr" onSave={save('en')} />
    </>
  );
}

function Thumb({ media, ratio }: { media: Media; ratio?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="pic__img" src={mediaUrl(media.path, 480) ?? ''} alt="" style={ratio ? { aspectRatio: ratio } : undefined} />
  );
}

function NotReady() {
  return (
    <p className="note">
      Picture uploads are not switched on yet. Add <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{' '}
      <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> in Vercel, then redeploy.
    </p>
  );
}

/* ------------------------------------------------------ cover or portrait */

export function SinglePicture({
  target,
  initial,
  locale,
  title,
  hint
}: {
  target: Target;
  initial: Media | null;
  locale?: Locale;
  title: string;
  hint: string;
}) {
  const [media, setMedia] = useState<Media | null>(initial);
  const { upload, progress, error, setError } = useUploader();

  async function attach(id: string | null) {
    const result =
      target.type === 'portrait' ? await setPortrait(id) : await setCover(target.kind, target.groupId, id);
    if (!result.ok) setError(result.error);
    return result.ok;
  }

  async function onFiles(files: File[]) {
    const [added] = await upload(files);
    if (added && (await attach(added.id))) setMedia(added);
  }

  if (!uploadsReady()) return <NotReady />;

  return (
    <section className="pic">
      <h2 className="section-title">{title}</h2>
      <p className="pic__hint">{hint}</p>

      {media ? (
        <div className="pic__card pic__card--single">
          <Thumb media={media} ratio="4/3" />
          <div className="pic__fields">
            <Descriptions key={media.id} media={media} locale={locale} />
            <div className="pic__actions">
              <Drop busy={Boolean(progress)} onFiles={onFiles}>
                <span className="pic__status">{progress ?? 'Replace it:'}</span>
              </Drop>
              <button
                type="button"
                className="danger"
                disabled={Boolean(progress)}
                onClick={async () => {
                  if (await attach(null)) setMedia(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Drop busy={Boolean(progress)} onFiles={onFiles}>
          <span className="pic__status">{progress ?? 'Drag a picture here, or'}</span>
        </Drop>
      )}

      {error && <p className="note">{error}</p>}
    </section>
  );
}

/* ------------------------------------------------------- project pictures */

export function ProjectPictures({
  groupId,
  initial,
  locale
}: {
  groupId: string;
  initial: PlateRow[];
  locale: Locale;
}) {
  const [plates, setPlates] = useState<PlateRow[]>(initial);
  const [dragging, setDragging] = useState<number | null>(null);
  const { upload, progress, error, setError } = useUploader();

  async function onFiles(files: File[]) {
    const added = await upload(files);
    if (!added.length) return;
    const result = await addPlates(groupId, added.map((m) => m.id));
    if (result.ok) setPlates((p) => [...p, ...result.data]);
    else setError(result.error);
  }

  async function move(from: number, to: number) {
    if (to < 0 || to >= plates.length || from === to) return;
    const next = [...plates];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    const before = plates;
    setPlates(next);
    const result = await orderPlates(next.map((p) => p.id));
    if (!result.ok) {
      setPlates(before);
      setError(result.error);
    }
  }

  async function remove(id: string) {
    const result = await removePlate(id);
    if (result.ok) setPlates((p) => p.filter((x) => x.id !== id));
    else setError(result.error);
  }

  if (!uploadsReady()) return <NotReady />;

  return (
    <section className="pic">
      <h2 className="section-title">Project pictures</h2>
      <p className="pic__hint">
        Shared by the Arabic and English pages. Drag them into the order they should appear: the first four are
        scattered at the top, the fifth runs wide under the text, and any more follow after it.
      </p>

      {plates.length > 0 && (
        <ol className="pic__list">
          {plates.map((plate, i) => {
            return (
              <li
                key={plate.id}
                className={`pic__card${dragging === i ? ' is-dragging' : ''}`}
                onDragOver={(e) => {
                  if (dragging === null) return;
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  if (dragging === null) return;
                  e.preventDefault();
                  move(dragging, i);
                  setDragging(null);
                }}
              >
                {/* only the picture is the handle, so selecting text in a field never drags the card */}
                <div
                  className="pic__side"
                  draggable
                  title="Drag to reorder"
                  onDragStart={(e) => {
                    setDragging(i);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setDragging(null)}
                >
                  <span className="pic__num">{String(i + 1).padStart(2, '0')}</span>
                  <Thumb media={plate.media} ratio="1/1" />
                  <div className="pic__order">
                    <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, i - 1)}>
                      &uarr;
                    </button>
                    <button
                      type="button"
                      aria-label="Move later"
                      disabled={i === plates.length - 1}
                      onClick={() => move(i, i + 1)}
                    >
                      &darr;
                    </button>
                  </div>
                </div>
                <div className="pic__fields">
                  <Descriptions media={plate.media} locale={locale} />
                  <Captions plate={plate} />
                  <div className="pic__actions">
                    <button type="button" className="danger" onClick={() => remove(plate.id)}>
                      Take it off the project
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Drop multiple busy={Boolean(progress)} onFiles={onFiles}>
        <span className="pic__status">{progress ?? 'Drag pictures here, as many as you like, or'}</span>
      </Drop>

      {error && <p className="note">{error}</p>}
    </section>
  );
}
