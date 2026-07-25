/* ─── DESIGNS.JS ─ grid, detail overlay, filter ──────── */
'use strict';

(function () {

  /* ─────────────────────────────────────────────────────
     DATA
     Replace image paths with real assets when ready.
     Each design has: id, title, tag, category,
     palette (1-6 for placeholder color variant),
     images (array of paths), concept (HTML string).
  ───────────────────────────────────────────────────── */
  const designs = [
    {
      id:       'displaced-artists',
      title:    'Residency for Displaced Artists',
      tag:      'architectural design',
      category: 'architectural',
      palette:  1,
      images:   ['', '', '', ''],
      concept: `<p>A structure conceived as a temporary anchor for those whose creative practice has been interrupted by displacement. The building refuses permanence as a political act, using modular, demountable systems that can be rebuilt elsewhere.</p><p>Every threshold is designed to feel like a choice rather than a boundary. Light enters through recessed clerestories, ensuring that the interior remains independent of whatever is happening outside.</p>`
    },
    {
      id:       'room-that-breathes',
      title:    'The Room That Breathes',
      tag:      'interior design',
      category: 'interior',
      palette:  2,
      images:   ['', '', '', ''],
      concept: `<p>An interior study in how air movement, material porosity, and the positioning of openings can transform a static room into something that feels alive and responsive to its occupants.</p><p>Curtains of raw linen hang floor to ceiling, lifting with cross ventilation. Furniture sits low. The room does not perform comfort, it practices it.</p>`
    },
    {
      id:       'heritage-archive',
      title:    'Heritage Archive Library',
      tag:      'school',
      category: 'architectural',
      palette:  3,
      images:   ['', '', '', ''],
      concept: `<p>A library built around the act of preservation as care. The archive holds oral histories, handwritten documents, and textile records from communities whose knowledge has been systematically excluded from formal institutions.</p><p>The reading room is ringed by a mezzanine of deep shelves, lit only from above so that light falls on the material, not on the reader looking at it.</p>`
    },
    {
      id:       'adaptive-dwelling',
      title:    'Adaptive Dwelling',
      tag:      'house',
      category: 'architectural',
      palette:  4,
      images:   ['', '', '', ''],
      concept: `<p>A house that changes with the family living inside it. Sliding partitions, a reversible kitchen, and convertible sleeping alcoves allow the floorplan to be reconfigured without structural work, supporting different household compositions over time.</p><p>The materiality is intentionally unfinished at first occupancy, leaving room for the inhabitants to mark it as theirs.</p>`
    },
    {
      id:       'gathering-space',
      title:    'The Gathering Space',
      tag:      'interior design',
      category: 'interior',
      palette:  5,
      images:   ['', '', '', ''],
      concept: `<p>Designed in response to a community that had been meeting in car parks and rented rooms for years. The brief was simple: a place where people feel they are not guests.</p><p>The furniture is heavy and cannot be easily cleared away. The walls are made to be written on. The kitchen is central and open. Belonging is built into the structure.</p>`
    },
    {
      id:       'community-kitchen',
      title:    'Community Kitchen',
      tag:      'room decor',
      category: 'interior',
      palette:  6,
      images:   ['', '', '', ''],
      concept: `<p>A kitchen interior designed for shared use by multiple households, balancing individual ownership of tools and ingredients with collective cooking surfaces and storage systems.</p><p>The layout draws from traditional communal cooking structures, where the act of preparing food together is understood as social infrastructure, not just convenience.</p>`
    }
  ];

  /* ─────────────────────────────────────────────────────
     PLACEHOLDER GRAPHIC (inline SVG for empty cards)
  ───────────────────────────────────────────────────── */
  function placeholderSVG() {
    return `<div class="design-placeholder-graphic">
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="color:var(--terra)">
        <rect x="1" y="1" width="58" height="58" stroke="currentColor" stroke-width="0.6"/>
        <line x1="1" y1="1" x2="59" y2="59" stroke="currentColor" stroke-width="0.4"/>
        <line x1="59" y1="1" x2="1" y2="59" stroke="currentColor" stroke-width="0.4"/>
      </svg>
    </div>`;
  }

  /* ─────────────────────────────────────────────────────
     RENDER GRID
  ───────────────────────────────────────────────────── */
  function renderGrid() {
    const grid = document.querySelector('.designs-grid');
    if (!grid) return;

    grid.innerHTML = designs.map((d, i) => {
      const hasImage = d.images && d.images[0];
      return `
        <article
          class="design-card"
          data-id="${d.id}"
          data-palette="${d.palette}"
          data-category="${d.category}"
          role="button"
          tabindex="0"
          aria-label="Open ${d.title}"
        >
          <div class="design-card-img">
            ${hasImage
              ? `<img src="${d.images[0]}" alt="${d.title}" loading="lazy"/>`
              : placeholderSVG()
            }
            <div class="design-card-overlay">
              <span class="design-card-overlay-text">view project</span>
            </div>
          </div>
          <div class="design-card-info">
            <span class="design-card-name">${d.title}</span>
            <span class="tag">[ ${d.tag} ]</span>
          </div>
        </article>`;
    }).join('');

    /* attach click events after render */
    grid.querySelectorAll('.design-card').forEach(card => {
      card.addEventListener('click',   () => openDetail(card.dataset.id));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail(card.dataset.id);
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────
     DETAIL OVERLAY
  ───────────────────────────────────────────────────── */
  function openDetail(id) {
    const design  = designs.find(d => d.id === id);
    if (!design) return;

    const overlay = document.querySelector('.detail-overlay');
    const inner   = overlay.querySelector('.detail-overlay-inner');

    /* build scatter images */
    const scatterHTML = design.images.map((src, i) => {
      const hasSrc = Boolean(src);
      return `<div class="scatter-img">
        ${hasSrc
          ? `<img src="${src}" alt="${design.title} image ${i + 1}" loading="lazy"/>`
          : `<div class="scatter-placeholder">
               <span class="scatter-placeholder-txt">image ${i + 1}</span>
             </div>`
        }
      </div>`;
    }).join('');

    inner.innerHTML = `
      <p class="detail-eyebrow">[ ${design.tag} ]</p>
      <h2 class="detail-title">${design.title}</h2>
      <div class="detail-scatter">${scatterHTML}</div>
      <div class="detail-concept">
        <span class="detail-concept-label">concept + execution</span>
        <div class="detail-concept-text">${design.concept}</div>
      </div>`;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    overlay.focus();
  }

  function closeDetail() {
    const overlay = document.querySelector('.detail-overlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* close button and backdrop click */
  document.querySelector('.detail-close')?.addEventListener('click', closeDetail);
  document.querySelector('.detail-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDetail();
  });

  /* escape key */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetail();
  });

  /* ─────────────────────────────────────────────────────
     FILTER
  ───────────────────────────────────────────────────── */
  function applyDesignFilter(category) {
    document.querySelectorAll('.design-card').forEach(card => {
      const match = category === 'all' || card.dataset.category === category;
      match
        ? card.removeAttribute('data-hidden')
        : card.setAttribute('data-hidden', '');
    });
  }

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      applyDesignFilter(pill.dataset.filter);
    });
  });

  /* ─────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────── */
  renderGrid();

})();
