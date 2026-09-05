import { EssaysPage } from '@/components/Pages';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'مقالات' };
export const revalidate = 3600;

export default function Page() {
  return <EssaysPage locale="ar" />;
}
