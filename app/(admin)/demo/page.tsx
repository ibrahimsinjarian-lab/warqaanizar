import { notFound } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import ThemeToggle from '@/components/admin/ThemeToggle';
import DesignEditor from '@/components/admin/DesignEditor';
import type { PlateRow } from '@/app/(admin)/media-actions';
import type { Design, DesignSection, Media } from '@/lib/types';

/**
 * The editor with made up content, for working on how it looks without
 * signing in. It does not exist in the built site: nothing here reads or
 * writes anything, and the buttons act on a project that is not real.
 */

export const dynamic = 'force-static';

const picture = (id: string, path: string, w: number, h: number, en: string): Media => ({
  id,
  path,
  alt_ar: '',
  alt_en: en,
  width: w,
  height: h,
  bytes: 400_000,
  mime: 'image/jpeg'
});

const SHOTS = [
  picture('m1', 'https://res.cloudinary.com/kshdwgsi/image/upload/v1789799975/xuwp5oa41sia2yuitvrb.jpg', 770, 512, 'A shanasheel facade over a busy street'),
  picture('m2', 'https://res.cloudinary.com/kshdwgsi/image/upload/v1789799977/mo1vkhucfufsyx9lq4cq.jpg', 770, 524, 'Brickwork and a shuttered window'),
  picture('m3', 'https://res.cloudinary.com/kshdwgsi/image/upload/v1789799979/ywwsgrzvbkqkzqk5gqlj.jpg', 770, 432, 'A narrow lane between two houses')
];

const SECTIONS: DesignSection[] = [
  {
    id: 's1',
    group_id: 'g1',
    sort: 0,
    heading_ar: 'الفكرة',
    heading_en: 'The concept',
    body_ar: '',
    body_en: '<p>The shanasheel was never only decoration. It was a room pushed out over the street so that a family could watch the city without being watched back.</p>'
  },
  {
    id: 's2',
    group_id: 'g1',
    sort: 1,
    heading_ar: 'التنفيذ',
    heading_en: 'How it was executed',
    body_ar: '',
    body_en: '<p>Built in a load bearing brick with a timber lattice made in a workshop in Karrada.</p>'
  }
];

const PLATES: PlateRow[] = SHOTS.map((media, i) => ({
  id: `p${i}`,
  caption_ar: null,
  caption_en: i === 0 ? 'The street side' : '',
  sort: i,
  section_id: i === 2 ? 's2' : null,
  media
}));

const DESIGN = {
  id: 'demo',
  group_id: 'g1',
  locale: 'en',
  is_source: false,
  translation_state: 'human',
  translated_at: null,
  reviewed_at: null,
  slug: 'shanasheel-study',
  title: 'Shanasheel Study',
  summary: 'A house that borrows one idea from the old river facades: a wall can be a place to sit inside.',
  concept: '',
  execution: '',
  kind: 'house',
  category: 'interior',
  spec_place: 'Baghdad',
  spec_year: '2026',
  spec_status: 'Study',
  cover_media_id: 'm1',
  cover: SHOTS[0],
  status: 'published',
  published_at: '2026-07-01T12:00:00Z',
  seo_title: null,
  seo_description: null,
  layout: 'slideshow',
  created_at: '2026-07-01T12:00:00Z',
  updated_at: '2026-07-01T12:00:00Z'
} as unknown as Design;

export default function Demo() {
  if (process.env.NODE_ENV === 'production') notFound();

  const bodies = Object.fromEntries(SECTIONS.map((s) => [s.id, s.body_en]));

  return (
    <div className="admin">
      <nav className="admin__nav">
        <div className="admin__brand">
          Warqaa Nizar
          <small>editor</small>
        </div>
        <AdminNav />
        <div className="admin__foot">
          <ThemeToggle />
          <span>warqaa@sinjarian.com</span>
          <Link href="/" target="_blank">
            View the site
          </Link>
        </div>
      </nav>
      <main className="admin__main">
        <DesignEditor design={DESIGN} sibling={{ id: 'x', locale: 'ar' }} plates={PLATES} sections={SECTIONS} bodies={bodies} flags={{}} />
      </main>
    </div>
  );
}
