/* =====================================================================
   x-about.js — ABOUT + STACK group. Owner: about.
   Scrubbed word light-up on the statement (noir.js 335-339) + figure parallax.
   ===================================================================== */
(function () {
  'use strict';
  var X = window.X;
  if (!X || !X.motion) return;
  var gsap = X.gsap;
  X.ready.then(function () {
    var line = document.querySelector('[data-x-scrub]');
    if (line && window.SplitText) {
      var s = window.SplitText.create(line, { type: 'words' });
      gsap.fromTo(s.words, { opacity: 0.18 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 82%', end: 'bottom 50%', scrub: true } });
    }
    var fig = document.querySelector('.x-about-fig .x-media > img');
    if (fig) gsap.fromTo(fig, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: '.x-about-fig', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
})();
