// Genera docs/ASSET_REQUIREMENTS.md a partire dai dati di gioco e dal manifest.
// Uso: node tools/asset-list.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
const scenes = J('data/scenes.json').scenes;
const chars = J('data/characters.json').characters;
const items = J('data/items.json').items;
const cuts = J('data/cutscenes.json').cutscenes;
const cols = J('data/collectibles.json');
const manifest = existsSync(join(root, 'assets/manifest.json')) ? J('assets/manifest.json').files : [];
const have = (p) => manifest.includes(p);
const anyHave = (...ps) => ps.find(have);
const mark = (...ps) => (anyHave(...ps) ? '✅ presente' : '⬜ manca');

const EXPR = ['neutral', 'smile', 'laugh', 'surprised', 'worried', 'sad', 'angry', 'think', 'skeptical', 'tender', 'determined', 'scared'];
const ANIMS = { idle: 6, walk: 8, run: 8, talk: 6, use: 6, pickup: 6, inspect: 6, read: 6, phone: 6, reaction: 6 };

let md = `# ASSET REQUIREMENTS — Il Segreto di Orfeo

> File generato da \`node tools/asset-list.mjs\` a partire da \`data/*.json\` e \`assets/manifest.json\`.
> Stato al momento della generazione: **${manifest.length} file reali presenti** in \`assets/\`.

## Come funziona la sostituzione

1. Salva il file **esattamente** al percorso indicato (minuscole, estensione inclusa).
2. Rigenera il manifest: \`node tools/scan-assets.mjs\` (oppure fai push su GitHub: la Action *Asset manifest & data bundle* lo fa da sola).
3. Ricarica il gioco: l'asset reale sostituisce automaticamente il fallback procedurale. Nessuna modifica al codice.

Se un file manca, il gioco usa la grafica/il suono procedurale temporaneo e **non** fa richieste di rete (nessun 404, nessun crash).
Le immagini approvate non vengono mai sovrascritte da nessuno script: gli strumenti leggono \`assets/\`, non lo modificano (scrivono solo \`assets/manifest.json\` e \`assets/manifest.js\`).

### Formati consigliati
- Sfondi e cutscene: **WebP** (qualità 82–88) o JPG. Il gioco cerca nell'ordine \`.webp\`, \`.jpg\`, \`.png\`.
- Sprite, ritratti, oggetti, props: **PNG trasparente**.
- Audio: **OGG** (preferito) o MP3. Il gioco cerca \`.ogg\` poi \`.mp3\`.

### Convenzioni del mondo di gioco
- Mondo logico **1920×1080** (16:9). Gli sfondi master possono essere 3840×2160 ed esportati a 1920×1080.
- I personaggi poggiano i piedi sul punto (x, y); il frame sprite è **200×420 px logici** con i piedi al centro del bordo inferiore (si può esportare a 2× = 400×840 per frame).
- Gli hotspot sono già definiti in \`data/scenes.json\`: lo sfondo reale deve mantenere gli oggetti **nelle stesse posizioni** (vedi colonna «Hotspot principali») oppure vanno aggiornati i \`rect\`.

---

## 1. Sfondi (\`assets/backgrounds/<id>.webp|jpg|png\`) — 1920×1080, opaco

| Stato | File | Scena | Capitolo | Luogo | Hotspot principali (x,y,w,h) |
|---|---|---|---|---|---|
`;
for (const [id, s] of Object.entries(scenes)) {
  const hs = (s.hotspots || []).filter((h) => !h.col).slice(0, 6).map((h) => `${h.name} [${h.rect.join(',')}]`).join('; ');
  const bgFile = s.bg && have(s.bg) ? s.bg : `assets/backgrounds/${id}.webp`;
  md += `| ${mark(...[s.bg, `assets/backgrounds/${id}.webp`, `assets/backgrounds/${id}.jpg`, `assets/backgrounds/${id}.png`].filter(Boolean))} | \`${bgFile}\` | ${s.name} | ${s.chapter} | ${s.place || ''} | ${hs} |\n`;
}

