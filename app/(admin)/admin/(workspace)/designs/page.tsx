import type { Metadata } from 'next';
import PieceList from '@/components/admin/PieceList';

export const metadata: Metadata = { title: 'Projects' };
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; deleted?: string; trashed?: string }>;
}) {
  const params = await searchParams;
  return (
    <PieceList
      kind="designs"
      trashed={params.trashed}
      message={{
        error: params.error,
        saved: params.deleted ? 'Deleted.' : undefined
      }}
    />
  );
}
