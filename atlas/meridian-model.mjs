// A revolving, orthographically projected surface model with per-pixel depth testing.
// Camera coordinates, skin surfaces and meridian landmarks all share one space.
const TAU = 2 * Math.PI;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a,b,t) => a + (b-a)*t;
const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x/n); };
const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub = (a,b) => a.map((v,i) => v-b[i]);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const keyLight = unit([-.62,.85,.94]);
const glint = unit([-.33,.46,1]);
const white = [250,248,241], ink = [53,51,48], black = [39,38,37];
const ids = ['LU7','HT7','SP6','KI3','LR3'];
const initialAngles = {LU7:12, HT7:-10, SP6:23, KI3:-36, LR3:12};
const meridianColors = {LU7:'#80634e', HT7:'#9c473a', SP6:'#92651f', KI3:'#416c80', LR3:'#4b7157'};

// Cubic interpolation is used for both the sculpt's profile and the limb centre lines.
function curve(rows,t) {
  const end=rows.length-1, p=clamp(t,0,1)*end, k=Math.min(Math.floor(p),end-1), u=p-k;
  const a=rows[Math.max(0,k-1)], b=rows[k], c=rows[k+1], d=rows[Math.min(k+2,end)];
  return b.map((v,j)=>.5*((2*v)+(-a[j]+c[j])*u+(2*a[j]-5*v+4*c[j]-d[j])*u*u+
      (-a[j]+3*v-3*c[j]+d[j])*u*u*u));
}
function surfaceMesh(surface, center, color, segments, rings, kind='') {
  const vertices=[], indices=[];
  for (let j=0;j<=rings;j++) {
    const v=clamp(j/rings,.0002,.9998), mid=center(v);
    for(let i=0;i<segments;i++) {
      const u=i*TAU/segments, pos=surface(u,v);
      const dv=sub(surface(u,Math.min(1,v+.0001)),surface(u,Math.max(0,v-.0001)));
      const du=sub(surface(u+.001,v),surface(u-.001,v));
      let normal=unit(cross(dv,du));
      if(kind!=='coat' && dot(normal,sub(pos,mid))<0) normal=normal.map(x=>-x);
      vertices.push({pos,normal});
      if(j<rings){
        const a=j*segments+i,b=j*segments+(i+1)%segments,c=a+segments,d=b+segments;
        indices.push(a,b,c,b,d,c);
      }
    }
  }
  return {vertices,indices,color,kind};
}
function ellipsoid(center,radii,color,{pitch=0,roll=0,kind='',slices=36,rings=20}={}) {
  const ca=Math.cos(pitch),sa=Math.sin(pitch),cb=Math.cos(roll),sb=Math.sin(roll);
  function transform(x,y,z) {
    const yy=ca*y-sa*z, zz=sa*y+ca*z;
    return [center[0]+cb*x-sb*yy,center[1]+sb*x+cb*yy,center[2]+zz];
  }
  function shape(a,t) {
    const e=Math.PI*(t-.5),rc=Math.cos(e);
    return transform(radii[0]*rc*Math.cos(a),radii[1]*Math.sin(e),radii[2]*rc*Math.sin(a));
  }
  return surfaceMesh(shape,t=>transform(0,radii[1]*Math.sin(Math.PI*(t-.5)),0),color,slices,rings,kind);
}
const barrel=[
  [.978,.02,.021],[1.02,.42,.31],[1.16,.83,.56],[1.41,1.07,.72],[1.86,1.16,.79],
  [2.35,1.14,.77],[2.9,1.095,.75],[3.46,1.035,.71],[3.88,.99,.675],
  [4.14,.90,.57],[4.32,.72,.43],[4.406,.43,.26],[4.435,.013,.009]
];
function coat(a,t) {
  const [h,r,d]=curve(barrel,t),x=r*Math.cos(a),z=d*Math.sin(a);
  const ear=Math.exp(-((Math.abs(x)-.61)**2/.115+z*z/.20));
  return [x,h+.55*ear*clamp((h-3.55)/.71,0,1),z];
}
// Map a frontal landmark (lateral fraction, height) onto the actual coat surface.
function torsoSkin(side,fraction,height){
  let lo=0,hi=1;
  for(let i=0;i<17;i++){
    const t=(lo+hi)/2;
    if(curve(barrel,t)[0]<height)lo=t;else hi=t;
  }
  const t=(lo+hi)/2,a=Math.acos(clamp(side*fraction,-1,1));
  const p=coat(a,t);
  return [p[0]+.004*Math.cos(a),p[1],p[2]+.004*Math.sin(a)];
}
// Disconnected superficial regions only. Placement follows the regional point maps
// in WHO Standard Acupuncture Point Locations in the Western Pacific Region (2008).
// The short torso on this character is a teaching schematic, not a proportional ruler.
const torsoRegions={
  LU7:[ [[.67,2.68],[.68,2.78],[.69,2.87],[.80,2.85],[.91,2.79],[.985,2.72]] ],
  KI3:[ [[.059,1.28],[.059,1.59],[.059,1.92],[.059,2.27]],
        [[.234,2.32],[.234,2.50],[.234,2.69],[.234,2.86]] ],
  SP6:[ [[.405,1.36],[.435,1.54],[.447,1.75],[.447,2.03]],
        [[.659,2.27],[.674,2.43],[.676,2.60],[.674,2.72]] ],
  LR3:[ [[.947,2.035],[.842,2.086],[.668,2.172],[.466,2.226]] ]
};
const armRows=[
  [.79,2.81,-.02,.117,.117],[1.01,2.76,-.015,.179,.168],[1.23,2.57,0,.153,.151],
  [1.39,2.37,.045,.135,.136],[1.56,2.20,.115,.121,.126],
  [1.72,2.045,.17,.103,.106],[1.77,1.985,.18,.097,.102]
];
const legRows=[
  [.53,1.30,0,.192,.178],[.54,1.10,.005,.178,.17],[.545,.91,.015,.156,.148],
  [.54,.70,0,.152,.143],[.53,.51,-.012,.139,.134],[.525,.31,-.005,.126,.128],
  [.526,.205,.01,.14,.141]
];
// Degrees around each limb are measured from its anterior face; positive is lateral.
function limb(side,rows,a,t,lift=0) {
  const [x,y,z,r,d]=curve(rows,t),prev=curve(rows,Math.max(0,t-.001)),next=curve(rows,Math.min(1,t+.001));
  const tangent=unit(sub(next.slice(0,3),prev.slice(0,3)));
  const radial=unit([-tangent[1],tangent[0],0]),front=unit(cross(tangent,radial));
  const q=(r+lift)*Math.sin(a), w=(d+lift)*Math.cos(a);
  return [side*(x+radial[0]*q+front[0]*w), y+radial[1]*q+front[1]*w,z+front[2]*w];
}
const footCentre = [.525,.206,.118], footRadii=[.241,.184,.369];
function foot(side,ax,az,lift=.006) {
  return [side*(footCentre[0]+footRadii[0]*ax), footCentre[1]+footRadii[1]*Math.sqrt(Math.max(0,1-ax*ax-az*az))+lift, footCentre[2]+footRadii[2]*az];
}
function makeSculpture() {
  const meshes=[surfaceMesh(coat,t=>[0,curve(barrel,t)[0],0],white,72,50,'coat')];
  meshes.push(ellipsoid([-.10,1.65,-.84],[.42,.38,.53],white,{pitch:.32,kind:'tail'}));
  meshes.push(ellipsoid([0,3.70,.65],[.36,.31,.30],white));
  meshes.push(ellipsoid([0,3.748,.89],[.482,.427,.421],black,{kind:'nose',slices:54,rings:36}));
  const paths=[], markers=[];
  for (const side of [-1,1]) {
    meshes.push(ellipsoid([side*.743,3.752,.488],[.061,.094,.067],black,{kind:'eye',roll:side*.16}));
    for (const rows of [armRows,legRows]) {
      meshes.push(surfaceMesh((a,t)=>limb(side,rows,a,t),t=>{const c=curve(rows,t);return [side*c[0],c[1],c[2]];},ink,32,22));
    }
    meshes.push(ellipsoid([side*1.786,1.935,.195],[.128,.173,.099],ink,{roll:side*-.44}));
    for(const [offset,length] of [[-.065,.080],[.003,.105],[.064,.086]]) {
      meshes.push(ellipsoid([side*(1.804+offset),1.83+Math.abs(offset)*.43,.201],[.048,length,.056],ink,{roll:side*-.35,slices:20,rings:12}));
    }
    meshes.push(ellipsoid([side*1.902,1.964,.218],[.054,.102,.064],ink,{roll:side*.37,slices:24,rings:14}));
    meshes.push(ellipsoid([side*footCentre[0],footCentre[1],footCentre[2]],footRadii,black,{slices:44,rings:26}));
    for (const [id,regions] of Object.entries(torsoRegions)) {
      for(const region of regions) {
        const pts=Array.from({length:55},(_,i)=>{
          const [lateral,y]=curve(region,i/54);
          return torsoSkin(side,lateral,y);
        });
        // Tiny atlas marks denote the documented endpoints of a visible region.
        // For LU the second point is the upper-chest turn (before the arm).
        const knots=id==='LU7'?[pts[0],pts[Math.round(54*2/(region.length-1))]]:[pts[0],pts[54]];
        paths.push({id,side,pts,knots,torso:true});
      }
    }
    function arm(a,t){return limb(side,armRows,a,t,.006)}
    function leg(a,t){return limb(side,legRows,a,t,.005)}
    function track(id,n,fn,markT){
      const pts=Array.from({length:n+1},(_,i)=>fn(i/n));
      paths.push({id,pts,side}); markers.push({id,pos:fn(markT),side});
    }
    track('LU7',65,t=>arm(mix(.24,.94,t),mix(.13,1,t)),.775);
    track('HT7',65,t=>arm(mix(-.31,-.90,t),mix(.18,1,t)),.965);
    track('SP6',55,t=>leg(mix(-.79,-1.12,t),mix(.15,.96,t)),.61);
    track('KI3',52,t=>leg(mix(-1.56,-1.94,t),mix(.23,.97,t)),.725);
    const ankle=leg(-.35,.92), heel=foot(side,-.30,-.27);
    const lrRoute=t=>{
      if(t<.60) return leg(mix(-.57,-.35,t/.6),mix(.18,.92,t/.6));
      if(t<.68) return ankle.map((x,i)=>mix(x,heel[i],(t-.60)/.08));
      const u=(t-.68)/.32;return foot(side,mix(-.30,-.18,u),mix(-.27,.86,u));
    };
    track('LR3',85,lrRoute,.88);
  }
  return {meshes,paths,markers};
}
let geometry;
const elevation=.088, ce=Math.cos(elevation), se=Math.sin(elevation);
function camera(point,cos,sin) {
  const [x,y,z]=point,depth=-x*sin+z*cos;
  return [x*cos+z*sin, y*ce-depth*se, y*se+depth*ce];
}
function light(vertex,mesh,cos,sin) {
  const n=camera(vertex.normal,cos,sin),[x,y,z]=vertex.pos;
  const lambert=Math.max(0,dot(n,keyLight)),rim=(1-Math.max(0,n[2]))**3;
  const spec=mesh.kind==='eye'||mesh.kind==='nose';
  let shade=.77+.218*lambert+.019*Math.max(0,n[1])+.012*rim;
  if(mesh.kind==='coat' && z>0){
    const underSnout=Math.exp(-(x*x/.19+(y-3.47)**2/.080));
    shade-=.109*underSnout*clamp(z/.55,0,1);
  }
  if(mesh.kind==='tail') shade-=.045;
  const highlight=mesh.color===white ? 3*lambert : (spec?30:12)*Math.max(0,dot(n,glint))**(spec?18:7);
  return mesh.color.map(v=>Math.min(255,v*shade+highlight));
}
function paintTriangle(a,b,c,w,h,pixels,depth) {
  const ax=a[0], ay=a[1], vx=b[0]-ax,vy=b[1]-ay, wx=c[0]-ax, wy=c[1]-ay;
  const det=vx*wy-vy*wx;
  if(Math.abs(det)<.001)return;
  const x0=Math.max(0,Math.ceil(Math.min(ax,b[0],c[0])-.5)),x1=Math.min(w-1,Math.floor(Math.max(ax,b[0],c[0])-.5));
  const y0=Math.max(0,Math.ceil(Math.min(ay,b[1],c[1])-.5)),y1=Math.min(h-1,Math.floor(Math.max(ay,b[1],c[1])-.5));
  const du=wy/det,dv=-vy/det,dyU=-wx/det,dyV=vx/det,dzB=b[2]-a[2],dzC=c[2]-a[2];
  for(let y=y0;y<=y1;y++){
    let u=(x0+.5-ax)*du+(y+.5-ay)*dyU, v=(x0+.5-ax)*dv+(y+.5-ay)*dyV;
    for(let x=x0,idx=y*w+x;x<=x1;x++,idx++,u+=du,v+=dv){
      if(u<-.00001||v<-.00001||u+v>1.00001)continue;
      const z=a[2]+u*dzB+v*dzC;
      if(z<=depth[idx])continue;
      depth[idx]=z;
      const p=idx*4;
      for(let j=0;j<3;j++) pixels[p+j]=a[j+3]+u*(b[j+3]-a[j+3])+v*(c[j+3]-a[j+3]);
      pixels[p+3]=255;
    }
  }
}
function drawLeader(ctx,spot,id,w,h,dpr) {
  const sign=spot.x>w/2?1:-1, startX=spot.x+sign*8*dpr, y=clamp(spot.y-17*dpr,16*dpr,h-16*dpr);
  const endX=clamp(spot.x+sign*46*dpr,30*dpr,w-30*dpr);
  ctx.save();ctx.lineWidth=dpr*.86;ctx.strokeStyle='rgba(57,89,66,.84)';
  ctx.beginPath();ctx.moveTo(startX,spot.y-2*dpr);ctx.lineTo((startX+endX)/2,y);ctx.lineTo(endX,y);ctx.stroke();
  ctx.fillStyle='#284c3b';ctx.font='600 '+Math.round(11*dpr)+'px Georgia, serif';
  ctx.textAlign=sign===1?'right':'left';ctx.textBaseline='bottom';ctx.fillText(id,endX,y-2*dpr);ctx.restore();
}
export function createMeridianModel(canvas,{onSelect,onViewChange}={}) {
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('此浏览器无法显示经络模型');
  geometry??=makeSculpture();
  const {meshes,paths,markers}=geometry;
  let selected='LU7', yaw=initialAngles.LU7,frame=0,dead=false,spots=[],pointer=null;
  let depth,bitmap,lastWidth=0,lastHeight=0,pxRatio=1;
  const originalTouch=canvas.style.touchAction;
  canvas.style.touchAction='pan-y';
  const normalized=a=>((a+180)%360+360)%360-180;
  function changeYaw(angle) {
    yaw=normalized(angle);onViewChange?.(Math.round(yaw));queue();
  }
  function render() {
    frame=0;
    const box=canvas.getBoundingClientRect();
    if(!box.width||!box.height||dead)return;
    const dpr=Math.min(1.75,window.devicePixelRatio||1,1000/Math.max(box.width,box.height));
    pxRatio=dpr;
    const w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));
    if(w!==lastWidth||h!==lastHeight){
      canvas.width=w;canvas.height=h;lastWidth=w;lastHeight=h;
      bitmap=ctx.createImageData(w,h);depth=new Float32Array(w*h);
    }else bitmap.data.fill(0);
    depth.fill(-Infinity);
    const rad=yaw*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad);
    const scale=Math.min(w*.80/3.88,h*.88/4.96),cx=w*.5,cy=h*.50+2.46*scale;
    const project=p=>{const [x,y,z]=camera(p,cos,sin);return [cx+x*scale,cy-y*scale,z];};
    for (const mesh of meshes) {
      const points=mesh.vertices.map(v=>project(v.pos).concat(light(v,mesh,cos,sin)));
      const f=mesh.indices;
      for(let i=0;i<f.length;i+=3) paintTriangle(points[f[i]],points[f[i+1]],points[f[i+2]],w,h,bitmap.data,depth);
    }
    ctx.putImageData(bitmap,0,0);
    // Grounding shadow follows the feet, while the drawing surface remains transparent.
    ctx.save();ctx.globalCompositeOperation='destination-over';
    const footY=cy+.018*scale;
    ctx.translate(cx,footY);ctx.scale(scale*1.06,scale*.115);
    const shadow=ctx.createRadialGradient(0,0,0,0,0,1);
    shadow.addColorStop(0,'rgba(55,81,53,.16)');shadow.addColorStop(.52,'rgba(68,91,60,.075)');shadow.addColorStop(1,'rgba(68,91,60,0)');
    ctx.fillStyle=shadow;ctx.fillRect(-1,-1,2,2);ctx.restore();
    const visible=p=>{
      const x=Math.floor(p[0]),y=Math.floor(p[1]);
      if(x<0||x>=w||y<0||y>=h)return false;
      const skin=depth[y*w+x];
      return skin!==-Infinity && p[2]>=skin-.022;
    };
    ctx.lineJoin='round';ctx.lineCap='round';
    for (const path of [...paths.filter(k=>k.id!==selected),...paths.filter(k=>k.id===selected)]) {
      const active=path.id===selected;
      ctx.beginPath();let pen=false;
      for(const loc of path.pts) {
        const p=project(loc);
        if(!visible(p)){pen=false;continue;}
        if(pen)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);pen=true;
      }
      if(active){
        ctx.globalAlpha=.76;ctx.strokeStyle='#f0ffd9';ctx.lineWidth=3.4*dpr;ctx.stroke();
      }
      ctx.strokeStyle=active||path.torso?meridianColors[path.id]:'#a6b59d';ctx.globalAlpha=active?1:(path.torso ? .32 : .75);
      ctx.lineWidth=(active?1.6:1)*dpr;ctx.stroke();ctx.globalAlpha=1;
    }
    for(const path of paths) {
      if(!path.torso || path.id!==selected) continue;
      for(const pos of path.knots) {
        const p=project(pos);if(!visible(p)) continue;
        ctx.beginPath();ctx.arc(p[0],p[1],1.65*dpr,0,TAU);
        ctx.fillStyle='#f5fbe9';ctx.fill();ctx.strokeStyle=meridianColors[selected];
        ctx.lineWidth=.8*dpr;ctx.stroke();
      }
    }
    spots=[];
    for(const marker of markers){
      const p=project(marker.pos);
      if(visible(p))spots.push({x:p[0],y:p[1],z:p[2],id:marker.id});
    }
    spots.sort((a,b)=>Number(a.id===selected)-Number(b.id===selected)||a.z-b.z);
    for(const s of spots) {
      const active=s.id===selected;
      if(active){
        ctx.fillStyle='rgba(187,217,154,.32)';ctx.strokeStyle='rgba(229,248,209,.92)';
        ctx.lineWidth=.9*dpr;ctx.beginPath();ctx.arc(s.x,s.y,7*dpr,0,TAU);ctx.fill();ctx.stroke();
      }
      ctx.fillStyle=active?meridianColors[s.id]:'#536257';ctx.strokeStyle='#f6ffea';
      ctx.lineWidth=(active?1.7:1.1)*dpr;ctx.beginPath();ctx.arc(s.x,s.y,(active?3.9:2.35)*dpr,0,TAU);ctx.fill();ctx.stroke();
    }
    const near=spots.filter(s=>s.id===selected).sort((a,b)=>b.z-a.z)[0];
    if(near)drawLeader(ctx,near,selected,w,h,dpr);
  }
  function queue(){if(!frame&&!dead)frame=requestAnimationFrame(render);}
  function select(id) {
    if(!ids.includes(id))return;
    selected=id;changeYaw(initialAngles[id]);
  }
  function down(e){
    if(pointer||e.button!==0)return;
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY,angle:yaw,drag:false};
    canvas.setPointerCapture(e.pointerId);
  }
  function move(e){
    if(!pointer||e.pointerId!==pointer.id)return;
    const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
    if(!pointer.drag && Math.abs(dx)<4)return;
    if(!pointer.drag && Math.abs(dy)>Math.abs(dx)*1.6)return;
    pointer.drag=true;changeYaw(pointer.angle+dx*.65);
  }
  function up(e) {
    if(!pointer||e.pointerId!==pointer.id)return;
    const tap=!pointer.drag&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<7;
    pointer=null;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!tap)return;
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*pxRatio,y=(e.clientY-r.top)*pxRatio;
    const options=spots.map(s=>({s,d:Math.hypot(s.x-x,s.y-y)})).filter(a=>a.d<12*pxRatio).sort((a,b)=>a.d-b.d);
    if(options.length){
      selected=options[0].s.id;queue();onSelect?.(selected);
    }
  }
  function cancel(e){if(pointer?.id===e.pointerId)pointer=null;}
  function key(e){
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();changeYaw(yaw+(e.key==='ArrowRight'?15:-15));}
    else if(e.key==='Home'){e.preventDefault();changeYaw(0);}
  }
  const handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,lostpointercapture:cancel,keydown:key};
  for(const [name,fn] of Object.entries(handlers))canvas.addEventListener(name,fn);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(queue):null;
  observer?.observe(canvas);window.addEventListener('resize',queue);
  onViewChange?.(yaw);queue();
  return {select,rotate(degrees){if(Number.isFinite(degrees))changeYaw(yaw+degrees);},reset(){changeYaw(0);},destroy(){
    dead=true;if(frame)cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',queue);
    for(const [name,fn] of Object.entries(handlers))canvas.removeEventListener(name,fn);
    canvas.style.touchAction=originalTouch;
  }};
}
