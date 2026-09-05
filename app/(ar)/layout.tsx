import type { Metadata, Viewport } from 'next';
import Shell from '@/components/Shell';
import '../globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://warqaanizar.vercel.app'),
  title: { default: 'ورقاء نزار . كاتبة ومصمّمة', template: '%s . Warqaa Nizar' },
  description: 'مقالات وتصاميم ورقاء نزار، كاتبة ومصمّمة من بغداد.'
};
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3ede2' },
    { media: '(prefers-color-scheme: dark)', color: '#100e0c' }
  ]
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell locale="ar">{children}</Shell>;
}
