import {
  Amiri,
  Aref_Ruqaa,
  Cormorant_Garamond,
  Courier_Prime,
  EB_Garamond,
  IBM_Plex_Sans_Arabic
} from 'next/font/google';

/** Self hosted by Next, so there is no request to a font host at all. */

export const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap'
});

export const body = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap'
});

export const mono = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap'
});

/** The calligraphic stand in for her name, on both languages. */
export const arefRuqaa = Aref_Ruqaa({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-calligraphy',
  display: 'swap'
});

export const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic-body',
  display: 'swap',
  preload: false
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '600'],
  variable: '--font-arabic-ui',
  display: 'swap',
  preload: false
});

export const latinFonts = [display, body, mono, arefRuqaa].map((f) => f.variable).join(' ');
export const arabicFonts = [amiri, plexArabic].map((f) => f.variable).join(' ');
