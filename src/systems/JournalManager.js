/* JournalManager — Taccuino: objectives, clues, people, Lista dei 17,
 * Archivio Orfeo (collectibles), relationship and story so far. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const TABS = [
    ['obiettivi', 'Obiettivi'],
    ['indizi', 'Indizi'],
    ['persone', 'Persone'],
    ['lista', 'Lista dei 17'],
    ['archivio', 'Archivio Orfeo'],
    ['noi', 'Noi due'],
    ['storia', 'Capitoli']
  ];

  const Journal = {
    tab: 'obiettivi',

    clue(id) {
      return ((O.Data.chapters.clues || {})[id]) || null;
    },
    objective() {
      const id = O.State.d.objective;
      return id ? (O.Data.chapters.objectives || {})[id] || { text: id } : null;
    },
    setObjective(id) {
      const st = O.State.d;
      if (st.objective === id) return;
      if (st.objective) st.objectiveLog.push(st.objective);
      st.objective = id;
      const o = this.objective();
      O.emit('objective', o);
      if (o) O.emit('toast', { text: 'Obiettivo: ' + o.text, kind: 'objective' });
    },
    addPerson(id) {
      O.State.d.people[id] = true;
    },

    tabs() {
      const st = O.State.d;
      return TABS.filter(([k]) => {
        if (k === 'lista') return st.flags.lista_seen || O.State.has('lista17');
        if (k === 'noi') return st.flags.met_kiki;
        return true;
      });
    },

    render(container) {
      const st = O.State.d;
      const tabs = this.tabs();
      if (!tabs.find((t) => t[0] === this.tab)) this.tab = 'obiettivi';
      container.innerHTML = O.UI.bookHTML('journal');
      const left = O.el('div.j-index');
      left.appendChild(O.el('h3', { text: 'Appunti di viaggio' }));
      const nav = O.el('nav.j-tabs');
      tabs.forEach(([k, label]) => {
        const b = O.el('button', { text: label, class: k === this.tab ? 'on' : null });
        b.onclick = () => {
          this.tab = k;
          O.Audio.sfx('page');
          this.render(container);
        };
        nav.appendChild(b);
      });
      left.appendChild(nav);
      container.appendChild(left);
      const body = O.el('div.j-body');
      container.appendChild(body);
      const fn = this['tab_' + this.tab];
      body.innerHTML = fn ? fn.call(this, st) : '';
      O.$$('[data-col]', body).forEach((el) =>
        el.addEventListener('click', () => {
          const c = O.Collectibles.get(el.dataset.col);
          if (c && st.collectibles[c.id]) O.UI.showCollectible(c);
        })
      );
    },

    tab_obiettivi(st) {
      const o = this.objective();
      const ch = (O.Data.chapters.chapters || []).find((c) => c.id === st.chapter) || {};
      let h = `<h3>Capitolo ${roman(st.chapter)} · ${ch.title || ''}</h3>`;
      h += o ? `<p class="j-current">◆ ${o.text}</p>` : '<p class="j-current">Esplora.</p>';
      const done = st.objectiveLog.slice(-12).reverse();
      if (done.length) h += '<h4>Completati</h4><ul class="j-done">' + done.map((id) => `<li>${((O.Data.chapters.objectives || {})[id] || { text: id }).text}</li>`).join('') + '</ul>';
      h += `<p class="j-tip">Suggerimento: il pulsante <b>?</b> offre tre livelli di aiuto. <b>Spazio</b> (o l'occhio) evidenzia i punti interattivi.</p>`;
      return h;
    },

    tab_indizi(st) {
      if (!st.clueOrder.length) return '<p>Nessun indizio, per ora.</p>';
      const byCh = {};
      st.clueOrder.forEach((id) => {
        const c = this.clue(id);
        if (!c) return;
        (byCh[c.chapter || 0] = byCh[c.chapter || 0] || []).push(c);
      });
      return Object.keys(byCh)
        .sort((a, b) => b - a)
        .map((k) => `<h4>Capitolo ${roman(Number(k))}</h4>` + byCh[k].map((c) => `<div class="j-clue${c.evidence ? ' evidence' : ''}"><b>${c.title}</b><p>${c.text}</p></div>`).join(''))
        .join('');
    },

    tab_persone(st) {
      const chars = O.Data.characters.characters || {};
      const known = Object.keys(chars).filter((id) => chars[id].journal && (st.people[id] || (chars[id].protagonist && (id === 'beps' || st.flags.met_kiki))));
      if (!known.length) return '<p>Nessuno.</p>';
      return known
        .map((id) => {
          const c = chars[id];
          const entries = (c.journal || []).filter((j) => O.cond(j.if)).map((j) => `<p>${O.Script.format(j.text)}</p>`).join('');
          const portrait = O.UI.portraitHTML(id, 'neutral');
          return `<div class="j-person"><div class="j-face">${portrait}</div><div><b>${O.Characters.displayName(id)}</b>${c.role ? `<i>${c.role}</i>` : ''}${entries}</div></div>`;
        })
        .join('');
    },

    tab_lista(st) {
      const roles = O.Data.chapters.roles || [];
      const full = O.State.has('lista17') || st.flags.lista_full;
      let h = '<p class="j-intro">LISTA_17 — i diciassette ruoli di Orfeo e chi li ha custoditi.</p><ol class="j-roles">';
      roles.forEach((r, i) => {
        const known = full || (r.early && st.flags.lista_seen);
        const erased = r.erased && !st.flags.erased_role_known;
        h += `<li class="${r.erased ? 'erased' : ''}"><span class="rn">${roman(i + 1)}</span> ${known ? (erased ? '<s>█████████</s> <em>(nome raschiato)</em>' : `<b>${r.name}</b> — ${r.desc}`) : '<em>illeggibile</em>'}${known && !erased && r.holders && st.chapter >= (r.holdersChapter || 3) ? `<small>${r.holders}</small>` : ''}</li>`;
      });
      h += '</ol>';
      if (st.flags.knows_18) h += '<p class="j-18">Sul retro, a matita, un diciottesimo numero: <b>XVIII</b>. Nessun nome. Uno spazio largo il doppio degli altri.</p>';
      return h;
    },

    tab_archivio(st) {
      let h = '';
      Object.entries(O.Collectibles.TYPES).forEach(([type, T]) => {
        const all = O.Collectibles.all(type);
        const n = O.Collectibles.count(type);
        h += `<h4>${T.label} <span class="cnt">${n}/${T.total}</span></h4><div class="j-grid">`;
        all.forEach((c) => {
          const got = st.collectibles[c.id];
          h += `<button class="j-col ${got ? 'got' : ''}" data-col="${c.id}" ${got ? '' : 'disabled'} title="${got ? c.title : 'Non ancora trovato'}"><span>${got ? c.title : '· · ·'}</span><small>Cap. ${roman(c.chapter || 1)}</small></button>`;
        });
        h += '</div>';
      });
      return h;
    },

    tab_noi() {
      const W = O.Relationship.words;
      const row = (k, label) => `<div class="j-rel"><b>${label}</b><span>${O.Relationship.describe(k)}</span><div class="j-meter">${[0, 1, 2, 3, 4].map((i) => `<i class="${i <= O.Relationship.level(k) ? 'on' : ''}"></i>`).join('')}</div></div>`;
      return `<p>${O.Relationship.summary()}</p>` + row('fiducia', 'Fiducia') + row('legame', 'Legame') + row('conoscenza', 'Conoscenza') + (W ? '' : '');
    },

    tab_storia(st) {
      return (O.Data.chapters.chapters || [])
        .filter((c) => c.id <= st.chapter)
        .map((c) => `<div class="j-ch"><h4>${roman(c.id)} · ${c.title}</h4><i>${c.location} — ${c.relationship}</i><p>${c.summary || c.core}</p></div>`)
        .join('');
    }
  };

  function roman(n) {
    const r = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];
    return r[n] || String(n);
  }
  O.roman = roman;
  O.Journal = Journal;
})();
