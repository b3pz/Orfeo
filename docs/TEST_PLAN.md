# PIANO DI TEST

## Automatici

### 1. Validazione statica — `node tools/validate.mjs`
Controlla tutti i file `data/*.json`:
- ogni **condizione** è sintatticamente valida e usa solo identificatori noti (oggetti, puzzle, indizi, collezionabili esistenti);
- ogni **comando** di script esiste ed è valido (`@give` di oggetti esistenti, `@goto` di scene esistenti, `@puzzle/@dialogue/@cutscene/@collect/@clue/@objective` esistenti, `@stat` ben formato);
- **speaker** ed **espressioni** esistono;
- tutte le **scene sono raggiungibili** dalla scena iniziale (uscite + `@goto` + `@place`);
- tutti gli **oggetti sono ottenibili** (`@give` da qualche parte);
- i **43 collezionabili** sono piazzati esattamente una volta (17/12/7/7);
- ogni enigma e ogni obiettivo ha **3 suggerimenti**;
- nessuna **flag letta ma mai impostata**;
- nessun **tema ripetibile che aumenti una statistica** (farming);
- avvisa se una scena ha meno di 5 hotspot.
Stampa anche il tetto teorico delle statistiche.

### 2. Partite complete — `node tests/playthrough.mjs all`
Chromium headless (Playwright), `window.ORFEO_TEST = true` (testo istantaneo, camminata istantanea, cutscene saltate). Tutte le azioni passano dalle **stesse funzioni del giocatore** (`Hotspots.interact`, `Inventory.combine`, `Dialogue` con scelta dei temi, `Scene.switchTo`); gli enigmi vengono risolti chiamando i loro input (`auto()`).

| Suite | Cosa verifica |
|---|---|
| `full` | la soluzione completa di `tests/walkthrough.mjs` (≈280 passi, 7 capitoli, 39 scene): ogni passo deve riuscire (scena attesa, condizioni attese, temi disponibili). Al checkpoint finale: **tutti e 4 i finali disponibili**, 43/43 collezionabili, 7/7 simboli; poi ogni finale viene **giocato** (epilogo, profilo); variante Cenere con legame basso → epilogo «cenere_soli»; con statistiche basse → solo Cenere. Nessun errore in console. |
| `minimal` | solo passi obbligatori, risposte fredde o sbagliate, errori d'ordine nel meccanismo finale: la partita arriva in fondo (**nessun dead-end**) e **solo Cenere** è disponibile. |
| `save` | salvataggio su slot, ricarica pagina, slot e autosave presenti, stato identico dopo il caricamento, la partita prosegue, «Continua», eliminazione slot, **migrazione v1 → v3**. |
| `mobile` | viewport 844×390, touch, senza modalità test: avvio con tocchi, salto cutscene, avanzamento dialoghi, tocco su hotspot, nessuno scroll orizzontale. |

Esito dell'ultima esecuzione (questo commit): **tutte le suite superate**, 0 errori in console.

Statistiche misurate:
- FULL, a fine Cap. VII: Fiducia ~15, Legame ~35, Conoscenza ~64, 12 prove.
- MINIMAL: Fiducia 2, Legame 8, Conoscenza 23, 7 prove → solo Cenere.

### 3. Screenshot — `node tests/screens.mjs [w h]`
Genera in `tests/screens/` (ignorata da git) lo screenshot di ogni scena con hotspot evidenziati, di ogni enigma, del dialogo a temi, dei ritratti con tutte le espressioni e dei pannelli (taccuino, salvataggi, opzioni, archivio, suggerimenti, inventario), più `index.html` come provino. Usato per la revisione visiva desktop (1280×720) e mobile (844×390).

## Manuali (checklist)

### Browser
- [ ] Chrome desktop · [ ] Firefox desktop · [ ] Safari macOS · [ ] Safari iOS · [ ] Chrome Android
- [ ] apertura da `file://` (usa `data/bundle.js`)
- [ ] GitHub Pages in sottocartella (`/<repo>/`)

### Funzioni
- [ ] Nuova partita, Continua, Carica, slot pieni/vuoti, sovrascrittura con conferma, eliminazione
- [ ] Refresh in mezzo a una scena: si riprende dall'ultimo punto stabile
- [ ] Cambio personaggio: Tab, ritratto, bloccato nello Studio (Cap. I) e nel Cap. IV, vista «altrove» quando sono separati
- [ ] Clic destro / pressione lunga = guarda; doppio clic = corsa; Spazio = punti interattivi
- [ ] Oggetto su hotspot, su personaggio (Sandro, partner), su oggetto; uso sbagliato → feedback
- [ ] «Mostra un oggetto» nei dialoghi
- [ ] Suggerimenti a 3 livelli da HUD e dentro gli enigmi
- [ ] Taccuino: tutte le schede, Lista dei 17 (raschiato → nome di Guido dopo il Cap. VI), Archivio (lettura dei collezionabili raccolti)
- [ ] Opzioni: volumi, mute, audio sintetico, velocità testo, avanzamento automatico, riduzione animazioni, schermo intero
- [ ] Cutscene: clic per avanzare, «Salta»
- [ ] Finali: scelta con finali bloccati e suggerimento; epilogo; titoli; post-credit; schermata finale con «Carica il salvataggio prima della scelta»
- [ ] Modalità sviluppatore (`?debug=1`): preset capitolo, salto scena, oggetti, statistiche, sblocchi, flag, report asset

### Asset reali
- [ ] Copiare uno sfondo in `assets/backgrounds/<scena>.webp`, `node tools/scan-assets.mjs`, verificare che sostituisca il fondale e che i props procedurali spariscano (restano solo quelli `overlay`)
- [ ] Sprite strip in `assets/sprites/beps/walk.png`: animazione a frame, flip a sinistra
- [ ] Ritratto `assets/portraits/kiki/smile.png` (le altre espressioni ricadono su `neutral.png`)
- [ ] File audio: dissolvenza al cambio scena

## Bug noti / limiti
Vedi «Problemi noti» in [CHANGELOG.md](CHANGELOG.md).
