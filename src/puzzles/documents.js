/* Document puzzles: fragments (Cap.1), chain O-17 (Cap.1), timeline (Cap.6). */
(function () {
  'use strict';
  const O = window.Orfeo;
  const T = (O.PuzzleTypes = O.PuzzleTypes || {});

  /* ------------------------------------------------------------------
   * FRAGMENTS — reorder torn strips. Tap a strip, tap another: swap.
   * Matching torn edges + continuous text make the order deducible.
   * def: {pieces:[{id,text}], solution:[ids], initial:[ids]}
   * ------------------------------------------------------------------ */
  T.fragments = {
    create(body, def, api) {
      const sol = def.solution;
      let order = (api.state && api.state.order) || def.initial.slice();
      let sel = null;
      const wrap = O.el('div.pz-fragments');
      const hint = O.el('p.pz-help', { text: 'Tocca due strisce per scambiarle. I bordi strappati devono combaciare e il testo deve scorrere.' });
      body.append(hint, wrap);
      const edge = (code, flip) => {
        // jagged edge path from a numeric code (same code = matching edges)
        const r = O.Art.rng('edge' + code);
        let d = `M0 ${flip ? 0 : 14}`;
        for (let x = 0; x <= 100; x += 5) d += ` L${x} ${7 + (r() - 0.5) * 12}`;
        d += ` L100 ${flip ? 0 : 14} Z`;
        return `<svg viewBox="0 0 100 14" preserveAspectRatio="none" class="edge ${flip ? 'top' : 'bottom'}"><path d="${d}" fill="#e9dfc6"/></svg>`;
      };
      const render = () => {
        wrap.innerHTML = '';
        order.forEach((id, i) => {
          const p = def.pieces.find((x) => x.id === id);
          const si = sol.indexOf(id);
          const strip = O.el('button.strip', { 'data-id': id, html: (si > 0 ? edge(si, true) : '') + `<span>${p.text}</span>` + (si < sol.length - 1 ? edge(si + 1, false) : '') });
          if (sel === i) strip.classList.add('sel');
          strip.onclick = () => this.tap(i);
          wrap.appendChild(strip);
        });
      };
      this.tap = (i) => {
        if (sel === null) {
          sel = i;
          O.Audio.sfx('page');
        } else {
          if (sel !== i) [order[sel], order[i]] = [order[i], order[sel]];
          sel = null;
          api.save({ order });
          check();
        }
        render();
      };
      const check = () => {
        const ok = order.every((id, i) => id === sol[i]);
        const right = order.filter((id, i) => id === sol[i]).length;
        if (ok) api.solve(def.successText);
        else if (right >= sol.length - 2) api.status('Ci sei quasi: il testo scorre quasi tutto.', '');
        else api.status('');
      };
      render();
      check();
      return {
        auto: () => {
          for (let i = 0; i < sol.length; i++) {
            const j = order.indexOf(sol[i]);
            if (j !== i) {
              this.tap(i);
              this.tap(j);
            }
          }
        },
        destroy() {}
      };
    }
  };

  /* ------------------------------------------------------------------
   * CHAIN — follow the catalogue references from O-1 to O-17.
   * def: {cards:{id:{title,author,year,red,note,smudged}}, solution:[ids]}
   * ------------------------------------------------------------------ */
  T.chain = {
    create(body, def, api) {
      const sol = def.solution;
      let chain = (api.state && api.state.chain) || [];
      let viewing = chain[chain.length - 1] || sol[0];
      const ids = Object.keys(def.cards);
      const top = O.el('div.pz-chain-bar');
      const grid = O.el('div.pz-drawer-grid');
      const card = O.el('div.pz-card');
      body.append(O.el('p.pz-help', { text: 'Sfoglia le schede. Aggiungi alla catena solo la scheda richiamata dall\'ultima: si parte da O-1.' }), top, O.el('div.pz-chain-main', null, [grid, card]));
      const render = () => {
        top.innerHTML = '<b>Catena:</b> ' + (chain.length ? chain.map((c) => `<span class="link">${c}</span>`).join(' → ') : '<em>vuota</em>');
        if (chain.length) {
          const r = O.el('button.pz-small', { text: 'Ricomincia' });
          r.onclick = () => {
            chain = [];
            api.save({ chain });
            render();
          };
          top.appendChild(r);
        }
        grid.innerHTML = '';
        ids.forEach((id) => {
          const b = O.el('button.tab', { text: id, class: (id === viewing ? 'on ' : '') + (chain.includes(id) ? 'in' : '') });
          b.onclick = () => this.view(id);
          grid.appendChild(b);
        });
        const c = def.cards[viewing];
        card.innerHTML = `<div class="cardno">${viewing}</div><div class="ctitle">${c.title}</div><div class="cmeta">${c.author || ''} · ${c.year || ''}</div>` +
          `<div class="cref ${c.smudged ? 'smudged' : ''}">${c.smudged ? '<span class="blot"></span>' : ''}${c.redText || (c.red ? 'Vedi anche → ' + c.red : '')}</div>` +
          (c.note ? `<div class="cnote">${c.note}</div>` : '');
        const add = O.el('button.pz-btn', { text: chain.includes(viewing) ? 'Già nella catena' : 'Aggiungi alla catena' });
        add.disabled = chain.includes(viewing);
        add.onclick = () => this.add(viewing);
        card.appendChild(add);
      };
      this.view = (id) => {
        viewing = id;
        O.Audio.sfx('drawer');
        render();
      };
      this.add = (id) => {
        const expected = sol[chain.length];
        if (id !== expected) {
          api.error(chain.length === 0 ? 'La catena parte da O-1.' : `${chain[chain.length - 1]} non rimanda a ${id}. Rileggi il rimando (o la nota) della scheda precedente.`);
          return;
        }
        chain.push(id);
        api.save({ chain });
        if (chain.length === sol.length) api.solve(def.successText);
        else api.good(`${id} aggiunta.`);
        render();
      };
      render();
      return {
        auto: () => sol.slice(chain.length).forEach((id) => (this.view(id), this.add(id))),
        destroy() {}
      };
    }
  };

  /* ------------------------------------------------------------------
   * TIMELINE — order documents chronologically, then flag the
   * contradictions (forgeries). Feedback reports how many are right.
   * def: {docs:[{id,title,text,date}], solution:[ids], forgeries:[ids]}
   * ------------------------------------------------------------------ */
  T.timeline = {
    create(body, def, api) {
      const st = api.state || {};
      let order = st.order || def.initial.slice();
      let flagged = new Set(st.flagged || []);
      let sel = null;
      const list = O.el('div.pz-timeline');
      const check = O.el('button.pz-btn', { text: 'Verifica la cronologia' });
      body.append(O.el('p.pz-help', { html: 'Ordina i documenti dal più antico al più recente (tocca due documenti per scambiarli). Poi segna con <b>⚠</b> i due che <b>contraddicono</b> i fatti.' }), list, check);
      const save = () => api.save({ order, flagged: Array.from(flagged) });
      const render = () => {
        list.innerHTML = '';
        order.forEach((id, i) => {
          const d = def.docs.find((x) => x.id === id);
          const row = O.el('div.tl-doc', { class: (sel === i ? 'sel ' : '') + (flagged.has(id) ? 'flag' : '') });
          const main = O.el('button.tl-main', { html: `<span class="tl-n">${i + 1}</span><b>${d.title}</b><p>${d.text}</p>` });
          main.onclick = () => this.tap(i);
          const f = O.el('button.tl-flag', { text: flagged.has(id) ? '⚠ Contraddizione' : 'Segna ⚠', title: 'Segna come contraddittorio' });
          f.onclick = () => this.flag(id);
          row.append(main, f);
          list.appendChild(row);
        });
      };
      this.tap = (i) => {
        if (sel === null) sel = i;
        else {
          if (sel !== i) [order[sel], order[i]] = [order[i], order[sel]];
          sel = null;
          save();
        }
        render();
      };
      this.flag = (id) => {
        if (flagged.has(id)) flagged.delete(id);
        else flagged.add(id);
        save();
        render();
      };
      this.verify = () => {
        const right = order.filter((id, i) => id === def.solution[i]).length;
        const fOk = def.forgeries.every((f) => flagged.has(f)) && flagged.size === def.forgeries.length;
        if (right === def.solution.length && fOk) return api.solve(def.successText);
        if (right < def.solution.length) return api.error(`${right} documenti su ${def.solution.length} sono al posto giusto.`);
        if (flagged.size === 0) return api.error('La cronologia è giusta. Ora: quali due documenti dicono qualcosa che non può essere vero?');
        const goodFlags = def.forgeries.filter((f) => flagged.has(f)).length;
        return api.error(`Cronologia esatta. Delle contraddizioni segnate, ${goodFlags} su ${flagged.size} sono vere; ne servono ${def.forgeries.length}.`);
      };
      check.onclick = () => this.verify();
      render();
      return {
        auto: () => {
          for (let i = 0; i < def.solution.length; i++) {
            const j = order.indexOf(def.solution[i]);
            if (j !== i) (this.tap(i), this.tap(j));
          }
          Array.from(flagged).forEach((f) => !def.forgeries.includes(f) && this.flag(f));
          def.forgeries.forEach((f) => !flagged.has(f) && this.flag(f));
          this.verify();
        },
        destroy() {}
      };
    }
  };
})();
