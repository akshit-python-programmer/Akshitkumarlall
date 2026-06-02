/**
 * Lightweight UI sound effects (Web Audio API — no audio files).
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'akl-sfx';

  class SfxEngine {
    constructor() {
      this.ctx = null;
      this._lastHover = 0;
      this.enabled =
        !global.matchMedia('(prefers-reduced-motion: reduce)').matches &&
        localStorage.getItem(STORAGE_KEY) !== 'off';
    }

    unlock() {
      if (!this.enabled) return;
      try {
        if (!this.ctx) {
          this.ctx = new (global.AudioContext || global.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
          return this.ctx.resume();
        }
      } catch (_) {
        this.enabled = false;
      }
    }

    _tone(opts) {
      if (!this.enabled || !this.ctx) return;
      const {
        freq = 440,
        type = 'sine',
        gain = 0.06,
        attack = 0.004,
        decay = 0.07,
        detune = 0,
        when = 0,
      } = opts;
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (detune) osc.detune.setValueAtTime(detune, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + attack + decay + 0.05);
    }

    play(name) {
      if (!this.enabled) return;
      this.unlock();

      switch (name) {
        case 'click':
          this._tone({ freq: 880, type: 'triangle', gain: 0.055, decay: 0.05 });
          break;
        case 'hover':
          if (Date.now() - this._lastHover < 100) return;
          this._lastHover = Date.now();
          this._tone({ freq: 1100, type: 'sine', gain: 0.022, decay: 0.03 });
          break;
        case 'open':
          this._tone({ freq: 392, gain: 0.05, decay: 0.09 });
          this._tone({ freq: 587, gain: 0.045, decay: 0.11, when: 0.055 });
          break;
        case 'close':
          this._tone({ freq: 523, gain: 0.045, decay: 0.08 });
          this._tone({ freq: 311, gain: 0.04, decay: 0.12, when: 0.06 });
          break;
        case 'switch':
          this._tone({ freq: 740, type: 'square', gain: 0.035, decay: 0.04 });
          break;
        case 'play':
          this._tone({ freq: 494, gain: 0.05, decay: 0.07 });
          this._tone({ freq: 740, gain: 0.042, decay: 0.1, when: 0.07 });
          break;
        case 'scan':
          this._tone({ freq: 1560, type: 'sine', gain: 0.018, decay: 0.025 });
          break;
        case 'success':
          this._tone({ freq: 523, gain: 0.04, decay: 0.08 });
          this._tone({ freq: 659, gain: 0.04, decay: 0.08, when: 0.08 });
          this._tone({ freq: 784, gain: 0.038, decay: 0.12, when: 0.16 });
          break;
        default:
          this._tone({ freq: 660, gain: 0.04, decay: 0.06 });
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem(STORAGE_KEY, this.enabled ? 'on' : 'off');
      this.updateToggleUI();
      if (this.enabled) {
        this.unlock();
        this.play('click');
      }
      return this.enabled;
    }

    isEnabled() {
      return this.enabled;
    }

    updateToggleUI() {
      document.querySelectorAll('[data-sfx-toggle]').forEach((btn) => {
        const on = this.enabled;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.title = on ? 'Mute sound effects' : 'Enable sound effects';
        const ic = btn.querySelector('i');
        if (ic) {
          ic.className = on ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
        }
      });
    }

    wireToggleButtons() {
      document.querySelectorAll('[data-sfx-toggle]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        });
      });
      this.updateToggleUI();
    }

    wireHover(selectors) {
      const sel = selectors || '.bc, .lab-card, .sk-card, .ngen-mod, .pipe-step, .stack-btn, .tab-btn, .mod-card, .lab-nav-links a';
      document.querySelectorAll(sel).forEach((el) => {
        el.addEventListener(
          'mouseenter',
          () => {
            this.play('hover');
          },
          { passive: true }
        );
      });
    }

    wireClicks(selectors) {
      const sel =
        selectors ||
        '.btn, .bc-expand, .pfb, .f-sub, .pm-main-play, .pm-vid-play, .nav-toggle, .mob-close, .lab-nav-links a:not([data-sfx-toggle])';
      document.querySelectorAll(sel).forEach((el) => {
        el.addEventListener(
          'click',
          () => {
            this.play('click');
          },
          { passive: true }
        );
      });
    }

    init() {
      const onceUnlock = () => {
        this.unlock();
      };
      document.addEventListener('pointerdown', onceUnlock, { once: true, passive: true });
      document.addEventListener('keydown', onceUnlock, { once: true });

      this.wireToggleButtons();
      this.wireHover();
      this.wireClicks();
    }
  }

  global.SFX = new SfxEngine();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => global.SFX.init());
  } else {
    global.SFX.init();
  }
})(window);
