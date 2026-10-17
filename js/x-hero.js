/* =====================================================================
   x-hero.js — HERO group (#home). Owner: hero.
   1. light-leak shader (from .design-lab/noir/shader.js, re-tinted by tokens)
   2. Sobel 3×3 edge pass on the portrait (from .design-lab/vision/vision.js 72-107)
   3. cursor lens that reveals the edges (vision.js 249-263), desktop only
   4. first-visit intro: scan line acquires the portrait, detections lock, name decodes
   5. "Now building —" role rotation (ScrambleText), 6. scroll-out parallax
   Depends on window.X (js/x-core.js). Content is fully visible without this file.
   ===================================================================== */
(function () {
  'use strict';
  var X = window.X;
  if (!X) return;
  var root = document.documentElement;
  var hero = document.getElementById('home');
  var fig = document.getElementById('heroPortrait');
  if (!hero || !fig) { X.introDone(); return; }
  var img = fig.querySelector('img');
  var edges = fig.querySelector('.x-hp-edges');
  var scan = fig.querySelector('.x-hp-scan');
  var lens = fig.querySelector('.x-hp-lens');
  var lensMs = document.getElementById('heroLensMs');
  var dets = X.$$('.x-hp-det', fig);
  var ocr = hero.querySelector('.x-hn-ocr');
  var gsap = X.gsap;
  var edgesReady = false;
  /* must match the stacked-layout media query in css/x-hero.css */
  var STACKED = '(max-width: 760px), (orientation: portrait) and (max-width: 1100px)';
  var stacked = function () { return window.matchMedia(STACKED).matches; };

  /* ---------------------------------------------------------------- 1. shader */
  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform vec2 uFocus;',
    'uniform vec3 uBg;uniform vec3 uA;uniform vec3 uB;uniform vec3 uC;uniform float uStrength;uniform float uLight;uniform float uFade;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;',
    ' vec2 p=uv-uFocus;p.x*=asp;',
    ' float t=uTime*.045;',
    ' vec2 q=vec2(fbm(p*1.3+vec2(0.,t)),fbm(p*1.3+vec2(5.2,-t)));',
    ' vec2 r=vec2(fbm(p*1.5+3.*q+vec2(1.7,9.2)+t*1.4),fbm(p*1.5+3.*q+vec2(8.3,2.8)-t));',
    ' float f=fbm(p*1.15+2.4*r);',
    ' vec2 m=(uMouse-.5)*vec2(.16,.1);',
    ' float d=length((p-m)*vec2(.78,1.08));',
    ' float glow=exp(-d*d*3.6);float core=exp(-d*d*11.);float smoke=smoothstep(.32,.86,f);',
    ' vec3 col=uBg;',
    ' col=mix(col,uC,smoke*.55*uStrength);',
    ' vec3 warm=mix(uA,uB,clamp(core*.75*smoke,0.,1.));',
    ' col=mix(col,warm,clamp(glow*(.18+.95*smoke)*uStrength,0.,1.));',
    ' vec2 lc=vec2(1.06+.06*sin(t*3.1),1.1+.05*cos(t*2.3));',
    ' float ld=length((uv-lc)*vec2(asp*.6,1.));',
    ' float leak=smoothstep(.85,.0,ld)*(.5+.5*fbm(uv*3.+t*2.));',
    ' col=mix(col,mix(uA,uB,.4),leak*.28*uStrength);',            /* .38 → .28: keeps the top-right labels ≥4.5:1 */
    ' float streak=exp(-abs(p.y-.05)*80.)*exp(-abs(p.x)*1.6)*(.6+.4*sin(t*9.+f*6.));',
    ' col+=mix(uA,uB,.55)*streak*.14*uStrength*(1.-uLight*.7);',
    ' float v=smoothstep(1.3,.2,length((uv-vec2(.5,.45))*vec2(asp*.8,1.)));',
    ' col*=mix(mix(.3,.88,uLight),1.,v);',
    ' col=mix(uBg,col,uFade);',
    ' col+=(hash(gl_FragCoord.xy+fract(uTime*7.))-.5)*(2.5/255.);',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function hexToRgb(h) {
    h = (h || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return isNaN(n) ? [0, 0, 0] : [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function initGL(canvas, opts) {
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (e) {}
    if (!gl) return null;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uTime', 'uMouse', 'uFocus', 'uBg', 'uA', 'uB', 'uC', 'uStrength', 'uLight', 'uFade'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    var S = { mouse: [0.5, 0.5], target: [0.5, 0.5], focus: [0.5, 0.42], fade: 1, running: false, raf: 0, t0: performance.now(), tFrozen: 18, scale: opts.scale, still: opts.still };
    function readTheme() {
      var cs = getComputedStyle(root);
      gl.uniform3fv(U.uBg, hexToRgb(cs.getPropertyValue('--x-gl-bg')));
      gl.uniform3fv(U.uA, hexToRgb(cs.getPropertyValue('--x-gl-a')));
      gl.uniform3fv(U.uB, hexToRgb(cs.getPropertyValue('--x-gl-b')));
      gl.uniform3fv(U.uC, hexToRgb(cs.getPropertyValue('--x-gl-c')));
      gl.uniform1f(U.uStrength, parseFloat(cs.getPropertyValue('--x-gl-strength')) || 1);
      gl.uniform1f(U.uLight, X.theme() === 'light' ? 1 : 0);
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5), s = S.scale * dpr;
      var W = Math.max(2, Math.round(canvas.clientWidth * s)), H = Math.max(2, Math.round(canvas.clientHeight * s));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H); gl.uniform2f(U.uRes, W, H);
    }
    function draw(time) {
      S.mouse[0] += (S.target[0] - S.mouse[0]) * 0.04; S.mouse[1] += (S.target[1] - S.mouse[1]) * 0.04;
      gl.uniform1f(U.uTime, S.still ? S.tFrozen : time);
      gl.uniform2f(U.uMouse, S.mouse[0], S.mouse[1]); gl.uniform2f(U.uFocus, S.focus[0], S.focus[1]);
      gl.uniform1f(U.uFade, S.fade); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop() { if (!S.running) return; draw((performance.now() - S.t0) / 1000 + S.tFrozen); S.raf = requestAnimationFrame(loop); }
    readTheme(); resize(); draw(S.tFrozen);
    return {
      start: function () { if (S.still) { draw(S.tFrozen); return; } if (!S.running) { S.running = true; S.raf = requestAnimationFrame(loop); } },
      stop: function () { S.running = false; cancelAnimationFrame(S.raf); },
      resize: function () { resize(); if (!S.running) draw(S.tFrozen); },
      theme: function () { readTheme(); if (!S.running) draw(S.tFrozen); },
      mouse: function (x, y) { S.target[0] = x; S.target[1] = y; },
      focus: function (x, y) { S.focus[0] = x; S.focus[1] = y; },
      set fade(v) { S.fade = v; if (!S.running) draw(S.tFrozen); },
      get fade() { return S.fade; }
    };
  }

  /* WebGL only when it is cheap enough: never with Save-Data or low-power touch devices.
     Reduced motion → one still frame. No WebGL → the CSS .x-hero-fallback gradient stays. */
  var gl = null;
  if (!X.lowPower) gl = initGL(document.getElementById('heroGl'), { scale: stacked() ? 0.4 : 0.5, still: X.reduce });
  if (gl) {
    hero.classList.add('gl-on');
    var glCanvas = document.getElementById('heroGl');
    var placeFocus = function () {
      var hr = glCanvas.getBoundingClientRect(), pr = fig.getBoundingClientRect();
      gl.focus((pr.left + pr.width * 0.5 - hr.left) / hr.width, 1 - (pr.top + pr.height * 0.36 - hr.top) / hr.height);
    };
    placeFocus();
    var heroVisible = true;
    new IntersectionObserver(function (en) {
      heroVisible = en[0].isIntersecting;
      if (heroVisible && !document.hidden) gl.start(); else gl.stop();
    }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (document.hidden) gl.stop(); else if (heroVisible) gl.start(); });
    if (X.fine && !X.reduce) hero.addEventListener('pointermove', function (e) { gl.mouse(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight); });
    window.addEventListener('resize', function () { gl.resize(); placeFocus(); });
    document.addEventListener('x:theme', function () { gl.theme(); });
    gl.start();
  }

  /* ---------------------------------------------------------------- 2. Sobel 3×3 edge pass */
  function buildEdges() {
    if (!edges || !img.complete || !img.naturalWidth) return;
    try {
      var W = 640, H = Math.round(W * img.naturalHeight / img.naturalWidth);
      var off = document.createElement('canvas'); off.width = W; off.height = H;
      var c = off.getContext('2d', { willReadFrequently: true });
      c.drawImage(img, 0, 0, W, H);
      var t0 = performance.now();
      var src = c.getImageData(0, 0, W, H).data;                 /* throws on file:// (tainted) → caught */
      var g = new Float32Array(W * H);
      for (var i = 0, p = 0; i < g.length; i++, p += 4) g[i] = (src[p] * 0.299 + src[p + 1] * 0.587 + src[p + 2] * 0.114) * (src[p + 3] / 255);
      var out = c.createImageData(W, H), o = out.data;
      var rgb = hexToRgb(getComputedStyle(root).getPropertyValue('--x-edge')).map(function (v) { return Math.round(v * 255); });
      for (var y = 1; y < H - 1; y++) {
        for (var x = 1; x < W - 1; x++) {
          var k = y * W + x;
          var gx = -g[k - W - 1] - 2 * g[k - 1] - g[k + W - 1] + g[k - W + 1] + 2 * g[k + 1] + g[k + W + 1];
          var gy = -g[k - W - 1] - 2 * g[k - W] - g[k - W + 1] + g[k + W - 1] + 2 * g[k + W] + g[k + W + 1];
          var m = Math.sqrt(gx * gx + gy * gy) / 300;
          if (m < 0.13) continue;
          if (m > 1) m = 1;
          var q = k * 4; o[q] = rgb[0]; o[q + 1] = rgb[1]; o[q + 2] = rgb[2]; o[q + 3] = 60 + m * 195;
        }
      }
      var ms = performance.now() - t0;
      edges.width = W; edges.height = H;
      edges.getContext('2d').putImageData(out, 0, 0);
      if (lensMs) lensMs.textContent = ms.toFixed(1);     /* real, measured — never a made-up number */
      edgesReady = true;
    } catch (e) { edgesReady = false; }
  }

  /* ---------------------------------------------------------------- 3. lens (fine pointer only) */
  function wireLens() {
    if (!X.fine || !lens || !edges) return;
    var hidden = 'inset(50% 50% 50% 50%)';
    fig.addEventListener('pointermove', function (e) {
      if (!edgesReady || root.classList.contains('x-intro')) return;
      var r = fig.getBoundingClientRect();
      var lx = e.clientX - r.left, ly = e.clientY - r.top, half = Math.min(110, r.width * 0.13);
      lens.style.width = lens.style.height = (half * 2) + 'px';
      lens.style.transform = 'translate(' + (lx - half).toFixed(1) + 'px,' + (ly - half).toFixed(1) + 'px)';
      edges.style.clipPath = 'inset(' + (ly - half).toFixed(1) + 'px ' + (r.width - lx - half).toFixed(1) + 'px ' + (r.height - ly - half).toFixed(1) + 'px ' + (lx - half).toFixed(1) + 'px)';
      edges.style.opacity = '1';
      lens.classList.add('is-on'); hero.classList.add('is-lensing');
    });
    fig.addEventListener('pointerleave', function () {
      lens.classList.remove('is-on'); hero.classList.remove('is-lensing');
      edges.style.clipPath = hidden;
    });
  }

  /* touch: tapping the portrait replays a one-shot scan (the lens equivalent) */
  function scanOnce(duration) {
    if (!gsap || X.reduce || !edgesReady) return null;
    var p = { v: 0 };
    gsap.set(scan, { opacity: 1 }); gsap.set(edges, { opacity: 1 });
    return gsap.timeline()
      .to(p, { v: 1, duration: duration, ease: 'power2.inOut', onUpdate: function () {
        var v = p.v * 100;
        edges.style.clipPath = 'inset(' + Math.max(0, v - 16).toFixed(2) + '% 0 ' + (100 - v).toFixed(2) + '% 0)';
        scan.style.top = v.toFixed(2) + '%';
      } })
      .to(scan, { opacity: 0, duration: 0.3 })
      .to(edges, { opacity: 0, duration: 0.5, onComplete: function () { edges.style.clipPath = 'inset(50% 50% 50% 50%)'; } }, '<');
  }
  if (!X.fine) fig.addEventListener('click', function () { scanOnce(0.9); });

  /* ---------------------------------------------------------------- 4. first-visit intro (≤1.3 s, skippable) */
  function runIntro() {
    var first = root.classList.contains('x-intro');
    if (!X.motion || !first) { X.introDone(); return; }
    var kumar = hero.querySelector('.x-hn--front .x-hn-serif');   /* only the visible solid word decodes */
    var knock = hero.querySelector('.x-hn-knock');
    var p = { v: 0 };
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    gsap.set(scan, { opacity: 1, top: '0%' });
    if (edgesReady) gsap.set(edges, { opacity: 1 });
    tl.to(p, { v: 1, duration: 1.0, ease: 'power2.inOut', onUpdate: function () {
        var v = p.v * 100;
        img.style.clipPath = 'inset(0 0 ' + (100 - v).toFixed(2) + '% 0)';
        if (edgesReady) edges.style.clipPath = 'inset(' + Math.max(0, v - 16).toFixed(2) + '% 0 ' + (100 - v).toFixed(2) + '% 0)';
        scan.style.top = v.toFixed(2) + '%';
      } }, 0)
      .fromTo(knock, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out', clearProps: 'opacity' }, 0.85)
      .add(function () { img.style.clipPath = ''; X.introDone(); }, 1.0)            /* hero complete at ~1.0–1.3 s */
      .to(scan, { opacity: 0, duration: 0.3 }, 1.0)
      .to(edges, { opacity: 0, duration: 0.5, onComplete: function () { edges.style.clipPath = 'inset(50% 50% 50% 50%)'; edges.style.opacity = ''; } }, 1.0)
      .fromTo(dets, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.12 }, 0.4)
      .to(dets, { opacity: 0, duration: 0.8, ease: 'power2.out', clearProps: 'opacity,transform' }, 2.4);
    if (window.ScrambleTextPlugin) {
      if (kumar) tl.to(kumar, { duration: 0.9, ease: 'none', scrambleText: { text: kumar.textContent, chars: 'kumarakshitl', revealDelay: 0.3, speed: 0.6 } }, 0.1);
      dets.forEach(function (d) {
        var tag = d.querySelector('.x-det-tag');
        if (tag) tl.to(tag, { duration: 0.5, scrambleText: { text: tag.textContent, chars: 'lowerCase', speed: 0.8 } }, 0.4);
      });
    }
    if (ocr) {
      tl.fromTo(ocr, { opacity: 1, clipPath: 'inset(-40px 100% -12px -12px)' }, { clipPath: 'inset(-40px -12px -12px -12px)', duration: 0.8, ease: 'expo.inOut' }, 0.2)
        .to(ocr, { opacity: 0, duration: 0.6, clearProps: 'clipPath' }, 2.2);
    }
    /* any interaction skips to the end state */
    var skip = function () { if (tl.progress() < 1) tl.progress(1); off(); };
    var evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    var off = function () { evs.forEach(function (ev) { window.removeEventListener(ev, skip); }); };
    evs.forEach(function (ev) { window.addEventListener(ev, skip, { passive: true }); });
    tl.eventCallback('onComplete', off);
  }

  /* ---------------------------------------------------------------- 5. "Now building —" rotation */
  function startRoles() {
    var el = document.getElementById('typed');
    if (!el || !X.motion || !window.ScrambleTextPlugin) return;
    var roles = ['Computer Vision.', 'Robotics & Hardware.'];
    var i = 0, inView = true;
    X.ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: function (s) { inView = s.isActive; } });
    setInterval(function () {
      if (!inView || document.hidden) return;
      i = (i + 1) % roles.length;
      gsap.to(el, { duration: 0.9, ease: 'none', scrambleText: { text: roles[i], chars: 'upperCase', speed: 0.6, revealDelay: 0.2 } });
    }, 3800);
  }

  /* ---------------------------------------------------------------- 6. scroll-out */
  function scrollOut() {
    if (!X.motion) return;
    var tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    /* move the whole stage (portrait + all 3 name layers) together so the knockout mask stays aligned */
    tl.to('.x-hero-stage', { yPercent: 8, ease: 'none' }, 0)
      .to('.x-hn-l1', { xPercent: -10, ease: 'none' }, 0)
      .to('.x-hn-l2', { xPercent: 10, ease: 'none' }, 0)
      .to('.x-hero-top', { yPercent: -30, opacity: 0, ease: 'none' }, 0)
      .to('.x-hero-meta', { opacity: 0, ease: 'none' }, 0);
    if (gl) tl.to(gl, { fade: 0.25, ease: 'none' }, 0);
  }

  /* ---------------------------------------------------------------- boot */
  var imgReady = img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  Promise.race([imgReady, new Promise(function (r) { setTimeout(r, 900); })]).then(function () {
    buildEdges();
    runIntro();
    wireLens();
    X.intro.then(function () { startRoles(); if (!stacked()) scrollOut(); });
  });
  document.addEventListener('x:theme', buildEdges);
})();
