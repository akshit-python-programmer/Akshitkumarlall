/**
 * Portfolio video performance — lazy src, one decoder at a time, modal click-to-play.
 */
(function (global) {
  'use strict';

  const loaded = new WeakSet();
  let activeBento = null;

  function prefersReducedMotion() {
    return global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function ensureSrc(video) {
    if (!video || loaded.has(video)) return;
    const src = video.dataset.src || video.getAttribute('data-src');
    if (!src) return;
    video.src = src;
    video.load();
    loaded.add(video);
  }

  function unloadSrc(video) {
    if (!video || !loaded.has(video)) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    loaded.delete(video);
  }

  function pauseVideo(video) {
    if (!video) return;
    video.pause();
    try {
      video.currentTime = 0;
    } catch (_) {}
  }

  function playVideo(video) {
    if (!video || prefersReducedMotion()) return;
    ensureSrc(video);
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  }

  function pauseAllBento() {
    document.querySelectorAll('.bc video').forEach(pauseVideo);
    activeBento = null;
  }

  function pauseAllIn(root) {
    if (!root) return;
    root.querySelectorAll('video').forEach((v) => {
      v.pause();
    });
  }

  function pickBentoVideo(card) {
    const main = card.querySelector('.bc-multi .main-vid') || card.querySelector('video');
    return main;
  }

  function initBento() {
    document.querySelectorAll('.bc video').forEach((v) => {
      v.removeAttribute('src');
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const card = en.target;
          const vids = card.querySelectorAll('video');
          if (en.isIntersecting) {
            vids.forEach((v) => {
              if (v === pickBentoVideo(card)) ensureSrc(v);
            });
          } else if (activeBento !== card) {
            vids.forEach(unloadSrc);
          }
        });
      },
      { rootMargin: '120px 0px', threshold: 0.12 }
    );

    document.querySelectorAll('.bc').forEach((card) => {
      io.observe(card);

      card.addEventListener('mouseenter', () => {
        if (activeBento && activeBento !== card) {
          pauseAllIn(activeBento);
        }
        activeBento = card;
        const v = pickBentoVideo(card);
        card.querySelectorAll('video').forEach((vid) => {
          if (vid !== v) pauseVideo(vid);
        });
        playVideo(v);
      });

      card.addEventListener('mouseleave', () => {
        if (activeBento === card) activeBento = null;
        card.querySelectorAll('video').forEach(pauseVideo);
      });
    });
  }

  function wireGalleryVideo(wrap) {
    const video = wrap.querySelector('video');
    if (!video) return;
    const src = wrap.dataset.src;
    if (src) video.dataset.src = src;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pm-vid-play';
    btn.innerHTML = '<i class="fas fa-play"></i> PLAY';
      btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (global.SFX) global.SFX.play('play');
      pauseAllIn(wrap.closest('#pmMedia') || document);
      ensureSrc(video);
      video.muted = false;
      video.controls = true;
      video.loop = true;
      btn.style.display = 'none';
      playVideo(video);
    });
    wrap.appendChild(btn);
  }

  function initModalMain(video) {
    if (!video) return;
    const src = video.dataset.src;
    if (!src) return;

    const playBar = document.createElement('div');
    playBar.className = 'pm-main-playbar';
    playBar.innerHTML =
      '<button type="button" class="pm-main-play"><i class="fas fa-play"></i> PLAY DEMO</button><span class="pm-main-hint">Loads video on demand — smoother browsing</span>';

    const btn = playBar.querySelector('.pm-main-play');
    btn.addEventListener('click', () => {
      if (global.SFX) global.SFX.play('play');
      pauseAllBento();
      ensureSrc(video);
      video.muted = false;
      video.controls = true;
      video.loop = true;
      playBar.style.display = 'none';
      playVideo(video);
    });

    video.parentElement.insertBefore(playBar, video.nextSibling);
  }

  function initModalMedia(root) {
    if (!root) return;
    const main = root.querySelector('.pm-main-vid');
    if (main) initModalMain(main);
    root.querySelectorAll('.pm-gal-item[data-src], .pm-vid-wrap').forEach(wireGalleryVideo);
    root.querySelectorAll('.pm-gal-item video').forEach((v) => {
      const wrap = v.closest('.pm-gal-item');
      if (wrap && !wrap.querySelector('.pm-vid-play')) wireGalleryVideo(wrap);
    });
  }

  function onModalClose(mediaRoot) {
    pauseAllIn(mediaRoot);
    if (mediaRoot) {
      mediaRoot.querySelectorAll('video').forEach((v) => {
        unloadSrc(v);
      });
    }
  }

  global.VideoManager = {
    initBento,
    initModalMedia,
    onModalClose,
    pauseAllBento,
    ensureSrc,
    pauseAllIn,
  };
})(window);
