import {getState,setState,update} from './state.js';
import {getSnapshot} from './astronomy/service.js';
import {CelestialRenderer} from './celestial/renderer.js';
import {calculateNatalAndTransits} from './astrology/service.js';
import {validateProfileInput} from './validation.js';

const routes=[
  ['celestial','☉','Celestial'],['birth','◎','Birth Chart'],['horoscope','✦','Horoscope'],['profiles','♙','Profiles'],['settings','⚙','Settings']
];
const el=id=>document.getElementById(id);
const fmtDate=ms=>new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'2-digit'}).format(new Date(ms));
const fmtTime=ms=>new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(ms));
const activeProfile=s=>s.profiles.find(p=>p.id===s.activeProfileId)||null;
function navMarkup(s){return routes.map(([id,icon,label])=>`<button class="nav-link ${s.route===id?'active':''}" data-route="${id}"><span>${icon}</span><span class="nav-label">${label}</span></button>`).join('')}
function pageHeader(title,subtitle,action=''){return `<div class="page-header"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`}
function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function noProfile(){return `<div class="card"><div class="empty"><h2>Create your first birth chart</h2><p>Enter a birth date, time and location to generate a chart and interpretation workspace.</p><button class="btn primary" data-action="new-profile">Create chart</button></div></div>`}
function celestial(snapshot){
  const state=getState(), selected=snapshot?.planets?.find(p=>p.id===(window.__selectedBody||'jupiter')) || snapshot?.planets?.find(p=>p.id==='jupiter');
  const pos=selected?.zodiac?.display||'—', motion=selected?.motion||'—', dist=selected?.heliocentric?.distanceAU;
  return `<div class="page">${pageHeader('Celestial','Astronomical solar-system view synchronized to the shared simulation clock.','<div style="display:flex;gap:8px"><button class="btn" data-camera-reset>Reset view</button><button class="btn" data-action="display-settings">Display ⚙</button></div>')}
  <div class="split">
    <section class="card"><div class="card-header"><h2>Solar System</h2><select data-setting="celestialView"><option value="heliocentric" ${state.settings.celestialView==='heliocentric'?'selected':''}>Heliocentric</option><option value="geocentric" ${state.settings.celestialView==='geocentric'?'selected':''}>Geocentric</option><option value="topdown" ${state.settings.celestialView==='topdown'?'selected':''}>Top-down</option><option value="perspective" ${state.settings.celestialView==='perspective'?'selected':''}>Perspective</option></select></div>
      <div class="celestial-stage"><canvas id="celestialCanvas" style="width:100%;height:100%;position:absolute;inset:0;touch-action:none" aria-label="Interactive solar system display"></canvas></div>
    </section>
    <aside class="card"><div class="card-header"><h2>Planet Inspector</h2></div><div class="card-body">
      <div class="stat"><small class="muted">Selected body</small><h2 style="margin:6px 0">${selected?.glyph||''} ${selected?.name||'Select a planet'}</h2></div>
      <div class="kpi-row" style="grid-template-columns:1fr 1fr"><div class="kpi"><span>Zodiac position</span><strong>${pos}</strong></div><div class="kpi"><span>Motion</span><strong>${motion}</strong></div><div class="kpi"><span>Heliocentric distance</span><strong>${Number.isFinite(dist)?dist.toFixed(3)+' AU':'—'}</strong></div><div class="kpi"><span>Julian date</span><strong>${snapshot?.instant?.julianDay?.toFixed(4)||'—'}</strong></div></div>
      <p class="muted" style="margin-top:18px">Drag to pan, use the wheel/pinch gesture to zoom, click a planet to inspect it, and double-click to reset.</p>
      <small class="muted">${snapshot?.metadata?.ephemeris||'Loading ephemeris…'}</small>
    </div></aside>
  </div></div>`;
}
function birth(snapshot,profile,bundle){
  if(!profile)return `<div class="page">${pageHeader('Birth Chart','Natal wheel, planets, houses and aspects.')}${noProfile()}</div>`;
  const natal=bundle?.natal;if(!natal)return `<div class="page">${pageHeader('Birth Chart','Natal calculation unavailable.')}</div>`;
  const st=getState(),tab=st.birthChart.tab;
  const tabs=['planets','houses','aspects'].map(x=>`<button class="tab ${tab===x?'active':''}" data-tab="${x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join('');
  let body='';
  if(tab==='planets')body=table(['Planet','Position','House','Motion'],natal.planets.filter(p=>p.id!=='earth').map(p=>[`${p.glyph} ${p.name}`,p.zodiac.display,p.house||'—',p.motion]));
  if(tab==='houses')body=natal.houses.cusps.length?table(['House','Cusp'],natal.houses.cusps.map((c,i)=>[i+1,`${c.toFixed(2)}°`])):`<div class="empty"><strong>House cusps unavailable</strong><p>${natal.houses.warning||'No house data.'}</p></div>`;
  if(tab==='aspects')body=table(['Body A','Aspect','Body B','Orb','Phase','Strength'],natal.aspects.map(a=>[a.a,`${a.symbol} ${a.type}`,a.b,`${a.orb.toFixed(2)}°`,a.phase,`${a.strength}%`]));
  const asc=Number.isFinite(natal.angles.ascendant)?`${natal.angles.ascendant.toFixed(2)}° ${natal.ascendantSign.name}`:'—';
  const mc=Number.isFinite(natal.angles.midheaven)?`${natal.angles.midheaven.toFixed(2)}° ${natal.midheavenSign.name}`:'—';
  return `<div class="page">${pageHeader('Birth Chart',`${profile.name} • ${profile.date} • ${profile.time} • ${profile.location}`)}
    <div class="card"><div class="card-body"><div class="kpi-row">
      <div class="kpi"><span>Ascendant</span><strong>${asc}</strong></div>
      <div class="kpi"><span>Midheaven</span><strong>${mc}</strong></div>
      <div class="kpi"><span>Dominant element</span><strong>${natal.dominance.dominantElement}</strong></div>
      <div class="kpi"><span>Dominant modality</span><strong>${natal.dominance.dominantModality}</strong></div>
    </div></div>
    <div class="card-header"><div class="tabs">${tabs}</div><span class="muted">${natal.houses.system}${natal.houses.warning?' • '+natal.houses.warning:''}</span></div>${body}</div></div>`;
}
function horoscope(snapshot,profile,bundle){
  if(!profile)return `<div class="page">${pageHeader('Horoscope','Concise interpretation for the selected date.')}${noProfile()}</div>`;
  const i=bundle?.interpretation;if(!i)return `<div class="page">${pageHeader('Horoscope','Interpretation unavailable.')}</div>`;
  const placementCards=['sun','moon','ascendant','mercury','venus','mars','jupiter','saturn'].filter(k=>i.placements[k]).map(k=>[` ${k[0].toUpperCase()+k.slice(1)}`,i.placements[k]]);
  const cards=[
    ['Overview',i.overview],['Career',i.career],['Relationships',i.relationships],['Strengths',i.strengths],['Growth Areas',i.growthAreas],['Current Transits',i.transitSummary],
    ...placementCards
  ];
  return `<div class="page">${pageHeader('Horoscope',`${profile.name} • ${fmtDate(snapshot.instant.utcMs)}`)}
    <div class="card" style="margin-bottom:16px"><div class="card-body"><strong>Interpretive guidance</strong><p class="muted">${i.disclaimer}</p></div></div>
    <div class="grid grid-2">${cards.map(([h,p])=>`<article class="card horoscope-card"><div class="card-header"><h2>${h}</h2></div><div class="card-body"><p>${p}</p></div></article>`).join('')}</div>
    <div class="card" style="margin-top:16px"><div class="card-header"><h2>Three strongest natal aspects</h2></div>${table(['Aspect','Orb','Phase','Strength'],i.strongestAspects.map(a=>[`${a.a} ${a.symbol} ${a.b}`,`${a.orb.toFixed(2)}°`,a.phase,`${a.strength}%`]))}</div>
  </div>`;
}
function profilesPage(s){
  return `<div class="page">${pageHeader('Profiles','Birth charts saved locally in this browser.','<button class="btn primary" data-action="new-profile">+ New profile</button>')}
    <div class="card"><div class="card-body">${s.profiles.length?s.profiles.map(p=>`<div class="profile-card"><div><h3>${p.name}</h3><p>${p.date} • ${p.time} • ${p.location}</p></div><div><button class="btn" data-open-profile="${p.id}">Open</button> <button class="btn danger" data-delete-profile="${p.id}">Delete</button></div></div>`).join(''):'<div class="empty">No profiles saved yet.</div>'}</div></div></div>`;
}
function settingsPage(s){
  const x=s.settings;
  return `<div class="page">${pageHeader('Settings','Appearance, astrology and celestial display preferences.')}
  <div class="grid grid-2">
    <section class="card"><div class="card-header"><h2>Appearance</h2></div><div class="card-body">
      <div class="setting-row"><div><strong>Theme</strong><p>Switch between dark and light modes.</p></div><select data-setting="theme"><option value="dark" ${s.theme==='dark'?'selected':''}>Dark</option><option value="light" ${s.theme==='light'?'selected':''}>Light</option></select></div>
    </div></section>
    <section class="card"><div class="card-header"><h2>Astrology</h2></div><div class="card-body">
      <div class="setting-row"><div><strong>House system</strong><p>Default calculation system.</p></div><select data-setting="houseSystem"><option value="whole" ${x.houseSystem==='whole'?'selected':''}>Whole Sign</option><option value="equal" ${x.houseSystem==='equal'?'selected':''}>Equal</option><option value="placidus" ${x.houseSystem==='placidus'?'selected':''}>Placidus (not implemented)</option></select></div>
      <div class="setting-row"><div><strong>Aspect orb</strong><p>Default major-aspect orb.</p></div><input data-setting="aspectOrb" type="number" min="1" max="10" value="${x.aspectOrb}" style="width:80px"></div>
    </div></section>
    <section class="card"><div class="card-header"><h2>Celestial Display</h2></div><div class="card-body">
      <div class="setting-row"><div><strong>Default view</strong></div><select data-setting="celestialView"><option value="heliocentric">Heliocentric</option><option value="geocentric">Geocentric</option><option value="topdown">Top-down</option><option value="perspective">Perspective</option></select></div>
      <div class="setting-row"><div><strong>Orbit paths</strong></div><input data-setting="showOrbits" type="checkbox" ${x.showOrbits?'checked':''}></div>
      <div class="setting-row"><div><strong>Zodiac ring</strong></div><input data-setting="showZodiac" type="checkbox" ${x.showZodiac?'checked':''}></div>
    </div></section>
    <section class="card"><div class="card-header"><h2>Calculation information</h2></div><div class="card-body"><p class="muted">Planetary astronomy uses Astronomy Engine 2.1.19. Whole Sign and Equal houses are supported. Placidus is intentionally unavailable until a validated implementation is added. Astrology text is interpretive guidance, not scientific prediction.</p></div></section>
  </div></div>`;
}
let renderSeq=0, celestialRenderer=null;
export async function render(){
  const seq=++renderSeq, s=getState(),profile=activeProfile(s);
  document.documentElement.dataset.theme=s.theme;
  el('desktopNav').innerHTML=navMarkup(s);el('mobileNav').innerHTML=navMarkup(s);
  el('profileName').textContent=profile?.name||'No profile';
  el('headerDate').textContent=fmtDate(s.simulation.utcMs);el('headerTime').textContent=fmtTime(s.simulation.utcMs);
  el('liveBadge').textContent=s.simulation.mode==='live'?'LIVE':s.simulation.mode.toUpperCase();
  el('timelineDate').textContent=`${fmtDate(s.simulation.utcMs)} • ${fmtTime(s.simulation.utcMs)}`;
  el('playPause').textContent=s.simulation.playing?'❚❚':'▶';
  const root=el('workspaceRoot');
  root.innerHTML=`<div class="page"><div class="card"><div class="empty">Calculating astronomical positions…</div></div></div>`;
  try{
    const snapshot=await getSnapshot(s); if(seq!==renderSeq)return;
    const bundle=profile && (s.route==='birth'||s.route==='horoscope') ? await calculateNatalAndTransits(s) : null;
    if(seq!==renderSeq)return;
    if(celestialRenderer){celestialRenderer.dispose();celestialRenderer=null}
    root.innerHTML=s.route==='celestial'?celestial(snapshot):s.route==='birth'?birth(snapshot,profile,bundle):s.route==='horoscope'?horoscope(snapshot,profile,bundle):s.route==='profiles'?profilesPage(s):settingsPage(s);
    bindDynamic();
    if(s.route==='celestial'){
      const canvas=document.getElementById('celestialCanvas');
      celestialRenderer=new CelestialRenderer(canvas,getState,id=>{window.__selectedBody=id;render()});
      celestialRenderer.update(snapshot);
      const reset=document.querySelector('[data-camera-reset]');if(reset)reset.onclick=()=>{celestialRenderer.camera.zoom=1;celestialRenderer.camera.panX=0;celestialRenderer.camera.panY=0;celestialRenderer.render()}
    }
  }catch(err){
    root.innerHTML=`<div class="page">${pageHeader('Astronomy engine unavailable','The interface shell is still available, but live astronomical calculations could not load.')}<div class="card"><div class="empty"><h2>Ephemeris failed to load</h2><p>${err.message}</p><p>Check internet access to the Astronomy Engine CDN or vendor the dependency locally for offline deployments.</p></div></div></div>`;
    bindDynamic();
  }
}
function bindDynamic(){
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>setState(s=>({...s,route:b.dataset.route})));
  document.querySelectorAll('[data-action="new-profile"]').forEach(b=>b.onclick=openProfileDialog);
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setState(s=>({...s,birthChart:{...s.birthChart,tab:b.dataset.tab}})));
  document.querySelectorAll('[data-open-profile]').forEach(b=>b.onclick=()=>setState(s=>({...s,activeProfileId:b.dataset.openProfile,route:'birth'})));
  document.querySelectorAll('[data-delete-profile]').forEach(b=>b.onclick=()=>{if(confirm('Delete this saved profile?'))setState(s=>({...s,profiles:s.profiles.filter(p=>p.id!==b.dataset.deleteProfile),activeProfileId:s.activeProfileId===b.dataset.deleteProfile?null:s.activeProfileId}))});
  document.querySelectorAll('[data-setting]').forEach(c=>c.onchange=()=>{const k=c.dataset.setting;if(k==='theme')return setState(s=>({...s,theme:c.value}));const v=c.type==='checkbox'?c.checked:c.type==='number'?Number(c.value):c.value;setState(s=>({...s,settings:{...s.settings,[k]:v}}))});
}
export function openProfileDialog(){
  el('dialogRoot').innerHTML=`<div class="dialog-backdrop" role="presentation"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="profileDialogTitle">
  <div class="dialog-head"><h2 id="profileDialogTitle">New birth chart</h2><button class="icon-button" data-close>×</button></div>
  <form id="profileForm"><div class="dialog-body"><div class="form-grid">
    <div class="field full"><label>Name</label><input name="name" type="text" required placeholder="Profile name"></div>
    <div class="field"><label>Birth date</label><input name="date" type="date" required></div>
    <div class="field"><label>Birth time</label><input name="time" type="time" required></div>
    <div class="field full"><label>Location</label><input name="location" type="text" required placeholder="Brisbane, Queensland, Australia"></div>
    <div class="field"><label>Timezone</label><input name="timezone" type="text" required value="Australia/Brisbane"></div>
    <div class="field"><label>Latitude</label><input name="latitude" type="number" step="any" value="-27.47"></div>
    <div class="field"><label>Longitude</label><input name="longitude" type="number" step="any" value="153.03"></div>
  </div></div><div class="dialog-foot"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Create chart</button></div></form></div></div>`;
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>el('dialogRoot').innerHTML='');
  el('profileForm').onsubmit=e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget), raw=Object.fromEntries(f.entries());
    const check=validateProfileInput(raw);
    let errorBox=document.getElementById('profileErrors');
    if(!errorBox){errorBox=document.createElement('div');errorBox.id='profileErrors';errorBox.className='card';errorBox.style.margin='0 0 14px';e.currentTarget.querySelector('.dialog-body').prepend(errorBox)}
    if(!check.ok){
      errorBox.innerHTML=`<div class="card-body" style="color:var(--danger)"><strong>Please fix the following:</strong><ul>${check.errors.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
      return;
    }
    errorBox.remove();
    const p=check.normalized;p.id=(crypto.randomUUID?crypto.randomUUID():`profile-${Date.now()}`);
    setState(s=>({...s,profiles:[...s.profiles,p],activeProfileId:p.id,route:'birth'}));
    el('dialogRoot').innerHTML='';toast('Birth chart saved locally.')
  }
}
export function toast(msg){const n=document.createElement('div');n.className='toast';n.textContent=msg;el('toastRoot').append(n);setTimeout(()=>n.remove(),2400)}
