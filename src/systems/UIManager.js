/* UIManager — screen-space interface: scaling, HUD, dialogue box with
 * portraits/expressions, choices, topic menu, toasts, chapter cards,
 * menus (pause, save/load, options, archive), journal, hints, item and
 * collectible cards, puzzle shell, endings, credits, keyboard. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const SPEEDS = { lento: 28, normale: 55, veloce: 110, istantaneo: 0 };
  const ICONS = {
    talk: '<path d="M4 5h16v10H9l-5 4z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/>',
    photo: '<rect x="3" y="6" width="18" height="13" rx="1"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/>',
    symbol: '<circle cx="12" cy="12" r="9"/><path d="M8 6c-2 5 0 10 3 11h2c3-1 5-6 3-11M7.5 9h9M10.5 9v8M13.5 9v8"/>',
    key: '<circle cx="7" cy="12" r="4"/><path d="M11 12h10M18 12v3M21 12v2"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    doc: '<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    bye: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    item: '<path d="M4 8h16v12H4zM8 8V5h8v3"/>',
    warning: '<path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>',
    us: '<circle cx="9" cy="10" r="4"/><circle cx="15" cy="10" r="4"/><path d="M3 21c1-4 4-5 6-5M21 21c-1-4-4-5-6-5"/>',
    tape: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8.5" cy="12" r="2"/><circle cx="15.5" cy="12" r="2"/>',
    city: '<path d="M3 21V9l5-3v15M8 21V4h8v17M16 21V10l5 2v9"/>',
    lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true">${ICONS[k] || ICONS.talk}</svg>`;

  const UI = {
    settings: { textSpeed: 'normale', glints: true, reduceMotion: false, autoAdvance: false },
    typing: false,

    init() {
      try {
        Object.assign(this.settings, JSON.parse(localStorage.getItem('orfeo.settings') || '{}'));
      } catch (e) {}
      this.world = O.$('#world');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
      this.bindHUD();
      O.$('#inv-panel').insertAdjacentHTML('afterbegin', this.bookHTML());
      O.$('#inv-panel').appendChild(O.el('div#inv-detail.inv-detail'));
      this.bindKeys();
      this.bindCursor();
      O.on('toast', (t) => this.toast(t));
      O.on('switch', () => this.updateSwitch());
      O.on('scene:built', () => this.updateSwitch());
      O.on('objective', () => this.flashObjective());
      O.on('stat:change', () => this.updateSwitch());
      document.body.classList.toggle('reduce-motion', !!this.settings.reduceMotion);
      document.body.classList.toggle('no-glints', !this.settings.glints);
    },

    saveSettings() {
      try {
        localStorage.setItem('orfeo.settings', JSON.stringify(this.settings));
      } catch (e) {}
      document.body.classList.toggle('reduce-motion', !!this.settings.reduceMotion);
      document.body.classList.toggle('no-glints', !this.settings.glints);
    },

    /* ---------------- layout ---------------- */
    resize() {
      const stage = O.$('#stage');
      const vw = stage.clientWidth || window.innerWidth;
      const vh = stage.clientHeight || window.innerHeight;
      const s = Math.min(vw / O.W, vh / O.H);
      this.scale = s;
      const ox = (vw - O.W * s) / 2, oy = (vh - O.H * s) / 2;
      this.world.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
      document.documentElement.style.setProperty('--world-scale', s);
      document.documentElement.style.setProperty('--world-h', O.H * s + 'px');
      document.documentElement.style.setProperty('--world-top', oy + 'px');
      document.body.classList.toggle('portrait', vh > vw * 1.1);
      document.body.classList.toggle('compact', vw < 760 || vh < 500);
      const journalArt = O.$('.journal .book-art');
      if (journalArt) journalArt.setAttribute('viewBox', window.innerWidth <= 600 ? '455 515 405 385' : '20 445 910 490');
    },

    toWorld(cx, cy) {
      const r = this.world.getBoundingClientRect();
      return [((cx - r.left) / r.width) * O.W, ((cy - r.top) / r.height) * O.H];
    },

    toScreen(x, y) {
      const r = this.world.getBoundingClientRect();
      return [r.left + (x / O.W) * r.width, r.top + (y / O.H) * r.height];
    },

    ping(p) {
      const el = O.el('div.ping', { style: { left: p[0] + 'px', top: p[1] + 'px' } });
      O.$('#fx-layer').appendChild(el);
      setTimeout(() => el.remove(), 600);
    },

    /* ---------------- HUD ---------------- */
    bookHTML(kind) {
      // ViewBox crops the uploaded UI atlas without changing its bitmap.
      const view = kind === 'journal' && window.innerWidth <= 600 ? '455 515 405 385' : '20 445 910 490';
      return `<svg class="book-art" viewBox="${view}" preserveAspectRatio="none" aria-hidden="true"><image href="assets/interface/orfeo-ui-sheet.png" width="1672" height="941"/></svg>`;
    },

    bindHUD() {
      O.$('#btn-menu').onclick = () => this.pauseMenu();
      O.$('#btn-journal').onclick = () => this.openJournal();
      O.$('#btn-hint').onclick = () => this.openHints();
      O.$('#btn-reveal').onclick = () => this.reveal();
      O.$('#inv-handle').onclick = () => this.toggleInventory();
      O.$('#sw-partner').onclick = () => O.Scene.switchTo(O.State.partnerId());
      O.$('#inv-examine').onclick = () => O.Inventory.selected && O.Inventory.examine(O.Inventory.selected);
      O.$('#inv-cancel').onclick = () => O.Inventory.deselect();
      const inv = O.$('#inventory');
      if (!O.isTouch()) {
        inv.addEventListener('mouseenter', () => !O.Inventory.selected && inv.classList.add('open'));
        inv.addEventListener('mouseleave', () => !O.Inventory.selected && inv.classList.remove('open'));
      }
    },

    toggleInventory(force) {
      const inv = O.$('#inventory');
      inv.classList.toggle('open', force != null ? force : !inv.classList.contains('open'));
    },
    closeInventoryIfTouch() {
      if (O.isTouch()) this.toggleInventory(false);
    },
    updateItemActions() {
      O.$('#inv-actions').classList.toggle('show', !!O.Inventory.selected);
      if (O.Inventory.selected) O.$('#inv-sel-name').textContent = O.Inventory.name(O.Inventory.selected);
      O.$('#inv-count').textContent = O.State.d.inventory.length;
    },

    setItemCursor(id) {
      const c = O.$('#item-cursor');
      if (!id) {
        c.classList.remove('on');
        c.innerHTML = '';
        if (O.isTouch()) this.toggleInventory(false);
        return;
      }
      c.innerHTML = O.Inventory.iconHTML(id);
      c.classList.add('on');
      if (O.isTouch()) {
        this.toggleInventory(false);
        this.toast({ text: 'Tocca dove usare: ' + O.Inventory.name(id), kind: 'info' });
      }
    },

    bindCursor() {
      const c = O.$('#item-cursor');
      window.addEventListener('pointermove', (e) => {
        if (!c.classList.contains('on')) return;
        c.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
      });
      const label = O.$('#hover-label');
      window.addEventListener('pointermove', (e) => {
        label.style.transform = `translate(${Math.min(e.clientX + 18, window.innerWidth - 260)}px, ${e.clientY + 22}px)`;
      });
    },

    setLocation(sc) {
      const st = O.State.d;
      const el = O.$('#location');
      el.innerHTML = `<span>CAPITOLO ${O.roman(st.chapter)}</span><b>${sc.name}</b><i>${sc.place || ''}</i>`;
      el.classList.add('show');
      clearTimeout(this._locT);
      this._locT = setTimeout(() => el.classList.remove('show'), 4200);
    },

    flashObjective() {
      const o = O.Journal.objective();
      const el = O.$('#objective');
      if (!o) return;
      el.textContent = o.text;
      el.classList.add('show');
      clearTimeout(this._objT);
      this._objT = setTimeout(() => el.classList.remove('show'), 5200);
    },

    portraitHTML(id, expr) {
      const pd = O.Characters.def(id);
      if (pd.portraitOf && O.Assets.first(`assets/portraits/${pd.portraitOf}/neutral.png`)) id = pd.portraitOf;
      const sheet = O.Characters.def(id).portraitSheet;
      if (sheet && O.Assets.has(sheet.src)) {
        const rect = sheet.rects[expr] || sheet.rects.neutral;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${rect.join(' ')}"><rect x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}" fill="#f1e9dd"/><image href="${sheet.src}" width="${sheet.w}" height="${sheet.h}"/></svg>`;
      }
      const real = O.Assets.first(`assets/portraits/${id}/${expr}.png`, `assets/portraits/${id}/${expr}.webp`, `assets/portraits/${id}/neutral.png`, `assets/portraits/${id}/neutral.webp`);
      if (real) return `<img src="${real}" alt="">`;
      const d = O.Characters.def(id);
      return O.Art.portrait(id, d.look || {}, expr || 'neutral');
    },

    updateSwitch() {
      const st = O.State.d;
      const me = O.$('#sw-active'), p = O.$('#sw-partner');
      me.innerHTML = this.portraitHTML(st.active, O.Relationship.defaultExpr(st.active)) + `<span>${O.Characters.displayName(st.active)}</span>`;
      const pid = O.State.partnerId();
      const pc = st.chars[pid];
      p.innerHTML = this.portraitHTML(pid, 'neutral') + `<span>${O.Characters.displayName(pid)}</span>`;
      const chk = O.Scene.canSwitch ? O.Scene.canSwitch() : { ok: false };
      p.classList.toggle('hidden', !pc.present || st.switchLocked);
      p.classList.toggle('disabled', !chk.ok);
      p.title = chk.ok ? 'Passa a ' + O.Characters.displayName(pid) + ' (Tab)' : 'Cambio non disponibile qui';
      p.classList.toggle('elsewhere', pc.present && O.Scene.current && pc.scene !== O.Scene.current.id);
    },

    reveal() {
      const w = this.world;
      w.classList.add('reveal');
      clearTimeout(this._revT);
      this._revT = setTimeout(() => w.classList.remove('reveal'), 2600);
    },

    /* ---------------- speech ---------------- */
    typewrite(el, html) {
      const cps = SPEEDS[this.settings.textSpeed] != null ? SPEEDS[this.settings.textSpeed] : 55;
      clearInterval(this._typeT);
      if (!cps || O.testMode) {
        el.innerHTML = html;
        this.typing = false;
        return;
      }
      // reveal by characters while preserving tags
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const full = tmp.textContent;
      let n = 0;
      this.typing = true;
      this._typeFull = () => {
        clearInterval(this._typeT);
        el.innerHTML = html;
        this.typing = false;
      };
      el.innerHTML = '';
      const step = () => {
        n += Math.max(1, Math.round(cps / 30));
        if (n >= full.length) return this._typeFull();
        el.innerHTML = `${escapeHTML(full.slice(0, n))}<span class="ghost">${escapeHTML(full.slice(n))}</span>`;
      };
      this._typeT = setInterval(step, 1000 / 30);
    },
    finishTyping() {
      if (this.typing && this._typeFull) this._typeFull();
    },

    say(o) {
      const box = O.$('#say');
      box.classList.remove('hidden', 'narr');
      const name = O.$('.say-name', box), text = O.$('.say-text', box);
      const pl = O.$('.say-portrait.left', box), pr = O.$('.say-portrait.right', box);
      if (o.narr) {
        box.classList.add('narr');
        name.textContent = '';
      } else {
        name.textContent = o.name;
        const side = o.side === 'right' ? pr : pl;
        const other = side === pl ? pr : pl;
        side.innerHTML = this.portraitHTML(o.speaker, o.expr);
        side.dataset.id = o.speaker;
        side.classList.add('speaking', 'show');
        other.classList.remove('speaking');
        if (!this.inDialogue) other.classList.remove('show');
        box.dataset.speaker = o.speaker;
      }
      this.typewrite(text, o.text);
      O.emit('say', o);
      if (O.testMode) {
        (O.testLog = O.testLog || []).push((o.name || 'narr') + ': ' + text.textContent);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const adv = (e) => {
          if (e && e.type === 'keydown' && !['Enter', ' ', 'Spacebar'].includes(e.key)) return;
          if (e) e.preventDefault();
          if (this.typing) return this.finishTyping();
          box.removeEventListener('click', adv);
          window.removeEventListener('keydown', adv, true);
          clearTimeout(this._autoT);
          this._sayAdv = null;
          resolve();
        };
        this._sayAdv = adv;
        box.addEventListener('click', adv);
        window.addEventListener('keydown', adv, true);
        if (this.settings.autoAdvance) {
          const wait = () => {
            if (this.typing) return (this._autoT = setTimeout(wait, 300));
            this._autoT = setTimeout(() => this._sayAdv === adv && adv(), 1200 + o.text.length * 30);
          };
          wait();
        }
      });
    },

    hideSay() {
      if (this.inDialogue) return;
      O.$('#say').classList.add('hidden');
      O.$$('.say-portrait').forEach((p) => p.classList.remove('show', 'speaking'));
    },

    dialogueMode(on, npc) {
      this.inDialogue = on;
      document.body.classList.toggle('in-dialogue', on);
      const box = O.$('#say');
      if (on) {
        box.classList.remove('hidden');
        const pl = O.$('.say-portrait.left'), pr = O.$('.say-portrait.right');
        pl.innerHTML = this.portraitHTML(O.State.d.active, O.Relationship.defaultExpr(O.State.d.active));
        pl.classList.add('show');
        if (npc) {
          pr.innerHTML = this.portraitHTML(npc, O.Relationship.defaultExpr(npc));
          pr.classList.add('show');
        }
        O.$('.say-name', box).textContent = npc ? O.Characters.displayName(npc) : '';
        O.$('.say-text', box).innerHTML = '';
      } else {
        O.$('#topics').classList.add('hidden');
        this.hideSay();
      }
    },

    /* ---------------- choices / topics ---------------- */
    choose(options, prompt) {
      const box = O.$('#choices');
      box.innerHTML = prompt ? `<div class="ch-prompt">${prompt}</div>` : '';
      box.classList.remove('hidden');
      O.$('#say').classList.add('dim');
      if (O.testMode) {
        const idx = O.testChoice ? O.testChoice(options) : 0;
        box.classList.add('hidden');
        O.$('#say').classList.remove('dim');
        return Promise.resolve(idx);
      }
      return new Promise((resolve) => {
        const keyh = (e) => {
          const n = Number(e.key);
          if (n >= 1 && n <= options.length) {
            e.preventDefault();
            done(n - 1);
          }
        };
        const done = (i) => {
          window.removeEventListener('keydown', keyh, true);
          box.classList.add('hidden');
          O.$('#say').classList.remove('dim');
          O.Audio.sfx('click');
          resolve(i);
        };
        options.forEach((o, i) => {
          const b = O.el('button.choice', { html: `<span class="num">${i + 1}</span>${o.icon ? icon(o.icon) : ''}<span>${o.label}</span>` });
          if (o.tone) b.classList.add('tone-' + o.tone);
          b.onclick = (e) => {
            e.stopPropagation();
            done(i);
          };
          box.appendChild(b);
        });
        window.addEventListener('keydown', keyh, true);
      });
    },

    topics(menu, opts) {
      const box = O.$('#topics');
      box.innerHTML = '';
      box.classList.remove('hidden');
      O.$('.say-text').innerHTML = '';
      if (O.testMode) {
        box.classList.add('hidden');
        return Promise.resolve(O.testTopic ? O.testTopic(menu) : '__bye');
      }
      return new Promise((resolve) => {
        this._topicResolve = (v) => {
          this._topicResolve = null;
          box.classList.add('hidden');
          resolve(v);
        };
        menu.forEach((t) => {
          const b = O.el('button.topic', { html: `${icon(t.icon)}<span>${t.label}</span>${t.isNew ? '<em>nuovo</em>' : ''}`, class: (t.optional ? 'optional ' : '') + (t.special ? 'special' : '') });
          b.onclick = (e) => {
            e.stopPropagation();
            O.Audio.sfx('click');
            this._topicResolve(t.id);
          };
          box.appendChild(b);
        });
        if (opts.canShow) {
          const s = O.el('button.topic.show-item', { html: `${icon('item')}<span>Mostra un oggetto…</span>` });
          s.onclick = (e) => {
            e.stopPropagation();
            this._topicResolve('__item');
          };
          box.appendChild(s);
        }
        const bye = O.el('button.topic.bye', { html: `${icon('bye')}<span>${opts.byeLabel}</span>` });
        bye.onclick = (e) => {
          e.stopPropagation();
          this._topicResolve('__bye');
        };
        box.appendChild(bye);
      });
    },
    cancelTopics() {
      if (this._topicResolve) this._topicResolve('__bye');
    },

    pickItem(title) {
      if (O.testMode) return Promise.resolve(O.testItem ? O.testItem() : null);
      return new Promise((resolve) => {
        const panel = this.panel(title, 'pick');
        const grid = O.el('div.pick-grid');
        O.State.d.inventory.forEach((id) => {
          const b = O.el('button.inv-item', { html: O.Inventory.iconHTML(id) + `<span class="inv-name show">${O.Inventory.name(id)}</span>` });
          b.onclick = () => {
            // Closing calls onClose (cancel): settle the selection first.
            resolve(id);
            this.closePanel();
          };
          grid.appendChild(b);
        });
        panel.body.appendChild(grid);
        panel.onClose = () => resolve(null);
      });
    },

    /* ---------------- toasts & cards ---------------- */
    toast(t) {
      if (O.testMode) return;
      const box = O.$('#toasts');
      const el = O.el('div.toast.' + (t.kind || 'info').replace(/[^\w-]/g, ''), { html: (t.item ? `<span class="t-ic">${O.Inventory.iconHTML(t.item)}</span>` : '') + `<span>${t.text}</span>` });
      box.appendChild(el);
      while (box.children.length > 4) box.firstChild.remove();
      setTimeout(() => el.classList.add('out'), 3600);
      setTimeout(() => el.remove(), 4200);
    },

    async chapterCard(n) {
      const st = O.State.d;
      st.chapter = n;
      const ch = (O.Data.chapters.chapters || []).find((c) => c.id === n) || {};
      O.emit('chapter', n);
      if (O.testMode) return;
      const el = O.$('#chapter-card');
      el.innerHTML = `<div class="cc-inner"><div class="cc-num">CAPITOLO ${O.roman(n)}</div><h2>${ch.title || ''}</h2><div class="cc-place">${ch.location || ''}${ch.date ? ' · ' + ch.date : ''}</div>${ch.epigraph ? `<p class="cc-epi">${ch.epigraph}</p>` : ''}</div>`;
      el.classList.add('on');
      O.Audio.sfx('page');
      await new Promise((res) => {
        const t = setTimeout(res, 4200);
        el.onclick = () => {
          clearTimeout(t);
          res();
        };
      });
      el.classList.remove('on');
      await O.sleep(700);
    },

    async titleCard(text) {
      if (O.testMode) return;
      const el = O.$('#chapter-card');
      el.innerHTML = `<div class="cc-inner"><h2 class="small">${text}</h2></div>`;
      el.classList.add('on');
      await O.sleep(2600);
      el.classList.remove('on');
      await O.sleep(600);
    },

    showItemCard(id) {
      const el = O.$('#item-card');
      const d = O.Inventory.def(id) || {};
      el.innerHTML = `<div class="ic-img">${O.Inventory.iconHTML(id)}</div><div><b>${O.Inventory.name(id)}</b>${d.kind ? `<i>${d.kind}</i>` : ''}</div>`;
      el.classList.add('on');
    },
    hideItemCard() {
      O.$('#item-card').classList.remove('on');
    },

    showCollectible(c) {
      if (O.testMode) return Promise.resolve();
      return new Promise((resolve) => {
        const T = O.Collectibles.TYPES[c.type];
        const panel = this.panel(`Archivio Orfeo · ${T.single} ${c.n}`, 'collectible');
        let media = '';
        if (c.type === 'photos') media = `<div class="col-photo">${O.Assets.first(`assets/collectibles/${c.id}.jpg`, `assets/collectibles/${c.id}.png`) ? `<img src="${O.Assets.first(`assets/collectibles/${c.id}.jpg`, `assets/collectibles/${c.id}.png`)}" alt="">` : O.Art.photo(c.photo || 'generic', { woman: !!c.woman, marks: false })}</div>`;
        if (c.type === 'symbols') media = `<div class="col-symbol"><svg viewBox="0 0 100 100" role="img" aria-label="Lira di Orfeo">${O.Art.drawProp('symbol', 100, 100, { c: '#c9a85a', a: 1 })}</svg></div>`;
        if (c.type === 'recordings') media = `<div class="col-tape">${icon('tape')}<span>${c.duration || '00:47'}</span></div>`;
        panel.body.innerHTML = `${media}<h3>${c.title}</h3><div class="col-meta">${c.date || ''}${c.place ? ' · ' + c.place : ''}</div><div class="col-text">${c.text}</div>`;
        panel.onClose = resolve;
      });
    },

    /* ---------------- panels (generic modal) ---------------- */
    panel(title, cls) {
      const modal = O.$('#modal');
      modal.innerHTML = '';
      const p = O.el('section.panel.' + (cls || 'generic'), { role: 'dialog', 'aria-label': title });
      const head = O.el('header.panel-head', { html: `<h2>${title}</h2>` });
      const close = O.el('button.panel-close', { text: '✕', 'aria-label': 'Chiudi' });
      head.appendChild(close);
      const body = O.el('div.panel-body');
      p.append(head, body);
      modal.appendChild(p);
      modal.classList.add('on');
      const api = { el: p, body, onClose: null };
      this._panel = api;
      close.onclick = () => this.closePanel();
      modal.onclick = (e) => {
        if (e.target === modal) this.closePanel();
      };
      return api;
    },
    closePanel() {
      const modal = O.$('#modal');
      if (!modal.classList.contains('on')) return;
      modal.classList.remove('on');
      modal.innerHTML = '';
      const p = this._panel;
      this._panel = null;
      if (p && p.onClose) p.onClose();
    },
    modalOpen() {
      return O.$('#modal').classList.contains('on') || !O.$('#title-screen').classList.contains('hidden') || O.$('#end-screen').classList.contains('on');
    },

    openJournal() {
      if (O.inTitle) return;
      this.toggleInventory(false);
      const p = this.panel('Taccuino', 'journal');
      O.Audio.sfx('page');
      O.Journal.render(p.body);
    },

    openHints() {
      if (O.inTitle) return;
      const inPuzzle = !!O.Puzzles.open;
      const host = inPuzzle ? O.$('.pz-hints') : this.panel('Suggerimenti', 'hints').body;
      if (!host) return;
      const render = () => {
        const { ctx, list } = O.Hints.shown();
        if (!ctx) {
          host.innerHTML = '<p>Nessun obiettivo attivo. Esplora e parla con chi incontri.</p>';
          return;
        }
        const names = ['Indizio leggero', 'Suggerimento specifico', 'Quasi-soluzione'];
        host.innerHTML = `${inPuzzle ? '' : `<p class="h-ctx">${ctx.title}</p>`}` + list.map((h, i) => `<div class="hint lvl${i + 1}"><b>${names[i]}</b><p>${h}</p></div>`).join('');
        if (list.length < ctx.hints.length) {
          const b = O.el('button.pz-btn', { text: list.length ? 'Un aiuto in più' : 'Chiedi un indizio leggero' });
          b.onclick = () => {
            O.Hints.next();
            render();
          };
          host.appendChild(b);
        } else if (!ctx.hints.length) host.innerHTML += '<p>Nessun suggerimento disponibile qui.</p>';
        else host.appendChild(O.el('p.h-end', { text: 'Non ci sono altri suggerimenti per questo obiettivo.' }));
      };
      render();
      if (inPuzzle) O.$('.pz-hints').classList.add('on');
    },

    /* ---------------- puzzle shell ---------------- */
    openPuzzle(def, onClose) {
      const root = O.$('#puzzle');
      root.innerHTML = '';
      root.classList.add('on');
      const head = O.el('header.pz-head', { html: `<div><span class="pz-kicker">ENIGMA</span><h2>${def.title}</h2></div>` });
      const hint = O.el('button.pz-hint-btn', { html: '? <span>Suggerimento</span>' });
      hint.onclick = () => this.openHints();
      const close = O.el('button.pz-close', { text: def.closeLabel || 'Lascia per ora' });
      close.onclick = () => onClose();
      head.append(hint, close);
      const body = O.el('div.pz-body');
      const status = O.el('div.pz-status');
      root.append(head, O.el('div.pz-hints'), body, status);
      return { root, body, status };
    },
    closePuzzle() {
      const root = O.$('#puzzle');
      root.classList.remove('on', 'solved', 'shake');
      root.innerHTML = '';
    },

    /* ---------------- menus ---------------- */
    pauseMenu() {
      if (O.inTitle) return;
      const p = this.panel('Pausa', 'menu');
      const items = [
        ['Riprendi', () => this.closePanel()],
        ['Taccuino', () => this.openJournal()],
        ['Salva partita', () => this.saveLoad('save')],
        ['Carica partita', () => this.saveLoad('load')],
        ['Opzioni', () => this.options()],
        ['Archivio Orfeo', () => this.archive()],
        ['Torna al titolo', async () => {
          this.closePanel();
          await O.Save.autosave();
          O.Game.toTitle();
        }]
      ];
      items.forEach(([label, fn]) => {
        const b = O.el('button.menu-btn', { text: label });
        b.onclick = fn;
        p.body.appendChild(b);
      });
    },

    saveLoad(mode) {
      const p = this.panel(mode === 'save' ? 'Salva partita' : 'Carica partita', 'saves');
      const render = () => {
        p.body.innerHTML = '';
        if (!O.Save.storageOk) p.body.appendChild(O.el('p.warn', { text: 'Il browser non permette di salvare in modo permanente (modalità privata?). I salvataggi dureranno solo fino alla chiusura della pagina.' }));
        const grid = O.el('div.slots');
        O.Save.list().forEach((s) => {
          if (mode === 'save' && s.slot === 'auto') return;
          const card = O.el('div.slot' + (s.empty ? '.empty' : ''));
          const label = s.slot === 'auto' ? 'Salvataggio automatico' : 'Slot ' + s.slot;
          if (s.empty || s.corrupt) {
            card.innerHTML = `<div class="thumb"></div><div class="meta"><b>${label}</b><span>${s.corrupt ? 'Dati danneggiati' : 'Vuoto'}</span></div>`;
          } else {
            const d = new Date(s.ts);
            card.innerHTML = `<div class="thumb">${s.thumb ? `<img src="${s.thumb}" alt="">` : ''}</div><div class="meta"><b>${label}</b><span>Cap. ${O.roman(s.chapter)} · ${s.chapterTitle || ''}</span><span>${s.sceneName || ''}${s.place ? ' — ' + s.place : ''}</span><small>${d.toLocaleDateString('it-IT')} ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · ${fmtTime(s.playtime)}</small></div>`;
          }
          const act = O.el('div.actions');
          if (mode === 'save') {
            const b = O.el('button.pz-btn', { text: s.empty ? 'Salva qui' : 'Sovrascrivi' });
            b.onclick = async () => {
              if (!s.empty && !(await this.confirm('Sovrascrivere questo salvataggio?'))) return render();
              await O.Save.save(s.slot);
              render();
            };
            act.appendChild(b);
          } else if (!s.empty && !s.corrupt) {
            const b = O.el('button.pz-btn', { text: 'Carica' });
            b.onclick = () => {
              this.closePanel();
              O.Game.loadSlot(s.slot);
            };
            act.appendChild(b);
          }
          if (!s.empty) {
            const del = O.el('button.pz-small.del', { text: 'Elimina' });
            del.onclick = async () => {
              if (await this.confirm('Eliminare definitivamente questo salvataggio?')) O.Save.remove(s.slot);
              render();
            };
            act.appendChild(del);
          }
          card.appendChild(act);
          grid.appendChild(card);
        });
        p.body.appendChild(grid);
      };
      render();
    },

    confirm(msg) {
      if (O.testMode) return Promise.resolve(true);
      return new Promise((resolve) => {
        const el = O.el('div.confirm', { html: `<p>${msg}</p>` });
        const y = O.el('button.pz-btn', { text: 'Sì' }), n = O.el('button.pz-small', { text: 'No' });
        y.onclick = () => (el.remove(), resolve(true));
        n.onclick = () => (el.remove(), resolve(false));
        el.append(y, n);
        (this._panel ? this._panel.body : document.body).prepend(el);
      });
    },

    options() {
      const p = this.panel('Opzioni', 'options');
      const A = O.Audio.s;
      const slider = (key, label) => {
        const row = O.el('label.opt', { html: `<span>${label}</span>` });
        const i = O.el('input', { type: 'range', min: 0, max: 100, value: Math.round(A[key] * 100) });
        i.oninput = () => {
          A[key] = i.value / 100;
          O.Audio.save();
        };
        row.appendChild(i);
        return row;
      };
      const toggle = (obj, key, label, after) => {
        const row = O.el('label.opt.check', { html: `<span>${label}</span>` });
        const i = O.el('input', { type: 'checkbox' });
        i.checked = !!obj[key];
        i.onchange = () => {
          obj[key] = i.checked;
          after();
        };
        row.appendChild(i);
        return row;
      };
      const speed = O.el('label.opt', { html: '<span>Velocità del testo</span>' });
      const sel = O.el('select');
      Object.keys(SPEEDS).forEach((k) => sel.appendChild(O.el('option', { value: k, text: k[0].toUpperCase() + k.slice(1), selected: this.settings.textSpeed === k })));
      sel.onchange = () => {
        this.settings.textSpeed = sel.value;
        this.saveSettings();
      };
      speed.appendChild(sel);
      const fs = O.el('button.menu-btn', { text: document.fullscreenElement ? 'Esci da schermo intero' : 'Schermo intero' });
      fs.onclick = () => {
        this.fullscreen();
        setTimeout(() => (fs.textContent = document.fullscreenElement ? 'Esci da schermo intero' : 'Schermo intero'), 300);
      };
      p.body.append(
        O.el('h4', { text: 'Audio' }),
        slider('master', 'Volume generale'),
        slider('music', 'Musica'),
        slider('ambience', 'Ambiente'),
        slider('sfx', 'Effetti'),
        toggle(A, 'muted', 'Silenzia tutto', () => O.Audio.save()),
        toggle(A, 'synth', 'Audio sintetico di riserva (se mancano i file)', () => {
          O.Audio.save();
          const m = O.Audio.current.music, a = O.Audio.current.ambience;
          O.Audio.current.music = O.Audio.current.ambience = null;
          O.Audio.music(m);
          O.Audio.ambience(a);
        }),
        O.el('h4', { text: 'Testo e schermo' }),
        speed,
        toggle(this.settings, 'autoAdvance', 'Avanzamento automatico dei dialoghi', () => this.saveSettings()),
        toggle(this.settings, 'glints', 'Scintille sui collezionabili', () => this.saveSettings()),
        toggle(this.settings, 'reduceMotion', 'Riduci animazioni', () => this.saveSettings()),
        fs
      );
    },

    fullscreen() {
      const el = document.documentElement;
      try {
        if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
        else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } catch (e) {}
    },

    archive() {
      const p = this.panel('Archivio Orfeo', 'archive');
      const prof = O.State.profile;
      const ends = O.Endings.order().map((id) => {
        const d = O.Endings.defs()[id];
        const got = prof.endings[id];
        return `<div class="end-card ${got ? 'got' : ''}"><b>${got || !d.secret ? d.title : '???'}</b><span>${got ? d.subtitle : d.secret ? 'Un finale nascosto.' : 'Non ancora raggiunto.'}</span></div>`;
      }).join('');
      const total = O.Collectibles.all().length;
      const found = Object.keys(prof.collectibles || {}).filter((k) => O.Collectibles.get(k)).length;
      p.body.innerHTML = `<h4>Finali</h4><div class="end-grid">${ends}</div><h4>Collezionabili scoperti in tutte le partite</h4><p>${found} / ${total}</p>`;
      if (!O.inTitle && O.State.d) {
        const j = O.el('button.menu-btn', { text: 'Apri l\'Archivio nel taccuino' });
        j.onclick = () => {
          O.Journal.tab = 'archivio';
          this.openJournal();
        };
        p.body.appendChild(j);
      }
    },

    /* ---------------- endings ---------------- */
    endingChoice(opts, prompt) {
      if (O.testMode) return Promise.resolve(O.testEnding ? O.testEnding(opts) : opts.find((o) => !o.locked).id);
      return new Promise((resolve) => {
        const el = O.$('#ending-choice');
        el.innerHTML = `<div class="ec-prompt">${prompt || ''}</div>`;
        const row = O.el('div.ec-row');
        opts.forEach((o) => {
          const b = O.el('button.ec-card', { class: (o.locked ? 'locked ' : '') + (o.secret ? 'secret' : ''), html: `<b>${o.label}</b><span>${o.sub || ''}</span>` });
          b.onclick = () => {
            if (o.locked) {
              O.Audio.sfx('fail');
              this.toast({ text: o.sub || 'Questa strada non è ancora vostra.' });
              return;
            }
            el.classList.remove('on');
            resolve(o.id);
          };
          row.appendChild(b);
        });
        el.appendChild(row);
        el.classList.add('on');
      });
    },

    epilogue(d, ep) {
      if (O.testMode) {
        (O.testLog = O.testLog || []).push('EPILOGUE ' + d.title + ' / ' + (ep ? ep.id || ep.if : '-'));
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const el = O.$('#epilogue');
        const paras = (ep ? ep.text : []).map((t) => `<p>${O.Script.format(t)}</p>`).join('');
        el.innerHTML = `<div class="ep-inner"><span class="ep-kicker">EPILOGO</span><h2>${d.title}</h2><h3>${d.subtitle || ''}</h3>${paras}<button class="pz-btn">Continua</button></div>`;
        el.classList.add('on');
        O.$('button', el).onclick = () => {
          el.classList.remove('on');
          resolve();
        };
      });
    },

    credits(d) {
      return new Promise((resolve) => {
        const el = O.$('#credits');
        const C = O.Data.endings.credits || [];
        el.innerHTML = `<div class="cr-roll"><h2>Giuseppe &amp; Kiki</h2><h3>Il Segreto di Orfeo</h3><p class="cr-end">${d.title}</p>${C.map((c) => `<div class="cr-row"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('')}<p class="cr-thanks">Grazie per aver giocato.</p></div><button class="cs-skip">Salta ▸▸</button>`;
        el.classList.add('on');
        const end = () => {
          clearTimeout(t);
          el.classList.remove('on');
          resolve();
        };
        const t = setTimeout(end, this.settings.reduceMotion ? 4000 : 26000);
        O.$('.cs-skip', el).onclick = end;
      });
    },

    endScreen(d) {
      if (O.testMode) return Promise.resolve();
      return new Promise((resolve) => {
        const el = O.$('#end-screen');
        const found = Object.keys(O.State.profile.endings).length;
        el.innerHTML = `<div class="es-inner"><span>FINE</span><h2>${d.title}</h2><p>${d.subtitle || ''}</p><p class="es-count">Finali scoperti: ${found} / ${O.Endings.order().length}</p></div>`;
        const b1 = O.el('button.pz-btn', { text: 'Torna al titolo' });
        const b2 = O.el('button.pz-small', { text: 'Carica il salvataggio prima della scelta' });
        b1.onclick = () => {
          el.classList.remove('on');
          O.Game.toTitle();
          resolve();
        };
        b2.onclick = () => {
          el.classList.remove('on');
          O.Game.loadSlot('auto');
          resolve();
        };
        O.$('.es-inner', el).append(b1, b2);
        el.classList.add('on');
      });
    },

    /* ---------------- effects ---------------- */
    async shake() {
      const s = O.$('#stage');
      s.classList.remove('shake');
      void s.offsetWidth;
      s.classList.add('shake');
      await O.sleep(500);
    },
    async flash() {
      const f = O.$('#flash');
      f.classList.add('on');
      await O.sleep(140);
      f.classList.remove('on');
    },

    /* ---------------- keyboard ---------------- */
    bindKeys() {
      window.addEventListener('keydown', (e) => {
        if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
        if (O.inTitle) return;
        const k = e.key;
        if (k === 'Escape') {
          e.preventDefault();
          if (O.$('#modal').classList.contains('on')) return this.closePanel();
          if (O.Puzzles.open) return O.Puzzles.close();
          if (O.Inventory.selected) return O.Inventory.deselect();
          if (this._topicResolve) return this.cancelTopics();
          if (!O.Script.running && !O.Cutscene.playing) return this.pauseMenu();
          return;
        }
        if (O.$('#modal').classList.contains('on') || O.Puzzles.open || O.Cutscene.playing) return;
        if (O.Script.running || O.Dialogue.open) return;
        if (k === 'Tab') {
          e.preventDefault();
          O.Scene.switchTo(O.State.partnerId());
        } else if (k === ' ') {
          e.preventDefault();
          this.reveal();
        } else if (k === 'j' || k === 'J') this.openJournal();
        else if (k === 'i' || k === 'I') this.toggleInventory();
        else if (k === 'h' || k === 'H' || k === '?') this.openHints();
        else if (k === 'f' || k === 'F') this.fullscreen();
      });
    }
  };

  function escapeHTML(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function fmtTime(s) {
    s = Math.round(s || 0);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m} min`;
  }

  UI.icon = icon;
  O.UI = UI;
})();
