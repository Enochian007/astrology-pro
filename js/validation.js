
export function validateProfileInput(data){
  const errors=[];
  const name=(data.name||'').trim();
  const date=(data.date||'').trim();
  const time=(data.time||'').trim();
  const timezone=(data.timezone||'').trim();
  const location=(data.location||'').trim();
  const lat=Number(data.latitude), lon=Number(data.longitude);

  if(!name) errors.push('Name is required.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Birth date must be a valid YYYY-MM-DD value.');
  if(!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) errors.push('Birth time must be a valid time.');
  if(!location) errors.push('Location is required.');
  if(!timezone) errors.push('Timezone is required.');
  if(!Number.isFinite(lat) || lat < -90 || lat > 90) errors.push('Latitude must be between -90 and 90.');
  if(!Number.isFinite(lon) || lon < -180 || lon > 180) errors.push('Longitude must be between -180 and 180.');

  try {
    if(timezone) new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format(new Date());
  } catch {
    errors.push('Timezone must be a valid IANA timezone, for example Australia/Brisbane.');
  }

  if(date){
    const d=new Date(`${date}T12:00:00Z`);
    if(Number.isNaN(d.getTime())) errors.push('Birth date is not valid.');
    const year=Number(date.slice(0,4));
    if(year<1800 || year>2200) errors.push('Birth year must be between 1800 and 2200 in this release.');
  }
  return {ok:errors.length===0,errors,normalized:{...data,name,location,timezone,latitude:lat,longitude:lon}};
}
