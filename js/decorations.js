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

      var img = new Image();
      img.src = dec.url;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.style.position     = 'absolute';
      img.style.pointerEvents = 'none';

      /* Supabase columns use pos_top / pos_right / pos_bottom / pos_left */
      if (dec.pos_top)    img.style.top    = dec.pos_top;
      if (dec.pos_right)  img.style.right  = dec.pos_right;
      if (dec.pos_bottom) img.style.bottom = dec.pos_bottom;
      if (dec.pos_left)   img.style.left   = dec.pos_left;
      if (dec.width)      img.style.width  = dec.width;

      img.style.opacity   = (dec.opacity != null) ? dec.opacity : 1;
      img.style.zIndex    = (dec.z_index != null)  ? dec.z_index : 1;

      if (dec.rotation && dec.rotation !== '0') {
        img.style.transform = 'rotate(' + dec.rotation + 'deg)';
      }
      zone.appendChild(img);
    });
  }

  if (!supabaseClient) return;

  supabaseClient.from('decorations').select('*')
    .then(function (r) { if (!r.error) apply(r.data); })
    .catch(function () {});
}());
