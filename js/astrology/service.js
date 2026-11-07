
import {ephemeris} from '../astronomy/ephemeris.js';
import {calculateAngles,calculateHouses,assignHouses,calculateAspects,dominance,signInfo,normalize360,angularDistance} from './chart.js';
import {buildInterpretation} from './interpretation.js';

function profileDateToUtcMs(profile){
  if(!profile?.date) return null;
  const time=profile.time||'12:00';
  // Browser-safe IANA conversion using Intl iterative offset resolution.
  const desired=`${profile.date}T${time.length===5?time+':00':time}`;
  const [Y,M,D,h,m,s]=desired.split(/[-T:]/).map(Number);
  const guess=Date.UTC(Y,M-1,D,h,m,s||0);
  const tz=profile.timezone||'UTC';
  const parts=ms=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false
  }).formatToParts(new Date(ms)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  let t=guess;
  for(let i=0;i<3;i++){
    const p=parts(t);
    const seen=Date.UTC(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute,+p.second);
    t += guess-seen;
  }
  return t;
}

function crossAspects(transit,natal,orbScale=1){
  const defs=[['Conjunction','☌',0,8],['Sextile','⚹',60,5],['Square','□',90,7],['Trine','△',120,7],['Opposition','☍',180,8]];
  const out=[];
  for(const t of transit)for(const n of natal){
    if(['earth'].includes(t.id)||['earth'].includes(n.id))continue;
    const sep=angularDistance(t.geocentric.longitude,n.geocentric.longitude);
    for(const [type,symbol,angle,base] of defs){
      const allowed=base*orbScale,orb=Math.abs(sep-angle);
      if(orb<=allowed)out.push({a:`Transit ${t.name}`,b:`Natal ${n.name}`,type,symbol,orb,strength:Math.max(0,Math.round((1-orb/allowed)*100))});
    }
  }
  return out.sort((a,b)=>b.strength-a.strength);
}

export async function calculateNatalAndTransits(state){
  const profile=state.profiles.find(p=>p.id===state.activeProfileId);
  if(!profile) return {profile:null,natal:null,transit:null,interpretation:null};
  const observer={latitude:Number(profile.latitude),longitude:Number(profile.longitude),timezone:profile.timezone||'UTC'};
  const birthMs=profileDateToUtcMs(profile);
  const natalRaw=await ephemeris.calculateSnapshot(birthMs,observer,state.settings);
  const transitRaw=await ephemeris.calculateSnapshot(state.simulation.utcMs,observer,state.settings);

  const angles=calculateAngles(birthMs,observer);
  const houses=calculateHouses(angles,state.settings.houseSystem);
  const natalPlanets=assignHouses(natalRaw.planets,houses);
  const natalAspects=calculateAspects(natalPlanets,(state.settings.aspectOrb||6)/6);
  const dom=dominance(natalPlanets);
  const natal={
    ...natalRaw,planets:natalPlanets,angles,houses,aspects:natalAspects,dominance:dom,
    ascendantSign:Number.isFinite(angles.ascendant)?signInfo(angles.ascendant):null,
    midheavenSign:Number.isFinite(angles.midheaven)?signInfo(angles.midheaven):null,
    birthUtcMs:birthMs
  };
  const transitAspects=crossAspects(transitRaw.planets,natalPlanets,(state.settings.aspectOrb||6)/6);
  const transit={...transitRaw,natalAspects:transitAspects};
  const interpretation=buildInterpretation(natal,transitAspects);
  return {profile,natal,transit,interpretation};
}
