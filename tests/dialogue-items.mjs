// Exercise the actual topic menu and item picker, including cancel paths.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]);const p=join(root,name==='/'?'index.html':name);
 if(!p.startsWith(root)||!existsSync(p)||statSync(p).isDirectory()){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(readFileSync(p));
}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const out=join(root,'tests/screens');mkdirSync(out,{recursive:true});
try{
 await page.addInitScript(()=>window.ORFEO_TEST=true);
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{timeout:60000});
 await page.waitForFunction(()=>window.Orfeo?.ready,null,{timeout:60000});
 await page.evaluate(async()=>{
  const O=Orfeo;O.Game.leaveTitle();O.State.reset();
  const sc=O.Data.scenes.scenes.c1_archivio;
  for(const who of ['beps','kiki']){const p=O.Movement.point(sc,who,sc.spawn.default);Object.assign(O.State.d.chars[who],{scene:sc.id,present:who==='beps',x:p[0],y:p[1]});}
  ['promemoria','usb','foto1944'].forEach(id=>O.State.give(id));
  await O.Scene.build(sc);
  // Only accelerate spoken lines; topics and object choices remain real DOM input.
  O.testMode=false;window.__spoken=[];
  const say=O.UI.say.bind(O.UI);O.UI.say=opts=>{window.__spoken.push(opts.text);return say(opts);};
  window.__advance=setInterval(()=>{if(O.UI._sayAdv)O.UI._sayAdv();},30);
  window.__conversation=O.Hotspots.interact(O.Hotspots.targets['npc:archivista'],'talk');
 });
 const show=page.locator('#topics .show-item');
 const picker=page.locator('#modal .panel.pick');
 await show.waitFor({state:'visible'});
 // The archivist must have a decoded illustrated close-up, including expression fallbacks.
 const portrait=page.locator('#say .say-portrait.right svg image');
 await portrait.waitFor({state:'visible'});
 assert.equal(await portrait.getAttribute('href'),'assets/portraits/archivista/sheet.png');
 assert.ok(await page.evaluate(async()=>{
  const O=Orfeo,sp=O.Characters.def('archivista').portraitSheet;
  if(!await O.Assets.image(sp.src))return false;
  return O.EXPRESSIONS.every(expr=>{
   const slot=document.createElement('div');slot.innerHTML=O.UI.portraitHTML('archivista',expr);
   return slot.querySelector('svg')?.getAttribute('viewBox')===sp.rects.neutral.join(' ')&&slot.querySelector('image')?.getAttribute('href')===sp.src;
  });
 }),'all expressions have the illustrated fallback');
 await page.screenshot({path:join(out,'ui_ottavia_dialogue.png')});
 // Closing the picker must return to the topic menu without affecting story state.
 await show.click();await picker.waitFor({state:'visible'});
 await picker.getByRole('button',{name:'Chiudi',exact:true}).click();
 await show.waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>!!Orfeo.State.d.flags.catalogo_ok),false);
 // Choosing the actual promemoria must deliver it to the archivist and unlock O.
 await show.click();await picker.waitFor({state:'visible'});
 const name=await page.evaluate(()=>Orfeo.Inventory.name('promemoria'));
 await picker.getByRole('button',{name,exact:true}).click();
 await page.waitForFunction(()=>Orfeo.State.d.flags.catalogo_ok,null,{timeout:5000});
 await show.waitFor({state:'visible'});
 assert.ok(await page.evaluate(()=>window.__spoken.some(s=>s.includes('Ho appena ritrovato la chiave'))),'archivist must react to selected item');
 // Escape and clicking outside the panel also cancel rather than choose an item.
 await show.click();await picker.waitFor({state:'visible'});await page.keyboard.press('Escape');await show.waitFor({state:'visible'});
 await show.click();await picker.waitFor({state:'visible'});await page.locator('#modal').click({position:{x:5,y:5}});await show.waitFor({state:'visible'});
 // An unrelated object must produce the dialogue fallback instead of silently cancel.
 await show.click();await picker.waitFor({state:'visible'});
 const other=await page.evaluate(()=>Orfeo.Inventory.name('usb'));
 await picker.getByRole('button',{name:other,exact:true}).click();
 await page.waitForFunction(()=>window.__spoken.some(s=>s.includes("non è materiale d'archivio")),null,{timeout:5000});
 await show.waitFor({state:'visible'});
 await page.locator('#topics .bye').click();
 await page.evaluate(async()=>{await window.__conversation;clearInterval(window.__advance);});
 assert.deepEqual(await page.evaluate(()=>({open:Orfeo.Dialogue.open,acting:Orfeo.Hotspots.acting,modal:Orfeo.UI.modalOpen()})),{open:false,acting:false,modal:false});
 await page.evaluate(()=>{Orfeo.Journal.tab='persone';Orfeo.UI.openJournal();});
 assert.equal(await page.locator('#modal svg image[href="assets/portraits/archivista/sheet.png"]').count(),1,'Ottavia illustrated portrait in journal');
 await page.waitForTimeout(300); // Let the journal opening animation finish before visual verification.
 await page.screenshot({path:join(out,'ui_ottavia_journal.png')});
 await page.evaluate(()=>Orfeo.UI.closePanel());
 assert.deepEqual(errors,[]);
 console.log('OK: real archivist item selection unlocks catalog; unrelated item reacts; close, Escape and backdrop cancel; dialogue closes normally.');
}catch(e){console.error('Browser diagnostics:',JSON.stringify(errors));console.error(await page.evaluate(()=>({catalog:!!window.Orfeo?.State.d.flags.catalogo_ok,spoken:window.__spoken,picker:document.querySelector('#modal')?.className})));throw e;}finally{await browser.close();server.close();}
