# CLAUDE IMPLEMENTATION PLAN — Il Segreto di Orfeo

## 1. Audit della repo (stato v0.1, commit `4b22fbb`)

| Area | Stato trovato |
|---|---|
| File | `index.html`, `src/game.js` (120 righe), `src/style.css`, `data/story.json` (sinossi 7 capitoli), `docs/ART_BIBLE.md`, `docs/ASSET_LIST.md`, `project.json` |
| Architettura | Script unico globale, stato in un oggetto `state`, hotspot cablati in HTML (3 bottoni), nessun modulo |
| Scene | 1 sola (studio/archivio misti), sfondo CSS a gradienti |
| Dialoghi | funzione `say()` a catena di callback, 1 scelta a 3 opzioni senza effetti |
| Inventario | 3 oggetti con glifi Unicode, selezionabili ma **mai usabili** (selezione senza effetto: dead code) |
| Save | assente — un refresh azzera tutto |
| Hotspot | 3 (`desk`, `archive`, `door`), verbi Guarda/Usa/Parla; "Parla" non è gestito da nessun hotspot |
| Puzzle | nessuno reale (sequenza obbligata di 3 click) |
| Asset | **nessuno**: le cartelle `assets/*` citate nel README non esistono. Nessuna immagine di Beps, Kiki o Nemico 1 presente in repo |
| `data/story.json` | **mai caricato** dal codice (dead data) |
| Personaggi | un rettangolo CSS fisso, nessun movimento |
| Bug | ESC chiude il dialogo e interrompe la catena (soft-lock narrativo: l'obiettivo non si aggiorna più); `selectedItem` non ha effetti; label hotspot posizionata con `clientX` dentro un contenitore `position:relative` (offset errato); su mobile hover non esiste → nessun feedback |
| Mobile | `100vh` con barre fisse: su telefoni in verticale lo stage diventa minuscolo; nessun touch handling |
| Run completa | eseguita in Chromium headless: Intro → Scrivania → Archivio → Porta → incontro con Kiki. Fine contenuto. Nessun errore in console |

Conclusione: la base è un prototipo di una scena. "Completo ma prototipale" vale per la **storia** (7 capitoli in `story.json`), non per il motore. Il lavoro è quindi una ricostruzione a sistemi, preservando titolo, personaggi (Giuseppe "Beps", Federica "Kiki"), tono, battute esistenti, struttura in 7 capitoli e progressione relazionale (Sconosciuti → Fiducia completa).

## 2. Decisioni architetturali

- **Vanilla JS, nessun build step**: script classici con namespace `window.Orfeo`. Funziona su GitHub Pages (branch deploy), su `python3 -m http.server` e anche aprendo `index.html` da file (grazie a `data/bundle.js`).
- **Contenuti data-driven** in `data/*.json`. `tools/build-data.mjs` genera `data/bundle.js` (fallback per `file://`). In HTTP il gioco legge prima i JSON.
- **Mini-linguaggio** per condizioni (`flag.x && stat.fiducia>=3`) ed effetti (`@give:usb`, `@stat:legame+1`) — vedi `docs/DIALOGUE_SYSTEM.md`.
- **Mondo logico 1920×1080** scalato in letterbox; UI in spazio schermo (leggibile su mobile).
- **Asset con manifest**: `assets/manifest.json` (generato da `tools/scan-assets.mjs` e da una GitHub Action) elenca i file reali. Se un file è nel manifest viene usato, altrimenti si usa un fallback procedurale SVG — nessuna richiesta 404, nessun crash.
- **Doppio protagonista con posizioni indipendenti**: ogni personaggio ha la propria scena/posizione; in modalità "insieme" il partner segue. Permette veri puzzle cooperativi (stanze separate, zone camminabili per personaggio, hotspot `only`).
- **Salvataggi** in `localStorage`, versione + migrazioni, autosave + 6 slot, miniatura rasterizzata dallo sfondo.

## 3. Sistemi (file in `src/`)

`core/util.js` (bus eventi, parser condizioni), `core/GameState.js`, `core/AssetManager.js`, `core/DataLoader.js`, `art/FallbackArt.js`, e in `systems/`: SceneManager, CharacterManager, MovementController, HotspotManager, ScriptRunner, DialogueManager, InventoryManager, PuzzleManager (+ `puzzles/*.js`), JournalManager, RelationshipManager, SaveManager, AudioManager, CutsceneManager, UIManager, HintManager, CollectibleManager, EndingManager, DebugManager. Dettagli in `docs/ARCHITECTURE.md`.

## 4. Fasi

| Fase | Contenuto | Esito |
|---|---|---|
| 1 | audit, refactor a sistemi, save stabile | ✅ |
| 2 | movimento click-to-walk, pathfinding, scaling, protagonista attivo, switch Beps/Kiki | ✅ |
| 3 | inventario (esamina, oggetto→hotspot/personaggio/oggetto), dialoghi a temi con ritratti, taccuino | ✅ |
| 4 | puzzle Cap.1–3 (frammenti + catena O-17, sovrapposizione foto/medaglione, 17 cassetti + fuga cooperativa) | ✅ |
| 5 | puzzle Cap.4–7 (Sigillo, anelli, cronologia, meccanismo finale), branching, requisiti finali | ✅ |
| 6 | Archivio Orfeo (43 collezionabili), finale segreto, audio, polish GUI, cutscene | ✅ |
| 7 | test automatici (validator + playthrough Playwright per i 4 finali), mobile, Pages | ✅ |

## 5. Rischi e mitigazioni

- **Asset finali assenti** → fallback procedurali documentati in `docs/ASSET_REQUIREMENTS.md`; sostituzione = copiare il file al percorso indicato + rigenerare il manifest.
- **Soft-lock** → nessun oggetto chiave consumabile senza sostituto, puzzle sempre ripristinabili, uscite mai bloccate senza alternativa; il validator verifica che ogni oggetto richiesto sia ottenibile prima del punto d'uso e il playthrough automatico percorre tutti i capitoli.
- **Reload a metà scena** → autosave solo in stati stabili (fine script), salvataggio del progresso puzzle.

## 6. Esito

- Tutte le fasi completate in questo branch. Contenuti: 7 capitoli, 39 scene, 9 enigmi, 43 collezionabili, 4 finali.
- Verifica: `node tools/validate.mjs` (0 errori) e `node tests/playthrough.mjs all` (FULL con i 4 finali giocati, MINIMAL senza dead-end → solo Cenere, SAVE/LOAD con migrazione, MOBILE touch): tutti superati, 0 errori in console.
- Asset: nessun asset finale era presente in repo; tutto funziona con fallback procedurali. Lista completa e percorsi esatti in `docs/ASSET_REQUIREMENTS.md`.
- Prossime priorità: vedi la sezione finale di `docs/ASSET_REQUIREMENTS.md` e i «Problemi noti» in `docs/CHANGELOG.md`.
