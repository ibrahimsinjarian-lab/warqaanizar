import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bloom, Star } from './Chrome';
import { Empty, Plate, Prose } from './Bits';
import { DesignGrid, EssayList } from './Lists';
import {
  getDesign,
  getDesignImages,
  getDesigns,
  getEssay,
  getEssays,
  getSettings
} from '@/lib/queries';
import { formatDate, path, t, type StringKey } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

/* ============================ home ============================ */

export async function HomePage({ locale }: { locale: Locale }) {
  const [settings, arabic] = await Promise.all([getSettings(locale), getSettings('ar')]);
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);

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
            {/* the hand drawn calligraphy replaces this heading when she has drawn it */}
            <h1 className="calligraphy" lang="ar" dir="rtl" data-reveal="mask">
              {arabic.display_name}
            </h1>
            <p className="latin" data-reveal="" style={{ ['--d' as string]: '160ms' }}>
              Warqaa Nizar
            </p>
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

        {settings.statement && (
          <div className="hero__statement">
            <p className="quote" data-reveal="">
              {settings.statement}
            </p>
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

      {settings.about && (
        <section className="section wrap" id="about">
          <div className="about">
            <figure className="about__figure" data-reveal="mask">
              <div className="portrait">
                <div className="portrait__ground" aria-hidden="true" />
                <div className="pattern pattern--fade" aria-hidden="true" />
                <div className="portrait__arch plate plate--arch" style={{ ['--a' as string]: 170, ['--m' as string]: 70 }}>
                  <div className="plate__mark" aria-hidden="true">
                    <Star />
                  </div>
                </div>
              </div>
            </figure>
            <div className="about__body">
              <p className="label bracket" data-reveal="">
                {s('about')}
              </p>
              <Prose markdown={settings.about} className="prose about__prose" />
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight wrap">
        <div className="portals">
          <Link className="portal" href={path(locale, 'essays')} data-reveal="">
            <div className="portal__plate">
              <div className="plate" style={{ ['--a' as string]: 210, ['--m' as string]: 55, ['--tone' as string]: 'var(--olive)' }}>
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

      {(settings.email || settings.whatsapp || settings.instagram) && (
        <section className="section wrap" id="contact">
          <div className="pattern pattern--fade" aria-hidden="true" style={{ opacity: 0.05 }} />
          <div className="contact">
            <div className="contact__title">
              <p className="label bracket" data-reveal="">
                {s('getInTouch')}
              </p>
            </div>
            <div className="contact__lines">
              {settings.email && (
                <p className="tnote" data-reveal="">
                  <span>{s('emailMe')}</span>
                  <a href={`mailto:${settings.email}`} dir="ltr">{settings.email}</a>
                </p>
              )}
              {settings.whatsapp && (
                <p className="tnote" data-reveal="" style={{ ['--d' as string]: '80ms' }}>
                  <span>{s('textMe')}</span>
                  <a href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener">
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
      )}
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
      <section className="wrap">
        <div className="pagehead">
          <div className="pagehead__title">
            <p className="label bracket" data-reveal="">
              {s('writing')}
            </p>
            <h1 className="display" data-reveal="mask">
              {s('essays')}
            </h1>
          </div>
          {settings.essays_note && (
            <div className="pagehead__note">
              <p className="lede" data-reveal="" style={{ ['--d' as string]: '120ms' }}>
                {settings.essays_note}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="band">
        <div className="pattern pattern--fade" aria-hidden="true" style={{ opacity: 0.04 }} />
        <section className="wrap section section--tight">
          {essays.length === 0 ? (
            <Empty message={s('nothingYet')} />
          ) : (
            <EssayList locale={locale} essays={essays} ui={ui} />
          )}
        </section>
      </div>
    </>
  );
}

export async function EssayPage({ locale, slug }: { locale: Locale; slug: string }) {
  const essay = await getEssay(locale, slug);
  if (!essay) notFound();
  const settings = await getSettings(locale);
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);

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
              {essay.title}
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

          <article className="readingcard" data-reveal="" style={{ ['--d' as string]: '80ms' }}>
            <Prose markdown={essay.body} />
            <div className="endmark" aria-hidden="true">
              <span />
              <Star />
              <span />
            </div>
          </article>
        </div>
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
    <section className="wrap">
      <div className="pagehead">
        <div className="pagehead__title">
          <p className="label bracket" data-reveal="">
            {s('builtAndDrawn')}
          </p>
          <h1 className="display" data-reveal="mask">
            {s('designs')}
          </h1>
        </div>
        {settings.designs_note && (
          <div className="pagehead__note">
            <p className="lede" data-reveal="" style={{ ['--d' as string]: '120ms' }}>
              {settings.designs_note}
            </p>
          </div>
        )}
      </div>

      {designs.length === 0 ? (
        <Empty message={s('nothingYet')} />
      ) : (
        <DesignGrid locale={locale} designs={designs} ui={ui} />
      )}
    </section>
  );
}

export async function DesignPage({ locale, slug }: { locale: Locale; slug: string }) {
  const design = await getDesign(locale, slug);
  if (!design) notFound();
  const [settings, images] = await Promise.all([getSettings(locale), getDesignImages(design.group_id)]);
  const ui = settings.ui ?? {};
  const s = (key: StringKey) => t(locale, key, ui);
  const spots = ['s1', 's2', 's3', 's4', 's5'];

  return (
    <>
      <section className="wrap">
        <div className="pagehead">
          <div className="pagehead__title">
            <p className="label bracket" data-reveal="">
              <Link href={path(locale, 'designs')}>{s('backToDesigns')}</Link>
            </p>
            <h1 className="display" style={{ marginTop: '1rem' }} data-reveal="mask">
              {design.title}
            </h1>
          </div>
          <div className="pagehead__note">
            {design.summary && (
              <p className="lede" data-reveal="" style={{ ['--d' as string]: '120ms' }}>
                {design.summary}
              </p>
            )}
            <div className="article__meta" style={{ justifyContent: 'flex-start', marginTop: '1.2rem' }} data-reveal="">
              {design.kind && <span className="tag">{design.kind}</span>}
              <span className="tag">{s(design.category === 'interior' ? 'interior' : 'architectural')}</span>
            </div>
          </div>
        </div>
      </section>

      {images.length > 0 && (
        <section className="section section--tight wrap">
          <div className="scatter">
            {images.slice(0, 4).map((image, i) => (
              <figure key={image.id} className={spots[i]} data-reveal="mask" data-float={String(1 + (i % 3) * 0.4)}>
                <Plate
                  media={image.media}
                  alt={locale === 'ar' ? image.media?.alt_ar : image.media?.alt_en}
                  angle={(i * 70 + 150) % 360}
                  ratio={['4/3', '3/4', '1/1', '5/4'][i]}
                />
                <figcaption className="label">
                  {String(i + 1).padStart(2, '0')} . {(locale === 'ar' ? image.caption_ar : image.caption_en) ?? ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="section wrap">
        <div className="about">
          <div className="about__figure">
            <p className="label bracket" data-reveal="">
              {s('concept')}
            </p>
          </div>
          <div className="about__body">
            <Prose markdown={design.concept} />
            {design.execution && (
              <>
                <p className="label bracket" style={{ marginTop: '2.5rem' }} data-reveal="">
                  {s('execution')}
                </p>
                <Prose markdown={design.execution} />
              </>
            )}
          </div>
        </div>

        {(design.kind || design.spec_place || design.spec_year || design.spec_status) && (
          <div className="spec" style={{ marginTop: '3.5rem' }} data-reveal="">
            {design.kind && (
              <div>
                <span className="label">{s('designs')}</span>
                <strong>{design.kind}</strong>
              </div>
            )}
            {design.spec_place && (
              <div>
                <span className="label">{settings.location}</span>
                <strong>{design.spec_place}</strong>
              </div>
            )}
            {design.spec_year && (
              <div>
                <span className="label">{'year'}</span>
                <strong>{design.spec_year}</strong>
              </div>
            )}
            {design.spec_status && (
              <div>
                <span className="label">{'status'}</span>
                <strong>{design.spec_status}</strong>
              </div>
            )}
          </div>
        )}
      </section>

      {images.length > 4 && (
        <section className="section section--tight wrap">
          <div className="scatter">
            <figure className="s5" data-reveal="mask" data-float="0.9">
              <Plate media={images[4].media} alt={locale === 'ar' ? images[4].media?.alt_ar : images[4].media?.alt_en} ratio="16/9" />
              <figcaption className="label">
                05 . {(locale === 'ar' ? images[4].caption_ar : images[4].caption_en) ?? ''}
              </figcaption>
            </figure>
          </div>
        </section>
      )}
    </>
  );
}
