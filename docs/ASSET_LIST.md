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
