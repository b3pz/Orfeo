// Browser regression: uploaded SVG sprite windows, every frame, and new portraits.
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
const page=await browser.newPage({viewport:{width:1440,height:1450}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const out=join(root,'tests/screens');mkdirSync(out,{recursive:true});
try{
 await page.addInitScript(()=>window.ORFEO_TEST=true);
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{timeout:60000});
 await page.waitForFunction(()=>window.Orfeo?.ready,null,{timeout:60000});
 const counts=await page.evaluate(async()=>{
  const O=Orfeo;O.Game.leaveTitle();O.State.reset();await O.Scene.build(O.Data.scenes.scenes.c1_caffe);
  let frames=0;const chars=['helene','sandro','tommaso','bellandi','emre','donna','kiki'];
  const container=document.createElement('div');container.id='sprite-review';
  container.style.cssText='position:fixed;inset:0;background:#c7c0b4;z-index:99999;overflow:auto;padding:12px;color:#241e19;font:15px sans-serif';
  document.body.append(container);
  for(const id of chars){
   const a=O.Characters.spawn('review-'+id,{npc:{id:'review-'+id,char:id,x:960,y:950}});
   const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:5px;border-bottom:1px solid #888;margin-bottom:8px';
   const label=document.createElement('b');label.style.width='80px';label.textContent=id;row.append(label);
   const anims=id==='kiki'?['phone']:['idle','talk'];
   for(const anim of anims){
    const sp=O.Characters.def(id).sprites[anim];
    if(!sp?.windows||sp.frames!==6)throw Error(id+'/'+anim+' lacks six frame windows');
    if(!await O.Assets.image(sp.src))throw Error('Cannot decode '+sp.src);
    O.Characters.setAnim(a,anim);
    for(let i=0;i<6;i++){
     O.Characters.setFrame(a,i);frames++;
     if(a.spriteEl.getAttribute('viewBox')!==sp.windows[i].viewBox.join(' '))throw Error('Wrong window '+id+'/'+anim+'/'+i);
     if(!a.spriteEl.querySelector('.frame-clip').getAttribute('d'))throw Error('Missing silhouette');
     const slot=document.createElement('div');slot.style.cssText='height:130px;max-width:100px;flex:1;text-align:center';
     const svg=a.spriteEl.cloneNode(true);const clip=svg.querySelector('clipPath');const unique=`review-${id}-${anim}-${i}`;
     clip.id=unique;svg.querySelector('image').setAttribute('clip-path',`url(#${unique})`);svg.style.cssText='width:100%;height:110px';
     slot.append(svg);slot.append(document.createTextNode(anim+' '+(i+1)));row.append(slot);
    }
   }
   container.append(row);
  }
  const portraits=document.createElement('div');portraits.style.display='flex';
  for(const expr of ['neutral','angry','determined','think','worried','sad','smile']){
   const slot=document.createElement('div');slot.style.cssText='width:140px;text-align:center';slot.innerHTML=O.UI.portraitHTML('varano',expr);
   const svg=slot.querySelector('svg');if(!svg?.querySelector('image'))throw Error('Varano portrait not rendered');svg.style.cssText='width:130px;height:150px';
   slot.append(document.createTextNode(expr));portraits.append(slot);
  }
  if(!await O.Assets.image(O.Characters.def('varano').portraitSheet.src))throw Error('Varano portrait sheet missing');
  container.append(portraits);
  const faces=document.createElement('div');faces.style.cssText='display:flex;margin-top:12px';
  for(const id of chars.filter(id=>id!=='kiki')){
   const slot=document.createElement('div');slot.style.cssText='width:140px;text-align:center';slot.innerHTML=O.UI.portraitHTML(id,'neutral');
   const svg=slot.querySelector('svg');if(!svg?.querySelector('image'))throw Error(id+' neutral portrait not rendered');svg.style.cssText='width:130px;height:150px';
   slot.append(document.createTextNode(id));faces.append(slot);
  }
  container.append(faces);
  O.State.d.flags.pc_read = true;
  await O.Scene.build(O.Data.scenes.scenes.c1_lungarno);
  if (!O.Characters.actors['scenery:donna']?.sprite?.windows) throw Error('Woman apparition lacks supplied sprite');
  O.State.d.flags.woman_1 = true; O.Scene.refresh();
  if (O.Characters.actors['scenery:donna']) throw Error('Woman apparition remains after its story flag');
  return {frames,characters:chars.length};
 });
 await page.screenshot({path:join(out,'ui_uploaded_characters.png')});
 assert.equal(counts.frames,78);assert.deepEqual(errors,[]);
 console.log(`OK: ${counts.characters} characters, ${counts.frames} frames, 7 Varano portraits; no browser errors.`);
}catch(e){console.error('Browser diagnostics:', JSON.stringify(errors));console.error(await page.evaluate(() => ({ loading:document.querySelector('#loading p')?.textContent, ready:!!window.Orfeo?.ready, loadedData:Object.keys(window.Orfeo?.Data||{}) })));throw e;}finally{await browser.close();server.close();}