md += `
### 1b. Oggetti di scena rimovibili (\`assets/items/scene/<scena>_<hotspot>.png\`) — PNG trasparente, dimensione = rect dell'hotspot
Servono solo per gli oggetti che **spariscono** quando vengono raccolti (collezionabili, oggetti presi). Se lo sfondo reale li ha già dipinti e non spariscono, non servono.

| Stato | File | Scena | Dimensione (px logici) | Descrizione |
|---|---|---|---|---|
`;
for (const [id, s] of Object.entries(scenes)) for (const h of s.hotspots || []) {
  const removable = h.col || (h.art && typeof h.art === 'object' && h.art.overlay) || (h.if && /got_|col\.|!flag\.(got|woman)/.test(h.if));
  if (!removable) continue;
  const p = `assets/items/scene/${id}_${h.id}.png`;
  md += `| ${mark(p)} | \`${p}\` | ${id} | ${h.rect[2]}×${h.rect[3]} | ${h.name}${h.col ? ` (collezionabile ${h.col})` : ''} |\n`;
}

md += `
---

## 2. Sprite dei personaggi (\`assets/sprites/<id>/<anim>.png\`) — PNG trasparente, strisce orizzontali

Ogni file è una **striscia orizzontale** di N frame uguali (frame 200×420 logici, consigliato 400×840 reali). Il personaggio guarda **a destra**: il flip a sinistra è automatico.
Se manca un'animazione si usa \`idle\`; se manca anche \`idle\` si usa la figura procedurale.

| Stato | File | Personaggio | Animazione | Frame | Dimensione striscia consigliata |
|---|---|---|---|---|---|
`;
for (const id of ['beps', 'kiki']) for (const [a, n] of Object.entries(ANIMS)) {
  const sp = (chars[id].sprites || {})[a];
  const frames = sp ? sp.frames : n;
  md += `| ${mark(`assets/sprites/${id}/${a}.png`)} | \`assets/sprites/${id}/${a}.png\` | ${chars[id].name} | ${a} | ${frames} | ${frames * 400}×840 |\n`;
}
const npcs = Object.keys(chars).filter((k) => !['beps', 'kiki', 'kiki_npc'].includes(k));
md += `\nPNG NPC (per ora fallback procedurale; per attivarli aggiungere il blocco \`sprites\` in \`data/characters.json\` come per Beps/Kiki):\n\n| Stato | File | Personaggio | Animazioni minime |\n|---|---|---|---|\n`;
for (const id of npcs) md += `| ${mark(`assets/sprites/${id}/idle.png`)} | \`assets/sprites/${id}/idle.png\`, \`talk.png\` | ${chars[id].name}${chars[id].role ? ' — ' + chars[id].role : ''} | idle (6), talk (6)${id === 'varano' ? ', walk (8)' : ''} |\n`;

md += `
---

## 3. Ritratti con espressioni (\`assets/portraits/<id>/<espressione>.png\`) — 300×360 (o 600×720), PNG

Usati nel riquadro dei dialoghi e nel taccuino. Se manca un'espressione si usa \`neutral.png\`; se manca anche quello, il ritratto procedurale.
Espressioni supportate: ${EXPR.map((e) => '`' + e + '`').join(', ')}.

| Personaggio | Priorità | Espressioni richieste | Presenti |
|---|---|---|---|
`;
const prio = { beps: 'ALTA (tutte)', kiki: 'ALTA (tutte)', varano: 'ALTA', helene: 'media', archivista: 'media', ilario: 'media', selim: 'media' };
for (const id of Object.keys(chars).filter((k) => k !== 'kiki_npc')) {
  const need = ['beps', 'kiki'].includes(id) ? EXPR : id === 'varano' ? ['neutral', 'sad', 'angry', 'surprised', 'think', 'smile'] : ['neutral', 'smile', 'surprised', 'sad', 'worried'];
  const got = need.filter((e) => have(`assets/portraits/${id}/${e}.png`));
  md += `| ${chars[id].name} (\`${id}\`) | ${prio[id] || 'bassa'} | ${need.join(', ')} | ${got.length}/${need.length} |\n`;
}

