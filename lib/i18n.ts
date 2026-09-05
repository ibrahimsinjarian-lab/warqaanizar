import type { Locale } from './types';

/** Interface wording. Anything she wants to reword lives in site_settings.ui and wins over these. */
export const STRINGS = {
  en: {
    home: 'Home',
    essays: 'Essays',
    designs: 'Designs',
    contact: 'Contact',
    about: 'About',
    writer: 'writer',
    designer: 'designer',
    scroll: 'scroll',
    getInTouch: 'get in touch',
    follow: 'follow',
    emailMe: 'email me',
    textMe: 'text me',
    filter: 'filter',
    allEssays: 'all essays',
    generalEssays: 'general essays',
    designEssays: 'design essays',
    all: 'all',
    interior: 'interior',
    architectural: 'architectural',
    showing: 'showing',
    pieces: 'pieces',
    projects: 'projects',
    backToEssays: 'back to essays',
    backToDesigns: 'back to designs',
    previous: 'previous',
    next: 'next',
    concept: 'concept',
    execution: 'execution',
    readingTime: 'minute read',
    nothingYet: 'Nothing published here yet.',
    switchLang: 'العربية',
    specType: 'type',
    specPlace: 'where',
    specYear: 'year',
    specStatus: 'status',
    writing: 'writing',
    builtAndDrawn: 'built and drawn',
    pages: 'pages',
    elsewhere: 'elsewhere'
  },
  ar: {
    home: 'الرئيسية',
    essays: 'مقالات',
    designs: 'تصاميم',
    contact: 'تواصل',
    about: 'عنها',
    writer: 'كاتبة',
    designer: 'مصمّمة',
    scroll: 'انزل',
    getInTouch: 'للتواصل',
    follow: 'تابعها',
    emailMe: 'راسلها',
    textMe: 'اكتب لها',
    filter: 'تصفية',
    allEssays: 'كل المقالات',
    generalEssays: 'مقالات عامة',
    designEssays: 'مقالات تصميم',
    all: 'الكل',
    interior: 'تصميم داخلي',
    architectural: 'عمارة',
    showing: 'المعروض',
    pieces: 'مقالة',
    projects: 'مشروع',
    backToEssays: 'رجوع إلى المقالات',
    backToDesigns: 'رجوع إلى التصاميم',
    previous: 'السابق',
    next: 'التالي',
    concept: 'الفكرة',
    execution: 'التنفيذ',
    readingTime: 'دقائق قراءة',
    nothingYet: 'لا يوجد منشور هنا بعد.',
    switchLang: 'English',
    specType: 'النوع',
    specPlace: 'المكان',
    specYear: 'السنة',
    specStatus: 'الحالة',
    writing: 'كتابة',
    builtAndDrawn: 'مرسوم ومبني',
    pages: 'الصفحات',
    elsewhere: 'روابط'
  }
} as const;

export type StringKey = keyof (typeof STRINGS)['en'];

export function t(locale: Locale, key: StringKey, overrides?: Record<string, string>): string {
  return overrides?.[key] ?? STRINGS[locale][key];
}

/** Build a path for a locale. English lives at the root, Arabic under /ar. */
export function path(locale: Locale, rest = ''): string {
  const clean = rest.startsWith('/') ? rest : rest ? `/${rest}` : '';
  return locale === 'ar' ? `/ar${clean}` : clean || '/';
}

export function dirOf(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar';
}

export function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn'
  }).format(new Date(iso));
}
