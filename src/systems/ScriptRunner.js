/* ScriptRunner — executes data-driven action scripts.
 *
 * A script is an array of steps:
 *   "text"                       → spoken by the active character
 *   "kiki[smile]: text"          → speaker + optional expression
 *   "@give:usb"                  → command (see COMMANDS)
 *   {"if":"cond","do":[..],"else":[..]}
 *   {"choice":[{"label":"..","if":"..","id":"..","do":[..]}]}
 *   {"random":[[..],[..]]}
 * An array made only of {if?,do} objects is a "first match" branch list.
 */
(function () {
  'use strict';
  const O = window.Orfeo;

  const SAY_RE = /^([a-z0-9_]+)(?:\[([a-z]+)\])?:\s?([\s\S]*)$/i;

  function isBranchList(a) {
    return Array.isArray(a) && a.length > 0 && a.every((x) => x && typeof x === 'object' && !Array.isArray(x) && 'do' in x && !('choice' in x) && !('else' in x));
  }

  const Script = {
    running: false,
    depth: 0,

    parseSay(line) {
      const m = line.match(SAY_RE);
      if (m) {
        const sp = m[1].toLowerCase();
        if (['self', 'other', 'narr', 'note'].includes(sp) || (O.Data.characters.characters || {})[sp]) return { who: sp, expr: m[2] || null, text: m[3] };
      }
      return { who: 'self', expr: null, text: line };
    },

    resolveSpeaker(who) {
      if (who === 'self') return O.State.d.active;
      if (who === 'other') return O.State.partnerId();
      return who;
    },

    format(text) {
      return String(text)
        .replace(/\{beps\}/g, O.Characters.displayName('beps'))
        .replace(/\{kiki\}/g, O.Characters.displayName('kiki'))
        .replace(/\{partner\}/g, O.Characters.displayName(O.State.partnerId()))
        .replace(/\{self\}/g, O.Characters.displayName(O.State.d.active))
        .replace(/\{rel:(\w+)\}/g, (_, k) => O.Relationship.describe(k))
        .replace(/\{varano\}/g, () => (O.Endings ? O.Endings.varanoLine() : ''));
    },

    async run(action) {
      if (action == null) return;
      if (typeof action === 'string') action = [action];
      if (this.depth === 0) O.Movement.stopAll();
      this.depth++;
      this.running = true;
      try {
        if (isBranchList(action)) {
          const hit = action.find((b) => O.cond(b.if));
          if (hit) await this.run(hit.do);
        } else {
          for (const step of action) {
            if (this.aborted) break;
            await this.step(step);
          }
        }
      } catch (e) {
        console.error('[Orfeo] errore nello script', e, action);
      } finally {
        this.depth--;
        if (this.depth === 0) {
          this.running = false;
          this.aborted = false;
          O.UI.hideSay();
          if (O.Scene.current) O.Scene.refresh();
          O.emit('script:end');
        }
      }
    },

    abort() {
      if (this.depth > 0) this.aborted = true;
    },

    async step(s) {
      if (s == null) return;
      if (typeof s === 'string') {
        if (s.startsWith('@')) return this.command(s.slice(1));
        const { who, expr, text } = this.parseSay(s);
        return this.say(who, text, expr);
      }
      if (Array.isArray(s)) return this.run(s);
      if ('if' in s && ('do' in s || 'else' in s) && !('choice' in s)) {
        if (O.cond(s.if)) return this.run(s.do);
        if (s.else) return this.run(s.else);
        return;
      }
      if (s.choice) return this.choice(s);
      if (s.random) return this.run(O.pick(s.random));
      if (s.say) return this.say(s.say, s.text, s.expr);
      if (s.do) return this.run(s.do);
    },

    async say(who, text, expr) {
      if (who === 'note' || who === 'narr') {
        await O.UI.say({ narr: true, text: this.format(text) });
        return;
      }
      const id = this.resolveSpeaker(who);
      const def = O.Characters.def(id);
      const e = expr || O.Relationship.defaultExpr(id);
      O.Characters.anim(id, 'talk');
      await O.UI.say({ speaker: id, name: O.Characters.displayName(id), text: this.format(text), expr: e, side: id === O.State.d.active ? 'left' : def.protagonist ? 'left' : 'right' });
      O.Characters.anim(id, 'idle');
    },

    async choice(s) {
      const opts = s.choice.filter((c) => O.cond(c.if));
      if (!opts.length) return;
      const idx = await O.UI.choose(opts.map((c) => ({ label: this.format(c.label), icon: c.icon, tone: c.tone })), s.prompt ? this.format(s.prompt) : null);
      const c = opts[idx];
      if (c.id) O.State.d.choices[c.id] = true;
      const ln = c.line != null ? c.line : /^[«"]/.test(c.label) ? c.label : null;
      if (ln && !c.silent) {
        const p = this.parseSay(ln);
        await this.say(p.who, p.text, p.expr);
      }
      await this.run(c.do);
    },

    async command(src) {
      const i = src.indexOf(':');
      const cmd = (i < 0 ? src : src.slice(0, i)).trim();
      const arg = i < 0 ? '' : src.slice(i + 1).trim();
      const fn = COMMANDS[cmd];
      if (!fn) {
        console.warn('[Orfeo] comando sconosciuto', cmd);
        return;
      }
      return fn(arg);
    }
  };

  function parseKV(arg) {
    const eq = arg.indexOf('=');
    return eq < 0 ? [arg, undefined] : [arg.slice(0, eq), arg.slice(eq + 1)];
  }
  function parseVal(v) {
    if (v === undefined) return true;
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }
  function parsePlace(v) {
    // scene@x,y[,dir]
    const [scene, pos] = v.split('@');
    const p = pos ? pos.split(',') : null;
    return { scene, at: p ? [Number(p[0]), Number(p[1]), p[2]] : null };
  }

  const COMMANDS = {
    give(a) {
      a.split(',').forEach((id) => {
        id = id.trim();
        if (O.State.has(id)) return;
        O.State.give(id);
        O.Audio.sfx('pickup');
        O.emit('toast', { text: 'Ottenuto: ' + O.Inventory.name(id), kind: 'item', item: id });
      });
    },
    take(a) {
      a.split(',').forEach((id) => O.State.take(id.trim()));
    },
    flag(a) {
      const [k, v] = parseKV(a);
      O.State.setFlag(k, parseVal(v));
    },
    unflag(a) {
      O.State.clearFlag(a);
    },
    inc(a) {
      O.State.setFlag(a, (Number(O.State.flag(a)) || 0) + 1);
    },
    stat(a) {
      const m = a.match(/^(\w+)\s*([+-]\d+)(\s*quiet)?$/);
      if (!m) return;
      O.State.addStat(m[1], Number(m[2]));
      if (!m[3]) O.Relationship.feedback(m[1], Number(m[2]));
    },
    clue(a) {
      if (O.State.addClue(a)) {
        O.Audio.sfx('clue');
        const c = O.Journal.clue(a);
        O.emit('toast', { text: 'Nuovo indizio: ' + (c ? c.title : a), kind: 'clue' });
      }
    },
    objective(a) {
      O.Journal.setObjective(a);
    },
    goto(a) {
      const p = parsePlace(a);
      return O.Scene.go(p.scene, { at: p.at, from: O.Scene.current && O.Scene.current.id });
    },
    puzzle(a) {
      return O.Puzzles.start(a);
    },
    solve(a) {
      O.Puzzles.markSolved(a);
    },
    dialogue(a) {
      return O.Dialogue.start(a, { nested: true });
    },
    cutscene(a) {
      return O.Cutscene.play(a);
    },
    chapter(a) {
      return O.UI.chapterCard(Number(a));
    },
    collect(a) {
      return O.Collectibles.collect(a);
    },
    switch(a) {
      O.State.d.active = a;
      O.emit('switch', a);
      const sc = O.State.d.chars[a].scene;
      if (sc && O.Scene.current && sc !== O.Scene.current.id) return O.Scene.show(sc);
    },
    lockswitch() {
      O.State.d.switchLocked = true;
      O.emit('switch', O.State.d.active);
    },
    unlockswitch() {
      O.State.d.switchLocked = false;
      O.emit('switch', O.State.d.active);
      O.emit('toast', { text: 'Ora puoi alternare Beps e Kiki (Tab o ritratto in alto a destra).', kind: 'info' });
    },
    together(a) {
      O.State.d.together = a !== 'false';
    },
    /** @show:kiki  → partner joins the active character's scene */
    show(a) {
      const st = O.State.d;
      const c = st.chars[a];
      const me = st.chars[st.active];
      c.present = true;
      if (a !== st.active) {
        c.scene = me.scene;
        const pt = O.Movement.point(O.Scene.current, a, [me.x + (me.dir > 0 ? 170 : -170), me.y - 10]) || [me.x, me.y];
        c.x = pt[0];
        c.y = pt[1];
        c.dir = -me.dir;
      }
      O.Scene.refresh();
    },
    hide(a) {
      const c = O.State.d.chars[a];
      c.present = false;
      O.Scene.refresh();
    },
    /** @place:kiki=c3_vent@800,900 */
    place(a) {
      const [who, where] = parseKV(a);
      const p = parsePlace(where);
      const c = O.State.d.chars[who];
      c.present = true;
      c.scene = p.scene;
      if (p.at) {
        const scene = O.Scene.get(p.scene);
        const pt = O.Movement.point(scene, who, p.at) || p.at;
        c.x = pt[0];
        c.y = pt[1];
        if (p.at[2]) c.dir = p.at[2] === 'l' ? -1 : 1;
      }
      O.Scene.refresh();
    },
    /** partner comes to the active character */
    join() {
      const st = O.State.d;
      st.together = true;
      COMMANDS.show(O.State.partnerId());
    },
    walk(a) {
      const [x, y] = a.split(',').map(Number);
      return O.Movement.walkTo(O.State.d.active, [x, y]);
    },
    walkchar(a) {
      const [who, pos] = parseKV(a);
      const [x, y] = pos.split(',').map(Number);
      return O.Movement.walkTo(who, [x, y]);
    },
    face(a) {
      const [who, d] = a.includes('=') ? parseKV(a) : [O.State.d.active, a];
      const c = O.State.d.chars[who];
      if (c) c.dir = d === 'l' ? -1 : 1;
      O.Characters.update(who);
    },
    anim(a) {
      const [who, an] = a.includes('=') ? parseKV(a) : [O.State.d.active, a];
      return O.Characters.anim(who === 'self' ? O.State.d.active : who, an, 700);
    },
    sfx(a) {
      O.Audio.sfx(a);
    },
    music(a) {
      O.Audio.music(a === 'none' ? null : a);
    },
    ambience(a) {
      O.Audio.ambience(a === 'none' ? null : a);
    },
    wait(a) {
      return O.sleep(Number(a) || 500);
    },
    save() {
      return O.Save.autosave();
    },
    toast(a) {
      O.emit('toast', { text: Script.format(a), kind: 'info' });
    },
    person(a) {
      O.Journal.addPerson(a);
    },
    note(a) {
      return O.UI.say({ narr: true, text: Script.format(a) });
    },
    shake() {
      return O.UI.shake();
    },
    flash() {
      return O.UI.flash();
    },
    ending() {
      return O.Endings.choose();
    },
    examine(a) {
      return O.Inventory.examine(a);
    },
    refresh() {
      O.Scene.refresh();
    },
    title(a) {
      return O.UI.titleCard(Script.format(a));
    }
  };

  Script.COMMANDS = COMMANDS;
  O.Script = Script;
})();
