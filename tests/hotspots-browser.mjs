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
 await page.locator('#loading').waitFor({state:'hidden'});
 const audits=[];
 for(const viewport of [{width:1280,height:720},{width:375,height:812}]){
  await page.setViewportSize(viewport);
  audits.push(await page.evaluate(async()=>{
   const O=Orfeo;O.UI.resize();O.Game.leaveTitle();O.State.reset();
   const failures=[],seen=new Set(),coverage=new Set();let states=0,clicks=0,paths=0;
   const original=O.Hotspots.interact;let clicked=null;
   O.Hotspots.interact=(t)=>{clicked=t.id;};
   try{
    for(const sc of Object.values(O.Data.scenes.scenes)){
     // Only visibility, floor and obstacle conditions affect this audit.
     const conditions=[...(sc.hotspots||[]).map(h=>h.if),...(sc.npcs||[]).map(h=>h.if),...(sc.walkIf||[]).map(h=>h.if),...(sc.obstacles||[]).map(h=>h.if)].filter(Boolean).join(' ');
     const vars=[...new Set(conditions.match(/(?:flag|puzzle|item)\.[a-zA-Z0-9_]+/g)||[])];
     if(vars.length>10)throw Error('Too many conditional variables '+sc.id);
     for(let mask=0;mask<(1<<vars.length);mask++)for(const who of ['beps','kiki']){
      O.Movement.stopAll();O.State.reset();const st=O.State.d;
      st.chapter=sc.chapter;st.together=true;st.active=who;st.flags.met_kiki=true;st.flags.kiki_named=true;
      vars.forEach((v,i)=>{const [kind,id]=v.split('.'),on=!!(mask&(1<<i));if(kind==='flag')st.flags[id]=on;else if(kind==='puzzle')st.puzzles[id]={solved:on,errors:0};else if(on)st.inventory.push(id);});
      for(const id of ['beps','kiki']){const p=O.Movement.point(sc,id,sc.spawn.default);Object.assign(st.chars[id],{scene:sc.id,x:p[0],y:p[1],present:true});}
      const signature=sc.id+'/'+who+'/'+JSON.stringify([ (sc.hotspots||[]).filter(h=>O.cond(h.if)).map(h=>h.id),(sc.npcs||[]).filter(h=>O.cond(h.if)).map(h=>h.id),O.Movement.polygon(sc,who),O.Movement.obstacles(sc,who)]);
      if(seen.has(signature))continue;seen.add(signature);
      await O.Scene.build(sc);states++;
      for(const t of Object.values(O.Hotspots.targets)){
       coverage.add(sc.id+'/'+t.id);
       const el=t.kind==='hotspot'?O.Scene.hotLayer.querySelector(`[data-id="${t.id}"]`):O.Scene.actorLayer.querySelector(`[data-target="${t.id}"]`);
       if(!el){failures.push({scene:sc.id,who,mask,target:t.id,error:'missing element'});continue;}
       const rect=el.getBoundingClientRect();let point=null,cover=new Set();
       for(const fy of [.5,.25,.75,.1,.9])for(const fx of [.5,.25,.75,.1,.9]){
        const x=rect.left+rect.width*fx,y=rect.top+rect.height*fy;
        if(x<0||x>=innerWidth||y<0||y>=innerHeight)continue;
        const hit=document.elementFromPoint(x,y),found=hit&&O.Hotspots.targetFromEvent({target:hit});
        if(found?.id===t.id&&!point)point={x,y};else if(hit)cover.add(found?.id||hit.id||hit.className?.baseVal||hit.className||hit.tagName);
       }
       if(!point){failures.push({scene:sc.id,who,mask,target:t.id,error:'covered',cover:[...cover]});continue;}
       clicked=null;
       document.elementFromPoint(point.x,point.y).dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:point.x,clientY:point.y}));
       if(clicked!==t.id)failures.push({scene:sc.id,who,mask,target:t.id,error:'click lost',clicked});else clicks++;
       const me=O.State.character(),start=[me.x,me.y],goal=O.Hotspots.standPoint(t);
       const path=O.Movement.findPath(start,goal,O.Movement.polygon(sc,who),O.Movement.obstacles(sc,who));
       if(!path.length)failures.push({scene:sc.id,who,mask,target:t.id,error:'unreachable',start,goal});else paths++;
      }
     }
    }
   }finally{O.Hotspots.interact=original;}
   const missing=Object.values(O.Data.scenes.scenes).flatMap(sc=>(sc.hotspots||[]).filter(h=>!coverage.has(sc.id+'/'+h.id)).map(h=>sc.id+'/'+h.id));
   return {viewport:[innerWidth,innerHeight],states,clicks,paths,targets:coverage.size,missing,failures};
  }));
  // Native click/tap regression: Kiki must actually walk to the switch in
  // blackout. Keep real movement; accelerate dialogue only after arrival.
  await page.evaluate(async()=>{
   const O=Orfeo;O.State.reset();const st=O.State.d,sc=O.Scene.get('c1_corridoio');
   st.active='kiki';st.together=true;st.flags.met_kiki=true;st.flags.kiki_named=true;st.flags.blackout=true;st.flags.ripiano_aperto=true;
   for(const id of ['beps','kiki']){const p=O.Movement.point(sc,id,[id==='kiki'?1600:1400,900]);Object.assign(st.chars[id],{scene:sc.id,x:p[0],y:p[1],present:true});}
   await O.Scene.build(sc);O.testMode=false;
   O.on('interact',()=>{O.testMode=true;});
  });
  const control=page.locator('.hotspot[data-id="quadro"]');
  const r=await control.boundingBox();
  assert.ok(r,'electrical switch is rendered');
  await page.mouse.click(r.x+r.width/2,r.y+r.height/2);
  await page.waitForFunction(()=>!Orfeo.State.d.flags.blackout,null,{timeout:30000});
  await page.waitForFunction(()=>!Orfeo.Script.running&&!Orfeo.Hotspots.acting);
  assert.equal(await page.evaluate(()=>Orfeo.State.d.flags.deposito_done),true);
  assert.equal(await page.locator('.hotspot[data-id="buio"]').count(),0);
  assert.equal(await page.locator('.hotspot[data-id="microcassetta"]').count(),1);
  console.log('OK: native click restores light with real Kiki movement at '+viewport.width+'x'+viewport.height);
 }
 console.log(JSON.stringify(audits.map(a=>({...a,failures:a.failures.slice(0,10),failureCount:a.failures.length})),null,2));
 assert.ok(audits.every(a=>!a.failures.length&&!a.missing.length),'Some targets cannot receive clicks/reach their standing point');
 assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
