# Menu illustrati, audio originale e rivelazione di Varano

Pausa, salvataggio, caricamento, opzioni, raccolte, suggerimenti e scelta degli oggetti usano ora carta e cuoio del diario originale. Dialoghi, risposte, notifiche e controlli riprendono le cornici in ottone dell’atlante dell’interfaccia. Gli slot sono appunti con fotografie su una pagina scorrevole, accessibile anche sul telefono. I cursori del volume e le caselle delle opzioni sono piccoli elementi in ottone.

Varano compare come figura nell’ombra fino all’incontro nella grotta del capitolo 4. Il ritratto del diario segue la stessa regola; conoscere il nome prima della grotta non rivela il volto. I salvataggi precedenti che hanno già superato la grotta mantengono il ritratto visibile.

Sono incluse nove composizioni ambientali originali di 64 secondi, in stereo: titolo, Firenze, tensione, Parigi, Roma, Istanbul, intimità, finale e mistero. Ogni luogo conserva il proprio tema; i cambi avvengono gradualmente. Le tracce sono fornite in OGG e MP3. `tools/compose-ambient.py` conserva la composizione e l’esportazione; per rigenerarle servono `numpy` e `imageio-ffmpeg`. Queste dipendenze non servono per giocare. `docs/AUDIO_ORIGINALE.json` riporta durata, livelli e verifica del raccordo.

Le battute hanno un ronzio morbido a impulsi, con registri diversi per personaggio. Segue la comparsa del testo e si interrompe quando finisce, viene saltato o si apre un menu. Il narratore non ronza. Le opzioni includono volume separato e interruttore; “Silenzia tutto” include anche il ronzio. Musica e ronzio si fermano quando la pagina passa in secondo piano.

Verifiche: menu e tutti i sei slot manuali a 1280×720 e 375×812; salvataggio e caricamento reali; nove tracce decodificate; riproduzione musicale e MP3 di riserva; timbri diversi e arresto del ronzio; protezione del volto prima della grotta; sprite e sette ritratti dopo la rivelazione; partita completa con 43/43 collezionabili, quattro finali, percorso minimo, salvataggi e mobile.

I nomi non sono stati sostituiti. La lista con ruolo, importanza narrativa e spazio per il nome nuovo è in `docs/NOMI_E_RUOLI.md` e `docs/NOMI_DA_CAMBIARE.csv`.
