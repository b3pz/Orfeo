# Aggiornamento delle immagini — 4 ottobre 2026

Le immagini di `nuovi asset/` sono state copiate nei percorsi utilizzati dal gioco, con nomi stabili. La cartella caricata resta intatta. Le copie di sicurezza delle icone sostituite direttamente sono conservate in `assets/originals-before-update/`; il manifest esclude questa cartella.

## Immagini collegate

- 31 fondali, con un percorso esplicito in `data/scenes.json`.
- 21 nuove inquadrature delle cutscene: associazioni e verifiche in [AGGIORNAMENTO_CUTSCENE.md](AGGIORNAMENTO_CUTSCENE.md).
- 21 icone d’inventario aggiornate (20 icone singole e la mappa).
- Le due fotografie per la sovrapposizione, la mappa cifrata e il foglio dei quattro frammenti del Sigillo. Il foglio viene visualizzato in quattro celle dal codice senza ritagliare il file originale.
- 10 fotografie collezionabili: quelle con nome esplicito più la fotografia di Ada e Selim assegnata a `photo_09`.

L’elenco sorgente → destinazione è in [asset-import.json](asset-import.json).

## Fondali, hotspot e movimento

Gli hotspot delle 31 scene sono stati spostati sugli oggetti visibili. Le aree calpestabili seguono il pavimento e aggirano tavoli, sedie, fontane, casse e altri elementi del disegno. I nuovi fondali sono mappati all’intera superficie logica 1920×1080: le immagini che hanno proporzioni diverse vengono adattate alla scena senza tagli. In particolare il Ponte Vecchio ha proporzioni più alte e viene compresso verticalmente.

Il movimento ora supporta anche ostacoli interni al poligono calpestabile. Un percorso impossibile restituisce un fallimento; non viene sostituito con una linea che attraversa gli ostacoli. La posizione di ingresso, le posizioni dei salvataggi e i piazzamenti da script vengono riportati sul pavimento. L’interpolazione segue esattamente i segmenti verificati.

Nella cisterna si cammina sulle piattaforme rialzate. Nella galleria e nella Camera di Orfeo sono preservate le restrizioni della storia e la separazione dei personaggi. I collegamenti che si aprono risolvendo i meccanismi vengono anche disegnati come passerelle.

Gli indizi indispensabili assenti nel fondale vengono resi visibili con oggetti sovrapposti: lettere, foto, simboli, portatile e registratore. I collezionabili sovrapposti scompaiono dopo la raccolta.

## Materiale ancora da completare

Aggiornamento personaggi: collegate le animazioni idle e talk di Hélène, Sandro, Tommaso, Bellandi, Emre e della donna in nero, più Kiki al telefono. Sono 13 animazioni, ciascuna con sei fotogrammi. La donna in nero usa gli sprite nelle apparizioni sul Lungarno, nel Bazar e sul ponte, rispettando dimensioni e condizioni degli hotspot. I bitmap rimangono integri: il codice visualizza finestre SVG con contorni individuali e piedi allineati, così non taglia accessori e non mostra parti della figura vicina.

Il foglio di Varano viene usato per sette ritratti nei dialoghi e nel taccuino: neutral, angry, determined, think, worried, sad e smile. Le espressioni non presenti usano il ritratto neutro. Per i sei nuovi NPC il ritratto neutro viene visualizzato dalla figura base. Una seconda variante talk di Bellandi è conservata tra le sorgenti; la variante principale è quella collegata. L’elenco dei nomi è in [character-import.json](character-import.json).

Per rigenerare i contorni dopo altri caricamenti: installare Pillow, NumPy e SciPy ed eseguire `python3 tools/import-character-sheets.py`, poi `npm run build`. I nomi sorgente e l’associazione alle animazioni sono nel tool.

Non sono ancora presenti nuove strisce idle/talk/walk di Varano: il file aggiunto è un foglio di busti, quindi le sue animazioni a figura intera restano quelle già disponibili.

L’interfaccia caricata è un foglio con più pannelli e componenti: resta come sorgente, senza essere applicata intera all’interfaccia. Le fotografie senza nome che duplicano un soggetto già fornito restano sorgenti alternative. Non sono state inventate associazioni per le alternative dubbie.

Le 21 immagini delle cutscene sono state collegate. L’audio aggiuntivo resta da produrre. Dove manca un’immagine il gioco mantiene la grafica di riserva.

## Verifica

Per le successive correzioni a corse, doppi clic e confini vedere [CORREZIONI_MOVIMENTO.md](CORREZIONI_MOVIMENTO.md).

- `npm run validate`: riferimenti narrativi e dati.
- `npm run test:navigation`: 516 percorsi per hotspot, verifica dei singoli segmenti e regressioni su ostacoli/blocchi completi.
- `npm test`: partita completa, partita minima, salvataggi e mobile, oltre ai controlli statici e del movimento.
- `npm run test:characters`: verifica nel browser tutte le 78 pose e i sette ritratti di Varano.
- `npm run screens`: scene con hotspot e pavimento evidenziati, puzzle e pannelli. Il verde indica il calpestabile, il rosso gli ostacoli interni.

Risultato della verifica finale: dati validi; 516 percorsi verificati; 43/43 collezionabili; tutti e quattro i finali giocati; partita minima, caricamento dei salvataggi e interazioni touch superati, senza errori del browser.

Le schermate si consultano aprendo [tests/screens/index.html](../tests/screens/index.html). Il file `background-audit.json` nella stessa cartella indica quali fondali sono stati caricati dal browser.

Le modifiche sono locali in questa cartella. Questo progetto non contiene `.git`, quindi non è stato aggiornato GitHub.

## Ritratto di Ottavia Ricci

Collegato il primo piano dell’archivista nei dialoghi e nel taccuino, usando senza modifiche l’immagine fornita `03_ritratti/archivista/aspetto_nel_gioco.png`. Il ritaglio è definito nei dati; le espressioni prive di un’immagine dedicata usano il ritratto neutro. Verificato nel browser insieme alla selezione degli oggetti nel dialogo.

Per telo, oggetti mancanti, lira, diario caricato e meteo alle finestre vedere [CORREZIONI_SCENE_INTERFACCIA.md](CORREZIONI_SCENE_INTERFACCIA.md). Le ultime modifiche sono state verificate anche nel browser su desktop e telefono; anteprime in `tests/screens/props-index.html`.
