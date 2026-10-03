/* HotspotManager — interactive targets (scene hotspots, NPCs, partner),
 * pointer/touch input, custom cursors, hover labels and the verb logic. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const DEFAULT_LINES = {
    use: {
      beps: ['Non saprei come usarlo.', 'Meglio di no.', 'Non credo serva a qualcosa, adesso.'],
      kiki: ['No. Non ha senso.', 'Passo.', 'Non vedo come possa aiutarci.']
    },
    item: {
      beps: ['Non credo che funzioni così.', 'Ingegnoso. E inutile.', 'No, non combacia.'],
      kiki: ['Beps… no.', 'Non mi sembra il caso.', 'Non c\'entra niente.']
    },
    talk: { beps: ['Non mi risponderà.'], kiki: ['Parlo già abbastanza con te.'] },
    only: {
      beps: ['Non ci arrivo. Forse Kiki sì.', 'Questo è un lavoro per Kiki.'],
      kiki: ['Questo è più un lavoro per Beps.', 'Non ci arrivo. Beps?']
    }
  };

  const Hotspots = {
    targets: {},
    hover: null,
    pressTimer: null,

    init() {
      const world = O.Scene.world;
      const stage = O.$('#stage');
      this.label = O.$('#hover-label');
      // world clicks
      world.addEventListener('click', (e) => this.onWorldClick(e));
      world.addEventListener('dblclick', (e) => this.onWorldClick(e, true));
      world.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const t = this.targetFromEvent(e);
        if (t) this.interact(t, 'look');
        else O.Inventory.deselect();
      });
      world.addEventListener('pointermove', (e) => this.onMove(e));
      world.addEventListener('pointerleave', () => this.setHover(null));
      // long press = look (touch)
      world.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch') return;
        const t = this.targetFromEvent(e);
        clearTimeout(this.pressTimer);
        this.longPressed = false;
        if (!t) return;
        this.pressTimer = setTimeout(() => {
          this.longPressed = true;
          if (navigator.vibrate) navigator.vibrate(15);
          this.interact(t, 'look');
        }, 480);
      });
      ['pointerup', 'pointercancel'].forEach((ev) => world.addEventListener(ev, () => clearTimeout(this.pressTimer)));
      stage.addEventListener('pointermove', (e) => {
        if (!world.contains(e.target)) this.setHover(null);
      });
    },

    blocked() {
      return O.Script.running || O.Dialogue.open || O.Puzzles.open || O.Cutscene.playing || O.UI.modalOpen() || O.Scene.busy;
    },

    /* ---------- rendering ---------- */
    render() {
      const layer = O.Scene.hotLayer;
      layer.innerHTML = '';
      this.targets = {};
      const sc = O.Scene.current;
      if (!sc) return;
      (sc.hotspots || []).forEach((h) => {
        if (!O.cond(h.if)) return;
        if (h.col && O.State.d.collectibles[h.col]) return;
        const t = Object.assign({ kind: 'hotspot' }, h);
        this.targets[h.id] = t;
        const [x, y, w, hh] = h.rect;
        const verb = this.primaryVerb(t);
        const b = O.el('button.hotspot', {
          'data-id': h.id,
          'data-verb': verb,
          'aria-label': this.name(t),
          style: { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' }
        });
        if (h.col) b.classList.add('collectible');
        if (verb === 'exit') {
          b.classList.add('exit');
          b.appendChild(O.el('span.exit-arrow', { 'data-dir': h.arrow || (x < 200 ? 'l' : x + w > 1720 ? 'r' : y + hh > 950 ? 'd' : 'u') }));
        }
        const nm = O.el('span.hs-name', { text: this.name(t) });
        if (x < 160) nm.classList.add('al-left');
        else if (x + w > 1760) nm.classList.add('al-right');
        b.appendChild(nm);
        layer.appendChild(b);
      });
      // NPCs
      (sc.npcs || []).forEach((n) => {
        if (!O.cond(n.if)) return;
        this.targets['npc:' + n.id] = Object.assign({ kind: 'npc', verb: n.talk ? 'talk' : 'look' }, n, { id: 'npc:' + n.id, npcId: n.id });
      });
      // partner
      const st = O.State.d;
      const pid = O.State.partnerId();
      const pc = st.chars[pid];
      if (pc.present && pc.scene === sc.id) {
        const pdef = O.Characters.def(pid);
        this.targets['partner'] = {
          kind: 'partner',
          id: 'partner',
          charId: pid,
          name: O.Characters.displayName(pid),
          verb: 'talk',
          talk: 'partner_' + pid,
          look: this.partnerLook(pdef),
          items: ((O.Data.dialogues.dialogues || {})['partner_' + pid] || {}).items || {}
        };
      }
      O.$$('.actor', O.Scene.actorLayer).forEach((el) => {
        const id = el.dataset.id;
        const tid = id === pid ? 'partner' : this.targets['npc:' + id] ? 'npc:' + id : null;
        el.classList.toggle('clickable', !!tid);
        if (tid) el.dataset.target = tid;
        else delete el.dataset.target;
      });
      O.emit('hotspots:rendered');
    },

    partnerLook(pdef) {
      const list = pdef.lookLines || [];
      const hit = list.find((l) => O.cond(l.if));
      return hit ? hit.text : pdef.desc || '';
    },

    name(t) {
      if (t.kind === 'npc') return t.name || O.Characters.displayName(t.char || t.npcId);
      if (t.kind === 'partner') return t.name;
      const n = t.nameIf && t.nameIf.find((x) => O.cond(x.if));
      return n ? n.name : t.name || t.id;
    },

    primaryVerb(t) {
      if (t.verb) return t.verb;
      if (t.exit) return 'exit';
      if (t.talk) return 'talk';
      if (t.use || t.take || t.col) return 'use';
      return 'look';
    },

    targetFromEvent(e) {
      const hs = e.target.closest('.hotspot');
      if (hs) return this.targets[hs.dataset.id] || null;
      const actor = e.target.closest('.actor.clickable');
      if (actor) return this.targets[actor.dataset.target] || null;
      return null;
    },

    /* ---------- hover / cursor ---------- */
    onMove(e) {
      if (e.pointerType === 'touch') return;
      const t = this.blocked() ? null : this.targetFromEvent(e);
      this.setHover(t, e);
    },

    setHover(t, e) {
      this.hover = t;
      const world = O.Scene.world;
      const sel = O.Inventory.selected;
      let cursor = 'neutral';
      if (sel) cursor = 'item';
      else if (t) cursor = this.primaryVerb(t);
      world.dataset.cursor = cursor;
      if (!t) {
        this.label.classList.remove('show');
        if (sel) {
          this.label.textContent = 'Usa ' + O.Inventory.name(sel) + ' con…';
          this.label.classList.add('show', 'pending');
        } else this.label.classList.remove('pending');
        return;
      }
      const verb = this.primaryVerb(t);
      const n = this.name(t);
      const txt = sel
        ? `Usa ${O.Inventory.name(sel)} con ${n}`
        : { look: 'Guarda ', use: 'Usa ', talk: 'Parla con ', exit: 'Vai: ', take: 'Prendi ' }[verb] + n;
      this.label.textContent = txt;
      this.label.classList.remove('pending');
      this.label.classList.add('show');
    },

    /* ---------- clicks ---------- */
    onWorldClick(e, dbl) {
      if (this.longPressed) {
        this.longPressed = false;
        return;
      }
      if (this.blocked()) return;
      O.UI.closeInventoryIfTouch();
      const t = this.targetFromEvent(e);
      if (t) {
        if (O.Inventory.selected) {
          const it = O.Inventory.selected;
          O.Inventory.deselect();
          this.interact(t, 'item', it);
        } else this.interact(t, this.primaryVerb(t), null, dbl);
        return;
      }
      if (O.Inventory.selected) {
        O.Inventory.deselect();
        return;
      }
      const p = O.UI.toWorld(e.clientX, e.clientY);
      O.Movement.moveActive(p, { run: dbl });
      O.UI.ping(p);
    },

    standPoint(t) {
      const sc = O.Scene.current;
      const who = O.State.d.active;
      const poly = O.Movement.polygon(sc, who);
      if (t.at) return O.Movement.clampInto(t.at, poly);
      if (t.kind === 'npc' || t.kind === 'partner') {
        const pos = O.Characters.pos(t.kind === 'npc' ? t.npcId : t.charId) || [960, 900];
        const me = O.State.character();
        const side = me.x < pos[0] ? -1 : 1;
        return O.Movement.clampInto([pos[0] + side * 160, pos[1] + 10], poly);
      }
      const r = t.rect;
      return O.Movement.clampInto([r[0] + r[2] / 2, Math.max(r[1] + r[3] + 30, 700)], poly);
    },

    faceTarget(t) {
      const who = O.State.d.active;
      if (t.face) {
        O.State.d.chars[who].dir = t.face === 'l' ? -1 : 1;
        O.Characters.update(who);
        return;
      }
      let x;
      if (t.kind === 'npc') x = (O.Characters.pos(t.npcId) || [960])[0];
      else if (t.kind === 'partner') x = (O.Characters.pos(t.charId) || [960])[0];
      else x = t.rect[0] + t.rect[2] / 2;
      O.Characters.face(who, x);
      if (t.kind === 'partner') O.Characters.face(t.charId, O.State.character().x);
      if (t.kind === 'npc' && O.Characters.actors[t.npcId] && !t.fixedDir) O.Characters.face(t.npcId, O.State.character().x);
    },

    /** Main verb dispatcher. */
    async interact(t, verb, item, run) {
      if (this.blocked()) return;
      const who = O.State.d.active;
      this.setHover(null);
      // character restriction
      if (t.only && t.only !== who && verb !== 'look') {
        const lines = O.textFor(t.onlyMsg, who) || O.pick(DEFAULT_LINES.only[who]);
        await O.Script.run(Array.isArray(lines) ? lines : [lines]);
        return;
      }
      const needWalk = verb !== 'look' || t.walkToLook;
      if (needWalk) {
        const ok = await O.Movement.moveActive(this.standPoint(t), { run });
        if (!ok || this.blocked()) return; // interrupted by another click
      }
      this.faceTarget(t);
      O.emit('interact', { target: t.id, verb, item });
      switch (verb) {
        case 'look':
          return this.doLook(t, who);
        case 'talk':
          if (t.talk) return O.Dialogue.start(t.talk, { npc: t.kind === 'npc' ? t.char || t.npcId : t.kind === 'partner' ? t.charId : null });
          if (t.use) return O.Script.run(t.use);
          return O.Script.run([O.pick(DEFAULT_LINES.talk[who])]);
        case 'exit':
          return this.doExit(t);
        case 'item':
          return this.doItem(t, item, who);
        case 'use':
        case 'take':
        default:
          return this.doUse(t, who);
      }
    },

    async doLook(t, who) {
      const txt = O.textFor(t.look, who);
      if (txt == null) return O.Script.run([who === 'beps' ? 'Niente di speciale.' : 'Niente di interessante.']);
      return O.Script.run(Array.isArray(txt) ? txt : [txt]);
    },

    async doUse(t, who) {
      if (t.col && !t.use) {
        await O.Characters.anim(who, 'pickup', 450);
        return O.Collectibles.collect(t.col);
      }
      const action = t.use != null ? O.textFor(t.use, who) : t.take != null ? O.textFor(t.take, who) : null;
      if (action == null) {
        if (t.look && !t.use) return this.doLook(t, who);
        return O.Script.run([O.pick(DEFAULT_LINES.use[who])]);
      }
      return O.Script.run(action);
    },

    async doExit(t) {
      const ex = typeof t.exit === 'string' ? { to: t.exit } : t.exit;
      if (ex.if && !O.cond(ex.if)) return O.Script.run(O.textFor(ex.else, O.State.d.active) || ['Non ancora.']);
      if (ex.script) await O.Script.run(ex.script);
      O.Audio.sfx(ex.sfx || 'step');
      return O.Scene.go(ex.to, { from: O.Scene.current.id, at: ex.at });
    },

    async doItem(t, item, who) {
      const map = t.items || {};
      const action = map[item] != null ? map[item] : map['*'];
      if (action != null) return O.Script.run(O.textFor(action, who));
      const it = O.Inventory.def(item);
      const wrong = (it && O.textFor(it.wrong, who)) || O.pick(DEFAULT_LINES.item[who]);
      O.Audio.sfx('fail');
      return O.Script.run(Array.isArray(wrong) ? wrong : [wrong]);
    },

    /** Programmatic use (tests/debug). */
    find(id) {
      return this.targets[id] || null;
    }
  };

  O.Hotspots = Hotspots;
})();
