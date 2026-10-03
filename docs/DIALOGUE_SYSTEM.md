# DIALOGHI, SCRIPT E CONDIZIONI

Tutto il comportamento narrativo è scritto in `data/*.json` con un piccolo linguaggio di **script** e uno di **condizioni**.

## 1. Condizioni

Espressioni booleane con `&&`, `||`, `!`, parentesi e confronti `== != >= <= > <`. Stringhe tra apici singoli.

| Identificatore | Valore |
|---|---|
| `flag.nome` | valore della flag (assente = falso) |
| `item.id` | l'oggetto è nell'inventario |
| `stat.fiducia` · `stat.legame` · `stat.conoscenza` | valore nascosto |
| `puzzle.id` | enigma risolto |
| `perr.id` | numero di errori commessi nell'enigma |
| `clue.id` | indizio ottenuto |
| `topic.dialogo.tema` | tema già usato |
| `col.id` | collezionabile raccolto |
| `visited.scena` | scena già visitata |
| `chapter` | capitolo corrente (numero) |
| `active` | `'beps'` o `'kiki'` |
| `scene` | scena visualizzata |
| `together` | i protagonisti si muovono insieme |
| `present.kiki` | il personaggio è in gioco |
| `count.collectibles` · `count.docs` · `count.photos` · `count.recordings` · `count.symbols` · `count.clues` | contatori |
| `evidence` | numero di indizi marcati come *prova* |
| `rel.legame` | livello qualitativo 0–4 |
| `ending.id` | finale già visto in qualunque partita (profilo) |

Esempi: `flag.met_kiki && !item.medaglione`, `chapter>=5 && stat.legame>=14`, `active=='kiki' || together`.

## 2. Script

Uno script è un array di passi:

```json
[
  "Testo detto dal personaggio attivo.",
  "kiki[smile]: Testo di Kiki con espressione sorridente.",
  "narr: Testo del narratore (corsivo, senza ritratto).",
  "@give:usb",
  { "if": "flag.x", "do": ["…"], "else": ["…"] },
  { "choice": [
      { "label": "«Risposta»", "do": ["…"], "if": "condizione", "tone": "tender", "id": "scelta_memorizzata" },
      { "label": "Azione senza battuta", "line": "beps: battuta diversa", "do": ["…"] }
  ] },
  { "random": [["variante A"], ["variante B"]] }
]
```

- **Speaker**: qualunque id di `characters.json`, oppure `self` (attivo), `other` (partner), `narr`/`note`.
- **Espressioni**: `neutral, smile, laugh, surprised, worried, sad, angry, think, skeptical, tender, determined, scared`. Senza espressione si usa quella di default calcolata dalla relazione (Kiki è `skeptical` finché non si fida, `tender` quando il legame è alto).
- Un array composto solo da oggetti `{ "if", "do" }` (senza `else`) è una **lista di rami**: si esegue il primo la cui condizione è vera.
- Ovunque si può usare un oggetto `{ "beps": …, "kiki": … }` per dare testi/script diversi a seconda del protagonista attivo.
- Segnaposto nel testo: `{beps}`, `{kiki}`, `{partner}`, `{self}`, `{rel:legame}`, `{varano}` (riga epilogo del Notaio).

### Comandi `@`

| Comando | Effetto |
|---|---|
| `@give:a,b` / `@take:a,b` | aggiunge/rimuove oggetti (toast «Ottenuto») |
| `@flag:nome` · `@flag:nome=valore` · `@unflag:nome` · `@inc:nome` | flag |
| `@stat:legame+1` · `@stat:fiducia-1` · `…+1 quiet` | statistica nascosta (con o senza feedback discreto) |
| `@clue:id` · `@objective:id` · `@person:id` | taccuino |
| `@goto:scena` · `@goto:scena@x,y` | sposta il personaggio attivo (e il partner se insieme) |
| `@place:kiki=scena@x,y,l` | colloca un personaggio altrove (puzzle cooperativi) |
| `@show:id` · `@hide:id` · `@join` · `@together:false` | presenza del partner |
| `@switch:kiki` · `@lockswitch` · `@unlockswitch` | protagonista attivo |
| `@walk:x,y` · `@walkchar:kiki=x,y` · `@face:l` · `@anim:pickup` | movimento e animazioni |
| `@dialogue:id` · `@puzzle:id` · `@solve:id` · `@cutscene:id` | avvia sottosistemi |
| `@chapter:n` | carta del capitolo e cambio capitolo |
| `@collect:id` | raccoglie un collezionabile |
| `@sfx:id` · `@music:id` · `@ambience:id` | audio |
| `@wait:ms` · `@shake` · `@flash` · `@toast:testo` · `@note:testo` · `@title:testo` · `@refresh` · `@save` | varie |
| `@ending` | apre la scelta finale |

