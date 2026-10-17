/* =====================================================================
   x-core.js — shared motion + interaction runtime ("NOIR / CV")
   OWNER: foundation. Loaded with `defer` after the vendor scripts and before
   every js/x-<group>.js. Exposes window.X for section scripts.
   Vendor: gsap 3.15 (+ScrollTrigger, SplitText, ScrambleTextPlugin), Lenis 1.3.
   Everything degrades: no GSAP → no motion, content stays visible.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var mq = function (q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');
  var conn = navigator.connection || {};
  var lowPower = !!conn.saveData || (mq('(pointer: coarse)') &&
    ((navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)));
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var X = window.X = {
    gsap: hasGsap ? window.gsap : null,
    ScrollTrigger: hasGsap ? window.ScrollTrigger : null,
    SplitText: window.SplitText || null,
    lenis: null,
    reduce: reduce, fine: fine, touch: !fine, lowPower: lowPower,
    motion: hasGsap && !reduce,
    store: store, $: $, $$: $$
  };

  /* fonts ready (capped so a slow font never blocks motion) */
  X.ready = (document.fonts && document.fonts.ready)
    ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () {})
    : Promise.resolve();

  /* hero intro handshake: js/x-hero.js calls X.introDone() when finished (or immediately) */
  var introResolve;
  X.intro = new Promise(function (r) { introResolve = r; });
  X.introDone = function () {
    root.classList.remove('x-intro');
    store.sset('x-intro', '1');
    if (introResolve) { introResolve(); introResolve = null; }
  };
  setTimeout(function () { if (root.classList.contains('x-intro')) X.introDone(); }, 2500); /* failsafe */

  /* register plugins whenever GSAP is present — ScrollTrigger is also used for
     non-animated state (active nav link, pill visibility) under reduced motion */
  if (hasGsap) {
    var plugins = [window.ScrollTrigger];
    if (window.SplitText) plugins.push(window.SplitText);
    if (window.ScrambleTextPlugin) plugins.push(window.ScrambleTextPlugin);
    window.gsap.registerPlugin.apply(window.gsap, plugins);
    window.gsap.defaults({ ease: 'expo.out', duration: 1.1 });
    window.ScrollTrigger.config({ ignoreMobileResize: true });
  }

  if (!X.motion) {
    /* no GSAP or reduced motion: show everything, wire the non-animated helpers, stop here */
    root.classList.remove('x-motion');
    if (!hasGsap) root.classList.remove('x-intro');
    X.reveal = function () {}; X.split = function () { return null; };
    X.scrollTo = function (t) {
      var el = typeof t === 'string' ? (t === '#home' ? 0 : $(t)) : t;
      if (el === 0) window.scrollTo(0, 0); else if (el && el.scrollIntoView) el.scrollIntoView();
    };
    X.lock = function () { root.classList.add('x-locked'); };
    X.unlock = function () { root.classList.remove('x-locked'); };
    X.counter = function () {};
    X.magnetic = function () {};
    wireTheme();
    wireAnchors();
    root.classList.add('x-ready');
    document.dispatchEvent(new CustomEvent('x:ready'));
    return;
  }

  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;

  /* ------------------------------------------------------------ Lenis + ScrollTrigger proxy */
  if (typeof window.Lenis !== 'undefined') {
    X.lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1, smoothWheel: true, syncTouch: false });
    X.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { X.lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  X.scrollTo = function (target, opts) {
    var el = typeof target === 'string' ? (target === '#home' || target === '#top' ? 0 : $(target)) : target;
    if (el === null || el === undefined) return;
    if (X.lenis) {
      X.lenis.scrollTo(el, Object.assign({ offset: 0, duration: 1.5, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } }, opts || {}));
    } else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  /* ref-counted scroll lock for overlays (menu, modal) */
  var locks = 0;
  X.lock = function () { if (locks++ === 0) { root.classList.add('x-locked'); if (X.lenis) X.lenis.stop(); } };
  X.unlock = function () { if (locks > 0 && --locks === 0) { root.classList.remove('x-locked'); if (X.lenis) X.lenis.start(); } };

  wireAnchors();
  wireTheme();

  /* ------------------------------------------------------------ SplitText helper */
  X.split = function (el, opts) {
    if (!window.SplitText || !el) return null;
    return window.SplitText.create(el, Object.assign({ type: 'lines', mask: 'lines', linesClass: 'x-ln', autoSplit: true }, opts || {}));
  };

  /* ------------------------------------------------------------ reveal system
     data-x-reveal="up"      fade + rise 28px (default)
     data-x-reveal="fade"    opacity only
     data-x-reveal="lines"   SplitText line mask rise (headings, short paragraphs)
     data-x-reveal="clip"    media wipe bottom→top + inner image settle
     data-x-reveal="stagger" direct children rise one after another
     optional data-x-delay="0.2" (seconds)                                      */
  function animateIn(el) {
    var type = el.getAttribute('data-x-reveal') || 'up';
    var delay = parseFloat(el.getAttribute('data-x-delay')) || 0;
    if (type === 'lines' && window.SplitText) {
      X.split(el, {
        onSplit: function (self) {
          gsap.set(self.lines, { yPercent: 108 });
          el.classList.add('is-in');
          return gsap.to(self.lines, { yPercent: 0, stagger: 0.08, duration: 1.2, delay: delay, ease: 'expo.out' });
        }
      });
      return;
    }
    if (type === 'clip') {
      var media = el.querySelector('img, video');
      el.classList.add('is-in');
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, delay: delay, ease: 'expo.inOut', clearProps: 'clipPath' });
      if (media) gsap.fromTo(media, { scale: 1.25 }, { scale: 1.001, duration: 1.8, delay: delay + 0.15, ease: 'expo.out', clearProps: 'transform' });
      return;
    }
    if (type === 'stagger') {
      var kids = Array.prototype.slice.call(el.children);
      gsap.set(kids, { opacity: 0, y: 24 });
      el.classList.add('is-in');
      gsap.to(kids, { opacity: 1, y: 0, stagger: 0.07, duration: 1, delay: delay, clearProps: 'transform,opacity' });
      return;
    }
    gsap.set(el, { opacity: 0, y: type === 'fade' ? 0 : 28 });
    el.classList.add('is-in');
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, delay: delay, clearProps: 'transform,opacity' });
  }

  X.reveal = function (scope) {
    $$('[data-x-reveal]:not(.is-in):not([data-x-bound])', scope || document).forEach(function (el) {
      el.setAttribute('data-x-bound', '');
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) { animateIn(el); return; }      /* already on screen */
      if (r.bottom <= 0) { el.classList.add('is-in'); return; }                              /* above the fold after a reload/anchor jump */
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { animateIn(el); } });
    });
  };

  /* ------------------------------------------------------------ counters
     <span data-x-count="150">150</span> — final value stays in the DOM for no-JS / SEO */
  X.counter = function (el) {
    var to = parseFloat(el.getAttribute('data-x-count'));
    if (isNaN(to)) return;
    var dec = parseInt(el.getAttribute('data-x-dec') || '0', 10);
    var o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.to(o, { v: to, duration: 2, ease: 'expo.out', onUpdate: function () { el.textContent = o.v.toFixed(dec); } });
      }
    });
  };

  /* ------------------------------------------------------------ magnetic (fine pointer only) */
  X.magnetic = function (el) {
    if (!fine || el.__xMag) return;
    el.__xMag = true;
    var inner = el.querySelector('.x-btn-in');
    var k = parseFloat(el.getAttribute('data-x-magnetic')) || 0.3;
    var xT = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    var yT = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    var ixT = inner ? gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' }) : null;
    var iyT = inner ? gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      xT(dx * k); yT(dy * k);
      if (ixT) { ixT(dx * k * 0.45); iyT(dy * k * 0.45); }
    });
    el.addEventListener('pointerleave', function () {
      gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.38)', overwrite: true });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.38)', overwrite: true });
    });
  };

  /* ------------------------------------------------------------ media-label cursor
     Any element with data-x-cursor="View|Play|Drive" shows a label disc that follows the pointer.
     The native cursor is never hidden. */
  function wireCursor() {
    if (!fine) return;
    var c = document.createElement('div');
    c.className = 'x-cursor'; c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    var cx = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' });
    var cy = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-x-cursor]') : null;
      if (t) c.textContent = t.getAttribute('data-x-cursor');
      c.classList.toggle('is-on', !!t);
    });
    root.addEventListener('pointerleave', function () { c.classList.remove('is-on'); });
  }

  /* ------------------------------------------------------------ boot */
  X.ready.then(function () {
    try {
      X.reveal();
      $$('[data-x-count]').forEach(X.counter);
      $$('[data-x-magnetic]').forEach(X.magnetic);
      wireCursor();
    } catch (err) {
      console.error('[x-core] reveal setup failed — showing all content', err);
      root.classList.remove('x-motion');
    }
    root.classList.add('x-ready');
    document.dispatchEvent(new CustomEvent('x:ready'));
    ScrollTrigger.refresh();
  });
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
    /* belt and braces: anything still hidden 4s after load gets shown */
    setTimeout(function () {
      $$('[data-x-reveal]:not(.is-in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) animateIn(el);
      });
    }, 4000);
  });

  /* ------------------------------------------------------------ shared helpers (hoisted) */
  function wireAnchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a || a.hasAttribute('data-x-noscroll')) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = id === '#home' ? document.getElementById('home') : document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('x:navigate', { detail: { id: id } })); /* menus close on this */
      setTimeout(function () { X.scrollTo(id === '#home' ? 0 : el); }, root.classList.contains('x-menu-open') ? 420 : 0);
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* theme: X.theme() reads, X.setTheme(next) writes (+ wipe), and both legacy 'themechange'
     (window) and 'x:theme' (document) fire so the 3D journey and section scripts can recolour. */
  function wireTheme() {
    X.theme = function () { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; };
    X.setTheme = function (next) {
      next = next === 'light' ? 'light' : 'dark';
      function apply() {
        root.setAttribute('data-theme', next);
        store.set('theme', next);
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', next === 'light' ? '#eee8de' : '#0b0a09');
        window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
        document.dispatchEvent(new CustomEvent('x:theme', { detail: next }));
      }
      if (!X.motion) { apply(); return; }
      var wipe = document.createElement('div');
      wipe.setAttribute('aria-hidden', 'true');
      wipe.style.cssText = 'position:fixed;inset:0;z-index:1200;pointer-events:none;background:' + (next === 'light' ? '#eee8de' : '#0b0a09');
      document.body.appendChild(wipe);
      window.gsap.timeline({ onComplete: function () { wipe.remove(); } })
        .fromTo(wipe, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'expo.inOut' })
        .add(apply)
        .to(wipe, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.65, ease: 'expo.inOut' }, '+=0.05');
    };
  }
})();
