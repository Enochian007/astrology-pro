const BODY_STYLE={
  sun:{r:12,label:'Sun'},mercury:{r:4,label:'Mercury'},venus:{r:6,label:'Venus'},
  earth:{r:6,label:'Earth'},mars:{r:5,label:'Mars'},jupiter:{r:9,label:'Jupiter'},
  saturn:{r:8,label:'Saturn'},uranus:{r:7,label:'Uranus'},neptune:{r:7,label:'Neptune'},pluto:{r:4,label:'Pluto'}
};
const ZODIAC=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
function mapRadius(au){return au<=0?0:Math.pow(au,0.55)}
export class CelestialRenderer{
  constructor(canvas,stateGetter,onSelect=()=>{}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getState=stateGetter;this.onSelect=onSelect;
    this.snapshot=null;this.dpr=Math.min(devicePixelRatio||1,2);this.camera={zoom:1,panX:0,panY:0,rotation:0,tilt:.08};
    this.selected='jupiter';this.points=[];this.drag=null;this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas.parentElement);this.bind();this.resize();
  }
  resize(){
    const r=this.canvas.getBoundingClientRect(), d=this.dpr;
    this.canvas.width=Math.max(1,Math.round(r.width*d));this.canvas.height=Math.max(1,Math.round(r.height*d));
    this.ctx.setTransform(d,0,0,d,0,0);this.render();
  }
  update(snapshot){this.snapshot=snapshot;this.render()}
  project(v,mode){
    if(mode==='geocentric') v=v.geocentric; else v=v.heliocentric;
    const rect=this.canvas.getBoundingClientRect(),cx=rect.width/2+this.camera.panX,cy=rect.height/2+this.camera.panY;
    const maxR=Math.min(rect.width,rect.height)*.42*this.camera.zoom;
    const distance=mapRadius(v.distanceAU||Math.hypot(v.x||0,v.y||0,v.z||0)), maxMapped=mapRadius(30.1);
    const ang=Math.atan2(v.y||0,v.x||0)+this.camera.rotation, rr=(distance/maxMapped)*maxR;
    const tilt=(mode==='topdown'?1:.72);
    return {x:cx+Math.cos(ang)*rr,y:cy+Math.sin(ang)*rr*tilt};
  }
  render(){
    const c=this.ctx,rect=this.canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;
    c.clearRect(0,0,w,h);this.drawBackdrop(c,w,h);
    if(!this.snapshot)return;
    const s=this.getState(),mode=s.settings.celestialView||'heliocentric';
    if(s.settings.showZodiac) this.drawZodiac(c,w,h);
    if(s.settings.showOrbits && mode!=='geocentric') this.drawOrbits(c,w,h);
    this.points=[];
    for(const p of this.snapshot.planets){
      if(mode==='geocentric'&&p.id==='earth') continue;
      const pos=p.id==='sun'&&mode!=='geocentric'?{x:w/2+this.camera.panX,y:h/2+this.camera.panY}:this.project(p,mode);
      this.drawBody(c,p,pos,s.settings.showLabels!==false);
      this.points.push({id:p.id,x:pos.x,y:pos.y,r:(BODY_STYLE[p.id]?.r||5)+8});
    }
    if(mode==='geocentric'){
      const x=w/2+this.camera.panX,y=h/2+this.camera.panY;c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fillStyle='#6ca0ff';c.fill();c.fillStyle='rgba(255,255,255,.85)';c.font='12px system-ui';c.fillText('Earth',x+12,y+4);
    }
  }
  drawBackdrop(c,w,h){
    const g=c.createRadialGradient(w*.5,h*.5,20,w*.5,h*.5,Math.max(w,h)*.7);
    g.addColorStop(0,'#101d35');g.addColorStop(1,'#030711');c.fillStyle=g;c.fillRect(0,0,w,h);
    c.save();c.fillStyle='rgba(255,255,255,.35)';
    for(let i=0;i<90;i++){const x=(i*97.13)%w,y=(i*i*13.7+41)%h;c.fillRect(x,y,(i%7===0?1.5:.7),(i%7===0?1.5:.7))}
    c.restore();
  }
  drawOrbits(c,w,h){
    const radii=[.39,.72,1,1.52,5.2,9.58,19.2,30.05];
    c.save();c.strokeStyle='rgba(255,255,255,.10)';c.lineWidth=1;
    for(const au of radii){
      const rr=mapRadius(au)/mapRadius(30.1)*Math.min(w,h)*.42*this.camera.zoom;
      c.beginPath();c.ellipse(w/2+this.camera.panX,h/2+this.camera.panY,rr,rr*.72,0,0,Math.PI*2);c.stroke();
    }c.restore();
  }
  drawZodiac(c,w,h){
    const r=Math.min(w,h)*.47;c.save();c.translate(w/2+this.camera.panX,h/2+this.camera.panY);
    c.strokeStyle='rgba(215,184,108,.18)';c.fillStyle='rgba(215,184,108,.6)';c.font='14px system-ui';c.textAlign='center';c.textBaseline='middle';
    c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6-Math.PI/2;c.fillText(ZODIAC[i],Math.cos(a)*r,Math.sin(a)*r)}
    c.restore();
  }
  drawBody(c,p,pos,showLabel){
    const style=BODY_STYLE[p.id]||{r:5};let r=style.r;
    if(p.id==='sun'){c.shadowColor='rgba(255,190,80,.8)';c.shadowBlur=28;c.fillStyle='#ffcc62'}
    else {c.shadowBlur=12;c.shadowColor='rgba(130,170,255,.5)';c.fillStyle=p.id==='mars'?'#d77b57':p.id==='jupiter'?'#d8ae7c':p.id==='saturn'?'#d7c08a':p.id==='venus'?'#e0c695':p.id==='earth'?'#6fa7ff':'#a6b8d8'}
    c.beginPath();c.arc(pos.x,pos.y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;
    if(this.selected===p.id){c.strokeStyle='#f1ce76';c.lineWidth=2;c.beginPath();c.arc(pos.x,pos.y,r+6,0,Math.PI*2);c.stroke()}
    if(showLabel){c.fillStyle='rgba(245,248,255,.88)';c.font='12px system-ui';c.textAlign='left';c.fillText(`${p.glyph} ${p.name}`,pos.x+r+7,pos.y+4)}
  }
  bind(){
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.camera.zoom=Math.min(3,Math.max(.45,this.camera.zoom*(e.deltaY<0?1.1:.9)));this.render()},{passive:false});
    this.canvas.addEventListener('pointerdown',e=>{this.canvas.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,panX:this.camera.panX,panY:this.camera.panY}});
    this.canvas.addEventListener('pointermove',e=>{if(this.drag){this.camera.panX=this.drag.panX+e.clientX-this.drag.x;this.camera.panY=this.drag.panY+e.clientY-this.drag.y;this.render()}});
    this.canvas.addEventListener('pointerup',e=>{if(this.drag && Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)<6)this.hit(e);this.drag=null});
    this.canvas.addEventListener('dblclick',()=>{this.camera={...this.camera,zoom:1,panX:0,panY:0};this.render()});
  }
  hit(e){
    const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    const p=this.points.find(q=>Math.hypot(x-q.x,y-q.y)<=q.r);if(p){this.selected=p.id;this.onSelect(p.id);this.render()}
  }
  dispose(){this.resizeObserver.disconnect()}
}
