'use client';

import { useEffect, useState } from 'react';

/**
 * Light or dark for the editor, remembered on this browser. It starts on
 * whichever the computer is set to, which the small script in the layout
 * applies before anything is drawn, so the page never flashes the wrong one.
 */

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const now = document.documentElement.dataset.theme as Theme | undefined;
    setTheme(now ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('warqaa.editor.theme', next);
    } catch {}
  }

  return (
    <div className="segmented segmented--theme" role="group" aria-label="Light or dark">
      <button type="button" aria-pressed={theme === 'light'} onClick={() => choose('light')}>
        <span aria-hidden="true">☀</span> Light
      </button>
      <button type="button" aria-pressed={theme === 'dark'} onClick={() => choose('dark')}>
        <span aria-hidden="true">☾</span> Dark
      </button>
    </div>
  );
}
