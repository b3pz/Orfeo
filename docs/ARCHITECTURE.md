# ARCHITETTURA

Motore in JavaScript vanilla, **script classici** (niente moduli ES, niente bundler) raccolti nel namespace globale `window.Orfeo` (abbreviato `O`). Ordine di caricamento in `index.html`; ogni file è un IIFE che registra un sistema.

```
              data/*.json ──DataLoader──▶ O.Data
                                             │
   input (mouse/touch/tastiera)              ▼
        │                         ┌──────────────────┐
        ▼                         │    GameState     │◀── SaveManager (localStorage, migrazioni)
  HotspotManager ──▶ Movement ──▶ │  (O.State.d)     │
        │                         └──────────────────┘
        ▼                                 ▲   ▲
   ScriptRunner ── comandi @… ────────────┘   │ condizioni (util.js)
        │   ├─▶ DialogueManager (temi) ─▶ UIManager (box, ritratti, temi, scelte)
        │   ├─▶ PuzzleManager ─▶ src/puzzles/*
        │   ├─▶ CutsceneManager
        │   ├─▶ SceneManager ─▶ CharacterManager / FallbackArt / AssetManager / AudioManager
        │   ├─▶ InventoryManager, JournalManager, CollectibleManager, RelationshipManager
        │   └─▶ EndingManager
        └─▶ HintManager (contesto: enigma aperto o obiettivo)
```

## Sistemi

