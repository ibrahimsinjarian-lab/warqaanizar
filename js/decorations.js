/* decorations.js — fetch from Supabase, inject into data-zone sections */
(function () {
  'use strict';

  function apply(list) {
    if (!Array.isArray(list) || !list.length) return;
    list.forEach(function (dec) {
      if (!dec.url || !dec.zone) return;
      var zone = document.querySelector('[data-zone="' + dec.zone + '"]');
      if (!zone) return;
      if (window.getComputedStyle(zone).position === 'static') zone.style.position = 'relative';

      var img = document.createElement('img');
      img.src = dec.url;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');

      /* mark for editor.js to pick up drag handles */
      img.classList.add('wq-decoration');
      img.dataset.decorationId = dec.id;

      img.style.position     = 'absolute';
      img.style.pointerEvents = 'none'; /* editor.js re-enables in edit mode */

      if (dec.pos_top)    img.style.top    = dec.pos_top;
      if (dec.pos_right)  img.style.right  = dec.pos_right;
      if (dec.pos_bottom) img.style.bottom = dec.pos_bottom;
      if (dec.pos_left)   img.style.left   = dec.pos_left;
      if (dec.width)      img.style.width  = dec.width;

      img.style.opacity  = (dec.opacity  != null) ? dec.opacity  : 1;
      img.style.zIndex   = (dec.z_index  != null) ? dec.z_index  : 1;

      if (dec.rotation) {
        var tr = dec.rotation;
        /* backward-compat: old records stored plain degrees e.g. "45" or "0" */
        if (tr && !isNaN(parseFloat(tr)) && !/[a-z]/i.test(tr.trim())) {
          tr = parseFloat(tr) !== 0 ? 'rotate(' + tr + 'deg)' : '';
        }
        if (tr) img.style.transform = tr;
      }

      zone.appendChild(img);
    });
  }

  if (!window.supabaseClient) return;
  window.supabaseClient.from('decorations').select('*')
    .then(function (r) { if (!r.error) apply(r.data); })
    .catch(function () {});
}());
