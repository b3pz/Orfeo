// Browser regression for real animation, rapid click/dblclick, pickup and fade races.
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
 const result=await page.evaluate(async()=>{
  const O=Orfeo;O.Game.leaveTitle();O.State.reset();O.testMode=false;
  let checked=0,clicks=0,seed=7319;
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const check=(only)=>{
   for(const id of only?[only]:['beps','kiki']){
    const c=O.State.d.chars[id],a=O.Characters.actors[id];
    if(!c.present||c.scene!==O.Scene.current.id)continue;
    if(!Number.isFinite(c.x)||!Number.isFinite(c.y))throw Error('Invalid coordinates '+O.Scene.current.id+'/'+id);
    if(!O.Movement.walkable([c.x,c.y],O.Movement.polygon(O.Scene.current,id),O.Movement.obstacles(O.Scene.current,id)))throw Error('Outside floor '+O.Scene.current.id+'/'+id);
    if(!a||!a.el.isConnected)throw Error('Missing protagonist '+id);
    const r=a.el.getBoundingClientRect();
    if(!Number.isFinite(r.x)||r.width<=0||r.height<=0)throw Error('Invisible protagonist '+id);
    if(!a.inner.firstElementChild)throw Error('Missing sprite '+id);
   }
   checked++;
  };
  const update=O.Characters.update.bind(O.Characters);
  O.Characters.update=id=>{update(id);if(id==='beps'||id==='kiki')check(id);};
  const click=(p,type='click',target=O.Scene.world)=>{
   const r=O.Scene.world.getBoundingClientRect();
   target.dispatchEvent(new MouseEvent(type,{bubbles:true,clientX:r.left+p[0]*r.width/1920,clientY:r.top+p[1]*r.height/1080,detail:type==='dblclick'?2:1}));clicks++;
  };
  let scenes=0;
  for(const sc of Object.values(O.Data.scenes.scenes)){
   O.Movement.stopAll();O.State.reset();const st=O.State.d;
   st.chapter=sc.chapter;st.together=true;st.flags.met_kiki=true;st.flags.kiki_named=true;
   for(const id of ['beps','kiki']){const p=O.Movement.point(sc,id,sc.spawn.default);st.chars[id]={scene:sc.id,x:p[0],y:p[1],dir:1,present:true};}
   // Suppress checks only until both actor elements have been rebuilt.
   O.Characters.update=update;await O.Scene.build(sc);
   O.Characters.update=id=>{update(id);if(id==='beps'||id==='kiki')check(id);};check();
   for(let i=0;i<12;i++){
    const p=[random()*1920,random()*1080];click(p);click(p);click(p,'dblclick');
    await pause(20);check();
   }
   O.Movement.stopAll();
   if(sc.switch!==false){await O.Scene.switchTo('kiki');check();}
   const c=O.State.character();
   const arrived=await Promise.race([O.Movement.walkTo(st.active,[c.x,c.y],{run:true}),pause(2000).then(()=>{throw Error('Same-point run hangs');})]);
   if(!arrived)throw Error('Same-point run cancelled');check();scenes++;
  }
  // Actual pickup animation: extra click/dblclick and run requests must be ignored.
  O.Characters.update=update;O.State.reset();const sc=O.Data.scenes.scenes.c1_studio;
  const st=O.State.d;st.together=true;
  for(const id of ['beps','kiki']){const p=O.Movement.point(sc,id,sc.spawn.default);st.chars[id]={scene:sc.id,x:p[0],y:p[1],dir:1,present:true};}
  await O.Scene.build(sc);O.Characters.update=id=>{update(id);if(id==='beps'||id==='kiki')check(id);};
  const col=O.Collectibles.all().find(c=>!c.after);
  const c=O.State.character(),target={id:'stress-pickup',kind:'hotspot',rect:[c.x-20,c.y-20,40,20],at:[c.x,c.y],col:col.id};
  let pickups=0;const doUse=O.Hotspots.doUse.bind(O.Hotspots);
  O.Hotspots.doUse=async(...args)=>{pickups++;return doUse(...args);};
  const action=O.Hotspots.interact(target,'use');await pause(60);
  if(!O.Hotspots.acting)throw Error('Pickup not locked');
  for(let i=0;i<30;i++){O.Hotspots.interact(target,'use',null,true);click([1500,980],'dblclick');await pause(5);check();}
  await pause(500);O.UI.closePanel();await action;
  if(pickups!==1||O.Hotspots.acting)throw Error('Duplicate pickup/stuck interaction');
  O.Hotspots.doUse=doUse;check();
  // During the fade, another exit and a protagonist switch cannot rebuild the world.
  const to=O.Data.scenes.scenes.c4_corridoio;st.flags['entered_'+to.id]=true;
  const transition=O.Scene.go(to.id);
  if(!O.Scene.busy)throw Error('Transition not locked');
  if(await O.Scene.go('c1_lungarno')!==false)throw Error('Concurrent transition admitted');
  if(await O.Scene.switchTo('kiki')!==false)throw Error('Switch during transition admitted');
  for(let i=0;i<15;i++){click([800,900],'dblclick');await pause(20);}
  await transition;check();
  if(O.Scene.current.id!==to.id||O.Scene.busy)throw Error('Wrong/stuck scene after transition');
  return {scenes,clicks,checked,pickups};
 });
 assert.deepEqual(errors,[]);
 console.log('OK: real browser animation and rapid inputs '+JSON.stringify(result)+'; no browser errors.');
}catch(e){console.error('Browser diagnostics:',JSON.stringify(errors));throw e;}finally{await browser.close();server.close();}
