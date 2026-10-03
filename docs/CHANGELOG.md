# CHANGELOG

## 1.0.2 — Più fondali reali

- Lungarno all'alba (Cap. VII) usa il fondale del Lungarno virato all'alba (`bgFilter`/`bgTint`), con hotspot riposizionati.
- La schermata del titolo usa la piazza fiorentina notturna.
- Personaggi più grandi (altezza base 470 → 560) e scala di ogni scena con fondale reale tarata su porte, tavoli e ringhiere.
- Ufficio della ditta (Cap. I e IV) sul fondale con computer, stampante, macchinetta e bacheca; hotspot riposizionati.

## 1.0.1 — Collegamento delle immagini caricate

- Sprite reali per Beps, Kiki, Varano, Ottavia, Don Ilario, Selim, Monsieur Albert e gli agenti (strisce ricavate con `tools/normalize-assets.py`); il motore usa la proporzione reale di ogni striscia.
- Ritratti aggiuntivi di Beps e Kiki dai busti caricati; ritratto *worried* di Beps ricostruito, *surprised* sostituito.
- Fondali reali per Lungarno, Deposito, Sala dei Cassetti, Camera degli Anelli e ufficio devastato, con hotspot e aree camminabili riposizionati (anche per Ufficio e Archivio Storico).
- 12 inquadrature delle cutscene collegate alle illustrazioni caricate.
- Icone oggetti ripulite; metà del medaglione ricavate dall'immagine intera.
- Descrizioni di Varano e di Kiki «sconosciuta» allineate all'aspetto degli sprite.

## 1.0.0 — Punta-e-clicca completo (ottobre 2026)

Ricostruzione del prototipo v0.1 (una scena, tre hotspot) in un'avventura grafica completa e data-driven.

