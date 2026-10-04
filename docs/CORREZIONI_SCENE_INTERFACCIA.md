# Coerenza delle scene e grafica del diario

- Cantiere: il telo copre il tavolo, la fessura e la breccia fino al caffè. Le due modalità di consegna del caffè aggiornano subito la scena. Due versioni del fondale con la stessa inquadratura mostrano il telo prima e la stanza scoperta dopo; la condizione viene riletta anche dopo un caricamento o un ritorno nel luogo. Pavimento e ostacoli restano quelli della scena.
- Creati estintore e fotografia del nonno; collegata anche la fotografia dell’alluvione già caricata. Microcassetta e provino utilizzano immagini disponibili, invece delle forme generiche.
- I sette simboli mostrano la lira di Orfeo nei pannelli dei collezionabili, al posto dei caratteri decorativi (fra cui la nota musicale del primo simbolo).
- Inventario e taccuino utilizzano il diario presente nel foglio `08_interfaccia/64b4111d-cf6d-431d-a6a1-cd56b89875fe.png`, preservato integralmente in `assets/interface/orfeo-ui-sheet.png`. Il ritaglio è un viewBox SVG; oggetti, selezione, esame, sezioni e contenuti restano interattivi. Gli oggetti numerosi scorrono nella pagina sinistra. Su telefono il taccuino mostra una sola pagina, con sezioni scorrevoli in alto. Aprire il taccuino richiude l’inventario.
- Pioggia limitata alle finestre del capitolo 1 e del ritorno a Firenze; pioggia anche sul Ponte Vecchio nel capitolo 4. Nel capitolo 6 le finestre di Parigi mostrano neve, come la scena esterna. Le precipitazioni interne sono ritagliate all’area della finestra e non attraversano il pavimento.

## Verifica

Validazione dei dati e riferimenti, 516 percorsi e test del movimento superati (3120 camminate, 780 interruzioni, 121294 fotogrammi sicuri).

`npm run test:props` verifica nel browser i due percorsi del caffè, persistenza della breccia, immagini degli oggetti, diario, lira e meteo delle finestre; genera schermate in `tests/screens`. Verifica eseguita in Chromium su desktop (1280×720) e telefono (375×812), senza errori del browser: entrambe le consegne del caffè, ritorno/ripristino della stanza aperta, 19 immagini decodificate, tutti i 28 oggetti raggiungibili, selezione degli oggetti e sezioni del diario. Controllate visivamente le schermate: la fessura è incisa nella parete e la pioggia rispetta il bordo arcuato della finestra. Partita completa con 43/43 collezionabili e quattro finali, partita minima, salvataggio/caricamento e tocco su telefono superati. Anche la scelta degli oggetti nel dialogo dell’archivista è verificata.

Anteprime aggiornate in [tests/screens/props-index.html](../tests/screens/props-index.html). Le altre schermate della galleria generale possono riferirsi alla versione precedente.

Le modifiche sono locali e incluse in `aggiornamento-github`; GitHub non è stato aggiornato automaticamente.
