/* PuzzleManager — opens puzzle modals defined in puzzles.json.
 * Every puzzle: can be left and resumed (state is saved), has 3 hints,
 * gives clear feedback, never dead-ends. Types live in src/puzzles/. */
(function () {
  'use strict';
  const O = window.Orfeo;

  O.PuzzleTypes = O.PuzzleTypes || {};

  const Puzzles = {
    open: null,
    instance: null,

    def(id) {
      return (O.Data.puzzles.puzzles || {})[id];
    },

    isSolved(id) {
      return O.State.puzzle(id).solved;
    },

    markSolved(id) {
      const p = O.State.puzzle(id);
      if (p.solved) return;
      p.solved = true;
      O.State.setFlag('solved_' + id);
      O.emit('puzzle:solved', id);
    },

    /** Opens puzzle; resolves after it is closed (solved or abandoned). */
    async start(id) {
      const def = this.def(id);
      if (!def) {
        console.error('[Orfeo] puzzle mancante', id);
        return;
      }
      if (this.isSolved(id) && !def.replayable) {
        if (def.alreadySolved) await O.Script.run(O.textFor(def.alreadySolved, O.State.d.active));
        return;
      }
      const type = O.PuzzleTypes[def.type];
      if (!type) {
        console.error('[Orfeo] tipo di puzzle sconosciuto', def.type);
        return;
      }
      const ps = O.State.puzzle(id);
      ps.attempts = (ps.attempts || 0) + 1;
      if (def.intro && ps.attempts === 1) await O.Script.run(O.textFor(def.intro, O.State.d.active));
      let solved = false;
      await new Promise((resolve) => {
        const { root, body, status } = O.UI.openPuzzle(def, () => {
          this.close();
        });
        this.open = id;
        const api = {
          id,
          def,
          state: ps.state ? O.deepClone(ps.state) : null,
          who: O.State.d.active,
          save(s) {
            ps.state = O.deepClone(s);
          },
          status(msg, kind) {
            status.textContent = msg || '';
            status.className = 'pz-status ' + (kind || '');
          },
          error(msg) {
            ps.errors = (ps.errors || 0) + 1;
            O.Audio.sfx('fail');
            api.status(msg || 'Non è così.', 'bad');
            root.classList.remove('shake');
            void root.offsetWidth;
            root.classList.add('shake');
          },
          good(msg) {
            O.Audio.sfx('click');
            api.status(msg, 'good');
          },
          solve(msg) {
            if (solved) return;
            solved = true;
            O.Audio.sfx('success');
            api.status(msg || def.successText || 'Risolto.', 'good');
            root.classList.add('solved');
            Puzzles.markSolved(id);
            setTimeout(() => Puzzles.close(), O.testMode ? 0 : 1400);
          },
          has: (item) => O.State.has(item),
          cond: (c) => O.cond(c),
          art: O.Art
        };
        this._resolve = resolve;
        this.instance = type.create(body, def, api);
        this.instance.api = api;
        O.emit('puzzle:open', id);
        if (O.testMode && O.testPuzzle) setTimeout(() => O.testPuzzle(id, this.instance), 0);
      });
      this.instance = null;
      if (solved && def.onSolve) await O.Script.run(O.textFor(def.onSolve, O.State.d.active));
      else if (!solved && def.onLeave) await O.Script.run(O.textFor(def.onLeave, O.State.d.active));
      O.Save.autosave();
    },

    close() {
      if (!this.open) return;
      if (this.instance && this.instance.destroy) this.instance.destroy();
      O.UI.closePuzzle();
      this.open = null;
      const r = this._resolve;
      this._resolve = null;
      if (r) r();
    },

    /** Test helper: run the canonical solution through the puzzle's own input methods. */
    autoSolve() {
      if (this.instance && this.instance.auto) return this.instance.auto();
    }
  };

  O.Puzzles = Puzzles;
})();
