'use client';

import { useEffect } from 'react';

/**
 * ED 10. The saved and error messages travel in the address, so a refresh
 * used to announce them again. This takes them out of the address once they
 * have been shown, without adding a history entry.
 */
export default function ClearFlags() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const noisy = ['saved', 'error', 'translated', 'restored', 'fresh', 'trashed', 'purged', 'deleted'];
    const had = noisy.filter((k) => url.searchParams.has(k));
    if (had.length === 0) return;

    const timer = window.setTimeout(() => {
      had.forEach((k) => url.searchParams.delete(k));
      window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
