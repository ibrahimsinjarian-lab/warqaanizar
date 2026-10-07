'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * A line across the top, and a busy pointer, while a page is being
 * fetched, so a click is always answered at once even when the database
 * takes a moment. The link itself also shows a small turning circle.
 */

/** Anything that moves to another page without a link, such as after a question, says so with this. */
export const NAVIGATING = 'warqaa:navigating';

export default function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [busy, setBusy] = useState(false);

  // a click on any link inside the editor starts it
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement | null)?.closest?.('a');
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return;

      const to = new URL(link.href, location.href);
      if (to.origin !== location.origin) return;
      if (to.pathname === location.pathname && to.search === location.search) return;
      setBusy(true);
    }
    const onStart = () => setBusy(true);

    document.addEventListener('click', onClick);
    window.addEventListener(NAVIGATING, onStart);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener(NAVIGATING, onStart);
    };
  }, []);

  // the new page arriving ends it
  useEffect(() => setBusy(false), [pathname, search]);

  // and it never spins forever, if the page never comes
  useEffect(() => {
    document.documentElement.classList.toggle('is-navigating', busy);
    if (!busy) return;
    const stop = window.setTimeout(() => setBusy(false), 20000);
    return () => window.clearTimeout(stop);
  }, [busy]);

  return <span className={`navbar__progress${busy ? ' is-busy' : ''}`} aria-hidden="true" />;
}
