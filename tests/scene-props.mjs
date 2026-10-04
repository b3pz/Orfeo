// Exercise scene art transitions, weather, and uploaded diary controls on desktop and mobile.
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
 await page.locator('#loading').waitFor({state:'hidden'});
 await page.evaluate(()=>{Orfeo.Game.leaveTitle();Orfeo.State.reset();});
 async function scene(id){await page.evaluate(async id=>{
  const O=Orfeo,sc=O.Scene.get(id),sp=sc.spawn.default;
  Object.assign(O.State.d.chars.beps,{scene:id,present:true,x:sp[0],y:sp[1]});
  O.State.d.chars.kiki.present=false;
  await O.Scene.build(sc);O.UI.setLocation(sc);
 },id);}
 async function shot(name){await page.evaluate(async()=>{await Promise.all(Array.from(document.querySelectorAll('#world img')).map(img=>img.decode().catch(()=>{})));});await page.waitForTimeout(150);await page.screenshot({path:join(out,name)});}
 await scene('c1_cantiere');
 assert.equal(await page.locator('.bg-state').count(),0,'cloth visible before coffee');
 assert.equal(await page.locator('#bg-layer > img:not(.bg-state)').getAttribute('src'),'assets/backgrounds/c1_cantiere_coperto.png');
 await shot('props_cantiere_chiuso.png');
 // Exercise both authored routes: dialogue topic and giving the coffee.
 for(const route of ['topic','item']){
  await page.evaluate(async route=>{
   const O=Orfeo;O.State.clearFlag('sandro_ok');O.State.clearFlag('sandro_caffe');O.State.give('caffe');O.Scene.refresh();
   const d=O.Data.dialogues.dialogues.sandro;
   await O.Script.run(route==='topic'?d.topics.find(t=>t.id==='caffe_dato').do:d.items.caffe);
  },route);
  assert.equal(await page.locator('.bg-state').getAttribute('src'),'assets/backgrounds/c1_cantiere_aperto.png');
  assert.ok(await page.locator('.bg-state').evaluate(el=>el.complete&&el.naturalWidth>0));
  assert.ok(await page.locator('.bg-state').evaluate(el=>!el.style.clipPath),'matching full scene variants avoid a visible rectangular seam');
  assert.equal(await page.evaluate(()=>!!Orfeo.Hotspots.targets.telo),false);
 }
 await shot('props_cantiere_aperto.png');
 await scene('c1_studio');await scene('c1_cantiere');
 assert.equal(await page.locator('.bg-state').count(),1,'returning preserves opened breach');
 await page.evaluate(async()=>{const O=Orfeo,data=JSON.stringify(O.State.d);O.State.reset();O.State.d=JSON.parse(data);await O.Scene.build(O.Scene.get('c1_cantiere'));});
 assert.equal(await page.locator('.bg-state').count(),1,'restored state preserves opened breach');
 await scene('c1_corridoio');
 const extinguisher=page.locator('#prop-layer img[src="assets/items/scene/c1_corridoio_estintore.png"]');
 assert.equal(await extinguisher.count(),1);await shot('props_estintore.png');
 await page.evaluate(()=>{Orfeo.State.setFlag('blackout',true);Orfeo.Scene.refresh();});
 assert.equal(await extinguisher.count(),0,'darkness respects prop visibility');
 await page.evaluate(()=>{Orfeo.State.clearFlag('blackout');Orfeo.State.setFlag('ripiano_aperto',true);Orfeo.Scene.refresh();});
 assert.equal(await extinguisher.count(),1);
 assert.equal(await page.locator('#prop-layer img[src="assets/items/nastro.png"]').count(),1);
 await page.evaluate(()=>{Orfeo.State.d.collectibles.rec_01=true;Orfeo.Scene.refresh();});
 assert.equal(await page.locator('#prop-layer img[src="assets/items/nastro.png"]').count(),0,'collected recording disappears');
 await scene('c1_studio');
 assert.equal(await page.locator('#prop-layer img[src="assets/items/scene/c1_studio_foto_nonno.png"]').count(),1);await shot('props_foto_nonno.png');
 await scene('c1_archivio');
 assert.equal(await page.locator('#prop-layer img[src="assets/collectibles/photo_02.jpg"]').count(),1);await shot('props_foto_alluvione.png');
 // The uploaded atlas is the actual book surface, with usable object controls.
 await page.evaluate(()=>{const O=Orfeo;Object.keys(O.Data.items.items).forEach(id=>O.State.give(id));O.Inventory.render();O.UI.toggleInventory(true);});
 assert.equal(await page.locator('#inv-panel .book-art image').getAttribute('href'),'assets/interface/orfeo-ui-sheet.png');
 assert.equal(await page.locator('#inv-slots .inv-item').count(),28);
 await shot('props_inventario_diario.png');
 await page.evaluate(()=>{Orfeo.UI.toggleInventory(false);Orfeo.UI.openJournal();});
 assert.equal(await page.locator('.journal .book-art image').getAttribute('href'),'assets/interface/orfeo-ui-sheet.png');
 await shot('props_taccuino_diario.png');
 await page.evaluate(()=>Orfeo.UI.closePanel());
 for(const id of ['c1_studio','c1_archivio','c1_corridoio','c1_caffe','c4_studio','c4_corridoio','c6_atelier','c6_ufficio']){
  await scene(id);
  assert.ok(await page.locator('.fx-window').count(),id+' must show indoor weather');
  assert.ok(await page.locator('.fx-window').evaluateAll(els=>els.every(el=>el.style.overflow==='hidden'&&el.style.width.endsWith('px')&&el.querySelectorAll('i').length>0)));
 }
 await scene('c1_studio');await shot('props_pioggia_finestra.png');
 await page.evaluate(()=>{Orfeo.testMode=false;Orfeo.UI.showCollectible(Orfeo.Collectibles.get('sym_1'));});
 assert.equal(await page.locator('.col-symbol svg[aria-label="Lira di Orfeo"]').count(),1);
 assert.equal(await page.locator('.col-symbol').textContent(),'');
 await shot('props_lira.png');await page.evaluate(()=>Orfeo.UI.closePanel());
 // Decode every explicitly assigned scene prop; no missing raster silently hidden.
 const audit=await page.evaluate(async()=>{
  const O=Orfeo,rows=[];
  for(const sc of Object.values(O.Data.scenes.scenes))for(const h of sc.hotspots||[])if(h.propImg){
   rows.push({scene:sc.id,hotspot:h.id,path:h.propImg,loaded:!!await O.Assets.image(h.propImg)});
  }
  return rows;
 });
 assert.ok(audit.every(row=>row.loaded),JSON.stringify(audit.filter(row=>!row.loaded)));
 // On a phone every object remains reachable and selecting one closes the book.
 await page.setViewportSize({width:375,height:812});
 await page.evaluate(()=>{Orfeo.testMode=true;Orfeo.Inventory.deselect();Orfeo.UI.toggleInventory(true);});
 const last=page.locator('#inv-slots .inv-item[data-id="registro"]');
 await last.scrollIntoViewIfNeeded();await shot('props_inventario_mobile.png');
 await last.click();
 assert.equal(await page.evaluate(()=>Orfeo.Inventory.selected),'registro');
 assert.equal(await page.locator('#inventory').evaluate(el=>el.classList.contains('open')),false);
 await page.evaluate(()=>{Orfeo.Inventory.deselect();Orfeo.UI.openJournal();});
 assert.equal(await page.locator('#inventory').evaluate(el=>el.classList.contains('open')),false);
 const tabNames=await page.locator('.journal .j-tabs button').allTextContents();
 for(const label of tabNames){await page.locator('.journal .j-tabs button').getByText(label,{exact:true}).click();assert.ok(await page.locator('.journal .j-body').textContent());}
 await page.locator('.journal .j-tabs button').getByText('Obiettivi',{exact:true}).click();
 await page.waitForTimeout(300);await shot('props_taccuino_mobile.png');
 assert.ok(await page.locator('.journal').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;}),'mobile journal remains inside viewport');
 await page.getByRole('button',{name:'Chiudi',exact:true}).click();
 assert.deepEqual(errors,[]);
 console.log(`OK: both coffee routes, returning/restored breach, extinguisher and blackout, collected recording, two photos; ${audit.length} scene images decoded.`);
}finally{await browser.close();server.close();}
