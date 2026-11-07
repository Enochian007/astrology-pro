
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ELEMENTS=['Fire','Earth','Air','Water'];
const MODALITIES=['Cardinal','Fixed','Mutable'];

export const normalize360=v=>((v%360)+360)%360;
export function angularDistance(a,b){const d=Math.abs(normalize360(a)-normalize360(b));return Math.min(d,360-d)}
export function signInfo(lon){
  const x=normalize360(lon), i=Math.floor(x/30), within=x-i*30;
  return {index:i,name:SIGNS[i],element:ELEMENTS[i%4],modality:MODALITIES[i%3],degree:within};
}
export function formatLongitude(lon){
  const s=signInfo(lon), d=Math.floor(s.degree), m=Math.floor((s.degree-d)*60);
  return `${d}°${String(m).padStart(2,'0')}′ ${s.name}`;
}
export function julianDate(ms){return ms/86400000+2440587.5}
export function meanObliquityDeg(jd){
  const T=(jd-2451545.0)/36525;
  return 23 + 26/60 + (21.448 - 46.815*T - 0.00059*T*T + 0.001813*T*T*T)/3600;
}
export function gmstDeg(jd){
  const T=(jd-2451545.0)/36525;
  return normalize360(280.46061837 + 360.98564736629*(jd-2451545.0) + 0.000387933*T*T - T*T*T/38710000);
}
export function localSiderealDeg(ms, longitudeDeg){return normalize360(gmstDeg(julianDate(ms))+longitudeDeg)}

function eclipticToEquatorial(lonDeg, latDeg, epsDeg){
  const l=lonDeg*Math.PI/180,b=latDeg*Math.PI/180,e=epsDeg*Math.PI/180;
  const sinDec=Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l);
  const dec=Math.asin(sinDec);
  const y=Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e);
  const x=Math.cos(l);
  const ra=Math.atan2(y,x);
  return {ra:normalize360(ra*180/Math.PI),dec:dec*180/Math.PI};
}
function altitudeDeg(raDeg,decDeg,lstDeg,latDeg){
  const H=normalize360(lstDeg-raDeg)*Math.PI/180, d=decDeg*Math.PI/180, p=latDeg*Math.PI/180;
  return Math.asin(Math.sin(p)*Math.sin(d)+Math.cos(p)*Math.cos(d)*Math.cos(H))*180/Math.PI;
}
function azimuthSinCos(raDeg,decDeg,lstDeg,latDeg){
  let H=normalize360(lstDeg-raDeg); if(H>180)H-=360;
  const Hr=H*Math.PI/180,d=decDeg*Math.PI/180,p=latDeg*Math.PI/180;
  const y=-Math.sin(Hr)*Math.cos(d);
  const x=Math.sin(d)*Math.cos(p)-Math.cos(d)*Math.sin(p)*Math.cos(Hr);
  return Math.atan2(y,x)*180/Math.PI; // roughly -180..180 from north-ish convention
}

export function calculateAngles(utcMs, observer){
  const lat=Number(observer.latitude), lon=Number(observer.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)) return {ascendant:null,midheaven:null,warnings:['Observer coordinates missing.']};
  const jd=julianDate(utcMs), eps=meanObliquityDeg(jd), lst=localSiderealDeg(utcMs,lon);

  // Midheaven from RA = local sidereal time, transformed to ecliptic longitude at beta=0.
  // tan(lambda)=tan(alpha)/cos(epsilon); use atan2 form for correct quadrant.
  const a=lst*Math.PI/180,e=eps*Math.PI/180;
  const mc=normalize360(Math.atan2(Math.sin(a)/Math.cos(e),Math.cos(a))*180/Math.PI);

  // Ascendant: numerically solve ecliptic latitude=0 intersection with apparent horizon.
  // Scan 0..360 for horizon crossings, choose the eastern crossing.
  const samples=[];
  for(let L=0;L<=360;L+=1){
    const eq=eclipticToEquatorial(L,0,eps);
    samples.push({L,alt:altitudeDeg(eq.ra,eq.dec,lst,lat),az:azimuthSinCos(eq.ra,eq.dec,lst,lat)});
  }
  let candidates=[];
  for(let i=0;i<samples.length-1;i++){
    const a1=samples[i],a2=samples[i+1];
    if(a1.alt===0 || a1.alt*a2.alt<0){
      let lo=a1.L,hi=a2.L;
      for(let k=0;k<24;k++){
        const mid=(lo+hi)/2, eq=eclipticToEquatorial(mid,0,eps), alt=altitudeDeg(eq.ra,eq.dec,lst,lat);
        const eqlo=eclipticToEquatorial(lo,0,eps), altlo=altitudeDeg(eqlo.ra,eqlo.dec,lst,lat);
        if(altlo===0 || altlo*alt<=0) hi=mid; else lo=mid;
      }
      const L=normalize360((lo+hi)/2), eq=eclipticToEquatorial(L,0,eps);
      candidates.push({lon:L,az:azimuthSinCos(eq.ra,eq.dec,lst,lat)});
    }
  }
  // Eastern point corresponds approximately negative azimuth / eastward half-plane in this convention.
  // If ambiguous, choose candidate ~90° away from descendant relation and closest to MC-90°.
  let asc=null;
  if(candidates.length){
    const east=candidates.filter(c=>c.az<0);
    const pool=east.length?east:candidates;
    const target=normalize360(mc-90);
    pool.sort((x,y)=>angularDistance(x.lon,target)-angularDistance(y.lon,target));
    asc=pool[0].lon;
  }
  const warnings=[];
  if(Math.abs(lat)>66.5) warnings.push('High-latitude geometry may make quadrant-house methods unstable.');
  return {ascendant:asc,midheaven:mc,lst,obliquity:eps,warnings};
}

