# ENIGMI

Regole comuni: ogni enigma si apre in un pannello a schermo intero, si può **lasciare e riprendere** (lo stato è salvato), ha **3 suggerimenti** richiesti dal giocatore (leggero → specifico → quasi-soluzione, pulsante `?`), dà feedback chiaro su ogni tentativo e non ha penalità permanenti. Le definizioni sono in `data/puzzles.json`, il codice in `src/puzzles/`. Ogni tipo espone `auto()`, usato dai test per risolverlo tramite i suoi stessi input.

| # | Cap. | Enigma | Tipo | Dove / come si apre | Prerequisiti |
|---|---|---|---|---|---|
| 1 | I | Il documento strappato | `fragments` | esaminando i Frammenti o usandoli sul tavolo della stanza murata | Frammenti (armadio + coltellino) |
| 2 | I | La catena O-17 | `chain` | schedario dell'Archivio | l'archivista apre il cassetto O |
| 3 | II | Le due fotografie | `overlay` | banco luminoso dello Studio Marchetti | Foto 1944 + Foto 1967 |
| 4 | II | Il medaglione sulla mappa | `dial` | combinando Medaglione e Mappa (o sullo scrittoio di Ada) | Medaglione intero + Mappa cifrata |
| 5 | III | I diciassette cassetti | `drawers` | mobile della Sala dei Cassetti | fermo sbloccato (Beps); targa tradotta (Kiki) consigliata |
| 6 | III | Fuga cooperativa | scena | grata / leva / cancello / scala | — |
| 7 | IV | Il Sigillo di Orfeo | `seal` | banco di Mastro Neri | 4 frammenti, permesso di Neri |
| 8 | V | Gli anelli di Istanbul | `rings` | meccanismo nella Camera degli Anelli | Medaglione inserito |
| 9 | VI | La cronologia di Orfeo | `timeline` | tavolo dell'Archivio di Parigi | — |
| 10 | VII | Il meccanismo finale + La Ruota dei Nomi | scena + `register` | Camera di Orfeo | Sigillo, Nastro, Chiave d'ottone, entrambi i protagonisti |

## 1. Il documento strappato (Cap. I)
Sei strisce di un promemoria del 1966 da riordinare (tocca due strisce per scambiarle). Due indizi convergenti: **bordi strappati complementari** (disegnati dallo stesso codice) e **frasi spezzate** che continuano sulla striscia successiva.
Soluzione: intestazione → «L'acqua è arrivata…» → «si sono salvati…» → «e portate le copie a Parigi…» → «del catalogo: si parte dalla scheda O-1…» → «al rimando in rosso…». Ricompensa: Promemoria 1966 (prova).

## 2. La catena O-17 (Cap. I)
17 schede; si parte da O-1 e si aggiunge alla catena solo la scheda richiamata dalla precedente. Distrattori: catene circolari (O-2↔O-8, O-5↔O-9…). Due schede sono **macchiate dall'alluvione** e vanno dedotte dalla nota a matita:
O-1 → O-6 → **O-11** (*stesso autore, 1967* → J. Marchetti → O-4) → O-4 → **O-15** (*quanti erano i custodi* → 17) → O-17. Un'aggiunta sbagliata non svuota la catena.

## 3. Le due fotografie (Cap. II)
La Foto 1967, semitrasparente, va sovrapposta alla 1944: trascinamento, frecce, rotazione ±2°, scala ±0.02, rotella del mouse. Indizio diegetico: **crocini di registro** rossi agli angoli (Kiki li riconosce: «si usano in tipografia per sovrapporre due lastre»). Tolleranza larga; feedback «quasi» con bordo dorato. Partenza: +70/−45 px, 14°, 82%.
Risultato: le due metà della lira si completano e la donna occupa lo stesso punto → «non è la stessa donna: è un ruolo».

## 4. Il medaglione sulla mappa (Cap. II)
Il medaglione (10 fori, una tacca) ruota in 8 posizioni sulla mappa cifrata; ogni posizione mostra 10 lettere. Indizio: «La stella guida la tacca» (retro della Foto 1967, da stampare in camera oscura) e la stella rossa a nord-est. Soluzione: tacca sulla stella → **TEODOSIANA**. Le altre letture sono anagrammi senza senso.

