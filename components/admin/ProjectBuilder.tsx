'use client';

import { useState } from 'react';
import RichText from './RichText';
import { Captions, Descriptions, Drop, NotReady, Thumb, UploadNotes, useUploader } from './Pictures';
import type { Reduction } from '@/lib/compress';
import { uploadsReady } from '@/lib/cloudinary';
import {
  addPlates,
  addSection,
  assignPlate,
  orderPlates,
  orderSections,
  removePlate,
  removeSection,
  type PlateRow
} from '@/app/(admin)/media-actions';
import type { DesignSection, Layout, Locale, Media } from '@/lib/types';

/**
 * The body of a project: its sections, its pictures, and how the two are
 * laid out on the page.
 *
 * It sits inside the page's form. The words in each section are ordinary
 * form fields, saved by Save or Publish like the title. Adding, removing
 * and reordering sections and pictures happen at once, because a picture
 * can only be put in a section that already exists.
 */

type Props = {
  groupId: string;
  locale: Locale;
  initialLayout: Layout;
  initialSections: DesignSection[];
  initialPlates: PlateRow[];
  /** the editor HTML for each section, prepared on the server */
  bodies: Record<string, string>;
};

/** Put a subset of the list into a new order, leaving everything else where it was. */
function reorderWithin(all: PlateRow[], subsetInNewOrder: PlateRow[]): PlateRow[] {
  const ids = new Set(subsetInNewOrder.map((p) => p.id));
  const queue = [...subsetInNewOrder];
  return all.map((p) => (ids.has(p.id) ? queue.shift()! : p));
}

