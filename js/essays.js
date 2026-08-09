/* essays.js — dynamic list from Supabase, filter, reading overlay */
'use strict';
(function () {

  /* Fallback used when Supabase is not yet configured */
  var FALLBACK = [
    { num:'01', title:'On the Architecture of Belonging', tags:['design psychology','political philosophy'], category:'design, general', year:'2025', content:'<p>Every space makes a claim about who it was built for. Sometimes this claim is explicit, written into the building\'s programme or the city\'s zoning laws. More often it is embedded in the texture of things: the width of a door, the height of a counter, the placement of a window, the acoustics of a lobby. These are not neutral decisions. They are choices, and choices always have a politics.</p><p>To belong somewhere is not simply to be tolerated inside it. It is to feel that the space was made with you in mind. That the light falls where you need it. That the proportions suit your body. That the room does not ask you to shrink in order to move through it. This kind of belonging is rarer than we tend to admit, and its absence is rarely named for what it is.</p>' },
    { num:'02', title:'What Walls Remember', tags:['heritage','architecture'], category:'general', year:'2025', content:'<p>There is a theory in architecture that buildings outlive their purposes but retain the memory of them. A factory converted to apartments still carries something of the factory in its bones. These are not just aesthetic traces. They are a form of testimony.</p><p>I grew up moving between houses. None of them held long enough to become architecture in the full sense of the word. But I remember the quality of particular walls. Memory does not require permanence. It requires attention.</p>' },
    { num:'03', title:'The Politics of Interior Space', tags:['political philosophy','design'], category:'design', year:'2024', content:'<p>The interior is often treated as the domain of the personal, separate from the political. This separation is itself a political act. To declare the domestic private is to remove it from scrutiny, and to remove it from scrutiny is to protect the arrangements of power that organise it.</p>' },
    { num:'04', title:'Softness as Resistance', tags:['design psychology'], category:'design', year:'2024', content:'<p>The aesthetics of institutional spaces are rarely accidental. The hard surfaces, the bright lights, the chairs that discourage staying too long. These are design choices that express a relationship to the people who use the space.</p><p>Softness in design is often dismissed as comfort, and comfort is often treated as a luxury. But softness is also a form of permission.</p>' },
    { num:'05', title:'Reading Rooms as Acts of Care', tags:['general'], category:'general', year:'2024', content:'<p>The reading room is one of the more generous inventions of public architecture. It asks very little of you. It offers shelter, light, and silence. It makes no demands on your productivity. It simply holds you while you think.</p>' },
    { num:'06', title:'The Language of Thresholds', tags:['design psychology','heritage'], category:'design, general', year:'2023', content:'<p>Every building has a moment of arrival, and that moment communicates something before a single word has been spoken. The threshold is architecture\'s first sentence. It sets the register for everything that follows.</p>' },
    { num:'07', title:'Who Gets to Name a Place Home', tags:['political philosophy','general'], category:'general', year:'2023', content:'<p>Home is not a building. This is something that everyone who has had their building taken away knows. Home is a set of practices, a network of relationships, a layering of time.</p>' },
    { num:'08', title:'Material as Memory', tags:['design','heritage'], category:'design', year:'2023', content:'<p>Materials carry time. This is one of the things that makes them interesting as a design medium. Stone that has been worn by feet tells you something about the number of people who passed and the duration of the passing.</p>' },
  ];

  var essays = FALLBACK;

  /* ── Load from Supabase, then render ── */
  function init() {
    var load = (window.supabaseClient)
      ? window.supabaseClient.from('essays').select('*').order('num')
          .then(function (r) {
            /* Use Supabase data whenever available, even if empty */
            if (!r.error) essays = r.data || [];
          })
          .catch(function () {})
      : Promise.resolve();

    load.then(renderList).then(wireUI);
  }

  /* ── Render essay list into #dynamic-essay-list ── */
  function renderList() {
    var list = document.getElementById('dynamic-essay-list');
    if (!list) return;

    if (!essays.length) {
      list.innerHTML =
        '<li style="padding:48px 0;color:var(--dim);font-family:var(--f-body);font-style:italic">' +
        'No essays yet. Add essays in the admin panel.</li>';
      return;
    }

    list.innerHTML = essays.map(function (e) {
      return '<li class="essay-item" data-category="' + (e.category || 'general') + '" data-reveal>' +
        '<div class="essay-main">' +
          '<span class="essay-num">' + (e.num || '') + '</span>' +
          '<a href="#" class="essay-title">' + escHtml(e.title || '') + '</a>' +
          '<div class="essay-tags">' +
            (e.tags || []).map(function (t) {
              return '<span class="tag">[ ' + escHtml(t) + ' ]</span>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<span class="essay-year">' + escHtml(e.year || '') + '</span>' +
      '</li>';
    }).join('');

    /* reinitialise scroll-reveal on newly rendered items */
    if (window.IntersectionObserver) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('revealed'); obs.unobserve(en.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      list.querySelectorAll('[data-reveal]').forEach(function (el) { obs.observe(el); });
    } else {
      list.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('revealed'); });
    }
  }

  /* ── Filter + reading overlay (wired after list is in DOM) ── */
  function wireUI() {
    var filterOptions = document.querySelectorAll('.filter-option');
    var noResults     = document.querySelector('.no-results');

    function items() { return document.querySelectorAll('.essay-item'); }

    function applyFilter(cat) {
      var vis = 0;
      items().forEach(function (it) {
        var cats  = (it.dataset.category || '').split(',').map(function (s) { return s.trim(); });
        var match = cat === 'all' || cats.indexOf(cat) !== -1;
        match ? it.removeAttribute('data-hidden') : it.setAttribute('data-hidden', '');
        if (match) vis++;
      });
      if (noResults) noResults.classList.toggle('visible', vis === 0);
    }

    function activate(opt) {
      filterOptions.forEach(function (o) { o.classList.remove('active'); o.setAttribute('aria-pressed','false'); });
      opt.classList.add('active'); opt.setAttribute('aria-pressed','true');
      applyFilter(opt.dataset.filter);
    }

    filterOptions.forEach(function (opt) {
      opt.addEventListener('click',   function () { activate(opt); });
      opt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(opt); }
      });
    });

    /* ── Reading overlay ── */
    var overlay  = document.querySelector('.reading-overlay');
    var inner    = overlay && overlay.querySelector('.reading-overlay-inner');
    var progress = overlay && overlay.querySelector('.reading-progress');
    var closeBtn = overlay && overlay.querySelector('.reading-close');
    if (!overlay) return;

    function updateProgress() {
      var total = overlay.scrollHeight - overlay.clientHeight;
      if (total > 0 && progress) progress.style.width = Math.round(overlay.scrollTop / total * 100) + '%';
    }

    function openEssay(num) {
      var found = null;
      for (var i = 0; i < essays.length; i++) { if (essays[i].num === num) { found = essays[i]; break; } }
      if (!found) return;
      inner.innerHTML =
        '<p class="reading-num">Essay ' + found.num + '&nbsp;&nbsp;' + (found.year || '') + '</p>' +
        '<h2 class="reading-title">' + escHtml(found.title) + '</h2>' +
        '<div class="reading-tags">' +
          (found.tags || []).map(function (t) { return '<span class="tag">[ ' + escHtml(t) + ' ]</span>'; }).join('') +
        '</div>' +
        '<div class="reading-body">' + (found.content || '') + '</div>';
      overlay.scrollTop = 0;
      if (progress) progress.style.width = '0%';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      overlay.focus();
      overlay.addEventListener('scroll', updateProgress, { passive: true });
    }

    function closeOverlay() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      overlay.removeEventListener('scroll', updateProgress);
    }

    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    });

    /* Wire each essay item — uses event delegation so works on dynamic items */
    document.querySelector('.essay-list') && document.querySelector('.essay-list').addEventListener('click', function (e) {
      var item = e.target.closest('.essay-item');
      if (!item) return;
      if (e.target.closest('.essay-tags')) return;
      e.preventDefault();
      var numEl = item.querySelector('.essay-num');
      if (numEl) openEssay(numEl.textContent.trim());
    });
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  init();
}());
