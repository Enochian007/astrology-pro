import {getState,setState,subscribe} from './state.js';import {render,openProfileDialog,toast} from './ui.js';import {exportHtml} from './export.js';
let last=performance.now(),raf,lastPublish=0,accumulated=0;
function advance(t){
  const s=getState(),dt=(t-last)/1000;
  if(s.simulation.playing){
    accumulated += dt*s.simulation.rate*1000;
    if(t-lastPublish>120){
      const delta=accumulated; accumulated=0;
      setState(x=>({...x,simulation:{...x.simulation,utcMs:x.simulation.utcMs+delta,mode:'custom'}}),{persist:false});
      lastPublish=t;
    }
  } else accumulated=0;
  last=t;raf=requestAnimationFrame(advance)
}
function bindStatic(){
  document.getElementById('profileSwitcher').onclick=openProfileDialog;
  document.getElementById('themeToggle').onclick=()=>setState(s=>({...s,theme:s.theme==='dark'?'light':'dark'}));
  document.getElementById('exportButton').onclick=exportHtml;
  document.getElementById('playPause').onclick=()=>setState(s=>({...s,simulation:{...s.simulation,playing:!s.simulation.playing,mode:'custom'}}));
  document.getElementById('nowButton').onclick=()=>setState(s=>({...s,simulation:{...s.simulation,utcMs:Date.now(),mode:'live',playing:false,anchorMs:Date.now()}}));
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const days=Number(b.dataset.step);setState(s=>({...s,simulation:{...s.simulation,utcMs:s.simulation.utcMs+days*86400000,mode:'custom'}}))});
  document.getElementById('speedSelect').onchange=e=>setState(s=>({...s,simulation:{...s.simulation,rate:Number(e.target.value)}}));
  document.getElementById('timeline').oninput=e=>{const days=Number(e.target.value);const anchor=getState().simulation.anchorMs||Date.now();setState(s=>({...s,simulation:{...s.simulation,utcMs:anchor+days*86400000,mode:'custom'}}))};
  document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.code==='Space'){e.preventDefault();document.getElementById('playPause').click()}if(e.key.toLowerCase()==='n')document.getElementById('nowButton').click()});
}
subscribe(render);bindStatic();render();raf=requestAnimationFrame(advance);toast('AstrologyPro shell loaded');

window.addEventListener('beforeunload',()=>{try{setState(s=>({...s}),{persist:true})}catch{}});
