const PLANETS = [
  ['mercury','Mercury','☿'],
  ['venus','Venus','♀'],
  ['earth','Earth','⊕'],
  ['mars','Mars','♂'],
  ['jupiter','Jupiter','♃'],
  ['saturn','Saturn','♄'],
  ['uranus','Uranus','♅'],
  ['neptune','Neptune','♆'],
  ['pluto','Pluto','♇']
];

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function norm360(v){return ((v%360)+360)%360}
function zodiac(longitude){
  const lon=norm360(longitude), i=Math.floor(lon/30), within=lon-i*30;
  const deg=Math.floor(within), min=Math.floor((within-deg)*60);
  return {longitude:lon,sign:SIGNS[i],signIndex:i,degree:within,display:`${deg}°${String(min).padStart(2,'0')}′ ${SIGNS[i]}`};
}
function bodyEnum(A,name){return A.Body?.[name] ?? name}
function vecToEcliptic(x,y,z){
  const r=Math.hypot(x,y,z)||1;
  return {
    longitude:norm360(Math.atan2(y,x)*180/Math.PI),
    latitude:Math.asin(z/r)*180/Math.PI,
    distanceAU:r
  };
}
function helio(A,name,date){
  if(name==='Sun') return {x:0,y:0,z:0,distanceAU:0,longitude:0,latitude:0};
  const v=A.HelioVector(bodyEnum(A,name),date);
  const e=vecToEcliptic(v.x,v.y,v.z);
  return {x:v.x,y:v.y,z:v.z,...e};
}
function geo(A,name,date){
  if(name==='Earth') return {x:0,y:0,z:0,distanceAU:0,longitude:0,latitude:0};
  const v=A.GeoVector(bodyEnum(A,name),date,true);
  const e=vecToEcliptic(v.x,v.y,v.z);
  let longitude=e.longitude;
  try {
    if(A.EclipticLongitude && name!=='Earth') longitude=norm360(A.EclipticLongitude(bodyEnum(A,name),date));
  } catch {}
  return {x:v.x,y:v.y,z:v.z,...e,longitude};
}
function longitudeAt(A,name,date){
  if(name==='Earth') return 0;
  try { return norm360(A.EclipticLongitude(bodyEnum(A,name),date)); }
  catch { return geo(A,name,date).longitude; }
}
function signedAngleDelta(a,b){
  let d=norm360(b)-norm360(a);
  if(d>180)d-=360;if(d<-180)d+=360;
  return d;
}
function jdFromDate(date){return date.getTime()/86400000+2440587.5}
function houseApprox(longitude){
  // Deliberately not presented as a true house calculation.
  return Math.floor(norm360(longitude)/30)+1;
}
function majorAspects(planets){
  const defs=[['Conjunction','☌',0,8],['Sextile','⚹',60,5],['Square','□',90,7],['Trine','△',120,7],['Opposition','☍',180,8]];
  const out=[];
  for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++){
    const a=planets[i],b=planets[j];
    if(a.id==='earth'||b.id==='earth') continue;
    let sep=Math.abs(a.geocentric.longitude-b.geocentric.longitude);sep=Math.min(sep,360-sep);
    for(const [type,symbol,angle,orbAllowed] of defs){
      const orb=Math.abs(sep-angle);
      if(orb<=orbAllowed) out.push({a:a.name,b:b.name,type,symbol,orb,phase:'—',strength:Math.max(0,Math.round((1-orb/orbAllowed)*100))});
    }
  }
  return out.sort((x,y)=>y.strength-x.strength);
}

export class EphemerisProvider {
  constructor(){this.ready=false}
  async initialize(){
    if(!globalThis.Astronomy) throw new Error('Astronomy Engine failed to load. Check your network/CDN access.');
    this.ready=true; return true;
  }
  async calculateSnapshot(utcMs, observer={}, settings={}){
    if(!this.ready) await this.initialize();
    const A=globalThis.Astronomy, date=new Date(utcMs);
    const planets=PLANETS
      .filter(([id])=>id!=='pluto'||settings.showPluto!==false)
      .map(([id,name,glyph])=>{
        const h=helio(A,name,date), g=geo(A,name,date);
        const before=new Date(utcMs-6*3600000), after=new Date(utcMs+6*3600000);
        const speed=signedAngleDelta(longitudeAt(A,name,before),longitudeAt(A,name,after))/0.5;
        const zp=zodiac(g.longitude);
        return {id,name,glyph,heliocentric:h,geocentric:g,zodiac:zp,motion: speed < -0.0001 ? 'Retrograde' : Math.abs(speed)<0.0001 ? 'Stationary' : 'Direct',speedLongitude:speed};
      });

    // Sun apparent geocentric longitude is useful to astrology tables.
    let sunLon=0;
    try { sunLon=norm360(A.SunPosition(date).elon ?? A.SunPosition(date).lon ?? 0); } catch {
      try { sunLon=norm360(A.EclipticLongitude(bodyEnum(A,'Sun'),date)); } catch {}
    }
    const sunZ=zodiac(sunLon);
    const sun={id:'sun',name:'Sun',glyph:'☉',heliocentric:{x:0,y:0,z:0,distanceAU:0,longitude:0,latitude:0},geocentric:{longitude:sunLon,latitude:0,distanceAU:1},zodiac:sunZ,motion:'Direct',speedLongitude:0.9856};

    const all=[sun,...planets];
    const aspects=majorAspects(all);
    return {
      id:`snap-${utcMs}`,
      instant:{utcMs,julianDay:jdFromDate(date),isoUTC:date.toISOString()},
      observer,
      planets:all,
      aspects:{current:aspects,natalToTransit:[]},
      houses:null,
      metadata:{ephemeris:'Astronomy Engine 2.1.19',coordinate:'Tropical apparent geocentric + heliocentric J2000 vectors',houseSystem:settings.houseSystem||'not-calculated'},
      warnings:['Planetary positions use Astronomy Engine. House cusps/Ascendant are not yet calculated in this step.']
    };
  }
}
export const ephemeris = new EphemerisProvider();