md += `
---

## 4. Icone oggetti (\`assets/items/<id>.png\`) — 192×192 PNG trasparente

| Stato | File | Oggetto | Descrizione |
|---|---|---|---|
`;
for (const [id, it] of Object.entries(items)) md += `| ${mark(`assets/items/${id}.png`)} | \`assets/items/${id}.png\` | ${it.name} | ${it.kind || ''} |\n`;

md += `
---

## 5. Cutscene (\`assets/cutscenes/<cutscene>_<n>.webp\`) — 1920×1080 (consigliato 2400×1350 per pan/zoom), opaco

Ogni inquadratura viene animata con pan/zoom/fade; un'immagine leggermente più grande del quadro lascia margine alla camera.

| Stato | File | Cutscene | Inquadratura | Contenuto | Fallback attuale |
|---|---|---|---|---|---|
`;
for (const [id, c] of Object.entries(cuts)) c.shots.forEach((s, i) => {
  const p = s.img && have(s.img) ? s.img : `assets/cutscenes/${id}_${i + 1}.webp`;
  const what = s.title ? `Titolo «${s.title}»` : s.text ? s.text.slice(0, 90) + (s.text.length > 90 ? '…' : '') : '';
  md += `| ${mark(p, p.replace('.webp', '.jpg'), p.replace('.webp', '.png'))} | \`${p}\` | ${id} | ${i + 1} | ${what} | ${s.scene ? 'sfondo ' + s.scene : s.photo ? 'foto ' + s.photo : 'colore'} |\n`;
});

md += `
---

## 6. Enigmi (\`assets/puzzles/\`)

| Stato | File | Uso | Dimensione | Note |
|---|---|---|---|---|
| ${mark('assets/puzzles/photo1944.png', 'assets/puzzles/photo1944.jpg')} | \`assets/puzzles/photo1944.png\` | Foto 1944 (sovrapposizione, cutscene) | 800×560, opaco | 4 crocini di registro rossi agli angoli a (40,30),(760,30),(40,530),(760,530); donna col cappello centrata in (400,300); metà sinistra della lira «bucata» in (400,140); volto graffiato terzo da sinistra |
| ${mark('assets/puzzles/photo1967.png', 'assets/puzzles/photo1967.jpg')} | \`assets/puzzles/photo1967.png\` | Foto 1967 | 800×560, **parzialmente trasparente o chiara** (viene sovrapposta in multiply) | stessi crocini e stessa posizione della donna; metà destra della lira |
| ${mark('assets/puzzles/mappa_cifrata.png')} | \`assets/puzzles/mappa_cifrata.png\` | Mappa cifrata | 800×800 | stella rossa a nord-est (45°) sul cerchio esterno |
| ${mark('assets/puzzles/sigillo_A.png')} | \`assets/puzzles/sigillo_A.png\` … \`_D.png\` | Quattro quarti del Sigillo | 200×200 trasparenti | A=alto-sinistra «ORFEO», B=alto-destra «NON», C=basso-destra «VOL», D=basso-sinistra «TARTI»; centro del sigillo nell'angolo interno |

---

## 7. Collezionabili — fotografie (\`assets/collectibles/<id>.jpg\`) — 920×640 circa, opaco

| Stato | File | Titolo | Contenuto |
|---|---|---|---|
`;
for (const c of cols.photos) md += `| ${mark(`assets/collectibles/${c.id}.jpg`, `assets/collectibles/${c.id}.png`)} | \`assets/collectibles/${c.id}.jpg\` | ${c.title} (${c.date}) | ${c.text.slice(0, 110)}… |\n`;