| Sistema | File | Responsabilità |
|---|---|---|
| util | `src/core/util.js` | DOM builder `O.el`, bus eventi `O.on/emit`, **linguaggio delle condizioni** (`O.cond`) compilato e messo in cache |
| GameState | `src/core/GameState.js` | stato serializzabile della partita, resolver delle condizioni (`flag.x`, `item.x`, `stat.x`, `count.symbols`…) |
| AssetManager | `src/core/AssetManager.js` | legge `assets/manifest.json`; `has/first/image/preload`; non chiede mai file assenti |
| DataLoader | `src/core/DataLoader.js` | `fetch` dei JSON, fallback a `data/bundle.js` (file://) |
| FallbackArt | `src/art/FallbackArt.js` | SVG procedurali: fondali per tipo (interno, esterno, sotterraneo), ~60 props, personaggi animabili, ritratti con 12 espressioni, icone, foto d'archivio |
| SceneManager | `src/systems/SceneManager.js` | costruzione scena (sfondo reale o procedurale, props, fx, attori, hotspot, audio), transizioni, `enter/firstEnter`, **cambio protagonista** |
| CharacterManager | `src/systems/CharacterManager.js` | attori DOM, sprite strip 6–8 frame o SVG, animazioni (idle, walk, run, talk, use, pickup, inspect, read, phone, reaction), flip, scala prospettica |
| MovementController | `src/systems/MovementController.js` | poligoni camminabili (anche per personaggio e condizionali), **pathfinding a grafo di visibilità**, corsa, partner che segue |
| HotspotManager | `src/systems/HotspotManager.js` | bersagli (hotspot, NPC, partner), cursori, etichette, clic/clic destro/pressione lunga, verbi, restrizioni `only` |
| ScriptRunner | `src/systems/ScriptRunner.js` | esegue gli script data-driven (battute, comandi `@`, `if/else`, scelte, rami) |
| DialogueManager | `src/systems/DialogueManager.js` | dialoghi a temi, «Mostra un oggetto», temi consumabili/nuovi/opzionali/speciali |
| InventoryManager | `src/systems/InventoryManager.js` | selezione, esamina (anche condizionale), combinazioni, feedback |
| PuzzleManager | `src/systems/PuzzleManager.js` + `src/puzzles/` | shell modale, stato salvato, errori contati, suggerimenti, `onSolve/onLeave`, `auto()` per i test |
| JournalManager | `src/systems/JournalManager.js` | taccuino: obiettivi, indizi, persone, Lista dei 17, Archivio Orfeo, «Noi due», capitoli |
| RelationshipManager | `src/systems/RelationshipManager.js` | livelli qualitativi, feedback discreti, espressione di default |
| HintManager | `src/systems/HintManager.js` | 3 livelli per contesto, conteggio (serve al «finale perfetto») |
| CollectibleManager | `src/systems/CollectibleManager.js` | Archivio Orfeo, contatori (`count.docs`, `count.symbols`, `evidence`…), profilo persistente |
| SaveManager | `src/systems/SaveManager.js` | autosave, 6 slot, miniature, migrazioni, profilo (finali scoperti) |
| AudioManager | `src/systems/AudioManager.js` | musica/ambiente/sfx, dissolvenze, volumi, mute, sintesi di riserva |
| CutsceneManager | `src/systems/CutsceneManager.js` | inquadrature con pan/zoom, fx, letterbox, didascalie, salto |
| EndingManager | `src/systems/EndingManager.js` | requisiti, scelta, epiloghi variabili, titoli, post-credit |
| UIManager | `src/systems/UIManager.js` | scaling 1920×1080, HUD, box dialoghi con macchina da scrivere, temi, scelte, toast, menu, salvataggi, opzioni, taccuino, enigmi, finali, tastiera |
| DebugManager | `src/systems/DebugManager.js` | modalità sviluppatore (`?debug=1`) |
| Game | `src/main.js` | avvio con barra di caricamento, titolo, nuova partita/continua/carica, autosave nei punti stabili, API `O.test` |

## Principi

- **Tutto il contenuto è dati.** Scene, hotspot, battute, temi, enigmi, finali e cutscene vivono in `data/*.json`; il codice non contiene testo di storia.
- **Mondo logico fisso 1920×1080** scalato con `transform` (letterbox). L'interfaccia è in coordinate schermo e responsive.
- **Fallback ovunque**: asset mancante → disegno procedurale; audio mancante → sintesi o silenzio; dato mancante → avviso in console, nessun crash.
- **Punti stabili**: l'autosave avviene solo a script terminato (fine interazione, fine dialogo, fine enigma, ingresso scena). Ricaricare la pagina riporta sempre a uno stato coerente.
- **Nessun vicolo cieco**: ogni enigma si lascia e si riprende; gli oggetti chiave non si consumano prima dell'ultimo uso; le uscite bloccate spiegano sempre perché; il validatore e i test lo verificano.

## Doppio protagonista

`state.chars.{beps,kiki}` tiene scena, posizione, direzione e presenza di ciascuno. `state.together` decide se il partner segue. Il **cambio** (Tab o ritratto) è vietato se `switchLocked`, se il partner è assente, durante script/dialoghi/enigmi o nelle scene con `"switch": false`. Se i due sono in scene diverse, il cambio sposta la vista sulla scena dell'altro. Strumenti per i puzzle cooperativi:
- `"only": "kiki"` su un hotspot (l'altro risponde con `onlyMsg`);
- `walkFor` (poligoni camminabili separati per personaggio, es. Camera di Orfeo) e `walkIf`;
- comandi `@place`, `@together:false`, `@join`, `@switch`, `@lockswitch/@unlockswitch`.

## Rendering

Livelli dentro `#world`: `#bg-layer` (img reale o SVG) → `#prop-layer` (props procedurali o PNG `assets/items/scene/…`, mostrati sopra uno sfondo reale solo se `overlay: true`) → `#actor-layer` (z-index = y) → `#hotspot-layer` (pulsanti trasparenti, accessibili) → `#fx-layer` (pioggia, polvere, luce, nebbia, neve, braci).

## Estendere

- **Nuova scena**: aggiungi un oggetto in `data/scenes.json` (vedi campi in `docs/DIALOGUE_SYSTEM.md`), un'uscita da una scena esistente, poi `node tools/validate.mjs && node tools/build-data.mjs`.
- **Nuovo tipo di enigma**: registra `O.PuzzleTypes.<tipo> = { create(body, def, api) { … return { auto(), destroy() } } }` in un file di `src/puzzles/` e includilo in `index.html`. Usa `api.save/solve/error/good/status`.
- **Nuovo comando di script**: aggiungi una funzione a `COMMANDS` in `ScriptRunner.js` (il validatore la riconosce automaticamente).
