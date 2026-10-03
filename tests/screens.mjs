// Genera screenshot di tutte le scene, enigmi e pannelli in tests/screens/
// (utile per la revisione visiva e per controllare gli asset sostituiti).
// Uso: node tests/screens.mjs [larghezza altezza]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { ({ chromium } = require(p)); break; } catch (e) {} }
const W = Number(process.argv[2] || 1280), H = Number(process.argv[3] || 720);
const out = join(root, 'tests', 'screens');
mkdirSync(out, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(root, p);
  if (!existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
await new Promise((r) => srv.on('listening', r));
const url = `http://localhost:${srv.address().port}/index.html`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.waitForFunction(() => window.Orfeo && window.Orfeo.ready);
await page.screenshot({ path: join(out, '00_title.png') });
const scenes = await page.evaluate(() => Object.keys(window.Orfeo.Data.scenes.scenes));
await page.evaluate(() => { window.Orfeo.O = window.Orfeo; window.Orfeo.Game.leaveTitle(); window.Orfeo.State.reset(); });
const shots = ['00_title.png'];
for (const id of scenes) {
  await page.evaluate(async (id) => {
    const O = window.Orfeo;
    const sc = O.Data.scenes.scenes[id];
    const st = O.State.d;
    st.chapter = sc.chapter;
    const sp = (sc.spawn && sc.spawn.default) || [960, 900];
    st.chars.beps = { scene: id, x: sp[0], y: sp[1], dir: 1, present: true };
    const kp = O.Movement.clampInto([sp[0] + 170, sp[1] - 20], O.Movement.polygon(sc, 'kiki'));
    st.chars.kiki = { scene: id, x: kp[0], y: kp[1], dir: -1, present: sc.chapter > 1 };
    st.flags.met_kiki = true; st.flags.kiki_named = true;
    await O.Scene.build(sc);
    O.UI.setLocation(sc);
    O.Scene.world.classList.add('reveal');
  }, id);
  await page.waitForTimeout(150);
  const f = `scene_${id}.png`;
  await page.screenshot({ path: join(out, f) });
  shots.push(f);
}
await page.evaluate(() => window.Orfeo.Scene.world.classList.remove('reveal'));
// dialogue box with topics
await page.evaluate(() => {
  const O = window.Orfeo;
  O.UI.dialogueMode(true, 'archivista');
  O.UI.say({ speaker: 'archivista', name: 'Ottavia Ricci', text: 'Non esiste un catalogo O. Esiste un cassetto O, chiuso perché la chiave l\'ho persa nel 1994.', expr: 'skeptical', side: 'right' });
  O.UI.topics([{ id: 'a', label: 'Il catalogo O', icon: 'doc', isNew: true }, { id: 'b', label: "L'alluvione del '66", icon: 'city' }, { id: 'c', label: 'La donna col cappello', icon: 'photo', optional: true }, { id: 'd', label: 'Noi due', icon: 'us', special: true }], { canShow: true, byeLabel: 'Arrivederci' });
});
await page.waitForTimeout(1200);
await page.screenshot({ path: join(out, 'ui_dialogue.png') });
shots.push('ui_dialogue.png');
await page.evaluate(() => { const O = window.Orfeo; O.UI.cancelTopics(); O.UI.dialogueMode(false); O.UI._sayAdv && O.UI._sayAdv(); });
// portraits sheet
await page.evaluate(() => {
  const O = window.Orfeo;
  const ids = ['beps', 'kiki', 'varano', 'archivista', 'helene', 'ilario', 'selim', 'neri', 'bellandi', 'albert', 'sandro', 'tommaso', 'emre', 'agente', 'donna'];
  const html = ids.map((id) => `<div style="display:inline-block;width:120px;margin:4px;text-align:center;font:11px sans-serif;color:#ccc">${O.Art.portrait(id, O.Characters.def(id).look || {}, 'neutral').replace('<svg ', '<svg width="120" height="144" ')}<br>${id}</div>`).join('');
  const ex = O.EXPRESSIONS.map((e) => `<div style="display:inline-block;width:100px;margin:4px;text-align:center;font:11px sans-serif;color:#ccc">${O.Art.portrait('kiki', O.Characters.def('kiki').look, e).replace('<svg ', '<svg width="100" height="120" ')}<br>${e}</div>`).join('');
  const p = O.UI.panel('Ritratti (fallback)', 'generic');
  p.body.innerHTML = html + '<hr>' + ex;
  p.el.style.width = '96vw';
});
await page.screenshot({ path: join(out, 'ui_portraits.png') });
shots.push('ui_portraits.png');
await page.evaluate(() => window.Orfeo.UI.closePanel());
// puzzles
const puzzles = await page.evaluate(() => Object.keys(window.Orfeo.Data.puzzles.puzzles));
for (const id of puzzles) {
  await page.evaluate((id) => { window.Orfeo.Puzzles.start(id); }, id);
  await page.waitForTimeout(300);
  const f = `puzzle_${id}.png`;
  await page.screenshot({ path: join(out, f) });
  shots.push(f);
  await page.evaluate(() => window.Orfeo.Puzzles.close());
}
// panels
for (const [name, fn] of [['journal', 'openJournal'], ['saves', 'saveLoad'], ['options', 'options'], ['archive', 'archive'], ['hints', 'openHints']]) {
  await page.evaluate((fn) => { const O = window.Orfeo; O.State.d.objective = 'o1_catena'; O.State.d.hints['obj:o1_catena'] = 2; O.UI[fn]('load'); }, fn);
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(out, `ui_${name}.png`) });
  shots.push(`ui_${name}.png`);
  await page.evaluate(() => window.Orfeo.UI.closePanel());
}
// inventory open
await page.evaluate(() => { const O = window.Orfeo; ['usb', 'foto1944', 'medaglione', 'scheda_o17', 'mappa', 'chiave_ottone', 'lista17', 'sigillo', 'nastro', 'lanterna'].forEach((i) => O.State.give(i)); O.UI.toggleInventory(true); O.Inventory.select('medaglione'); });
await page.waitForTimeout(400);
await page.screenshot({ path: join(out, 'ui_inventory.png') });
shots.push('ui_inventory.png');
// contact sheet
writeFileSync(join(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Orfeo — screenshot</title><style>body{background:#111;color:#ddd;font:12px sans-serif;margin:0;padding:8px}div{display:inline-block;margin:4px;vertical-align:top}img{width:${Math.round(W / 4)}px;display:block}</style>` + shots.map((s) => `<div><img src="${s}"><span>${s}</span></div>`).join(''));
console.log(`${shots.length} screenshot in tests/screens/ · errori: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 10).join('\n'));
await browser.close();
srv.close();
