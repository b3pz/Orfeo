# FORMATO DEI SALVATAGGI

Tutto in `localStorage` del browser (nessun server). Se `localStorage` non è disponibile (navigazione privata restrittiva) i salvataggi restano in memoria per la sessione e il menu lo segnala.

## Chiavi

| Chiave | Contenuto |
|---|---|
| `orfeo.save.auto` | salvataggio automatico |
| `orfeo.save.1` … `orfeo.save.6` | slot manuali |
| `orfeo.profile` | profilo persistente tra le partite: finali visti, collezionabili mai trovati |
| `orfeo.settings` | velocità testo, avanzamento automatico, scintille, riduzione animazioni |
| `orfeo.audio` | volumi, mute, audio sintetico |
| `orfeo.debug` | `"1"` attiva la modalità sviluppatore |

## Struttura di uno slot

```jsonc
{
  "meta": {
    "version": 3,                 // versione dello stato
    "ts": 1791000000000,          // timestamp (ms)
    "chapter": 3, "chapterTitle": "Diciassette nomi",
    "scene": "c3_biblioteca", "sceneName": "Biblioteca Teodosiana — Salone", "place": "Roma",
    "playtime": 5321,             // secondi
    "active": "beps",
    "thumb": "data:image/jpeg;base64,…"  // 192×108, dallo sfondo corrente (reale o procedurale)
  },
  "state": {
    "version": 3,
    "startedAt": 1790990000000, "playtime": 5321,
    "chapter": 3,
    "active": "beps", "switchLocked": false, "together": true,
    "chars": {
      "beps": { "scene": "c3_biblioteca", "x": 640, "y": 900, "dir": 1, "present": true },
      "kiki": { "scene": "c3_biblioteca", "x": 800, "y": 880, "dir": -1, "present": true }
    },
    "inventory": ["coltellino", "moneta", "usb", "foto1944", "medaglione", "…"],
    "flags": { "met_kiki": true, "coop": 3, "…": "…" },
    "stats": { "fiducia": 4, "legame": 9, "conoscenza": 15 },   // nascoste al giocatore
    "clues": { "promemoria_1966": true }, "clueOrder": ["…"],
    "objective": "o3_sala", "objectiveLog": ["o1_esamina", "…"],
    "topicsUsed": { "archivista.orfeo": true }, "topicsSeen": { "…": true },
    "collectibles": { "doc_01": true },
    "puzzles": { "c1_catena": { "solved": true, "errors": 1, "state": { "chain": ["O-1"] }, "attempts": 1, "hints": 0 } },
    "hints": { "obj:o1_catena": 2 }, "hintsTotal": 2,
    "visited": { "c1_studio": true },
    "choices": {}, "people": { "archivista": true },
    "ending": null
  }
}
```

## Quando si salva

- **Autosave**: all'ingresso in ogni scena, alla fine di ogni interazione (con un breve ritardo), alla fine di dialoghi ed enigmi, quando la scheda va in background o la pagina viene chiusa — **solo in punti stabili** (nessuno script in corso), così il caricamento non riprende mai a metà di una sequenza.
- Non si salva durante cutscene, al titolo e dopo l'inizio di un finale: l'autosave resta quello prima della scelta, per poter rigiocare gli altri finali («Carica il salvataggio prima della scelta»).
- **Manuale**: Menu → Salva partita (6 slot, con conferma per sovrascrivere). **Elimina** con conferma.

## Versioning e migrazioni

`SaveManager.MIGRATIONS[v]` trasforma uno stato dalla versione `v` alla successiva; al caricamento si applicano in catena fino a `GameState.SAVE_VERSION` (oggi **3**).
- **v1 → v2**: formato del prototipo (inventario di oggetti `{id,name,icon}`) → id stringa; `photo` → `foto1944`, `note` → `scheda_o17`; aggiunte le statistiche.
- **v2 → v3**: campo unico `scene` → posizioni separate per Beps e Kiki (`chars`), `active`.

Per aggiungere una v4: incrementa `SAVE_VERSION` in `GameState.js` e aggiungi `MIGRATIONS[3] = (s) => { …; s.version = 4; return s; }`. Il test `tests/playthrough.mjs save` verifica una migrazione v1 → corrente.

Uno slot illeggibile viene mostrato come «Dati danneggiati» e può essere eliminato; non blocca il gioco. Se lo stato caricato punta a una scena inesistente (dati cambiati), il gioco riparte dall'inizio del capitolo salvato.