### Aggiunto
- **Motore a sistemi** (`src/`): GameState, SceneManager, CharacterManager, MovementController, HotspotManager, ScriptRunner, DialogueManager, InventoryManager, PuzzleManager, JournalManager, RelationshipManager, SaveManager, AudioManager, CutsceneManager, UIManager, HintManager, CollectibleManager, EndingManager, DebugManager. Vedi [ARCHITECTURE.md](ARCHITECTURE.md).
- **Contenuti in `data/*.json`**: 7 capitoli, 39 scene (6/5/6/5/7/6/4), 37 dialoghi, 28 oggetti, 9 enigmi, 60 indizi (12 prove), 16 personaggi, 43 collezionabili, 17 cutscene, 4 finali.
- **Movimento**: click-to-walk con pathfinding su poligoni (anche per personaggio e condizionali), corsa col doppio clic, scala prospettica, flip, partner che segue, punti d'interazione, animazioni idle/walk/run/talk/use/pickup/inspect/read/phone/reaction; supporto a sprite strip 6–8 frame.
- **Doppio protagonista** con posizioni indipendenti, cambio (Tab/ritratto) consentito o bloccato per scena, azioni esclusive, puzzle cooperativi (deposito al buio, camera oscura, Sala dei Cassetti + fuga, botola, lastra del terzo gradino, paratoia, Camera di Orfeo).
- **Dialoghi a temi** con icone, nuovo/opzionale/consumabile/speciale, condizioni su indizi/oggetti/statistiche, «Mostra un oggetto», tema «Noi due» dal Cap. 5, ritratti con 12 espressioni dinamiche.
- **Relazione nascosta** Fiducia/Legame/Conoscenza con effetti su battute, temi, espressioni, bacio, epiloghi, finali; nel taccuino solo descrizioni qualitative.
- **Inventario**: esamina (anche condizionale), oggetto su hotspot/personaggio/oggetto, combinazioni, trasformazioni (frammenti → promemoria, libretto → mappa, metà → medaglione, 4 frammenti → Sigillo), feedback specifici.
- **Enigmi**: frammenti, catena O-17, sovrapposizione foto, medaglione sulla mappa, 17 cassetti, Sigillo, anelli, cronologia con contraddizioni, Ruota dei Nomi + meccanismo cooperativo finale. 3 suggerimenti ciascuno.
- **Suggerimenti** a 3 livelli per obiettivo e per enigma, solo su richiesta.
- **Taccuino**: obiettivi, indizi (con prove), persone, Lista dei 17, Archivio Orfeo, Noi due, capitoli.
- **Archivio Orfeo**: 17 documenti, 12 fotografie, 7 registrazioni, 7 simboli (che compongono la frase del XVIII).
- **Finali**: La Luce, I Custodi, Cenere (con epiloghi variabili) e il segreto **Il Diciottesimo Nome**; post-credit per ciascuno; profilo dei finali scoperti.
- **Nemico 1 → Aurelio Varano**, il Notaio: nome, passato, motivazioni, ruolo XI, conflitto (nonno delatore, nonna salvatrice), ambiguità, quattro esiti.
- **La donna nelle fotografie**: Euridice come ruolo ereditato (Lucia, Ada, Hélène, una «seconda Testimone»), con dubbio finale.
- **Cutscene** «illustrazione animata» con pan/zoom, fx (pioggia, polvere, luce, neve, nebbia, braci), letterbox, didascalie, salto.
- **GUI**: HUD minimo, inventario a cassetto, cursori custom (neutro, guarda, usa, parla, uscita, oggetto), etichette, evidenzia punti interattivi, carte capitolo, toast, menu, opzioni (volumi, mute, audio sintetico, velocità testo, avanzamento automatico, scintille, riduzione animazioni, schermo intero), schermate finali e titoli.
- **Salvataggi**: autosave in punti stabili, 6 slot con miniatura, Continua, elimina, versioning e migrazioni (v1→v3). Vedi [SAVE_FORMAT.md](SAVE_FORMAT.md).
- **Audio**: musica/ambienti/sfx con fade e volumi; fallback sintetico WebAudio; AudioContext creato solo dopo un gesto dell'utente.
- **Asset**: manifest (`assets/manifest.json`) + fallback procedurali per fondali, props, personaggi, ritratti, icone, foto d'archivio. Nessuna richiesta 404.
- **Mobile**: touch (tocco = azione, pressione lunga = guarda), layout responsive, avviso di rotazione, nessuno scroll orizzontale.
- **Modalità sviluppatore** (`?debug=1`).
- **Strumenti**: `tools/validate.mjs`, `tools/build-data.mjs`, `tools/scan-assets.mjs`, `tools/asset-list.mjs`; **test** `tests/playthrough.mjs` (full/minimal/save/mobile) e `tests/screens.mjs`; GitHub Action che rigenera manifest e bundle.
- Documentazione completa in `docs/`.

### Modificato
- `index.html` riscritto (struttura a livelli, HUD, pannelli, script dei sistemi).
- `src/style.css` riscritto.
- `README.md` aggiornato (avvio, Pages, comandi, struttura, test).

### Rimosso
- `src/game.js` (prototipo monolitico, sostituito dai sistemi).
- `data/story.json` (mai caricato): i suoi contenuti — titoli, luoghi, relazioni e frasi «core» dei 7 capitoli — sono confluiti **invariati** in `data/chapters.json`. Le battute del prototipo («Doveva essere un intervento di dieci minuti…», la voce registrata, l'incontro in archivio con le tre risposte) sono preservate nel Capitolo I.

### Problemi noti
- **Grafica e audio sono provvisori** (procedurali) finché non vengono aggiunti gli asset elencati in [ASSET_REQUIREMENTS.md](ASSET_REQUIREMENTS.md). Quando arrivano gli sfondi reali, gli hotspot potrebbero richiedere piccoli aggiustamenti dei `rect` per combaciare con il disegno.
- Gli attori sono sempre disegnati davanti ai props (non c'è occlusione «dietro la scrivania»): con sfondi reali si può aggiungere un livello `foreground` per scena (supportato dal motore).
- Testato in automatico solo su Chromium (desktop e mobile emulato). Safari/Firefox e dispositivi reali vanno verificati con la checklist di [TEST_PLAN.md](TEST_PLAN.md).
- Le statistiche massime superano ampiamente le soglie dei finali per chi esplora tutto: è voluto (i finali si differenziano per scelta), ma le soglie si possono ritoccare in `data/endings.json`.
- Le voci non sono doppiate.
