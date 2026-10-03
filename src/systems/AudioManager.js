/* AudioManager — music, ambience, SFX with fades and volumes.
 * Real files: assets/audio/{music,ambience,sfx}/<id>.(ogg|mp3).
 * When a file is missing a quiet procedural WebAudio fallback is used
 * (can be disabled in Options). Never throws. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const DEFAULTS = { master: 0.8, music: 0.6, ambience: 0.6, sfx: 0.8, muted: false, synth: true };

  const MOODS = {
    title: [[220, 277.18, 329.63], [196, 246.94, 293.66]],
    firenze: [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]],
    tension: [[146.83, 174.61, 207.65], [138.59, 164.81, 207.65]],
    paris: [[261.63, 329.63, 392], [220, 277.18, 329.63], [246.94, 311.13, 369.99]],
    roma: [[196, 246.94, 293.66], [164.81, 207.65, 246.94]],
    istanbul: [[146.83, 185, 220], [155.56, 196, 233.08]],
    tender: [[261.63, 329.63, 392], [293.66, 369.99, 440], [246.94, 329.63, 392]],
    finale: [[130.81, 196, 261.63], [146.83, 220, 293.66], [164.81, 246.94, 329.63]],
    mystery: [[174.61, 207.65, 261.63], [164.81, 196, 246.94]]
  };

  const Audio = {
    s: Object.assign({}, DEFAULTS),
    ctx: null,
    buses: {},
    current: { music: null, ambience: null },
    els: { music: null, ambience: null },
    synth: { music: null, ambience: null },

    init() {
      try {
        const saved = JSON.parse(localStorage.getItem('orfeo.audio') || 'null');
        if (saved) Object.assign(this.s, saved);
      } catch (e) {}
      const unlock = () => {
        this.ensureCtx();
        if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend().catch(() => {});
        else this.ctx.resume().catch(() => {});
      });
    },

    save() {
      try {
        localStorage.setItem('orfeo.audio', JSON.stringify(this.s));
      } catch (e) {}
      this.applyVolumes();
    },

    vol(bus) {
      if (this.s.muted) return 0;
      return this.s.master * (this.s[bus] != null ? this.s[bus] : 1);
    },

    ensureCtx() {
      if (this.ctx || O.testMode) return this.ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
        ['music', 'ambience', 'sfx'].forEach((b) => {
          const g = this.ctx.createGain();
          g.gain.value = this.vol(b);
          g.connect(this.ctx.destination);
          this.buses[b] = g;
        });
        // resume anything requested before unlock
        const m = this.current.music, a = this.current.ambience;
        this.current.music = this.current.ambience = null;
        if (m) this.music(m);
        if (a) this.ambience(a);
      } catch (e) {
        this.ctx = null;
      }
      return this.ctx;
    },

    applyVolumes() {
      ['music', 'ambience'].forEach((b) => {
        if (this.els[b]) this.els[b].volume = this.vol(b);
      });
      if (this.ctx) ['music', 'ambience', 'sfx'].forEach((b) => this.buses[b] && this.buses[b].gain.setTargetAtTime(this.vol(b), this.ctx.currentTime, 0.1));
    },

    file(kind, id) {
      return O.Assets.first(`assets/audio/${kind}/${id}.ogg`, `assets/audio/${kind}/${id}.mp3`);
    },

    /* ---- looping channels (music / ambience) ---- */
    music(id) {
      this.channel('music', id);
    },
    ambience(id) {
      this.channel('ambience', id);
    },
    channel(bus, id) {
      if (this.current[bus] === id) return;
      this.current[bus] = id || null;
      this.fadeOutChannel(bus);
      if (!id || O.testMode) return;
      const src = this.file(bus, id);
      if (src) {
        const el = new window.Audio(src);
        el.loop = true;
        el.volume = 0;
        el.play().catch(() => {});
        this.els[bus] = el;
        this.fadeEl(el, this.vol(bus), 1500);
      } else if (this.s.synth && this.ctx && this.ctx.state === 'running') {
        this.synth[bus] = bus === 'music' ? this.synthMusic(id) : this.synthAmbience(id);
      }
    },
    fadeOutChannel(bus) {
      const el = this.els[bus];
      if (el) {
        this.fadeEl(el, 0, 1200).then(() => el.pause());
        this.els[bus] = null;
      }
      const sy = this.synth[bus];
      if (sy) {
        sy.stop();
        this.synth[bus] = null;
      }
    },
    fadeEl(el, to, ms) {
      return new Promise((res) => {
        const from = el.volume;
        const t0 = performance.now();
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / ms);
          try {
            el.volume = O.clamp(from + (to - from) * k, 0, 1);
          } catch (e) {}
          if (k < 1) requestAnimationFrame(step);
          else res();
        };
        step();
      });
    },

    /* ---- one-shots ---- */
    sfx(id) {
      if (O.testMode || !id) return;
      const src = this.file('sfx', id);
      if (src) {
        const el = new window.Audio(src);
        el.volume = this.vol('sfx');
        el.play().catch(() => {});
        return;
      }
      if (this.s.synth && this.ctx && this.ctx.state === 'running') this.synthSfx(id);
    },

    /* ---- procedural fallbacks ---- */
    synthMusic(id) {
      const ctx = this.ctx;
      const chords = MOODS[id] || MOODS.mystery;
      const out = ctx.createGain();
      out.gain.value = 0;
      out.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 900;
      filt.connect(out);
      out.connect(this.buses.music);
      let oscs = [];
      let idx = 0;
      let stopped = false;
      const playChord = () => {
        if (stopped) return;
        const now = ctx.currentTime;
        oscs.forEach((o) => {
          o.g.gain.setTargetAtTime(0, now, 1.2);
          o.o.stop(now + 5);
        });
        oscs = chords[idx % chords.length].flatMap((f) =>
          [0, 4].map((det) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = det ? 'triangle' : 'sine';
            o.frequency.value = f;
            o.detune.value = det;
            g.gain.value = 0;
            g.gain.setTargetAtTime(0.25, now, 1.5);
            o.connect(g);
            g.connect(filt);
            o.start();
            return { o, g };
          })
        );
        idx++;
      };
      playChord();
      const timer = setInterval(playChord, 9000);
      return {
        stop() {
          stopped = true;
          clearInterval(timer);
          out.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
          oscs.forEach((o) => o.o.stop(ctx.currentTime + 3));
          setTimeout(() => out.disconnect(), 3500);
        }
      };
    },

    noiseBuffer() {
      if (this._noise) return this._noise;
      const ctx = this.ctx;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = w * 0.5 + last * 3;
      }
      return (this._noise = buf);
    },

    synthAmbience(id) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      src.loop = true;
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      const presets = {
        rain: ['highpass', 900, 0.08],
        city: ['lowpass', 380, 0.12],
        wind: ['bandpass', 500, 0.07],
        room: ['lowpass', 160, 0.08],
        water: ['bandpass', 650, 0.06],
        crowd: ['bandpass', 900, 0.05],
        underground: ['lowpass', 120, 0.12],
        station: ['lowpass', 500, 0.1]
      };
      const p = presets[id] || presets.room;
      f.type = p[0];
      f.frequency.value = p[1];
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(p[2], ctx.currentTime + 2);
      src.connect(f);
      f.connect(g);
      g.connect(this.buses.ambience);
      src.start();
      let lfo = null;
      if (id === 'wind' || id === 'water') {
        lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = 0.13;
        lg.gain.value = 250;
        lfo.connect(lg);
        lg.connect(f.frequency);
        lfo.start();
      }
      return {
        stop() {
          g.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
          src.stop(ctx.currentTime + 2.5);
          if (lfo) lfo.stop(ctx.currentTime + 2.5);
        }
      };
    },

    synthSfx(id) {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const tone = (freq, start, dur, type, vol) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, now + start);
        g.gain.linearRampToValueAtTime(vol || 0.15, now + start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        o.connect(g);
        g.connect(this.buses.sfx);
        o.start(now + start);
        o.stop(now + start + dur + 0.05);
      };
      const noise = (dur, freq, vol) => {
        const s = ctx.createBufferSource();
        s.buffer = this.noiseBuffer();
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol || 0.2, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        s.connect(f);
        f.connect(g);
        g.connect(this.buses.sfx);
        s.start(now);
        s.stop(now + dur);
      };
      switch (id) {
        case 'pickup': tone(660, 0, 0.15); tone(990, 0.08, 0.25); break;
        case 'success': tone(523, 0, 0.3); tone(659, 0.12, 0.3); tone(784, 0.24, 0.6); break;
        case 'fail': tone(220, 0, 0.25, 'triangle'); tone(196, 0.12, 0.35, 'triangle'); break;
        case 'click': tone(1200, 0, 0.04, 'square', 0.04); break;
        case 'page': noise(0.25, 3000, 0.15); break;
        case 'door': noise(0.5, 300, 0.3); tone(90, 0, 0.4, 'sine', 0.2); break;
        case 'clue': tone(784, 0, 0.2); tone(1046, 0.1, 0.4); break;
        case 'collect': tone(880, 0, 0.12); tone(1174, 0.08, 0.12); tone(1568, 0.16, 0.4); break;
        case 'mechanism': noise(0.4, 900, 0.2); tone(110, 0, 0.3, 'square', 0.05); break;
        case 'drawer': noise(0.3, 600, 0.2); break;
        case 'heart': tone(392, 0, 0.5, 'sine', 0.08); tone(523, 0.15, 0.6, 'sine', 0.06); break;
        case 'phone': tone(1400, 0, 0.1, 'square', 0.05); tone(1400, 0.2, 0.1, 'square', 0.05); break;
        case 'switch': tone(440, 0, 0.08); tone(554, 0.06, 0.12); break;
        case 'tape': noise(0.6, 1800, 0.1); break;
        default: tone(800, 0, 0.06, 'sine', 0.06);
      }
    }
  };

  O.Audio = Audio;
})();
