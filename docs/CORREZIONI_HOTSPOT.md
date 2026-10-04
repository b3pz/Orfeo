# Hotspot cliccabili e quadro elettrico al buio

Il grande hotspot “Buio” veniva inserito dopo il quadro elettrico e lo copriva interamente. Altri oggetti erano coperti da aree più grandi o dagli sprite dei personaggi.

Il motore ordina ora le aree grandi dietro quelle piccole; gli oggetti compatti hanno priorità sui personaggi sovrapposti. Le grandi aree di scenario restano dietro i personaggi, così sono accessibili anche i dialoghi. Le immagini e gli effetti atmosferici non intercettano il clic.

`tests/hotspots-browser.mjs` verifica tutte le 39 scene, tutti i 300 hotspot, NPC e compagno, con entrambi i protagonisti e tutte le combinazioni delle condizioni di visibilità. Usa il vero elemento sotto le coordinate sullo schermo per verificare la ricezione del clic, quindi controlla il percorso verso il punto d’interazione. Esegue anche un clic nativo sul quadro al buio con camminata animata di Kiki, fino alla riaccensione e alla comparsa della microcassetta.

Verifica a 1280×720 e 375×812: 146 configurazioni e 1276 clic/percorsi per formato, senza hotspot coperti o irraggiungibili. Il test è incluso in `npm test` ed è disponibile con `npm run test:hotspots`.
