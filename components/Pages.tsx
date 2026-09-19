import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bloom, Star } from './Chrome';
import { Plate, Prose } from './Bits';
import Slideshow from './Slideshow';
import { formatOf } from '@/lib/render';
import { Em } from '@/lib/emphasis';
import { DesignsSection, EssaysSection } from './Lists';
import {
  getPieceById,
  getDesign,
  getDesignImages,
  getDesignSections,
  getDesigns,
  getEssay,
  getEssays,
  getSettings
} from '@/lib/queries';
import { formatDate, path, t, type StringKey } from '@/lib/i18n';
import type { Design, DesignImage, Essay, Locale } from '@/lib/types';

/** The statement rises line by line, so it is split on its sentences. */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?؟])\s+/).filter(Boolean);
}

/** The piece before and after this one, for the links at the foot of a page. */
function neighbours<T extends { slug: string }>(items: T[], slug: string) {
  const i = items.findIndex((item) => item.slug === slug);
  if (i < 0) return { previous: null, next: null };
  return { previous: items[i - 1] ?? null, next: items[i + 1] ?? null };
}

function CrossNav({
  locale,
  line,
  to,
  label
}: {
  locale: Locale;
  line: string;
  to: 'essays' | 'designs';
  label: string;
}) {
  return (
    <section className="section wrap">
      <div className="crossnav" data-reveal="">
        <div>
          <p className="label bracket">{label}</p>
          <h2 className="h2" style={{ marginTop: '.6rem' }}>
            {line}
          </h2>
        </div>
        <Link className="bigarrow" href={path(locale, to)}>
          <span className="label">{label}</span>
          <span aria-hidden="true">&#8599;</span>
        </Link>
      </div>
    </section>
  );
}

