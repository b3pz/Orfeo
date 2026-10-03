/* CollectibleManager — "Archivio Orfeo": 17 documenti, 12 fotografie,
 * 7 registrazioni, 7 simboli. Adds lore, unlocks topics, feeds the
 * secret ending. Found items are also remembered in the profile. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const TYPES = {
    documents: { label: 'Documenti', single: 'Documento', total: 17 },
    photos: { label: 'Fotografie', single: 'Fotografia', total: 12 },
    recordings: { label: 'Registrazioni', single: 'Registrazione', total: 7 },
    symbols: { label: 'Simboli', single: 'Simbolo', total: 7 }
  };
  const ALIAS = { docs: 'documents', documents: 'documents', photos: 'photos', recordings: 'recordings', symbols: 'symbols' };

  const Collectibles = {
    TYPES,
    index: null,

    build() {
      this.index = {};
      const d = O.Data.collectibles || {};
      Object.keys(TYPES).forEach((type) => (d[type] || []).forEach((c, i) => (this.index[c.id] = Object.assign({ type, n: i + 1 }, c))));
    },
    get(id) {
      if (!this.index) this.build();
      return this.index[id];
    },
    all(type) {
      if (!this.index) this.build();
      return Object.values(this.index).filter((c) => !type || c.type === type);
    },

    count(key) {
      const st = O.State.d;
      if (!this.index) this.build();
      if (key === 'evidence') return Object.keys(st.clues).filter((c) => { const d = O.Journal.clue(c); return d && d.evidence; }).length;
      if (key === 'clues') return Object.keys(st.clues).length;
      if (key === 'collectibles' || key === 'all') return Object.keys(st.collectibles).filter((k) => this.index[k]).length;
      const type = ALIAS[key];
      if (type) return Object.keys(st.collectibles).filter((k) => this.index[k] && this.index[k].type === type).length;
      return 0;
    },

    async collect(id) {
      const c = this.get(id);
      const st = O.State.d;
      if (!c) return console.warn('[Orfeo] collezionabile sconosciuto', id);
      if (st.collectibles[id]) return;
      st.collectibles[id] = true;
      O.State.profile.collectibles[id] = true;
      O.Save.saveProfile();
      O.Audio.sfx(c.type === 'recordings' ? 'tape' : 'collect');
      const T = TYPES[c.type];
      O.emit('toast', { text: `Archivio Orfeo · ${T.single} ${this.count(c.type)}/${T.total}`, kind: 'collect' });
      if (c.stat) O.Script.COMMANDS.stat(c.stat + ' quiet');
      O.Scene.refresh();
      await O.UI.showCollectible(c);
      if (c.after) await O.Script.run(O.textFor(c.after, st.active));
      O.emit('collect', id);
    }
  };

  O.Collectibles = Collectibles;
})();
