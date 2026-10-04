# Corse, doppi clic e collisioni — 4 ottobre 2026

Le correzioni sono nella copia locale e nella cartella `aggiornamento-github`; non sono ancora pubblicate.

## Movimento e azioni sovrapposte

- La corsa verso la posizione attuale termina anche quando il tempo trascorso è zero. Le coordinate non valide vengono rifiutate; quelle recuperate da un vecchio salvataggio vengono riportate su un punto sicuro del pavimento.
- Un movimento viene annullato se cambia scena, se viene sostituito lo stato del salvataggio o se una condizione della storia chiude il percorso. Il renderer riceve soltanto coordinate valide sul pavimento.
- Ogni nuovo clic sostituisce il precedente timer di inseguimento del compagno. Cambi di scena, cambio personaggio, avvio di uno script e interazioni annullano anche i timer pendenti.
- La camminata resta interrompibile. Dopo l’arrivo, raccolta, uso e uscita vengono eseguiti una volta sola: il secondo clic e l’evento `dblclick` non possono avviare una seconda azione durante l’animazione.
- Dissolvenza e costruzione della scena bloccano nuovi ingressi e cambi di protagonista. Il blocco viene rilasciato prima degli script d’ingresso, per consentire i trasferimenti automatici previsti dalla storia, compreso il passaggio dal tetto a Parigi.

## Confini dei fondali

Revisionati 23 luoghi: aggiunti gli ingombri di panchine, edicola, pilastri, sgabelli, sedie, automobile, mobili, casse, pozzo e grammofono. Corretti anche i gradini nelle due versioni del cantiere e il bordo posteriore della sala di proiezione. Gli ingombri sono poligoni con nomi leggibili in `data/scenes.json`; i punti di interazione vengono proiettati sul pavimento raggiungibile.

La galleria `tests/screens/index.html` mostra il pavimento in verde e gli ostacoli in rosso. Gli ostacoli possono sovrapporsi al verde nel disegno di controllo, ma vengono esclusi dal movimento.

## Verifiche

- `npm run test:navigation`: 516 percorsi verso gli hotspot, controllati lungo tutti i segmenti.
- `npm run test:movement`: 3.120 camminate animate con 780 interruzioni e 121.294 fotogrammi verificati, incluse corse, clic sulla posizione attuale, tempi zero, coordinate corrotte, inseguimento, cambio scena/stato e passaggi che si chiudono. Verificati inoltre azioni duplicate e transizioni concorrenti.
- `npm run test:movement:browser`: animazioni reali nelle 39 scene, 1.449 clic/doppi clic e oltre 4.200 controlli dei personaggi; prova della raccolta durante clic ripetuti e del cambio scena durante una dissolvenza. Nessun errore del browser.
- `npm test`: dati, movimento, personaggi, partita completa con 43/43 collezionabili e quattro finali, partita minima, salvataggi e mobile.
- `npm run screens`: 58 anteprime, nessun errore di caricamento.

Il test di movimento usa un generatore casuale con seme fisso per rendere riproducibili i casi che falliscono. I controlli sui poligoni sono affiancati alla revisione visiva dei fondali; non sostituiscono una prova di ogni possibile clic manuale.
