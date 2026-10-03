/* InventoryManager — items, examine, item→hotspot/character/item,
 * combinations and transformations (data in items.json). */
(function () {
  'use strict';
  const O = window.Orfeo;

  const WRONG_COMBO = {
    beps: ['No, questi due non vanno d\'accordo.', 'Non combinano niente insieme.', 'Interessante accostamento. Inutile, ma interessante.'],
    kiki: ['Beps, non tutto si combina con tutto.', 'No. Proprio no.', 'Non c\'è un nesso.']
  };

  const Inventory = {
    selected: null,

    def(id) {
      return (O.Data.items.items || {})[id] || null;
    },
    name(id) {
      const d = this.def(id);
      if (!d) return id;
      if (d.nameIf) {
        const alt = d.nameIf.find((n) => O.cond(n.if));
        if (alt) return alt.name;
      }
      return d.name;
    },
    iconHTML(id) {
      const img = O.Assets.first(`assets/items/${id}.png`, `assets/items/${id}.webp`);
      if (img) return `<img src="${img}" alt="">`;
      return O.Art.itemIcon(this.def(id));
    },

    render() {
      const bar = O.$('#inv-slots');
      if (!bar) return;
      bar.innerHTML = '';
      const inv = O.State.d.inventory;
      if (!inv.length) bar.appendChild(O.el('div.inv-empty', { text: 'Tasche vuote.' }));
      inv.forEach((id) => {
        const b = O.el('button.inv-item', { 'data-id': id, title: this.name(id), 'aria-label': this.name(id), html: this.iconHTML(id) });
        b.appendChild(O.el('span.inv-name', { text: this.name(id) }));
        if (this.selected === id) b.classList.add('selected');
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.longPressed) return (this.longPressed = false);
          this.click(id);
        });
        b.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.examine(id);
        });
        let timer;
        b.addEventListener('pointerdown', (e) => {
          if (e.pointerType !== 'touch') return;
          this.longPressed = false;
          timer = setTimeout(() => {
            this.longPressed = true;
            this.examine(id);
          }, 480);
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => clearTimeout(timer)));
        bar.appendChild(b);
      });
      O.UI.updateItemActions();
    },

    click(id) {
      if (O.Script.running || O.Puzzles.open || O.Cutscene.playing) return;
      if (this.selected && this.selected !== id) {
        const a = this.selected;
        this.deselect();
        return this.combine(a, id);
      }
      if (this.selected === id) return this.deselect();
      this.select(id);
    },

    select(id) {
      this.selected = id;
      O.Audio.sfx('click');
      O.Scene.world.dataset.cursor = 'item';
      O.UI.setItemCursor(id);
      this.render();
      O.Hotspots.setHover(null);
    },

    deselect() {
      if (!this.selected) return;
      this.selected = null;
      O.UI.setItemCursor(null);
      this.render();
      O.Hotspots.setHover(null);
    },

    async examine(id) {
      if (O.Script.running) return;
      this.deselect();
      const d = this.def(id);
      if (!d) return;
      const who = O.State.d.active;
      const branch = d.examineIf && d.examineIf.find((e) => O.cond(e.if));
      const txt = branch ? O.textFor(branch.do, who) : O.textFor(d.examine, who);
      O.UI.showItemCard(id);
      await O.Script.run(Array.isArray(txt) ? txt : [txt || 'Niente da aggiungere.']);
      O.UI.hideItemCard();
    },

    findCombo(a, b) {
      return (O.Data.items.combos || []).find((c) => ((c.a === a && c.b === b) || (c.a === b && c.b === a)) && O.cond(c.if));
    },

    async combine(a, b) {
      const c = this.findCombo(a, b);
      const who = O.State.d.active;
      if (c) {
        O.Audio.sfx('mechanism');
        return O.Script.run(O.textFor(c.do, who));
      }
      // a combo exists but its condition is not met → hint line
      const blocked = (O.Data.items.combos || []).find((c2) => (c2.a === a && c2.b === b) || (c2.a === b && c2.b === a));
      O.Audio.sfx('fail');
      if (blocked && blocked.notYet) return O.Script.run(O.textFor(blocked.notYet, who));
      return O.Script.run([O.pick(WRONG_COMBO[who])]);
    }
  };

  O.on('inventory:add', () => Inventory.render());
  O.on('inventory:remove', (id) => {
    if (Inventory.selected === id) Inventory.selected = null;
    Inventory.render();
  });
  O.on('state:loaded', () => Inventory.render());
  O.on('state:reset', () => Inventory.render());

  O.Inventory = Inventory;
})();
