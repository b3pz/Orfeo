/* CinemaManager — automatic story mode.
 * Plays Orfeo as a linear illustrated film using existing cutscenes,
 * backgrounds and narration. Normal gameplay is untouched. */
(function () {
  'use strict';
  const O = window.Orfeo;

  const Cinema = {
    playing: false,
    stopRequested: false,
    canonicalEnding: 'segreto',

    chapters: [
      {
        n: 1,
        title: 'La stanza murata',
        place: 'Firenze · Ottobre 2026',
        cutscene: 'intro',
        narration: [
          'Un vecchio computer recuperato durante i lavori in Oltrarno porta Giuseppe dentro una storia che avrebbe dovuto restare sepolta.',
          'Una fotografia del 1944, una lista di diciassette nomi e il simbolo di Orfeo conducono Beps all’Archivio Storico.',
          'È lì che incontra Federica. Kiki sta seguendo la stessa traccia per motivi molto più personali.',
          'Non si fidano ancora l’uno dell’altra. Ma capiscono subito che, separati, non arriveranno lontano.'
        ],
        outro: 'c1_fine'
      },
      {
        n: 2,
        title: 'La fotografia impossibile',
        place: 'Parigi',
        narration: [
          'A Parigi seguono le tracce di Ada e di una fotografia del 1967.',
          'Tra negativi, mappe cifrate e vecchi appartamenti scoprono che Orfeo non era soltanto un archivio: era una rete di persone che proteggeva nomi, testimonianze e vite.',
          'Beps e Kiki cominciano a muoversi come una squadra. E a conoscersi davvero.'
        ],
        outro: 'c2_fine'
      },
      {
        n: 3,
        title: 'I diciassette',
        place: 'Roma',
        narration: [
          'A Roma la Lista dei Diciassette smette di essere un indizio e diventa una minaccia.',
          'Ogni cassetto apre una storia diversa. Alcune raccontano salvataggi. Altre tradimenti.',
          'Per la prima volta compare chiaramente il nome di Aurelio Varano, il Notaio di Orfeo.'
        ],
        outro: 'c3_fine'
      },
      {
        n: 4,
        title: 'Il sigillo',
        place: 'Firenze',
        narration: [
          'Tornati a Firenze, Beps e Kiki ricompongono il Sigillo e scoprono che la storia delle loro famiglie è intrecciata alla stessa organizzazione.',
          'Quando tutto sembra sul punto di crollare, scelgono di restare insieme e andare fino in fondo.',
          'Non è più soltanto un’indagine.'
        ],
        outro: 'c4_fine'
      },
      {
        n: 5,
        title: 'La porta d’Oriente',
        place: 'Istanbul',
        narration: [
          'A Istanbul il medaglione diventa una chiave. Dietro la porta, Orfeo lascia loro una domanda invece di una risposta.',
          'Chi custodisce la verità ha anche il diritto di decidere quando mostrarla?',
          'Sul tetto, dopo aver rischiato di perdersi, Beps e Kiki smettono finalmente di fingere che tra loro sia soltanto lavoro.'
        ],
        feature: 'bacio',
        outro: 'c5_fine'
      },
      {
        n: 6,
        title: 'Euridice',
        place: 'Parigi',
        narration: [
          'L’ultimo archivio di Parigi rivela il ruolo cancellato: il Ponte.',
          'Orfeo era stato costruito perché nessuno potesse decidere da solo. Poi qualcuno aveva cancellato metà del sistema.',
          'Varano non è soltanto il nemico. È anche l’erede di una menzogna che gli è stata raccontata per tutta la vita.'
        ],
        outro: 'c6_fine'
      },
      {
        n: 7,
        title: 'L’ultima chiave',
        place: 'Firenze · Alba',
        narration: [
          'Nella Camera di Orfeo, sotto Firenze, il Registro aspetta la decisione finale.',
          'Luce, custodia o cenere: tutte le scelte sembrano ripetere le regole del passato.',
          'Beps e Kiki trovano invece uno spazio dopo il diciassettesimo nome. Una riga abbastanza larga per due.'
        ],
        outro: 'c7_uscita'
      }
    ],

    async start() {
      if (this.playing) return;
      this.playing = true;
      if (!O.CinemaDirector) {
        this.playing = false;
        throw new Error('CinemaDirector non caricato');
      }
      return O.CinemaDirector.play();
    },

    async chapterCard(ch) {
      const root = document.getElementById('cinema-card');
      if (!root) return;
      root.innerHTML = '<div class="cinema-card-inner">' +
        '<small>' + (typeof ch.n === 'number' ? 'CAPITOLO ' + O.roman(ch.n) : 'EPILOGO') + '</small>' +
        '<h2>' + ch.title + '</h2>' +
        '<p>' + ch.place + '</p>' +
        '</div>';
      root.classList.add('show');
      await O.sleep(1800);
      root.classList.remove('show');
      await O.sleep(500);
    },

    async narrate(text) {
      if (this.stopRequested) return;
      await O.UI.say({ narr: true, text });
      await O.sleep(250);
    },

    async endCard() {
      const root = document.getElementById('cinema-card');
      if (!root) return;
      root.innerHTML = '<div class="cinema-card-inner end"><small>ORFEO</small><h2>FINE</h2><p>Giuseppe & Kiki</p></div>';
      root.classList.add('show');
      await O.sleep(3500);
      root.classList.remove('show');
    },

    mountControls() {
      let c = document.getElementById('cinema-controls');
      if (!c) {
        c = document.createElement('div');
        c.id = 'cinema-controls';
        c.innerHTML = '<span>MODALITÀ CINEMA</span><button id="cinema-skip">Salta scena</button><button id="cinema-exit">Esci</button>';
        document.body.appendChild(c);
      }
      let card = document.getElementById('cinema-card');
      if (!card) {
        card = document.createElement('div');
        card.id = 'cinema-card';
        document.body.appendChild(card);
      }
      document.getElementById('cinema-exit').onclick = () => this.stop();
      document.getElementById('cinema-skip').onclick = () => {
        if (O.UI.typing) O.UI.finishTyping();
        const cs = document.getElementById('cutscene');
        if (O.Cutscene.playing && cs) cs.click();
        else if (O.UI._sayAdv) O.UI._sayAdv();
      };
    },

    stop() {
      if (O.CinemaDirector) return O.CinemaDirector.stop();
      this.stopRequested = true;
    },

    cleanup() {
      this.playing = false;
      this.stopRequested = false;
      document.body.classList.remove('cinema-active');
      const c = document.getElementById('cinema-controls');
      const card = document.getElementById('cinema-card');
      if (c) c.remove();
      if (card) card.remove();
      O.UI.hideSay();
      O.Game.toTitle();
    }
  };

  O.Cinema = Cinema;
})();