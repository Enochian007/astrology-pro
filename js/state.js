import {loadState,saveState} from './storage.js';
const now=Date.now();
const initial={
  route:'celestial',theme:'dark',
  simulation:{utcMs:now,mode:'live',playing:false,rate:86400,anchorMs:now},
  profiles:[],activeProfileId:null,
  birthChart:{tab:'planets'},
  settings:{houseSystem:'whole',aspectOrb:6,showPluto:true,showChiron:false,zodiac:'tropical',celestialView:'heliocentric',showOrbits:true,showLabels:true,showZodiac:true,showTrails:false}
};
let state={...initial,...(loadState()||{})};
const listeners=new Set();
export const getState=()=>state;
export function setState(patch,{persist=true}={}){
  state={...state,...(typeof patch==='function'?patch(state):patch)};
  if(persist)saveState(state);
  listeners.forEach(fn=>fn(state))
}
export function update(path,value){
  const next=JSON.parse(JSON.stringify(state));
  const parts=path.split('.');let obj=next;
  for(let i=0;i<parts.length-1;i++)obj=obj[parts[i]];
  obj[parts.at(-1)]=value;setState(next)
}
export function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
