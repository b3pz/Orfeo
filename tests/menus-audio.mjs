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
 await page.evaluate(async()=>{const O=Orfeo;O.Game.leaveTitle();O.State.reset();await O.Scene.build(O.Scene.get('c1_studio'));});
 async function shot(name){await page.waitForTimeout(280);await page.screenshot({path:join(out,'menus_'+name+'.png')});}
 for(const viewport of [{width:1280,height:720},{width:375,height:812}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>Orfeo.UI.resize());
  await page.evaluate(()=>Orfeo.UI.pauseMenu());
  assert.equal(await page.locator('.panel.menu .panel-art image').count(),1);
  await shot('pausa_'+viewport.width);
  await page.getByRole('button',{name:'Salva partita',exact:true}).click();
  assert.equal(await page.locator('.slot').count(),6);
  await shot('salva_'+viewport.width);
  for(const btn of await page.getByRole('button',{name:'Salva qui',exact:true}).all()){
   await btn.scrollIntoViewIfNeeded();
   assert.ok(await btn.isVisible());
  }
  await page.getByRole('button',{name:'Salva qui',exact:true}).first().click();
  await page.waitForFunction(()=>!Orfeo.Save.list().find(s=>s.slot==='1').empty);
  await page.evaluate(()=>Orfeo.UI.saveLoad('load'));await shot('carica_'+viewport.width);
  await page.locator('.slot').filter({has:page.getByText('Slot 1',{exact:true})}).getByRole('button',{name:'Carica',exact:true}).click();
  await page.waitForFunction(()=>!Orfeo.UI.modalOpen()&&!Orfeo.Scene.busy);
  await page.evaluate(()=>Orfeo.UI.options());await shot('opzioni_'+viewport.width);
  const buzz=page.locator('label.opt').filter({hasText:'Ronzio durante le battute'}).locator('input');
  await buzz.uncheck();assert.equal(await page.evaluate(()=>Orfeo.Audio.s.dialogueBuzz),false);
  await buzz.check();await page.evaluate(()=>Orfeo.UI.closePanel());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 // Spoiler gate: knowing Varano's name before chapter four must not reveal him.
 await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>Orfeo.UI.resize());
 await page.evaluate(async()=>{const O=Orfeo;O.State.d.chapter=1;O.State.d.flags.varano_named=true;O.State.d.people.varano=true;await O.Scene.build(O.Scene.get('c1_lungarno'));O.UI.dialogueMode(true,'varano');});
 assert.equal(await page.locator('.say-portrait.right .portrait-shadow').count(),1);await shot('varano_ombra');
 await page.evaluate(()=>{Orfeo.UI.dialogueMode(false);Orfeo.Journal.tab='persone';Orfeo.UI.openJournal();});
 assert.equal(await page.locator('.j-person .portrait-shadow').count(),1);
 assert.equal(await page.locator('.j-person').filter({has:page.locator('.portrait-shadow')}).locator('i').count(),0);
 await page.evaluate(async()=>{const O=Orfeo;O.UI.closePanel();O.State.d.chapter=4;await O.Script.run(O.Data.dialogues.dialogues.varano_c4.intro.slice(0,1));O.UI.dialogueMode(true,'varano');});
 assert.equal(await page.locator('.say-portrait.right .portrait-shadow').count(),0);
 assert.equal(await page.locator('.say-portrait.right image').count(),1);await shot('varano_rivelato');
 await page.evaluate(()=>Orfeo.UI.dialogueMode(false));
 // Real WebAudio and actual shipped music, after a user gesture unlocks sound.
 await page.evaluate(()=>{Orfeo.testMode=false;Orfeo.UI.settings.textSpeed='lento';});
 await page.mouse.click(20,20);
 await page.evaluate(()=>Orfeo.UI.closePanel());
 const decoded=await page.evaluate(async()=>{
  const O=Orfeo,ctx=O.Audio.ensureCtx();await ctx.resume();
  const ids=['title','firenze','tension','paris','roma','istanbul','tender','finale','mystery'];
  const result=[];
  for(const id of ids){const res=await fetch(O.Audio.file('music',id));if(!res.ok)throw Error(id+' missing');const b=await ctx.decodeAudioData(await res.arrayBuffer());result.push({id,seconds:Math.round(b.duration),channels:b.numberOfChannels});}
  return result;
 });
 assert.ok(decoded.every(t=>t.seconds===64&&t.channels===2));
 await page.evaluate(()=>Orfeo.Audio.music('tender'));
 await page.waitForFunction(()=>Orfeo.Audio.els.music&&!Orfeo.Audio.els.music.paused);
 const mp3=await page.evaluate(async()=>{
  const O=Orfeo,old=HTMLMediaElement.prototype.canPlayType;
  HTMLMediaElement.prototype.canPlayType=()=>'';let file;try{file=O.Audio.file('music','title');}finally{HTMLMediaElement.prototype.canPlayType=old;}
  const b=await O.Audio.ctx.decodeAudioData(await (await fetch(file)).arrayBuffer());return {file,seconds:Math.round(b.duration)};
 });
 assert.ok(mp3.file.endsWith('.mp3')&&mp3.seconds===64);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForFunction(()=>Orfeo.Audio.els.music.paused&&Orfeo.Audio.ctx.state==='suspended');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForFunction(()=>!Orfeo.Audio.els.music.paused&&Orfeo.Audio.ctx.state==='running');

 await page.evaluate(()=>{window.__said=Orfeo.UI.say({speaker:'beps',name:'Beps',expr:'neutral',text:'Una voce lieve, come un ronzio, accompagna queste parole.'});});
 await page.waitForFunction(()=>Orfeo.Audio.voice?.syllable>2);
 const beps=await page.evaluate(()=>Orfeo.Audio.voice.base);
 await page.evaluate(()=>Orfeo.UI.finishTyping());assert.equal(await page.evaluate(()=>Orfeo.Audio.voice),null);
 await page.locator('#say').click();await page.evaluate(()=>window.__said);
 await page.evaluate(()=>{window.__said=Orfeo.UI.say({speaker:'kiki',name:'Kiki',expr:'neutral',text:'Il mio timbro deve essere diverso e restare morbido.'});});
 await page.waitForFunction(()=>Orfeo.Audio.voice?.syllable>2);
 assert.notEqual(await page.evaluate(()=>Orfeo.Audio.voice.base),beps);
 await page.evaluate(()=>{Orfeo.UI.finishTyping();Orfeo.UI.pauseMenu();});
 assert.equal(await page.evaluate(()=>Orfeo.Audio.voice),null);
 await page.evaluate(()=>Orfeo.UI.closePanel());await page.locator('#say').click();await page.evaluate(()=>window.__said);
 await page.evaluate(()=>{window.__said=Orfeo.UI.say({narr:true,text:'Il narratore resta silenzioso.'});});
 assert.equal(await page.evaluate(()=>Orfeo.Audio.voice),null);
 await page.evaluate(()=>Orfeo.UI.finishTyping());await page.locator('#say').click();await page.evaluate(()=>window.__said);
 await page.evaluate(()=>{Orfeo.UI.hideSay();Orfeo.Audio.s.muted=true;Orfeo.Audio.applyVolumes();Orfeo.Audio.startVoice('beps');});
 assert.equal(await page.evaluate(()=>Orfeo.Audio.voice),null);
 assert.deepEqual(errors,[]);
 console.log('OK: illustrated pause/save/load/options on desktop and phone; all six slots reachable, save/load working; Varano hidden until the grotto; nine stereo 64-second tracks decode; dialogue buzz changes timbre and stops on skip/menu/narration/mute.');
}finally{await browser.close();server.close();}
