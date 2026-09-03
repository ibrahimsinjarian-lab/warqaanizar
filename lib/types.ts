export type Locale = 'en' | 'ar';

export const LOCALES: Locale[] = ['en', 'ar'];

export type TranslationState = 'original' | 'machine' | 'machine_edited' | 'human';
export type Status = 'draft' | 'published';

export interface Essay {
  id: string;
  group_id: string;
  locale: Locale;
  is_source: boolean;
  translation_state: TranslationState;
  translated_at: string | null;
  reviewed_at: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  category: 'general' | 'design';
  tags: string[];
  cover_media_id: string | null;
  status: Status;
  published_at: string | null;
  reading_minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Design {
  id: string;
  group_id: string;
  locale: Locale;
  is_source: boolean;
  translation_state: TranslationState;
  translated_at: string | null;
  reviewed_at: string | null;
  slug: string;
  title: string;
  summary: string | null;
  concept: string;
  execution: string;
  kind: string | null;
  category: 'interior' | 'architectural';
  spec_place: string | null;
  spec_year: string | null;
  spec_status: string | null;
  cover_media_id: string | null;
  status: Status;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  path: string;
  alt_ar: string | null;
  alt_en: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  mime: string | null;
}

export interface DesignImage {
  id: string;
  group_id: string;
  media_id: string;
  caption_ar: string | null;
  caption_en: string | null;
  sort: number;
  media?: Media | null;
}

export interface SiteSettings {
  locale: Locale;
  display_name: string | null;
  roles: string | null;
  statement: string | null;
  about: string;
  marquee: string[];
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  essays_note: string | null;
  designs_note: string | null;
  location: string | null;
  statement_aside: string[];
  about_quote: string | null;
  about_meta: { label: string; value: string }[];
  contact_title: string | null;
  essays_crossnav: string | null;
  designs_crossnav: string | null;
  portrait_tag: string | null;
  ui: Record<string, string>;
}
