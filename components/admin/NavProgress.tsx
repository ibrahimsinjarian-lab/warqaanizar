'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * A thin line across the top while a page is being fetched, so a click is
 * always answered at once even when the database takes a moment.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  // a click on any link inside the editor starts it
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.('a');
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return;

      const to = new URL(link.href, location.href);
      if (to.origin !== location.origin || to.pathname === location.pathname) return;
      setBusy(true);
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // and the new page arriving ends it
  useEffect(() => setBusy(false), [pathname]);

  return <span className={`navbar__progress${busy ? ' is-busy' : ''}`} aria-hidden="true" />;
}
