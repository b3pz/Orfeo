/* DebugManager — hidden developer mode (OFF by default).
 * Enable with ?debug=1 in the URL, or localStorage "orfeo.debug" = "1".
 * Toggle panel with the ` (backtick) key or the bug button. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Debug = {
    enabled: /[?&]debug=1/.test(location.search) || (() => {
      try {
        return localStorage.getItem('orfeo.debug') === '1';
      } catch (e) {
        return false;
      }
    })(),

    init() {
      if (!this.enabled) return;
      document.body.classList.add('debug');
      const btn = O.el('button#debug-btn', { text: '🐞', title: 'Debug (`)' });
      btn.onclick = () => this.toggle();
      document.body.appendChild(btn);
      window.addEventListener('keydown', (e) => {
        if (e.key === '`') this.toggle();
      });
      console.info('[Orfeo] modalità sviluppatore attiva');
    },

    toggle() {
      const el = O.$('#debug');
      if (el.classList.contains('on')) return el.classList.remove('on');
      this.render();
      el.classList.add('on');
    },

    render() {
      const el = O.$('#debug');
      const st = O.State.d;
      const scenes = Object.keys(O.Data.scenes.scenes);
      const items = Object.keys(O.Data.items.items);
      const ends = O.Endings.report();
      el.innerHTML = `
        <h3>Debug <button data-a="close">✕</button></h3>
        <section><b>Capitolo (preset)</b> ${O.Data.chapters.chapters.map((c) => `<button data-a="chapter" data-v="${c.id}">${O.roman(c.id)}</button>`).join('')}</section>
        <section><b>Vai a scena</b><select id="dbg-scene">${scenes.map((s) => `<option ${O.Scene.current && O.Scene.current.id === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button data-a="goto">Vai</button></section>
        <section><b>Oggetti</b><select id="dbg-item">${items.map((s) => `<option>${s}</option>`).join('')}</select><button data-a="give">+</button><button data-a="take">−</button><button data-a="allitems">tutti</button></section>
        <section><b>Statistiche</b>${['fiducia', 'legame', 'conoscenza'].map((k) => `<label>${k}<input type="number" data-stat="${k}" value="${st.stats[k]}"></label>`).join('')}<button data-a="max">max</button></section>
        <section><b>Sblocca</b><button data-a="clues">indizi</button><button data-a="cols">collezionabili</button><button data-a="symbols">7 simboli</button><button data-a="endings">finali (profilo)</button><button data-a="switch">switch</button><button data-a="kiki">Kiki qui</button></section>
        <section><b>Flag</b><input id="dbg-flag" placeholder="nome=valore"><button data-a="flag">imposta</button></section>
        <section><b>Finali disponibili</b> ${Object.entries(ends).map(([k, v]) => `<span class="${v ? 'ok' : 'no'}">${k}</span>`).join(' ')} <button data-a="ending">scelta finale</button></section>
        <section><b>Puzzle</b> ${O.Puzzles.open ? `<button data-a="solve">risolvi "${O.Puzzles.open}"</button>` : '<i>nessuno aperto</i>'} <button data-a="hotspots">mostra hotspot</button> <button data-a="walk">mostra zona camminabile</button></section>
        <section><b>Salvataggi</b><button data-a="reset">azzera tutto</button><button data-a="assets">report asset</button></section>
        <details><summary>Stato (flag, puzzle, oggetti)</summary><pre>${escape(JSON.stringify({ chapter: st.chapter, active: st.active, scene: O.State.viewScene(), chars: st.chars, inventory: st.inventory, flags: st.flags, puzzles: st.puzzles, stats: st.stats, collectibles: Object.keys(st.collectibles).length }, null, 1))}</pre></details>`;
      el.onclick = (e) => this.action(e.target.dataset.a, e.target.dataset.v);
      O.$$('[data-stat]', el).forEach((i) => (i.onchange = () => (st.stats[i.dataset.stat] = Number(i.value))));
    },

    async action(a, v) {
      if (!a) return;
      const st = O.State.d;
      switch (a) {
        case 'close': return O.$('#debug').classList.remove('on');
        case 'chapter': await this.chapterPreset(Number(v)); break;
        case 'goto': await O.Scene.go(O.$('#dbg-scene').value); break;
        case 'give': O.State.give(O.$('#dbg-item').value); break;
        case 'take': O.State.take(O.$('#dbg-item').value); break;
        case 'allitems': Object.keys(O.Data.items.items).forEach((i) => O.State.give(i)); break;
        case 'max': ['fiducia', 'legame', 'conoscenza'].forEach((k) => (st.stats[k] = 20)); break;
        case 'clues': Object.keys(O.Data.chapters.clues).forEach((c) => O.State.addClue(c)); break;
        case 'cols': O.Collectibles.all().forEach((c) => (st.collectibles[c.id] = true)); break;
        case 'symbols': O.Collectibles.all('symbols').forEach((c) => (st.collectibles[c.id] = true)); break;
        case 'endings': O.Endings.order().forEach((id) => (O.State.profile.endings[id] = { ts: Date.now() })); O.Save.saveProfile(); break;
        case 'switch': st.switchLocked = false; O.emit('switch'); break;
        case 'kiki': O.Script.COMMANDS.show('kiki'); st.together = true; break;
        case 'flag': {
          const [k, val] = O.$('#dbg-flag').value.split('=');
          if (k) O.State.setFlag(k.trim(), val === undefined ? true : /^\d+$/.test(val) ? Number(val) : val === 'false' ? false : val);
          break;
        }
        case 'ending': O.$('#debug').classList.remove('on'); return O.Endings.choose();
        case 'solve': O.Puzzles.autoSolve(); break;
        case 'hotspots': O.Scene.world.classList.toggle('debug-hotspots'); break;
        case 'walk': this.drawWalk(); break;
        case 'reset':
          if (confirm('Cancellare tutti i salvataggi e il profilo?')) {
            O.Save.wipeAll();
            location.reload();
          }
          return;
        case 'assets': console.table(O.Assets.report().missingRequested); alert('Asset richiesti ma mancanti: ' + O.Assets.report().missingRequested.length + ' (vedi console)'); break;
      }
      O.Scene.refresh();
      O.Inventory.render();
      O.UI.updateSwitch();
      this.render();
    },

    drawWalk() {
      const sc = O.Scene.current;
      const old = O.$('#dbg-walk');
      if (old) return old.remove();
      const poly = O.Movement.polygon(sc, O.State.d.active);
      if (!poly) return;
      const svg = `<svg id="dbg-walk" viewBox="0 0 ${O.W} ${O.H}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5000"><polygon points="${poly.map((p) => p.join(',')).join(' ')}" fill="rgba(0,255,120,.15)" stroke="#0f8" stroke-width="3"/>${O.Movement.obstacles(sc, O.State.d.active).map((o) => `<polygon points="${o.map((p) => p.join(',')).join(' ')}" fill="rgba(255,60,60,.3)" stroke="#f44" stroke-width="3"/>`).join('')}</svg>`;
      O.Scene.world.insertAdjacentHTML('beforeend', svg);
    },

    /** Build a plausible state for the start of chapter n (uses chapters.json debugStart). */
    async chapterPreset(n) {
      const ch = O.Data.chapters.chapters.find((c) => c.id === n);
      const p = ch.debugStart || {};
      O.State.reset();
      const st = O.State.d;
      st.chapter = n;
      (p.items || []).forEach((i) => O.State.give(i));
      Object.assign(st.flags, p.flags || {});
      Object.assign(st.stats, p.stats || {});
      (p.solved || []).forEach((id) => O.Puzzles.markSolved(id));
      (p.clues || []).forEach((c) => O.State.addClue(c));
      st.switchLocked = !!p.switchLocked;
      st.chars.kiki.present = p.kiki !== false;
      st.together = true;
      st.chars.beps.scene = p.scene;
      st.chars.kiki.scene = p.kiki !== false ? p.scene : null;
      st.active = p.active || 'beps';
      if (p.objective) st.objective = p.objective;
      O.Inventory.render();
      await O.Scene.go(p.scene, { at: p.at });
    }
  };

  function escape(s) {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  O.Debug = Debug;
})();
