/* site-settings.js — pull settings from Supabase and update DOM */
(function () {
  'use strict';

  function applySettings(s) {
    function txt(id, val) { var e = document.getElementById(id); if (e && val) e.textContent = val; }
    function src(id, val) { var e = document.getElementById(id); if (e && val) e.src = val; }
    function href(id, val) { var e = document.getElementById(id); if (e && val) e.href = val; }

    txt('site-name-arabic',   s.name_arabic);
    txt('site-name-latin',    s.name_latin);
    src('site-portrait',      s.portrait_url);
    txt('site-about-tagline', s.about_tagline);
    href('site-instagram-link', s.instagram_url);
    txt('site-instagram-link',  s.instagram);

    if (s.about_text) {
      var el = document.getElementById('site-about-text');
      if (el) {
        el.innerHTML = s.about_text.trim().split(/\n\n+/).filter(Boolean)
          .map(function (p) { return '<p>' + p.trim() + '</p>'; }).join('');
      }
    }
    if (s.email) {
      var em = document.getElementById('site-email');
      if (em) { em.href = 'mailto:' + s.email; em.textContent = s.email; }
    }
    if (s.whatsapp || s.whatsapp_url) {
      var wa = document.getElementById('site-whatsapp');
      if (wa) {
        if (s.whatsapp_url) wa.href = s.whatsapp_url;
        if (s.whatsapp)     wa.textContent = s.whatsapp;
      }
    }
    /* hero instagram side label */
    var igSide = document.querySelector('.hero-instagram');
    if (igSide) {
      if (s.instagram)     igSide.textContent = s.instagram;
      if (s.instagram_url) igSide.href = s.instagram_url;
    }
    /* hero role subtitle */
    if (s.roles) {
      var roleEls = document.querySelectorAll('.hero-role span:not(.hero-role-dot)');
      var parts = s.roles.split(/[·\|]/).map(function(r){ return r.trim(); }).filter(Boolean);
      roleEls.forEach(function (el, i) { if (parts[i]) el.textContent = parts[i]; });
    }
  }

  if (!supabaseClient) return;

  supabaseClient.from('settings').select('*').eq('id', 1).single()
    .then(function (r) { if (!r.error && r.data) applySettings(r.data); })
    .catch(function () {});
}());
