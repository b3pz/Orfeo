// Test end-to-end: gioca l'intera avventura in Chromium headless (Playwright),
// usando le stesse funzioni d'interazione del giocatore (hotspot, oggetti,
// dialoghi a temi, enigmi risolti tramite i loro input), e verifica:
//  - nessun errore in console, nessun dead-end (ogni passo deve riuscire)
//  - FULL: tutti i collezionabili, finale perfetto, tutti e 4 i finali disponibili e giocabili
//  - MINIMAL: solo passi obbligatori, scelte fredde: solo «Cenere» disponibile
//  - save/load: salvataggio su slot, ricarica pagina, caricamento, stato identico
//  - mobile: viewport da telefono, il gioco si avvia e risponde al tocco
// Uso: node tests/playthrough.mjs [full|minimal|save|mobile|all]
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FULL, MINIMAL } from './walkthrough.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', '@playwright/test']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('Playwright non trovato. Installa con: npm i -D playwright');
}
const { chromium } = loadPlaywright();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
function serve() {
  return new Promise((resolve) => {
    const srv = createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = join(root, p);
      if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
      res.end(readFileSync(f));
    });
    srv.listen(0, () => resolve(srv));
  });
}

let failures = 0;
const log = (...a) => console.log(...a);
const fail = (m) => { failures++; console.log('  ✗ ' + m); };
const ok = (m) => console.log('  ✓ ' + m);

async function newPage(browser, url, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 720 } }, opts.context || {}));
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
  if (opts.test !== false) await page.addInitScript(() => { window.ORFEO_TEST = true; });
  await page.goto(url);
  await page.waitForFunction(() => window.Orfeo && window.Orfeo.ready, null, { timeout: 15000 });
  if (opts.test !== false) await installHooks(page);
  return { page, ctx, errors };
}

async function installHooks(page) {
  await page.evaluate(() => {
    const O = window.Orfeo;
    window.__plan = { topics: [], choices: [], item: null, missing: [], log: [], ending: null, no18: false };
    O.testTopic = (menu) => {
      const q = window.__plan.topics;
      while (q.length) {
        const h = q.shift();
        if (h && typeof h === 'object') { window.__plan.item = h.item; return '__item'; }
        if (menu.find((m) => m.id === h)) return h;
        window.__plan.missing.push('tema «' + h + '» non disponibile (menu: ' + menu.map((m) => m.id).join(',') + ')');
      }
      return '__bye';
    };
    O.testItem = () => { const i = window.__plan.item; window.__plan.item = null; return i; };
    O.testChoice = (opts) => {
      const q = window.__plan.choices;
      for (let k = 0; k < q.length; k++) {
        const idx = opts.findIndex((o) => o.label.includes(q[k]));
        if (idx >= 0) { q.splice(k, 1); return idx; }
      }
      window.__plan.log.push('scelta di default: ' + opts[0].label);
      return 0;
    };
    O.testPuzzle = (id, inst) => { window.__plan.log.push('puzzle ' + id); inst.auto(window.__plan.no18 ? 'no18' : undefined); };
    O.testEnding = (opts) => {
      const want = window.__plan.ending;
      const o = opts.find((x) => x.id === want && !x.locked) || opts.find((x) => !x.locked);
      return o.id;
    };
  });
}

async function startNewGame(page) {
  await page.evaluate(() => window.Orfeo.Game.newGame());
  await page.evaluate(() => window.Orfeo.test.idle());
}