export function calculateHouses(angles,system='whole'){
  const asc=angles?.ascendant;
  if(!Number.isFinite(asc)) return {system,cusps:[],warning:'Ascendant unavailable.'};
  if(system==='placidus'){
    return {system,cusps:[],warning:'Placidus house cusps are not implemented in this build. Choose Whole Sign or Equal houses.'};
  }
  if(system==='whole'){
    const start=Math.floor(normalize360(asc)/30)*30;
    return {system,cusps:Array.from({length:12},(_,i)=>normalize360(start+i*30)),warning:null};
  }
  if(system==='equal'){
    return {system,cusps:Array.from({length:12},(_,i)=>normalize360(asc+i*30)),warning:null};
  }
  return {system,cusps:[],warning:`Unsupported house system: ${system}`};
}

export function houseForLongitude(lon,houses){
  if(!houses?.cusps?.length) return null;
  const x=normalize360(lon), c=houses.cusps;
  for(let i=0;i<12;i++){
    const start=c[i],end=c[(i+1)%12];
    const span=normalize360(end-start), rel=normalize360(x-start);
    if(rel<span || Math.abs(rel-span)<1e-9) return i+1;
  }
  return null;
}

const ASPECT_DEFS=[
  {id:'conjunction',name:'Conjunction',symbol:'☌',angle:0,orb:8},
  {id:'sextile',name:'Sextile',symbol:'⚹',angle:60,orb:5},
  {id:'square',name:'Square',symbol:'□',angle:90,orb:7},
  {id:'trine',name:'Trine',symbol:'△',angle:120,orb:7},
  {id:'opposition',name:'Opposition',symbol:'☍',angle:180,orb:8}
];

function signedSep(a,b){
  let d=normalize360(b-a); if(d>180)d-=360; return d;
}
export function calculateAspects(planets,orbScale=1){
  const out=[];
  for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++){
    const A=planets[i],B=planets[j];
    if(A.id==='earth'||B.id==='earth')continue;
    const la=A.geocentric.longitude,lb=B.geocentric.longitude, sep=angularDistance(la,lb);
    for(const d of ASPECT_DEFS){
      const allowed=d.orb*orbScale, orb=Math.abs(sep-d.angle);
      if(orb<=allowed){
        const va=A.speedLongitude||0,vb=B.speedLongitude||0;
        const nowErr=Math.abs(angularDistance(la,lb)-d.angle);
        const futureErr=Math.abs(angularDistance(la+va/24,lb+vb/24)-d.angle);
        out.push({
          a:A.name,b:B.name,aId:A.id,bId:B.id,type:d.name,id:d.id,symbol:d.symbol,angle:d.angle,orb,
          phase:futureErr<nowErr?'Applying':'Separating',
          strength:Math.max(0,Math.round((1-orb/allowed)*100))
        });
      }
    }
  }
  return out.sort((x,y)=>y.strength-x.strength||x.orb-y.orb);
}

export function assignHouses(planets,houses){
  return planets.map(p=>({...p,house:houseForLongitude(p.geocentric.longitude,houses)}));
}
export function dominance(planets){
  const ids=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn']);
  const e={Fire:0,Earth:0,Air:0,Water:0},m={Cardinal:0,Fixed:0,Mutable:0};
  for(const p of planets){
    if(!ids.has(p.id))continue;
    const s=signInfo(p.geocentric.longitude); e[s.element]++;m[s.modality]++;
  }
  const top=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
  return {elements:e,modalities:m,dominantElement:top(e),dominantModality:top(m)};
}
