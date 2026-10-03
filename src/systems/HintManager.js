/* HintManager — 3-level hints (leggero / specifico / quasi-soluzione),
 * only on request. Context = open puzzle, otherwise current objective. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Hints = {
    context() {
      if (O.Puzzles.open) {
        const p = O.Puzzles.def(O.Puzzles.open);
        return { key: 'puzzle:' + O.Puzzles.open, title: p.title, hints: p.hints || [] };
      }
      const obj = O.Journal.objective();
      if (!obj) return null;
      return { key: 'obj:' + O.State.d.objective, title: obj.text, hints: obj.hints || [] };
    },
    level(key) {
      return O.State.d.hints[key] || 0;
    },
    shown() {
      const c = this.context();
      if (!c) return { ctx: null, list: [] };
      return { ctx: c, list: c.hints.slice(0, this.level(c.key)) };
    },
    next() {
      const c = this.context();
      if (!c) return null;
      const l = this.level(c.key);
      if (l >= c.hints.length) return null;
      O.State.d.hints[c.key] = l + 1;
      O.State.d.hintsTotal++;
      if (O.State.d.chapter === 7) O.State.setFlag('hints_c7', (O.State.flag('hints_c7') || 0) + 1);
      if (O.Puzzles.open) O.State.puzzle(O.Puzzles.open).hints = l + 1;
      O.emit('hint', { key: c.key, level: l + 1 });
      return c.hints[l];
    }
  };

  O.Hints = Hints;
})();
