'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { path, t, otherLocale, type StringKey } from '@/lib/i18n';
import type { Locale, SiteSettings } from '@/lib/types';

type UI = Record<string, string>;

/* ---------- the drawings, defined once per page ---------- */

export function Sprite() {
  return (
    <svg width="0" height="0" className="visually-hidden" aria-hidden="true" focusable="false">
      <defs>
        <path id="wpetal" d="M0 0 C-30 -34 -30 -74 0 -104 C30 -74 30 -34 0 0 Z" />
      </defs>
      <symbol id="bloom" viewBox="0 0 200 480">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 150 C107 214 89 262 97 322 C105 382 94 428 99 476" strokeWidth="2.2" />
          <g transform="translate(97 302) rotate(-116) scale(.5 .4)">
            <use href="#wpetal" fill="currentColor" fillOpacity=".07" />
          </g>
          <g transform="translate(99 378) rotate(124) scale(.44 .36)">
            <use href="#wpetal" fill="currentColor" fillOpacity=".07" />
          </g>
          <path d="M98 336 C128 328 143 304 141 274" strokeWidth="1.3" />
          <g transform="translate(141 274) rotate(16) scale(.3)">
            <use href="#wpetal" fill="currentColor" fillOpacity=".16" />
            <use href="#wpetal" transform="rotate(-24) scale(.82)" />
            <use href="#wpetal" transform="rotate(24) scale(.82)" />
          </g>
          <g transform="translate(100 150)">
            <g fill="currentColor" fillOpacity=".08">
              <use href="#wpetal" transform="rotate(-78)" />
              <use href="#wpetal" transform="rotate(-39)" />
              <use href="#wpetal" />
              <use href="#wpetal" transform="rotate(39)" />
              <use href="#wpetal" transform="rotate(78)" />
            </g>
            <g fill="currentColor" fillOpacity=".18">
              <use href="#wpetal" transform="rotate(-56) scale(.72)" />
              <use href="#wpetal" transform="rotate(-19) scale(.68)" />
              <use href="#wpetal" transform="rotate(19) scale(.68)" />
              <use href="#wpetal" transform="rotate(56) scale(.72)" />
            </g>
            <g strokeWidth="1.1">
              {[-72, -54, -36, -18, 0, 18, 36, 54, 72].map((a, i) => {
                const len = [31, 36, 30, 39, 33, 39, 30, 36, 31][i];
                return (
                  <g key={a} transform={`rotate(${a})`}>
                    <path d={`M0 -13 L0 -${len}`} />
                    <circle cy={-(len + 3)} r="2.1" fill="currentColor" />
                  </g>
                );
              })}
            </g>
            <circle r="11" fill="currentColor" fillOpacity=".85" stroke="none" />
            <circle r="6" fill="none" strokeWidth="1" />
          </g>
        </g>
      </symbol>
      <symbol id="star8" viewBox="0 0 60 60">
        <path
          fill="currentColor"
          opacity=".9"
          d="M30 4 37.4 15.6 51 15.6 51 29.2 60 30 51 30.8 51 44.4 37.4 44.4 30 56 22.6 44.4 9 44.4 9 30.8 0 30 9 29.2 9 15.6 22.6 15.6Z"
        />
      </symbol>
    </svg>
  );
}

export function Bloom({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 480" aria-hidden="true">
      <use href="#bloom" />
    </svg>
  );
}

export function Star() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <use href="#star8" />
    </svg>
  );
}

/* ---------- header and menu ---------- */

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const box = event.currentTarget.getBoundingClientRect();
    root.style.setProperty('--cx', `${box.left + box.width / 2}px`);
    root.style.setProperty('--cy', `${box.top + box.height / 2}px`);

    const apply = () => {
      root.setAttribute('data-theme', next);
      setTheme(next);
      try {
        localStorage.setItem('warqaa-theme', next);
      } catch {
        /* private browsing */
      }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startViewTransition = (document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }).startViewTransition;

    if (!startViewTransition || reduced) {
      apply();
      return;
    }
    root.classList.add('theme-swap');
    const done = () => root.classList.remove('theme-swap');
    startViewTransition.call(document, apply).finished.then(done, done);
  };

  return { theme, toggle };
}

