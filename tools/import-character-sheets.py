#!/usr/bin/env python3
"""Import character bitmaps unchanged; compute SVG frame windows/contours.
Requires Pillow, NumPy and SciPy. Reuses the project's component assignment.
Run from anywhere: python3 tools/import-character-sheets.py
"""
import importlib.util, json, math, shutil
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('normalize',ROOT/'tools/normalize-assets.py')
normalize=importlib.util.module_from_spec(spec);spec.loader.exec_module(normalize)
SOURCE=ROOT/'nuovi asset/02_personaggi'
MAP={
 'bellandi':{'base':'exec-4f6a1c10-d551-4919-98cc-06e433a91be0.png','idle':'exec-84693835-6941-46bc-a0e0-65646a5cb32e.png','talk':'exec-34af68ec-d5bf-40cd-b628-97490e8b6850.png','talk_alt':'exec-ff081330-1082-48dc-bb68-fe4d858b18b8.png'},
 'donna':{'base':'exec-619c96b5-e123-43c2-906e-9fe0b6d29325.png','idle':'exec-1609fed6-cdb6-45e6-99fc-69bc3effd317.png','talk':'exec-51aa485e-0621-445c-b500-d6bc8f2b3b5f.png'},
 'emre':{'base':'exec-d0c7e5ac-2b39-4c4a-9b8f-c322eeb88d1b.png','idle':'exec-c152bc95-0764-4652-a10a-23e925f58b2a.png','talk':'exec-c4fcfff8-0ca6-4797-9447-31df50cb67b6.png'},
 'helene':{'base':'exec-42fe5268-c850-485c-b037-748d159cd51c.png','idle':'exec-e5c3e844-ab50-4405-b5c2-5fac8805cc3c.png','talk':'exec-a928e759-bc37-4cb2-b50e-b98692f502d1.png'},
 'sandro':{'base':'exec-328011f6-fc36-4d4b-b516-fb70a4ca6e11.png','idle':'exec-7353eec5-e80f-47b4-a29d-3f59af6b84ac.png','talk':'exec-87a2662c-2e1b-4aa9-b1da-8227c7c03022.png'},
 'tommaso':{'base':'exec-da0ee6e9-2fe7-4e03-86fd-2a58c94fdde3.png','idle':'exec-d4e66632-4f19-4f95-81dd-007ce82fcc28.png','talk':'exec-868caabf-c195-4608-adf6-6b9565b62e54.png'},
 'kiki':{'phone':'exec-a6d6243f-2eac-4373-86b8-9a2ec47bec64.png'},
 'varano':{'portrait':'exec-cefee4d8-f870-4da4-ab49-4efd1b770e35.png'}}
report=[]
def copy(src,relative):
 dst=ROOT/relative;dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists() and dst.read_bytes()!=src.read_bytes():
  backup=ROOT/'assets/originals-before-update'/dst.relative_to(ROOT/'assets');backup.parent.mkdir(parents=True,exist_ok=True)
  if not backup.exists():shutil.copy2(dst,backup)
 shutil.copy2(src,dst)
 report.append({'source':str(src.relative_to(ROOT)),'destination':relative})
 return relative

def simplify(points,epsilon=0.7):
 if len(points)<3:return points
 a=np.array(points[0],float);b=np.array(points[-1],float);v=b-a
 pts=np.array(points,float);length=float(v@v)
 if length:
  t=np.clip((pts-a)@v/length,0,1);ds=np.linalg.norm(pts-a-t[:,None]*v,axis=1)
 else:ds=np.linalg.norm(pts-a,axis=1)
 i=int(np.argmax(ds))
 if ds[i]<=epsilon:return [points[0],points[-1]]
 return simplify(points[:i+1],epsilon)+simplify(points[i:],epsilon)[1:]

