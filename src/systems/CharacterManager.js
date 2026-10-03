/* CharacterManager — actors on stage (protagonists + NPCs).
 * Uses sprite strips from assets/sprites/<id>/<anim>.png when present
 * (frames laid out horizontally, see characters.json), else procedural SVG. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const ANIMS = ['idle', 'walk', 'run', 'talk', 'use', 'pickup', 'inspect', 'read', 'phone', 'reaction'];
  const BASE_H = 560; // display height (logical px) at scale 1.0

  const Characters = {
    layer: null,
    actors: {}, // id -> {el, inner, sprite, anim, frame, t}

    init(layer) {
      this.layer = layer;
      let last = performance.now();
      const tick = (now) => {
        const dt = (now - last) / 1000;
        last = now;
        for (const id in this.actors) this.tickSprite(this.actors[id], dt);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },

    def(id) {
      return (O.Data.characters.characters || {})[id] || {};
    },
    displayName(id) {
      const d = this.def(id);
      if (d.nameIf) {
        const alt = d.nameIf.find((n) => O.cond(n.if));
        if (alt) return alt.name;
      }
      return d.name || id;
    },

    spriteFor(id, anim) {
      const d = this.def(id);
      const sp = d.sprites || {};
      const order = [anim, anim === 'run' ? 'walk' : null, ['talk', 'use', 'pickup', 'inspect', 'read', 'phone', 'reaction'].includes(anim) ? 'idle' : null, 'idle'];
      for (const a of order) {
        if (!a || !sp[a]) continue;
        if (O.Assets.has(sp[a].src)) return Object.assign({ anim: a }, sp[a]);
      }
      return null;
    },

    /** Rebuild all actors for the current scene. */
    render() {
      this.layer.innerHTML = '';
      this.actors = {};
      const scene = O.Scene.current;
      if (!scene) return;
      const st = O.State.d;
      ['beps', 'kiki'].forEach((id) => {
        const c = st.chars[id];
        if (c.present && c.scene === scene.id) this.spawn(id, { protagonist: true });
      });
      (scene.npcs || []).forEach((n) => {
        if (!O.cond(n.if)) return;
        this.spawn(n.id, { npc: n });
      });
      this.updateAll();
    },

    spawn(id, opts) {
      const npc = opts.npc;
      const charId = npc ? npc.char || npc.id : id;
      const d = this.def(charId);
      const el = O.el('div.actor', { 'data-id': id, 'data-char': charId });
      if (opts.protagonist) el.classList.add('protagonist');
      if (npc) el.classList.add('npc');
      const inner = O.el('div.actor-inner');
      el.appendChild(inner);
      const label = O.el('div.actor-label', { text: npc ? npc.name || this.displayName(charId) : this.displayName(charId) });
      el.appendChild(label);
      this.layer.appendChild(el);
      const a = { id, charId, el, inner, anim: null, frame: 0, t: 0, sprite: null, npc, x: npc ? npc.x : 0, y: npc ? npc.y : 0, dir: npc ? (npc.dir === 'l' ? -1 : 1) : 1, height: d.height || 1 };
      this.actors[id] = a;
      this.setAnim(a, npc && npc.anim ? npc.anim : 'idle');
      O.emit('actor:spawn', a);
      return a;
    },

    setAnim(a, anim) {
      if (a.anim === anim && a.inner.firstChild) return;
      a.anim = anim;
      const sp = this.spriteFor(a.charId, anim);
      a.el.classList.remove(...ANIMS.map((x) => 'anim-' + x));
      a.el.classList.add('anim-' + anim);
      if (sp) {
        if (!a.sprite || a.sprite.src !== sp.src) {
          a.inner.innerHTML = '';
          const div = O.el('div.sprite', { style: { backgroundImage: `url("${sp.src}")`, backgroundSize: `${sp.frames * 100}% 100%`, aspectRatio: `${sp.w || 200} / ${sp.h || 420}` } });
          a.inner.appendChild(div);
          a.spriteEl = div;
        }
        const resized = !a.sprite || a.sprite.w !== sp.w || a.sprite.h !== sp.h;
        a.sprite = sp;
        a.frame = 0;
        a.t = 0;
        a.spriteEl.style.backgroundPosition = '0 0';
        if (resized && O.Scene.current) this.update(a.id);
      } else {
        if (a.sprite || !a.inner.firstChild) {
          a.inner.innerHTML = O.Art.character(a.charId, this.def(a.charId).look || {});
        }
        a.sprite = null;
      }
    },

    tickSprite(a, dt) {
      if (!a.sprite) return;
      const sp = a.sprite;
      a.t += dt;
      const fps = sp.fps || 8;
      const f = Math.floor(a.t * fps) % sp.frames;
      if (f !== a.frame) {
        a.frame = f;
        a.spriteEl.style.backgroundPosition = `${sp.frames > 1 ? (f / (sp.frames - 1)) * 100 : 0}% 0`;
      }
    },

    anim(id, anim, ms) {
      const a = this.actors[id];
      if (!a) return Promise.resolve();
      this.setAnim(a, anim);
      if (ms) {
        return O.sleep(ms).then(() => {
          if (a.anim === anim) this.setAnim(a, 'idle');
        });
      }
      return Promise.resolve();
    },

    update(id) {
      const a = this.actors[id];
      if (!a) return;
      const scene = O.Scene.current;
      let x, y, dir;
      if (a.npc) {
        x = a.x;
        y = a.y;
        dir = a.dir;
      } else {
        const c = O.State.d.chars[id];
        x = c.x;
        y = c.y;
        dir = c.dir;
      }
      const s = O.Movement.scaleAt(scene, y) * (a.height || 1) * ((a.npc && a.npc.scale) || 1);
      const h = BASE_H * s;
      a.el.style.height = h + 'px';
      a.el.style.width = h * (a.sprite ? (a.sprite.w || 200) / (a.sprite.h || 420) : 200 / 420) + 'px';
      a.el.style.left = x + 'px';
      a.el.style.top = y + 'px';
      a.el.style.zIndex = String(Math.round(y));
      a.inner.style.transform = dir < 0 ? 'scaleX(-1)' : '';
    },
    updateAll() {
      Object.keys(this.actors).forEach((id) => this.update(id));
    },

    /** Face one actor towards a point/actor. */
    face(id, x) {
      const c = O.State.d.chars[id];
      if (c) {
        c.dir = x < c.x ? -1 : 1;
        this.update(id);
      } else if (this.actors[id]) {
        this.actors[id].dir = x < this.actors[id].x ? -1 : 1;
        this.update(id);
      }
    },

    pos(id) {
      const a = this.actors[id];
      if (!a) return null;
      if (a.npc) return [a.x, a.y];
      const c = O.State.d.chars[id];
      return [c.x, c.y];
    },

    /** Screen-space anchor above an actor's head (for speech bubbles). */
    headAnchor(id) {
      const a = this.actors[id];
      if (!a) return null;
      const r = a.el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top };
    }
  };

  O.Characters = Characters;
})();