## 3. Hotspot (`data/scenes.json`)

```jsonc
{ "id": "armadio", "name": "Armadio metallico",
  "rect": [330, 290, 230, 400],            // x, y, w, h nel mondo 1920×1080
  "at": [460, 820], "face": "l",           // punto d'interazione e direzione
  "art": { "k": "safe", "c": "#4a5058" },  // fallback procedurale (overlay:true = visibile anche sopra lo sfondo reale)
  "if": "flag.sandro_ok",                  // visibilità
  "verb": "use",                           // azione principale (altrimenti dedotta)
  "only": "beps", "onlyMsg": { "kiki": ["…"] },
  "look": { "beps": "…", "kiki": "…" },    // clic destro / pressione lunga
  "use":  [ { "if": "…", "do": [ … ] }, { "do": [ … ] } ],
  "items": { "coltellino": [ … ], "*": [ … ] },   // oggetto usato sull'hotspot
  "talk": "id_dialogo",
  "exit": { "to": "c1_lungarno", "if": "flag.x", "else": [ … ] },
  "col": "doc_01"                          // collezionabile (usa = raccogli, poi sparisce)
}
```
Gli NPC (`npcs`) hanno `id`, `char`, `x`, `y`, `dir`, `if`, `talk`, `look`, opzionale `scale`. Il partner è un bersaglio automatico: «Parla» apre `partner_kiki`/`partner_beps`, gli oggetti usano la loro mappa `items`.

## 4. Dialoghi a temi (`data/dialogues.json`)

```jsonc
"archivista": {
  "npc": "archivista",
  "first":  [ … ],              // solo al primo incontro
  "intro":  [ … ],              // incontri successivi
  "byeLabel": "Arrivederci",
  "bye": [ … ],                 // eseguito alla chiusura
  "linear": false,              // true = sequenza senza menu (scene scriptate)
  "topics": [
    { "id": "orfeo", "label": "Che cos'è Orfeo?", "icon": "symbol",
      "if": "flag.catalogo_ok", "once": true, "optional": false, "special": false,
      "do": [ … ], "repeat": [ … ], "end": false }
  ],
  "items": { "promemoria": [ … ], "*": [ … ] }   // «Mostra un oggetto…»
}
```
- **Icone**: `talk, question, photo, symbol, key, map, person, heart, doc, list, eye, bye, item, warning, us, tape, city, lock, phone`.
- **Nuovo**: un tema mai visto mostra l'etichetta *nuovo*.
- **Consumabile**: `once: true` lo rimuove dopo l'uso (obbligatorio se dà statistiche: il validatore lo controlla).
- **Opzionale**: bordo tratteggiato. **Speciale**: colore rosa (es. «Noi due», disponibile dal Capitolo 5).
- **Condizionati da relazione**: `"if": "stat.fiducia>=2"`, varianti interne con `if/else`.

## 5. Relazione

| Statistica | Livelli qualitativi (soglie) | Effetti principali |
|---|---|---|
| Fiducia | Diffidenza · Cautela (3) · Fiducia (7) · Fiducia piena (11) · Incondizionata (14) | Kiki dà subito il medaglione, legge la lettera ad alta voce, il segnale «Federica»; finali I Custodi e Segreto |
| Legame | Sconosciuti · Alleati (4) · Amici (10) · Qualcosa di più (18) · Inseparabili (26) | bacio sul tetto di Istanbul, espressioni tenere, «Noi due», epiloghi di Luce e Cenere |
| Conoscenza | Brancolate · Prime tracce (8) · Il quadro si delinea (18) · Conoscete Orfeo (28) · Quasi tutto (38) | finale La Luce (≥30 + almeno 9 prove), finale Segreto |

I numeri non compaiono mai: il taccuino («Noi due») mostra frasi e un indicatore a cinque tacche; le variazioni producono un toast discreto («Kiki se ne ricorderà»).
