import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'ورقاء نزار . كاتبة ومصمّمة', template: '%s . Warqaa Nizar' },
  description: 'مقالات وتصاميم ورقاء نزار، كاتبة ومصمّمة من بغداد.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell locale="ar">{children}</Shell>;
}
