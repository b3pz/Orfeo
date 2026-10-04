"""Compose original seamless ambient cues. Requires numpy, imageio-ffmpeg.
Generated OGG files are shipped with the game; Python is not needed to play.
"""
from pathlib import Path
import sys, json, subprocess, wave, tempfile
import numpy as np
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio/music';OUT.mkdir(parents=True,exist_ok=True)
SR=22050;DURATION=64;N=SR*DURATION
t=np.arange(N,dtype=np.float64)/SR
# Original, sparse motifs over slowly moving modal harmonies.
CUES={
 'title':([ [45,52,57,59],[41,48,57,60],[38,45,53,57],[40,47,55,59] ],[76,79,81,83,79,76,74,71]),
 'firenze':([[45,52,57,60],[41,48,57,60],[48,55,60,64],[43,50,59,62]],[76,72,74,76,79,76,72,71]),
 'tension':([[38,45,53,56],[37,44,52,56],[38,45,53,57],[40,47,53,56]],[69,68,65,64,69,72,68,64]),
 'paris':([[48,55,59,64],[45,52,60,64],[47,54,59,62],[43,50,59,64]],[76,79,83,81,79,76,74,72]),
 'roma':([[43,50,55,59],[40,47,55,59],[41,48,57,60],[38,45,53,57]],[74,71,67,69,72,71,69,67]),
 'istanbul':([[38,45,53,57],[39,46,55,58],[38,45,53,57],[45,52,56,60]],[74,75,81,77,74,72,73,69]),
 'tender':([[48,55,60,64],[50,57,62,65],[45,52,59,64],[41,48,57,60]],[76,79,81,79,76,74,72,76]),
 'finale':([[36,43,52,55],[38,45,53,57],[40,47,55,59],[41,48,57,60]],[72,76,79,83,81,79,76,72]),
 'mystery':([[41,48,56,60],[40,47,55,59],[38,45,53,57],[41,48,55,60]],[72,71,68,65,69,72,68,64])
}
def frequency(note):return round(440*2**((note-69)/12)*DURATION)/DURATION

def periodic_note(track,start,note,amp,decay=4.8):
 length=int(9*SR);tt=np.arange(length)/SR;f=frequency(note)
 env=(1-np.exp(-tt/.035))*np.exp(-tt/decay)*(np.maximum(0,1-tt/9)**2)
 # Soft struck string: quieter upper harmonics, no harsh high-frequency buzz.
 sig=(np.sin(2*np.pi*f*tt)+.22*np.sin(2*np.pi*2*f*tt)+.075*np.sin(2*np.pi*3*f*tt))*env*amp
 idx=(np.arange(length)+int(start*SR))%N
 np.add.at(track,idx,sig)

def compose(name,chords,melody):
 dry=np.zeros(N);bass=np.zeros(N)
 for ci,chord in enumerate(chords):
  age=(t-ci*16)%DURATION
  # Each chord overlaps its neighbour by four seconds; both endpoints agree.
  env=np.where(age<20,np.sin(np.pi*np.clip(age/20,0,1))**2,0)
  for j,note in enumerate(chord):
   f=frequency(note)
   dry+=env*.024*(np.sin(2*np.pi*f*t+j*.7)+.13*np.sin(2*np.pi*2*f*t+j*.3))
  f=frequency(chord[0]-12);bass+=env*.018*np.sin(2*np.pi*f*t)
 lead=np.zeros(N)
 for i,note in enumerate(melody):periodic_note(lead,i*8+2,note,.073 if name!='tension' else .047)
 left=dry+bass+lead;right=dry+bass+np.roll(lead,int(.037*SR))
 for delay,gain in [(.193,.16),(.379,.12),(.733,.09),(1.117,.055),(1.663,.032)]:
  left+=np.roll(dry*.6+lead,int(delay*SR))*gain
  right+=np.roll(dry*.6+lead,int((delay+.071)*SR))*gain
 stereo=np.stack([left,right],axis=1)
 stereo-=stereo.mean(axis=0)
 peak=float(abs(stereo).max());stereo*=.5/peak
 assert np.isfinite(stereo).all() and abs(stereo).max()<=.501
 # Loop seam is below one sample of a quiet waveform (no fade-to-silence gap).
 seam=float(abs(stereo[0]-stereo[-1]).max())
 assert seam<.025,(name,seam)
 wav=Path(tempfile.gettempdir())/f'orfeo-{name}.wav'
 with wave.open(str(wav),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((stereo*32767).astype('<i2').tobytes())
 subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-i',str(wav),'-c:a','libvorbis','-q:a','4',str(OUT/f'{name}.ogg')],check=True)
 subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-i',str(wav),'-c:a','libmp3lame','-q:a','4',str(OUT/f'{name}.mp3')],check=True)
 return {'id':name,'seconds':DURATION,'peak':round(float(abs(stereo).max()),4),'rms':round(float(np.sqrt((stereo**2).mean())),4),'loopSeam':round(seam,5),'bytes':(OUT/f'{name}.ogg').stat().st_size}
rows=[]
for name,(chords,melody)in CUES.items():
 rows.append(compose(name,chords,melody));print(name,rows[-1]['bytes'],'bytes',flush=True)
(ROOT/'docs/AUDIO_ORIGINALE.json').write_text(json.dumps({'sampleRate':SR,'channels':2,'tracks':rows},indent=2)+'\n')