function NextPrev({
  locale,
  kind,
  previous,
  next,
  ui
}: {
  locale: Locale;
  kind: 'essays' | 'designs';
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  ui: Record<string, string>;
}) {
  if (!previous && !next) return null;
  const s = (key: StringKey) => t(locale, key, ui);
  return (
    <nav className="nextprev">
      {previous ? (
        <Link href={path(locale, `${kind}/${previous.slug}`)}>
          <p className="label bracket">{s('previous')}</p>
          <h3 className="h3"><Em text={previous.title} /></h3>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={path(locale, `${kind}/${next.slug}`)}>
          <p className="label bracket">{s('next')}</p>
          <h3 className="h3"><Em text={next.title} /></h3>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/* ============================ home ============================ */

export async function HomePage({ locale }: { locale: Locale }) {
  const [settings, arabic] = await Promise.all([getSettings(locale), getSettings('ar')]);
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);
  const lines = settings.statement ? sentences(settings.statement) : [];

  return (
    <>
      <section className="hero wrap">
        <div className="hero__top">
          <p className="label bracket" data-reveal="">
            {settings.location}
          </p>
          {settings.instagram && (
            <a
              className="label label--accent"
              href={`https://www.instagram.com/${settings.instagram}/`}
              target="_blank"
              rel="noopener"
              data-reveal=""
              style={{ ['--d' as string]: '80ms' }}
            >
              <bdi dir="ltr">@{settings.instagram}</bdi>
            </a>
          )}
        </div>

        <div className="lockup">
          <div className="lockup__bloom lockup__bloom--left" data-reveal="" style={{ ['--d' as string]: '220ms' }}>
            <Bloom />
          </div>

          <div className="lockup__name">
            {/* Arabic shows both scripts, English only its own */}
            {locale === 'ar' ? (
              <>
                {/* the hand drawn calligraphy replaces this heading when she has drawn it */}
                <h1 className="calligraphy" lang="ar" dir="rtl" data-reveal="mask">
                  {arabic.display_name}
                </h1>
                <p className="latin" lang="en" dir="ltr" data-reveal="" style={{ ['--d' as string]: '160ms' }}>
                  Warqaa Nizar
                </p>
              </>
            ) : (
              <h1 className="calligraphy calligraphy--latin" data-reveal="mask">
                {settings.display_name || 'Warqaa Nizar'}
              </h1>
            )}
            <div className="roles" data-reveal="" style={{ ['--d' as string]: '240ms' }}>
              <span className="label">{s('writer')}</span>
              <span className="dotsep" aria-hidden="true" />
              <span className="label">{s('designer')}</span>
            </div>
          </div>

          <div className="lockup__bloom lockup__bloom--right" data-reveal="" style={{ ['--d' as string]: '300ms' }}>
            <Bloom />
          </div>
        </div>

        {(lines.length > 0 || settings.statement_aside.length > 0) && (
          <div className="hero__statement">
            <p className="quote">
              {lines.map((line, i) => (
                <span className="splitline" key={i} style={{ ['--d' as string]: `${i * 90}ms` }}>
                  <span><Em text={line} /></span>
                </span>
              ))}
            </p>
            {settings.statement_aside.length > 0 && (
              <div className="aside" data-reveal="" style={{ ['--d' as string]: '320ms' }}>
                {settings.statement_aside.map((word, i) => (
                  <p
                    className={`label${i === settings.statement_aside.length - 1 ? ' label--accent' : ''}`}
                    key={word}
                  >
                    {word}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="scrollcue" data-reveal="" style={{ ['--d' as string]: '420ms' }}>
          <span className="scrollcue__line" aria-hidden="true" />
          <span className="label">{s('scroll')}</span>
        </div>
      </section>

      {settings.marquee.length > 0 && (
        <div className="marquee" aria-label="Key ideas">
          <div className="marquee__track">
            {settings.marquee.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        </div>
      )}

      {(settings.about || settings.about_quote) && (
        <section className="section wrap" id="about">
          <div className="about">
            <figure className="about__figure" data-reveal="mask">
              <div className="portrait">
                <div className="portrait__ground" aria-hidden="true" />
                <div className="pattern pattern--fade" aria-hidden="true" />
                <Plate
                  className="portrait__arch plate plate--arch"
                  media={settings.portrait}
                  alt={locale === 'ar' ? settings.portrait?.alt_ar : settings.portrait?.alt_en}
                  angle={170}
                  mix={70}
                  sizes="(max-width: 760px) 70vw, 30vw"
                />
                {settings.portrait_tag && <span className="portrait__tag label">{settings.portrait_tag}</span>}
              </div>
            </figure>

            <div className="about__body">
              <p className="label bracket" data-reveal="">
                {s('about')}
              </p>
              {settings.about_quote && (
                <h2 className="h2" data-reveal="" style={{ ['--d' as string]: '80ms' }}>
                  <Em text={settings.about_quote} />
                </h2>
              )}
              {settings.about && (
                <div data-reveal="" style={{ ['--d' as string]: '160ms' }}>
                  <Prose content={settings.about} format={settings.content_format} className="bodytext bodytext--about" />
                </div>
              )}
              {settings.about_meta.length > 0 && (
                <div className="about__meta" data-reveal="" style={{ ['--d' as string]: '260ms' }}>
                  {settings.about_meta.map((row) => (
                    <div key={row.label}>
                      <span className="label">{row.label}</span>
                      <span className="label">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight wrap">
        <div className="portals">
          <Link className="portal" href={path(locale, 'essays')} data-reveal="">
            <div className="portal__plate">
              <div
                className="plate"
                style={{ ['--a' as string]: 210, ['--m' as string]: 55, ['--tone' as string]: 'var(--olive)' }}
              >
                <div className="plate__mark" aria-hidden="true">
                  <Star />
                </div>
              </div>
              <span className="portal__index label">01</span>
            </div>
            <div className="portal__foot">
              <span className="portal__title">{s('essays')}</span>
              <span className="portal__arrow" aria-hidden="true">
                &#8599;
              </span>
            </div>
            {settings.essays_note && <p className="portal__note">{settings.essays_note}</p>}
          </Link>

          <Link className="portal" href={path(locale, 'designs')} data-reveal="" style={{ ['--d' as string]: '120ms' }}>
            <div className="portal__plate">
              <div className="plate" style={{ ['--a' as string]: 320, ['--m' as string]: 75 }}>
                <div className="plate__mark" aria-hidden="true">
                  <Star />
                </div>
              </div>
              <span className="portal__index label">02</span>
            </div>
            <div className="portal__foot">
              <span className="portal__title">{s('designs')}</span>
              <span className="portal__arrow" aria-hidden="true">
                &#8599;
              </span>
            </div>
            {settings.designs_note && <p className="portal__note">{settings.designs_note}</p>}
          </Link>
        </div>
      </section>

      <section className="section wrap" id="contact">
        <div className="pattern pattern--fade" aria-hidden="true" style={{ opacity: 0.05 }} />
        <div className="contact">
          <div className="contact__title">
            <p className="label bracket" data-reveal="">
              {s('getInTouch')}
            </p>
            {settings.contact_title && (
              <h2 className="display" data-reveal="" style={{ ['--d' as string]: '80ms' }}>
                <Em text={settings.contact_title} />
              </h2>
            )}
          </div>
          <div className="contact__lines">
            {settings.email && (
              <p className="tnote" data-reveal="">
                <span>{s('emailMe')}</span>
                <a href={`mailto:${settings.email}`} dir="ltr">
                  {settings.email}
                </a>
              </p>
            )}
            {settings.whatsapp && (
              <p className="tnote" data-reveal="" style={{ ['--d' as string]: '80ms' }}>
                <span>{s('textMe')}</span>
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener"
                >
                  <bdi dir="ltr">{settings.whatsapp}</bdi>
                </a>
              </p>
            )}
            {settings.instagram && (
              <p className="tnote" data-reveal="" style={{ ['--d' as string]: '160ms' }}>
                <span>{s('follow')}</span>
                <a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noopener">
                  <bdi dir="ltr">@{settings.instagram}</bdi>
                </a>
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================ essays ============================ */

export async function EssaysPage({ locale }: { locale: Locale }) {
  const [settings, essays] = await Promise.all([getSettings(locale), getEssays(locale)]);
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);

  return (
    <>
      <EssaysSection locale={locale} settings={settings} essays={essays} ui={ui} />
      {settings.essays_crossnav && (
        <CrossNav locale={locale} line={settings.essays_crossnav} to="designs" label={s('designs')} />
      )}
    </>
  );
}

export async function EssayPage({
  locale,
  slug,
  previewId
}: {
  locale: Locale;
  slug?: string;
  previewId?: string;
}) {
  const [found, settings, all] = await Promise.all([
    previewId ? getPieceById('essays', previewId) : getEssay(locale, slug ?? ''),
    getSettings(locale),
    getEssays(locale)
  ]);
  if (!found) notFound();
  const essay = found as Essay;
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);
  const { previous, next } = neighbours<Essay>(all, slug ?? essay.slug);

  return (
    <>
      <div className="progress" aria-hidden="true" />
      <div className="article" data-progress-source="">
        <div className="article__pattern pattern" aria-hidden="true" />
        <div className="wrap">
          <header className="article__head">
            <p className="label bracket" data-reveal="">
              <Link href={path(locale, 'essays')}>{s('backToEssays')}</Link>
            </p>
            <h1 className="article__title" style={{ marginTop: '1.2rem' }} data-reveal="mask">
              <Em text={essay.title} />
            </h1>
            <div className="article__meta" data-reveal="" style={{ ['--d' as string]: '140ms' }}>
              <span className="label">{formatDate(essay.published_at, locale)}</span>
              {essay.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
              {essay.reading_minutes ? (
                <span className="label">
                  {essay.reading_minutes} {s('readingTime')}
                </span>
              ) : null}
            </div>
          </header>

          {essay.cover && (
            <figure className="article__cover" data-reveal="mask">
              <Plate
                media={essay.cover}
                alt={locale === 'ar' ? essay.cover.alt_ar : essay.cover.alt_en}
                sizes="(max-width: 1100px) 100vw, 1100px"
                priority
              />
            </figure>
          )}

          <article className="readingcard" data-reveal="" style={{ ['--d' as string]: '80ms' }}>
            <Prose content={essay.body} format={essay.content_format} />
            <div className="endmark" aria-hidden="true">
              <span />
              <Star />
              <span />
            </div>
          </article>
        </div>

        {settings.instagram && (
          <section className="section wrap">
            <div className="tnote" style={{ justifyItems: 'center', textAlign: 'center' }} data-reveal="">
              <span>{s('follow')}</span>
              <a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noopener">
                <bdi dir="ltr">@{settings.instagram}</bdi>
              </a>
            </div>
          </section>
        )}

        <NextPrev locale={locale} kind="essays" previous={previous} next={next} ui={ui} />
      </div>
    </>
  );
}

/* ============================ designs ============================ */

export async function DesignsPage({ locale }: { locale: Locale }) {
  const [settings, designs] = await Promise.all([getSettings(locale), getDesigns(locale)]);
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);

  return (
    <>
      <DesignsSection locale={locale} settings={settings} designs={designs} ui={ui} />
      {settings.designs_crossnav && (
        <CrossNav locale={locale} line={settings.designs_crossnav} to="essays" label={s('essays')} />
      )}
    </>
  );
}

export async function DesignPage({
  locale,
  slug,
  previewId
}: {
  locale: Locale;
  slug?: string;
  previewId?: string;
}) {
  const [found, settings, all] = await Promise.all([
    previewId ? getPieceById('designs', previewId) : getDesign(locale, slug ?? ''),
    getSettings(locale),
    getDesigns(locale)
  ]);
  if (!found) notFound();
  const design = found as Design;
  const [images, stored] = await Promise.all([
    getDesignImages(design.group_id),
    getDesignSections(design.group_id, Boolean(previewId))
  ]);
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);
  const { previous, next } = neighbours<Design>(all, slug ?? design.slug);

  const ar = locale === 'ar';
  const layout = design.layout ?? 'slideshow';
  const shown = images.filter((image) => image.media);

  // before 012 there are no sections: the old two fields stand in for them
  const sections: { id: string; heading: string; body: string }[] = (
    stored.length
      ? stored.map((sec) => ({
          id: sec.id,
          heading: (ar ? sec.heading_ar : sec.heading_en) ?? '',
          body: ar ? sec.body_ar : sec.body_en
        }))
      : [
          { id: 'concept', heading: s('concept'), body: design.concept },
          { id: 'execution', heading: s('execution'), body: design.execution }
        ]
  ).filter((sec) => sec.body?.trim() || shown.some((image) => image.section_id === sec.id));

  const alt = (image: DesignImage) => (ar ? image.media?.alt_ar : image.media?.alt_en) ?? '';
  const caption = (image: DesignImage) => (ar ? image.caption_ar : image.caption_en) ?? '';
  const inSection = (id: string) => shown.filter((image) => image.section_id === id);
  const loose = layout === 'sections' ? shown.filter((image) => !sections.some((sec) => sec.id === image.section_id)) : [];

  /** a picture at its own shape, never cropped */
  const figure = (image: DesignImage, sizes: string) => (
    <figure className="pfig" key={image.id} data-reveal="">
      <Plate
        media={image.media}
        alt={alt(image)}
        ratio={image.media?.width && image.media?.height ? `${image.media.width}/${image.media.height}` : undefined}
        sizes={sizes}
      />
      {caption(image) && <figcaption className="label">{caption(image)}</figcaption>}
    </figure>
  );

  const sectionText = (sec: (typeof sections)[number], i: number) => (
    <>
      {(sec.heading || sections.length > 1) && (
        <h2 className="psec__title" data-reveal="">
          <span className="label psec__index">{String(i + 1).padStart(2, '0')}</span>
          {sec.heading && <span>{sec.heading}</span>}
        </h2>
      )}
      <Prose content={sec.body} format={formatOf(sec.body)} className="bodytext" />
    </>
  );

  return (
    <>
      <section className="wrap">
        <div className="pagehead">
          <div className="pagehead__title">
            <p className="label bracket" data-reveal="">
              <Link href={path(locale, 'designs')}>{s('backToDesigns')}</Link>
            </p>
            <h1 className="display" style={{ marginTop: '1rem' }} data-reveal="mask">
              <Em text={design.title} />
            </h1>
          </div>
          <div className="pagehead__note">
            {design.summary && (
              <p className="lede" data-reveal="" style={{ ['--d' as string]: '120ms' }}>
                {design.summary}
              </p>
            )}
            <div
              className="article__meta"
              style={{ justifyContent: 'flex-start', marginTop: '1.2rem' }}
              data-reveal=""
            >
              {design.kind && <span className="tag">{design.kind}</span>}
              <span className="tag">{s(design.category === 'interior' ? 'interior' : 'architectural')}</span>
            </div>
          </div>
        </div>
      </section>

      {layout === 'slideshow' ? (
        <section className="section section--tight wrap">
          <div className="pbody pbody--slideshow">
            <div className="pbody__media" data-reveal="mask">
              {shown.length > 0 ? (
                <Slideshow
                  locale={locale}
                  slides={shown.map((image) => ({ id: image.id, media: image.media!, alt: alt(image), caption: caption(image) }))}
                />
              ) : (
                <Plate angle={150} ratio="4/5" />
              )}
            </div>
            <div className="pbody__text">
              {sections.map((sec, i) => (
                <div className="psec" key={sec.id}>
                  {sectionText(sec, i)}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="section section--tight wrap">
          <div className="pbody pbody--sections">
            {sections.map((sec, i) => {
              const own = inSection(sec.id);
              return (
                <div className={`prow${own.length ? '' : ' prow--text'}`} key={sec.id}>
                  <div className="prow__text">{sectionText(sec, i)}</div>
                  {own.length > 0 && (
                    <div className={`prow__media${own.length > 2 ? ' prow__media--grid' : ''}`}>
                      {own.map((image) => figure(image, own.length > 2 ? '(max-width: 900px) 50vw, 25vw' : '(max-width: 900px) 100vw, 50vw'))}
                    </div>
                  )}
                </div>
              );
            })}
            {loose.length > 0 && (
              <div className="pgallery">{loose.map((image) => figure(image, '(max-width: 700px) 100vw, 33vw'))}</div>
            )}
          </div>
        </section>
      )}

      <section className="section section--tight wrap">
        {(design.kind || design.spec_place || design.spec_year || design.spec_status) && (
          <div className="spec" data-reveal="">
            {design.kind && (
              <div>
                <span className="label">{s('specType')}</span>
                <strong>{design.kind}</strong>
              </div>
            )}
            {design.spec_place && (
              <div>
                <span className="label">{s('specPlace')}</span>
                <strong>{design.spec_place}</strong>
              </div>
            )}
            {design.spec_year && (
              <div>
                <span className="label">{s('specYear')}</span>
                <strong>{design.spec_year}</strong>
              </div>
            )}
            {design.spec_status && (
              <div>
                <span className="label">{s('specStatus')}</span>
                <strong>{design.spec_status}</strong>
              </div>
            )}
          </div>
        )}
      </section>

      <NextPrev locale={locale} kind="designs" previous={previous} next={next} ui={ui} />
    </>
  );
}
