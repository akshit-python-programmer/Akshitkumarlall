/* =====================================================================
   x-awards.js — AWARDS group. Owner: awards.
   Cursor-follow photo over closed rows (noir.js 442-459), award #07 lazy video,
   one-open-at-a-time rows. Show-more + carousels stay in the IIFE [x:awards] blocks.
   ===================================================================== */
(function () {
  'use strict';
  var X = window.X;
  if (!X) return;

  /* award #07 video: lazy autoplay (moved here from the projects init so awards no longer depends on projects.json) */
  if (window.VideoManager) window.VideoManager.initLazyAutoplay('.aw-lazy-vid');

  /* rows: opening one closes the others in the same list (keeps the page short) */
  var rows = X.$$('.x-aw-row');
  rows.forEach(function (row) {
    row.addEventListener('toggle', function () {
      if (!row.open) return;
      rows.forEach(function (r) { if (r !== row && r.open && r.parentElement === row.parentElement) r.open = false; });
      if (X.ScrollTrigger) setTimeout(function () { X.ScrollTrigger.refresh(); }, 650);
    });
  });

  /* cursor-follow photo: desktop + motion only */
  var fl = document.querySelector('.x-aw-float');
  if (!fl || !X.fine || !X.motion) return;
  var img = fl.querySelector('img');
  var gsap = X.gsap;
  var fx = gsap.quickTo(fl, 'x', { duration: 0.7, ease: 'power3.out' });
  var fy = gsap.quickTo(fl, 'y', { duration: 0.7, ease: 'power3.out' });
  var fr = gsap.quickTo(fl, 'rotation', { duration: 0.9, ease: 'power3.out' });
  var px = 0;
  function hide() { gsap.to(fl, { clipPath: 'inset(50% 50% 50% 50%)', duration: 0.45, ease: 'power3.in', overwrite: 'auto' }); }
  X.$$('.x-aw-row > summary').forEach(function (sum) {
    var row = sum.parentElement;
    var src = row.getAttribute('data-x-img');
    if (!src) return;
    sum.addEventListener('pointermove', function (e) { fx(e.clientX); fy(e.clientY); fr(gsap.utils.clamp(-8, 8, (e.clientX - px) * 0.4)); px = e.clientX; });
    sum.addEventListener('pointerenter', function (e) {
      if (row.open) return;
      if (img.getAttribute('src') !== src) img.src = src;
      gsap.set(fl, { x: e.clientX, y: e.clientY });
      gsap.to(fl, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
      gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1, ease: 'expo.out' });
    });
    sum.addEventListener('pointerleave', hide);
    sum.addEventListener('click', hide);
  });
})();
