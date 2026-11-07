import {ephemeris} from './ephemeris.js';
let cache=new Map();
export async function getSnapshot(state){
  const bucket=Math.round(state.simulation.utcMs/1000);
  const profile=state.profiles.find(p=>p.id===state.activeProfileId);
  const key=[bucket,state.settings.showPluto,state.settings.houseSystem].join('|');
  if(cache.has(key)) return cache.get(key);
  const observer=profile?{latitude:Number(profile.latitude)||0,longitude:Number(profile.longitude)||0,timezone:profile.timezone||'UTC'}:{latitude:0,longitude:0,timezone:'UTC'};
  const promise=ephemeris.calculateSnapshot(state.simulation.utcMs,observer,state.settings);
  cache.set(key,promise);if(cache.size>120)cache.delete(cache.keys().next().value);
  return promise;
}
