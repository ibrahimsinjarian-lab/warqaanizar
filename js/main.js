/* ─── MAIN.JS ─ shared behavior across all pages ─────── */
'use strict';

(function () {

  /* ── Hero load animation ──────────────────────────── */
  /*
    Double requestAnimationFrame ensures at least one frame has been
    painted with opacity:0 before the transition fires, preventing a
    flash of already-visible content on fast connections.
  */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add('loaded');
    });
  });

  /* ── Active nav link ──────────────────────────────── */
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    const isHome    = (current === '' || current === 'index.html') && href === 'index.html';
    const isEssays  = current === 'essays.html'  && href === 'essays.html';
    const isDesigns = current === 'designs.html' && href === 'designs.html';
    if (isHome || isEssays || isDesigns) link.classList.add('active');
  });

  /* ── Mobile hamburger nav ────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    /* inject burger button — degrades gracefully if JS is off */
    const burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Toggle menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span>';
    nav.appendChild(burger);

    const navLinks = nav.querySelector('.nav-links');

    burger.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      navLinks?.setAttribute('aria-hidden', String(!isOpen));
      /* prevent background scroll while panel is open */
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    /* close panel when any nav link is followed */
    navLinks?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    /* close panel on Escape */
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
        hint.style.transition = 'opacity 0.4s ease';
        hint.style.opacity    = '0';
        hint.style.pointerEvents = 'none';
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

})();
