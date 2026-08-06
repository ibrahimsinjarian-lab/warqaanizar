/* essays.js — filter, reading overlay. Data from Supabase with hardcoded fallback. */
'use strict';
(function () {

  /* Fallback data — used when Supabase is not yet configured */
  var FALLBACK = [
    { num:'01', title:'On the Architecture of Belonging', tags:['design psychology','political philosophy'], category:'design, general', year:'2025', content:'<p>Every space makes a claim about who it was built for. Sometimes this claim is explicit, written into the building\'s programme or the city\'s zoning laws. More often it is embedded in the texture of things: the width of a door, the height of a counter, the placement of a window, the acoustics of a lobby. These are not neutral decisions. They are choices, and choices always have a politics.</p><p>To belong somewhere is not simply to be tolerated inside it. It is to feel that the space was made with you in mind. That the light falls where you need it. That the proportions suit your body. That the room does not ask you to shrink in order to move through it. This kind of belonging is rarer than we tend to admit, and its absence is rarely named for what it is.</p>' },
    { num:'02', title:'What Walls Remember', tags:['heritage','architecture'], category:'general', year:'2025', content:'<p>There is a theory in architecture that buildings outlive their purposes but retain the memory of them. A factory converted to apartments still carries something of the factory in its bones. The high ceilings, the industrial windows, the loading bay that is now a courtyard. These are not just aesthetic traces. They are a form of testimony.</p><p>I grew up moving between houses. None of them held long enough to become architecture in the full sense of the word. But I remember the quality of particular walls. The way a certain staircase narrowed at the top. The smell of a courtyard in the afternoon. Memory does not require permanence. It requires attention.</p>' },
    { num:'03', title:'The Politics of Interior Space', tags:['political philosophy','design'], category:'design', year:'2024', content:'<p>The interior is often treated as the domain of the personal, separate from the political. This separation is itself a political act. To declare the domestic private is to remove it from scrutiny, and to remove it from scrutiny is to protect the arrangements of power that organise it.</p><p>Interior design, as a discipline, has historically served those with interiors worth designing. The history of the field is largely a history of wealth: of houses commissioned by those who could afford to commission them, of rooms arranged for leisure by people who had leisure. This is not a neutral history.</p>' },
    { num:'04', title:'Softness as Resistance', tags:['design psychology'], category:'design', year:'2024', content:'<p>The aesthetics of institutional spaces are rarely accidental. The hard surfaces, the bright lights, the chairs that discourage staying too long. These are design choices that express a relationship to the people who use the space. They say: this is not for you, not really. You may pass through, but you may not settle.</p><p>Softness in design is often dismissed as comfort, and comfort is often treated as a luxury. But softness is also a form of permission. A room with a soft chair by a window is telling you that your presence is welcome, that your body is allowed to rest here, that you are not a visitor who will be moved along.</p>' },
    { num:'05', title:'Reading Rooms as Acts of Care', tags:['general'], category:'general', year:'2024', content:'<p>The reading room is one of the more generous inventions of public architecture. It asks very little of you. It offers shelter, light, and silence. It makes no demands on your productivity. It does not sell you anything. It simply holds you while you think.</p><p>The public library, at its best, is a form of radical hospitality. It is a space that says you do not need to purchase your right to be here. The act of walking in is enough. This is an unusual thing to say with architecture, and it is worth recognising as the political position it is.</p>' },
    { num:'06', title:'The Language of Thresholds', tags:['design psychology','heritage'], category:'design, general', year:'2023', content:'<p>Every building has a moment of arrival, and that moment communicates something before a single word has been spoken. The threshold is architecture\'s first sentence. It sets the register for everything that follows.</p><p>In many traditional architectural traditions, the threshold is understood as a site of transformation. You are not the same person on the inside as you were on the outside. The transition is marked: by a change of material underfoot, by a compression of the ceiling, by a turn that delays the interior\'s reveal. These are not decorative choices. They are a grammar.</p>' },
    { num:'07', title:'Who Gets to Name a Place Home', tags:['political philosophy','general'], category:'general', year:'2023', content:'<p>Home is not a building. This is something that everyone who has had their building taken away knows. Home is a set of practices, a network of relationships, a layering of time. It can exist in a single room if the conditions are right, and it can be absent from a large and beautiful house if they are not.</p><p>The right to name somewhere home is not equally distributed. For some people, it is assumed. The city is theirs to move through and to settle in. For others, it is contested at every step. The question of who is allowed to claim a place, to alter it, to be seen as belonging there, is always also a question of power.</p>' },
    { num:'08', title:'Material as Memory', tags:['design','heritage'], category:'design', year:'2023', content:'<p>Materials carry time. This is one of the things that makes them interesting as a design medium. Stone that has been worn by feet tells you something about the number of people who passed and the duration of the passing. Wood that has darkened tells you about the quality of light in the room over many years. These are not qualities that can be specified in a brief. They accumulate.</p><p>I am interested in what it would mean to design for the accumulation of memory rather than against it. To choose materials that improve with use rather than deteriorating. To plan for the marks that inhabitants will leave, and to treat those marks not as damage but as evidence of a life being lived.</p>' },
  ];

  var essays = FALLBACK;

  /* ─── Load from Supabase ─── */
  function init() {
    var source = supabaseClient
      ? supabaseClient.from('essays').select('*').order('num')
          .then(function (r) { if (!r.error && r.data && r.data.length) essays = r.data; })
          .catch(function () {})
      : Promise.resolve();

    source.finally(wireUI);
  }

  /* ─── Filter ─── */
  function wireUI() {
    var filterOptions = document.querySelectorAll('.filter-option');
    var essayItems    = document.querySelectorAll('.essay-item');
    var noResults     = document.querySelector('.no-results');

    function applyFilter(category) {
      var visible = 0;
      essayItems.forEach(function (item) {
        var cats  = (item.dataset.category || '').split(',').map(function (s) { return s.trim(); });
        var match = category === 'all' || cats.indexOf(category) !== -1;
        match ? item.removeAttribute('data-hidden') : item.setAttribute('data-hidden', '');
        if (match) visible++;
      });
      if (noResults) noResults.classList.toggle('visible', visible === 0);
    }

    function activateFilter(opt) {
      filterOptions.forEach(function (o) { o.classList.remove('active'); o.setAttribute('aria-pressed','false'); });
      opt.classList.add('active'); opt.setAttribute('aria-pressed','true');
      applyFilter(opt.dataset.filter);
    }

    filterOptions.forEach(function (opt) {
      opt.addEventListener('click', function () { activateFilter(opt); });
      opt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateFilter(opt); }
      });
    });

    /* ─── Reading overlay ─── */
    var overlay  = document.querySelector('.reading-overlay');
    var inner    = overlay && overlay.querySelector('.reading-overlay-inner');
    var progress = overlay && overlay.querySelector('.reading-progress');
    var closeBtn = overlay && overlay.querySelector('.reading-close');
    if (!overlay) return;

    function updateProgress() {
      var total = overlay.scrollHeight - overlay.clientHeight;
      if (total > 0 && progress) progress.style.width = Math.round((overlay.scrollTop / total) * 100) + '%';
    }

    function openEssay(num) {
      var essay = null;
      for (var i = 0; i < essays.length; i++) { if (essays[i].num === num) { essay = essays[i]; break; } }
      if (!essay) return;
      inner.innerHTML =
        '<p class="reading-num">Essay ' + essay.num + '&nbsp;&nbsp;' + (essay.year || '') + '</p>' +
        '<h2 class="reading-title">' + essay.title + '</h2>' +
        '<div class="reading-tags">' +
          (essay.tags || []).map(function (t) { return '<span class="tag">[ ' + t + ' ]</span>'; }).join('') +
        '</div>' +
        '<div class="reading-body">' + essay.content + '</div>';
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
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay(); });

    essayItems.forEach(function (item) {
      var numEl   = item.querySelector('.essay-num');
      var titleEl = item.querySelector('.essay-title');
      if (!numEl || !titleEl) return;
      var num = numEl.textContent.trim();
      item.style.cursor = 'pointer';
      function open(e) { e.preventDefault(); openEssay(num); }
      titleEl.addEventListener('click', open);
      titleEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') open(e); });
      item.addEventListener('click', function (e) {
        if (!e.target.closest('.essay-title') && !e.target.closest('.essay-tags')) open(e);
      });
    });
  }

  init();
}());
