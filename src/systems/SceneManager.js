/* SceneManager — builds a scene: background (real image or procedural),
 * props, overlays (rain/dust/light/fog), actors, hotspots, audio; runs
 * enter scripts, handles transitions and the Beps/Kiki view switch. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Scene = {
    current: null,
    world: null,
    busy: false,

    init(world) {
      this.world = world;
      this.bgLayer = O.$('#bg-layer', world);
      this.propLayer = O.$('#prop-layer', world);
      this.actorLayer = O.$('#actor-layer', world);
      this.hotLayer = O.$('#hotspot-layer', world);
      this.fxLayer = O.$('#fx-layer', world);
      this.fader = O.$('#fader');
      O.Characters.init(this.actorLayer);
    },

    get(id) {
      return O.Data.scenes.scenes[id];
    },

    bgPath(scene) {
      const id = scene.id;
      return O.Assets.first(scene.bg, `assets/backgrounds/${id}.webp`, `assets/backgrounds/${id}.jpg`, `assets/backgrounds/${id}.png`);
    },

    async fade(to, ms) {
      if (O.testMode) return;
      const f = this.fader;
      f.style.transitionDuration = (ms || 350) + 'ms';
      f.classList.toggle('on', to);
      await O.sleep(ms || 350);
    },

    /**
     * Move the ACTIVE character (and partner if together) into scene `id`.
     * opts: {from, at:[x,y], dir, noFade, keepPartner}
     */
    async go(id, opts) {
      if (this.busy) return false;
      opts = opts || {};
      const scene = this.get(id);
      if (!scene) {
        console.error('[Orfeo] scena inesistente', id);
        O.emit('toast', { text: 'Scena mancante: ' + id, kind: 'error' });
        return;
      }
      this.busy = true;
      try {
        const st = O.State.d;
        const prev = this.current ? this.current.id : null;
        O.Movement.stopAll();
        if (!opts.noFade) await this.fade(true, 300);
        const me = st.chars[st.active];
        const spawn = opts.at || (scene.spawn && (scene.spawn['from_' + (opts.from || prev)] || scene.spawn.default)) || [960, 900];
        me.scene = id;
        const safeSpawn = O.Movement.point(scene, st.active, spawn) || spawn;
        me.x = safeSpawn[0];
        me.y = safeSpawn[1];
        if (spawn[2]) me.dir = spawn[2] === 'l' ? -1 : 1;
        if (opts.dir) me.dir = opts.dir === 'l' ? -1 : 1;
        const p = st.chars[O.State.partnerId()];
        if (st.together && p.present && !opts.keepPartner) {
          p.scene = id;
          const off = scene.partnerOffset || [-150, -20];
          const pt = O.Movement.point(scene, O.State.partnerId(), [me.x + off[0] * (me.dir < 0 ? -1 : 1), me.y + off[1]]) || [me.x, me.y];
          p.x = pt[0];
          p.y = pt[1];
          p.dir = me.dir;
        }
        await this.build(scene);
        if (!opts.noFade) await this.fade(false, 350);
        // Enter scripts can legitimately travel again (e.g. the rooftop
        // dialogue ends by moving to Paris). Script/interaction locks protect
        // input here; the transition lock only covers fade and scene rebuild.
        this.busy = false;
        await this.enter(scene);
        return true;
      } finally {
        this.busy = false;
      }
    },

    /** Re-render current view (after load or switch). */
    async show(id) {
      if (this.busy) return false;
      const scene = this.get(id);
      if (!scene) return;
      this.busy = true;
      O.Movement.stopAll();
      try {
        await this.fade(true, 200);
        await this.build(scene);
        await this.fade(false, 250);
        return true;
      } finally {
        this.busy = false;
      }
    },

    async build(scene) {
      O.Movement.stopAll();
      this.current = scene;
      const sc = scene;
      const st = O.State.d;
      st.visited[sc.id] = true;
      // New art can move floors; also repair positions from existing saves/scripts.
      for (const who of ['beps', 'kiki']) {
        const ch = st.chars[who];
        if (ch && ch.present && ch.scene === sc.id) {
          const point = O.Movement.point(sc, who, [ch.x, ch.y]);
          if (point) { ch.x = point[0]; ch.y = point[1]; }
        }
      }
      // background
      const bg = this.bgPath(sc);
      this.bgLayer.innerHTML = '';
      this.hasRealBg = false;
      if (bg) {
        const img = await O.Assets.image(bg);
        if (img) {
          const el = O.el('img.bg-img', { src: bg, alt: '' });
          if (sc.bgFit) el.style.objectFit = sc.bgFit;
          // the same picture can serve another time of day (bgFilter / bgTint)
          if (sc.bgFilter) el.style.filter = sc.bgFilter;
          this.bgLayer.appendChild(el);
          if (sc.bgTint) this.bgLayer.appendChild(O.el('div.bg-tint', { style: { background: sc.bgTint } }));
          this.hasRealBg = true;
        }
      }
      if (!this.hasRealBg) this.bgLayer.innerHTML = O.Art.background(sc);
      this.world.classList.toggle('real-bg', this.hasRealBg);
      // Preload story variants so removing a cover never exposes an unloaded image.
      await Promise.all((sc.bgStates || []).map(state => O.Assets.image(state.img)));
      this.renderBackgroundState();
      // parallax foreground
      this.renderProps();
      this.renderFx();
      O.Characters.render();
      O.Hotspots.render();
      // audio
      if (sc.music !== undefined) O.Audio.music(sc.music);
      if (sc.ambience !== undefined) O.Audio.ambience(sc.ambience);
      O.emit('scene:built', sc);
    },

    renderBackgroundState() {
      this.bgLayer.querySelectorAll('.bg-state').forEach(el => el.remove());
      if (!this.hasRealBg) return;
      (this.current.bgStates || []).forEach(state => {
        if (!O.cond(state.if) || !O.Assets.first(state.img)) return;
        const img = O.el('img.bg-img.bg-state', { src: state.img, alt: '' });
        Object.assign(img.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
        if (state.rect) {
          const [x, y, w, h] = state.rect;
          img.style.clipPath = `inset(${y / 1080 * 100}% ${(1920 - x - w) / 1920 * 100}% ${(1080 - y - h) / 1080 * 100}% ${x / 1920 * 100}%)`;
        }
        this.bgLayer.appendChild(img);
      });
    },

    renderProps() {
      const sc = this.current;
      let html = '';
      (sc.hotspots || []).forEach((h) => {
        if (!O.cond(h.if) || (h.col && O.State.d.collectibles[h.col]) || !h.art) return;
        if (h.spriteChar && O.Characters.spriteFor(h.spriteChar, 'idle')) return;
        const art = typeof h.art === 'string' ? { k: h.art } : h.art;
        const img = O.Assets.first(h.propImg, `assets/items/scene/${sc.id}_${h.id}.png`);
        if (img) {
          html += `<img class="prop" src="${img}" style="left:${h.rect[0]}px;top:${h.rect[1]}px;width:${h.rect[2]}px;height:${h.rect[3]}px;object-fit:${h.propFit || 'fill'}" alt="">`;
        } else if (!this.hasRealBg || art.overlay) {
          html += O.Art.hotspotProp(Object.assign({}, h, { art }));
        }
      });
      // Code-native overlays supply geometry that changes during story puzzles.
      (sc.bridges || []).forEach((bridge) => {
        if (!O.cond(bridge.if)) return;
        const [x, y, w, h] = bridge.rect;
        const boards = Array.from({ length: 12 }, (_, i) => `<rect x="${i * w / 12}" y="0" width="${w / 12 - 2}" height="${h}" fill="#685540" stroke="#342b22"/>`).join('');
        html += `<svg class="prop" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" viewBox="0 0 ${w} ${h}">${boards}</svg>`;
      });
      (sc.foreground || []).forEach((f) => {
        if (!O.cond(f.if) || this.hasRealBg) return;
        html += `<svg class="prop fg" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;z-index:2000" viewBox="0 0 ${f.w} ${f.h}" overflow="visible">${O.Art.drawProp(f.k, f.w, f.h, f)}</svg>`;
      });
      this.propLayer.innerHTML = html;
    },

    renderFx() {
      const sc = this.current;
      this.fxLayer.innerHTML = '';
      (sc.fx || []).forEach((fx) => {
        const kind = typeof fx === 'string' ? fx : fx.k;
        if (fx.if && !O.cond(fx.if)) return;
        const el = O.el('div.fx.fx-' + kind);
        if (fx.rect) {
          const [x, y, w, h] = fx.rect;
          Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', right: 'auto', bottom: 'auto', overflow: 'hidden' });
          el.style.setProperty('--weather-height', h + 'px');
          if (fx.clip) el.style.clipPath = fx.clip;
        }
        if (fx.window) el.classList.add('fx-window');
        if (kind === 'light' && fx.x != null) Object.assign(el.style, { left: fx.x + 'px', top: fx.y + 'px', width: (fx.w || 500) + 'px', height: (fx.h || 900) + 'px' });
        if (kind === 'dust' || kind === 'rain' || kind === 'snow' || kind === 'embers') {
          const n = kind === 'rain' ? 90 : 36;
          const r = O.Art.rng(sc.id + kind);
          for (let i = 0; i < n; i++) {
            const p = O.el('i');
            p.style.left = r() * 100 + '%';
            p.style.animationDelay = -r() * 8 + 's';
            p.style.animationDuration = (kind === 'rain' ? (fx.window ? 1 + r() * 0.8 : 0.6 + r() * 0.5) : 7 + r() * 9) + 's';
            if (kind !== 'rain') p.style.top = r() * 100 + '%';
            el.appendChild(p);
          }
        }
        this.fxLayer.appendChild(el);
      });
    },

    /** refresh dynamic parts (after a flag change) without full rebuild */
    refresh() {
      if (!this.current) return;
      this.renderBackgroundState();
      this.renderProps();
      this.renderFx();
      O.Characters.render();
      O.Hotspots.render();
    },

    async enter(scene) {
      const st = O.State.d;
      const sc = this.current;
      const key = 'entered_' + sc.id;
      O.UI.setLocation(sc);
      if (sc.firstEnter && !st.flags[key]) {
        st.flags[key] = true;
        await O.Script.run(sc.firstEnter);
      } else st.flags[key] = true;
      if (sc.enter) await O.Script.run(sc.enter);
      O.Save.autosave();
      O.emit('scene:entered', sc);
    },

    /* ---------- protagonist switch ---------- */
    canSwitch() {
      const st = O.State.d;
      const p = st.chars[O.State.partnerId()];
      if (st.switchLocked) return { ok: false, why: 'locked' };
      if (!p.present) return { ok: false, why: 'absent' };
      if (this.busy || O.Hotspots.acting || O.Script.running || O.Dialogue.open || O.Puzzles.open || O.Cutscene.playing) return { ok: false, why: 'busy' };
      if (this.current && this.current.switch === false && p.scene === this.current.id) return { ok: false, why: 'scene' };
      return { ok: true };
    },

    async switchTo(id) {
      const st = O.State.d;
      if (id === st.active) return;
      const chk = this.canSwitch();
      if (!chk.ok) {
        const msg = {
          locked: 'Per ora puoi controllare solo ' + O.Characters.displayName(st.active) + '.',
          absent: O.Characters.displayName(O.State.partnerId()) + ' non è qui.',
          busy: 'Non adesso.',
          scene: (this.current && this.current.switchMsg) || 'Qui conviene restare con chi sei.'
        }[chk.why];
        O.emit('toast', { text: msg });
        return false;
      }
      O.Movement.stopAll();
      const fromScene = st.chars[st.active].scene;
      st.active = id;
      O.Audio.sfx('switch');
      const to = st.chars[id].scene;
      if (to !== fromScene) await this.show(to);
      else O.Hotspots.render();
      O.emit('switch', id);
      return true;
    }
  };

  O.Scene = Scene;
})();