async function runSteps(page, steps, label, onCheckpoint) {
  let i = 0;
  const statsByChapter = {};
  for (const step of steps) {
    i++;
    const [kind, a, b, opts] = step;
    const plan = kind === 'use' ? opts || {} : kind === 'item' ? opts || {} : kind === 'combine' ? opts || {} : kind === 'examine' ? b || {} : {};
    await page.evaluate((p) => { window.__plan.topics = (p.topics || []).slice(); window.__plan.choices = (p.choices || []).slice(); window.__plan.missing = []; }, plan);
    const desc = `${label} #${i} ${JSON.stringify(step).slice(0, 120)}`;
    try {
      const res = await page.evaluate(async ([kind, a, b]) => {
        const O = window.Orfeo;
        switch (kind) {
          case 'use': await O.test.use(a, b || undefined); break;
          case 'item': await O.test.use(a, 'item', b); break;
          case 'combine': await O.test.combine(a, b); break;
          case 'examine': await O.Inventory.examine(a); await O.test.idle(); break;
          case 'switch': await O.test.switchTo(a); break;
          case 'expect': if (!O.cond(a)) return 'condizione falsa: ' + a + ' · scena ' + O.test.scene(); break;
          case 'scene': if (O.test.scene() !== a) return 'scena attesa ' + a + ', trovata ' + O.test.scene(); break;
          case 'checkpoint': return 'CHECKPOINT';
        }
        return null;
      }, [kind, a, b && typeof b === 'object' ? null : b]);
      if (res === 'CHECKPOINT') { if (onCheckpoint) await onCheckpoint(a); continue; }
      if (res) { fail(desc + ' → ' + res); return { ok: false, statsByChapter }; }
      const missing = await page.evaluate(() => window.__plan.missing);
      if (missing.length) { fail(desc + ' → ' + missing.join('; ')); return { ok: false, statsByChapter }; }
      const left = await page.evaluate(() => window.__plan.choices.concat(window.__plan.topics.map(String)));
      if (left.length) log(`    (nota) ${desc}: non usati ${JSON.stringify(left)}`);
    } catch (e) {
      fail(desc + ' → eccezione: ' + e.message.split('\n')[0]);
      return { ok: false, statsByChapter };
    }
    const ch = await page.evaluate(() => [window.Orfeo.State.d.chapter, Object.assign({}, window.Orfeo.State.d.stats)]);
    statsByChapter[ch[0]] = ch[1];
  }
  return { ok: true, statsByChapter };
}

async function testFull(browser, url) {
  log('\n▶ FULL — partita completa, tutti i collezionabili, finale segreto');
  const { page, errors } = await newPage(browser, url);
  await startNewGame(page);
  let snapshot = null;
  const r = await runSteps(page, FULL, 'FULL', async (name) => {
    snapshot = await page.evaluate(() => window.Orfeo.State.snapshot());
    const rep = await page.evaluate(() => window.Orfeo.Endings.report());
    log('    disponibilità finali al checkpoint:', JSON.stringify(rep));
    for (const id of ['luce', 'custodi', 'cenere', 'segreto']) rep[id] ? ok(`finale ${id} disponibile`) : fail(`finale ${id} NON disponibile nella partita completa`);
  });
  log('    statistiche per capitolo:', JSON.stringify(r.statsByChapter));
  if (!r.ok) return page.context().close();
  // final choice via UI path (segreto)
  const counts = await page.evaluate(() => ({ cols: window.Orfeo.Collectibles.count('collectibles'), sym: window.Orfeo.Collectibles.count('symbols'), ev: window.Orfeo.Collectibles.count('evidence') }));
  counts.cols === 43 ? ok('43/43 collezionabili') : fail('collezionabili raccolti: ' + counts.cols);
  log(`    simboli ${counts.sym}/7 · prove ${counts.ev}`);
  // play each ending from the checkpoint
  for (const id of ['luce', 'custodi', 'cenere', 'segreto']) {
    const res = await page.evaluate(async ([snap, id]) => {
      const O = window.Orfeo;
      O.State.load(JSON.parse(JSON.stringify(snap)));
      O.testLog = [];
      window.__plan.ending = id;
      window.__plan.topics = ['noi'];
      await O.test.use('npc:varano7', 'talk');
      return { ending: O.State.d.ending, profile: !!O.State.profile.endings[id], log: O.testLog.filter((l) => l.startsWith('EPILOGUE')) };
    }, [snapshot, id]);
    res.ending === id && res.profile ? ok(`finale ${id} giocato · ${res.log.join(' | ')}`) : fail(`finale ${id}: ${JSON.stringify(res)}`);
  }
  // variants: epilogue depends on relationship
  const variant = await page.evaluate(async (snap) => {
    const O = window.Orfeo;
    const s = JSON.parse(JSON.stringify(snap));
    s.stats.legame = 2;
    O.State.load(s);
    O.testLog = [];
    await O.Endings.play('cenere');
    return O.testLog.filter((l) => l.startsWith('EPILOGUE'));
  }, snapshot);
  variant.join().includes('cenere_soli') ? ok('Cenere con legame basso → epilogo «cenere_soli»') : fail('variante epilogo Cenere: ' + variant);
  // locked endings with low stats
  const locked = await page.evaluate((snap) => {
    const O = window.Orfeo;
    const s = JSON.parse(JSON.stringify(snap));
    s.stats = { fiducia: 3, legame: 3, conoscenza: 5 };
    s.flags.final_perfect = false;
    O.State.load(s);
    return O.Endings.report();
  }, snapshot);
  !locked.luce && !locked.custodi && !locked.segreto && locked.cenere ? ok('con statistiche basse solo Cenere è disponibile') : fail('requisiti finali: ' + JSON.stringify(locked));
  errors.length ? fail('errori console: ' + errors.slice(0, 5).join(' | ')) : ok('nessun errore in console');
  const plan = await page.evaluate(() => window.__plan.log.filter((l) => l.startsWith('scelta di default')));
  if (plan.length) log('    scelte di default:', plan.length);
  await page.context().close();
}

