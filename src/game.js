
const state = {
  verb: 'use',
  inventory: [
    {id:'usb', name:'Chiavetta USB', icon:'▣'},
    {id:'photo', name:'Foto 1944', icon:'▧'}
  ],
  flags: {desk:false, archive:false, door:false, intro:false},
  selectedItem:null
};

const $ = s => document.querySelector(s);
const dialogue = $('#dialogue');
const speaker = $('#speaker');
const line = $('#line');
const choices = $('#choices');
const objective = $('#objective');

const journalEntries = [
  "<b>Firenze, ottobre 2026.</b><br>Durante alcuni lavori è stata aperta una stanza murata. Tra il materiale recuperato c'era un vecchio computer.",
  "<b>Cartella ORFEO.</b><br>Tre file: FIRENZE_1944.jpg, LISTA_17.pdf, NON_APRIRE.wav.",
  "<b>Fotografia.</b><br>Quattro uomini davanti a un edificio. Un volto è stato cancellato deliberatamente."
];

function renderInventory(){
  const el = $('#inventorySlots'); el.innerHTML='';
  state.inventory.forEach(it=>{
    const b=document.createElement('button');
    b.className='item'; b.textContent=it.icon; b.dataset.name=it.name;
    if(state.selectedItem===it.id) b.style.outline='2px solid #b99a5d';
    b.onclick=()=>{state.selectedItem=state.selectedItem===it.id?null:it.id; renderInventory();}
    el.appendChild(b);
  });
}
function say(name,text,next=null, opts=[]){
  dialogue.classList.remove('hidden');
  speaker.textContent=name.toUpperCase();
  line.innerHTML=text; choices.innerHTML='';
  if(opts.length){
    opts.forEach(o=>{
      const b=document.createElement('button'); b.className='choice'; b.textContent=o.label;
      b.onclick=()=>o.action(); choices.appendChild(b);
    });
  } else {
    const b=document.createElement('button'); b.className='choice'; b.textContent='Continua';
    b.onclick=()=>{dialogue.classList.add('hidden'); if(next) next();};
    choices.appendChild(b);
  }
}
function startIntro(){
  state.flags.intro=true;
  say('Giuseppe','Doveva essere un intervento di dieci minuti. Copiare un disco, controllare due cartelle e tornare a casa.', ()=>{
    say('Giuseppe','Poi ho visto quella cartella: <b>ORFEO</b>. E improvvisamente dieci minuti sono diventati una pessima idea.', ()=>{
      objective.textContent='Obiettivo: controlla la scrivania e ricostruisci ciò che è successo.';
    });
  });
}
$('#startBtn').onclick=()=>{$('#title-screen').style.display='none'; startIntro();};

document.querySelectorAll('[data-verb]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('[data-verb]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.verb=b.dataset.verb;
});

$('#deskHotspot').onclick=()=>{
  if(state.verb==='look'){
    say('Giuseppe','Il computer recuperato dal cantiere. Vecchio, polveroso e stranamente ancora leggibile.');
  } else if(state.verb==='use'){
    if(!state.flags.desk){
      state.flags.desk=true;
      say('Giuseppe','La cartella contiene tre file. Il PDF è cifrato. La foto è del 1944. L’audio…', ()=>{
        say('Voce registrata','«Se qualcuno sta ascoltando questo messaggio, significa che abbiamo fallito.»', ()=>{
          objective.textContent='Obiettivo: cerca nell’archivio un riferimento al simbolo ORFEO.';
        });
      });
    } else say('Giuseppe','Ho già copiato tutto sulla chiavetta. Meglio non lasciare altre tracce.');
  }
};
$('#archiveHotspot').onclick=()=>{
  if(!state.flags.desk){ say('Giuseppe','Prima dovrei capire cosa sto cercando.'); return; }
  if(!state.flags.archive){
    state.flags.archive=true;
    state.inventory.push({id:'note',name:'Scheda archivio',icon:'▤'}); renderInventory();
    say('Giuseppe','Eccolo. Stesso simbolo. Una scheda di catalogazione del 1967… provenienza: <b>Parigi</b>.', ()=>{
      objective.textContent='Obiettivo: esci dallo studio. Qualcuno sta arrivando.';
    });
  } else say('Giuseppe','Non c’è altro. Ma questa scheda cambia tutto.');
};
$('#doorHotspot').onclick=()=>{
  if(!state.flags.archive){say('Giuseppe','Non ancora. Ho la sensazione che mi stia sfuggendo qualcosa.'); return;}
  state.flags.door=true;
  say('???','«Mi scusi… lei ha appena consultato il fascicolo Orfeo?»', ()=>{
    say('Giuseppe','Mi voltai. Non avevo mai visto quella donna prima di allora.', ()=>{
      $('#locationLabel').textContent='ARCHIVIO STORICO · FIRENZE';
      say('Kiki','«Perché quel fascicolo interessa anche a me.»', null, [
        {label:'«Chi è lei?»',action:()=>say('Giuseppe','«Chi è lei?»',()=>say('Kiki','«Federica. Ma tutti mi chiamano Kiki.»'))},
        {label:'«Dipende. Chi lo chiede?»',action:()=>say('Giuseppe','«Dipende. Chi lo chiede?»',()=>say('Kiki','«Qualcuno che ha una fotografia identica alla sua.»'))},
        {label:'Non dire nulla',action:()=>say('Kiki','«Va bene. Allora comincio io: Parigi, 1967. Le dice qualcosa?»')}
      ]);
    });
  });
};

$('#journalBtn').onclick=()=>{
  $('#journalContent').innerHTML=journalEntries.map(e=>`<p>${e}</p>`).join('');
  $('#journal').classList.remove('hidden');
};
document.querySelector('.close-panel').onclick=()=>$('#journal').classList.add('hidden');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){dialogue.classList.add('hidden');$('#journal').classList.add('hidden');}});

document.querySelectorAll('.hotspot').forEach(h=>{
  h.addEventListener('mousemove',e=>{
    const lab=$('#interactionLabel'); lab.style.display='block';
    lab.style.left=(e.clientX+12)+'px'; lab.style.top=(e.clientY+12)+'px';
    lab.textContent = state.verb.toUpperCase()+' · '+h.getAttribute('aria-label');
  });
  h.addEventListener('mouseleave',()=>$('#interactionLabel').style.display='none');
});

renderInventory();
