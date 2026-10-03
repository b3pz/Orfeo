/* DialogueManager — classic topic-based conversations.
 * Topics can be conditional (clues, items, stats), optional, consumable
 * ("once"), marked new, and the player can show inventory items. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Dialogue = {
    open: false,
    current: null,

    def(id) {
      return (O.Data.dialogues.dialogues || {})[id];
    },

    topicKey(dlg, t) {
      return dlg + '.' + t.id;
    },

    visibleTopics(id) {
      const d = this.def(id);
      const st = O.State.d;
      return (d.topics || []).filter((t) => {
        const key = this.topicKey(id, t);
        if (t.once && st.topicsUsed[key]) return false;
        return O.cond(t.if);
      });
    },

    async start(id, opts) {
      opts = opts || {};
      const d = this.def(id);
      if (!d) {
        console.warn('[Orfeo] dialogo mancante', id);
        return;
      }
      const wasOpen = this.open;
      const prev = this.current;
      this.open = true;
      this.current = id;
      const npc = d.npc || opts.npc || null;
      if (npc && O.Data.characters.characters[npc] && O.Data.characters.characters[npc].journal) O.Journal.addPerson(npc);
      O.UI.dialogueMode(true, npc);
      const st = O.State.d;
      try {
        const metKey = 'met_' + id;
        if (d.first && !st.flags[metKey]) await O.Script.run(d.first);
        else if (d.intro) await O.Script.run(d.intro);
        st.flags[metKey] = true;
        if (d.linear) return; // pure scripted scene
        for (let guard = 0; guard < 200; guard++) {
          const topics = this.visibleTopics(id);
          const menu = topics.map((t) => ({
            id: t.id,
            label: O.Script.format(O.textFor(t.label, st.active)),
            icon: t.icon || 'talk',
            isNew: !st.topicsSeen[this.topicKey(id, t)] && !st.topicsUsed[this.topicKey(id, t)],
            optional: !!t.optional,
            special: !!t.special
          }));
          topics.forEach((t) => (st.topicsSeen[this.topicKey(id, t)] = true));
          const canShow = d.items && Object.keys(d.items).length && O.State.d.inventory.length;
          const pick = await O.UI.topics(menu, { canShow, byeLabel: d.byeLabel || 'Arrivederci', name: npc ? O.Characters.displayName(npc) : '' });
          if (pick === '__bye') {
            if (d.bye) await O.Script.run(d.bye);
            break;
          }
          if (pick === '__item') {
            const item = await O.UI.pickItem('Mostra un oggetto');
            if (!item) continue;
            const action = d.items[item] != null ? d.items[item] : d.items['*'];
            if (action != null) await O.Script.run(O.textFor(action, st.active));
            else await O.Script.run(['Non credo che le interessi.']);
            continue;
          }
          const t = topics.find((x) => x.id === pick);
          if (!t) break;
          const key = this.topicKey(id, t);
          const repeat = st.topicsUsed[key] && t.repeat;
          st.topicsUsed[key] = true;
          await O.Script.run(O.textFor(repeat ? t.repeat : t.do, st.active));
          O.emit('topic', { dialogue: id, topic: t.id });
          if (t.end || (this.current !== id && !wasOpen)) break;
          if (!this.open) break;
        }
      } finally {
        if (wasOpen) {
          this.current = prev;
          O.UI.dialogueMode(true, prev && this.def(prev) ? this.def(prev).npc : null);
        } else {
          this.open = false;
          this.current = null;
          O.UI.dialogueMode(false);
          O.Scene.refresh();
          O.Save.autosave();
        }
      }
    },

    /** Close any open conversation (used by debug / scene jumps). */
    close() {
      this.open = false;
      O.UI.cancelTopics();
    }
  };

  O.Dialogue = Dialogue;
})();
