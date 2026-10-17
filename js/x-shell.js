/* =====================================================================
   x-shell.js — SHELL group: nav hide/active state, clocks, marquee, pill, footer mark,
   recent-win toast. Owner: shell. (The menu open/close + .scrolled live in the IIFE
   [x:shell] NAV block so they work even if this file fails.)
   ===================================================================== */
(function () {
  'use strict';
  var X = window.X;
  if (!X) return;
  var root = document.documentElement;
  var gsap = X.gsap, ST = X.ScrollTrigger;

  /* ---- clocks: [data-x-clock] HH:MM, [data-x-clock-s] HH:MM:SS (menu only while open) ---- */
  var fmt = function (sec) {
    try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: sec ? '2-digit' : undefined, hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()); }
    catch (e) { return ''; }
  };
  function tick() {
    X.$$('[data-x-clock]').forEach(function (el) { el.textContent = fmt(false); });
    if (root.classList.contains('x-menu-open')) X.$$('[data-x-clock-s]').forEach(function (el) { el.textContent = fmt(true); });
  }
  tick(); setInterval(tick, 1000);

  if (!gsap) { wirePill(false); wireToast(); return; }        /* GSAP failed to load: pill always on */

  /* ---- nav: hide on scroll down past the hero, show on scroll up; active link dot ---- */
  var nav = document.getElementById('nav');
  var lastY = window.scrollY;
  function onScroll(y) {
    if (!nav || root.classList.contains('x-menu-open')) return;
    nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.9);
    lastY = y;
  }
  if (X.lenis) X.lenis.on('scroll', function (e) { onScroll(e.scroll); });
  else window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
  document.addEventListener('focusin', function (e) { if (nav && nav.contains(e.target)) nav.classList.remove('is-hidden'); });

  X.$$('.x-nav-links a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (!sec) return;
    var end = id === 'about' ? document.getElementById('skills') || sec : sec;   /* About stays active through the stack */
    ST.create({ trigger: sec, start: 'top 45%', endTrigger: end, end: 'bottom 45%', onToggle: function (s) { a.classList.toggle('is-active', s.isActive); } });
  });

  /* ---- marquee: velocity-reactive loop (noir.js 355-381), paused off-screen ---- */
  var track = document.querySelector('.x-marquee-track');
  if (track && X.motion) {                                       /* reduced motion: static first set */
    var set = track.querySelector('.x-marquee-set');
    var clone = set.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone);
    var w = set.offsetWidth, x = 0, dir = -1, boost = 0, skew = 0, skewT = 0;
    window.addEventListener('resize', function () { w = set.offsetWidth; });
    var st = ST.create({
      trigger: '.x-marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var v = self.getVelocity();
        dir = self.direction === 1 ? -1 : 1;
        boost = Math.min(12, Math.abs(v) / 160);
        skewT = gsap.utils.clamp(-6, 6, v / -280);
      }
    });
    gsap.ticker.add(function (t, dt) {
      if (!st.isActive) return;
      var f = dt / 16.67;
      x += dir * (1 + boost) * f; boost *= 0.93; skewT *= 0.9; skew += (skewT - skew) * 0.12;
      if (x <= -w) x += w; if (x > 0) x -= w;
      gsap.set(track, { x: x, skewX: skew });
    });
  }

  /* ---- footer wordmark: fit to the container width exactly (deliberate crop at the baseline) ---- */
  var mark = document.querySelector('.x-ft-mark-in');
  function fitMark() {
    if (!mark) return;
    var box = mark.parentElement;
    if (window.innerWidth <= 760) { box.style.fontSize = ''; return; }   /* phone: stacked CSS layout */
    box.style.fontSize = '100px';
    var avail = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2;
    box.style.fontSize = (100 * avail / mark.getBoundingClientRect().width * 0.995).toFixed(2) + 'px';
  }
  X.ready.then(fitMark);
  window.addEventListener('resize', fitMark);
  /* ---- footer wordmark: chars rise ---- */
  if (mark && window.SplitText && X.motion) {
    var sp = window.SplitText.create(mark, { type: 'words,chars' });   /* words keep letters together when the mark wraps on phones */
    gsap.from(sp.chars, { yPercent: 100, stagger: 0.03, duration: 1.2, scrollTrigger: { trigger: '.x-footer', start: 'top 92%', once: true } });
  }

  wirePill(true);
  wireToast();

  /* ---- floating pill: in after #projects begins, out once #contact is near ---- */
  function wirePill(animated) {
    var pill = document.querySelector('.quick-contact');
    if (!pill) return;
    if (!animated || !ST) { pill.classList.add('is-in'); return; }   /* (no GSAP) */
    var past = false, atContact = false;
    var upd = function () { pill.classList.toggle('is-in', past && !atContact); };
    ST.create({ trigger: '#projects', start: 'top 40%', onEnter: function () { past = true; upd(); }, onLeaveBack: function () { past = false; upd(); } });
    ST.create({ trigger: '#contact', start: 'top 75%', onEnter: function () { atContact = true; upd(); }, onLeaveBack: function () { atContact = false; upd(); } });
  }

  /* ---- recent-win toast: non-modal, once per session, never during the intro / overlays ---- */
  function wireToast() {
    var pop = document.getElementById('vhPop');
    if (!pop) return;
    var KEY = 'vhPopSeen';
    if (X.store.sget(KEY) === '1') return;
    if (window.innerWidth < 340 || window.innerHeight < 500) return;
    var timer = 0, shown = false;
    function close() {
      clearTimeout(timer);
      pop.classList.remove('open');
      X.store.sset(KEY, '1');
      setTimeout(function () { pop.hidden = true; }, 500);
    }
    function open() {
      if (shown) return;
      if (root.classList.contains('x-menu-open') || root.classList.contains('x-locked')) { setTimeout(open, 2000); return; }
      shown = true; pop.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { pop.classList.add('open'); }); });
      timer = setTimeout(close, 10000);
      pop.addEventListener('pointerenter', function () { clearTimeout(timer); });
      pop.addEventListener('pointerleave', function () { clearTimeout(timer); timer = setTimeout(close, 4000); });
    }
    ['vhClose', 'vhGo'].forEach(function (id) { var b = document.getElementById(id); if (b) b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop.classList.contains('open') && !root.classList.contains('x-locked')) close(); });
    /* only once the visitor has scrolled past half the hero — it never covers the hero itself */
    X.intro.then(function () {
      if (ST) ST.create({ trigger: '#home', start: 'center top', once: true, onEnter: function () { setTimeout(open, 600); } });
      else setTimeout(open, 8000);
    });
  }
})();
