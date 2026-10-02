# Giuseppe & Kiki — Il Segreto di Orfeo

Vertical slice di un'avventura grafica punta-e-clicca originale ispirata al linguaggio dei grandi classici anni '90.

## Stato del progetto

Questa versione contiene:

- schermata titolo;
- interfaccia punta-e-clicca;
- verbi Guarda / Usa / Parla;
- inventario;
- hotspot;
- taccuino;
- primo micro-enigma;
- apertura narrativa del Capitolo I;
- primo incontro fra Giuseppe e Kiki;
- struttura dati dei 7 capitoli;
- architettura degli asset pronta per sprite, fondali, GUI, audio e cutscene.

La grafica presente nella vertical slice è volutamente provvisoria. Gli asset finali verranno sostituiti senza modificare la struttura del motore.

## Avvio locale

Aprire `index.html` in un browser moderno.

Per evitare restrizioni dei browser durante lo sviluppo:

```bash
python3 -m http.server 8000
```

poi aprire `http://localhost:8000`.

## GitHub Pages

1. Crea un repository GitHub.
2. Carica il contenuto di questa cartella nella root del repository.
3. Vai in **Settings > Pages**.
4. Scegli **Deploy from a branch**.
5. Seleziona `main` e `/ (root)`.
6. Salva.

## Asset pipeline prevista

- Fondali: 3840×2160 master, export 1920×1080.
- Personaggi: sprite separati per Giuseppe, Kiki e NPC.
- Animazioni: idle, walk 8 direzioni semplificate, talk, use, pickup, speciali.
- GUI: inventario, verbi, dialoghi, taccuino, menu, salvataggi.
- Cutscene: immagini illustrate / animazioni 2D.
- Audio: musica ambientale, SFX, eventuale doppiaggio.

## Directory

`assets/backgrounds` — fondali  
`assets/sprites` — personaggi  
`assets/gui` — interfaccia  
`assets/items` — oggetti inventario  
`assets/audio` — musica ed effetti  
`data` — storia e dati di gioco  
`docs` — bible narrativa, asset list e linee guida  
`src` — codice del gioco
