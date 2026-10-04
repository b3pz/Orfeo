# Cutscene importate

Le 21 immagini aggiunte in `nuovi asset/05_cutscene/` sono state associate per contenuto alle rispettive inquadrature e copiate in `assets/cutscenes/<sequenza>_<numero>.png`. I file originali restano intatti; non sono stati ridimensionati o ridisegnati.

Le associazioni sorgente → destinazione, con numero dell’inquadratura e checksum, sono in [cutscene-import.json](cutscene-import.json). `data/cutscenes.json` contiene i percorsi espliciti: questi hanno precedenza sulle immagini precedenti anche se esiste una vecchia versione WebP della stessa inquadratura.

Sono aggiornate 16 sequenze: introduzione, passaggi tra Parigi/Roma/Firenze/Istanbul, bacio, uscita dalla Camera di Orfeo e diversi finali/epiloghi. Alcuni zoom sono stati adattati per mantenere leggibili i protagonisti e la scena. Le altre inquadrature conservano le immagini già presenti e le schermate narrative a tinta unita.

È stato corretto anche il pulsante Salta: durante la comparsa della didascalia, prima completava soltanto il testo e richiedeva un secondo clic per proseguire. Ora un solo clic interrompe la sequenza e termina normalmente la dissolvenza.

## Verifica

`npm run test:cutscenes` riproduce davvero le 21 sequenze e le 43 inquadrature nel browser. Verifica il caricamento delle 21 nuove immagini, i testi, l’avanzamento, la chiusura delle sequenze e Salta durante la scrittura. Il test di Salta falliva prima della correzione e passa dopo. Nessun errore del browser.

Le anteprime delle 21 nuove inquadrature si trovano in [tests/cutscenes/index.html](../tests/cutscenes/index.html). Manifest e bundle dei dati sono stati rigenerati; il manifest contiene 286 file.

Tutte le modifiche sono locali e incluse in `aggiornamento-github`.
