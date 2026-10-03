/* Visual puzzles: overlay (Cap.2), dial medallion/map (Cap.2),
 * seal assembly (Cap.4), rotating rings (Cap.5). */
(function () {
  'use strict';
  const O = window.Orfeo;
  const T = (O.PuzzleTypes = O.PuzzleTypes || {});

  function photoHTML(kind, opts) {
    const img = O.Assets.first(`assets/puzzles/${kind}.png`, `assets/puzzles/${kind}.jpg`);
    return img ? `<img src="${img}" alt="">` : O.Art.photo(kind, opts);
  }

  /* ------------------------------------------------------------------
   * OVERLAY — align Foto 1967 (transparent) over Foto 1944 using the
   * registration crosses. Drag or use buttons. Tolerance is generous.
   * ------------------------------------------------------------------ */
  T.overlay = {
    create(body, def, api) {
      const s = Object.assign({ dx: 70, dy: -45, rot: 14, sc: 0.82 }, def.start || {}, api.state || {});
      const tol = def.tolerance || { d: 9, rot: 2.5, sc: 0.035 };
      const stage = O.el('div.pz-overlay');
      const base = O.el('div.ov-base', { html: photoHTML('photo1944', { half: 'left' }) });
      const top = O.el('div.ov-top', { html: photoHTML('photo1967', { half: 'right' }) });
      stage.append(base, top);
      const ctr = O.el('div.pz-controls');
      const mk = (label, fn, title) => {
        const b = O.el('button.pz-small', { text: label, title: title || label });
        b.onclick = () => fn();
        ctr.appendChild(b);
      };
      body.append(O.el('p.pz-help', { text: 'Sovrapponi la foto del 1967 a quella del 1944: trascinala, ruotala e scalala finché i crocini rossi coincidono.' }), stage, ctr);
      const apply = () => {
        top.style.transform = `translate(${s.dx / 8}%, ${s.dy / 5.6}%) rotate(${s.rot}deg) scale(${s.sc})`;
        api.save(s);
        const ok = Math.abs(s.dx) <= tol.d && Math.abs(s.dy) <= tol.d && Math.abs(s.rot) <= tol.rot && Math.abs(s.sc - 1) <= tol.sc;
        const close = Math.abs(s.dx) <= tol.d * 3 && Math.abs(s.dy) <= tol.d * 3 && Math.abs(s.rot) <= tol.rot * 3 && Math.abs(s.sc - 1) <= tol.sc * 3;
        stage.classList.toggle('close', close && !ok);
        if (ok) {
          Object.assign(s, { dx: 0, dy: 0, rot: 0, sc: 1 });
          top.style.transform = 'none';
          stage.classList.add('aligned');
          api.solve(def.successText);
        } else api.status(close ? 'Quasi: i crocini sono vicinissimi.' : '');
      };
      this.move = (dx, dy) => ((s.dx += dx), (s.dy += dy), apply());
      this.rotate = (d) => ((s.rot = Math.round((s.rot + d) * 10) / 10), apply());
      this.scale = (d) => ((s.sc = Math.round((s.sc + d) * 1000) / 1000), apply());
      mk('←', () => this.move(-5, 0), 'Sinistra');
      mk('→', () => this.move(5, 0), 'Destra');
      mk('↑', () => this.move(0, -5), 'Su');
      mk('↓', () => this.move(0, 5), 'Giù');
      mk('⟲', () => this.rotate(-2), 'Ruota a sinistra');
      mk('⟳', () => this.rotate(2), 'Ruota a destra');
      mk('−', () => this.scale(-0.02), 'Riduci');
      mk('+', () => this.scale(0.02), 'Ingrandisci');
      // drag
      let drag = null;
      top.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY };
        top.setPointerCapture(e.pointerId);
      });
      top.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const r = stage.getBoundingClientRect();
        const k = 800 / r.width;
        s.dx += (e.clientX - drag.x) * k;
        s.dy += (e.clientY - drag.y) * k;
        drag = { x: e.clientX, y: e.clientY };
        top.style.transform = `translate(${s.dx / 8}%, ${s.dy / 5.6}%) rotate(${s.rot}deg) scale(${s.sc})`;
      });
      top.addEventListener('pointerup', () => {
        drag = null;
        apply();
      });
      stage.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.shiftKey) this.rotate(e.deltaY > 0 ? 1 : -1);
        else this.scale(e.deltaY > 0 ? -0.01 : 0.01);
      }, { passive: false });
      apply();
      return {
        auto: () => {
          this.move(-s.dx, -s.dy);
          this.rotate(-s.rot);
          this.scale(1 - s.sc);
        },
        destroy() {}
      };
    }
  };

  /* ------------------------------------------------------------------
   * DIAL — rotate the medallion on the ciphered map: its holes reveal
   * letters. The notch must point to the star (clue on Foto 1967).
   * def: {positions: 8, solution: n, readings: [strings]}
   * ------------------------------------------------------------------ */
  T.dial = {
    create(body, def, api) {
      const n = def.positions || 8;
      let r = api.state && api.state.r != null ? api.state.r : def.start || 0;
      const box = O.el('div.pz-dial');
      const map = O.Assets.first('assets/puzzles/mappa_cifrata.png');
      const starAngle = (def.solution * 360) / n;
      box.innerHTML = `<div class="dial-map">${map ? `<img src="${map}" alt="">` : mapSVG(def, starAngle)}</div><div class="dial-med"></div><div class="dial-read"></div>`;
      const med = O.$('.dial-med', box), read = O.$('.dial-read', box);
      med.innerHTML = `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#c9a85a" opacity=".92"/><circle cx="100" cy="100" r="80" fill="none" stroke="#8a6a2a" stroke-width="4"/>${O.Art.lyre(100, 104, 34, '#6a4a1a')}<polygon points="100,2 90,22 110,22" fill="#5a1a10"/>${Array.from({ length: 10 }, (_, i) => `<circle cx="${100 + Math.cos(-Math.PI / 2 + 0.5 + i * 0.25) * 64}" cy="${100 + Math.sin(-Math.PI / 2 + 0.5 + i * 0.25) * 64}" r="6" fill="#1a1208"/>`).join('')}</svg>`;
      const ctr = O.el('div.pz-controls');
      const l = O.el('button.pz-small', { text: '⟲ Ruota' }), rr = O.el('button.pz-small', { text: 'Ruota ⟳' });
      ctr.append(l, rr);
      body.append(O.el('p.pz-help', { text: 'Ruota il medaglione sulla mappa. Attraverso i fori compaiono delle lettere.' }), box, ctr);
      const apply = () => {
        med.style.transform = `rotate(${(r * 360) / n}deg)`;
        read.textContent = def.readings[r];
        api.save({ r });
        if (r === def.solution) api.solve(def.successText);
        else api.status('');
      };
      this.turn = (d) => {
        r = (r + d + n) % n;
        O.Audio.sfx('mechanism');
        apply();
      };
      l.onclick = () => this.turn(-1);
      rr.onclick = () => this.turn(1);
      apply();
      return { auto: () => { while (r !== def.solution) this.turn(1); }, destroy() {} };
    }
  };

  function mapSVG(def, starAngle) {
    const r = O.Art.rng('mappa');
    let s = '<svg viewBox="0 0 200 200"><rect width="200" height="200" fill="#d8c79b"/>';
    for (let i = 0; i < 14; i++) s += `<path d="M${r() * 200} ${r() * 200} Q${r() * 200} ${r() * 200} ${r() * 200} ${r() * 200}" stroke="#a89a6a" fill="none"/>`;
    s += '<path d="M10 150 Q60 120 100 140 T190 110" stroke="#5a7a9a" stroke-width="5" fill="none" opacity=".6"/>';
    const a = ((starAngle - 90) * Math.PI) / 180;
    s += `<text x="${100 + Math.cos(a) * 96 - 7}" y="${100 + Math.sin(a) * 96 + 6}" font-size="18" fill="#a8231f">★</text>`;
    s += '<text x="8" y="194" font-size="9" fill="#5a4a2a" font-family="Georgia">ITALIA · 1:2.000.000 · ORFEO</text></svg>';
    return s;
  }

  /* ------------------------------------------------------------------
   * SEAL — place 4 fragments in the 2×2 matrix and rotate them so the
   * rim inscription ORFEO · NON · VOLTARTI reads around the circle.
   * ------------------------------------------------------------------ */
  T.seal = {
    create(body, def, api) {
      const st = api.state || {};
      // slots[q] = {piece, rot}
      let slots = st.slots || [null, null, null, null];
      let tray = st.tray || ['B', 'D', 'A', 'C'];
      const rot0 = def.startRot || { A: 1, B: 2, C: 3, D: 1 };
      let rots = st.rots || Object.assign({}, rot0);
      let picked = null;
      const map = { A: 0, B: 1, C: 2, D: 3 }; // piece → correct slot (TL, TR, BR, BL)
      const box = O.el('div.pz-seal');
      const grid = O.el('div.seal-grid');
      const trayEl = O.el('div.seal-tray');
      box.append(grid, trayEl);
      body.append(O.el('p.pz-help', { html: 'Scegli un frammento, poi una casella. Tocca un frammento già posato per ruotarlo; il pulsante ⤺ lo rimette sul banco. L\'iscrizione sul bordo deve leggersi in senso orario.' }), box);
      const save = () => api.save({ slots, tray, rots });
      const pieceSVG = (p) => {
        const q = map[p];
        const img = O.Assets.first(`assets/puzzles/sigillo_${p}.png`);
        if (img) return `<img src="${img}" alt="">`;
        const words = ['ORFEO', 'NON', 'VOL', 'TARTI'];
        // quadrant geometry inside a 100x100 cell: centre of the seal at the inner corner
        const cx = [100, 0, 0, 100][q], cy = [100, 100, 0, 0][q];
        const a0 = [180, 270, 0, 90][q];
        const arc = (R) => {
          const p1 = [cx + R * Math.cos((a0 * Math.PI) / 180), cy + R * Math.sin((a0 * Math.PI) / 180)];
          const p2 = [cx + R * Math.cos(((a0 + 90) * Math.PI) / 180), cy + R * Math.sin(((a0 + 90) * Math.PI) / 180)];
          return { p1, p2 };
        };
        const o = arc(96), i = arc(78);
        const tid = 'arc' + p + O.uid();
        return `<svg viewBox="0 0 100 100"><path d="M${cx} ${cy} L${o.p1[0]} ${o.p1[1]} A96 96 0 0 1 ${o.p2[0]} ${o.p2[1]} Z" fill="#8a2a20"/><path id="${tid}" d="M${arc(85).p1[0]} ${arc(85).p1[1]} A85 85 0 0 1 ${arc(85).p2[0]} ${arc(85).p2[1]}" fill="none"/><path d="M${i.p1[0]} ${i.p1[1]} A78 78 0 0 1 ${i.p2[0]} ${i.p2[1]}" fill="none" stroke="#c9a85a" stroke-width="2"/><text font-size="11" fill="#f0d890" font-family="Georgia" letter-spacing="2"><textPath href="#${tid}" startOffset="18%">${words[q]}</textPath></text><g opacity=".9">${O.Art.lyre(cx + (q === 0 || q === 3 ? -36 : 36), cy + (q < 2 ? -36 : 36), 18, '#e0c070')}</g></svg>`;
      };
      const render = () => {
        grid.innerHTML = '';
        slots.forEach((sl, i) => {
          const cell = O.el('button.seal-cell', { 'data-slot': i });
          if (sl) {
            cell.innerHTML = `<div class="piece" style="transform:rotate(${rots[sl] * 90}deg)">${pieceSVG(sl)}</div>`;
            const back = O.el('span.back', { text: '⤺', title: 'Rimetti sul banco' });
            back.onclick = (e) => {
              e.stopPropagation();
              this.unplace(i);
            };
            cell.appendChild(back);
          } else cell.classList.add('empty');
          cell.onclick = () => this.clickSlot(i);
          grid.appendChild(cell);
        });
        trayEl.innerHTML = '';
        tray.forEach((p) => {
          const b = O.el('button.seal-piece', { html: `<div class="piece" style="transform:rotate(${rots[p] * 90}deg)">${pieceSVG(p)}</div>`, class: picked === p ? 'on' : '' });
          b.onclick = () => {
            picked = picked === p ? null : p;
            render();
          };
          trayEl.appendChild(b);
        });
        if (!tray.length) trayEl.appendChild(O.el('span.pz-help', { text: 'Tutti i frammenti sono posati.' }));
      };
      const check = () => {
        const full = slots.every(Boolean);
        if (!full) return api.status('');
        const ok = slots.every((p, i) => map[p] === i && rots[p] % 4 === 0);
        if (ok) api.solve(def.successText);
        else {
          const wrongPlace = slots.filter((p, i) => map[p] !== i).length;
          api.error(wrongPlace ? 'Le linee della lira non si raccordano: qualche frammento è nella casella sbagliata.' : 'Posizioni giuste, ma qualche frammento è ruotato: l\'iscrizione deve stare sul bordo esterno.');
        }
      };
      this.place = (p, i) => {
        if (slots[i]) tray.push(slots[i]);
        slots[i] = p;
        tray = tray.filter((x) => x !== p);
        picked = null;
        O.Audio.sfx('click');
        save();
        render();
        check();
      };
      this.unplace = (i) => {
        if (!slots[i]) return;
        tray.push(slots[i]);
        slots[i] = null;
        save();
        render();
      };
      this.rotate = (p) => {
        rots[p] = (rots[p] + 1) % 4;
        O.Audio.sfx('mechanism');
        save();
        render();
        check();
      };
      this.clickSlot = (i) => {
        if (picked) this.place(picked, i);
        else if (slots[i]) this.rotate(slots[i]);
      };
      render();
      return {
        auto: () => {
          slots.forEach((p, i) => p && this.unplace(i));
          ['A', 'B', 'C', 'D'].forEach((p) => {
            while (rots[p] % 4 !== 0) rots[p] = (rots[p] + 1) % 4;
          });
          ['A', 'B', 'C', 'D'].forEach((p) => this.place(p, map[p]));
        },
        destroy() {}
      };
    }
  };

  /* ------------------------------------------------------------------
   * RINGS — 4 concentric rings, 8 symbols each. Turning a ring also
   * drags the ring just inside it by one step (except the innermost),
   * so the logical approach is outer → inner.
   * def: {rings:[[8 symbols] x4 inner→outer], target:[sym x4], start:[n x4]}
   * ------------------------------------------------------------------ */
  const SYM = { luna: '☾', sole: '☀', lira: '♪', onda: '≈', chiave: '⚷', stella: '✦', occhio: '◉', mano: '✋' };
  T.rings = {
    create(body, def, api) {
      let off = (api.state && api.state.off) || def.start.slice();
      const box = O.el('div.pz-rings');
      const ctr = O.el('div.rings-ctr');
      body.append(O.el('p.pz-help', { html: 'Allinea sotto l\'indice in alto la sequenza incisa sul retro del medaglione, dal centro verso l\'esterno. Attenzione: ogni anello trascina con sé quello più interno.' }), O.el('div.rings-wrap', null, [box, ctr]));
      const R = [70, 115, 160, 205];
      const render = () => {
        let s = '<svg viewBox="-230 -240 460 470"><polygon points="0,-232 -12,-212 12,-212" fill="#a8231f"/>';
        for (let k = 3; k >= 0; k--) {
          s += `<circle r="${R[k] + 22}" fill="${['#3a2c18', '#4a3820', '#5a4428', '#6a5030'][k]}" stroke="#c9a85a" stroke-width="2"/>`;
          const syms = def.rings[k];
          syms.forEach((sym, i) => {
            const a = ((i - off[k]) * 45 - 90) * (Math.PI / 180);
            s += `<text x="${Math.cos(a) * R[k]}" y="${Math.sin(a) * R[k] + 9}" text-anchor="middle" font-size="26" fill="${i === off[k] ? '#ffe9a8' : '#c9b080'}">${SYM[sym] || sym}</text>`;
          });
        }
        s += `<circle r="44" fill="#c9a85a"/>${O.Art.lyre(0, 3, 22, '#6a4a1a')}</svg>`;
        box.innerHTML = s;
        ctr.innerHTML = '';
        ['Anello interno', 'Secondo anello', 'Terzo anello', 'Anello esterno'].forEach((name, k) => {
          const row = O.el('div.ring-row');
          const l = O.el('button.pz-small', { text: '⟲' }), r = O.el('button.pz-small', { text: '⟳' });
          l.onclick = () => this.turn(k, -1);
          r.onclick = () => this.turn(k, 1);
          row.append(l, O.el('span', { text: `${name}: ${SYM[def.rings[k][off[k]]]}` }), r);
          ctr.appendChild(row);
        });
      };
      this.turn = (k, d) => {
        off[k] = (off[k] + d + 8) % 8;
        if (k > 0) off[k - 1] = (off[k - 1] + d + 8) % 8;
        O.Audio.sfx('mechanism');
        api.save({ off });
        render();
        const ok = def.target.every((sym, i) => def.rings[i][off[i]] === sym);
        if (ok) api.solve(def.successText);
        else api.status(def.target.filter((sym, i) => def.rings[i][off[i]] === sym).length + ' anelli su 4 mostrano il simbolo giusto.');
      };
      render();
      return {
        auto: () => {
          for (let k = 3; k >= 0; k--) {
            let g = 0;
            while (def.rings[k][off[k]] !== def.target[k] && g++ < 8) this.turn(k, 1);
          }
        },
        destroy() {}
      };
    }
  };
  T.rings.SYM = SYM;
})();
