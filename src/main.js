/* Game bootstrap — loading, title screen, new game / continue / load,
 * playtime, autosave hooks and the small test API used by tests/. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Game = {
    async boot() {
      const bar = O.$('#loading .bar i');
      const msg = O.$('#loading p');
      const progress = (k, t) => {
        bar.style.width = Math.round(k * 100) + '%';
        if (t) msg.textContent = t;
      };
      try {
        O.testMode = !!window.ORFEO_TEST;
        O.Save.init();
        O.Audio.init();
        progress(0.05, 'Apro l\'archivio…');
        await O.Assets.init();
        await O.loadData((k) => progress(0.05 + k * 0.5, 'Leggo i fascicoli…'));
        this.normalize();
        O.UI.init();
        O.Scene.init(O.$('#world'));
        O.Hotspots.init();
        O.Debug.init();
        O.Collectibles.build();
        progress(0.6, 'Sviluppo le fotografie…');
        await O.Assets.preload(this.preloadList(), (k) => progress(0.6 + k * 0.4));
        progress(1, 'Pronto.');
        this.bind();
        this.toTitle();
        O.$('#loading').classList.add('done');
        setTimeout(() => O.$('#loading').remove(), 800);
        O.ready = true;
        O.emit('ready');
      } catch (e) {
        console.error(e);
        msg.textContent = 'Errore di caricamento: ' + e.message + '. Prova ad avviare il gioco da un server locale (vedi README).';
        O.$('#loading').classList.add('error');
      }
    },

    normalize() {
      const sc = O.Data.scenes.scenes;
      Object.keys(sc).forEach((id) => (sc[id].id = id));
    },

    preloadList() {
      const list = [];
      ['beps', 'kiki'].forEach((id) => {
        const sp = (O.Characters.def(id).sprites || {});
        Object.values(sp).forEach((s) => list.push(s.src));
      });
      const first = O.Data.chapters.start && O.Data.chapters.start.scene;
      if (first) list.push(`assets/backgrounds/${first}.jpg`, `assets/backgrounds/${first}.webp`, `assets/backgrounds/${first}.png`);
      list.push('assets/gui/title.jpg', 'assets/gui/title.png', 'assets/gui/title.webp', 'assets/backgrounds/piazza_firenze_notte.webp');
      return list;
    },

    bind() {
      O.$('#btn-new').onclick = () => this.newGame();
      O.$('#btn-continue').onclick = () => this.continueGame();
      O.$('#btn-load').onclick = () => O.UI.saveLoad('load');
      O.$('#btn-options').onclick = () => O.UI.options();
      O.$('#btn-archive').onclick = () => O.UI.archive();
      O.$('#btn-credits').onclick = () => this.creditsPanel();
      // advance speech when clicking anywhere on the stage
      O.$('#stage').addEventListener('click', (e) => {
        if (O.UI._sayAdv && !e.target.closest('#say')) O.UI._sayAdv();
      }, true);
      // playtime
      setInterval(() => {
        if (!O.inTitle && !document.hidden && O.State.d) O.State.d.playtime++;
      }, 1000);
      // stable-point autosave (debounced)
      let t = null;
      O.on('script:end', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (!O.Script.running && !O.Dialogue.open && !O.Puzzles.open && !O.inTitle) O.Save.autosave();
        }, O.testMode ? 0 : 1200);
      });
      window.addEventListener('beforeunload', () => {
        if (!O.inTitle && !O.Script.running && !O.Dialogue.open) O.Save.save('auto', { noThumb: true });
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && !O.inTitle && !O.Script.running && !O.Dialogue.open) O.Save.save('auto', { noThumb: true });
      });
    },

    toTitle() {
      O.inTitle = true;
      O.Movement.stopAll();
      const ts = O.$('#title-screen');
      ts.classList.remove('hidden');
      document.body.classList.add('at-title');
      const latest = O.Save.latest();
      const cont = O.$('#btn-continue');
      cont.disabled = !latest;
      cont.innerHTML = latest ? `Continua <small>Cap. ${O.roman(latest.chapter)} · ${latest.sceneName || ''}</small>` : 'Continua';
      const titleScene = O.Data.scenes.scenes[O.Data.chapters.titleScene || 'c1_lungarno'];
      const img = O.Assets.first('assets/gui/title.jpg', 'assets/gui/title.png', 'assets/gui/title.webp', 'assets/backgrounds/piazza_firenze_notte.webp') || (titleScene && O.Scene.bgPath(titleScene));
      O.$('#title-art').innerHTML = img ? `<img src="${img}" alt="">` : O.Art.background(titleScene || { id: 't', art: { type: 'exterior', time: 'night' } });
      const found = Object.keys(O.State.profile.endings || {}).length;
      O.$('#title-endings').textContent = found ? `Finali scoperti: ${found} / ${O.Endings.order().length}` : '';
      O.Audio.music('title');
      O.Audio.ambience('rain');
    },

    leaveTitle() {
      O.inTitle = false;
      O.$('#title-screen').classList.add('hidden');
      document.body.classList.remove('at-title');
      O.UI.closePanel();
    },

    async newGame() {
      const latest = O.Save.latest();
      if (latest && latest.slot === 'auto' && !O.testMode) {
        O.UI.panel('Nuova partita', 'confirmnew');
        const ok = await O.UI.confirm('Iniziare una nuova partita? Il salvataggio automatico verrà sostituito (gli slot manuali restano).');
        O.UI.closePanel();
        if (!ok) return;
      }
      O.State.reset();
      O.Inventory.selected = null;
      this.leaveTitle();
      O.Inventory.render();
      const start = O.Data.chapters.start;
      const st = O.State.d;
      st.chars.beps.scene = start.scene;
      await O.Script.run(start.before || []);
      await O.Scene.go(start.scene, { at: start.at });
    },

    async continueGame() {
      const latest = O.Save.latest();
      if (latest) return this.loadSlot(latest.slot);
    },

    async loadSlot(slot) {
      const data = O.Save.read(slot);
      if (!data) {
        O.UI.toast({ text: 'Salvataggio non leggibile.', kind: 'error' });
        return;
      }
      O.Movement.stopAll();
      O.Dialogue.close();
      if (O.Puzzles.open) O.Puzzles.close();
      O.State.load(data.state);
      O.Inventory.selected = null;
      O.UI.setItemCursor(null);
      this.leaveTitle();
      O.Inventory.render();
      const scene = O.State.viewScene();
      if (!scene || !O.Data.scenes.scenes[scene]) {
        console.warn('[Orfeo] scena del salvataggio non trovata, torno all\'inizio del capitolo');
        const ch = O.Data.chapters.chapters.find((c) => c.id === O.State.d.chapter);
        await O.Scene.go((ch && ch.debugStart && ch.debugStart.scene) || O.Data.chapters.start.scene);
        return;
      }
      await O.Scene.show(scene);
      O.UI.setLocation(O.Scene.current);
      O.UI.flashObjective();
      O.UI.toast({ text: 'Partita caricata', kind: 'save' });
    },

    creditsPanel() {
      const p = O.UI.panel('Crediti', 'credits-panel');
      const C = O.Data.endings.credits || [];
      p.body.innerHTML = C.map((c) => `<div class="cr-row"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('');
    }
  };

  /* ---------- test API (used by tests/playthrough.mjs) ---------- */
  O.test = {
    state: () => O.State.d,
    async use(id, verb, item) {
      const t = O.Hotspots.find(id);
      if (!t) throw new Error(`hotspot "${id}" non presente in ${O.Scene.current && O.Scene.current.id} (visibili: ${Object.keys(O.Hotspots.targets).join(', ')})`);
      await O.Hotspots.interact(t, verb || (item ? 'item' : O.Hotspots.primaryVerb(t)), item);
      await O.test.idle();
    },
    async combine(a, b) {
      await O.Inventory.combine(a, b);
      await O.test.idle();
    },
    async switchTo(id) {
      const r = await O.Scene.switchTo(id);
      if (r === false) throw new Error('switch fallito verso ' + id);
      await O.test.idle();
    },
    async idle() {
      for (let i = 0; i < 400; i++) {
        if (!O.Script.running && !O.Dialogue.open && !O.Puzzles.open && !O.Cutscene.playing) return;
        await new Promise((r) => setTimeout(r, 5));
      }
      throw new Error('timeout: il gioco non torna inattivo');
    },
    scene: () => O.Scene.current && O.Scene.current.id,
    targets: () => Object.keys(O.Hotspots.targets)
  };

  O.Game = Game;
  window.addEventListener('DOMContentLoaded', () => Game.boot());
})();
