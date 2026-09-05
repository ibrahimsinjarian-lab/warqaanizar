import type { Metadata } from 'next';
import Wizard from '@/components/admin/Wizard';

export const metadata: Metadata = { title: 'New project' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Wizard kind="designs" />;
}
