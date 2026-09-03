import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'Warqaa Nizar . writer, designer', template: '%s . Warqaa Nizar' },
  description: 'Essays and designs by Warqaa Nizar, a writer and designer in Baghdad.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell locale="en">{children}</Shell>;
}
