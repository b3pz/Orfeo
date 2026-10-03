// Validatore statico dei dati di gioco.
// Controlla: riferimenti (scene, oggetti, dialoghi, puzzle, cutscene, collezionabili,
// indizi, obiettivi), condizioni sintatticamente valide, speaker esistenti,
// raggiungibilità delle scene, ottenibilità degli oggetti, collezionabili piazzati,
// temi che danno statistiche ripetibili, tetto massimo delle statistiche.
// Uso: node tools/validate.mjs   (exit code 1 se ci sono errori)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f) => JSON.parse(readFileSync(join(root, 'data', f + '.json'), 'utf8'));
const D = {};
for (const f of ['chapters', 'scenes', 'dialogues', 'items', 'puzzles', 'characters', 'collectibles', 'endings', 'cutscenes']) D[f] = load(f);

// load the condition compiler from the engine
const ctx = { window: {}, console, matchMedia: () => ({ matches: false }), document: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(root, 'src/core/util.js'), 'utf8'), ctx);
const O = ctx.window.Orfeo;
// command names from the engine source
const runnerSrc = readFileSync(join(root, 'src/systems/ScriptRunner.js'), 'utf8');
const COMMANDS = new Set([...runnerSrc.matchAll(/^    (\w+)\((?:a)?\) \{/gm)].map((m) => m[1]));

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const scenes = D.scenes.scenes;
const dialogues = D.dialogues.dialogues;
const items = D.items.items;
const puzzles = D.puzzles.puzzles;
const chars = D.characters.characters;
const cutscenes = D.cutscenes.cutscenes;
const clues = D.chapters.clues;
const objectives = D.chapters.objectives;
const cols = {};
for (const t of ['documents', 'photos', 'recordings', 'symbols']) (D.collectibles[t] || []).forEach((c) => (cols[c.id] = Object.assign({ type: t }, c)));

const KNOWN_NS = new Set(['flag', 'item', 'stat', 'puzzle', 'perr', 'clue', 'topic', 'col', 'visited', 'choice', 'chapter', 'active', 'scene', 'together', 'present', 'ending', 'hints', 'count', 'evidence', 'rel', 'true', 'false']);
const SPEAKERS = new Set(['self', 'other', 'narr', 'note', ...Object.keys(chars)]);
const SAY_RE = /^([a-z0-9_]+)(?:\[([a-z]+)\])?:\s?([\s\S]*)$/i;
const EXPR = new Set(['neutral', 'smile', 'laugh', 'surprised', 'worried', 'sad', 'angry', 'think', 'skeptical', 'tender', 'determined', 'scared']);

const given = new Map(); // item -> [where]
const taken = new Set();
const goto = new Map(); // scene -> set of targets (via scripts)
const flagsSet = new Set();
const flagsRead = new Set();
const statGains = { fiducia: 0, legame: 0, conoscenza: 0 };
const cluesGiven = new Set();
const objsSet = new Set();
const dialogsUsed = new Set();
const puzzlesUsed = new Set();
const cutsUsed = new Set();
const colsCollected = new Set();

function checkCond(src, where) {
  if (src == null || src === true || src === '') return;
  try {
    O.compileCond(String(src));
  } catch (e) {
    err(`${where}: condizione non valida «${src}»: ${e.message}`);
    return;
  }
  for (const m of String(src).replace(/'[^']*'|"[^"]*"/g, '').matchAll(/[A-Za-z_][\w.\-]*/g)) {
    const id = m[0];
    const ns = id.split('.')[0];
    if (!KNOWN_NS.has(ns)) { err(`${where}: identificatore sconosciuto «${id}» in «${src}»`); continue; }
    const key = id.slice(ns.length + 1);
    if (ns === 'item' && !items[key]) err(`${where}: oggetto inesistente «${key}»`);
    if (ns === 'puzzle' && !puzzles[key]) err(`${where}: puzzle inesistente «${key}»`);
    if (ns === 'perr' && !puzzles[key]) err(`${where}: puzzle inesistente «${key}»`);
    if (ns === 'clue' && !clues[key]) err(`${where}: indizio inesistente «${key}»`);
    if (ns === 'col' && !cols[key]) err(`${where}: collezionabile inesistente «${key}»`);
    if (ns === 'flag') flagsRead.add(key);
  }
}

function scanScript(s, where, ctxScene) {
  if (s == null) return;
  if (typeof s === 'string') return scanStep(s, where, ctxScene);
  if (Array.isArray(s)) return s.forEach((x, i) => scanStep(x, `${where}[${i}]`, ctxScene));
  if (typeof s === 'object') {
    // per-character text object
    if (s.beps !== undefined || s.kiki !== undefined || s.default !== undefined) {
      for (const k of ['beps', 'kiki', 'default']) if (s[k] !== undefined) scanScript(s[k], `${where}.${k}`, ctxScene);
      return;
    }
    scanStep(s, where, ctxScene);
  }
}

function scanStep(st, where, sc) {
  if (st == null) return;
  if (typeof st === 'string') {
    if (st.startsWith('@')) return scanCmd(st.slice(1), where, sc);
    const m = st.match(SAY_RE);
    if (m && !SPEAKERS.has(m[1].toLowerCase()) && /^[a-z_]+$/.test(m[1]) && m[1].length < 14) warn(`${where}: «${m[1]}:» non è uno speaker noto (verrà detto da self)`);
    if (m && SPEAKERS.has(m[1].toLowerCase()) && m[2] && !EXPR.has(m[2])) err(`${where}: espressione sconosciuta «${m[2]}»`);
    return;
  }
  if (Array.isArray(st)) return scanScript(st, where, sc);
  if (typeof st !== 'object') return;
  if ('if' in st) checkCond(st.if, where);
  if (st.do) scanScript(st.do, where + '.do', sc);
  if (st.else) scanScript(st.else, where + '.else', sc);
  if (st.choice) st.choice.forEach((c, i) => { checkCond(c.if, `${where}.choice${i}`); if (c.line) scanStep(c.line, `${where}.choice${i}.line`, sc); scanScript(c.do, `${where}.choice${i}`, sc); });
  if (st.random) st.random.forEach((r, i) => scanScript(r, `${where}.random${i}`, sc));
}

function scanCmd(src, where, sc) {
  const i = src.indexOf(':');
  const cmd = i < 0 ? src : src.slice(0, i);
  const arg = i < 0 ? '' : src.slice(i + 1).trim();
  if (!COMMANDS.has(cmd)) return err(`${where}: comando sconosciuto @${cmd}`);
  const ids = arg.split(',').map((x) => x.trim()).filter(Boolean);
  switch (cmd) {
    case 'give': ids.forEach((id) => { if (!items[id]) err(`${where}: @give oggetto inesistente ${id}`); if (!given.has(id)) given.set(id, []); given.get(id).push(where); }); break;
    case 'take': ids.forEach((id) => { if (!items[id]) err(`${where}: @take oggetto inesistente ${id}`); taken.add(id); }); break;
    case 'goto': { const t = arg.split('@')[0]; if (!scenes[t]) err(`${where}: @goto scena inesistente ${t}`); if (sc) { if (!goto.has(sc)) goto.set(sc, new Set()); goto.get(sc).add(t); } else (goto.get('*') || goto.set('*', new Set()).get('*')).add(t); break; }
    case 'place': { const t = arg.split('=')[1].split('@')[0]; if (!scenes[t]) err(`${where}: @place scena inesistente ${t}`); if (sc) { if (!goto.has(sc)) goto.set(sc, new Set()); goto.get(sc).add(t); } break; }
    case 'puzzle': if (!puzzles[arg]) err(`${where}: puzzle inesistente ${arg}`); puzzlesUsed.add(arg); break;
    case 'solve': if (!puzzles[arg]) err(`${where}: puzzle inesistente ${arg}`); break;
    case 'dialogue': if (!dialogues[arg]) err(`${where}: dialogo inesistente ${arg}`); dialogsUsed.add(arg); break;
    case 'cutscene': if (!cutscenes[arg]) err(`${where}: cutscene inesistente ${arg}`); cutsUsed.add(arg); break;
    case 'collect': if (!cols[arg]) err(`${where}: collezionabile inesistente ${arg}`); colsCollected.add(arg); break;
    case 'clue': if (!clues[arg]) err(`${where}: indizio inesistente ${arg}`); cluesGiven.add(arg); break;
    case 'objective': if (!objectives[arg]) err(`${where}: obiettivo inesistente ${arg}`); objsSet.add(arg); break;
    case 'flag': case 'inc': flagsSet.add(arg.split('=')[0]); break;
    case 'unflag': break;
    case 'stat': { const m = arg.match(/^(\w+)\s*([+-]\d+)(\s*quiet)?$/); if (!m || !(m[1] in statGains)) err(`${where}: @stat non valido «${arg}»`); else if (Number(m[2]) > 0) statGains[m[1]] += Number(m[2]); break; }
    case 'chapter': if (!D.chapters.chapters.find((c) => c.id === Number(arg))) err(`${where}: capitolo inesistente ${arg}`); break;
    case 'person': case 'show': case 'hide': if (!chars[arg]) err(`${where}: personaggio inesistente ${arg}`); break;
    case 'switch': if (!['beps', 'kiki'].includes(arg)) err(`${where}: @switch non valido`); break;
  }
}

/* ---------- scenes ---------- */
const exits = new Map();
for (const [id, s] of Object.entries(scenes)) {
  const w = `scena ${id}`;
  if (!s.name) err(`${w}: manca name`);
  if (!s.chapter) err(`${w}: manca chapter`);
  if (!Array.isArray(s.walk) || s.walk.length < 3) err(`${w}: walk mancante`);
  scanScript(s.firstEnter, w + '.firstEnter', id);
  scanScript(s.enter, w + '.enter', id);
  (s.fx || []).forEach((f) => typeof f === 'object' && checkCond(f.if, w + '.fx'));
  (s.walkIf || []).forEach((x) => checkCond(x.if, w + '.walkIf'));
  const hsIds = new Set();
  let observable = 0;
  for (const h of s.hotspots || []) {
    const hw = `${w} › ${h.id}`;
    if (hsIds.has(h.id)) err(`${hw}: id duplicato`);
    hsIds.add(h.id);
    if (!Array.isArray(h.rect) || h.rect.length !== 4) err(`${hw}: rect non valido`);
    else if (h.rect[0] < -10 || h.rect[1] < -10 || h.rect[0] + h.rect[2] > 1930 || h.rect[1] + h.rect[3] > 1090) warn(`${hw}: rect fuori dal mondo`);
    checkCond(h.if, hw + '.if');
    if (h.look) observable++;
    scanScript(h.look, hw + '.look', id);
    scanScript(h.use, hw + '.use', id);
    scanScript(h.take, hw + '.take', id);
    if (h.items) for (const [it, sc2] of Object.entries(h.items)) { if (it !== '*' && !items[it]) err(`${hw}: items su oggetto inesistente ${it}`); scanScript(sc2, `${hw}.items.${it}`, id); }
    if (h.talk) { if (!dialogues[h.talk]) err(`${hw}: dialogo inesistente ${h.talk}`); dialogsUsed.add(h.talk); }
    if (h.col) { if (!cols[h.col]) err(`${hw}: collezionabile inesistente ${h.col}`); if (colsCollected.has('placed:' + h.col)) err(`${hw}: collezionabile ${h.col} piazzato due volte`); colsCollected.add('placed:' + h.col); colsCollected.add(h.col); }
    if (h.exit) {
      const ex = typeof h.exit === 'string' ? { to: h.exit } : h.exit;
      if (!scenes[ex.to]) err(`${hw}: uscita verso scena inesistente ${ex.to}`);
      checkCond(ex.if, hw + '.exit.if');
      scanScript(ex.else, hw + '.exit.else', id);
      if (ex.if !== 'false') { if (!exits.has(id)) exits.set(id, new Set()); exits.get(id).add(ex.to); }
    }
    if (h.only && !['beps', 'kiki'].includes(h.only)) err(`${hw}: only non valido`);
  }
  for (const n of s.npcs || []) {
    const nw = `${w} › npc ${n.id}`;
    if (!chars[n.char || n.id]) err(`${nw}: personaggio inesistente ${n.char || n.id}`);
    checkCond(n.if, nw);
    if (n.talk) { if (!dialogues[n.talk]) err(`${nw}: dialogo inesistente ${n.talk}`); dialogsUsed.add(n.talk); }
    scanScript(n.look, nw + '.look', id);
  }
  const nHot = (s.hotspots || []).length;
  if (nHot < 5) warn(`${w}: solo ${nHot} hotspot`);
}

/* ---------- dialogues ---------- */
for (const [id, d] of Object.entries(dialogues)) {
  const w = `dialogo ${id}`;
  if (d.npc && !chars[d.npc]) err(`${w}: npc inesistente ${d.npc}`);
  scanScript(d.first, w + '.first');
  scanScript(d.intro, w + '.intro');
  scanScript(d.bye, w + '.bye');
  const tids = new Set();
  for (const t of d.topics || []) {
    if (tids.has(t.id)) err(`${w}: tema duplicato ${t.id}`);
    tids.add(t.id);
    checkCond(t.if, `${w}.${t.id}.if`);
    scanScript(t.do, `${w}.${t.id}`);
    const txt = JSON.stringify(t.do);
    if (/@stat:\w+\+/.test(txt) && !t.once && !t.repeatSafe && !/topic\.\w+\.\w+/.test(t.if || '')) err(`${w}.${t.id}: tema ripetibile che aumenta una statistica (aggiungi "once")`);
  }
  if (d.items) for (const [it, sc2] of Object.entries(d.items)) { if (it !== '*' && !items[it]) err(`${w}: items su oggetto inesistente ${it}`); scanScript(sc2, `${w}.items.${it}`); }
}
for (const [id, c] of Object.entries(chars)) (c.lookLines || []).forEach((l, i) => { checkCond(l.if, `personaggio ${id}.lookLines${i}`); scanScript(l.text, `personaggio ${id}.lookLines${i}`); });

/* ---------- items / combos ---------- */
for (const [id, it] of Object.entries(items)) {
  scanScript(it.examine, `oggetto ${id}.examine`);
  (it.examineIf || []).forEach((e, i) => { checkCond(e.if, `oggetto ${id}.examineIf${i}`); scanScript(e.do, `oggetto ${id}.examineIf${i}`); });
}
(D.items.combos || []).forEach((c, i) => {
  const w = `combo ${c.a}+${c.b}`;
  if (!items[c.a]) err(`${w}: oggetto ${c.a} inesistente`);
  if (!items[c.b]) err(`${w}: oggetto ${c.b} inesistente`);
  checkCond(c.if, w);
  scanScript(c.do, w);
  scanScript(c.notYet, w + '.notYet');
});

/* ---------- puzzles ---------- */
for (const [id, p] of Object.entries(puzzles)) {
  const w = `puzzle ${id}`;
  if (!p.title) err(`${w}: manca title`);
  if (!p.hints || p.hints.length !== 3) err(`${w}: servono esattamente 3 suggerimenti`);
  scanScript(p.onSolve, w + '.onSolve');
  scanScript(p.intro, w + '.intro');
  if (!puzzlesUsed.has(id)) warn(`${w}: mai aperto da uno script`);
  if (p.eighteenth) checkCond(p.eighteenth.if, w + '.eighteenth');
  (p.plaqueIf || []).forEach((x) => checkCond(x.if, w + '.plaqueIf'));
}

/* ---------- objectives ---------- */
for (const [id, o] of Object.entries(objectives)) {
  if (!o.hints || o.hints.length !== 3) err(`obiettivo ${id}: servono 3 suggerimenti`);
  if (!objsSet.has(id) && id !== 'o4_partenza') warn(`obiettivo ${id}: mai impostato`);
}

/* ---------- collectibles ---------- */
const expected = { documents: 17, photos: 12, recordings: 7, symbols: 7 };
for (const [t, n] of Object.entries(expected)) {
  const got = (D.collectibles[t] || []).length;
  if (got !== n) err(`collezionabili ${t}: ${got} invece di ${n}`);
}
for (const [id, c] of Object.entries(cols)) {
  if (!colsCollected.has('placed:' + id) && !colsCollected.has(id)) err(`collezionabile ${id} non ottenibile`);
  scanScript(c.after, `collezionabile ${id}.after`);
  if (c.stat) { const m = c.stat.match(/^(\w+)\+(\d+)$/); if (m) statGains[m[1]] += Number(m[2]); }
}

/* ---------- cutscenes ---------- */
for (const [id, c] of Object.entries(cutscenes)) {
  c.shots.forEach((s, i) => { if (s.scene && !scenes[s.scene]) err(`cutscene ${id}[${i}]: scena ${s.scene} inesistente`); (s.figures || []).forEach((f) => !chars[f.id] && err(`cutscene ${id}: figura ${f.id} inesistente`)); });
  scanScript(c.onEnd, `cutscene ${id}.onEnd`);
}

/* ---------- endings ---------- */
for (const [id, e] of Object.entries(D.endings.endings)) {
  checkCond(e.req, `finale ${id}.req`);
  scanScript(e.script, `finale ${id}.script`);
  scanScript(e.postcredit, `finale ${id}.postcredit`);
  (e.epilogues || []).forEach((ep, i) => checkCond(ep.if, `finale ${id}.epilogo${i}`));
}

/* ---------- start / chapters ---------- */
scanScript(D.chapters.start.before, 'start.before');
if (!scenes[D.chapters.start.scene]) err('start: scena iniziale inesistente');
for (const c of D.chapters.chapters) if (c.debugStart && !scenes[c.debugStart.scene]) err(`capitolo ${c.id}: debugStart.scene inesistente`);

/* ---------- reachability ---------- */
const reach = new Set([D.chapters.start.scene]);
const queue = [D.chapters.start.scene];
const globalGotos = new Set();
for (const [k, v] of goto) if (k === '*') v.forEach((t) => globalGotos.add(t));
// scripts outside scenes (dialogues, puzzles) can goto: treat as reachable once any scene of the previous chapter is reached
while (queue.length) {
  const s = queue.shift();
  const next = new Set([...(exits.get(s) || []), ...(goto.get(s) || [])]);
  for (const t of next) if (!reach.has(t)) { reach.add(t); queue.push(t); }
  if (!queue.length) for (const t of globalGotos) if (!reach.has(t)) { reach.add(t); queue.push(t); }
}
for (const id of Object.keys(scenes)) if (!reach.has(id)) err(`scena ${id} non raggiungibile`);

/* ---------- items obtainable / used ---------- */
for (const id of Object.keys(items)) if (!given.has(id)) err(`oggetto ${id} mai ottenibile (@give mancante)`);

/* ---------- flags read but never set ---------- */
const autoFlags = /^(got_|met_|entered_|solved_|hints_c7$|eighteenth_written$)/;
for (const f of flagsRead) if (!flagsSet.has(f) && !autoFlags.test(f)) err(`flag «${f}» letta ma mai impostata`);

/* ---------- clues ---------- */
for (const id of Object.keys(clues)) if (!cluesGiven.has(id)) warn(`indizio ${id} mai assegnato`);
const ev = Object.entries(clues).filter(([, c]) => c.evidence).map(([k]) => k);

/* ---------- report ---------- */
const sceneCount = {};
Object.values(scenes).forEach((s) => (sceneCount[s.chapter] = (sceneCount[s.chapter] || 0) + 1));
console.log('Scene per capitolo:', JSON.stringify(sceneCount));
console.log('Collezionabili:', Object.keys(cols).length, '· Indizi:', Object.keys(clues).length, `(prove: ${ev.length})`, '· Oggetti:', Object.keys(items).length, '· Dialoghi:', Object.keys(dialogues).length, '· Puzzle:', Object.keys(puzzles).length);
console.log('Tetto teorico statistiche (somma di tutti i guadagni):', JSON.stringify(statGains));
if (warns.length) console.log('\nAvvisi (' + warns.length + '):\n  ' + warns.join('\n  '));
if (errors.length) {
  console.log('\nERRORI (' + errors.length + '):\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('\nOK: nessun errore.');
