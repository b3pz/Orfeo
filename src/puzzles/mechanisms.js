/* Mechanism puzzles: 17 drawers (Cap.3) and the Register of the
 * Seventeen (Cap.7 final mechanism, with the hidden 18th slot). */
(function () {
  'use strict';
  const O = window.Orfeo;
  const T = (O.PuzzleTypes = O.PuzzleTypes || {});

  /* ------------------------------------------------------------------
   * DRAWERS — 17 drawers, each with a role emblem. Open the four
   * founders in the order of their oath (plaque + Lista).
   * def: {drawers:[{id, emblem, label}], solution:[ids], plaque}
   * ------------------------------------------------------------------ */
  T.drawers = {
    create(body, def, api) {
      let seq = [];
      const box = O.el('div.pz-drawers');
      const alt = (def.plaqueIf || []).find((p) => api.cond(p.if));
      const plaque = O.el('div.pz-plaque', { html: alt ? alt.text : def.plaque });
      body.append(plaque, box);
      const render = () => {
        box.innerHTML = '';
        def.drawers.forEach((d) => {
          const b = O.el('button.drawer', { 'data-id': d.id, class: (seq.includes(d.id) ? 'open ' : '') + (d.erased ? 'erased' : ''), title: d.label });
          b.innerHTML = `<span class="emb">${d.emblem}</span><span class="knob"></span>`;
          b.onclick = () => this.pull(d.id);
          box.appendChild(b);
        });
      };
      this.pull = (id) => {
        const d = def.drawers.find((x) => x.id === id);
        if (d.erased) {
          api.status('Questo cassetto non ha maniglia: l\'emblema è stato raschiato via. Non si apre.', '');
          O.Audio.sfx('fail');
          return;
        }
        if (seq.includes(id)) return;
        const expected = def.solution[seq.length];
        O.Audio.sfx('drawer');
        if (id !== expected) {
          seq = [];
          render();
          return api.error('Clac. Un meccanismo interno richiude tutti i cassetti. L\'ordine non è quello giusto.');
        }
        seq.push(id);
        render();
        if (seq.length === def.solution.length) api.solve(def.successText);
        else api.good(['Il cassetto resta aperto. Un clic, da qualche parte.', 'Un altro scatto. Resta aperto.', 'Tre su quattro. Qualcosa, dietro, si muove.'][seq.length - 1]);
      };
      render();
      return { auto: () => def.solution.forEach((id) => this.pull(id)), destroy() {} };
    }
  };

  /* ------------------------------------------------------------------
   * REGISTER — the wheel of the Seventeen in the final chamber.
   * Restore the erased XVII role by choosing its emblem; if the
   * players know about XVIII (all 7 symbols + clue) an 18th slot
   * appears where two names can be written together.
   * def: {options:[{id,emblem,label}], solution:id, eighteenth:{if}}
   * ------------------------------------------------------------------ */
  T.register = {
    create(body, def, api) {
      const st = api.state || {};
      let chosen = st.chosen || null;
      let wrote18 = !!st.wrote18;
      const roles = (O.Data.chapters.roles || []).slice(0, 16);
      const show18 = api.cond(def.eighteenth && def.eighteenth.if);
      const wheel = O.el('div.pz-register');
      const opts = O.el('div.reg-opts');
      body.append(O.el('p.pz-help', { html: 'Sedici ruoli sono incisi nella ruota. Il diciassettesimo è stato raschiato. Restituiscigli il suo emblema.' }), wheel, opts);
      const render = () => {
        const n = show18 ? 18 : 17;
        let s = '<svg viewBox="-220 -220 440 440"><circle r="210" fill="#3a2c18" stroke="#c9a85a" stroke-width="3"/><circle r="120" fill="#2a2010" stroke="#8a6a3a"/>';
        for (let i = 0; i < n; i++) {
          const a = ((i * 360) / n - 90) * (Math.PI / 180);
          const x = Math.cos(a) * 165, y = Math.sin(a) * 165;
          let label = roles[i] ? roles[i].emblem : '';
          let cls = '#e8d8b0';
          if (i === 16) {
            label = chosen ? def.options.find((o) => o.id === chosen).emblem : '✕';
            cls = chosen === def.solution ? '#ffe9a8' : '#a8231f';
          }
          if (i === 17) {
            label = wrote18 ? '♡' : '·';
            cls = '#ffd0c0';
          }
          s += `<text x="${x}" y="${y + 9}" text-anchor="middle" font-size="${i === 17 ? 30 : 24}" fill="${cls}">${label}</text><text x="${Math.cos(a) * 196}" y="${Math.sin(a) * 196 + 4}" text-anchor="middle" font-size="11" fill="#a8946a">${O.roman(i + 1)}</text>`;
        }
        s += `${O.Art.lyre(0, 4, 50, '#c9a85a')}</svg>`;
        wheel.innerHTML = s;
        opts.innerHTML = '<b>Emblema per il Ruolo XVII:</b>';
        def.options.forEach((o) => {
          const b = O.el('button.pz-small', { html: `${o.emblem} ${o.label}`, class: chosen === o.id ? 'on' : '' });
          b.onclick = () => this.choose(o.id);
          opts.appendChild(b);
        });
        if (show18) {
          const b = O.el('button.pz-btn.reg18', { text: wrote18 ? 'XVIII: due nomi, scritti insieme' : 'XVIII — scrivi nello spazio vuoto' });
          b.disabled = chosen !== def.solution || wrote18;
          b.onclick = () => this.write18();
          opts.appendChild(b);
          const done = O.el('button.pz-btn', { text: 'Chiudi il registro' });
          done.disabled = chosen !== def.solution;
          done.onclick = () => api.solve(wrote18 ? def.successText18 : def.successText);
          opts.appendChild(done);
        }
      };
      this.choose = (id) => {
        chosen = id;
        api.save({ chosen, wrote18 });
        O.Audio.sfx('mechanism');
        render();
        if (id !== def.solution) return api.error(def.options.find((o) => o.id === id).wrong || 'La ruota si blocca. Non è quel ruolo.');
        if (!show18) api.solve(def.successText);
        else api.good('La ruota scatta. E, accanto al XVII, compare un diciottesimo spazio vuoto, largo il doppio.');
      };
      this.write18 = () => {
        wrote18 = true;
        O.State.setFlag('eighteenth_written');
        api.save({ chosen, wrote18 });
        O.Audio.sfx('heart');
        render();
        api.good('Due nomi, una sola riga.');
      };
      render();
      return {
        auto: (opts2) => {
          this.choose(def.solution);
          if (show18 && opts2 !== 'no18') {
            this.write18();
            api.solve(def.successText18);
          } else if (show18) api.solve(def.successText);
        },
        destroy() {}
      };
    }
  };
})();
