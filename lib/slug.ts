/**
 * Slugs stay ASCII. An Arabic title is transliterated rather than dropped,
 * so a shared link reads /ar/essays/fy-wrathh-ghrfh instead of a wall of
 * percent escapes, and the address still hints at the piece.
 */

const ARABIC: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ٱ: 'a',
  ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh',
  ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh',
  ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n',
  ه: 'h', ة: 'a', و: 'w', ؤ: 'w', ي: 'y', ى: 'a', ئ: 'y',
  ء: '', ﻻ: 'la',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

export function slugify(input: string): string {
  const source = (input ?? '')
    .normalize('NFKD')
    .replace(/[ً-ْٰـ]/g, '') // Arabic diacritics and the kashida
    .replace(/[̀-ͯ]/g, ''); // Latin accents

  let out = '';
  for (const char of source) {
    if (char in ARABIC) out += ARABIC[char];
    else out += char;
  }

  const slug = out
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return slug || `piece-${Date.now().toString(36)}`;
}

/** Make a slug unique against the ones already taken in that language. */
export function uniqueSlug(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