export function Topbar({
  locale,
  ui,
  settings,
  siblingPath
}: {
  locale: Locale;
  ui: UI;
  settings: SiteSettings;
  siblingPath?: string | null;
}) {
  const { toggle } = useTheme();
  const pathname = usePathname();
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const s = (key: StringKey) => t(locale, key, ui);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const other = otherLocale(locale);
  const switchTo = siblingPath ?? path(other);
  const here = (href: string) => (pathname === href ? 'page' : undefined);
  const inSection = (section: string) =>
    pathname === path(locale, section) || pathname.startsWith(path(locale, section) + '/') ? 'page' : undefined;

  return (
    <>
      <header className={`topbar${stuck ? ' is-stuck' : ''}`}>
        <Link className="brand" href={path(locale)}>
          <span className="dot" aria-hidden="true" />
          Warqaa Nizar
        </Link>
        <div className="topbar__right">
          <Link className="navlink is-desktop" href={path(locale)} aria-current={here(path(locale))}>
            {s('home')}
          </Link>
          <Link className="navlink is-desktop" href={path(locale, 'essays')} aria-current={inSection('essays')}>
            {s('essays')}
          </Link>
          <Link className="navlink is-desktop" href={path(locale, 'designs')} aria-current={inSection('designs')}>
            {s('designs')}
          </Link>
          <a className="navlink is-desktop" href={`${path(locale)}#contact`}>
            {s('contact')}
          </a>
          <Link className="navlink is-desktop langswitch" href={switchTo} lang={other}>
            {s('switchLang')}
          </Link>
          <button className="iconbtn" onClick={toggle} aria-label="Switch theme">
            <svg className="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
            </svg>
            <svg className="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
            </svg>
          </button>
          <button
            className="burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu"
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav className="menu" id="menu" aria-hidden={!open}>
        <Bloom className="menu__bloom menu__bloom--left" />
        <Bloom className="menu__bloom menu__bloom--right" />
        <div className="menu__inner">
          <ul className="menu__list">
            {(
              [
                ['home', path(locale)],
                ['essays', path(locale, 'essays')],
                ['designs', path(locale, 'designs')]
              ] as [StringKey, string][]
            ).map(([key, href], i) => (
              <li key={key} style={{ ['--i' as string]: i }}>
                <Link href={href} onClick={() => setOpen(false)}>
                  {s(key)}
                </Link>
              </li>
            ))}
            <li style={{ ['--i' as string]: 3 }}>
              <Link href={`${path(locale)}#contact`} onClick={() => setOpen(false)}>
                {s('contact')}
              </Link>
            </li>
          </ul>
          <div className="menu__meta">
            {settings.location && <span className="label bracket">{settings.location}</span>}
            {settings.instagram && (
              <a
                className="label label--accent"
                href={`https://www.instagram.com/${settings.instagram}/`}
                target="_blank"
                rel="noopener"
              >
                <bdi dir="ltr">@{settings.instagram}</bdi>
              </a>
            )}
            {settings.roles && <span className="label bracket">{settings.roles}</span>}
            <Link className="label langswitch" href={switchTo} lang={other}>
              {s('switchLang')}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ---------- footer ---------- */

export function Footer({ locale, settings, ui }: { locale: Locale; settings: SiteSettings; ui: UI }) {
  const s = (key: StringKey) => t(locale, key, ui);
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__grid">
          <div>
            <Bloom className="foot__bloom" />
            <p className="label" style={{ marginTop: '.8rem' }}>
              {settings.display_name}
            </p>
            <p className="label">{settings.roles}</p>
          </div>
          <div>
            <p className="label bracket">{s('pages')}</p>
            <ul style={{ marginTop: '.7rem', display: 'grid', gap: '.35rem' }}>
              <li>
                <Link className="navlink" href={path(locale)}>
                  {s('home')}
                </Link>
              </li>
              <li>
                <Link className="navlink" href={path(locale, 'essays')}>
                  {s('essays')}
                </Link>
              </li>
              <li>
                <Link className="navlink" href={path(locale, 'designs')}>
                  {s('designs')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="label bracket">{s('elsewhere')}</p>
            <ul style={{ marginTop: '.7rem', display: 'grid', gap: '.35rem' }}>
              {settings.instagram && (
                <li>
                  <a
                    className="navlink"
                    href={`https://www.instagram.com/${settings.instagram}/`}
                    target="_blank"
                    rel="noopener"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a className="navlink" href={`mailto:${settings.email}`}>
                    Email
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="label bracket">{s('colophon')}</p>
            <p className="label" style={{ marginTop: '.7rem' }}>
              {s('setIn')}
            </p>
          </div>
        </div>
        <div className="foot__bottom">
          <span className="label">
            &copy; {new Date().getFullYear()} {settings.display_name}
          </span>
          {settings.location && <span className="label">{settings.location}</span>}
        </div>
      </div>
    </footer>
  );
}
