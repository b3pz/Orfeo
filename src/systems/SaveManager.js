/* SaveManager — autosave + manual slots in localStorage, with versioned
 * migrations and a small thumbnail rasterised from the current background. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const PREFIX = 'orfeo.save.';
  const SLOTS = ['auto', '1', '2', '3', '4', '5', '6'];

  /** Migrations: key = version being upgraded FROM. */
  const MIGRATIONS = {
    // v1: prototype-era layout (inventory as objects, flags only)
    1(s) {
      s.inventory = (s.inventory || []).map((it) => (typeof it === 'string' ? it : it.id)).map((id) => ({ photo: 'foto1944', note: 'scheda_o17' }[id] || id));
      s.stats = s.stats || { fiducia: 0, legame: 0, conoscenza: 0 };
      s.version = 2;
      return s;
    },
    // v2: single scene field → per-character positions
    2(s) {
      if (!s.chars) {
        s.chars = {
          beps: { scene: s.scene || 'c1_studio', x: 900, y: 900, dir: 1, present: true },
          kiki: { scene: s.flags && s.flags.met_kiki ? s.scene : null, x: 1000, y: 900, dir: -1, present: !!(s.flags && s.flags.met_kiki) }
        };
      }
      delete s.scene;
      s.active = s.active || 'beps';
      s.version = 3;
      return s;
    }
  };

  const Save = {
    SLOTS,
    storageOk: true,

    init() {
      try {
        const k = '__orfeo_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
      } catch (e) {
        this.storageOk = false;
        console.warn('[Orfeo] localStorage non disponibile: i salvataggi resteranno in memoria.');
        this.mem = {};
      }
      this.loadProfile();
    },

    _get(key) {
      if (!this.storageOk) return this.mem[key] || null;
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    _set(key, val) {
      if (!this.storageOk) {
        this.mem[key] = val;
        return true;
      }
      try {
        localStorage.setItem(key, val);
        return true;
      } catch (e) {
        console.warn('[Orfeo] salvataggio fallito (spazio pieno?)', e);
        return false;
      }
    },
    _del(key) {
      if (!this.storageOk) delete this.mem[key];
      else
        try {
          localStorage.removeItem(key);
        } catch (e) {}
    },

    migrate(state) {
      let s = state;
      let guard = 0;
      while ((s.version || 1) < O.State.SAVE_VERSION && guard++ < 20) {
        const fn = MIGRATIONS[s.version || 1];
        if (!fn) break;
        s = fn(s);
      }
      return s;
    },

    list() {
      return SLOTS.map((slot) => {
        const raw = this._get(PREFIX + slot);
        if (!raw) return { slot, empty: true };
        try {
          const data = JSON.parse(raw);
          return Object.assign({ slot }, data.meta || {});
        } catch (e) {
          return { slot, corrupt: true };
        }
      });
    },

    latest() {
      return this.list()
        .filter((s) => !s.empty && !s.corrupt)
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0] || null;
    },

    async save(slot, opts) {
      if (!O.State.d || !O.Scene.current) return false;
      const st = O.State.snapshot();
      const scene = O.Scene.current;
      const ch = (O.Data.chapters.chapters || []).find((c) => c.id === st.chapter) || {};
      const meta = {
        version: st.version,
        ts: Date.now(),
        chapter: st.chapter,
        chapterTitle: ch.title || '',
        scene: scene.id,
        sceneName: scene.name,
        place: scene.place || ch.location || '',
        playtime: st.playtime,
        active: st.active,
        thumb: opts && opts.noThumb ? null : await this.thumbnail().catch(() => null)
      };
      const ok = this._set(PREFIX + slot, JSON.stringify({ meta, state: st }));
      if (ok && slot !== 'auto') O.emit('toast', { text: 'Partita salvata', kind: 'save' });
      O.emit('save:written', slot);
      return ok;
    },

    autosave() {
      if ((O.Cutscene && O.Cutscene.playing) || O.State.d.ending || O.inTitle) return;
      return this.save('auto', { noThumb: O.testMode });
    },

    read(slot) {
      const raw = this._get(PREFIX + slot);
      if (!raw) return null;
      try {
        const data = JSON.parse(raw);
        data.state = this.migrate(data.state);
        return data;
      } catch (e) {
        console.warn('[Orfeo] salvataggio corrotto', slot, e);
        return null;
      }
    },

    remove(slot) {
      this._del(PREFIX + slot);
      O.emit('save:deleted', slot);
    },

    wipeAll() {
      SLOTS.forEach((s) => this._del(PREFIX + s));
      this._del('orfeo.profile');
      this.loadProfile();
    },

    /* --- persistent profile (endings, archive) --- */
    loadProfile() {
      let p = null;
      try {
        p = JSON.parse(this._get('orfeo.profile') || 'null');
      } catch (e) {}
      O.State.profile = Object.assign({ endings: {}, collectibles: {}, settings: {} }, p || {});
    },
    saveProfile() {
      this._set('orfeo.profile', JSON.stringify(O.State.profile));
    },

    /* --- thumbnail: rasterise current background (image or SVG) --- */
    thumbnail() {
      return new Promise((resolve) => {
        const scene = O.Scene.current;
        if (!scene) return resolve(null);
        const canvas = document.createElement('canvas');
        canvas.width = 192;
        canvas.height = 108;
        const ctx = canvas.getContext('2d');
        const done = (img) => {
          try {
            if (img) ctx.drawImage(img, 0, 0, 192, 108);
            else {
              ctx.fillStyle = '#2a2018';
              ctx.fillRect(0, 0, 192, 108);
            }
            // tiny markers for the protagonists
            ['beps', 'kiki'].forEach((id) => {
              const c = O.State.d.chars[id];
              if (!c.present || c.scene !== scene.id) return;
              ctx.fillStyle = id === 'beps' ? '#2f3b4a' : '#7a2a2a';
              ctx.fillRect((c.x / O.W) * 192 - 3, (c.y / O.H) * 108 - 20, 6, 20);
            });
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          } catch (e) {
            resolve(null);
          }
        };
        const bgPath = O.Scene.bgPath(scene);
        if (bgPath) {
          O.Assets.image(bgPath).then(done);
        } else {
          const img = new Image();
          img.onload = () => done(img);
          img.onerror = () => done(null);
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(O.Art.background(scene));
        }
      });
    }
  };

  O.Save = Save;
})();
