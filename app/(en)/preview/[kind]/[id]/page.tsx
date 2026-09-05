import { notFound, redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/supabase-server';
import { DesignPage, EssayPage } from '@/components/Pages';
import PreviewBanner from '@/components/PreviewBanner';

/** ED 04. A draft, on the real site, visible only to a signed in editor. */
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;

  const { isAdmin } = await currentAdmin();
  if (!isAdmin) redirect('/admin/login');
  if (kind !== 'essays' && kind !== 'designs') notFound();

  return (
    <>
      <PreviewBanner kind={kind} id={id} />
      {kind === 'essays' ? (
        <EssayPage locale="en" previewId={id} />
      ) : (
        <DesignPage locale="en" previewId={id} />
      )}
    </>
  );
}
