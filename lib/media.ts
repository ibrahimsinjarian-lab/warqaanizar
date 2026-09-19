/**
 * Where a picture is served from. Safe on the server and in the browser.
 *
 * New pictures are stored as their full Cloudinary address. Cloudinary
 * resizes on request, so the site never ships the original: it asks for
 * the width the layout needs, in whatever format the reader's browser
 * handles best.
 */

const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

export const WIDTHS = [480, 800, 1200, 1800, 2400];

export function mediaUrl(path: string | null | undefined, width = 1600): string | null {
  if (!path) return null;

  if (CLOUDINARY.test(path)) {
    return path.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  if (/^https?:\/\//.test(path)) return path;

  // older rows pointed into Supabase Storage
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/media/${path}` : null;
}

/** The picture shown when a link is shared on WhatsApp, Instagram or anywhere else. */
export function shareImage(
  media: { path: string; alt_ar: string | null; alt_en: string | null } | null | undefined,
  locale: 'ar' | 'en'
) {
  const url = mediaUrl(media?.path, 1200);
  if (!media || !url) return {};
  const alt = (locale === 'ar' ? media.alt_ar : media.alt_en) ?? undefined;
  return { openGraph: { images: [{ url, alt }] }, twitter: { card: 'summary_large_image' as const, images: [url] } };
}

/** A srcset, so a phone downloads a phone sized picture. Empty when resizing is not possible. */
export function mediaSrcSet(path: string | null | undefined, max?: number | null): string | undefined {
  if (!path || !CLOUDINARY.test(path)) return undefined;
  const widths = WIDTHS.filter((w) => !max || w <= max);
  if (widths.length === 0) widths.push(WIDTHS[0]);
  return widths.map((w) => `${mediaUrl(path, w)} ${w}w`).join(', ');
}
