import { DesignsPage } from '@/components/Pages';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Designs' };
export const revalidate = 3600;

export default function Page() {
  return <DesignsPage locale="en" />;
}
