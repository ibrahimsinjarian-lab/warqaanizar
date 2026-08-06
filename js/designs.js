/* designs.js — grid, detail overlay, filter. Data from Supabase with hardcoded fallback. */
'use strict';
(function () {

  var FALLBACK = [
    { id:'displaced-artists', slug:'displaced-artists', title:'Residency for Displaced Artists', tag:'architectural design', category:'architectural', palette:1, images:[], concept:'<p>A structure conceived as a temporary anchor for those whose creative practice has been interrupted by displacement. The building refuses permanence as a political act, using modular, demountable systems that can be rebuilt elsewhere.</p><p>Every threshold is designed to feel like a choice rather than a boundary. Light enters through recessed clerestories, ensuring that the interior remains independent of whatever is happening outside.</p>' },
    { id:'room-that-breathes',  slug:'room-that-breathes',  title:'The Room That Breathes',         tag:'interior design',      category:'interior',      palette:2, images:[], concept:'<p>An interior study in how air movement, material porosity, and the positioning of openings can transform a static room into something that feels alive and responsive to its occupants.</p><p>Curtains of raw linen hang floor to ceiling, lifting with cross ventilation. Furniture sits low. The room does not perform comfort, it practices it.</p>' },
    { id:'heritage-archive',    slug:'heritage-archive',    title:'Heritage Archive Library',       tag:'school',               category:'architectural', palette:3, images:[], concept:'<p>A library built around the act of preservation as care. The archive holds oral histories, handwritten documents, and textile records from communities whose knowledge has been systematically excluded from formal institutions.</p><p>The reading room is ringed by a mezzanine of deep shelves, lit only from above so that light falls on the material, not on the reader looking at it.</p>' },
    { id:'adaptive-dwelling',   slug:'adaptive-dwelling',   title:'Adaptive Dwelling',              tag:'house',                category:'architectural', palette:4, images:[], concept:'<p>A house that changes with the family living inside it. Sliding partitions, a reversible kitchen, and convertible sleeping alcoves allow the floorplan to be reconfigured without structural work, supporting different household compositions over time.</p>' },
    { id:'gathering-space',     slug:'gathering-space',     title:'The Gathering Space',            tag:'interior design',      category:'interior',      palette:5, images:[], concept:'<p>Designed in response to a community that had been meeting in car parks and rented rooms for years. The brief was simple: a place where people feel they are not guests.</p><p>The furniture is heavy and cannot be easily cleared away. The walls are made to be written on. The kitchen is central and open. Belonging is built into the structure.</p>' },
    { id:'community-kitchen',   slug:'community-kitchen',   title:'Community Kitchen',              tag:'room decor',           category:'interior',      palette:6, images:[], concept:'<p>A kitchen interior designed for shared use by multiple households, balancing individual ownership of tools and ingredients with collective cooking surfaces and storage systems.</p>' },
  ];

  var designs = FALLBACK;

  /* ─── Load ─── */
  function init() {
    var source = supabaseClient
      ? supabaseClient.from('designs').select('*').order('sort_order')
          .then(function (r) {
            if (!r.error && r.data && r.data.length) {
              /* normalise: Supabase rows have uuid id + slug; keep both */
              designs = r.data.map(function (d) {
                return Object.assign({}, d, { id: d.id, slug: d.slug });
              });
            }
          })
          .catch(function () {})
      : Promise.resolve();

    source.finally(function () { renderGrid(); attachFilter(); });
  }

  /* ─── Placeholder SVG ─── */
  function placeholder() {
    return '<div class="design-placeholder-graphic">' +
      '<svg viewBox="0 0 60 60" fill="none" style="color:var(--terra)">' +
        '<rect x="1" y="1" width="58" height="58" stroke="currentColor" stroke-width="0.6"/>' +
        '<line x1="1" y1="1" x2="59" y2="59" stroke="currentColor" stroke-width="0.4"/>' +
        '<line x1="59" y1="1" x2="1" y2="59" stroke="currentColor" stroke-width="0.4"/>' +
      '</svg></div>';
  }

  /* ─── Grid ─── */
  function renderGrid() {
    var grid = document.querySelector('.designs-grid');
    if (!grid) return;
    grid.innerHTML = designs.map(function (d) {
      var hasImg = d.images && d.images[0];
      return '<article class="design-card" data-id="' + d.id + '" data-palette="' + (d.palette||1) + '" data-category="' + (d.category||'') + '" role="button" tabindex="0" aria-label="Open ' + d.title + '">' +
        '<div class="design-card-img">' +
          (hasImg ? '<img src="'+d.images[0]+'" alt="'+d.title+'" loading="lazy"/>' : placeholder()) +
          '<div class="design-card-overlay"><span class="design-card-overlay-text">view project</span></div>' +
        '</div>' +
        '<div class="design-card-info"><span class="design-card-name">'+d.title+'</span><span class="tag">[ '+d.tag+' ]</span></div>' +
      '</article>';
    }).join('');

    grid.querySelectorAll('.design-card').forEach(function (card) {
      card.addEventListener('click',   function () { openDetail(card.dataset.id); });
      card.addEventListener('keydown', function (e) { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openDetail(card.dataset.id); } });
    });
  }

  /* ─── Detail overlay ─── */
  function openDetail(id) {
    var d = designs.find(function (x) { return x.id === id; });
    if (!d) return;
    var overlay = document.querySelector('.detail-overlay');
    var inner   = overlay && overlay.querySelector('.detail-overlay-inner');
    if (!overlay || !inner) return;

    var imgs = (d.images || []);
    while (imgs.length < 4) imgs = imgs.concat(['']);
    var scatter = imgs.slice(0,4).map(function (src, i) {
      return '<div class="scatter-img">' +
        (src ? '<img src="'+src+'" alt="'+d.title+' image '+(i+1)+'" loading="lazy"/>'
             : '<div class="scatter-placeholder"><span class="scatter-placeholder-txt">image '+(i+1)+'</span></div>') +
      '</div>';
    }).join('');

    inner.innerHTML =
      '<p class="detail-eyebrow">[ ' + d.tag + ' ]</p>' +
      '<h2 class="detail-title">' + d.title + '</h2>' +
      '<div class="detail-scatter">' + scatter + '</div>' +
      '<div class="detail-concept"><span class="detail-concept-label">concept + execution</span>' +
        '<div class="detail-concept-text">' + d.concept + '</div></div>';

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    overlay.focus();
  }

  function closeDetail() {
    var o = document.querySelector('.detail-overlay');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
  }

  var closeBtn = document.querySelector('.detail-close');
  if (closeBtn) closeBtn.addEventListener('click', closeDetail);
  var detailEl = document.querySelector('.detail-overlay');
  if (detailEl) detailEl.addEventListener('click', function (e) { if (e.target===detailEl) closeDetail(); });
  document.addEventListener('keydown', function (e) { if (e.key==='Escape') closeDetail(); });

  /* ─── Filter ─── */
  function attachFilter() {
    document.querySelectorAll('.filter-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        document.querySelectorAll('.filter-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        var cat = pill.dataset.filter;
        document.querySelectorAll('.design-card').forEach(function (card) {
          var match = cat==='all' || card.dataset.category===cat;
          match ? card.removeAttribute('data-hidden') : card.setAttribute('data-hidden','');
        });
      });
    });
  }

  init();
}());