async function testMinimal(browser, url) {
  log('\n▶ MINIMAL — solo passi obbligatori, scelte fredde');
  const { page, errors } = await newPage(browser, url);
  await startNewGame(page);
  const r = await runSteps(page, MINIMAL, 'MIN', async () => {
    const rep = await page.evaluate(() => window.Orfeo.Endings.report());
    log('    disponibilità finali:', JSON.stringify(rep), JSON.stringify(await page.evaluate(() => window.Orfeo.State.d.stats)), 'prove', await page.evaluate(() => window.Orfeo.Collectibles.count('evidence')));
    rep.cenere && !rep.luce && !rep.custodi && !rep.segreto ? ok('solo Cenere disponibile') : fail('MINIMAL: finali disponibili ' + JSON.stringify(rep));
    await page.evaluate(() => (window.__plan.ending = 'cenere'));
  });
  log('    statistiche per capitolo:', JSON.stringify(r.statsByChapter));
  if (r.ok) {
    const end = await page.evaluate(() => window.Orfeo.State.d.ending);
    end === 'cenere' ? ok('partita minima completata con il finale Cenere') : fail('finale minimo: ' + end);
  }
  errors.length ? fail('errori console: ' + errors.slice(0, 5).join(' | ')) : ok('nessun errore in console');
  await page.context().close();
}

