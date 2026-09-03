/* =========================================================
   Warqaa Nizar . site behaviour
   theme / menu / reveal / marquee / filters / progress
   ========================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canViewTransition = typeof document.startViewTransition === 'function';

  /* ---------- theme ---------- */

  function applyTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('warqaa-theme', next); } catch (e) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-pressed', String(next === 'dark'));
    });
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var box = btn.getBoundingClientRect();
      root.style.setProperty('--cx', (box.left + box.width / 2) + 'px');
      root.style.setProperty('--cy', (box.top + box.height / 2) + 'px');

      if (!canViewTransition || reduced) { applyTheme(next); return; }

      root.classList.add('theme-swap');
      var done = function () { root.classList.remove('theme-swap'); };
      var vt = document.startViewTransition(function () { applyTheme(next); });
      // a transition interrupted by another click rejects: clean up either way
      vt.finished.then(done, done);
      void event;
    });
  });

  /* ---------- sticky header ---------- */

  var topbar = document.querySelector('.topbar');
  if (topbar) {
    var onScrollBar = function () { topbar.classList.toggle('is-stuck', window.scrollY > 24); };
    onScrollBar();
    window.addEventListener('scroll', onScrollBar, { passive: true });
  }

  /* ---------- menu ---------- */

  var menu = document.querySelector('.menu');
  var burger = document.querySelector('[data-menu-toggle]');
  if (menu && burger) {
    var setMenu = function (open) {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
    };
    burger.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* ---------- reveal on scroll ---------- */

  var revealables = document.querySelectorAll('[data-reveal], .splitline');
  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- marquee: clone the track so the loop is seamless ---------- */

  document.querySelectorAll('.marquee').forEach(function (bar) {
    var track = bar.querySelector('.marquee__track');
    if (!track) return;
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    bar.appendChild(clone);
  });

  /* ---------- filters (essays + designs) ---------- */

  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var targetSel = group.getAttribute('data-filter-target');
    var items = Array.prototype.slice.call(document.querySelectorAll(targetSel));
    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-filter]'));
    var counter = document.querySelector(group.getAttribute('data-filter-count') || '__none__');

    var settle = null;

    function paint(value, animate) {
      var shown = 0;
      var matches = [];

      items.forEach(function (item) {
        var cats = (item.getAttribute('data-cat') || '').split(' ');
        var match = value === 'all' || cats.indexOf(value) > -1;
        if (match) { shown++; matches.push(item); }
        item.classList.toggle('is-out', !match);
      });

      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === value));
      });
      if (counter) counter.textContent = shown < 10 ? '0' + shown : String(shown);

      // let the ones leaving fade before they give up their space,
      // then stagger the ones arriving back in
      clearTimeout(settle);
      var collapse = function () {
        items.forEach(function (item) { item.hidden = item.classList.contains('is-out'); });
        matches.forEach(function (item, i) {
          item.style.setProperty('--d', (i * 45) + 'ms');
          if (!animate || reduced) return;
          item.classList.remove('is-in');
        });
        if (!animate || reduced) return;
        void document.body.offsetHeight; // flush the removal so the fade back in plays
        matches.forEach(function (item) { item.classList.add('is-in'); });
      };
      if (animate && !reduced) { settle = setTimeout(collapse, 260); } else { collapse(); }
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { paint(b.getAttribute('data-filter'), true); });
    });

    paint('all', false);
  });

  /* ---------- reading progress ---------- */

  var bar = document.querySelector('.progress');
  var article = document.querySelector('[data-progress-source]');
  if (bar && article) {
    var tick = function () {
      var box = article.getBoundingClientRect();
      var total = box.height - window.innerHeight;
      var done = total > 0 ? Math.min(Math.max(-box.top / total, 0), 1) : 0;
      bar.style.width = (done * 100).toFixed(2) + '%';
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
  }

  /* ---------- gentle parallax on scattered plates ---------- */

  var floaters = Array.prototype.slice.call(document.querySelectorAll('[data-float]'));
  if (floaters.length && !reduced && window.matchMedia('(min-width: 901px)').matches) {
    var ticking = false;
    var move = function () {
      var mid = window.innerHeight / 2;
      floaters.forEach(function (el) {
        var box = el.getBoundingClientRect();
        var offset = (box.top + box.height / 2 - mid) / mid;
        var depth = parseFloat(el.getAttribute('data-float')) || 1;
        el.style.transform = 'translate3d(0,' + (offset * depth * -22).toFixed(2) + 'px,0)';
      });
      ticking = false;
    };
    var request = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(move);
    };
    move();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  }

  /* ---------- year stamps ---------- */

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
