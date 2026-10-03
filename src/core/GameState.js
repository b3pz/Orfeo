/* GameState — single source of truth for a playthrough (serialisable). */
(function () {
  'use strict';
  const O = window.Orfeo;

  const SAVE_VERSION = 3;

  function fresh() {
    return {
      version: SAVE_VERSION,
      startedAt: Date.now(),
      playtime: 0,
      chapter: 1,
      active: 'beps',
      switchLocked: true,
      together: true,
      chars: {
        beps: { scene: null, x: 900, y: 900, dir: 1, present: true },
        kiki: { scene: null, x: 1000, y: 900, dir: -1, present: false }
      },
      inventory: [],
      flags: {},
      stats: { fiducia: 0, legame: 0, conoscenza: 0 },
      clues: {},
      clueOrder: [],
      objective: null,
      objectiveLog: [],
      topicsUsed: {},
      topicsSeen: {},
      collectibles: {},
      puzzles: {},
      hints: {},
      hintsTotal: 0,
      visited: {},
      choices: {},
      people: {},
      ending: null
    };
  }

  const State = {
    SAVE_VERSION,
    d: fresh(),
    profile: null,

    reset() {
      this.d = fresh();
      O.emit('state:reset');
    },

    load(data) {
      this.d = Object.assign(fresh(), data);
      O.emit('state:loaded');
    },

    snapshot() {
      return O.deepClone(this.d);
    },

    /* --- flags --- */
    flag(name) {
      return this.d.flags[name];
    },
    setFlag(name, val) {
      this.d.flags[name] = val === undefined ? true : val;
      O.emit('state:flag', { name, val: this.d.flags[name] });
    },
    clearFlag(name) {
      delete this.d.flags[name];
      O.emit('state:flag', { name, val: undefined });
    },

    /* --- inventory --- */
    has(item) {
      return this.d.inventory.includes(item);
    },
    give(item) {
      if (!this.has(item)) {
        this.d.inventory.push(item);
        this.d.flags['got_' + item] = true;
        O.emit('inventory:add', item);
      }
    },
    take(item) {
      const i = this.d.inventory.indexOf(item);
      if (i >= 0) {
        this.d.inventory.splice(i, 1);
        O.emit('inventory:remove', item);
      }
    },

    /* --- stats (hidden) --- */
    stat(name) {
      return this.d.stats[name] || 0;
    },
    addStat(name, delta) {
      const before = this.stat(name);
      this.d.stats[name] = O.clamp(before + delta, -10, 99);
      O.emit('stat:change', { name, delta, value: this.d.stats[name] });
    },

    /* --- clues --- */
    addClue(id) {
      if (this.d.clues[id]) return false;
      this.d.clues[id] = true;
      this.d.clueOrder.push(id);
      O.emit('clue:add', id);
      return true;
    },

    character() {
      return this.d.chars[this.d.active];
    },
    partnerId() {
      return this.d.active === 'beps' ? 'kiki' : 'beps';
    },
    partner() {
      return this.d.chars[this.partnerId()];
    },
    viewScene() {
      return this.character().scene;
    },

    puzzle(id) {
      return (this.d.puzzles[id] = this.d.puzzles[id] || { solved: false, errors: 0, state: null });
    },

    /** Condition resolver: maps identifiers used in data conditions to values. */
    resolve(name) {
      const d = State.d;
      const dot = name.indexOf('.');
      const ns = dot < 0 ? name : name.slice(0, dot);
      const key = dot < 0 ? '' : name.slice(dot + 1);
      switch (ns) {
        case 'flag': return d.flags[key];
        case 'item': return d.inventory.includes(key);
        case 'stat': return d.stats[key] || 0;
        case 'puzzle': return !!(d.puzzles[key] && d.puzzles[key].solved);
        case 'perr': return (d.puzzles[key] && d.puzzles[key].errors) || 0;
        case 'clue': return !!d.clues[key];
        case 'topic': return !!d.topicsUsed[key];
        case 'col': return !!d.collectibles[key];
        case 'visited': return !!d.visited[key];
        case 'choice': return d.choices[key];
        case 'chapter': return d.chapter;
        case 'active': return d.active;
        case 'scene': return State.viewScene();
        case 'together': return d.together;
        case 'present': return !!(d.chars[key] && d.chars[key].present);
        case 'ending': return !!(State.profile && State.profile.endings && State.profile.endings[key]);
        case 'hints': return d.hintsTotal;
        case 'count': return O.Collectibles ? O.Collectibles.count(key) : 0;
        case 'evidence': return O.Collectibles ? O.Collectibles.count('evidence') : 0;
        case 'rel': return O.Relationship ? O.Relationship.level(key) : 0;
        default:
          console.warn('[Orfeo] identificatore sconosciuto nella condizione:', name);
          return undefined;
      }
    }
  };

  O.State = State;
})();
