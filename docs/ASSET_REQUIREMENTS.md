# ASSET REQUIREMENTS — Il Segreto di Orfeo

> File generato da `node tools/asset-list.mjs` a partire da `data/*.json` e `assets/manifest.json`.
> Stato al momento della generazione: **174 file reali presenti** in `assets/`.

## Come funziona la sostituzione

1. Salva il file **esattamente** al percorso indicato (minuscole, estensione inclusa).
2. Rigenera il manifest: `node tools/scan-assets.mjs` (oppure fai push su GitHub: la Action *Asset manifest & data bundle* lo fa da sola).
3. Ricarica il gioco: l'asset reale sostituisce automaticamente il fallback procedurale. Nessuna modifica al codice.

Se un file manca, il gioco usa la grafica/il suono procedurale temporaneo e **non** fa richieste di rete (nessun 404, nessun crash).
Le immagini approvate non vengono mai sovrascritte da nessuno script: gli strumenti leggono `assets/`, non lo modificano (scrivono solo `assets/manifest.json` e `assets/manifest.js`).

### Formati consigliati
- Sfondi e cutscene: **WebP** (qualità 82–88) o JPG. Il gioco cerca nell'ordine `.webp`, `.jpg`, `.png`.
- Sprite, ritratti, oggetti, props: **PNG trasparente**.
- Audio: **OGG** (preferito) o MP3. Il gioco cerca `.ogg` poi `.mp3`.

### Convenzioni del mondo di gioco
- Mondo logico **1920×1080** (16:9). Gli sfondi master possono essere 3840×2160 ed esportati a 1920×1080.
- I personaggi poggiano i piedi sul punto (x, y); il frame sprite è **200×420 px logici** con i piedi al centro del bordo inferiore (si può esportare a 2× = 400×840 per frame).
- Gli hotspot sono già definiti in `data/scenes.json`: lo sfondo reale deve mantenere gli oggetti **nelle stesse posizioni** (vedi colonna «Hotspot principali») oppure vanno aggiornati i `rect`.

---

## 1. Sfondi (`assets/backgrounds/<id>.webp|jpg|png`) — 1920×1080, opaco

