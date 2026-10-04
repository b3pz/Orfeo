// Regression checks for imported floor outlines and obstacle-aware paths.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const ctx = { window: { Orfeo: { clamp: (x,a,b) => Math.max(a,Math.min(b,x)), cond: () => true } } };
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../src/systems/MovementController.js', import.meta.url),'utf8'),ctx);
const M = ctx.window.Orfeo.Movement;
const scenes = JSON.parse(readFileSync(new URL('../data/scenes.json',import.meta.url))).scenes;
const box = [[0,0],[1000,0],[1000,1000],[0,1000]];
const obstacle = [[400,300],[600,300],[600,700],[400,700]];
const path = M.findPath([100,500],[900,500],box,[obstacle]);
assert.ok(path.length > 1,'route must go around drawn furniture');
assert.ok(M.point({walk:box,obstacles:[obstacle]},'beps',[500,500]),'clicks on furniture must project onto floor');
function verify(from,path,poly,obstacles,label) {
 let a=from;
 for (const b of path) {
  const count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));
  for(let i=0;i<=count;i++){
   const t=count ? i/count : 0;
   assert.ok(M.walkable([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],poly,obstacles),label+' leaves floor/crosses obstacle');
  }
  a=b;
 }
}
verify([100,500],path,box,[obstacle],'furniture');
const barrier=[[450,-10],[550,-10],[550,1010],[450,1010]];
assert.equal(M.findPath([100,500],[900,500],box,[barrier]).length,0,'unreachable goal must never become a straight path');
let checked=0;
for(const [id,scene] of Object.entries(scenes)) {
 if(!scene.bgFit)continue;
 for(const who of ['beps','kiki']) {
  const polys=[scene.walk,scene.walkFor?.[who],...(scene.walkIf||[]).filter(w=>!w.who||w.who===who).map(w=>w.walk)].filter(Boolean);
  for(const poly of polys) {
   const obstacles=M.obstacles(scene,who);
   const start=M.clampWalkable(scene.spawn.default,poly,obstacles);
   assert.ok(start,id+' has no safe spawn');
   for(const h of scene.hotspots||[]) {
    const r=h.rect,target=h.at||[r[0]+r[2]/2,Math.max(r[1]+r[3]+30,700)];
    const goal=M.clampWalkable(target,poly,obstacles);
    const path=M.findPath(start,target,poly,obstacles);
    assert.ok(goal && path.length,id+'/'+who+'/'+h.id+' unreachable');
    verify(start,path,poly,obstacles,id+'/'+who+'/'+h.id);checked++;
   }
  }
 }
}
console.log('OK: '+checked+' hotspot paths stay on floors and avoid obstacles.');
