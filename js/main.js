/* ─── MAIN.JS ─ shared behavior across all pages ─────── */
'use strict';

(function () {

  const html        = document.documentElement;
  const STORAGE_KEY = 'warqaa-theme';

  /* ── Hero load animation ──────────────────────────── */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.add('loaded');
    });
  });

  /* ── Active nav link ──────────────────────────────── */
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href      = link.getAttribute('href');
    const isHome    = (current === '' || current === 'index.html') && href === 'index.html';
    const isEssays  = current === 'essays.html'  && href === 'essays.html';
    const isDesigns = current === 'designs.html' && href === 'designs.html';
    if (isHome || isEssays || isDesigns) link.classList.add('active');
  });

  /* ── Theme ────────────────────────────────────────── */

  /* Moon SVG — crescent via filled circle + mask */
  const moonSVG = `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <defs>
      <mask id="wq-moon-mask">
        <rect width="14" height="14" fill="white"/>
        <circle cx="9.5" cy="4.5" r="4.2" fill="black"/>
      </mask>
    </defs>
    <circle cx="7" cy="7" r="5" fill="currentColor" mask="url(#wq-moon-mask)"/>
  </svg>`;

  /* Sun SVG — circle + 8 radiating lines */
  const sunSVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
    <circle cx="7" cy="7" r="2.6" stroke="currentColor" stroke-width="1.1"/>
    <line x1="7"    y1="0.5"  x2="7"    y2="2.8"  stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <line x1="7"    y1="11.2" x2="7"    y2="13.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <line x1="0.5"  y1="7"    x2="2.8"  y2="7"    stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <line x1="11.2" y1="7"    x2="13.5" y2="7"    stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <line x1="2.4"  y1="2.4"  x2="4.0"  y2="4.0"  stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <line x1="10.0" y1="10.0" x2="11.6" y2="11.6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <line x1="11.6" y1="2.4"  x2="10.0" y2="4.0"  stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <line x1="4.0"  y1="10.0" x2="2.4"  y2="11.6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
  </svg>`;

  const toggle = document.createElement('button');
  toggle.className = 'theme-toggle';
  toggle.innerHTML = `<span class="theme-icon theme-icon-moon">${moonSVG}</span>` +
                     `<span class="theme-icon theme-icon-sun">${sunSVG}</span>`;

  function isDark() {
    return html.getAttribute('data-theme') === 'dark';
  }

  /* Central apply-theme: sets the attribute AND updates the button label */
  function applyTheme(dark) {
    if (dark) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    toggle.setAttribute(
      'aria-label',
      dark ? 'Switch to light theme' : 'Switch to dark theme'
    );
  }

  /* Init label from current state (set by the inline <head> script) */
  applyTheme(isDark());

  /* User clicks the toggle on this page */
  toggle.addEventListener('click', () => {
    const next = !isDark();
    applyTheme(next);
    /* Persist so every other page picks it up on load */
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch (_) { /* localStorage unavailable (private mode, iframe, etc.) */ }
  });

  /*
    Cross-tab / cross-page sync.
    When localStorage changes in another tab (or another open page),
    the 'storage' event fires HERE — so all open pages update together
    without needing a reload.
  */
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) {
      applyTheme(e.newValue === 'dark');
    }
  });

  /* ── Nav: inject toggle + hamburger ──────────────── */
  const nav      = document.querySelector('.nav');
  const navLinks = nav?.querySelector('.nav-links');

  if (nav && navLinks) {
    /* insert toggle before the nav-links */
    nav.insertBefore(toggle, navLinks);

    const burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Toggle menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span>';
    nav.appendChild(burger);

    burger.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      navLinks.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        burger.focus();
      }
    });
  }

  /* ── Scroll reveal via IntersectionObserver ──────── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => observer.observe(el));
  }

  /* ── Hero hint: fade out on first scroll ─────────── */
  const hint = document.querySelector('.hero-hint');
  if (hint) {
    const onScroll = () => {
      if (window.scrollY > 50) {
        hint.style.opacity       = '0';
        hint.style.pointerEvents = 'none';
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

})();
