// Exercise actual RAF movement (testMode is off), interruption and scene/action races.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
let now = 0, frames = [], timers = new Map(), serial = 0, updates = 0;
const O = {
 clamp: (x,a,b) => Math.max(a,Math.min(b,x)), lerp: (a,b,t) => a+(b-a)*t,
 cond: s => !s || (s.startsWith('!flag.') ? !O.State.d.flags[s.slice(6)] : !!O.State.d.flags[s.slice(5)]),
 testMode: false, inTitle: false,
 State: { d: { active:'beps',together:false,flags:{},chars:{} }, partnerId: () => O.State.d.active === 'beps' ? 'kiki' : 'beps' },
 Scene: {current:null,busy:false}, Script:{running:false}, Dialogue:{open:false}, Puzzles:{open:false}, Cutscene:{playing:false},
 UI:{modalOpen:()=>false}, emit:()=>{},
 Characters:{ anim:()=>{}, update(who) {
  const c=O.State.d.chars[who],sc=O.Scene.current;
  assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y),'renderer received invalid position');
  assert.ok(O.Movement.walkable([c.x,c.y],O.Movement.polygon(sc,who),O.Movement.obstacles(sc,who)),`${sc.id}/${who}: frame left floor`);
  updates++;
 } }
};
const context=vm.createContext({window:{Orfeo:O},performance:{now:()=>now},
 requestAnimationFrame:fn=>frames.push(fn),
 setTimeout:fn=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),console});
function load(path){vm.runInContext(readFileSync(new URL(path,root),'utf8'),context);}
load('src/systems/MovementController.js');
const M=O.Movement;
function tick(delta=16){now+=delta;const pending=frames;frames=[];pending.forEach(fn=>fn(now));}
function finish(){let limit=3000;while(frames.length&&limit--)tick([0,16,33,50][limit%4]);assert.ok(limit>0,'movement did not finish');}
function install(sc,who='beps',flags={}){
 M.stopAll();frames=[];O.State.d={active:who,together:false,flags,chars:{}};O.Scene.current=sc;
 for(const id of ['beps','kiki']){const p=M.point(sc,id,sc.spawn.default);assert.ok(p,sc.id+' safe spawn');O.State.d.chars[id]={x:p[0],y:p[1],scene:sc.id,present:true,dir:1};}
}
const box={id:'box',walk:[[0,0],[1000,0],[1000,1000],[0,1000]],spawn:{default:[100,500]}};
install(box);
let job=M.walkTo('beps',[100,500],{run:true});tick(0);finish();assert.equal(await job,true,'zero-distance/zero-time walk');
job=M.walkTo('beps',[900,500],{run:true});tick(-100);finish();assert.equal(await job,true,'backwards timestamp');
assert.equal(await M.walkTo('beps',[NaN,500]),false,'invalid click rejected');
O.State.d.chars.beps.x=NaN;O.State.d.chars.beps.y=Infinity;
job=M.walkTo('beps',[200,500]);finish();assert.equal(await job,true,'bad saved position repaired');
O.State.d.together=true;
job=M.moveActive([900,500],{run:true});
assert.equal(timers.size,1);M.stopAll();assert.equal(timers.size,0,'stopAll must cancel delayed partner follow');assert.equal(await job,false);
for(let i=0;i<40;i++){job=M.moveActive([100+i*7,500],{run:i%2===0});tick(i%3?16:0);assert.equal(timers.size,1,'rapid clicks leave one follow timer');}
M.stopAll();finish();assert.equal(await job,false);
job=M.walkTo('beps',[900,500]);O.Scene.current={...box,id:'other'};tick();assert.equal(await job,false,'old scene job cancelled');
install(box);
job=M.walkTo('beps',[900,500]);O.State.d.chars.beps={...O.State.d.chars.beps};tick();assert.equal(await job,false,'job on replaced save state cancelled');
install(box);
job=M.walkTo('beps',[900,500]);tick();box.obstacles=[[[50,450],[300,450],[300,550],[50,550]]];tick();assert.equal(await job,false,'floor change cancels unsafe job');delete box.obstacles;
let seed=123456789;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const scenes=JSON.parse(readFileSync(new URL('data/scenes.json',root),'utf8')).scenes;
let walks=0,interrupted=0;
for(const [id,def] of Object.entries(scenes))for(const opened of [false,true])for(const who of ['beps','kiki']){
 const sc={...def,id};install(sc,who,{paratoia_aperta:opened,meccanismo_aperto:opened});
 for(let i=0;i<20;i++){
  const c=O.State.d.chars[who];
  const p=i%5===0?[c.x,c.y]:[random()*1920,random()*1080];
  job=M.walkTo(who,p,{run:i%2===0});
  if(i%4===1){tick(0);tick(16);M.stop(who);interrupted++;}else finish();
  await job;walks++;
 }
 M.stopAll();finish();
}
// Independently recorded object/wall pixels: they must not be destinations.
for(const [id,p] of [
 ['c2_gare',[900,900]],['c2_gare',[1500,770]],['c1_lungarno',[1100,715]],
 ['c3_cortile',[1450,890]],['c3_sala_cassetti',[1250,915]],['c1_caffe',[1160,730]],
 ['c6_sala',[1000,680]],['c1_cantiere',[600,1020]],['c7_cantiere',[600,1020]],['c1_cantiere',[710,1020]],['c7_cantiere',[710,1020]],
 ['c5_han',[1260,795]],['c2_studio_marchetti',[1730,970]]
]){const sc={...scenes[id],id};assert.equal(M.walkable(p,M.polygon(sc,'beps'),M.obstacles(sc,'beps')),false,id+' drawn object/wall is walkable');}
// A pickup with a timed animation cannot be dispatched twice by click/dblclick.
load('src/systems/HotspotManager.js');install(box);
const H=O.Hotspots;H.setHover=()=>{};H.faceTarget=()=>{};
let calls=0,release;H.doUse=()=>{calls++;return new Promise(r=>release=r);};
const action=H.interact({rect:[80,480,40,20]},'use');finish();await new Promise(r=>setImmediate(r));
assert.equal(H.acting,true);await H.interact({rect:[80,480,40,20]},'use',null,true);
assert.equal(calls,1,'duplicate action from double click');release();await action;assert.equal(H.acting,false);
// Two exits during a fade cannot concurrently rebuild scene layers.
load('src/systems/SceneManager.js');
const S=O.Scene;S.current=box;S.get=()=>box;
let releaseFade;S.fade=()=>new Promise(r=>releaseFade=r);S.build=async sc=>{S.current=sc;};S.enter=async()=>{};
O.State.d.active='beps';O.State.d.chars.beps.scene='box';
const transition=S.go('box');assert.equal(S.busy,true);assert.equal(await S.go('box'),false,'concurrent transition rejected');
releaseFade();await new Promise(r=>setImmediate(r));releaseFade();await transition;assert.equal(S.busy,false);
const nextScene={...box,id:'story-next'};
S.get=id=>id==='box'?box:nextScene;
S.enter=async sc=>{if(sc.id==='box')assert.equal(await S.go('story-next',{noFade:true}),true,'enter script may travel');};
await S.go('box',{noFade:true});assert.equal(S.current.id,'story-next','nested story transition completed');
console.log(`OK: ${walks} animated walks, ${interrupted} interruptions, ${updates} safe frames; rapid clicks, invalid saves, follow and transition/action races.`);
