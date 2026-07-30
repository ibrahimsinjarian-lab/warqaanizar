/* ─── MAIN.JS ─ shared behavior across all pages ─────── */
'use strict';

(function () {

  const html        = document.documentElement;
  const STORAGE_KEY = 'warqaa-theme';

  /* ── Hero load animation ──────────────────────────── */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { html.classList.add('loaded'); });
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

  /* Moon: filled circle with a mask cutout creating the crescent */
  const moonSVG = `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <defs>
      <mask id="wq-moon-mask">
        <rect width="14" height="14" fill="white"/>
        <circle cx="9.5" cy="4.5" r="4.2" fill="black"/>
      </mask>
    </defs>
    <circle cx="7" cy="7" r="5" fill="currentColor" mask="url(#wq-moon-mask)"/>
  </svg>`;

  /* Sun: small circle + 8 radiating lines */
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

  /*
    updateLinks — rewrites every internal <a href="*.html"> on the page
    to carry ?theme=dark (or strips the param for light).

    WHY: file:// protocol does not share localStorage across HTML files
    in Firefox (each file is a separate origin).  Encoding the theme in
    the URL guarantees the destination page always knows the current
    theme — the inline <head> script reads it before first paint.
  */
  function updateLinks(dark) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');

      /* skip anchors, external URLs, mailto, wa.me */
      if (!href) return;
      if (href.charAt(0) === '#') return;
      if (href.indexOf('://') !== -1) return;
      if (href.indexOf('mailto:') === 0) return;
      if (href.indexOf('wa.me') !== -1) return;
      if (href.indexOf('.html') === -1) return;

      /* split off fragment so ?theme never lands after # */
      var hash    = '';
      var hashIdx = href.indexOf('#');
      if (hashIdx !== -1) { hash = href.slice(hashIdx); href = href.slice(0, hashIdx); }

      /* strip any existing theme param cleanly */
      href = href
        .replace(/[?&]theme=[^&#]*/g, '')
        .replace(/\?&/, '?')
        .replace(/[?&]$/, '');

      /* append if dark */
      if (dark) {
        href += (href.indexOf('?') !== -1 ? '&' : '?') + 'theme=dark';
      }

      a.setAttribute('href', href + hash);
    });
  }

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
    /* update all internal links so the next page inherits the theme */
    updateLinks(dark);
    /* also persist for browsers where localStorage is shared (HTTP) */
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch (_) {}
  }

  /* seed button label from the theme the inline script already applied */
  applyTheme(isDark());

  toggle.addEventListener('click', function () {
    applyTheme(!isDark());
  });

  /*
    Cross-tab sync: when localStorage changes in another open tab
    (only possible when served over HTTP/HTTPS), mirror the change here.
  */
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) applyTheme(e.newValue === 'dark');
  });

  /* ── Nav: inject toggle + hamburger ──────────────── */
  const nav      = document.querySelector('.nav');
  const navLinks = nav && nav.querySelector('.nav-links');

  if (nav && navLinks) {
    nav.insertBefore(toggle, navLinks);

    const burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Toggle menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span>';
    nav.appendChild(burger);

    burger.addEventListener('click', function () {
      const isOpen = document.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      navLinks.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        burger.focus();
      }
    });
  }

  /* ── Scroll reveal ────────────────────────────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ── Hero hint: fade out on first scroll ─────────── */
  const hint = document.querySelector('.hero-hint');
  if (hint) {
    const onScroll = function () {
      if (window.scrollY > 50) {
        hint.style.opacity       = '0';
        hint.style.pointerEvents = 'none';
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

})();