md += `
Documenti, registrazioni e simboli usano layout testuali e non richiedono immagini.

---

## 8. Interfaccia (\`assets/gui/\`)

| Stato | File | Uso | Dimensione |
|---|---|---|---|
| ${mark('assets/gui/title.jpg', 'assets/gui/title.png')} | \`assets/gui/title.jpg\` | Illustrazione della schermata del titolo | 1920×1080 (lenta animazione di pan) |

I cursori (neutro, guarda, usa, parla, uscita, oggetto) sono SVG inline in \`src/style.css\`: per sostituirli con PNG basta cambiare le regole \`#world[data-cursor=…]\`.

---

## 9. Audio (\`assets/audio/\`) — OGG/MP3 in loop dove indicato

Se un file manca e l'opzione «Audio sintetico di riserva» è attiva, il gioco genera un pad/rumore procedurale molto discreto.

### Musica (\`assets/audio/music/<id>.ogg\`, loop)
| Stato | File | Dove |
|---|---|---|
`;
const musics = new Map();
Object.entries(scenes).forEach(([id, s]) => s.music && (musics.get(s.music) || musics.set(s.music, []).get(s.music)).push(id));
Object.entries(cuts).forEach(([id, c]) => c.music && (musics.get(c.music) || musics.set(c.music, []).get(c.music)).push('cutscene ' + id));
(musics.get('title') || musics.set('title', []).get('title')).push('schermata titolo');
for (const [m, w] of musics) md += `| ${mark(`assets/audio/music/${m}.ogg`, `assets/audio/music/${m}.mp3`)} | \`assets/audio/music/${m}.ogg\` | ${[...new Set(w)].slice(0, 8).join(', ')}${w.length > 8 ? '…' : ''} |\n`;
md += `\n### Ambienti (\`assets/audio/ambience/<id>.ogg\`, loop)\n| Stato | File | Dove |\n|---|---|---|\n`;
const ambs = new Map();
Object.entries(scenes).forEach(([id, s]) => s.ambience && (ambs.get(s.ambience) || ambs.set(s.ambience, []).get(s.ambience)).push(id));
for (const [m, w] of ambs) md += `| ${mark(`assets/audio/ambience/${m}.ogg`, `assets/audio/ambience/${m}.mp3`)} | \`assets/audio/ambience/${m}.ogg\` | ${w.slice(0, 8).join(', ')}${w.length > 8 ? '…' : ''} |\n`;
const sfx = ['click', 'pickup', 'success', 'fail', 'page', 'door', 'clue', 'collect', 'mechanism', 'drawer', 'heart', 'phone', 'switch', 'tape', 'step'];
md += `\n### Effetti (\`assets/audio/sfx/<id>.ogg\`, singoli)\n| Stato | File |\n|---|---|\n`;
for (const s of sfx) md += `| ${mark(`assets/audio/sfx/${s}.ogg`, `assets/audio/sfx/${s}.mp3`)} | \`assets/audio/sfx/${s}.ogg\` |\n`;

md += `
---

## 10. Priorità consigliate di produzione

1. **Sprite e ritratti di Beps e Kiki** (idle, walk, talk + 12 espressioni): sono sullo schermo il 100% del tempo.
2. **Ritratti e sprite di Aurelio Varano (Nemico 1)** e della **donna col cappello**.
3. **Sfondi del Capitolo 1** (6) e **Foto 1944/1967** (servono anche all'enigma di sovrapposizione).
4. Sfondi dei capitoli 2–7, poi cutscene, poi icone oggetti.
5. Musica (9 temi) e ambienti (8 loop), poi effetti.
`;
writeFileSync(join(root, 'docs/ASSET_REQUIREMENTS.md'), md);
console.log('docs/ASSET_REQUIREMENTS.md generato');
