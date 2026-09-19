'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadImage, uploadsReady } from '@/lib/cloudinary';
import { prepare, REDUCTIONS, type Reduction } from '@/lib/compress';
import { fingerprint, looks } from '@/lib/fingerprint';
import { mediaUrl } from '@/lib/media';
import {
  captionPlate,
  describeMedia,
  findDuplicate,
  recentMedia,
  registerMedia,
  rememberLooks,
  unprinted,
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

let caughtUp: Promise<void> | null = null;

/**
 * Pictures uploaded before fingerprints existed get one, once per visit,
 * from a small copy on Cloudinary. Anything that fails is simply skipped.
 */
function catchUpOlderPictures(): Promise<void> {
  caughtUp ??= (async () => {
    for (const m of await unprinted().catch(() => [])) {
      try {
        const url = mediaUrl(m.path, 480);
        if (!url) continue;
        const blob = await (await fetch(url.replace('f_auto', 'f_jpg'))).blob();
        const phash = await looks(blob);
        if (phash) await rememberLooks(m.id, phash);
      } catch {}
    }
  })();
  return caughtUp;
}

export function useUploader() {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  /**
   * Each file is fingerprinted first. A file already in the library is
   * reused instead of uploaded again, and a near copy is asked about.
   * Only then is it compressed, as chosen, and uploaded.
   */
  async function upload(files: File[], reduction: Reduction): Promise<{ media: Media[]; said: string[] }> {
    setError(null);
    setNotes([]);
    const done: Media[] = [];
    const said: string[] = [];

    setProgress('checking for copies');
    await catchUpOlderPictures();

    for (const [i, file] of files.entries()) {
      const prefix = files.length > 1 ? `${i + 1} of ${files.length}: ` : '';
      try {
        setProgress(`${prefix}checking for copies`);
        const print = await fingerprint(file);
        const twin = await findDuplicate(print);

        if (twin?.kind === 'same') {
          done.push(twin.media);
          said.push(`${file.name} was already uploaded, so the existing one is used.`);
          continue;
        }
        if (
          twin?.kind === 'similar' &&
          window.confirm(
            `${file.name} looks like a picture already uploaded.\n\nOK uses the one already there. Cancel uploads this copy as well.`
          )
        ) {
          done.push(twin.media);
          said.push(`${file.name} matched a picture already uploaded, so that one is used.`);
          continue;
        }

        setProgress(`${prefix}compressing`);
        const ready = await prepare(file, reduction);
        const up = await uploadImage(ready.blob, file.name, (f) =>
          setProgress(`${prefix}uploading ${Math.round(f * 100)}%`)
        );
        setProgress(`${prefix}writing a description`);
        const saved = await registerMedia(up, print);
        if (!saved.ok) throw new Error(saved.error);
        done.push(saved.data);
        if (ready.note) said.push(`${file.name}: ${ready.note}.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'The upload failed.');
      }
    }

    setProgress(null);
    setNotes(said);
    return { media: done, said };
  }

  return { upload, progress, error, setError, notes, setNotes };
}

/* ------------------------------------------------------------- compression */

const REDUCTION_KEY = 'warqaa.reduction';

/** Her last choice is remembered on this browser. */
function useReduction(): [Reduction, (r: Reduction) => void] {
  const [reduction, set] = useState<Reduction>(50);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(REDUCTION_KEY));
      if (REDUCTIONS.includes(saved as Reduction)) set(saved as Reduction);
    } catch {}
  }, []);
  return [
    reduction,
    (r) => {
      set(r);
      try {
        localStorage.setItem(REDUCTION_KEY, String(r));
      } catch {}
    }
  ];
}

/* ------------------------------------------------------------ the library */

/** Pictures already uploaded, newest first, to use again without uploading. */
function Library({
  open,
  multiple,
  exclude,
  onClose,
  onPick
}: {
  open: boolean;
  multiple?: boolean;
  exclude: Set<string>;
  onClose: () => void;
  onPick: (media: Media[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<Media[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function load(offset: number) {
    setLoading(true);
    const result = await recentMedia(offset, 30);
    setLoading(false);
    if (!result.ok) return setProblem(result.error);
    setItems((now) => (offset === 0 ? result.data : [...now, ...result.data]));
    setMore(result.data.length === 30);
  }

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setChosen([]);
      d.showModal();
      load(0);
    }
    if (!open && d.open) d.close();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(m: Media) {
    if (!multiple) {
      onPick([m]);
      return onClose();
    }
    setChosen((c) => (c.includes(m.id) ? c.filter((x) => x !== m.id) : [...c, m.id]));
  }

  return (
    <dialog ref={dialog} className="library" onClose={onClose}>
      <div className="library__head">
        <h2 className="section-title">Uploaded pictures</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {problem && <p className="note">{problem}</p>}
      {!loading && items.length === 0 && !problem && <p className="pic__hint">Nothing uploaded yet.</p>}

      <div className="library__grid">
        {items.map((m) => {
          const here = exclude.has(m.id);
          const on = chosen.includes(m.id);
          return (
            <button
              type="button"
              key={m.id}
              className={`library__item${on ? ' is-on' : ''}`}
              disabled={here}
              aria-pressed={on}
              title={m.alt_en || m.alt_ar || ''}
              onClick={() => toggle(m)}
            >
              <Thumb media={m} />
              {here && <span className="library__tag">Already here</span>}
              {on && <span className="library__tag library__tag--on">{chosen.indexOf(m.id) + 1}</span>}
            </button>
          );
        })}
      </div>

      <div className="library__foot">
        {more && (
          <button type="button" disabled={loading} onClick={() => load(items.length)}>
            {loading ? 'Loading' : 'Show older pictures'}
          </button>
        )}
        <span className="publishbar__grow" />
        {multiple && (
          <button
            type="button"
            className="primary"
            disabled={chosen.length === 0}
            onClick={() => {
              onPick(chosen.map((id) => items.find((m) => m.id === id)).filter((m): m is Media => Boolean(m)));
              onClose();
            }}
          >
            {chosen.length
              ? `Add ${chosen.length === 1 ? 'this picture' : `these ${chosen.length} pictures`}`
              : 'Pick pictures'}
          </button>
        )}
      </div>
    </dialog>
  );
}

/* --------------------------------------------------------------- drop zone */

export function Drop({
  multiple,
  busy,
  onFiles,
  onPick,
  exclude,
  children
}: {
  multiple?: boolean;
  busy: boolean;
  onFiles: (files: File[], reduction: Reduction) => void;
  /** choosing from pictures already uploaded */
  onPick?: (media: Media[]) => void;
  /** pictures already in the place this adds to */
  exclude?: Set<string>;
  children: React.ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [library, setLibrary] = useState(false);
  const [reduction, setReduction] = useReduction();

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
        if (!busy) onFiles(Array.from(e.dataTransfer.files).slice(0, multiple ? 30 : 1), reduction);
      }}
    >
      <div className="drop__main">
        {children}
        <button type="button" disabled={busy} onClick={() => input.current?.click()}>
          {multiple ? 'Choose pictures' : 'Choose a picture'}
        </button>
        {onPick && (
          <button type="button" disabled={busy} onClick={() => setLibrary(true)}>
            Choose from uploaded
          </button>
        )}
      </div>

      <div className="drop__squeeze" role="group" aria-label="Compression for pictures over 1 MB">
        <span>Pictures over 1 MB:</span>
        {REDUCTIONS.map((r) => (
          <button
            key={r}
            type="button"
            className="drop__chip"
            aria-pressed={reduction === r}
            onClick={() => setReduction(r)}
          >
            {r === 0 ? 'Keep as is' : `${r}% smaller`}
          </button>
        ))}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onFiles(files, reduction);
        }}
      />

      {onPick && (
        <Library
          open={library}
          multiple={multiple}
          exclude={exclude ?? new Set()}
          onClose={() => setLibrary(false)}
          onPick={onPick}
        />
      )}
    </div>
  );
}

/** What happened to each file: how much it shrank, or which copy was reused. */
export function UploadNotes({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <ul className="upnotes">
      {notes.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ul>
  );
}

/** One text field that saves itself when you leave it. */
export function AutoField({
  label,
  value,
  dir,
  onSave
}: {
  label: string;
  value: string;
  dir: 'rtl' | 'ltr';
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
        {state === 'saving' && <em> saving</em>}
        {state === 'saved' && <em className="pic__ok"> saved</em>}
        {state === 'error' && <em className="pic__needed"> not saved, try again</em>}
      </span>
      <input type="text" value={text} dir={dir} onChange={(e) => setText(e.target.value)} onBlur={commit} />
    </label>
  );
}

export function Descriptions({
  media,
  onSaved
}: {
  media: Media;
  locale?: Locale;
  /** so a list holding this picture never shows, or later saves, an older version */
  onSaved?: (alt: { alt_ar: string; alt_en: string }) => void;
}) {
  // both fields are saved together, so each needs to know the other's latest value
  const latest = useRef({ ar: media.alt_ar ?? '', en: media.alt_en ?? '' });
  const save = (which: 'ar' | 'en') => async (value: string) => {
    latest.current[which] = value;
    const result = await describeMedia(media.id, latest.current.ar, latest.current.en);
    if (result.ok) onSaved?.({ alt_ar: latest.current.ar, alt_en: latest.current.en });
    return result;
  };

  return (
    <>
      <AutoField
        label="Description in Arabic"
        value={media.alt_ar ?? ''}
        dir="rtl"
        onSave={save('ar')}
      />
      <AutoField
        label="Description in English"
        value={media.alt_en ?? ''}
        dir="ltr"
        onSave={save('en')}
      />
    </>
  );
}

export function Captions({
  plate,
  onSaved
}: {
  plate: PlateRow;
  onSaved?: (caption: { caption_ar: string; caption_en: string }) => void;
}) {
  const latest = useRef({ ar: plate.caption_ar ?? '', en: plate.caption_en ?? '' });
  const save = (which: 'ar' | 'en') => async (value: string) => {
    latest.current[which] = value;
    const result = await captionPlate(plate.id, latest.current.ar, latest.current.en);
    if (result.ok) onSaved?.({ caption_ar: latest.current.ar, caption_en: latest.current.en });
    return result;
  };

  return (
    <>
      <AutoField label="Caption in Arabic" value={plate.caption_ar ?? ''} dir="rtl" onSave={save('ar')} />
      <AutoField label="Caption in English" value={plate.caption_en ?? ''} dir="ltr" onSave={save('en')} />
    </>
  );
}

export function Thumb({ media, ratio }: { media: Media; ratio?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="pic__img" src={mediaUrl(media.path, 480) ?? ''} alt="" style={ratio ? { aspectRatio: ratio } : undefined} />
  );
}

export function NotReady() {
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
  const { upload, progress, error, setError, notes } = useUploader();

  async function attach(id: string | null) {
    const result =
      target.type === 'portrait' ? await setPortrait(id) : await setCover(target.kind, target.groupId, id);
    if (!result.ok) setError(result.error);
    return result.ok;
  }

  async function onFiles(files: File[], reduction: Reduction) {
    const {
      media: [added]
    } = await upload(files, reduction);
    if (added && (await attach(added.id))) setMedia(added);
  }

  async function onPick([picked]: Media[]) {
    if (picked && (await attach(picked.id))) setMedia(picked);
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
              <Drop busy={Boolean(progress)} onFiles={onFiles} onPick={onPick} exclude={new Set(media ? [media.id] : [])}>
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
        <Drop busy={Boolean(progress)} onFiles={onFiles} onPick={onPick}>
          <span className="pic__status">{progress ?? 'Drag a picture here, or'}</span>
        </Drop>
      )}

      <UploadNotes notes={notes} />
      {error && <p className="note">{error}</p>}
    </section>
  );
}
