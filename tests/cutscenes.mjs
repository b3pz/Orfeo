// Real cutscene playback: images, captions, advancing and one-click skip.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
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
const out=join(root,'tests/cutscenes');mkdirSync(out,{recursive:true});
try{
 await page.addInitScript(()=>window.ORFEO_TEST=true);
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{timeout:60000});
 await page.waitForFunction(()=>window.Orfeo?.ready,null,{timeout:60000});
 await page.evaluate(async()=>{const O=Orfeo;O.Game.leaveTitle();O.State.reset();await O.Scene.build(O.Data.scenes.scenes.c1_studio);O.testMode=false;});
 // Skip during typing must not need a second click or the shot's timeout.
 await page.evaluate(()=>{
  const O=Orfeo;const shot=O.Data.cutscenes.cutscenes.intro.shots[1];
  window.__oldWait=shot.wait;shot.wait=true;
  window.__playing=O.Cutscene.play('intro');O.Cutscene._next();
 });
 await page.waitForFunction(()=>Orfeo.UI.typing&&!!Orfeo.Cutscene._next);
 await page.locator('#cutscene .cs-skip').click();
 await page.waitForFunction(()=>!Orfeo.Cutscene.playing,null,{timeout:1500});
 await page.evaluate(async()=>{await window.__playing;Orfeo.Data.cutscenes.cutscenes.intro.shots[1].wait=window.__oldWait;});
 if(process.argv.includes('--skip-only')){console.log('OK: one-click skip during typing.');}
 else {
  const records=JSON.parse(readFileSync(join(root,'docs/cutscene-import.json'),'utf8'));
  const imports=new Map(records.map(r=>[`${r.cutscene}_${r.shot}`,r]));
  const definitions=await page.evaluate(()=>Orfeo.Data.cutscenes.cutscenes);
  const captured=[],audit=[];let total=0;
  for(const [id,def] of Object.entries(definitions)){
   await page.evaluate(id=>{window.__playing=Orfeo.Cutscene.play(id);},id);
   for(let i=0;i<def.shots.length;i++){
    const layer=page.locator('#cutscene .cs-shot:not(.leave)').last();
    await layer.waitFor({state:'attached'});
    await page.waitForFunction(()=>{const els=[...document.querySelectorAll('#cutscene .cs-shot:not(.leave)')];const el=els.at(-1);const img=el?.querySelector('.cs-img img');return !!el&&(!img||(img.complete&&img.naturalWidth>0));},null,{timeout:10000});
    await page.evaluate(()=>Orfeo.UI.finishTyping());
    await page.waitForFunction(()=>{const els=[...document.querySelectorAll('#cutscene .cs-shot:not(.leave)')];return els.at(-1)&&Number(getComputedStyle(els.at(-1)).opacity)>.99;});
    const key=`${id}_${i+1}`,record=imports.get(key);
    const result=await layer.evaluate(el=>({src:el.querySelector('.cs-img img')?.getAttribute('src'),caption:el.querySelector('.cs-caption')?.textContent,title:el.querySelector('.cs-title')?.textContent}));
    if(record){assert.equal(result.src,record.destination);const filename=key+'.png';await page.screenshot({path:join(out,filename)});captured.push(filename);audit.push({cutscene:id,shot:i+1,...result});}
    if(def.shots[i].text)assert.ok(result.caption?.length,`${key}: missing caption`);
    await page.evaluate(()=>Orfeo.Cutscene._next());total++;
   }
   await page.evaluate(async()=>{await window.__playing;});
   assert.equal(await page.evaluate(()=>Orfeo.Cutscene.playing),false);
   assert.equal(await page.locator('#cutscene .cs-shot').count(),0);
  }
  assert.equal(captured.length,21);assert.deepEqual(errors,[]);
  writeFileSync(join(out,'audit.json'),JSON.stringify(audit,null,2)+'\n');
  writeFileSync(join(out,'index.html'),'<!doctype html><html lang="it"><meta charset="utf-8"><title>Cutscene aggiornate</title><style>body{background:#171411;color:#eee;font:16px sans-serif;padding:16px}figure{display:inline-block;max-width:480px;margin:8px}img{width:100%}</style><h1>Le 21 inquadrature importate</h1>'+captured.map(f=>`<figure><img src="${f}"><figcaption>${f}</figcaption></figure>`).join('')+'</html>');
  console.log(`OK: ${Object.keys(definitions).length} cutscene sequences, ${total} shots, 21 imported images, captions, advance and one-click skip; no browser errors.`);
 }
}catch(e){console.error('Browser diagnostics:',JSON.stringify(errors));throw e;}finally{await browser.close();server.close();}
