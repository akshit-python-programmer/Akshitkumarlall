/* =====================================================================
   x-projects.js — PROJECTS group. Owner: projects.
   Touch: the card crossing the middle of the screen is "detected" (lock bracket,
   colour, muted preview) — Vision touchCards() (vision.js 480-485). Keyboard focus
   on a card's CTA plays its preview like hover. Filtering/modal stay in the IIFE.
   ===================================================================== */
(function () {
  'use strict';
  var X = window.X;
  if (!X) return;
  var VM = window.VideoManager;
  var cards = X.$$('#bentoGrid .bc');
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  function preview(card, on) {
    if (!VM) return;
    var v = card.querySelector('.bc-multi .main-vid') || card.querySelector('video');
    if (!v) return;
    if (on && !X.reduce && !saveData) { VM.ensureSrc(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else { v.pause(); }
  }

  if (!X.fine && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-active', e.isIntersecting); preview(e.target, e.isIntersecting); });
    }, { rootMargin: '-38% 0px -38% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }

  cards.forEach(function (c) {
    var cta = c.querySelector('.bc-expand');
    if (!cta) return;
    cta.addEventListener('focus', function () { preview(c, true); });
    cta.addEventListener('blur', function () { preview(c, false); });
  });
})();
