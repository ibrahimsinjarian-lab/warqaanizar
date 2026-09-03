import type { ReactNode } from 'react';
import { Footer, Sprite, Topbar } from './Chrome';
import Effects from './Effects';
import { arabicFonts, latinFonts } from '@/lib/fonts';
import { getSettings } from '@/lib/queries';
import { dirOf } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

const themeScript = `(function(){try{var s=localStorage.getItem('warqaa-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',s||(d?'dark':'light'))}catch(e){}})();`;

/**
 * One shell per language. Each locale has its own root layout so the page
 * can be statically rendered with the right lang and dir, without asking
 * for request headers.
 */
export default async function Shell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const settings = await getSettings(locale);
  const fonts = locale === 'ar' ? `${latinFonts} ${arabicFonts}` : latinFonts;

  return (
    <html lang={locale} dir={dirOf(locale)} data-theme="light" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <div className="grain" aria-hidden="true" />
        <Sprite />
        <Topbar locale={locale} ui={settings.ui ?? {}} />
        <main id="main">{children}</main>
        <Footer locale={locale} settings={settings} ui={settings.ui ?? {}} />
        <Effects />
      </body>
    </html>
  );
}
