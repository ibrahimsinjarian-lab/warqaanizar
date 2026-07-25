/* ─── ESSAYS.JS ─ data, filter, reading overlay ──────── */
'use strict';

(function () {

  /* ─────────────────────────────────────────────────────
     ESSAY DATA
     Replace content strings with your actual essay text.
     Each paragraph should be wrapped in <p> tags.
     Avoid using -- or em dashes inside paragraph text.
  ───────────────────────────────────────────────────── */
  const essays = [
    {
      num:      '01',
      title:    'On the Architecture of Belonging',
      tags:     ['design psychology', 'political philosophy'],
      category: 'design, general',
      year:     '2025',
      content: `
        <p>Every space makes a claim about who it was built for. Sometimes this claim is explicit,
        written into the building's programme or the city's zoning laws. More often it is embedded
        in the texture of things: the width of a door, the height of a counter, the placement of
        a window, the acoustics of a lobby. These are not neutral decisions. They are choices,
        and choices always have a politics.</p>
        <p>To belong somewhere is not simply to be tolerated inside it. It is to feel that the space
        was made with you in mind. That the light falls where you need it. That the proportions suit
        your body. That the room does not ask you to shrink in order to move through it. This kind
        of belonging is rarer than we tend to admit, and its absence is rarely named for what it is.</p>
        <p>I am interested in the gap between the architecture of welcome and the architecture of access.
        A building can be legally accessible and still feel hostile. A room can be open to the public
        and still make certain people feel they are guests rather than residents. The body knows the
        difference even when the law does not recognise it.</p>
        <p>This essay is an attempt to name that difference, and to ask what design would look like
        if belonging were treated not as an afterthought but as the central brief.</p>
      `
    },
    {
      num:      '02',
      title:    'What Walls Remember',
      tags:     ['heritage', 'architecture'],
      category: 'general',
      year:     '2025',
      content: `
        <p>There is a theory in architecture that buildings outlive their purposes but retain the
        memory of them. A factory converted to apartments still carries something of the factory
        in its bones. The high ceilings, the industrial windows, the loading bay that is now a
        courtyard. These are not just aesthetic traces. They are a form of testimony.</p>
        <p>I grew up moving between houses. None of them held long enough to become architecture
        in the full sense of the word. But I remember the quality of particular walls. The way
        a certain staircase narrowed at the top. The smell of a courtyard in the afternoon. Memory
        does not require permanence. It requires attention.</p>
        <p>What concerns me now is the erasure of walls that communities did not choose to lose.
        Urban development, displacement, demolition under other names. When a neighbourhood is
        cleared, what disappears is not only the physical structure but the network of embedded
        knowledge it contained. The routes people knew. The corners where things happened.
        The places where language was made.</p>
        <p>This essay asks whether architecture has a responsibility not just to build but to
        remember on behalf of those whose buildings have been taken.</p>
      `
    },
    {
      num:      '03',
      title:    'The Politics of Interior Space',
      tags:     ['political philosophy', 'design'],
      category: 'design',
      year:     '2024',
      content: `
        <p>The interior is often treated as the domain of the personal, separate from the political.
        This separation is itself a political act. To declare the domestic private is to remove it
        from scrutiny, and to remove it from scrutiny is to protect the arrangements of power
        that organise it.</p>
        <p>Interior design, as a discipline, has historically served those with interiors worth
        designing. The history of the field is largely a history of wealth: of houses commissioned
        by those who could afford to commission them, of rooms arranged for leisure by people who
        had leisure. This is not a neutral history.</p>
        <p>But the interior has always also been a site of resistance. The arranged corner that
        makes a room feel like yours. The colour painted on a rented wall against the rules.
        The furniture rearranged to make space for a different kind of gathering. Small acts,
        but not insignificant ones.</p>
        <p>I want to think about what it would mean for interior design to take seriously the
        political dimension of the rooms it makes. Not as gesture, but as practice. Not as one
        consideration among many, but as the central question.</p>
      `
    },
    {
      num:      '04',
      title:    'Softness as Resistance',
      tags:     ['design psychology'],
      category: 'design',
      year:     '2024',
      content: `
        <p>The aesthetics of institutional spaces are rarely accidental. The hard surfaces, the
        bright lights, the chairs that discourage staying too long. These are design choices that
        express a relationship to the people who use the space. They say: this is not for you,
        not really. You may pass through, but you may not settle.</p>
        <p>Softness in design is often dismissed as comfort, and comfort is often treated as
        a luxury. But softness is also a form of permission. A room with a soft chair by a
        window is telling you that your presence is welcome, that your body is allowed to
        rest here, that you are not a visitor who will be moved along.</p>
        <p>I have been thinking about what it would mean to design softness into the spaces
        that most need it. Not the spaces of the already comfortable, but the waiting rooms,
        the referral offices, the community centres that run on insufficient funding and
        get whatever is cheapest and most durable. These are the rooms where softness
        would mean the most, and where it is most systematically absent.</p>
        <p>To design softness for those spaces is a political act. It says that the people
        who use them deserve to be treated as people, not as problems to be processed.</p>
      `
    },
    {
      num:      '05',
      title:    'Reading Rooms as Acts of Care',
      tags:     ['general'],
      category: 'general',
      year:     '2024',
      content: `
        <p>The reading room is one of the more generous inventions of public architecture.
        It asks very little of you. It offers shelter, light, and silence. It makes no
        demands on your productivity. It does not sell you anything. It simply holds
        you while you think.</p>
        <p>The public library, at its best, is a form of radical hospitality. It is a space
        that says you do not need to purchase your right to be here. The act of walking in
        is enough. This is an unusual thing to say with architecture, and it is worth
        recognising as the political position it is.</p>
        <p>I am interested in what happens when we understand the reading room not as
        an amenity but as an act of care. Care for the person who needs somewhere to be
        without being asked why they are there. Care for the reader who cannot afford
        the books they want. Care for the child who needs silence and finds none at home.</p>
        <p>If we designed more spaces with this quality of attention, what would our cities
        look like? What would we have to give up, and what would we gain?</p>
      `
    },
    {
      num:      '06',
      title:    'The Language of Thresholds',
      tags:     ['design psychology', 'heritage'],
      category: 'design, general',
      year:     '2023',
      content: `
        <p>Every building has a moment of arrival, and that moment communicates something
        before a single word has been spoken. The threshold is architecture's first sentence.
        It sets the register for everything that follows.</p>
        <p>In many traditional architectural traditions, the threshold is understood as a
        site of transformation. You are not the same person on the inside as you were on
        the outside. The transition is marked: by a change of material underfoot, by a
        compression of the ceiling, by a turn that delays the interior's reveal. These
        are not decorative choices. They are a grammar.</p>
        <p>Contemporary architecture has largely abandoned this grammar in favour of
        transparency and openness. The glass facade, the lobby that continues the street.
        These choices carry their own meanings: of accessibility, of permeability, of
        an institution that has nothing to hide. But something is also lost. The threshold
        as a site of preparation, of ceremony, of becoming.</p>
        <p>I am drawn to the question of what we want our arrivals to do to us, and
        what it would mean to design them with that intention.</p>
      `
    },
    {
      num:      '07',
      title:    'Who Gets to Name a Place Home',
      tags:     ['political philosophy', 'general'],
      category: 'general',
      year:     '2023',
      content: `
        <p>Home is not a building. This is something that everyone who has had their building
        taken away knows. Home is a set of practices, a network of relationships, a layering
        of time. It can exist in a single room if the conditions are right, and it can be
        absent from a large and beautiful house if they are not.</p>
        <p>But the building matters. It matters because it provides the physical conditions
        under which the practices of home become possible. Stability, shelter, the ability
        to accumulate rather than to constantly begin again. When buildings are taken, the
        practices that depended on them do not simply transfer. They are interrupted, often
        permanently.</p>
        <p>The right to name somewhere home is not equally distributed. For some people,
        it is assumed. The city is theirs to move through and to settle in. For others,
        it is contested at every step. The question of who is allowed to claim a place,
        to alter it, to be seen as belonging there, is always also a question of power.</p>
        <p>This essay is an attempt to think about home not as a private matter but as a
        political condition, and to ask what design might do to make that condition more just.</p>
      `
    },
    {
      num:      '08',
      title:    'Material as Memory',
      tags:     ['design', 'heritage'],
      category: 'design',
      year:     '2023',
      content: `
        <p>Materials carry time. This is one of the things that makes them interesting as
        a design medium. Stone that has been worn by feet tells you something about the
        number of people who passed and the duration of the passing. Wood that has darkened
        tells you about the quality of light in the room over many years. These are not
        qualities that can be specified in a brief. They accumulate.</p>
        <p>Contemporary design has developed a sophisticated relationship with newness.
        The preference for surfaces that look clean, for materials that do not show
        their age, for the aesthetic of the recently completed. There is a reason for this:
        newness signals care, investment, attention. But it also erases the record of use.</p>
        <p>I am interested in what it would mean to design for the accumulation of memory
        rather than against it. To choose materials that improve with use rather than
        deteriorating. To plan for the marks that inhabitants will leave, and to treat
        those marks not as damage but as evidence of a life being lived.</p>
        <p>This is not a nostalgic argument. It is an argument about honesty. About
        designing spaces that are willing to show what has happened inside them,
        and to carry that history forward rather than concealing it.</p>
      `
    }
  ];

  /* ─────────────────────────────────────────────────────
     FILTER
  ───────────────────────────────────────────────────── */
  const filterOptions = document.querySelectorAll('.filter-option');
  const essayItems    = document.querySelectorAll('.essay-item');
  const noResults     = document.querySelector('.no-results');

  function applyFilter(category) {
    let visible = 0;
    essayItems.forEach(item => {
      const cats  = (item.dataset.category || '').split(',').map(s => s.trim());
      const match = category === 'all' || cats.includes(category);
      match ? item.removeAttribute('data-hidden') : item.setAttribute('data-hidden', '');
      if (match) visible++;
    });
    if (noResults) noResults.classList.toggle('visible', visible === 0);
  }

  function activateFilter(option) {
    filterOptions.forEach(o => {
      o.classList.remove('active');
      o.setAttribute('aria-pressed', 'false');
    });
    option.classList.add('active');
    option.setAttribute('aria-pressed', 'true');
    applyFilter(option.dataset.filter);
  }

  filterOptions.forEach(option => {
    option.addEventListener('click',   () => activateFilter(option));
    option.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateFilter(option); }
    });
  });

  /* ─────────────────────────────────────────────────────
     READING OVERLAY
  ───────────────────────────────────────────────────── */
  const overlay   = document.querySelector('.reading-overlay');
  const inner     = overlay?.querySelector('.reading-overlay-inner');
  const progress  = overlay?.querySelector('.reading-progress');
  const closeBtn  = overlay?.querySelector('.reading-close');

  if (!overlay) return;

  /* update scroll progress bar */
  function updateProgress() {
    const scrollEl = overlay;
    const scrolled = scrollEl.scrollTop;
    const total    = scrollEl.scrollHeight - scrollEl.clientHeight;
    if (total > 0) {
      progress.style.width = Math.round((scrolled / total) * 100) + '%';
    }
  }

  function openEssay(num) {
    const essay = essays.find(e => e.num === num);
    if (!essay) return;

    const tagsHTML = essay.tags
      .map(t => `<span class="tag">[ ${t} ]</span>`)
      .join('');

    inner.innerHTML = `
      <p class="reading-num">Essay ${essay.num} &nbsp; ${essay.year}</p>
      <h2 class="reading-title">${essay.title}</h2>
      <div class="reading-tags">${tagsHTML}</div>
      <div class="reading-body">${essay.content}</div>
      <p class="reading-placeholder-notice">
        [ placeholder text ] Replace this content in js/essays.js
        inside the essays[] array, in the content field for essay ${essay.num}.
      </p>`;

    /* reset scroll + progress */
    overlay.scrollTop   = 0;
    progress.style.width = '0%';

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

  closeBtn?.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
  });

  /* close on backdrop click (outside inner content) */
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
  });

  /* ─────────────────────────────────────────────────────
     WIRE ESSAY TITLES TO OPEN OVERLAY
     Finds each .essay-item by its displayed number and
     attaches click + keyboard open handlers.
  ───────────────────────────────────────────────────── */
  essayItems.forEach(item => {
    const numEl = item.querySelector('.essay-num');
    const titleEl = item.querySelector('.essay-title');
    if (!numEl || !titleEl) return;

    const num = numEl.textContent.trim();

    /* make the whole item feel clickable */
    item.style.cursor = 'pointer';

    function handleOpen(e) {
      e.preventDefault();
      openEssay(num);
    }

    titleEl.addEventListener('click', handleOpen);
    titleEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') handleOpen(e);
    });

    /* clicking anywhere on the row (outside filter) also opens */
    item.addEventListener('click', e => {
      /* only fire if click was not already on the title itself */
      if (!e.target.closest('.essay-title') && !e.target.closest('.essay-tags')) {
        handleOpen(e);
      }
    });
  });

})();