async function testSave(browser, url) {
  log('\n▶ SAVE/LOAD — slot manuale, ricarica pagina, migrazione');
  const { page, ctx, errors } = await newPage(browser, url);
  await startNewGame(page);
  await runSteps(page, FULL.slice(0, 30), 'SAVE');
  const before = await page.evaluate(async () => {
    const O = window.Orfeo;
    await O.Save.save('3');
    return { scene: O.test.scene(), inv: O.State.d.inventory.slice(), flags: Object.keys(O.State.d.flags).length, chapter: O.State.d.chapter };
  });
  await page.reload();
  await page.waitForFunction(() => window.Orfeo && window.Orfeo.ready);
  await installHooks(page);
  const slots = await page.evaluate(() => window.Orfeo.Save.list().filter((s) => !s.empty).map((s) => s.slot));
  slots.includes('3') && slots.includes('auto') ? ok('slot 3 e autosave presenti dopo il reload: ' + slots.join(',')) : fail('slot dopo reload: ' + slots);
  const after = await page.evaluate(async () => {
    const O = window.Orfeo;
    await O.Game.loadSlot('3');
    await O.test.idle();
    return { scene: O.test.scene(), inv: O.State.d.inventory.slice(), flags: Object.keys(O.State.d.flags).length, chapter: O.State.d.chapter };
  });
  JSON.stringify(before) === JSON.stringify(after) ? ok('stato identico dopo il caricamento (' + after.scene + ')') : fail('stato diverso: ' + JSON.stringify(before) + ' vs ' + JSON.stringify(after));
  // continue playing after load
  const r = await runSteps(page, FULL.slice(30, 40), 'SAVE-cont');
  r.ok ? ok('la partita prosegue dopo il caricamento') : fail('impossibile proseguire dopo il caricamento');
  // continue (latest) + delete
  const cont = await page.evaluate(async () => {
    const O = window.Orfeo;
    O.Game.toTitle();
    await O.Game.continueGame();
    await O.test.idle();
    O.Save.remove('3');
    return { scene: O.test.scene(), slots: O.Save.list().filter((s) => !s.empty).map((s) => s.slot) };
  });
  !cont.slots.includes('3') ? ok('Continua funziona, slot eliminato') : fail('delete slot: ' + JSON.stringify(cont));
  // migration from an old v1 save
  const mig = await page.evaluate(async () => {
    const O = window.Orfeo;
    localStorage.setItem('orfeo.save.5', JSON.stringify({ meta: { ts: 1, chapter: 1, sceneName: 'vecchio' }, state: { version: 1, chapter: 1, inventory: [{ id: 'usb' }, { id: 'photo' }], flags: { desk: true }, scene: 'c1_studio' } }));
    await O.Game.loadSlot('5');
    await O.test.idle();
    return { v: O.State.d.version, inv: O.State.d.inventory, scene: O.test.scene() };
  });
  mig.v === 3 && mig.inv.includes('foto1944') && mig.scene === 'c1_studio' ? ok('migrazione v1 → v3 riuscita') : fail('migrazione: ' + JSON.stringify(mig));
  errors.length ? fail('errori console: ' + errors.slice(0, 5).join(' | ')) : ok('nessun errore in console');
  await ctx.close();
}

async function testMobile(browser, url) {
  log('\n▶ MOBILE — iPhone-size, touch, senza modalità test');
  const { page, ctx, errors } = await newPage(browser, url, { test: false, context: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } });
  await page.tap('#btn-new');
  // skip intro cutscene
  for (let k = 0; k < 6; k++) {
    await page.waitForTimeout(400);
    const skip = await page.$('#cutscene.on .cs-skip');
    if (skip) await skip.tap().catch(() => {});
  }
  await page.waitForTimeout(5200);
  // advance speech by tapping
  for (let k = 0; k < 6; k++) { await page.tap('#say').catch(() => {}); await page.waitForTimeout(250); }
  const st = await page.evaluate(() => ({ scene: window.Orfeo.test.scene(), say: !document.querySelector('#say').classList.contains('hidden') }));
  st.scene === 'c1_studio' ? ok('avvio su mobile, scena ' + st.scene) : fail('mobile: ' + JSON.stringify(st));
  // tap on the computer hotspot
  const box = await page.$eval('.hotspot[data-id="computer"]', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.touchscreen.tap(box.x, box.y);
  await page.waitForTimeout(2500);
  const talking = await page.evaluate(() => window.Orfeo.Script.running);
  talking ? ok('il tocco su un hotspot avvia l\'interazione') : fail('tocco sull\'hotspot senza effetto');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  !overflow ? ok('nessuno scroll orizzontale') : fail('scroll orizzontale su mobile');
  await page.screenshot({ path: join(root, 'tests', 'mobile.png') });
  errors.length ? fail('errori console: ' + errors.slice(0, 5).join(' | ')) : ok('nessun errore in console');
  await ctx.close();
}

const which = process.argv[2] || 'all';
const srv = await serve();
const url = `http://localhost:${srv.address().port}/index.html`;
const browser = await chromium.launch();
try {
  if (which === 'all' || which === 'full') await testFull(browser, url);
  if (which === 'all' || which === 'minimal') await testMinimal(browser, url);
  if (which === 'all' || which === 'save') await testSave(browser, url);
  if (which === 'all' || which === 'mobile') await testMobile(browser, url);
} finally {
  await browser.close();
  srv.close();
}
log(failures ? `\n✗ ${failures} problemi` : '\n✓ tutti i test superati');
process.exit(failures ? 1 : 0);
