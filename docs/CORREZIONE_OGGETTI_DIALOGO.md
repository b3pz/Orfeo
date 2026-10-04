# Mostra un oggetto nei dialoghi

La selezione dell’oggetto chiudeva il pannello prima di comunicare la scelta. La chiusura invocava il callback di annullamento, risolvendo la promessa con `null`; il successivo risultato con l’oggetto veniva ignorato. Il dialogo tornava quindi ai temi senza mostrare nulla al personaggio.

In `UIManager.pickItem` la scelta viene ora risolta prima di chiudere la finestra. Chiudere con la X, premere Escape o cliccare fuori continua ad annullare correttamente.

Il test `npm run test:dialogue` usa i pulsanti reali, senza sostituire il selettore di oggetti con le scorciatoie della modalità test. Prima della correzione il promemoria non sbloccava il catalogo. Dopo la correzione verifica la risposta dell’archivista e `catalogo_ok`, la risposta a un oggetto non pertinente, tutti e tre i modi di annullare e l’uscita normale dal dialogo. Nessun errore del browser.

La correzione vale per tutti i dialoghi che permettono di mostrare oggetti. È inclusa nella cartella `aggiornamento-github`; non è stata pubblicata automaticamente.
