
const KEY='astrologypro-v2';
const OLD_KEYS=['astrologypro-v1'];

function migrate(raw){
  if(!raw || typeof raw!=='object') return null;
  const state={...raw};
  if(!state.settings) state.settings={};
  if(!state.settings.houseSystem || state.settings.houseSystem==='placidus') state.settings.houseSystem='whole';
  if(!Array.isArray(state.profiles)) state.profiles=[];
  if(!state.simulation || !Number.isFinite(state.simulation.utcMs)) state.simulation={utcMs:Date.now(),mode:'live',playing:false,rate:86400,anchorMs:Date.now()};
  return state;
}
export function loadState(){
  try{
    let parsed=JSON.parse(localStorage.getItem(KEY)||'null');
    if(parsed) return migrate(parsed);
    for(const old of OLD_KEYS){
      parsed=JSON.parse(localStorage.getItem(old)||'null');
      if(parsed){
        const next=migrate(parsed); localStorage.setItem(KEY,JSON.stringify(next)); return next;
      }
    }
    return null;
  }catch{return null}
}
export function saveState(state){
  try{localStorage.setItem(KEY,JSON.stringify(state));}
  catch(err){console.warn('Could not persist AstrologyPro state:',err);}
}
export function clearState(){localStorage.removeItem(KEY)}
