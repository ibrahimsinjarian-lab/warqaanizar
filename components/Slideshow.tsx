'use client';

import { useCallback, useRef, useState } from 'react';
import { mediaSrcSet, mediaUrl } from '@/lib/media';
import type { Locale, Media } from '@/lib/types';

export type Slide = { id: string; media: Media; alt: string; caption: string };

/**
 * The pictures of a project, one at a time, beside its text.
 *
 * Nothing is cropped: every picture is fitted whole inside the frame, and
 * the frame takes the shape of the first picture so a consistent set fills
 * it exactly. It never advances on its own. Arrows, swiping and the arrow
 * keys all move it, and in Arabic "next" points left, as the page reads.
 */
export default function Slideshow({ slides, locale }: { slides: Slide[]; locale: Locale }) {
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);
  const rtl = locale === 'ar';
  const count = slides.length;

  const go = useCallback((to: number) => setIndex(((to % count) + count) % count), [count]);

  const first = slides[0]?.media;
  const natural = first?.width && first?.height ? first.width / first.height : 4 / 3;
  // very tall or very wide first pictures would make an awkward frame for the rest
  const ratio = Math.min(Math.max(natural, 3 / 4), 16 / 10);

  const current = slides[index];
  const label = locale === 'ar' ? { prev: 'السابقة', next: 'التالية' } : { prev: 'Previous picture', next: 'Next picture' };

  return (
    <figure className="slideshow" aria-roledescription="carousel">
      <div
        className="slideshow__frame"
        style={{ aspectRatio: String(ratio) }}
        tabIndex={count > 1 ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(index + (rtl ? -1 : 1));
          if (e.key === 'ArrowLeft') go(index + (rtl ? 1 : -1));
        }}
        onPointerDown={(e) => (touch.current = e.clientX)}
        onPointerUp={(e) => {
          if (touch.current === null) return;
          const dx = e.clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) < 40) return;
          // a swipe towards the start of the line goes forward
          go(index + ((dx < 0) !== rtl ? 1 : -1));
        }}
      >
        {slides.map((slide, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.id}
            className={`slideshow__img${i === index ? ' is-on' : ''}`}
            src={mediaUrl(slide.media.path) ?? ''}
            srcSet={mediaSrcSet(slide.media.path, slide.media.width)}
            sizes="(max-width: 900px) 100vw, 55vw"
            alt={slide.alt}
            width={slide.media.width ?? undefined}
            height={slide.media.height ?? undefined}
            // the first is needed at once, the one after it soon, the rest only if asked for
            loading={i === 0 || i === index || i === (index + 1) % count ? 'eager' : 'lazy'}
            decoding="async"
            aria-hidden={i !== index}
            draggable={false}
          />
        ))}

        {count > 1 && (
          <>
            <button type="button" className="slideshow__arrow slideshow__arrow--prev" aria-label={label.prev} onClick={() => go(index - 1)}>
              <span aria-hidden="true">{rtl ? '→' : '←'}</span>
            </button>
            <button type="button" className="slideshow__arrow slideshow__arrow--next" aria-label={label.next} onClick={() => go(index + 1)}>
              <span aria-hidden="true">{rtl ? '←' : '→'}</span>
            </button>
          </>
        )}
      </div>

      <figcaption className="slideshow__foot">
        <span className="label slideshow__count" aria-live="polite">
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
        <span className="label slideshow__caption">{current?.caption}</span>
      </figcaption>

      {count > 1 && (
        <div className="slideshow__dots">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className="slideshow__dot"
              aria-label={`${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </figure>
  );
}
