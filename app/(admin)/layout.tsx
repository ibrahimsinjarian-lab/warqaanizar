import type { Metadata } from 'next';
import './admin.css';
import { AskHost } from '@/components/admin/Ask';

export const metadata: Metadata = {
  title: { default: 'Editor . Warqaa Nizar', template: '%s . Editor' },
  robots: { index: false, follow: false }
};

/**
 * Her choice of light or dark is applied before the first paint, so the
 * editor never flashes the other one on the way in.
 */
const THEME = `try{var t=localStorage.getItem('warqaa.editor.theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}`;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    // the script sets data-theme before React arrives, which is the point of it
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>
        {children}
        <AskHost />
      </body>
    </html>
  );
}
