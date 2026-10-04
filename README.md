# Orfeo

Avventura grafica punta-e-clicca 2D in **sette capitoli** tra Firenze, Parigi, Roma e Istanbul.
Due protagonisti giocabili (Beps e Kiki), dialoghi a temi, enigmi cooperativi, un archivio di 43 collezionabili e **quattro finali** (La Luce, I Custodi, Cenere e il finale segreto *Il Diciottesimo Nome*).

Gira interamente nel browser, senza backend e senza build step: è pensata per **GitHub Pages**.

> **Stato della grafica.** Le illustrazioni finali sono in produzione. Finché un file non è presente, il gioco disegna da solo una versione procedurale temporanea (fondali, personaggi, ritratti con espressioni, oggetti, foto d'archivio) e genera un audio di riserva discreto. Appena un asset reale viene aggiunto al percorso indicato in [`docs/ASSET_REQUIREMENTS.md`](docs/ASSET_REQUIREMENTS.md), viene usato automaticamente.

---

## Avvio locale

```bash
python3 -m http.server 8000      # oppure: npm start
```
poi apri <http://localhost:8000>.

Si può anche aprire direttamente `index.html` dal disco: in quel caso i dati vengono letti da `data/bundle.js` e il manifest asset da `assets/manifest.js`.

## Pubblicazione su GitHub Pages

1. **Settings → Pages → Build and deployment → Deploy from a branch**.
2. Branch `main`, cartella `/ (root)`. Salva.
3. Dopo un minuto il gioco è su `https://<utente>.github.io/<repo>/`.

Il file `.nojekyll` evita l'elaborazione Jekyll. Tutti i percorsi sono relativi, quindi funziona anche in una sottocartella.

### Aggiungere immagini e audio
1. Carica il file al percorso esatto indicato in [`docs/ASSET_REQUIREMENTS.md`](docs/ASSET_REQUIREMENTS.md) (anche da GitHub web: *Add file → Upload files*).
2. La GitHub Action **Asset manifest & data bundle** rigenera `assets/manifest.json` e lo committa da sola.
   In locale: `node tools/scan-assets.mjs`.
3. Ricarica il gioco.

Gli script **non modificano mai** le immagini presenti in `assets/`: leggono la cartella e scrivono solo il manifest.

---

## Comandi di gioco

| Azione | Mouse / tastiera | Touch |
|---|---|---|
| Camminare | clic sul pavimento (doppio clic = corsa) | tocco |
| Azione principale (usa/parla/esci) | clic sinistro sull'hotspot | tocco |
| Guarda / esamina | clic destro | pressione lunga |
| Inventario | passa il mouse sulla linguetta in basso, o `I` | tocca la linguetta |
| Usa oggetto su… | seleziona l'oggetto, poi clicca il bersaglio (hotspot, personaggio o altro oggetto) | idem |
| Esamina oggetto | clic destro sull'oggetto, o «Esamina» | pressione lunga |
| Cambia personaggio | `Tab` o ritratto piccolo in alto a destra | tocca il ritratto |
| Mostra punti interattivi | `Spazio` o icona occhio | icona occhio |
| Taccuino | `J` o icona taccuino | icona |
| Suggerimento (3 livelli) | `H` o `?` | icona `?` |
| Menu, salvataggi, opzioni | `Esc` o icona ≡ | icona ≡ |
| Schermo intero | `F` o Opzioni | Opzioni |

Nei dialoghi: clic/tocco o `Invio`/`Spazio` per avanzare; i numeri `1–9` scelgono le risposte.

---

## Cosa c'è nel gioco

- **7 capitoli, 39 luoghi** (6/5/6/5/7/6/4), ognuno con 5–10 punti osservabili e commenti diversi per Beps e Kiki.
- **Doppio protagonista**: posizioni indipendenti, cambio libero dove consentito, azioni che solo uno dei due può fare, puzzle cooperativi veri (fuga dalla Sala dei Cassetti, camera oscura, Camera di Orfeo divisa da un abisso).
- **Dialoghi a temi** con icone, temi nuovi/opzionali/consumabili, temi sbloccati da indizi, oggetti e relazione, «Mostra un oggetto», tema speciale «Noi due» dal Capitolo 5. Ritratti con 12 espressioni.
- **Relazione nascosta** (Fiducia, Legame, Conoscenza): cambia battute, temi, espressioni, il primo bacio, gli epiloghi e i finali disponibili. Il giocatore vede solo descrizioni qualitative.
- **Inventario completo**: esamina, oggetto→hotspot, oggetto→personaggio, oggetto→oggetto, combinazioni, trasformazioni, feedback su usi sbagliati.
- **9 enigmi** (almeno uno per capitolo): frammenti strappati e catena O-17, sovrapposizione delle foto 1944/1967, medaglione sulla mappa, 17 cassetti, Sigillo di Orfeo, anelli rotanti, cronologia con contraddizioni, Ruota dei Nomi del meccanismo finale. Ognuno con 3 livelli di suggerimento e senza vicoli ciechi.
- **Archivio Orfeo**: 17 documenti, 12 fotografie, 7 registrazioni, 7 simboli.
- **Cutscene** come illustrazioni animate (pan, zoom, parallasse di particelle, pioggia/polvere/luce/neve, letterbox).
- **Salvataggi**: autosave, 6 slot manuali con miniatura, capitolo, luogo e data; «Continua»; cancellazione; versioning con migrazioni.
- **Audio**: musica, ambienti ed effetti con dissolvenze e volumi separati; fallback sintetico se i file mancano.
- **Modalità sviluppatore** nascosta: aggiungi `?debug=1` all'URL (vedi sotto).

## Modalità sviluppatore

Disattivata di default. Si attiva con `?debug=1` nell'URL (o `localStorage.setItem('orfeo.debug','1')`) e si apre col tasto `` ` `` o il pulsante 🐞:
salto a capitolo (con stato plausibile), salto a scena, aggiungi/togli oggetti, imposta statistiche, sblocca indizi/collezionabili/simboli/finali, imposta flag, mostra i flag, risolvi l'enigma aperto, mostra hotspot e zona camminabile, report asset mancanti, azzera salvataggi.

---

## Struttura

```
index.html            pagina unica
src/core/             util (bus, linguaggio delle condizioni), GameState, AssetManager, DataLoader
src/art/              FallbackArt: grafica procedurale temporanea
src/systems/          Scene, Character, Movement, Hotspot, Script, Dialogue, Inventory, Puzzle,
                      Journal, Relationship, Save, Audio, Cutscene, UI, Hint, Collectible, Ending, Debug
src/puzzles/          tipi di enigma (documents, visual, mechanisms)
src/main.js           avvio, titolo, nuova partita/continua, API di test
data/*.json           TUTTI i contenuti: capitoli, scene, dialoghi, oggetti, enigmi, personaggi,
                      collezionabili, finali, cutscene
data/bundle.js        copia generata dei JSON (per file://)
assets/               asset reali + manifest.json generato
tools/                build-data, scan-assets, validate, asset-list
tests/                playthrough end-to-end (Playwright), soluzione completa, screenshot
docs/                 documentazione
```

## Sviluppo e test

```bash
node tools/validate.mjs          # controllo statico dei dati (riferimenti, condizioni, raggiungibilità…)
node tools/build-data.mjs        # rigenera data/bundle.js dopo aver modificato data/*.json
node tools/scan-assets.mjs       # rigenera il manifest degli asset
node tools/asset-list.mjs        # rigenera docs/ASSET_REQUIREMENTS.md
node tests/playthrough.mjs all   # gioca tutta l'avventura in Chromium headless (richiede Playwright)
node tests/screens.mjs           # screenshot di tutte le scene/enigmi/pannelli in tests/screens/
```

Documentazione: [Architettura](docs/ARCHITECTURE.md) · [Storia e flusso](docs/STORY_FLOW.md) · [Enigmi](docs/PUZZLES.md) · [Dialoghi e scripting](docs/DIALOGUE_SYSTEM.md) · [Asset](docs/ASSET_REQUIREMENTS.md) · [Salvataggi](docs/SAVE_FORMAT.md) · [Piano di test](docs/TEST_PLAN.md) · [Changelog](docs/CHANGELOG.md) · [Piano di implementazione](docs/CLAUDE_IMPLEMENTATION_PLAN.md) · [Art bible](docs/ART_BIBLE.md)
