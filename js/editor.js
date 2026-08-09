/* ── editor.js ─────────────────────────────────────────────────
   Visual edit mode for Warqaa Nazar portfolio.
   Activates only when an authenticated Supabase session exists.

   Features:
   · Click any text with data-editable to edit it in place
   · Click [+] on any section to drop and drag an image decoration
   · All changes save directly to Supabase
──────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (!window.supabaseClient) return;
  var db = window.supabaseClient;

  var EDIT = false;
  var _panel = null;         /* open floating panel */
  var _zoneButtons = [];     /* zone "+" buttons to clean up */

  /* ── Auth ───────────────────────────────────────────────────── */
  db.auth.getSession().then(function (r) {
    if (r.data && r.data.session) boot();
  });

  function boot() {
    injectStylesheet();
    injectToggleBtn();
    injectEditBar();
  }

  function injectStylesheet() {
    if (document.getElementById('wq-editor-css')) return;
    var link = document.createElement('link');
    link.id   = 'wq-editor-css';
    link.rel  = 'stylesheet';
    link.href = '/css/editor.css';
    document.head.appendChild(link);
  }

  /* ── Toggle button ──────────────────────────────────────────── */
  function injectToggleBtn() {
    var btn = document.createElement('button');
    btn.id          = 'wq-toggle-btn';
    btn.textContent = '✎  Edit site';
    btn.addEventListener('click', function () { setEditMode(!EDIT); });
    document.body.appendChild(btn);
  }

  /* ── Top edit bar ───────────────────────────────────────────── */
  function injectEditBar() {
    var bar = document.createElement('div');
    bar.id = 'wq-edit-bar';
    bar.innerHTML =
      '<span class="wq-bar-hint">Click any text to edit  ·  Click + on a section to add an image</span>' +
      '<div class="wq-bar-actions">' +
        '<button class="wq-bar-btn" id="wq-bar-sign-out">Sign out</button>' +
        '<button class="wq-bar-btn" id="wq-bar-exit">Exit edit mode</button>' +
      '</div>';
    document.body.appendChild(bar);

    document.getElementById('wq-bar-exit').addEventListener('click', function () { setEditMode(false); });
    document.getElementById('wq-bar-sign-out').addEventListener('click', function () {
      db.auth.signOut().then(function () { window.location.reload(); });
    });
  }

  /* ── Toggle edit mode ───────────────────────────────────────── */
  function setEditMode(on) {
    EDIT = on;
    document.body.classList.toggle('wq-edit-mode', on);
    var toggleBtn = document.getElementById('wq-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = on ? '✎  Editing' : '✎  Edit site';
      toggleBtn.classList.toggle('active', on);
    }
    if (on) {
      setupEditables();
      setupZones();
      markExistingDecorations();
    } else {
      teardownEditables();
      teardownZones();
      closePanel();
    }
  }

  /* ════════════════════════════════════════════════════════════
     INLINE TEXT EDITING
  ════════════════════════════════════════════════════════════ */
  function setupEditables() {
    document.querySelectorAll('[data-editable]').forEach(function (el) {
      el.addEventListener('click', onEditableClick);
    });
  }

  function teardownEditables() {
    document.querySelectorAll('[data-editable]').forEach(function (el) {
      el.removeEventListener('click', onEditableClick);
      el.removeAttribute('contenteditable');
      el.classList.remove('wq-editing');
    });
    document.querySelectorAll('.wq-save-pill').forEach(function (p) { p.remove(); });
  }

  function onEditableClick(e) {
    if (!EDIT) return;
    var el  = this;
    var key = el.dataset.editable; /* e.g. "settings.about_tagline" */

    /* Multi-paragraph field → floating textarea panel */
    if (key === 'settings.about_text') {
      e.preventDefault();
      openTextareaPanel(el, key);
      return;
    }

    /* Link elements — prevent navigation while editing */
    if (el.tagName === 'A') e.preventDefault();

    /* Already editing this element */
    if (el.classList.contains('wq-editing')) return;

    activateInlineEdit(el, key);
  }

  function activateInlineEdit(el, key) {
    el.setAttribute('contenteditable', 'true');
    el.classList.add('wq-editing');
    el.focus();

    /* Select all */
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {}

    /* Save pill */
    var pill = document.createElement('button');
    pill.className   = 'wq-save-pill';
    pill.textContent = '✓ Save';
    document.body.appendChild(pill);
    repositionPill(el, pill);

    function save() {
      var val = el.textContent.trim();
      el.removeAttribute('contenteditable');
      el.classList.remove('wq-editing');
      pill.remove();
      saveTextToSupabase(el, key, val);
    }

    function cancel() {
      el.removeAttribute('contenteditable');
      el.classList.remove('wq-editing');
      pill.remove();
    }

    pill.addEventListener('click', save);

    el.addEventListener('keydown', function handler(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); el.removeEventListener('keydown', handler); }
      if (e.key === 'Escape')               { cancel();            el.removeEventListener('keydown', handler); }
    });

    el.addEventListener('blur', function handler() {
      setTimeout(function () {
        /* slight delay so pill click fires first */
        if (document.activeElement !== pill) { cancel(); }
      }, 180);
      el.removeEventListener('blur', handler);
    });
  }

  function repositionPill(el, pill) {
    var r = el.getBoundingClientRect();
    pill.style.position = 'fixed';
    pill.style.top  = Math.max(8, r.top - 30) + 'px';
    pill.style.left = r.left + 'px';
  }

  /* ── Floating textarea panel for body/multi-line content ─────── */
  function openTextareaPanel(el, key) {
    closePanel();
    var current = el.innerHTML
      .replace(/<\/p>\s*<p>/gi, '\n\n').replace(/<\/?p[^>]*>/gi, '').trim();

    var rect = el.getBoundingClientRect();
    var panel = document.createElement('div');
    panel.className = 'wq-panel';
    panel.style.position = 'fixed';
    panel.style.top  = Math.max(54, rect.top) + 'px';
    panel.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

    panel.innerHTML =
      '<p class="wq-panel-title">Edit text</p>' +
      '<textarea>' + escHtml(current) + '</textarea>' +
      '<div class="wq-panel-row">' +
        '<button class="wq-save-text">Save</button>' +
        '<button class="wq-cancel-text">Cancel</button>' +
      '</div>';

    document.body.appendChild(panel);
    _panel = panel;
    panel.querySelector('textarea').focus();

    panel.querySelector('.wq-save-text').addEventListener('click', function () {
      var newText = panel.querySelector('textarea').value;
      el.innerHTML = newText.trim().split(/\n\n+/).filter(Boolean)
        .map(function (p) { return '<p>' + p.trim() + '</p>'; }).join('');
      saveTextToSupabase(el, key, newText.trim());
      closePanel();
    });
    panel.querySelector('.wq-cancel-text').addEventListener('click', closePanel);
  }

  /* ── Save text to Supabase ───────────────────────────────────── */
  async function saveTextToSupabase(el, key, value) {
    var parts = key.split('.');
    var result;

    if (parts[0] === 'settings') {
      var col = parts[1];
      var upd = {};
      upd[col] = value;
      result = await db.from('settings').update(upd).eq('id', 1);
    } else if (parts[0] === 'content') {
      result = await db.from('content').upsert(
        { page: parts[1], key: parts[2], value: value },
        { onConflict: 'page,key' }
      );
    }

    if (result && result.error) toast(result.error.message, 'err');
    else {
      toast('Saved');
      /* If this was a link element, also update href */
      var hrefKey = el.dataset.editableHref;
      if (hrefKey && parts[0] === 'settings') {
        /* href stored in a sibling settings column */
        var hrefUpd = {};
        hrefUpd[hrefKey.split('.')[1]] = value.startsWith('http') ? value : el.href;
        await db.from('settings').update(hrefUpd).eq('id', 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════
     DECORATION PLACEMENT
  ════════════════════════════════════════════════════════════ */
  function setupZones() {
    document.querySelectorAll('[data-zone]').forEach(function (zone) {
      /* ensure zone is a positioning context */
      if (window.getComputedStyle(zone).position === 'static') {
        zone.style.position = 'relative';
      }

      var btn = document.createElement('button');
      btn.className = 'wq-zone-add';
      btn.title     = 'Add image to ' + zone.dataset.zone;
      btn.innerHTML = '+';
      zone.appendChild(btn);
      _zoneButtons.push(btn);

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openAddDecorationPanel(zone, btn);
      });
    });
  }

  function teardownZones() {
    _zoneButtons.forEach(function (b) { b.remove(); });
    _zoneButtons = [];
    /* remove handles from all decorations */
    document.querySelectorAll('.wq-handles').forEach(function (h) { h.remove(); });
  }

  /* ── Mark decorations already on the page ────────────────────── */
  function markExistingDecorations() {
    document.querySelectorAll('[data-zone] img[aria-hidden="true"]').forEach(function (img) {
      if (!img.classList.contains('wq-decoration')) return;
      img.style.pointerEvents = 'auto';
      makeDraggable(img);
      addHandles(img);
    });
  }

  /* ── Add decoration panel ────────────────────────────────────── */
  function openAddDecorationPanel(zone, triggerBtn) {
    closePanel();
    var rect = triggerBtn.getBoundingClientRect();

    var panel = document.createElement('div');
    panel.className = 'wq-panel';
    panel.style.position = 'fixed';
    panel.style.top  = Math.min(rect.bottom + 8, window.innerHeight - 200) + 'px';
    panel.style.left = Math.min(rect.left, window.innerWidth - 316) + 'px';

    panel.innerHTML =
      '<p class="wq-panel-title">Add image to ' + zone.dataset.zone + '</p>' +
      '<input type="url" placeholder="Paste image URL (from Upload Tool)"/>' +
      '<div class="wq-panel-row">' +
        '<button class="wq-place-btn">Place on site</button>' +
        '<button class="wq-cancel-btn">Cancel</button>' +
      '</div>' +
      '<p class="wq-panel-hint">Upload an image in Admin → Upload Tool, copy the URL, then paste it here.</p>';

    document.body.appendChild(panel);
    _panel = panel;
    panel.querySelector('input').focus();

    panel.querySelector('.wq-place-btn').addEventListener('click', function () {
      var url = panel.querySelector('input').value.trim();
      if (!url) return;
      closePanel();
      placeDecoration(zone, url);
    });

    panel.querySelector('.wq-cancel-btn').addEventListener('click', closePanel);

    panel.querySelector('input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter')  panel.querySelector('.wq-place-btn').click();
      if (e.key === 'Escape') closePanel();
    });
  }

  /* ── Place a new decoration in a zone ────────────────────────── */
  function placeDecoration(zone, url) {
    var img = document.createElement('img');
    img.src   = url;
    img.alt   = '';
    img.setAttribute('aria-hidden', 'true');
    img.className = 'wq-decoration';

    /* start centered in zone */
    img.style.cssText =
      'position:absolute;top:30px;left:30px;width:200px;' +
      'opacity:1;z-index:50;pointer-events:auto;cursor:grab;';

    zone.appendChild(img);
    makeDraggable(img);
    addHandles(img);
  }

  /* ── Make an image draggable ─────────────────────────────────── */
  function makeDraggable(img) {
    var drag = false, sx, sy, ox, oy;

    img.addEventListener('mousedown', function (e) {
      if (!EDIT) return;
      e.preventDefault();
      drag = true;
      sx = e.clientX; sy = e.clientY;
      ox = parseInt(img.style.left)  || 0;
      oy = parseInt(img.style.top)   || 0;
      img.style.cursor = 'grabbing';
      img.style.zIndex = '60';

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup',   up);
    });

    function move(e) {
      if (!drag) return;
      img.style.left = (ox + e.clientX - sx) + 'px';
      img.style.top  = (oy + e.clientY - sy) + 'px';
      if (img._wqHandles) positionHandles(img);
    }

    function up() {
      drag = false;
      img.style.cursor  = 'grab';
      img.style.zIndex  = '50';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup',   up);
    }
  }

  /* ── Edit handles (controls panel) for a decoration ─────────── */
  function addHandles(img) {
    /* remove any existing handles for this image */
    if (img._wqHandles) img._wqHandles.remove();

    var h = document.createElement('div');
    h.className = 'wq-handles';
    h.style.position = 'fixed';
    document.body.appendChild(h);
    img._wqHandles = h;

    var curW   = parseInt(img.style.width)   || 200;
    var curOp  = parseFloat(img.style.opacity !== '' ? img.style.opacity : 1);
    var curRot = 0;
    if (img.style.transform) {
      var m = img.style.transform.match(/rotate\((-?[\d.]+)deg\)/);
      if (m) curRot = parseFloat(m[1]);
    }

    h.innerHTML =
      '<div class="wq-ctrl">' +
        '<span class="wq-ctrl-label">Width</span>' +
        '<input type="range" id="wq-w" min="40" max="800" value="' + curW + '"/>' +
        '<span class="wq-ctrl-val" id="wq-wv">' + curW + 'px</span>' +
      '</div>' +
      '<div class="wq-ctrl">' +
        '<span class="wq-ctrl-label">Opacity</span>' +
        '<input type="range" id="wq-op" min="0" max="1" step="0.05" value="' + curOp.toFixed(2) + '"/>' +
        '<span class="wq-ctrl-val" id="wq-opv">' + curOp.toFixed(2) + '</span>' +
      '</div>' +
      '<div class="wq-ctrl">' +
        '<span class="wq-ctrl-label">Rotation</span>' +
        '<input type="number" id="wq-rot" min="-180" max="180" step="5" value="' + curRot + '"/>' +
      '</div>' +
      '<div class="wq-handle-btns">' +
        '<button class="wq-handle-save">✓ Save to site</button>' +
        '<button class="wq-handle-del">🗑</button>' +
      '</div>';

    positionHandles(img);

    /* live width */
    h.querySelector('#wq-w').addEventListener('input', function () {
      img.style.width = this.value + 'px';
      h.querySelector('#wq-wv').textContent = this.value + 'px';
      positionHandles(img);
    });
    /* live opacity */
    h.querySelector('#wq-op').addEventListener('input', function () {
      img.style.opacity = this.value;
      h.querySelector('#wq-opv').textContent = parseFloat(this.value).toFixed(2);
    });
    /* live rotation */
    h.querySelector('#wq-rot').addEventListener('input', function () {
      img.style.transform = 'rotate(' + this.value + 'deg)';
    });

    /* save */
    h.querySelector('.wq-handle-save').addEventListener('click', function () {
      saveDecoration(img);
    });

    /* delete */
    h.querySelector('.wq-handle-del').addEventListener('click', async function () {
      if (!confirm('Remove this decoration from the site?')) return;
      var decId = img.dataset.decorationId;
      if (decId) {
        var r = await db.from('decorations').delete().eq('id', decId);
        if (r.error) { toast(r.error.message, 'err'); return; }
      }
      h.remove();
      img.remove();
      toast('Decoration removed');
    });

    /* reposition on scroll */
    window.addEventListener('scroll', function onScroll() {
      if (!document.body.contains(img)) {
        window.removeEventListener('scroll', onScroll);
        return;
      }
      positionHandles(img);
    }, { passive: true });
  }

  function positionHandles(img) {
    var h = img._wqHandles;
    if (!h) return;
    var r = img.getBoundingClientRect();
    var top = r.top - h.offsetHeight - 8;
    if (top < 50) top = r.bottom + 8;
    h.style.top  = top + 'px';
    h.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 250)) + 'px';
  }

  /* ── Save decoration position to Supabase ────────────────────── */
  async function saveDecoration(img) {
    var zone = img.closest('[data-zone]');
    if (!zone) { toast('Could not find zone', 'err'); return; }

    var zr    = zone.getBoundingClientRect();
    var ir    = img.getBoundingClientRect();
    var pTop  = ((ir.top  - zr.top)  / zr.height * 100).toFixed(1) + '%';
    var pLeft = ((ir.left - zr.left) / zr.width  * 100).toFixed(1) + '%';
    var pW    = (parseInt(img.style.width) / zr.width * 100).toFixed(1) + '%';
    var rot   = '0';
    if (img.style.transform) {
      var m = img.style.transform.match(/rotate\((-?[\d.]+)deg\)/);
      if (m) rot = m[1];
    }

    var payload = {
      zone:       zone.dataset.zone,
      url:        img.src,
      pos_top:    pTop,
      pos_left:   pLeft,
      pos_right:  null,
      pos_bottom: null,
      width:      pW,
      opacity:    img.style.opacity || '1',
      rotation:   rot,
      z_index:    50,
    };

    var result;
    var existingId = img.dataset.decorationId;

    if (existingId) {
      result = await db.from('decorations').update(payload).eq('id', existingId);
    } else {
      result = await db.from('decorations').insert(payload).select().single();
      if (!result.error && result.data) {
        img.dataset.decorationId = result.data.id;
      }
    }

    if (result.error) toast(result.error.message, 'err');
    else toast('Decoration saved');
  }

  /* ════════════════════════════════════════════════════════════
     UTILITIES
  ════════════════════════════════════════════════════════════ */
  function closePanel() {
    if (_panel) { _panel.remove(); _panel = null; }
  }

  document.addEventListener('click', function (e) {
    if (!_panel) return;
    if (!_panel.contains(e.target) && !e.target.classList.contains('wq-zone-add')) {
      closePanel();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });

  function toast(msg, type) {
    var t = document.createElement('div');
    t.className = 'wq-toast ' + (type === 'err' ? 'err' : 'ok');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; }, 2400);
    setTimeout(function () { t.remove(); }, 2900);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

}());
