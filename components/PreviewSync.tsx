'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

/**
 * The preview tab redraws itself each time the editor saves this piece,
 * so it can stay open beside the editor. It opens at once, before a save
 * has finished, and catches up when it does.
 */
export default function PreviewSync() {
  const router = useRouter();
  const [refreshing, start] = useTransition();
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('warqaa-preview');
    channel.onmessage = (e) => {
      if (typeof e.data !== 'string' || new URL(e.data, location.href).pathname !== location.pathname) return;
      start(() => router.refresh());
      setFresh(true);
    };
    return () => channel.close();
  }, [router]);

  useEffect(() => {
    if (!fresh || refreshing) return;
    const done = window.setTimeout(() => setFresh(false), 2500);
    return () => window.clearTimeout(done);
  }, [fresh, refreshing]);

  return (
    <span className="previewbar__sync" role="status" aria-live="polite">
      {refreshing ? 'Updating with your latest save' : fresh ? 'Updated' : 'Updates each time you save'}
    </span>
  );
}