| Stato | File | Scena | Capitolo | Luogo | Hotspot principali (x,y,w,h) |
|---|---|---|---|---|---|
| ✅ presente | `assets/backgrounds/c1_studio.webp` | Ufficio della ditta | 1 | Oltrarno · Firenze · ottobre 2026 | Scrivania [0,600,900,330]; Vecchio computer [1375,265,230,190]; Stampante [1720,420,130,80]; Finestra [900,0,450,480]; Foto del nonno [1380,135,85,120]; Macchinetta del caffè [1610,590,80,90] |
| ⬜ manca | `assets/backgrounds/c1_lungarno.webp` | Lungarno | 1 | Firenze · sera di pioggia | Arno [0,560,640,200]; Ponte Vecchio [500,490,540,80]; Targa dell'alluvione [1612,420,70,90]; Lampione [780,160,80,580]; Panchina [400,880,280,110]; Locandina dell'edicola [1040,400,80,110] |
| ⬜ manca | `assets/backgrounds/c1_cantiere.webp` | La stanza murata | 1 | Cantiere di via de' Bardi · notte | Telo sulla breccia [1180,200,420,490]; Breccia nel muro [1260,260,280,360]; Armadio metallico [330,290,230,400]; Tavolo impolverato [620,580,380,160]; Crepa nel muro [700,300,70,100]; Gradini [60,700,260,260] |
| ✅ presente | `assets/backgrounds/c1_archivio.webp` | Archivio Storico — Sala di lettura | 1 | Firenze | Bancone [1010,430,240,170]; Schedario del catalogo [0,320,285,360]; Finestre alte [1450,0,330,520]; Ritratto [1095,128,120,220]; Lampada verde [500,420,150,110]; Carrello dei libri [1245,530,70,110] |
| ⬜ manca | `assets/backgrounds/c1_corridoio.webp` | Deposito — Corridoio dei ripiani | 1 | Archivio Storico · Firenze | Ripiano 17 [1545,100,375,900]; Quadro elettrico [408,340,56,130]; Buio [300,150,1300,600]; Estintore [800,540,60,160]; Finestra ad arco [610,250,110,170]; Catalogo A-Z [40,160,380,560] |
| ⬜ manca | `assets/backgrounds/c1_caffe.webp` | Caffè delle Logge | 1 | Firenze · notte | Bancone [1100,520,560,220]; Vetrina dei dolci [1680,560,200,180]; Specchio [560,160,260,260]; Tavolino [380,720,340,190]; Portatile di Kiki [500,660,120,70]; Giornale [760,760,120,60] |
| ⬜ manca | `assets/backgrounds/c2_gare.webp` | Gare de Lyon | 2 | Parigi · novembre 2026, mattina | Tabellone delle partenze [1080,120,560,160]; Orologio della torre [860,60,160,160]; Le Train Bleu [200,160,360,220]; Edicola [1500,470,220,290]; Piccione [700,840,80,70]; Armadietti (consigne) [120,460,300,300] |
| ⬜ manca | `assets/backgrounds/c2_quai.webp` | Quai des Grands-Augustins | 2 | Parigi · lungo la Senna | Bancarella di libri [380,620,340,200]; Senna [0,540,1920,110]; Notre-Dame [1300,200,460,320]; Panchina [1180,830,300,110]; Verso la Gare de Lyon [0,760,90,300]; Verso il Marais (rue des Archives) [1830,760,90,300] |
| ⬜ manca | `assets/backgrounds/c2_studio_marchetti.webp` | Studio Marchetti | 2 | 12, rue des Archives · Parigi | Banco luminoso [560,600,420,160]; Macchina a soffietto [1040,380,160,220]; Ritratti alle pareti [100,140,360,240]; Cassettiera dei negativi [1450,470,180,260]; Gatto [1180,640,120,80]; Finestra sul cortile [1240,120,300,280] |
| ⬜ manca | `assets/backgrounds/c2_camera_oscura.webp` | Camera oscura | 2 | Studio Marchetti · Parigi | Ingranditore [300,330,260,380]; Bacinelle [700,640,520,110]; Stampe appese [200,140,1500,140]; Timer [1360,520,120,120]; Taniche di chimici [1520,640,200,140]; Esci dalla camera oscura [880,960,200,100] |
| ⬜ manca | `assets/backgrounds/c2_appartamento.webp` | Casa di Ada | 2 | Rue Vieille-du-Temple · Parigi | Scrittoio [1040,560,300,200]; Mobile del grammofono [200,480,200,280]; Cappello sull'attaccapanni [1600,300,160,440]; Mobili coperti [420,600,420,220]; Finestra sui tetti [1180,120,320,300]; Cassetti rovesciati [940,780,260,90] |
| ⬜ manca | `assets/backgrounds/c3_piazza.webp` | Piazza dei Librai | 3 | Roma · sera | Fontana [820,700,300,200]; Facciata della chiesa [720,120,480,300]; Balcone [1440,300,160,200]; Cartellone [1340,520,150,190]; Tavolini [80,720,300,160]; Biblioteca Teodosiana [1520,520,200,240] |
| ⬜ manca | `assets/backgrounds/c3_biblioteca.webp` | Biblioteca Teodosiana — Salone | 3 | Roma | Scaffali a tutta altezza [0,40,760,300]; Scala a pioli [620,120,120,560]; Globo celeste [820,600,180,220]; Busto [1220,360,120,200]; Bancone del bibliotecario [1000,600,300,160]; Sala dei Cassetti [1720,300,140,440] |
| ⬜ manca | `assets/backgrounds/c3_sala_cassetti.webp` | Sala dei Cassetti | 3 | Biblioteca Teodosiana · Roma | Mobile dei diciassette cassetti [370,290,200,460]; Fianco del mobile [120,620,250,300]; Targa in latino [170,435,230,150]; Affresco [1340,0,380,140]; Lume a olio [1190,470,90,140]; Porta del salone [0,640,110,440] |
| ⬜ manca | `assets/backgrounds/c3_passaggio.webp` | Passaggio di servizio | 3 | Sotto la Teodosiana · Roma | Leva del cancello [300,440,120,260]; Cancello (dall'altra parte) [700,300,240,420]; Scala retrattile [1180,80,160,300]; Casse del 1944 [1500,760,260,200]; Ragnatele [200,60,400,200] |
| ⬜ manca | `assets/backgrounds/c3_cortile.webp` | Cortile di Trastevere | 3 | Roma · notte | Panni stesi [300,200,1300,120]; Fontanella [900,760,80,130]; Gatti [1500,840,200,90]; Edicola votiva [1300,360,140,180]; Vespa [180,820,260,160]; Osteria da Fiorella [1830,760,90,300] |
| ⬜ manca | `assets/backgrounds/c3_osteria.webp` | Osteria da Fiorella | 3 | Trastevere · Roma | Il nostro tavolo [1300,700,340,200]; Porta della cucina [1660,280,160,420]; Fiasco di vino [460,660,60,80]; Tovaglia a quadri [300,720,380,200]; Esci [0,640,80,420] |
| ⬜ manca | `assets/backgrounds/c4_studio.webp` | Ufficio della ditta (devastato) | 4 | Oltrarno · Firenze · dicembre 2026 | Scrivania [0,600,900,330]; Pacco di Sandro [1560,800,120,100]; Plastico distrutto [250,470,210,130]; Finestra [900,0,450,480]; Bacheca [400,70,290,310]; Telefono [820,650,60,40] |
| ⬜ manca | `assets/backgrounds/c4_ponte.webp` | Ponte Vecchio | 4 | Firenze · mattina d'inverno | Bottega di Mastro Neri [140,360,360,330]; Banco da orafo [520,600,200,140]; Busto di Cellini [880,300,160,340]; Lucchetti [880,640,160,60]; Arno [700,520,520,120]; Porticina del Corridoio Vasariano [1240,340,120,220] |
| ⬜ manca | `assets/backgrounds/c4_banca.webp` | Banca del Giglio — Cassette di sicurezza | 4 | Via Por Santa Maria · Firenze | Parete delle cassette [300,160,1320,470]; Cassetta 17 [660,260,110,90]; Telecamera [1700,120,90,70]; Quadro [120,220,150,200]; Orologio [1700,300,110,110]; Esci [0,640,80,420] |
| ⬜ manca | `assets/backgrounds/c4_corridoio.webp` | Corridoio Vasariano | 4 | Sopra il Ponte Vecchio · Firenze | Finestre sul fiume [520,180,240,220]; Autoritratti [100,140,380,260]; Porta di Orfeo [880,300,160,340]; Torna al Ponte [860,990,200,70] |
| ⬜ manca | `assets/backgrounds/c4_grotta.webp` | Grotta del Buontalenti | 4 | Giardino di Boboli · Firenze | Statue [180,260,200,440]; Stalattiti [400,40,1100,200]; Venere del Giambologna [880,300,160,240]; Giardino di Boboli [1840,640,80,420] |
| ⬜ manca | `assets/backgrounds/c5_galata.webp` | Molo di Karaköy | 5 | Istanbul · dicembre 2026, tramonto | Traghetto [700,540,420,160]; Torre di Galata [1180,120,130,420]; Moschea [160,200,450,340]; Pescatori [1400,600,480,140]; Carretto dei simit [1600,760,220,180]; Gabbiani [600,120,400,160] |
| ⬜ manca | `assets/backgrounds/c5_bazar.webp` | Gran Bazar | 5 | Istanbul | Lampade [60,120,480,280]; Banco delle spezie [1380,420,480,320]; Tappeti [60,420,480,320]; Donna in nero [900,420,90,260]; Bottega dell'antiquario [1830,760,90,300]; Büyük Valide Han [880,700,160,70] |
| ⬜ manca | `assets/backgrounds/c5_antiquario.webp` | Bottega di Selim Aydın | 5 | Gran Bazar · Istanbul | Orologio ottomano [1500,200,160,200]; Mappe antiche [800,160,380,220]; Gatto [400,820,120,80]; Narghilè [1100,640,100,180]; Tappeto arrotolato [180,780,200,120]; Torna al Bazar [0,640,80,420] |
| ⬜ manca | `assets/backgrounds/c5_han.webp` | Büyük Valide Han | 5 | Istanbul · crepuscolo | Botola [880,820,180,100]; Vecchio pozzo [1300,700,180,200]; Laboratorio dei tessitori [80,420,400,280]; Piccioni [1200,200,300,140]; Scala per il tetto [0,700,90,360]; Torna al Bazar [860,1000,200,60] |
| ⬜ manca | `assets/backgrounds/c5_tetto.webp` | Il tetto dell'Han | 5 | Istanbul · notte sul Corno d'Oro | Il Corno d'Oro [0,360,1920,320]; Comignolo [1300,600,120,200]; Stendibiancheria [200,680,300,200]; Gabbiano [1600,640,100,80]; Muretto [700,820,400,100]; Scendi nel cortile [1830,760,90,300] |
| ⬜ manca | `assets/backgrounds/c5_cisterna.webp` | La cisterna | 5 | Sotto il Büyük Valide Han | Testa di Medusa [860,640,200,160]; Colonne [0,80,1920,300]; Pesci [200,700,600,80]; Passerella [1200,700,400,100]; Porta di bronzo [1600,380,200,340]; Risali [160,300,140,300] |
| ⬜ manca | `assets/backgrounds/c5_camera_anelli.webp` | Camera degli Anelli | 5 | Sotto Istanbul | Meccanismo degli anelli [580,110,760,650]; Iscrizioni [430,150,140,520]; Nicchia [1500,150,280,620]; Torce a muro [1410,320,120,200]; Torna alla cisterna [150,250,130,500] |
| ⬜ manca | `assets/backgrounds/c6_pont_neuf.webp` | Pont Neuf | 6 | Parigi · gennaio 2027, notte di neve | Statua di Enrico IV [860,260,200,420]; Senna [0,540,1920,120]; Panchina innevata [1100,820,300,110]; Lampione [440,300,80,480]; Verso il Marais (Studio Marchetti) [0,760,90,300]; Passage des Libraires [1830,760,90,300] |
| ⬜ manca | `assets/backgrounds/c6_atelier.webp` | Studio Marchetti (notte) | 6 | Rue des Archives · Parigi | Banco luminoso [560,600,420,160]; Daguerre [1180,640,120,80]; Sala di proiezione [1660,260,180,470]; Finestra [1240,120,300,280]; Esci [0,620,80,440] |
| ⬜ manca | `assets/backgrounds/c6_sala.webp` | Sala di proiezione | 6 | Sotto lo Studio Marchetti | Registratore a bobine [160,560,220,180]; Schermo [520,100,880,420]; Proiettore [1400,360,240,200]; Poltrone [560,760,820,180]; Torna su [0,620,80,440] |
| ⬜ manca | `assets/backgrounds/c6_archivio.webp` | Archivio di Orfeo — Parigi | 6 | Sotto il Passage des Libraires | Tavolo dei documenti [620,600,680,180]; Scaffali [60,120,520,300]; Busto di Orfeo [1360,300,160,260]; Candele [920,500,80,120]; Risali [0,620,80,440] |
| ⬜ manca | `assets/backgrounds/c6_ufficio.webp` | Studio del Notaio | 6 | Île de la Cité · Parigi | Scrivania [900,580,420,200]; Ritratto [1500,160,180,240]; Cassaforte [1700,500,160,220]; Fiammiferi [1240,590,50,30]; Finestra su Notre-Dame [620,100,300,300]; Esci (verso le catacombe) [0,620,80,440] |
| ⬜ manca | `assets/backgrounds/c6_catacombe.webp` | Catacombe | 6 | Sotto Parigi | Muro di ossa [200,200,1500,440]; Iscrizione [760,120,400,90]; Candela [720,520,60,100]; Verso Denfert e la stazione [1830,640,90,420] |
| ⬜ manca | `assets/backgrounds/c7_cantiere.webp` | La stanza murata | 7 | Via de' Bardi · Firenze · notte | Gradini [60,700,260,260]; Armadio vuoto [330,290,230,400]; Tavolo [620,580,380,160]; Breccia [1260,260,280,360]; Esci [1840,700,80,360] |
| ⬜ manca | `assets/backgrounds/c7_galleria.webp` | Galleria sotto l'Arno | 7 | Fondamenta di Firenze | Ruota della paratoia [820,500,180,200]; Canale [0,700,1920,110]; Iscrizione [240,300,320,120]; Arco verso la Camera [1280,220,400,480]; Risali [100,600,100,300] |
| ⬜ manca | `assets/backgrounds/c7_camera.webp` | La Camera di Orfeo | 7 | Sotto Firenze | Iscrizione del meccanismo [740,60,440,90]; Incavo del Sigillo [560,360,120,120]; Serratura [380,420,90,110]; Grammofono [1320,420,180,220]; Ruota dei Nomi [1560,300,220,220]; Leva [1180,500,100,200] |
| ⬜ manca | `assets/backgrounds/c7_alba.webp` | Lungarno all'alba | 7 | Firenze | Panchina [400,880,280,110]; Ponte Vecchio [500,490,540,80]; Figura sul ponte [700,455,30,70]; Targa dell'alluvione [1612,420,70,90]; Caffè delle Logge [1530,320,90,390] |

### 1b. Oggetti di scena rimovibili (`assets/items/scene/<scena>_<hotspot>.png`) — PNG trasparente, dimensione = rect dell'hotspot
Servono solo per gli oggetti che **spariscono** quando vengono raccolti (collezionabili, oggetti presi). Se lo sfondo reale li ha già dipinti e non spariscono, non servono.

| Stato | File | Scena | Dimensione (px logici) | Descrizione |
|---|---|---|---|---|
| ⬜ manca | `assets/items/scene/c1_studio_cestino.png` | c1_studio | 90×110 | Cestino |
| ⬜ manca | `assets/items/scene/c1_lungarno_donna.png` | c1_lungarno | 80×150 | Figura sotto il portico |
| ⬜ manca | `assets/items/scene/c1_cantiere_crepa.png` | c1_cantiere | 70×100 | Crepa nel muro |
| ⬜ manca | `assets/items/scene/c1_cantiere_lira.png` | c1_cantiere | 90×90 | Simbolo inciso (collezionabile sym_1) |
| ⬜ manca | `assets/items/scene/c1_cantiere_bolla.png` | c1_cantiere | 60×45 | Foglio sul tavolo (collezionabile doc_01) |
| ⬜ manca | `assets/items/scene/c1_archivio_foto_alluvione.png` | c1_archivio | 70×60 | Fotografia incorniciata (collezionabile photo_02) |
| ⬜ manca | `assets/items/scene/c1_corridoio_microcassetta.png` | c1_corridoio | 50×40 | Microcassetta (collezionabile rec_01) |
| ⬜ manca | `assets/items/scene/c1_corridoio_registro.png` | c1_corridoio | 70×50 | Registro di consultazione (collezionabile doc_02) |
| ⬜ manca | `assets/items/scene/c1_caffe_quadro.png` | c1_caffe | 160×120 | Vecchia fotografia (collezionabile photo_01) |
| ⬜ manca | `assets/items/scene/c1_caffe_laptop.png` | c1_caffe | 120×70 | Portatile di Kiki |
| ⬜ manca | `assets/items/scene/c1_caffe_giornale.png` | c1_caffe | 120×60 | Giornale |
| ⬜ manca | `assets/items/scene/c2_gare_cartolina.png` | c2_gare | 60×70 | Cartolina d'epoca (collezionabile photo_03) |
| ⬜ manca | `assets/items/scene/c2_quai_lucchetto.png` | c2_quai | 50×50 | Lucchetto sul parapetto (collezionabile sym_2) |
| ⬜ manca | `assets/items/scene/c2_studio_marchetti_ritratto_ada.png` | c2_studio_marchetti | 110×150 | Ritratto di coppia (collezionabile photo_04) |
| ⬜ manca | `assets/items/scene/c2_studio_marchetti_ricevuta.png` | c2_studio_marchetti | 70×40 | Foglio sul bancone (collezionabile doc_05) |
| ⬜ manca | `assets/items/scene/c2_camera_oscura_provino.png` | c2_camera_oscura | 80×80 | Provino a contatto (collezionabile doc_03) |
| ⬜ manca | `assets/items/scene/c2_appartamento_segreteria.png` | c2_appartamento | 100×60 | Segreteria telefonica (collezionabile rec_02) |
| ⬜ manca | `assets/items/scene/c2_appartamento_foto_famiglia.png` | c2_appartamento | 160×150 | Fotografie di famiglia (collezionabile photo_05) |
| ⬜ manca | `assets/items/scene/c2_appartamento_diario.png` | c2_appartamento | 80×50 | Pagina strappata (collezionabile doc_06) |
| ⬜ manca | `assets/items/scene/c3_piazza_lira_fontana.png` | c3_piazza | 50×50 | Incisione sulla vasca (collezionabile sym_3) |
| ⬜ manca | `assets/items/scene/c3_piazza_balcone.png` | c3_piazza | 160×200 | Balcone |
| ⬜ manca | `assets/items/scene/c3_biblioteca_catalogo.png` | c3_biblioteca | 70×50 | Lettera nel catalogo (collezionabile doc_07) |
| ⬜ manca | `assets/items/scene/c3_sala_cassetti_verbale.png` | c3_sala_cassetti | 70×50 | Verbale ingiallito (collezionabile doc_08) |
| ⬜ manca | `assets/items/scene/c3_sala_cassetti_grata.png` | c3_sala_cassetti | 120×90 | Grata di aerazione |
| ⬜ manca | `assets/items/scene/c3_passaggio_dittafono.png` | c3_passaggio | 60×40 | Dittafono (collezionabile rec_03) |
| ⬜ manca | `assets/items/scene/c3_cortile_foglio.png` | c3_cortile | 60×40 | Foglio sul muretto (collezionabile doc_09) |
| ⬜ manca | `assets/items/scene/c3_osteria_foto_muro.png` | c3_osteria | 160×140 | Foto alle pareti (collezionabile photo_07) |
| ⬜ manca | `assets/items/scene/c4_studio_biglietto.png` | c4_studio | 80×50 | Biglietto (collezionabile doc_10) |
| ⬜ manca | `assets/items/scene/c4_studio_pacco.png` | c4_studio | 120×100 | Pacco di Sandro |
| ⬜ manca | `assets/items/scene/c4_studio_telefono.png` | c4_studio | 60×40 | Telefono |
| ⬜ manca | `assets/items/scene/c4_ponte_vetrina.png` | c4_ponte | 80×70 | Vetrina con foto (collezionabile photo_08) |
| ⬜ manca | `assets/items/scene/c4_banca_registro.png` | c4_banca | 80×50 | Registro degli accessi (collezionabile doc_11) |
| ⬜ manca | `assets/items/scene/c4_corridoio_graffito.png` | c4_corridoio | 90×70 | Elenco graffito (collezionabile doc_12) |
| ⬜ manca | `assets/items/scene/c4_corridoio_lira_finestra.png` | c4_corridoio | 50×50 | Lira incisa (collezionabile sym_4) |
| ⬜ manca | `assets/items/scene/c4_grotta_dittafono.png` | c4_grotta | 60×40 | Dittafono caduto (collezionabile rec_04) |
| ⬜ manca | `assets/items/scene/c5_galata_chiosco.png` | c5_galata | 120×120 | Cartoline al chiosco (collezionabile photo_10) |
| ⬜ manca | `assets/items/scene/c5_bazar_cassa.png` | c5_bazar | 140×110 | Cassa da spedizione (collezionabile doc_13) |
| ⬜ manca | `assets/items/scene/c5_bazar_donna.png` | c5_bazar | 90×260 | Donna in nero |
| ⬜ manca | `assets/items/scene/c5_antiquario_grammofono.png` | c5_antiquario | 200×240 | Grammofono (collezionabile rec_05) |
| ⬜ manca | `assets/items/scene/c5_antiquario_foto_1989.png` | c5_antiquario | 110×140 | Fotografia incorniciata (collezionabile photo_09) |
| ⬜ manca | `assets/items/scene/c5_han_nicchia.png` | c5_han | 70×70 | Nicchia nel muro (collezionabile doc_14) |
| ⬜ manca | `assets/items/scene/c5_tetto_lettera_comignolo.png` | c5_tetto | 50×40 | Foglio arrotolato (collezionabile doc_15) |
| ⬜ manca | `assets/items/scene/c5_cisterna_lira_medusa.png` | c5_cisterna | 50×50 | Incisione sotto la Medusa (collezionabile sym_5) |
| ⬜ manca | `assets/items/scene/c6_atelier_foto_2019.png` | c6_atelier | 110×150 | Fotografia recente (collezionabile photo_11) |
| ⬜ manca | `assets/items/scene/c6_sala_bobine.png` | c6_sala | 160×140 | Bobine di film (collezionabile rec_06) |
| ⬜ manca | `assets/items/scene/c6_archivio_atto.png` | c6_archivio | 80×50 | Atto di cancellazione (collezionabile doc_16) |
| ⬜ manca | `assets/items/scene/c6_ufficio_lettera_lina.png` | c6_ufficio | 70×40 | Lettera sulla scrivania (collezionabile doc_17) |
| ⬜ manca | `assets/items/scene/c6_ufficio_fiammiferi.png` | c6_ufficio | 50×30 | Fiammiferi |
| ⬜ manca | `assets/items/scene/c6_catacombe_lira_ossa.png` | c6_catacombe | 60×60 | Una lira tra le ossa (collezionabile sym_6) |
| ⬜ manca | `assets/items/scene/c7_galleria_nicchia_voce.png` | c7_galleria | 70×50 | Nicchia con registratore (collezionabile rec_07) |
| ⬜ manca | `assets/items/scene/c7_galleria_lira_volta.png` | c7_galleria | 70×70 | Lira sulla volta (collezionabile sym_7) |
| ⬜ manca | `assets/items/scene/c7_camera_foto_originale.png` | c7_camera | 120×150 | Fotografia incorniciata (collezionabile photo_12) |
| ⬜ manca | `assets/items/scene/c7_alba_donna_ponte.png` | c7_alba | 30×70 | Figura sul ponte |

---

## 2. Sprite dei personaggi (`assets/sprites/<id>/<anim>.png`) — PNG trasparente, strisce orizzontali

Ogni file è una **striscia orizzontale** di N frame uguali (frame 200×420 logici, consigliato 400×840 reali). Il personaggio guarda **a destra**: il flip a sinistra è automatico.
Se manca un'animazione si usa `idle`; se manca anche `idle` si usa la figura procedurale.

| Stato | File | Personaggio | Animazione | Frame | Dimensione striscia consigliata |
|---|---|---|---|---|---|
| ✅ presente | `assets/sprites/beps/idle.png` | Beps | idle | 6 | 2400×840 |
| ✅ presente | `assets/sprites/beps/walk.png` | Beps | walk | 8 | 3200×840 |
| ✅ presente | `assets/sprites/beps/run.png` | Beps | run | 8 | 3200×840 |
| ✅ presente | `assets/sprites/beps/talk.png` | Beps | talk | 6 | 2400×840 |
| ✅ presente | `assets/sprites/beps/use.png` | Beps | use | 6 | 2400×840 |
| ✅ presente | `assets/sprites/beps/pickup.png` | Beps | pickup | 6 | 2400×840 |
| ✅ presente | `assets/sprites/beps/inspect.png` | Beps | inspect | 6 | 2400×840 |
| ✅ presente | `assets/sprites/beps/read.png` | Beps | read | 6 | 2400×840 |
| ✅ presente | `assets/sprites/beps/phone.png` | Beps | phone | 6 | 2400×840 |
| ✅ presente | `assets/sprites/beps/reaction.png` | Beps | reaction | 6 | 2400×840 |
| ✅ presente | `assets/sprites/kiki/idle.png` | Kiki | idle | 6 | 2400×840 |
| ✅ presente | `assets/sprites/kiki/walk.png` | Kiki | walk | 8 | 3200×840 |
| ✅ presente | `assets/sprites/kiki/run.png` | Kiki | run | 8 | 3200×840 |
| ✅ presente | `assets/sprites/kiki/talk.png` | Kiki | talk | 6 | 2400×840 |
| ✅ presente | `assets/sprites/kiki/use.png` | Kiki | use | 6 | 2400×840 |
| ✅ presente | `assets/sprites/kiki/pickup.png` | Kiki | pickup | 6 | 2400×840 |
| ✅ presente | `assets/sprites/kiki/inspect.png` | Kiki | inspect | 6 | 2400×840 |
| ✅ presente | `assets/sprites/kiki/read.png` | Kiki | read | 6 | 2400×840 |
| ⬜ manca | `assets/sprites/kiki/phone.png` | Kiki | phone | 6 | 2400×840 |
| ✅ presente | `assets/sprites/kiki/reaction.png` | Kiki | reaction | 6 | 2400×840 |

PNG NPC (per ora fallback procedurale; per attivarli aggiungere il blocco `sprites` in `data/characters.json` come per Beps/Kiki):

| Stato | File | Personaggio | Animazioni minime |
|---|---|---|---|
| ✅ presente | `assets/sprites/archivista/idle.png`, `talk.png` | Ottavia Ricci — Capo archivista, Archivio Storico di Firenze | idle (6), talk (6) |
| ⬜ manca | `assets/sprites/sandro/idle.png`, `talk.png` | Sandro — Capocantiere | idle (6), talk (6) |
| ⬜ manca | `assets/sprites/tommaso/idle.png`, `talk.png` | Tommaso — Barista del Caffè delle Logge | idle (6), talk (6) |
| ✅ presente | `assets/sprites/varano/idle.png`, `talk.png` | Aurelio Varano — Notaio — Ruolo XI di Orfeo | idle (6), talk (6), walk (8) |
| ⬜ manca | `assets/sprites/helene/idle.png`, `talk.png` | Hélène Marchetti — Fotografa, Studio Marchetti — Parigi | idle (6), talk (6) |
| ✅ presente | `assets/sprites/albert/idle.png`, `talk.png` | Monsieur Albert — Bouquiniste sul Quai des Grands-Augustins | idle (6), talk (6) |
| ✅ presente | `assets/sprites/ilario/idle.png`, `talk.png` | Don Ilario Cesti — Bibliotecario della Teodosiana — Ruolo XIV, il Libraio | idle (6), talk (6) |
| ✅ presente | `assets/sprites/agente/idle.png`, `talk.png` | Agente di Orfeo — Uomini del Notaio | idle (6), talk (6) |
| ⬜ manca | `assets/sprites/neri/idle.png`, `talk.png` | Mastro Neri — Orafo sul Ponte Vecchio | idle (6), talk (6) |
| ⬜ manca | `assets/sprites/bellandi/idle.png`, `talk.png` | Dott.ssa Bellandi — Responsabile cassette di sicurezza, Banca del Giglio | idle (6), talk (6) |
| ✅ presente | `assets/sprites/selim/idle.png`, `talk.png` | Selim Aydın — Antiquario al Gran Bazar — Ruolo XVI, il Traduttore | idle (6), talk (6) |
| ⬜ manca | `assets/sprites/emre/idle.png`, `talk.png` | Emre — Ragazzo del tè | idle (6), talk (6) |
| ⬜ manca | `assets/sprites/donna/idle.png`, `talk.png` | La donna in nero — La donna nelle fotografie | idle (6), talk (6) |

---

## 3. Ritratti con espressioni (`assets/portraits/<id>/<espressione>.png`) — 300×360 (o 600×720), PNG

Usati nel riquadro dei dialoghi e nel taccuino. Se manca un'espressione si usa `neutral.png`; se manca anche quello, il ritratto procedurale.
Espressioni supportate: `neutral`, `smile`, `laugh`, `surprised`, `worried`, `sad`, `angry`, `think`, `skeptical`, `tender`, `determined`, `scared`.

| Personaggio | Priorità | Espressioni richieste | Presenti |
|---|---|---|---|
| Beps (`beps`) | ALTA (tutte) | neutral, smile, laugh, surprised, worried, sad, angry, think, skeptical, tender, determined, scared | 12/12 |
| Kiki (`kiki`) | ALTA (tutte) | neutral, smile, laugh, surprised, worried, sad, angry, think, skeptical, tender, determined, scared | 12/12 |
| Ottavia Ricci (`archivista`) | media | neutral, smile, surprised, sad, worried | 0/5 |
| Sandro (`sandro`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |
| Tommaso (`tommaso`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |
| Aurelio Varano (`varano`) | ALTA | neutral, sad, angry, surprised, think, smile | 5/6 |
| Hélène Marchetti (`helene`) | media | neutral, smile, surprised, sad, worried | 0/5 |
| Monsieur Albert (`albert`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |
| Don Ilario Cesti (`ilario`) | media | neutral, smile, surprised, sad, worried | 0/5 |
| Agente di Orfeo (`agente`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |
| Mastro Neri (`neri`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |
| Dott.ssa Bellandi (`bellandi`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |
| Selim Aydın (`selim`) | media | neutral, smile, surprised, sad, worried | 0/5 |
| Emre (`emre`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |
| La donna in nero (`donna`) | bassa | neutral, smile, surprised, sad, worried | 0/5 |

---

## 4. Icone oggetti (`assets/items/<id>.png`) — 192×192 PNG trasparente

| Stato | File | Oggetto | Descrizione |
|---|---|---|---|
| ✅ presente | `assets/items/usb.png` | Chiavetta USB | Copia della cartella ORFEO |
| ✅ presente | `assets/items/foto1944.png` | Foto 1944 | Stampa da FIRENZE_1944.jpg |
| ⬜ manca | `assets/items/caffe.png` | Caffè in bicchierino | Dalla macchinetta dell'ufficio |
| ⬜ manca | `assets/items/frammenti.png` | Frammenti di documento | Dalla stanza murata |
| ⬜ manca | `assets/items/promemoria.png` | Promemoria 1966 | Documento ricomposto |
| ✅ presente | `assets/items/medaglione_b.png` | Mezzo medaglione | Trovato in una crepa del muro |
| ✅ presente | `assets/items/medaglione_k.png` | Mezzo medaglione di Kiki | Eredità di nonna Ada |
| ✅ presente | `assets/items/medaglione.png` | Medaglione | Le due metà riunite |
| ✅ presente | `assets/items/scheda_o17.png` | Scheda O-17 | Catalogo dell'Archivio Storico |
| ✅ presente | `assets/items/busta_e.png` | Busta di Euridice | Dal ripiano 17 |
| ⬜ manca | `assets/items/moneta.png` | 500 lire | Il portafortuna di Beps |
| ⬜ manca | `assets/items/coltellino.png` | Coltellino multiuso | Attrezzatura da cantiere |
| ⬜ manca | `assets/items/libretto.png` | Libretto «Orphée et Eurydice» | Dal banco di Monsieur Albert |
| ✅ presente | `assets/items/mappa.png` | Mappa cifrata | Carta d'Italia con una stella rossa |
| ⬜ manca | `assets/items/foto1967.png` | Foto 1967 | Stampa dai negativi Marchetti |
| ⬜ manca | `assets/items/negativo.png` | Negativo 1967 | Striscia di pellicola |
| ⬜ manca | `assets/items/lettera_ada.png` | Lettera di Ada | «Per Federica, quando sarà il momento» |
| ⬜ manca | `assets/items/chiave_ottone.png` | Chiave d'ottone | Dal cassetto della Teodosiana |
| ⬜ manca | `assets/items/lista17.png` | Lista dei 17 | Il registro dei ruoli di Orfeo |
| ⬜ manca | `assets/items/sigillo_a.png` | Frammento del Sigillo (Roma) | Un quarto di sigillo in ceralacca e bronzo |
| ⬜ manca | `assets/items/sigillo_b.png` | Frammento del Sigillo (Banca) | Dalla cassetta 17 |
| ⬜ manca | `assets/items/sigillo_c.png` | Frammento del Sigillo (Cantiere) | Recuperato da Sandro |
| ⬜ manca | `assets/items/sigillo_d.png` | Frammento del Sigillo (Ponte Vecchio) | Custodito da Mastro Neri |
| ⬜ manca | `assets/items/sigillo.png` | Sigillo di Orfeo | Ricomposto sul banco di Mastro Neri |
| ✅ presente | `assets/items/nastro.png` | Nastro ORFEO | Bobina magnetica, 1967 |
| ⬜ manca | `assets/items/lanterna.png` | Lanterna | Prestata da Selim |
| ⬜ manca | `assets/items/piede_porco.png` | Piede di porco | Prestato da Emre |
| ⬜ manca | `assets/items/registro.png` | Il Registro di Orfeo | 1944–2026 |

---

## 5. Cutscene (`assets/cutscenes/<cutscene>_<n>.webp`) — 1920×1080 (consigliato 2400×1350 per pan/zoom), opaco

Ogni inquadratura viene animata con pan/zoom/fade; un'immagine leggermente più grande del quadro lascia margine alla camera.

| Stato | File | Cutscene | Inquadratura | Contenuto | Fallback attuale |
|---|---|---|---|---|---|
| ⬜ manca | `assets/cutscenes/intro_1.webp` | intro | 1 | Titolo «Firenze» | sfondo c1_lungarno |
| ⬜ manca | `assets/cutscenes/intro_2.webp` | intro | 2 | Durante alcuni lavori in un palazzo dell'Oltrarno è stata aperta una stanza murata. | sfondo c1_cantiere |
| ⬜ manca | `assets/cutscenes/intro_3.webp` | intro | 3 | Tra il materiale recuperato c'era un vecchio computer. Lo hanno portato in ufficio, dall'i… | sfondo c1_studio |
| ⬜ manca | `assets/cutscenes/intro_4.webp` | intro | 4 | Una cartella chiamata ORFEO. Una fotografia del 1944. Una lista di diciassette nomi. E una… | foto photo1944 |
| ⬜ manca | `assets/cutscenes/c1_fine_1.webp` | c1_fine | 1 | Quella notte Beps non dormì. Guardò la fotografia fino all'alba, e il volto graffiato guar… | sfondo c1_lungarno |
| ⬜ manca | `assets/cutscenes/c1_fine_2.webp` | c1_fine | 2 | Titolo «Il treno delle 7:12» | sfondo c2_gare |
| ⬜ manca | `assets/cutscenes/c2_fine_1.webp` | c2_fine | 1 | Parigi li salutò con un tramonto che sembrava dipinto apposta. Kiki non si voltò a guardar… | sfondo c2_quai |
| ⬜ manca | `assets/cutscenes/c2_fine_2.webp` | c2_fine | 2 | Titolo «Roma» | sfondo c3_piazza |
| ⬜ manca | `assets/cutscenes/c3_fine_1.webp` | c3_fine | 1 | Pagarono le carbonare, lasciarono una mancia esagerata e presero il primo treno per Firenz… | sfondo c3_osteria |
| ⬜ manca | `assets/cutscenes/c3_fine_2.webp` | c3_fine | 2 | Titolo «Il ritorno» | sfondo c4_ponte |
| ⬜ manca | `assets/cutscenes/c4_fine_1.webp` | c4_fine | 1 | Uscirono da Boboli tenendosi per mano. Nessuno dei due ricordò, dopo, chi l'avesse presa p… | sfondo c4_grotta |
| ⬜ manca | `assets/cutscenes/c4_fine_2.webp` | c4_fine | 2 | Titolo «Istanbul» | sfondo c5_galata |
| ✅ presente | `assets/cutscenes/bacio_1.webp` | bacio | 1 |  | sfondo c5_tetto |
| ⬜ manca | `assets/cutscenes/bacio_2.webp` | bacio | 2 | Sotto di loro, Istanbul accende le sue luci. Nessuno dei due se ne accorge. | colore |
| ⬜ manca | `assets/cutscenes/c5_fine_1.webp` | c5_fine | 1 | Selim li accompagnò al molo. Disse addio in sei lingue e in nessuna riuscì a finire la fra… | sfondo c5_galata |
| ⬜ manca | `assets/cutscenes/c5_fine_2.webp` | c5_fine | 2 | Titolo «Orfeo» | sfondo c6_pont_neuf |
| ⬜ manca | `assets/cutscenes/c6_fine_1.webp` | c6_fine | 1 | Uscirono dalle catacombe a Denfert-Rochereau, sotto la neve, alle dieci di sera. Il treno … | sfondo c6_catacombe |
| ⬜ manca | `assets/cutscenes/c6_fine_2.webp` | c6_fine | 2 | Titolo «L'ultima chiave» | sfondo c7_cantiere |
| ⬜ manca | `assets/cutscenes/c7_uscita_1.webp` | c7_uscita | 1 | Risalirono la scala con il Registro tra le braccia, a turno. Pesava come un mattone. Pesav… | sfondo c7_camera |
| ⬜ manca | `assets/cutscenes/c7_uscita_2.webp` | c7_uscita | 2 | Fuori, Firenze stava diventando rosa. | sfondo c7_alba |
| ⬜ manca | `assets/cutscenes/fine_luce_1.webp` | fine_luce | 1 | Titolo «La Luce» | sfondo c1_archivio |
| ⬜ manca | `assets/cutscenes/fine_luce_2.webp` | fine_luce | 2 | Il volto di Guido Sarti, ricostruito graffio per graffio, torna nella fotografia. Dopo cin… | foto photo1944 |
| ⬜ manca | `assets/cutscenes/fine_custodi_1.webp` | fine_custodi | 1 | Titolo «I Custodi» | sfondo c6_archivio |
| ⬜ manca | `assets/cutscenes/fine_custodi_2.webp` | fine_custodi | 2 | Il cappello nero torna sull'attaccapanni di Ada. Accanto, da oggi, c'è anche un berretto d… | sfondo c2_appartamento |
| ⬜ manca | `assets/cutscenes/fine_cenere_1.webp` | fine_cenere | 1 | Titolo «Cenere» | sfondo c7_alba |
| ⬜ manca | `assets/cutscenes/fine_cenere_2.webp` | fine_cenere | 2 | La carta brucia in fretta. I nomi, un po' più piano. | colore |
| ⬜ manca | `assets/cutscenes/fine_segreto_1.webp` | fine_segreto | 1 | Titolo «Il Diciottesimo Nome» | sfondo c7_alba |
| ⬜ manca | `assets/cutscenes/fine_segreto_2.webp` | fine_segreto | 2 | Nella Ruota dei Nomi, dopo il XVII, c'è una riga larga il doppio. Ci sono due nomi, scritt… | sfondo c7_camera |
| ⬜ manca | `assets/cutscenes/post_luce_1.webp` | post_luce | 1 | Titolo «Un anno dopo» | sfondo c1_caffe |
| ✅ presente | `assets/cutscenes/post_luce_2.webp` | post_luce | 2 | Il giorno del matrimonio, tra i regali, c'è una busta senza mittente. Dentro, una fotograf… | sfondo c1_caffe |
| ⬜ manca | `assets/cutscenes/post_luce_3.webp` | post_luce | 3 | In un angolo della foto, un passo in disparte, c'è una donna col cappello nero. Sul retro,… | foto generic |
| ⬜ manca | `assets/cutscenes/post_custodi_1.webp` | post_custodi | 1 | Titolo «Un anno dopo» | sfondo c1_archivio |
| ✅ presente | `assets/cutscenes/post_custodi_2.webp` | post_custodi | 2 | Il Sigillo di Orfeo è di nuovo diviso. Non in quattro, stavolta: in due. Una metà la porta… | foto generic |
| ⬜ manca | `assets/cutscenes/post_cenere_1.webp` | post_cenere | 1 | Titolo «Il Lungarno» | sfondo c1_lungarno |
| ✅ presente | `assets/cutscenes/post_cenere_2.webp` | post_cenere | 2 | Un uomo con le mani in tasca le si siede accanto, senza ombrello. Le offre metà di una mon… | sfondo c1_lungarno |
| ⬜ manca | `assets/cutscenes/post_segreto_1.webp` | post_segreto | 1 | Titolo «Registro di Orfeo» | sfondo c6_archivio |
| ⬜ manca | `assets/cutscenes/post_segreto_2.webp` | post_segreto | 2 | «XVIII · Il Ponte e la Testimone, insieme. Giuseppe e Federica. Giurano il 12 marzo, per p… | colore |
| ⬜ manca | `assets/cutscenes/post_segreto_3.webp` | post_segreto | 3 | Il giovedì dopo, al Caffè delle Logge, Tommaso trova sul piattino di una donna col cappell… | sfondo c1_caffe |

---

## 6. Enigmi (`assets/puzzles/`)

| Stato | File | Uso | Dimensione | Note |
|---|---|---|---|---|
| ⬜ manca | `assets/puzzles/photo1944.png` | Foto 1944 (sovrapposizione, cutscene) | 800×560, opaco | 4 crocini di registro rossi agli angoli a (40,30),(760,30),(40,530),(760,530); donna col cappello centrata in (400,300); metà sinistra della lira «bucata» in (400,140); volto graffiato terzo da sinistra |
| ⬜ manca | `assets/puzzles/photo1967.png` | Foto 1967 | 800×560, **parzialmente trasparente o chiara** (viene sovrapposta in multiply) | stessi crocini e stessa posizione della donna; metà destra della lira |
| ⬜ manca | `assets/puzzles/mappa_cifrata.png` | Mappa cifrata | 800×800 | stella rossa a nord-est (45°) sul cerchio esterno |
| ⬜ manca | `assets/puzzles/sigillo_A.png` … `_D.png` | Quattro quarti del Sigillo | 200×200 trasparenti | A=alto-sinistra «ORFEO», B=alto-destra «NON», C=basso-destra «VOL», D=basso-sinistra «TARTI»; centro del sigillo nell'angolo interno |

---

## 7. Collezionabili — fotografie (`assets/collectibles/<id>.jpg`) — 920×640 circa, opaco

| Stato | File | Titolo | Contenuto |
|---|---|---|---|
| ⬜ manca | `assets/collectibles/photo_01.jpg` | I ponti di Firenze (agosto 1944) | Il Lungarno coperto di macerie dopo la notte del 3 agosto. In fondo, intatto, il Ponte Vecchio. Una donna col … |
| ⬜ manca | `assets/collectibles/photo_02.jpg` | L'Archivio dopo l'alluvione (novembre 1966) | Volontari in fila che si passano faldoni fradici di mano in mano. Gli angeli del fango. Tra loro, una bambina … |
| ⬜ manca | `assets/collectibles/photo_03.jpg` | Gare de Lyon (marzo 1967) | Una cartolina d'epoca: il Train Bleu, i lampioni, una folla sotto l'orologio. Ingrandendo, sotto l'orologio: u… |
| ⬜ manca | `assets/collectibles/photo_04.jpg` | Jacques e Ada (1966) | Jacques Marchetti e Ada Morel ridono davanti al banco luminoso. È l'unica foto in cui Ada non porta il cappell… |
| ⬜ manca | `assets/collectibles/photo_05.jpg` | Ada e la piccola (1995) | Ada su questo divano, con una bambina di un anno in braccio. Sul retro: «Federica. Ha già il mio carattere. Ch… |
| ⬜ manca | `assets/collectibles/photo_06.jpg` | Roma 1978 (1978) | La donna col cappello sotto il busto di Teodosio, nello stesso punto delle altre foto. Ma le mani sono diverse… |
| ⬜ manca | `assets/collectibles/photo_07.jpg` | Trastevere 1944 (giugno 1944) | La liberazione di Roma: gente in strada, bandiere, un carretto. Una ragazzina con un grembiule sorride: è Fior… |
| ⬜ manca | `assets/collectibles/photo_08.jpg` | Il ponte che non cadde (4 agosto 1944) | Il Ponte Vecchio all'alba, con le macerie delle case distrutte agli ingressi. Su una barca sotto le arcate, un… |
| ⬜ manca | `assets/collectibles/photo_09.jpg` | Istanbul 1989 (dicembre 1989) | Ada e Selim davanti alla bottega. Dietro di loro, sfocata, una giovane donna col cappello nero. Ada la guarda … |
| ⬜ manca | `assets/collectibles/photo_10.jpg` | Il porto di Galata (1944) | Una cartolina: un piroscafo italiano attraccato a Karaköy. Sul retro, in italiano: «Siamo arrivati in dodici. … |
| ⬜ manca | `assets/collectibles/photo_11.jpg` | Il passaggio del cappello (2019) | Ada, molto anziana, in poltrona. Hélène in piedi accanto a lei, col cappello nero in mano. Nessuna delle due s… |
| ⬜ manca | `assets/collectibles/photo_12.jpg` | Firenze 1944 — l'originale (luglio 1944) | La stampa originale, intatta. Il volto che nelle copie è graffiato qui si vede bene: un giovane con gli occhia… |

Documenti, registrazioni e simboli usano layout testuali e non richiedono immagini.

---

## 8. Interfaccia (`assets/gui/`)

| Stato | File | Uso | Dimensione |
|---|---|---|---|
| ⬜ manca | `assets/gui/title.jpg` | Illustrazione della schermata del titolo | 1920×1080 (lenta animazione di pan) |

I cursori (neutro, guarda, usa, parla, uscita, oggetto) sono SVG inline in `src/style.css`: per sostituirli con PNG basta cambiare le regole `#world[data-cursor=…]`.

---

## 9. Audio (`assets/audio/`) — OGG/MP3 in loop dove indicato

Se un file manca e l'opzione «Audio sintetico di riserva» è attiva, il gioco genera un pad/rumore procedurale molto discreto.

### Musica (`assets/audio/music/<id>.ogg`, loop)
| Stato | File | Dove |
|---|---|---|
| ⬜ manca | `assets/audio/music/firenze.ogg` | c1_studio, c1_lungarno, c1_archivio, c4_ponte, cutscene c3_fine |
| ⬜ manca | `assets/audio/music/mystery.ogg` | c1_cantiere, c2_camera_oscura, c3_sala_cassetti, c4_banca, c4_corridoio, c5_cisterna, c5_camera_anelli, c6_atelier… |
| ⬜ manca | `assets/audio/music/tension.ogg` | c1_corridoio, c3_passaggio, c4_studio, c4_grotta, c6_ufficio, c6_catacombe |
| ⬜ manca | `assets/audio/music/tender.ogg` | c1_caffe, c2_appartamento, c3_osteria, c5_tetto, cutscene c1_fine, cutscene bacio, cutscene fine_segreto, cutscene post_luce… |
| ⬜ manca | `assets/audio/music/paris.ogg` | c2_gare, c2_quai, c2_studio_marchetti, c6_pont_neuf, cutscene c5_fine |
| ⬜ manca | `assets/audio/music/roma.ogg` | c3_piazza, c3_biblioteca, c3_cortile, cutscene c2_fine |
| ⬜ manca | `assets/audio/music/istanbul.ogg` | c5_galata, c5_bazar, c5_antiquario, c5_han, cutscene c4_fine |
| ⬜ manca | `assets/audio/music/finale.ogg` | c7_cantiere, c7_galleria, c7_camera, c7_alba, cutscene c6_fine, cutscene c7_uscita, cutscene fine_luce, cutscene fine_custodi |
| ⬜ manca | `assets/audio/music/title.ogg` | cutscene intro, schermata titolo |

### Ambienti (`assets/audio/ambience/<id>.ogg`, loop)
| Stato | File | Dove |
|---|---|---|
| ⬜ manca | `assets/audio/ambience/rain.ogg` | c1_studio, c1_lungarno, c4_studio |
| ⬜ manca | `assets/audio/ambience/underground.ogg` | c1_cantiere, c3_passaggio, c5_camera_anelli, c6_archivio, c6_catacombe, c7_cantiere, c7_camera |
| ⬜ manca | `assets/audio/ambience/room.ogg` | c1_archivio, c1_corridoio, c2_studio_marchetti, c2_camera_oscura, c2_appartamento, c3_biblioteca, c3_sala_cassetti, c4_banca… |
| ⬜ manca | `assets/audio/ambience/crowd.ogg` | c1_caffe, c3_osteria, c5_bazar |
| ⬜ manca | `assets/audio/ambience/station.ogg` | c2_gare |
| ⬜ manca | `assets/audio/ambience/city.ogg` | c2_quai, c3_piazza, c3_cortile, c4_ponte |
| ⬜ manca | `assets/audio/ambience/wind.ogg` | c4_corridoio, c5_han, c5_tetto, c6_pont_neuf |
| ⬜ manca | `assets/audio/ambience/water.ogg` | c4_grotta, c5_galata, c5_cisterna, c7_galleria, c7_alba |

### Effetti (`assets/audio/sfx/<id>.ogg`, singoli)
| Stato | File |
|---|---|
| ⬜ manca | `assets/audio/sfx/click.ogg` |
| ⬜ manca | `assets/audio/sfx/pickup.ogg` |
| ⬜ manca | `assets/audio/sfx/success.ogg` |
| ⬜ manca | `assets/audio/sfx/fail.ogg` |
| ⬜ manca | `assets/audio/sfx/page.ogg` |
| ⬜ manca | `assets/audio/sfx/door.ogg` |
| ⬜ manca | `assets/audio/sfx/clue.ogg` |
| ⬜ manca | `assets/audio/sfx/collect.ogg` |
| ⬜ manca | `assets/audio/sfx/mechanism.ogg` |
| ⬜ manca | `assets/audio/sfx/drawer.ogg` |
| ⬜ manca | `assets/audio/sfx/heart.ogg` |
| ⬜ manca | `assets/audio/sfx/phone.ogg` |
| ⬜ manca | `assets/audio/sfx/switch.ogg` |
| ⬜ manca | `assets/audio/sfx/tape.ogg` |
| ⬜ manca | `assets/audio/sfx/step.ogg` |

---

## 10. Priorità consigliate di produzione

1. **Sprite e ritratti di Beps e Kiki** (idle, walk, talk + 12 espressioni): sono sullo schermo il 100% del tempo.
2. **Ritratti e sprite di Aurelio Varano (Nemico 1)** e della **donna col cappello**.
3. **Sfondi del Capitolo 1** (6) e **Foto 1944/1967** (servono anche all'enigma di sovrapposizione).
4. Sfondi dei capitoli 2–7, poi cutscene, poi icone oggetti.
5. Musica (9 temi) e ambienti (8 loop), poi effetti.