## 5. I diciassette cassetti (Cap. III) — cooperativo
- **Beps**, curioso che smonta qualunque cosa, nota che il mobile è 20 cm più corto della nicchia e sblocca il fermo laterale col coltellino (Kiki non ci arriva: «smonta tutto da quando è nato»).
- **Kiki** traduce la targa: *Primus ducit, secunda meminit, tertius traicit, ultimus verba custodit* (Beps «ha fatto il classico vent'anni fa»).
- La LISTA_17 parziale (Cap. I) associa ruoli ed emblemi: guida = lira ♪, ricorda = luna ☾, traghetta = àncora ⚓, custodisce le parole = foglia ❧.
Ordine: ♪ ☾ ⚓ ❧. Un cassetto sbagliato richiude tutti con un clac (nessuna penalità). Il cassetto ⌒ raschiato non si apre (aggancio narrativo al XVII).

## 6. Fuga cooperativa (Cap. III)
Allarme: la porta del salone è bloccata. Beps svita la grata (coltellino) → solo Kiki entra nel condotto (`@place` in un'altra scena) → Kiki tira la leva a molla e la tiene → **cambio a Beps** → Beps passa il cancello (i due si ritrovano) → la scala retrattile si abbassa solo in due («fammi scaletta»). Ogni passo dà istruzioni contestuali se tentato dal personaggio sbagliato.

## 7. Il Sigillo di Orfeo (Cap. IV)
Quattro quarti (Roma, Banca, Cantiere, Ponte Vecchio) da posare in una matrice 2×2 e ruotare. Indizi: il motto sul bordo **ORFEO · NON · VOLTARTI** letto in senso orario e la lira al centro che si ricompone. Feedback distingue «casella sbagliata» da «rotazione sbagliata». Ottenere i quattro pezzi è a sua volta un mini-percorso: Lista dei 17 a Mastro Neri, chiave d'ottone + parola «Euridice» alla Banca, pacco di Sandro.

## 8. Gli anelli di Istanbul (Cap. V)
Quattro anelli concentrici da 8 simboli; un indice in alto. Sequenza da allineare (dal centro): **luna, lira, onda, chiave**, incisa sul retro del medaglione (visibile esaminandolo dal Cap. V, ricordata da Kiki inserendolo). Meccanica di accoppiamento: ruotare un anello trascina di uno scatto quello più interno → strategia logica dall'esterno verso l'interno. Feedback: «N anelli su 4 mostrano il simbolo giusto».

## 9. La cronologia di Orfeo (Cap. VI)
Sette documenti da ordinare (date esplicite o implicite: «cinque giorni dopo l'alluvione») e **due contraddizioni** da segnare:
1. *Lettera di Orfeo, 5 agosto 1944*: dice che il Ponte Vecchio crollò — ma fu l'unico ponte risparmiato (lo conferma il Rapporto del Barcaiolo e lo sa chi ha giocato il Cap. I/IV);
2. *Verbale del 12 marzo 1967*: Euridice «assente» — il nastro e il provino a contatto provano che c'era.
Verifica con feedback: quanti documenti sono al posto giusto, poi quante contraddizioni sono vere.

## 10. Il meccanismo finale (Cap. VII) — grande enigma cooperativo
La Camera è divisa da un abisso: Beps sulla piattaforma sinistra (incavo del Sigillo, serratura), Kiki sulla destra (grammofono, Ruota dei Nomi, leva). L'iscrizione dà l'ordine:
1. **Il Sigillo apre** — Beps inserisce il Sigillo.
2. **La Voce chiama** — Kiki mette il Nastro nel grammofono (la voce di Ada del 1967).
3. **I Nomi rispondono** — Kiki apre la **Ruota dei Nomi** (`register`): restituire al XVII il suo emblema, l'arco ⌒ del Ponte. Se si conoscono i 7 simboli compare il **XVIII**, «largo il doppio», dove si possono scrivere due nomi.
4. **La Chiave chiude — ma solo se nessuno resta solo** — Kiki tiene la leva, poi si passa a Beps che gira la chiave d'ottone.
Ogni passo fuori ordine risponde con la riga dell'iscrizione pertinente e conta un errore (`final_errors`), senza bloccare. **Finale perfetto** = nessun errore, nessun suggerimento nel Cap. VII, Ruota senza errori: requisito del finale segreto.
