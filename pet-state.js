/* Local posture hints, not gaze/object recognition or a measurement of productivity. */
(function(root){
'use strict';
const active=s=>['screen','writing','desk'].includes(s);
const visible=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&(p.presence??1)>.5&&(p.visibility??1)>.5;
function features(points){
 if(!points||![0,11,12].every(i=>visible(points[i])))return null;
 const p=points,w=Math.hypot(p[11].x-p[12].x,p[11].y-p[12].y);if(w<.065)return null;
 const meanY=ids=>{const found=ids.filter(i=>visible(p[i]));return found.length?found.reduce((sum,i)=>sum+p[i].y,0)/found.length:null;};
 const eyes=meanY([2,5]),ears=meanY([7,8]);
 // Missing ear/eye anchors reduce specificity; they do not mean the person left.
 return [(p[0].y-(p[11].y+p[12].y)/2)/w,eyes===null?null:(p[0].y-eyes)/w,ears===null?null:(p[0].y-ears)/w,Math.abs(p[0].x-(p[11].x+p[12].x)/2)/w];
}
const complete=f=>Array.isArray(f)&&f.length===4&&f.every(Number.isFinite);
const distance=(a,b)=>!complete(a)||!complete(b)?Infinity:Math.sqrt(a.reduce((n,x,i)=>n+(x-b[i])**2,0)/a.length);
function guess(f,profiles){
 if(!f)return {state:'away',detail:'没有看清头肩，计时暂停'};
 if(f[3]>.6||f[0]<-1.6||f[0]>.25)return {state:'unknown',detail:'请让脸和双肩朝向镜头，暂时暂停计时'};
 const desk={state:'desk',detail:'已看到你在桌前，先陪你计时；看屏幕与书写还在区分'};
 if(complete(f)){
  const screen=complete(profiles?.screen),writing=complete(profiles?.writing);
  if(screen&&writing){
   const separation=distance(profiles.screen,profiles.writing),a=distance(f,profiles.screen),b=distance(f,profiles.writing);
   // An old/overlapping calibration must not block desk-presence recognition.
   if(separation>=.055&&Math.min(a,b)<=.2){
    if(Math.abs(a-b)<Math.max(.025,separation*.22))return desk;
    return {state:a<b?'screen':'writing',detail:'依据你校准的姿势推测'};
   }
  }else if(screen||writing){
   const kind=screen?'screen':'writing';
   if(distance(f,profiles[kind])<=.09)return {state:kind,detail:'依据已校准的姿势推测'};
  }
 }
 if(Number.isFinite(f[2])&&f[0]>-.32&&f[2]>.11)return {state:'writing',detail:'低头姿态，可能在书写或阅读'};
 if(Number.isFinite(f[2])&&f[0]<-.42&&f[2]<.13)return {state:'screen',detail:'面向前方，可能在看屏幕'};
 return desk;
}
function create(now=0){
 let state='unknown',candidate='',since=now,lastAt=null,lastSample=null,previousActive=false,history=[],activeMs=0,restUntil=0,snoozeUntil=0,awaySince=null,minutes=30;
 return {setMinutes(n){minutes=[20,30,45,60].includes(+n)?+n:30;},rest(t){activeMs=0;snoozeUntil=0;restUntil=t+120000;},snooze(t){snoozeUntil=t+300000;},reset(){lastAt=null;lastSample=null;previousActive=false;history=[];candidate='';awaySince=null;state='unknown';},update(observation,t,{manual=false}={}){
   const delta=lastAt===null?0:t-lastAt,dt=delta>=0&&delta<=2500?delta:0;lastAt=t;
   if(delta<0||delta>2500){history=[];lastSample=null;previousActive=false;candidate='';if(!manual)state='unknown';}
   const sampleAt=observation.sampleAt??t,fresh=Number.isFinite(sampleAt)&&t>=sampleAt&&t-sampleAt<=2600;
   const observed=fresh?observation.state:'unknown',working=active(observed);
   history=history.filter(s=>t-s.at<=2400);
   if(fresh&&sampleAt!==lastSample){history.push({state:observed,at:sampleAt});lastSample=sampleAt;}
   if(manual){state=observed;}
   else if(observed==='away'){state='away';history=[];candidate='';}
   else if(working){
    const votes=history.filter(s=>active(s.state)),span=votes.length?votes[votes.length-1].at-votes[0].at:0;
    if(votes.length>=3&&span>=800&&votes.length/history.length>=.65){
     const winner=['screen','writing'].find(s=>votes.filter(v=>v.state===s).length/votes.length>=.75)||'desk';
     if(candidate!==winner){candidate=winner;since=t;}
     if(!active(state)||state==='desk'||state===winner||t-since>=1200)state=winner;
    }
   }else{
    if(candidate!=='unknown'){candidate='unknown';since=t;}
    if(t-since>=800)state='unknown';
   }
   // Classification uncertainty is distinct from missing/stale camera evidence.
   const counting=working&&active(state);
   if(observed==='away'){awaySince??=t;if(t-awaySince>=60000){activeMs=0;snoozeUntil=0;}}else awaySince=null;
   if(counting&&previousActive&&t>=restUntil)activeMs+=Math.min(dt,Math.max(0,t-restUntil));
   previousActive=working;
   const remaining=Math.max(0,minutes*60000-activeMs);
   return {state:t<restUntil?'rest':state,activeMs,remaining,restRemaining:Math.max(0,restUntil-t),due:counting&&remaining===0&&t>=snoozeUntil&&t>=restUntil,detail:observation.detail};
 },get minutes(){return minutes;}};
}
root.QimaiPetState={features,guess,distance,complete,create};
})(typeof window==='undefined'?globalThis:window);
