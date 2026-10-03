/* EndingManager — evaluates ending requirements (data/endings.json),
 * presents the final choice, plays epilogue variants, credits and
 * post-credit scenes, and records discovered endings in the profile. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Endings = {
    defs() {
      return O.Data.endings.endings || {};
    },
    order() {
      return O.Data.endings.order || Object.keys(this.defs());
    },
    available(id) {
      const d = this.defs()[id];
      return !!d && O.cond(d.req);
    },
    /** Status of every ending for the current state (debug/tests). */
    report() {
      const r = {};
      this.order().forEach((id) => (r[id] = this.available(id)));
      return r;
    },

    varanoLine() {
      const f = O.State.d.flags;
      if (f.varano_redento) return 'Aurelio Varano legge in pubblico i nomi della sua famiglia, uno accanto all\'altro. Poi chiude lo studio notarile e apre una piccola libreria in via de\' Bardi. Si chiama «Lina».';
      if (f.varano_testimonia) return 'Aurelio Varano testimonia davanti al Tribunale di Firenze sul verbale falsificato del 1967. Esce dall\'aula senza cappello.';
      if (f.varano_custode) return 'Aurelio Varano resta il Notaio. Il primo verbale che redige comincia con: «Presenti: tutti».';
      if (f.varano_doubt) return 'Varano scrive una lettera a sua nonna Lina e la lascia sulla sua tomba, a Trespiano. È la prima che riesce a finire.';
      return 'Varano lascia Firenze. Il suo studio notarile chiude a primavera. Nessuno sa dove sia andato.';
    },

    async choose() {
      const opts = [];
      this.order().forEach((id) => {
        const d = this.defs()[id];
        const ok = this.available(id);
        if (!ok && d.secret) return; // the secret one is invisible unless earned
        opts.push({ id, label: d.choice, sub: ok ? d.choiceSub : d.lockedHint, locked: !ok, secret: !!d.secret });
      });
      const prompt = O.Data.endings.prompt;
      let pick = null;
      for (let guard = 0; guard < 50 && !pick; guard++) {
        const id = await O.UI.endingChoice(opts, prompt);
        const o = opts.find((x) => x.id === id);
        if (o && !o.locked) pick = id;
      }
      return this.play(pick);
    },

    async play(id) {
      const d = this.defs()[id];
      const st = O.State.d;
      st.ending = id;
      O.State.profile.endings[id] = { ts: Date.now(), stats: Object.assign({}, st.stats) };
      O.Save.saveProfile();
      O.emit('ending:start', id);
      if (d.script) await O.Script.run(d.script);
      // epilogue variant (depends on relationship / choices)
      const ep = (d.epilogues || []).find((e) => O.cond(e.if));
      await O.UI.epilogue(d, ep);
      if (!O.testMode) await O.UI.credits(d);
      if (d.postcredit) await O.Script.run(d.postcredit);
      O.emit('ending:done', id);
      await O.UI.endScreen(d);
    }
  };

  O.Endings = Endings;
})();
