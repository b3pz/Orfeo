/* CutsceneManager — "illustrazione animata": still images (or procedural
 * art) with pan/zoom, parallax particles, fades, letterbox and captions.
 * Real images: assets/cutscenes/<cutscene>_<n>.(jpg|png|webp). */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Cutscene = {
    playing: false,
    skipAll: false,

    def(id) {
      return (O.Data.cutscenes.cutscenes || {})[id];
    },

    imageFor(id, i, shot) {
      const real = O.Assets.first(shot.img, `assets/cutscenes/${id}_${i + 1}.webp`, `assets/cutscenes/${id}_${i + 1}.jpg`, `assets/cutscenes/${id}_${i + 1}.png`);
      if (real) return `<img src="${real}" alt="">`;
      if (shot.photo) return O.Art.photo(shot.photo, shot.photoOpts || {});
      if (shot.scene) {
        const sc = O.Data.scenes.scenes[shot.scene];
        if (sc) {
          const bgReal = O.Scene.bgPath(sc);
          if (bgReal) return `<img src="${bgReal}" alt="">`;
          let svg = O.Art.background(sc);
          // add the scene's props so the illustration is readable
          const props = (sc.hotspots || []).filter((h) => h.art && !h.col && O.cond(h.if)).map((h) => {
            const a = typeof h.art === 'string' ? { k: h.art } : h.art;
            return `<g transform="translate(${h.rect[0]} ${h.rect[1]})">${O.Art.drawProp(a.k, h.rect[2], h.rect[3], a)}</g>`;
          }).join('');
          svg = svg.replace(/<\/svg>$/, props + (shot.figures ? this.figures(shot.figures) : '') + '</svg>');
          return svg;
        }
      }
      return `<div class="cs-color" style="background:${shot.color || '#0a0806'}"></div>`;
    },

    figures(list) {
      return list.map((f) => {
        const c = O.Characters.def(f.id).look || {};
        const svg = O.Art.character(f.id, c).replace('<svg ', `<svg x="${f.x - 100 * (f.s || 1)}" y="${f.y - 420 * (f.s || 1)}" width="${200 * (f.s || 1)}" height="${420 * (f.s || 1)}" `);
        return f.flip ? `<g transform="translate(${2 * f.x} 0) scale(-1 1)">${svg}</g>` : svg;
      }).join('');
    },

    async play(id) {
      const def = this.def(id);
      if (!def) {
        console.warn('[Orfeo] cutscene mancante', id);
        return;
      }
      if (O.testMode) {
        if (def.onEnd) await O.Script.run(def.onEnd);
        return;
      }
      this.playing = true;
      this.skipAll = false;
      O.Movement.stopAll();
      const root = O.$('#cutscene');
      root.innerHTML = '';
      root.className = 'on' + (def.letterbox !== false ? ' letterbox' : '');
      const skip = O.el('button.cs-skip', { text: 'Salta ▸▸' });
      skip.onclick = (e) => {
        e.stopPropagation();
        this.skipAll = true;
        if (this._next) this._next();
      };
      root.appendChild(skip);
      if (def.music) O.Audio.music(def.music);
      if (def.ambience) O.Audio.ambience(def.ambience);
      try {
        for (let i = 0; i < def.shots.length && !this.skipAll; i++) {
          await this.shot(root, id, i, def.shots[i]);
        }
      } finally {
        root.classList.add('out');
        await O.sleep(500);
        root.className = '';
        root.innerHTML = '';
        this.playing = false;
        if (O.Scene.current) {
          O.Audio.music(O.Scene.current.music);
          O.Audio.ambience(O.Scene.current.ambience);
        }
      }
      if (def.onEnd) await O.Script.run(def.onEnd);
    },

    shot(root, id, i, s) {
      return new Promise((resolve) => {
        if (s.if && !O.cond(s.if)) return resolve();
        const layer = O.el('div.cs-shot');
        const img = O.el('div.cs-img', { html: this.imageFor(id, i, s) });
        layer.appendChild(img);
        if (s.fx) s.fx.forEach((k) => layer.appendChild(this.fx(k)));
        if (s.title) layer.appendChild(O.el('div.cs-title', { html: `<h2>${s.title}</h2>${s.sub ? `<p>${s.sub}</p>` : ''}` }));
        let cap = null;
        if (s.text) {
          cap = O.el('div.cs-caption', { html: (s.speaker ? `<b>${O.Characters.displayName(s.speaker)}</b>` : '') + `<span></span>` });
          layer.appendChild(cap);
        }
        root.appendChild(layer);
        const from = s.cam && s.cam.from ? s.cam.from : [50, 50, 1.08];
        const to = s.cam && s.cam.to ? s.cam.to : [50, 50, 1.0];
        const dur = s.dur || (s.text ? Math.max(3500, s.text.length * 45) : 3000);
        const tf = (c) => `translate(${50 - c[0]}%, ${50 - c[1]}%) scale(${c[2]})`;
        img.style.transform = tf(from);
        img.style.transformOrigin = `${from[0]}% ${from[1]}%`;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            layer.classList.add('in');
            img.style.transition = `transform ${dur + 1200}ms cubic-bezier(.3,.1,.3,1)`;
            img.style.transform = tf(to);
          })
        );
        if (cap) O.UI.typewrite(O.$('span', cap), O.Script.format(s.text));
        let done = false;
        const next = () => {
          if (done) return;
          if (cap && O.UI.typing) return O.UI.finishTyping();
          done = true;
          this._next = null;
          root.removeEventListener('click', next);
          layer.classList.add('leave');
          setTimeout(() => layer.remove(), 900);
          resolve();
        };
        this._next = next;
        root.addEventListener('click', next);
        if (!s.wait) setTimeout(next, dur + (s.text ? 900 : 0));
      });
    },

    fx(kind) {
      const el = O.el('div.fx.fx-' + kind);
      if (['rain', 'dust', 'snow', 'embers'].includes(kind)) {
        const r = O.Art.rng('cs' + kind);
        for (let i = 0; i < (kind === 'rain' ? 90 : 40); i++) {
          const p = O.el('i');
          p.style.left = r() * 100 + '%';
          if (kind !== 'rain') p.style.top = r() * 100 + '%';
          p.style.animationDelay = -r() * 8 + 's';
          p.style.animationDuration = (kind === 'rain' ? 0.6 + r() * 0.5 : 7 + r() * 9) + 's';
          el.appendChild(p);
        }
      }
      return el;
    }
  };

  O.Cutscene = Cutscene;
})();
