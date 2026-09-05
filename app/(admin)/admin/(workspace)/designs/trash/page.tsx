import type { Metadata } from 'next';
import Trash from '@/components/admin/Trash';

export const metadata: Metadata = { title: 'Trash' };
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ purged?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <Trash kind="designs" message={params.purged ? 'Deleted forever.' : params.error} />;
}