export default function ProjectBuilder({ groupId, locale, initialLayout, initialSections, initialPlates, bodies }: Props) {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [sections, setSections] = useState<DesignSection[]>(initialSections);
  const [plates, setPlates] = useState<PlateRow[]>(initialPlates);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rtl = locale === 'ar';
  const dir = rtl ? 'rtl' : 'ltr';

  const say = (result: { ok: boolean; error?: string }) => {
    setProblem(result.ok ? null : (result.error ?? 'Something went wrong.'));
    return result.ok;
  };

  /* ------------------------------------------------------------ sections */

  async function newSection() {
    setBusy(true);
    const result = await addSection(groupId);
    setBusy(false);
    if (say(result) && result.ok) setSections((s) => [...s, result.data]);
  }

  async function moveSection(from: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    const before = sections;
    setSections(next);
    if (!say(await orderSections(next.map((s) => s.id)))) setSections(before);
  }

  async function dropSection(section: DesignSection, index: number) {
    const name = (rtl ? section.heading_ar : section.heading_en) || `section ${index + 1}`;
    const pictures = plates.filter((p) => p.section_id === section.id).length;
    const warning =
      `Remove "${name}"? Its text goes in both languages.` +
      (pictures ? ` Its ${pictures === 1 ? 'picture stays' : `${pictures} pictures stay`} on the project, outside any section.` : '');
    if (!window.confirm(warning)) return;

    if (say(await removeSection(section.id))) {
      setSections((s) => s.filter((x) => x.id !== section.id));
      setPlates((p) => p.map((x) => (x.section_id === section.id ? { ...x, section_id: null } : x)));
    }
  }

  /* ------------------------------------------------------------ pictures */

  async function saveOrder(next: PlateRow[]) {
    const before = plates;
    setPlates(next);
    if (!say(await orderPlates(next.map((p) => p.id)))) setPlates(before);
  }

  function movePicture(list: PlateRow[], from: number, to: number) {
    if (to < 0 || to >= list.length || from === to) return;
    const reordered = [...list];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    saveOrder(reorderWithin(plates, reordered));
  }

  async function placePicture(plate: PlateRow, sectionId: string | null) {
    if (say(await assignPlate(plate.id, sectionId))) {
      setPlates((p) => p.map((x) => (x.id === plate.id ? { ...x, section_id: sectionId } : x)));
    }
  }

  async function takeOff(plate: PlateRow) {
    if (say(await removePlate(plate.id))) setPlates((p) => p.filter((x) => x.id !== plate.id));
  }

  const heading = (s: DesignSection) => (rtl ? s.heading_ar : s.heading_en) ?? '';
  const sectionName = (s: DesignSection, i: number) => heading(s) || `Section ${i + 1}`;

  /* -------------------------------------------------------------- render */

  const pictureList = (list: PlateRow[], sectionId: string | null, emptyHint: string) => (
    <PictureList
      list={list}
      groupId={groupId}
      sectionId={sectionId}
      sections={layout === 'sections' ? sections.map((s, i) => ({ id: s.id, name: sectionName(s, i) })) : null}
      emptyHint={emptyHint}
      onProject={new Set(plates.map((p) => p.media.id))}
      onMove={(from, to) => movePicture(list, from, to)}
      onPlace={placePicture}
      onRemove={takeOff}
      onAdded={(rows) => setPlates((p) => [...p, ...rows])}
      onEdited={(id, patch) =>
        setPlates((p) =>
          p.map((x) =>
            x.id !== id ? x : { ...x, ...patch.plate, media: { ...x.media, ...patch.media } }
          )
        )
      }
      onProblem={setProblem}
    />
  );

  const loose = plates.filter((p) => !p.section_id || !sections.some((s) => s.id === p.section_id));

  return (
    <div className="builder">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="layout" value={layout} />

      <div className="card card--layout">
        <div className="card__head">
          <div>
            <h2 className="card__title">Pictures and text</h2>
            <p className="hint">
              {layout === 'slideshow'
                ? 'One slideshow beside all the text, staying in view as the reader scrolls.'
                : 'Each section shows its own pictures beside its text, alternating sides.'}
            </p>
          </div>
          <div className="segmented" role="group" aria-label="Layout">
            <button type="button" aria-pressed={layout === 'slideshow'} onClick={() => setLayout('slideshow')}>
              Slideshow
            </button>
            <button type="button" aria-pressed={layout === 'sections'} onClick={() => setLayout('sections')}>
              In sections
            </button>
          </div>
        </div>

        {!uploadsReady() && <NotReady />}
        {problem && <p className="note note--bad">{problem}</p>}

        {layout === 'slideshow' && (
          <div className="slides">
            <p className="hint hint--tight">In the order they play. Drag a picture, or use the arrows.</p>
            {pictureList(plates, null, 'No pictures yet. Until there are, a drawn placeholder shows instead.')}
          </div>
        )}
      </div>

      <div className="sections">
        {sections.map((section, i) => {
          const own = plates.filter((p) => p.section_id === section.id);
          return (
            <section className="sec card" key={section.id}>
              <input type="hidden" name="section_id" value={section.id} />
              <header className="sec__bar">
                <span className="sec__num">{String(i + 1).padStart(2, '0')}</span>
                <input
                  className="sec__heading"
                  name={`section_heading_${section.id}`}
                  type="text"
                  dir={dir}
                  defaultValue={heading(section)}
                  placeholder="Heading, if you want one"
                  aria-label={`Heading of section ${i + 1}`}
                />
                <span className="sec__tools">
                  <button type="button" className="icon" aria-label="Move section up" disabled={i === 0} onClick={() => moveSection(i, i - 1)}>
                    &uarr;
                  </button>
                  <button
                    type="button"
                    className="icon"
                    aria-label="Move section down"
                    disabled={i === sections.length - 1}
                    onClick={() => moveSection(i, i + 1)}
                  >
                    &darr;
                  </button>
                  <button type="button" className="icon icon--bad" aria-label="Remove this section" onClick={() => dropSection(section, i)}>
                    &#10005;
                  </button>
                </span>
              </header>

              <RichText name={`section_body_${section.id}`} defaultValue={bodies[section.id] ?? ''} dir={dir} minHeight="11rem" />

              {layout === 'sections' && (
                <div className="sec__pictures">
                  <p className="hint hint--tight">Pictures beside this text</p>
                  {pictureList(own, section.id, 'None yet.')}
                </div>
              )}
            </section>
          );
        })}

        <button type="button" className="addsection" disabled={busy} onClick={newSection}>
          {busy ? 'Adding' : 'Add a section'}
        </button>
      </div>

      {layout === 'sections' && loose.length > 0 && (
        <div className="card">
          <h2 className="card__title">Not in a section</h2>
          <p className="hint">These show after the last section. Open a picture and pick a section to place it.</p>
          {pictureList(loose, null, '')}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ picture list */

function PictureList({
  list,
  groupId,
  sectionId,
  sections,
  emptyHint,
  onProject,
  onMove,
  onPlace,
  onRemove,
  onAdded,
  onEdited,
  onProblem
}: {
  list: PlateRow[];
  groupId: string;
  sectionId: string | null;
  sections: { id: string; name: string }[] | null;
  emptyHint: string;
  /** every picture already on this project, in any section */
  onProject: Set<string>;
  onMove: (from: number, to: number) => void;
  onPlace: (plate: PlateRow, sectionId: string | null) => void;
  onRemove: (plate: PlateRow) => void;
  onAdded: (rows: PlateRow[]) => void;
  onEdited: (id: string, patch: { plate?: Partial<PlateRow>; media?: Partial<PlateRow['media']> }) => void;
  onProblem: (message: string | null) => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { upload, progress, error, notes, setNotes } = useUploader();

  /** Adds pictures to the project, skipping any it already has. */
  async function attach(media: Media[], said: string[] = []) {
    const seen = new Set(onProject);
    const fresh = media.filter((m) => !seen.has(m.id) && seen.add(m.id));
    const skipped = media.length - fresh.length;
    if (skipped) said.push(`${skipped === 1 ? 'One picture is' : `${skipped} pictures are`} already on this project, so ${skipped === 1 ? 'it was' : 'they were'} not added again.`);
    setNotes(said);
    if (!fresh.length) return;

    const result = await addPlates(groupId, fresh.map((m) => m.id), sectionId);
    if (result.ok) onAdded(result.data);
    else onProblem(result.error);
  }

  async function onFiles(files: File[], reduction: Reduction) {
    const { media, said } = await upload(files, reduction);
    await attach(media, said);
  }

  return (
    <div className="plist">
      {list.length === 0 && emptyHint && <p className="plist__empty">{emptyHint}</p>}

      {list.map((plate, i) => (
        <div
          key={plate.id}
          className={`plist__item${dragging === i ? ' is-dragging' : ''}`}
          onDragOver={(e) => {
            if (dragging !== null) e.preventDefault();
          }}
          onDrop={(e) => {
            if (dragging === null) return;
            e.preventDefault();
            onMove(dragging, i);
            setDragging(null);
          }}
        >
          <div className="plist__row">
            <div
              className="plist__handle"
              draggable
              title="Drag to reorder"
              onDragStart={(e) => {
                setDragging(i);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => setDragging(null)}
            >
              <span className="plist__num">{String(i + 1).padStart(2, '0')}</span>
              <Thumb media={plate.media} />
            </div>
            <div className="plist__meta">
              <span className="plist__alt">{plate.media.alt_en || plate.media.alt_ar || 'No description yet'}</span>
              <div className="plist__buttons">
                <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => onMove(i, i - 1)}>
                  &uarr;
                </button>
                <button type="button" aria-label="Move later" disabled={i === list.length - 1} onClick={() => onMove(i, i + 1)}>
                  &darr;
                </button>
                <button type="button" aria-expanded={open === plate.id} onClick={() => setOpen(open === plate.id ? null : plate.id)}>
                  {open === plate.id ? 'Close' : 'Words'}
                </button>
              </div>
            </div>
          </div>

          {open === plate.id && (
            <div className="plist__details">
              <Descriptions media={plate.media} onSaved={(alt) => onEdited(plate.id, { media: alt })} />
              <Captions plate={plate} onSaved={(caption) => onEdited(plate.id, { plate: caption })} />
              {sections && (
                <label className="pic__field">
                  <span>Section</span>
                  <select
                    value={plate.section_id ?? ''}
                    onChange={(e) => onPlace(plate, e.target.value || null)}
                  >
                    <option value="">Not in a section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="pic__actions">
                <button type="button" className="danger" onClick={() => onRemove(plate)}>
                  Take it off the project
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {uploadsReady() && (
        <Drop multiple busy={Boolean(progress)} onFiles={onFiles} onPick={(media) => attach(media)} exclude={onProject}>
          <span className="pic__status">{progress ?? 'Drag pictures here, or'}</span>
        </Drop>
      )}
      <UploadNotes notes={notes} />
      {error && <p className="note">{error}</p>}
    </div>
  );
}