def contour(mask,all_mask):
 # A row envelope preserves detached accessories and the transparent leg gap.
 # If a neighbouring figure lies inside that envelope, use exact run rectangles.
 mask=ndimage.binary_dilation(mask,iterations=2)
 ys=np.where(mask.any(axis=1))[0];rows=[];contamination=False
 for y in ys:
  xs=np.where(mask[y])[0];lo=int(xs[0]);hi=int(xs[-1])+1;rows.append((int(y),lo,hi))
  if np.any(all_mask[y,lo:hi] & ~mask[y,lo:hi]):contamination=True
 if contamination:
  paths=[]
  for y in ys:
   padded=np.r_[False,mask[y],False];changes=np.where(padded[1:]!=padded[:-1])[0]
   for lo,hi in zip(changes[::2],changes[1::2]):paths.append(f'M{lo} {y}h{hi-lo}v1h{lo-hi}Z')
  return ''.join(paths)
 left=[];right=[]
 for y,lo,hi in rows:left.extend([(lo,y),(lo,y+1)]);right.extend([(hi,y),(hi,y+1)])
 points=simplify(left)+simplify(right[::-1]);return 'M'+'L'.join(f'{x} {y}' for x,y in points)+'Z'

def frames(src):
 arrays,boxes,cell=normalize.split(str(src.relative_to(ROOT)),6)
 original=np.asarray(Image.open(src).convert('RGBA'));all_mask=original[:,:,3]>16
 result=[];extents=[];heights=[]
 for i,fr in enumerate(arrays):
  mask=fr[:,:,3]>16;ys,xs=np.where(mask)
  if not len(xs):raise ValueError(f'{src}: empty frame {i}')
  bottom=int(ys.max())+1;top=int(ys.min());height=bottom-top
  # Foot midpoint, rather than accessory midpoint, anchors the actor on the floor.
  foot_x=np.where(mask[max(top,bottom-int(height*.10)):bottom].any(axis=0))[0]
  cx=(int(foot_x.min())+int(foot_x.max()))/2
  half=max(cx-int(xs.min()),int(xs.max())-cx)+5
  result.append({'cx':cx,'bottom':bottom,'clip':contour(mask,all_mask)})
  extents.append(half);heights.append(height)
 h=max(heights)+4;w=math.ceil(max(extents)*2)
 for r in result:r['viewBox']=[round(r.pop('cx')-w/2,2),r.pop('bottom')-h,w,h]
 return {'frames':6,'fps':6,'w':w,'h':h,'sheetW':original.shape[1],'sheetH':original.shape[0],'windows':result}

p=ROOT/'data/characters.json';data=json.loads(p.read_text());chars=data['characters']
for char,mapping in MAP.items():
 for anim,name in mapping.items():
  src=SOURCE/char/name
  if not src.exists():raise FileNotFoundError(src)
  if anim in ['idle','talk','phone']:
   dst=copy(src,f'assets/sprites/{char}/{anim}.png');meta=frames(src);meta['src']=dst;meta['fps']=4 if anim=='idle' else 6
   chars[char].setdefault('sprites',{})[anim]=meta
   if char=='kiki':chars['kiki_npc'].setdefault('sprites',{})[anim]=meta
   print(f'{char}/{anim}: 6 frames, SVG window {meta["w"]} x {meta["h"]}')
  elif anim=='base':
   dst=copy(src,f'assets/source_sheets/{char}/base.png');im=Image.open(src).convert('RGBA');a=np.asarray(im)[:,:,3]>16;ys,xs=np.where(a);top=int(ys.min());height=int(ys.max())-top
   head=np.where(a[top:top+int(height*.22)].any(axis=0))[0];cx=(int(head.min())+int(head.max()))/2
   ph=round(height*.39);pw=round(ph/1.2);x=max(0,round(cx-pw/2))
   chars[char]['portraitSheet']={'src':dst,'w':im.width,'h':im.height,'rects':{'neutral':[x,max(0,top-10),pw,ph]}}
  elif anim=='portrait':
   dst=copy(src,'assets/portraits/varano/sheet.png');im=Image.open(src);w=im.width/7
   expressions=['neutral','angry','determined','think','worried','sad','smile']
   chars[char]['portraitSheet']={'src':dst,'w':im.width,'h':im.height,'rects':{expr:[round(i*w),100,round(w),round(w*1.2)] for i,expr in enumerate(expressions)}}
  else:copy(src,f'assets/source_sheets/{char}/{anim}.png')
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(ROOT/'docs/character-import.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f'{len(report)} sources imported unchanged.')
