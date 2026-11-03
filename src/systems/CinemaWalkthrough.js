/* CinemaWalkthrough — true autoplay mode.
 * Reuses the tested FULL walkthrough, but keeps the real UI, movement,
 * dialogue, puzzles and cutscenes visible to the viewer. */
(function () {
  'use strict';
  const O = window.Orfeo;

const FULL = [
  // ---------- CAPITOLO 1 ----------
  ['scene', 'c1_studio'],
  ['use', 'computer', null, { choices: ['NON_APRIRE'] }],
  ['use', 'macchinetta'],
  ['use', 'porta'],
  ['scene', 'c1_lungarno'],
  ['use', 'targa', 'look'],
  ['use', 'donna'],
  ['use', 'verso_cantiere'],
  ['scene', 'c1_cantiere'],
  ['use', 'npc:sandro', 'talk', { topics: ['caffe_dato', 'stanza', 'chi_murato', 'acqua'] }],
  ['item', 'armadio', 'coltellino'],
  ['use', 'crepa'],
  ['use', 'lira'],
  ['use', 'bolla'],
  ['use', 'gradini', 'look'],
  ['examine', 'frammenti'],
  ['expect', 'item.promemoria'],
  ['use', 'uscita'],
  ['use', 'porta_archivio'],
  ['scene', 'c1_archivio'],
  ['use', 'npc:kiki_lettrice', 'talk', { topics: ['contrario', 'orfeo'] }],
  ['use', 'npc:archivista', 'talk', { topics: [{ item: 'promemoria' }, 'orfeo', 'alluvione', 'donna'] }],
  ['expect', 'flag.catalogo_ok'],
  ['use', 'foto_alluvione'],
  ['use', 'schedario', null, { choices: ['Dipende', 'Andiamo'] }],
  ['expect', 'flag.met_kiki && item.scheda_o17'],
  ['use', 'porta_deposito'],
  ['scene', 'c1_corridoio'],
  ['use', 'registro'],
  ['use', 'ripiano'],
  ['expect', 'flag.blackout'],
  ['switch', 'kiki'],
  ['use', 'quadro'],
  ['expect', '!flag.blackout'],
  ['use', 'microcassetta'],
  ['switch', 'beps'],
  ['use', 'uscita'],
  ['use', 'uscita'],
  ['scene', 'c1_lungarno'],
  ['use', 'npc:varano_lamp', 'talk', { choices: ['Chi è lei'] }],
  ['use', 'porta_caffe'],
  ['scene', 'c1_caffe'],
  ['use', 'npc:tommaso', 'talk', { topics: ['cappuccino', 'donna', 'grigio'] }],
  ['use', 'quadro'],
  ['use', 'giornale', 'look'],
  ['item', 'laptop', 'usb', { choices: ['terzo gradino'] }],
  ['expect', 'flag.pdf_open'],
  ['use', 'partner', 'talk', { topics: ['c1_foto', 'c1_voce', 'c1_medaglione', 'c1_chi', 'c1_buio'], choices: ['Mi dispiace', 'In una crepa'] }],
  ['combine', 'medaglione_b', 'medaglione_k'],
  ['expect', 'item.medaglione'],
  ['use', 'partner', 'talk', { topics: ['c1_adesso'], choices: ['Andiamo a Parigi'] }],

  // ---------- CAPITOLO 2 ----------
  ['scene', 'c2_gare'],
  ['expect', 'chapter==2'],
  ['use', 'cartolina'],
  ['switch', 'kiki'],
  ['use', 'consigne'],
  ['switch', 'beps'],
  ['use', 'uscita'],
  ['scene', 'c2_quai'],
  ['use', 'lucchetto'],
  ['use', 'npc:albert', 'talk', { topics: ['orfeo', 'donna', 'quai', { item: 'moneta' }], choices: ['Christoph'] }],
  ['examine', 'libretto'],
  ['expect', 'item.mappa'],
  ['use', 'verso_marais', null, { topics: ['foto1967', 'studio', 'ada', 'orfeo', 'donna'] }],
  ['scene', 'c2_studio_marchetti'],
  ['expect', 'item.foto1967 && item.negativo'],
  ['use', 'ritratto_ada'],
  ['use', 'ricevuta'],
  ['use', 'gatto'],
  ['use', 'tenda'],
  ['scene', 'c2_camera_oscura'],
  ['use', 'ingranditore', null, { choices: ['Espongo io'] }],
  ['expect', 'flag.retro_1967'],
  ['use', 'provino'],
  ['use', 'uscita'],
  ['use', 'banco'],
  ['expect', 'puzzle.c2_sovrapposizione'],
  ['use', 'uscita'],
  ['use', 'verso_ada', null, { choices: ['mano sulla spalla'] }],
  ['scene', 'c2_appartamento'],
  ['use', 'segreteria'],
  ['use', 'foto_famiglia'],
  ['use', 'diario'],
  ['switch', 'kiki'],
  ['use', 'cappello', 'look'],
  ['use', 'grammofono', null, { choices: ['non ho paura'] }],
  ['switch', 'beps'],
  ['combine', 'mappa', 'medaglione'],

  // ---------- CAPITOLO 3 ----------
  ['scene', 'c3_piazza'],
  ['expect', 'chapter==3'],
  ['use', 'lira_fontana'],
  ['use', 'balcone'],
  ['use', 'npc:caricaturista', 'talk', { topics: ['ritratto', 'donna'] }],
  ['use', 'portone'],
  ['scene', 'c3_biblioteca'],
  ['use', 'npc:ilario', 'talk', { topics: [{ item: 'medaglione' }, 'teodosiana', 'donna', 'xvii', 'notaio'] }],
  ['expect', 'flag.cassetti_ok'],
  ['switch', 'kiki'],
  ['use', 'scala'],
  ['switch', 'beps'],
  ['use', 'catalogo'],
  ['use', 'porta_cassetti'],
  ['scene', 'c3_sala_cassetti'],
  ['item', 'fianco', 'coltellino'],
  ['switch', 'kiki'],
  ['use', 'targa', 'look'],
  ['switch', 'beps'],
  ['use', 'mobile'],
  ['expect', 'puzzle.c3_cassetti && flag.allarme && item.lista17 && item.chiave_ottone'],
  ['use', 'verbale'],
  ['item', 'grata', 'coltellino'],
  ['switch', 'kiki'],
  ['use', 'grata'],
  ['scene', 'c3_passaggio'],
  ['use', 'leva'],
  ['use', 'dittafono'],
  ['switch', 'beps'],
  ['scene', 'c3_sala_cassetti'],
  ['use', 'cancello'],
  ['scene', 'c3_passaggio'],
  ['use', 'scala'],
  ['use', 'scala', null, { choices: ['Abbiamo la chiave'] }],
  ['scene', 'c3_cortile'],
  ['use', 'foglio'],
  ['use', 'verso_osteria'],
  ['scene', 'c3_osteria'],
  ['use', 'foto_muro'],
  ['combine', 'foto1944', 'lista17'],
  ['use', 'partner', 'talk', { topics: ['c3_roma', 'c3_latino', 'c3_federica'] }],
  ['use', 'tavolo', null, { choices: ['Tua nonna e tua bisnonna'] }],

  // ---------- CAPITOLO 4 ----------
  ['scene', 'c4_studio'],
  ['expect', 'chapter==4 && !present.kiki'],
  ['use', 'biglietto'],
  ['use', 'pacco'],
  ['expect', 'flag.sms_ricevuto'],
  ['use', 'porta'],
  ['scene', 'c4_ponte'],
  ['use', 'npc:neri', 'talk', { topics: ['kiki', { item: 'lista17' }, 'nonno', 'banco', 'corridoio'] }],
  ['use', 'vetrina'],
  ['use', 'verso_banca'],
  ['use', 'npc:bellandi', 'talk', { topics: ['cassetta', 'varano'], choices: ['«Euridice»'] }],
  ['expect', 'item.sigillo_b && item.nastro'],
  ['use', 'registro'],
  ['use', 'uscita'],
  ['use', 'banco'],
  ['expect', 'item.sigillo'],
  ['use', 'porta_corridoio'],
  ['scene', 'c4_corridoio'],
  ['use', 'graffito'],
  ['use', 'lira_finestra'],
  ['item', 'porta_orfeo', 'sigillo', { topics: ['perche', 'registro', 'bruciare', 'sigillo', 'nome'], choices: ['Abbracciala'] }],
  ['scene', 'c4_grotta'],
  ['expect', 'flag.kiki_liberata && present.kiki'],
  ['use', 'dittafono'],
  ['use', 'partner', 'talk', { topics: ['c4_scusa'] }],
  ['use', 'uscita'],

  // ---------- CAPITOLO 5 ----------
  ['scene', 'c5_galata'],
  ['use', 'chiosco'],
  ['use', 'simit'],
  ['use', 'verso_bazar'],
  ['use', 'npc:emre', 'talk', { topics: ['te', 'antiquario'] }],
  ['use', 'donna'],
  ['use', 'cassa'],
  ['use', 'verso_antiquario', null, { topics: ['traduttore', 'registro', 'lanterna', 'botola', 'ada', 'donna'] }],
  ['scene', 'c5_antiquario'],
  ['expect', 'item.lanterna && flag.selim_camera'],
  ['use', 'grammofono'],
  ['use', 'foto_1989'],
  ['use', 'gatto'],
  ['use', 'uscita'],
  ['use', 'npc:emre', 'talk', { topics: ['leva', 'donna'] }],
  ['use', 'verso_han'],
  ['scene', 'c5_han'],
  ['use', 'nicchia'],
  ['use', 'scala_tetto', null, { choices: ['Baciala'] }],
  ['scene', 'c5_tetto'],
  ['expect', 'flag.bacio'],
  ['use', 'lettera_comignolo'],
  ['use', 'partner', 'talk', { topics: ['c5_istanbul', 'noi'], choices: ['Quando sarà finito'] }],
  ['use', 'scala'],
  ['item', 'botola', 'piede_porco'],
  ['use', 'botola'],
  ['scene', 'c5_cisterna'],
  ['use', 'lira_medusa'],
  ['use', 'porta_camera'],
  ['scene', 'c5_camera_anelli'],
  ['item', 'anelli', 'medaglione'],

  // ---------- CAPITOLO 6 ----------
  ['scene', 'c6_pont_neuf'],
  ['expect', 'chapter==6 && clue.camera_firenze'],
  ['use', 'panchina', null, { choices: ['non sarà finito'] }],
  ['use', 'verso_atelier', null, { topics: ['istanbul', 'archivio', 'ruolo', 'nastro'] }],
  ['scene', 'c6_atelier'],
  ['use', 'foto_2019'],
  ['use', 'tenda'],
  ['item', 'revox', 'nastro'],
  ['expect', 'flag.nastro_ascoltato'],
  ['use', 'bobine'],
  ['use', 'uscita'],
  ['use', 'uscita'],
  ['use', 'verso_archivio'],
  ['scene', 'c6_archivio'],
  ['use', 'atto'],
  ['use', 'tavolo'],
  ['expect', 'puzzle.c6_cronologia'],
  ['use', 'uscita'],
  ['use', 'partner', 'talk', { topics: ['c6_helene'] }],
  ['use', 'verso_ufficio'],
  ['scene', 'c6_ufficio'],
  ['use', 'lettera_lina'],
  ['use', 'npc:varano6', 'talk', { topics: ['bruno', 'lina', 'verbale', 'camera', 'perche'] }],
  ['expect', 'flag.varano_doubt && flag.varano_c6_fine'],
  ['use', 'uscita'],
  ['scene', 'c6_catacombe'],
  ['use', 'lira_ossa'],
  ['use', 'partner', 'talk', { topics: ['c6_varano'] }],
  ['use', 'uscita'],

  // ---------- CAPITOLO 7 ----------
  ['scene', 'c7_cantiere'],
  ['expect', 'chapter==7'],
  ['use', 'partner', 'talk', { topics: ['c7_paura'] }],
  ['use', 'gradini'],
  ['use', 'gradini'],
  ['use', 'gradini'],
  ['scene', 'c7_galleria'],
  ['use', 'lira_volta'],
  ['expect', 'flag.knows_18'],
  ['use', 'ruota'],
  ['use', 'nicchia_voce'],
  ['use', 'iscrizione', 'look'],
  ['use', 'arco'],
  ['scene', 'c7_camera'],
  ['use', 'foto_originale'],
  ['use', 'iscrizione', 'look'],
  ['item', 'incavo', 'sigillo'],
  ['switch', 'kiki'],
  ['item', 'grammofono', 'nastro'],
  ['use', 'ruota_nomi'],
  ['use', 'leva'],
  ['switch', 'beps'],
  ['item', 'serratura', 'chiave_ottone'],
  ['expect', 'flag.meccanismo_aperto && flag.final_perfect && flag.eighteenth_written'],
  ['use', 'registro_scrigno'],
  ['scene', 'c7_alba'],
  ['use', 'donna_ponte'],
  ['checkpoint', 'pre_ending'],
  ['use', 'npc:varano7', 'talk', { topics: ['luce', 'custodi', 'cenere', 'noi'] }]
];

  const Director = {
    plan: { topics: [], choices: [], item: null },
    originals: null,
    puzzleHook: null,
    stopped: false,

    install() {
      if (this.originals) return;
      const self = this;
      this.originals = {
        topics: O.UI.topics.bind(O.UI),
        choose: O.UI.choose.bind(O.UI),
        pickItem: O.UI.pickItem.bind(O.UI)
      };

      O.UI.topics = function(menu, opts) {
        const p = self.originals.topics(menu, opts);
        const next = self.plan.topics.length ? self.plan.topics.shift() : '__bye';
        setTimeout(() => {
          if (self.stopped) return O.UI.cancelTopics();
          if (next && typeof next === 'object') {
            self.plan.item = next.item;
            O.$('#topics .show-item')?.click();
            return;
          }
          if (next === '__bye') return O.$('#topics .bye')?.click();
          const idx = menu.findIndex((m) => m.id === next);
          const btns = O.$$('#topics .topic').filter((b) => !b.classList.contains('show-item') && !b.classList.contains('bye'));
          (btns[idx] || O.$('#topics .bye'))?.click();
        }, 850);
        return p;
      };

      O.UI.choose = function(options, prompt) {
        const p = self.originals.choose(options, prompt);
        const want = self.plan.choices.length ? self.plan.choices.shift() : null;
        setTimeout(() => {
          if (self.stopped) return;
          let idx = 0;
          if (want) {
            const found = options.findIndex((o) => String(o.label).includes(want));
            if (found >= 0) idx = found;
          }
          O.$$('#choices .choice')[idx]?.click();
        }, 900);
        return p;
      };

      O.UI.pickItem = function(title) {
        const p = self.originals.pickItem(title);
        const want = self.plan.item;
        self.plan.item = null;
        setTimeout(() => {
          if (self.stopped) return O.UI.closePanel();
          const buttons = O.$$('#modal .pick-grid .inv-item');
          const idx = O.State.d.inventory.findIndex((id) => id === want);
          (buttons[idx] || buttons[0])?.click();
        }, 850);
        return p;
      };

      this.puzzleHook = () => setTimeout(() => {
        if (!self.stopped && O.Puzzles.open && O.Puzzles.instance && O.Puzzles.instance.auto) O.Puzzles.autoSolve();
      }, 1100);
      O.on('puzzle:open', this.puzzleHook);
    },

    uninstall() {
      if (!this.originals) return;
      O.UI.topics = this.originals.topics;
      O.UI.choose = this.originals.choose;
      O.UI.pickItem = this.originals.pickItem;
      if (this.puzzleHook) O.off('puzzle:open', this.puzzleHook);
      this.originals = null;
      this.puzzleHook = null;
    },

    setPlan(opts) {
      opts = opts || {};
      this.plan.topics = (opts.topics || []).slice();
      this.plan.choices = (opts.choices || []).slice();
      this.plan.item = null;
    },

    async settle() {
      for (let i = 0; i < 600 && !this.stopped; i++) {
        if (!O.Script.running && !O.Dialogue.open && !O.Puzzles.open && !O.Cutscene.playing && !O.UI.modalOpen()) return;
        await new Promise((r) => setTimeout(r, 50));
      }
    },

    async step(step, index) {
      if (this.stopped) return;
      const [kind, a, b, opts] = step;
      const plan = kind === 'use' || kind === 'item' || kind === 'combine' ? (opts || {}) : kind === 'examine' ? (b || {}) : {};
      this.setPlan(plan);
      const target = () => O.Hotspots.find(a);

      switch (kind) {
        case 'use': {
          const t = target();
          if (!t) throw new Error('Cinema: hotspot mancante ' + a + ' in ' + (O.Scene.current && O.Scene.current.id));
          await O.Hotspots.interact(t, b || O.Hotspots.primaryVerb(t));
          break;
        }
        case 'item': {
          const t = target();
          if (!t) throw new Error('Cinema: hotspot mancante ' + a + ' in ' + (O.Scene.current && O.Scene.current.id));
          await O.Hotspots.interact(t, 'item', b);
          break;
        }
        case 'combine':
          await O.Inventory.combine(a, b);
          break;
        case 'examine':
          await O.Inventory.examine(a);
          break;
        case 'switch':
          await O.Scene.switchTo(a);
          break;
        case 'expect':
        case 'scene':
        case 'checkpoint':
          return;
      }
      await this.settle();
      await O.sleep(250);
    },

    async play() {
      this.stopped = false;
      this.install();
      const prevAuto = O.UI.settings.autoAdvance;
      O.UI.settings.autoAdvance = true;

      try {
        O.State.reset();
        O.Inventory.selected = null;
        O.Game.leaveTitle();
        O.Inventory.render();
        document.body.classList.add('cinema-active');
        O.Cinema.mountControls();

        const start = O.Data.chapters.start;
        O.State.d.chars.beps.scene = start.scene;
        await O.Script.run(start.before || []);
        await O.Scene.go(start.scene, { at: start.at });
        await this.settle();

        for (let i = 0; i < FULL.length && !this.stopped; i++) {
          await this.step(FULL[i], i);
        }

        if (!this.stopped && !O.State.d.ending) {
          await O.Endings.play('segreto');
        }
      } catch (e) {
        console.error('[Orfeo Cinema]', e);
        O.UI.toast({ text: 'Modalità Cinema interrotta: ' + e.message, kind: 'error' });
      } finally {
        O.UI.settings.autoAdvance = prevAuto;
        this.uninstall();
        document.body.classList.remove('cinema-active');
        O.Cinema.cleanup();
      }
    },

    stop() {
      this.stopped = true;
      O.Dialogue.close();
      if (O.Puzzles.open) O.Puzzles.close();
      if (O.Cutscene.playing) {
        O.Cutscene.skipAll = true;
        if (O.Cutscene._next) O.Cutscene._next();
      }
      if (O.UI._sayAdv) O.UI._sayAdv();
    }
  };

  O.CinemaDirector = Director;
})();
