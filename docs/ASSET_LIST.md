# ASSET LIST — PRODUZIONE

La lista operativa e sempre aggiornata, con **percorsi esatti, dimensioni, trasparenza, numero di frame e stato (presente/mancante)**, è in
**[ASSET_REQUIREMENTS.md](ASSET_REQUIREMENTS.md)**, generata da `node tools/asset-list.mjs`.

Riepilogo per categoria:

| Categoria | Quantità | Percorso |
|---|---|---|
| Fondali | 39 scene | `assets/backgrounds/<scena>.webp` |
| Sprite Beps e Kiki | 10 animazioni ciascuno (idle, walk, run, talk, use, pickup, inspect, read, phone, reaction) | `assets/sprites/<id>/<anim>.png` |
| Sprite NPC | 14 personaggi (idle, talk) | `assets/sprites/<id>/` |
| Ritratti | Beps e Kiki × 12 espressioni; Varano × 6; NPC × 5 | `assets/portraits/<id>/<espressione>.png` |
| Icone oggetti | 28 | `assets/items/<id>.png` |
| Oggetti di scena rimovibili | vedi tabella | `assets/items/scene/<scena>_<hotspot>.png` |
| Cutscene | 17 sequenze, ~38 inquadrature | `assets/cutscenes/<id>_<n>.webp` |
| Enigmi | Foto 1944, Foto 1967, mappa, 4 quarti del Sigillo | `assets/puzzles/` |
| Fotografie collezionabili | 12 | `assets/collectibles/photo_XX.jpg` |
| Titolo | 1 | `assets/gui/title.jpg` |
| Musica | 9 temi | `assets/audio/music/<id>.ogg` |
| Ambienti | 8 loop | `assets/audio/ambience/<id>.ogg` |
| Effetti | 15 | `assets/audio/sfx/<id>.ogg` |

Personaggi: Beps, Kiki, Aurelio Varano (il Notaio, «Nemico 1»), Ottavia Ricci (archivista), Sandro (capocantiere), Tommaso (barista), Hélène Marchetti, Monsieur Albert, Don Ilario Cesti, Mastro Neri, Dott.ssa Bellandi, Selim Aydın, Emre, gli agenti di Orfeo, la donna in nero.

## Immagini caricate con nomi generati — come sono state collegate

Le immagini prodotte con un generatore arrivano con nomi arbitrari. Il gioco carica solo i percorsi «canonici» (o quelli indicati esplicitamente nei dati), quindi:

- **Sprite** — le strisce sorgente restano in `assets/sprites/main_characters/` e `assets/sprites/npc/`; `python3 tools/normalize-assets.py` le ritaglia in celle pulite (le figure sconfinavano nel fotogramma vicino), allinea i piedi e scrive `assets/sprites/<personaggio>/<animazione>.png`. La tabella `MAP` nello script dice cosa diventa cosa (es. `archivista_firenze_pose_1` → `archivista/idle`, `storico_parigi` → `albert`, `antiquario_istanbul` → `selim`, `bibliotecario_roma` → `ilario`, `agente_orfeo_1` → `agente`). Lo script stampa i blocchi `sprites` per `data/characters.json` (larghezza della cella diversa per ogni animazione: il motore usa `w/h`).
- **Ritratti** — i busti scontornati di `assets/beps/`, `assets/kiki/` vengono composti 600×720 su fondo carta in `assets/portraits/<id>/<espressione>.png` (tabella `PORTRAITS`; le etichette stampate sotto skeptical/tender vengono tagliate). Beps `surprised` usa il busto *scared*; `worried` è stato ricucito dai due ritagli sbagliati.
- **Oggetti** — lo script toglie dalle icone le strisce degli oggetti vicini e ricava `medaglione_b`/`medaglione_k` dalle due metà di `medaglione.png`.
- **Fondali** — il campo `bg` della scena punta al file: `c1_lungarno` ← `bg_lungarno_notte_01.jpg`, `c1_corridoio` ← `bg_archivio_firenze_room_01.jpg` (Scaffale O-17), `c3_sala_cassetti` ← `bg_archivio_firenze_room_02.jpg` (Schedario romano), `c5_camera_anelli` ← `bg_camera_segreta_orfeo_01.jpg`, `c1_studio` e `c4_studio` ← `bg_studio_architettura_firenze_clean.jpg` (computer, stampante, macchinetta, bacheca, porta: gli oggetti dell'ufficio di Beps; nel Cap. IV con `bgFilter` più spento). `c1_studio.webp` per ora non è usato. Hotspot e aree camminabili di queste scene sono stati riposizionati sulle immagini.
- **Stesso fondale, altra ora** — `bgFilter` (filtro CSS) e `bgTint` (sfumatura sovrapposta) permettono di riusare un'immagine: `c7_alba` usa il Lungarno notturno virato all'alba. La schermata del titolo usa `assets/gui/title.*` se c'è, altrimenti `piazza_firenze_notte.webp`.
- **Tutte le immagini caricate sono in uso**: `first_meeting` → `incontro`, `cutscene_05` → `allarme_roma`, `kiki_rescue` + `cutscene_04` → `grotta`, `varano_confrontation` → `varano_parigi`, `c1_studio.webp` → `c1_fine`; `membro_consiglio_orfeo_2` → Mastro Neri, `membro_consiglio_orfeo_1` → il Cronista (`custode`), `agente_orfeo_2` → `agente2`.
- **Menu** — `assets/gui/title_menu.webp` (convertito da `reference/gui/menu_principale.png`) è la schermata del titolo; le posizioni dei pulsanti sono calcolate sulle targhe dipinte (in `src/main.js`, `toTitle`). Se cambi l'immagine, tieni le targhe nello stesso punto.
- **Cutscene** — il campo `img` dell'inquadratura punta al file (es. `fine_luce_1` ← `cutscene_03_rivelazione_orfeo.jpg`, `intro_1` ← `reference/cutscenes/florence_night.webp`).

Dopo aver aggiunto o rinominato file: `python3 tools/normalize-assets.py` (se servono sprite/ritratti), poi `node tools/scan-assets.mjs && node tools/build-data.mjs && node tools/asset-list.mjs`.
