/* =====================================================================
   x-contact.js — CONTACT group. Owner: contact.
   Target-lock on "real.", "Open the form" focus, ?sent=1 success state.
   ===================================================================== */
(function () {
  'use strict';
  var X = window.X;
  if (!X) return;

  /* "Open the form" → scroll + focus the first field (no autofocus on load, ever) */
  var open = document.querySelector('[data-x-open-form]');
  var first = document.getElementById('cfName');
  if (open && first) open.addEventListener('click', function (e) {
    e.preventDefault();
    X.scrollTo(document.getElementById('cForm'), { offset: -120 });
    setTimeout(function () { first.focus({ preventScroll: true }); }, X.motion ? 900 : 0);
  });

  /* FormSubmit redirects back with ?sent=1 (see the _next hidden field) */
  var status = document.getElementById('cfStatus');
  if (status && /[?&]sent=1/.test(location.search)) {
    status.hidden = false;
    status.textContent = 'Thanks — your message is on its way.';
    if (history.replaceState) history.replaceState(null, '', location.pathname + '#contact');
  }

  /* detection lock snaps onto "real." when the headline enters */
  var box = document.querySelector('.x-ct-box');
  if (!box || !X.motion) return;
  var gsap = X.gsap;
  gsap.set(box, { opacity: 0, scale: 1.45 });
  X.ScrollTrigger.create({
    trigger: '.x-ct-title', start: 'top 75%', once: true,
    onEnter: function () {
      gsap.to(box, { opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out', delay: 0.6 });
      var tag = box.querySelector('.x-det-tag');
      if (tag && window.ScrambleTextPlugin) gsap.to(tag, { delay: 0.6, duration: 0.6, scrambleText: { text: tag.textContent, chars: 'lowerCase' } });
    }
  });
})();
