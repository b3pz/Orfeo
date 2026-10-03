/* RelationshipManager — Fiducia / Legame / Conoscenza.
 * Values are hidden: the player only sees qualitative descriptions and
 * subtle feedback. Stats drive topics, lines, expressions and endings. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const TIERS = { fiducia: [0, 3, 7, 11, 14], legame: [0, 4, 10, 18, 26], conoscenza: [0, 8, 18, 28, 38] };
  const WORDS = {
    fiducia: ['Diffidenza', 'Cautela', 'Fiducia', 'Fiducia piena', 'Fiducia incondizionata'],
    legame: ['Sconosciuti', 'Alleati', 'Amici', 'Qualcosa di più', 'Inseparabili'],
    conoscenza: ['Brancolate nel buio', 'Prime tracce', 'Il quadro si delinea', 'Conoscete Orfeo', 'Sapete quasi tutto']
  };
  const FEEDBACK = {
    fiducia: { up: ['Kiki se ne ricorderà.', 'Un po\' di diffidenza in meno.', 'La fiducia cresce.'], down: ['Kiki ti guarda con sospetto.', 'Qualcosa si è incrinato.'] },
    legame: { up: ['Qualcosa tra voi si è avvicinato.', 'Un momento che resterà.', 'Il legame si rafforza.'], down: ['Un attimo di distanza.'] },
    conoscenza: { up: ['Un tassello in più su Orfeo.', 'Il quadro si fa più chiaro.', 'Capite qualcosa di nuovo.'], down: ['Una pista sbagliata.'] }
  };

  const Relationship = {
    level(stat) {
      const v = O.State.stat(stat);
      let l = 0;
      (TIERS[stat] || TIERS.fiducia).forEach((t, i) => {
        if (v >= t) l = i;
      });
      return l;
    },
    describe(stat) {
      return (WORDS[stat] || [])[this.level(stat)] || '';
    },
    feedback(stat, delta) {
      const f = FEEDBACK[stat];
      if (!f || !delta) return;
      O.emit('toast', { text: O.pick(delta > 0 ? f.up : f.down), kind: 'rel-' + stat });
      if (delta > 0 && stat === 'legame') O.Audio.sfx('heart');
    },
    /** Default portrait expression when a line doesn't specify one. */
    defaultExpr(id) {
      if (id === 'kiki') {
        const f = this.level('fiducia');
        if (f === 0 && O.State.d.chapter <= 1) return 'skeptical';
        if (this.level('legame') >= 3) return 'tender';
        return 'neutral';
      }
      if (id === 'beps' && this.level('legame') >= 3) return 'smile';
      return 'neutral';
    },
    /** Journal paragraph about the relationship (no raw numbers). */
    summary() {
      const st = O.State.d;
      if (!st.flags.met_kiki) return 'Non conosci ancora nessuno coinvolto in questa storia.';
      const f = this.level('fiducia'), l = this.level('legame'), k = this.level('conoscenza');
      const ftxt = ['Kiki non si fida ancora di te: ti studia.', 'Kiki ti concede il beneficio del dubbio.', 'Kiki si fida di te.', 'Kiki ti affiderebbe qualunque segreto.', 'Kiki si fida di te senza riserve.'][f];
      const ltxt = ['Siete due sconosciuti con la stessa fotografia.', 'Siete alleati, per ora.', 'Siete diventati amici.', 'Tra voi c\'è qualcosa di più dell\'amicizia.', 'Siete una cosa sola, anche quando non lo dite.'][l];
      const ktxt = ['Di Orfeo sapete pochissimo.', 'Avete le prime tracce di Orfeo.', 'Il disegno di Orfeo comincia a delinearsi.', 'Conoscete Orfeo meglio di molti dei suoi custodi.', 'Sapete quasi tutto di Orfeo. Quasi.'][k];
      return `${ftxt} ${ltxt} ${ktxt}`;
    },
    words: WORDS
  };

  O.Relationship = Relationship;
})();
