# Caricare gli aggiornamenti con GitHub Desktop

Il repository è `https://github.com/b3pz/Orfeo`. GitHub Desktop invia anche molti file senza i limiti del caricamento tramite browser.

1. Apri GitHub Desktop e scegli il repository **Orfeo**. La copia scaricata è normalmente in `Documents/GitHub/Orfeo`.
2. Copia **il contenuto** di `aggiornamento-github` nella cartella del repository, mantenendo le sottocartelle e sostituendo i file aggiornati. Non copiare la cartella esterna con quel nome e non includere `.DS_Store`.
3. In Desktop apri **Changes** e verifica l’elenco. Scrivi un riepilogo in **Summary**, poi scegli **Commit to main**.
4. Premi **Push origin** e attendi il completamento: solo questo passaggio invia le modifiche su GitHub. Per gli aggiornamenti successivi, ripeti gli stessi passaggi nella copia del repository.

Non caricare `node_modules`, le immagini di test o le cartelle temporanee. Conserva la cartella del repository: contiene la cronologia Git necessaria a Desktop.

## Alternativa: caricamento dal sito

`aggiornamento-github` contiene i file modificati e le nuove immagini, da sovrapporre al repository del gioco. Non caricare la cartella esterna con quel nome.

Con le cutscene gli asset dell’aggiornamento sono ora 116 file: dividerli in due caricamenti, poi caricare il codice e i dati.

1. Aprire la cartella `assets` nel repository GitHub, scegliere **Add file → Upload files** e trascinare la cartella `cutscenes` che si trova dentro `aggiornamento-github/assets` (21 immagini).
2. Restando nella cartella `assets` del repository, caricare tutti gli altri contenuti di `aggiornamento-github/assets`, compresi `manifest.js` e `manifest.json`, escludendo `cutscenes` già caricata (95 file).
3. Tornare alla radice del repository e caricare gli altri contenuti di `aggiornamento-github`: `data`, `src`, `tools`, `tests`, `docs` e `package.json`.

Confermare ciascun caricamento con **Commit changes**. Le cartelle devono restare nei loro percorsi: ad esempio `assets/cutscenes/intro_2.png`, `data/cutscenes.json` e `src/systems/CutsceneManager.js`.

Se gli aggiornamenti precedenti sono già online, bastano le 21 nuove immagini, i manifest aggiornati, `data/cutscenes.json`, `data/bundle.js` e `src/systems/CutsceneManager.js` per usare le nuove cutscene; i test e la documentazione permettono di mantenere e verificare il progetto.

Per il ritratto di Ottavia aggiornare anche `assets/portraits/archivista/sheet.png`, `data/characters.json`, `data/bundle.js` e i due manifest.

Per telo, oggetti, diario e meteo caricare tutti i file aggiornati di questa cartella, compresi `assets/interface`, `assets/items/scene`, i due nuovi fondali del cantiere, `data`, i sistemi in `src` e `src/style.css`. Dettagli e verifiche in `docs/CORREZIONI_SCENE_INTERFACCIA.md`.
