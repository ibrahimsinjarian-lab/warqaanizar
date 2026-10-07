import Link from 'next/link';
import PreviewSync from './PreviewSync';

/**
 * Shown while an editor is looking at unpublished work, so a draft is never
 * mistaken for the live page.
 */
export default function PreviewBanner({ kind, id }: { kind: 'essays' | 'designs'; id: string }) {
  return (
    <div className="previewbar">
      <span>Preview. Only you can see this page.</span>
      <PreviewSync />
      <Link href={`/admin/${kind}/${id}`}>Back to the editor</Link>
    </div>
  );
}
