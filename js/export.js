import {getState} from './state.js';
import {getSnapshot} from './astronomy/service.js';
import {calculateNatalAndTransits} from './astrology/service.js';

export async function exportHtml(){
  const s=getState(),p=s.profiles.find(x=>x.id===s.activeProfileId);
  const snap=await getSnapshot(s);
  const bundle=p?await calculateNatalAndTransits(s):null;
  const natal=bundle?.natal,interp=bundle?.interpretation;
  const planets=(natal?.planets||snap.planets).filter(x=>x.id!=='earth');
  const rows=planets.map(x=>`<tr><td>${x.glyph} ${x.name}</td><td>${x.zodiac.display}</td><td>${x.house||'—'}</td><td>${x.motion}</td></tr>`).join('');
  const houseRows=natal?.houses?.cusps?.length?natal.houses.cusps.map((c,i)=>`<tr><td>${i+1}</td><td>${c.toFixed(2)}°</td></tr>`).join(''):'<tr><td colspan="2">House cusps unavailable for the selected system.</td></tr>';
  const aspectRows=(natal?.aspects||[]).slice(0,15).map(a=>`<tr><td>${a.a} ${a.symbol} ${a.b}</td><td>${a.orb.toFixed(2)}°</td><td>${a.phase}</td><td>${a.strength}%</td></tr>`).join('');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>AstrologyPro Report</title><style>
  body{font-family:system-ui;max-width:960px;margin:40px auto;padding:0 20px;color:#1b2430}table{width:100%;border-collapse:collapse;margin:16px 0 28px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}.note{color:#666}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{border:1px solid #ddd;border-radius:12px;padding:16px}@media print{body{margin:0}.card{break-inside:avoid}}</style></head><body>
  <h1>AstrologyPro Report</h1><p>${p?p.name:'No profile'} • ${new Date(s.simulation.utcMs).toLocaleString()}</p>
  <p>Ephemeris: ${snap.metadata.ephemeris}</p>
  ${natal?`<p><strong>Ascendant:</strong> ${Number.isFinite(natal.angles.ascendant)?natal.angles.ascendant.toFixed(2)+'° '+natal.ascendantSign.name:'—'} &nbsp; <strong>MC:</strong> ${Number.isFinite(natal.angles.midheaven)?natal.angles.midheaven.toFixed(2)+'° '+natal.midheavenSign.name:'—'}</p>`:''}
  <h2>Planet positions</h2><table><tr><th>Planet</th><th>Position</th><th>House</th><th>Motion</th></tr>${rows}</table>
  <h2>Houses</h2><table><tr><th>House</th><th>Cusp</th></tr>${houseRows}</table>
  <h2>Major aspects</h2><table><tr><th>Aspect</th><th>Orb</th><th>Phase</th><th>Strength</th></tr>${aspectRows}</table>
  ${interp?`<h2>Interpretation</h2><div class="grid"><div class="card"><h3>Overview</h3><p>${interp.overview}</p></div><div class="card"><h3>Career</h3><p>${interp.career}</p></div><div class="card"><h3>Relationships</h3><p>${interp.relationships}</p></div><div class="card"><h3>Strengths</h3><p>${interp.strengths}</p></div><div class="card"><h3>Growth areas</h3><p>${interp.growthAreas}</p></div><div class="card"><h3>Current transits</h3><p>${interp.transitSummary}</p></div></div><p class="note">${interp.disclaimer}</p>`:''}
  <p class="note">Whole Sign and Equal houses are supported in this build. Placidus is intentionally withheld until a validated quadrant-house implementation is added.</p></body></html>`;
  const blob=new Blob([html],{type:'text/html'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='astrologypro-report.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
