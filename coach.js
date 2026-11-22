/* 动作追踪修订：保留各式几何要点，用短时确认与失帧宽限衔接步骤。 */
(function(){
  'use strict';
  const config=window.QimaiTrackingConfig||{visibility:.4,landmarkPresence:.5,holdMs:1200,graceMs:450,staleMs:900,smoothing:{stillMs:85,movingMs:25,speedScale:3.5,resetMs:450}};
  const sides=[{name:'左',s:11,e:13,w:15,h:23,k:25,a:27,other:12},{name:'右',s:12,e:14,w:16,h:24,k:26,a:28,other:11}];
  const supported=['rest','close','prayer','spread','sky','starL','starR','pullL','pullR','push','knifeL','knifeR','squat','clawL','clawR','tigerL','tigerR','bowReady','bow','tailL','tailR','tailCenter','chestPalms','earLift','pullOpenL','pullOpenR'];
  const legTargets=new Set(['pullL','pullR','squat','tigerL','tigerR','bowReady','bow','tailL','tailR','tailCenter','pullOpenL','pullOpenR']);
  const trunkTargets=new Set([...legTargets,'clawL','clawR','knifeL','knifeR','starL','starR','push']);
  const finite=Number.isFinite,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:((a.z??0)+(b.z??0))/2});
  const sub=(a,b)=>[a.x-b.x,a.y-b.y,(a.z??0)-(b.z??0)];
  const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),norm=a=>Math.hypot(...a);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=v=>norm(v)>1e-7?v.map(x=>x/norm(v)):null;
  const project=(v,normal)=>v.map((x,i)=>x-dot(v,normal)*normal[i]);
  // A keypoint outside the image is an estimate, not an observed limb.
  const MIN_VIS=config.visibility,MIN_PRESENCE=config.landmarkPresence;
  const confidence=p=>!!p&&(p.visibility===undefined||finite(p.visibility)&&p.visibility>=MIN_VIS)&&(p.presence===undefined||finite(p.presence)&&p.presence>=MIN_PRESENCE);
  const numeric=(p,dimension=2)=>!!p&&['x','y',...(dimension===3?['z']:[])].every(k=>finite(p[k]));
  const valid=(p,dimension=2)=>confidence(p)&&numeric(p,dimension);
  const inFrame=p=>p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
  const visible=p=>valid(p)&&inFrame(p);
  // These are learning cues, not prerequisites for recognising the action milestone.
  const advisory=/^(shoulders-level|upright|relax-|elbow[左右]$|pull-body|knife-balance|squat-align-|squat-elbow-|knee-)/;
  const tips={
    rest:'双肩放松，双手自然放低，保持自然呼吸。',close:'双手缓缓回落，保持自然呼吸。',
    chestPalms:'双掌分开在胸前立起，肩膀放松。',earLift:'双掌翻向上，从耳侧轻缓上托。',tailCenter:'保持前俯和双手位置稳定，再轻缓摆转。',pullOpen:'保持弓步稳定，前后双臂缓缓展开。',
    prayer:'双手轻合，肘部自然下沉，腋下留出空间。',spread:'双臂缓缓展开，肩膀放松，不必用力绷直。',
    sky:'向上舒适伸展，避免挺腹，不要屏气。',star:'抬手与转身轻缓配合，保持重心稳定。',
    pull:'前后脚站稳，双手牵引时保留余力。',push:'缓缓推掌，松肩，自然呼吸。',
    knife:'绕臂到舒适位置即可，转头幅度放小。',squat:'膝盖沿脚尖方向，蹲起幅度保持可控。',
    claw:'手掌随身体缓缓探出，转体时保持稳定。',tiger:'前方留出空间，俯身幅度以稳定舒适为准。',
    bowReady:'双手轻贴耳侧，手肘放松，不要拉压颈部。',bow:'按舒适范围缓缓前屈，起身也要慢。',
    tail:'俯身和摆动幅度放小，双手位置尽量稳定。'
  };
  const tip=target=>tips[target]||tips[target?.replace(/[LR]$/,'')]||'动作轻缓，保持自然呼吸。';
  function framingMessage(ids,landmarks){
    if(ids.some(id=>[15,16].includes(id)))return ids.some(id=>[15,16].includes(id)&&numeric(landmarks[id])&&!inFrame(landmarks[id]))?'手腕超出画面，请稍微后退或调整镜头，让双手完整入镜':'双手或手腕被遮挡，请稍转向镜头，让双手清晰可见';
    return ids.some(id=>id>=23)?'本步需要观察髋部和腿部，请调整镜头让相应部位完整入镜':'请调整镜头，让头部、双肩和双肘清晰入镜';
  }
  function vectorAngle(u,v){const length=norm(u)*norm(v);return length>1e-9&&u.every(finite)&&v.every(finite)?Math.acos(clamp(dot(u,v)/length,-1,1))*180/Math.PI:null;}
  function angle(a,b,c){return a&&b&&c?vectorAngle(sub(a,b),sub(c,b)):null;}
  const early=(code,message,joints=[])=>({code,message,joints,ready:false,checks:[],passed:0,total:0,tracking:false});
  function worldFrame(world,landmarks){
    const good=id=>valid(world?.[id],3)&&(!landmarks||visible(landmarks[id]));
    if(![0,11,12,23,24].every(good))return null;
    const shoulders=mid(world[11],world[12]),hips=mid(world[23],world[24]),down=sub(hips,shoulders),axis=sub(world[11],world[12]),hipAxis=sub(world[23],world[24]);
    const torso=norm(down),width=norm(axis);if(torso<.08||torso>1.1||width<.06||width>.9)return null;
    // 使用髋到双踝的身体参考轴，避免把摄像头倾斜直接当作前屈角。
    const lower=[23,24,27,28].every(good)?unit(sub(mid(world[27],world[28]),hips)):null;
    const vertical=lower||[0,1,0],flatHip=unit(project(hipAxis,vertical)),flatShoulder=unit(project(axis,vertical));
    if(!flatHip||!flatShoulder)return null;
    let forward=unit(cross(axis,down)),floorForward=unit(cross(flatHip,vertical));
    if(!forward||!floorForward)return null;
    const face=dot(sub(world[0],shoulders),forward);
    if(Math.abs(face)<torso*.025)forward=null; // 正反方向不清时，不拿不稳定的符号计算前后深度。
    else if(face<0)forward=forward.map(x=>-x);
    const floorFace=dot(sub(world[0],shoulders),floorForward);
    if(floorFace<0)floorForward=floorForward.map(x=>-x);
    const lean=lower&&Math.abs(floorFace)>=torso*.025?Math.atan2(-dot(down,floorForward),dot(down,vertical))*180/Math.PI:null;
    const twist=vectorAngle(flatShoulder,flatHip);
    return{shoulders,hips,torso,width,forward,lean,twist,point:id=>good(id)?world[id]:null};
  }
  function evaluate(landmarks,target,mode='standing',aspect=4/3,options={}){
    if(!supported.includes(target))return early('unsupported','当前步骤没有可用判定，请返回后重新选择课程');
    if(!landmarks?.length)return early('missing','请进入镜头，让头部、双肩、双肘和双手清晰可见');
    if(!finite(aspect)||aspect<=0)return early('geometry','摄像头画面尺寸暂未就绪');
    // Only the head/shoulders gate the whole result. Each metric checks its own
    // current joints so a hidden wrist does not erase clear measurements elsewhere.
    const core=[0,11,12],ids=[...core,13,14,15,16];
    if(mode==='standing'&&trunkTargets.has(target))ids.push(23,24);
    if(mode==='standing'&&legTargets.has(target))ids.push(25,26,27,28);
    const missing=ids.filter(id=>!visible(landmarks[id]));
    if(core.some(id=>missing.includes(id))||ids.some(id=>!numeric(landmarks[id])))return early('framing',framingMessage(missing,landmarks),missing);
    // Correct aspect ratio before measuring; missing confidence is handled per metric.
    const p=landmarks.map(a=>numeric(a)?{x:a.x*aspect,y:a.y,z:0}:null),sh=mid(p[11],p[12]);
    const hasHips=visible(landmarks[23])&&visible(landmarks[24]),hips=hasHips?mid(p[23],p[24]):null;
    const shoulderWidth=norm(sub(p[11],p[12])),torso=hips?norm(sub(sh,hips)):shoulderWidth*1.2;
    const width=Math.max(shoulderWidth,torso*.65);
    if(width<.055||torso<.035)return early('distance','身体在画面中过小，请稍微靠近，让肩肘位置看清',[11,12]);
    const world=worldFrame(options.worldLandmarks,landmarks),checks=[];
    const worldPoint=id=>valid(options.worldLandmarks?.[id],3)&&visible(landmarks[id])?options.worldLandmarks[id]:null;
    const side=target.endsWith('R')?sides[1]:sides[0],other=side===sides[0]?sides[1]:sides[0];
    const degrees=n=>finite(n)?'约 '+Math.round(n/5)*5+'°':'角度待确认';
    function metric(code,label,value,min,max,message,joints,kind='ratio',customId){
      const unseen=joints.filter(id=>!visible(landmarks[id]));
      if(unseen.length)value=null;
      const rule={min,max,hysteresis:kind==='angle'?4:.035,guard:kind==='angle'?12:.12};
      const measured=options.measure?options.measure(customId||code,value,rule):{value,ready:finite(value)?value>=min-1e-7&&value<=max+1e-7:null};
      const unknown=measured.ready===null;
      checks.push({code,label,ready:measured.ready===true,unknown,gross:finite(value)&&(value<min-rule.guard||value>max+rule.guard),message:unknown&&unseen.length?framingMessage(unseen,landmarks):unknown?'位置暂时看不清，请稍转向镜头，让'+label.replace(/舒展|舒适屈曲|自然下沉/g,'')+'的关节轮廓清楚':message,joints,actual:kind==='angle'?degrees(measured.value):unknown?'等待清晰关键点':'',value:measured.value,rawValue:value,measurement:kind});
    }
    function unknown(code,label,message,joints){const unseen=joints.filter(id=>!visible(landmarks[id]));checks.push({code,label,ready:false,unknown:true,message:unseen.length?framingMessage(unseen,landmarks):message,joints,actual:'等待清晰关键点'});}
    // 平面中看得清的关节用图像角度；明显缩短的投影或推掌才采用可靠三维角度。
    function joint(a,b,c,depth=false){
      const first=sub(p[a],p[b]),second=sub(p[c],p[b]),lengths=[norm(first),norm(second)],imageAngle=angle(p[a],p[b],p[c]);
      const imageClear=Math.min(...lengths)>=width*.20&&Math.min(...lengths)/Math.max(...lengths)>=.30;
      if(!depth&&imageClear)return imageAngle;
      const wp=[a,b,c].map(worldPoint);
      if(wp.every(Boolean)){
        const u=sub(wp[0],wp[1]),v=sub(wp[2],wp[1]),short=Math.min(norm(u),norm(v)),long=Math.max(norm(u),norm(v));
        if(short>=.035&&long<=1.2&&short/long>=.25)return vectorAngle(u,v);
      }
      return depth?null:imageClear?imageAngle:null;
    }
    function kneeChecks(min=138){if(mode==='standing')for(const leg of sides)metric('knee-'+leg.name,leg.name+'膝舒展',joint(leg.h,leg.k,leg.a),min,180,leg.name+'膝有些弯曲，请在舒适范围内慢慢伸展',[leg.h,leg.k,leg.a],'angle');}
    function upright(){
      metric('shoulders-level','双肩保持平稳',Math.abs(p[11].y-p[12].y)/width,0,.34,'身体有些侧倾，请让双肩回到舒适的平稳位置',[11,12]);
      if(hips)metric('upright','身体保持中正',Math.abs(sh.x-(hips?.x??NaN))/width,0,.48,'身体有些侧倾，请轻轻回到正中',[11,12,23,24]);
    }
    function upperArm(arm,kind){
      const s=p[arm.s],e=p[arm.e],w=p[arm.w],height=(w.y-s.y)/width;
      if(kind==='sky'){
        metric('raise'+arm.name,arm.name+'手举到头顶附近',(p[0].y-w.y)/width,.04,Infinity,arm.name+'手再向上抬一点，靠近头顶上方',[arm.s,arm.e,arm.w]);
        metric('high-elbow-'+arm.name,arm.name+'肘随手抬起',(s.y-e.y)/width,-.06,Infinity,arm.name+'侧手肘随手臂向上抬起',[arm.s,arm.e]);
      }else{
        metric(height>.30?'raise'+arm.name:'lower'+arm.name,arm.name+'臂与肩同高',height,-.30,.30,arm.name+(height>.30?'臂再抬高一点，让手腕接近肩部高度':'臂稍微放低，让手腕接近肩部高度'),[arm.s,arm.e,arm.w],'ratio','arm-height-'+arm.name);
        metric('out'+arm.name,arm.name+'臂向外展开',(w.x-s.x)*Math.sign(s.x-p[arm.other].x)/width,.45,Infinity,arm.name+'臂向身体外侧展开，不要停在胸前',[arm.s,arm.e,arm.w]);
      }
      metric('elbow'+arm.name,arm.name+'肘舒展',joint(arm.s,arm.e,arm.w),kind==='sky'?125:135,180,arm.name+'侧手肘再舒展一点，保持舒适',[arm.s,arm.e,arm.w],'angle');
    }
    function lunge(leg){
      const back=leg===sides[0]?sides[1]:sides[0],front=joint(leg.h,leg.k,leg.a);
      metric('front-knee','前腿轻缓屈膝',front,75,165,leg.name+'腿作为前腿，'+(front>165?'轻缓屈膝，形成舒适弓步':'稍微起身一些，减小屈膝幅度'),[leg.h,leg.k,leg.a],'angle');
      metric('back-knee','后腿向后伸展',joint(back.h,back.k,back.a),130,180,back.name+'腿向后舒展，保持脚下稳定',[back.h,back.k,back.a],'angle');
      metric('lunge-width','前后脚留出距离',norm(sub(p[27],p[28]))/width,.75,Infinity,'前后脚再分开一点，让弓步站稳',[27,28]);
    }
    function bend(min=25){
      if(!finite(world?.lean))unknown('bend','上体缓慢前屈','前屈方向暂时看不清，请斜侧面对镜头，让肩髋和双腿轮廓清晰',[11,12,23,24]);
      else metric('bend','上体缓慢前屈',world.lean,min,112,world.lean<min?'上体缓缓前俯，停在舒适范围内':'前俯幅度偏大，缓缓抬起一些',[11,12,23,24],'angle');
    }
    function atWaist(arm,behind=false){
      metric('waist-'+arm.name,arm.name+'手靠近腰背',hips?Math.abs(p[arm.w].y-hips.y)/torso:null,0,.58,arm.name+'手缓缓移到腰背附近，保持手腕可见',[arm.e,arm.w,arm.h]);
      if(behind){
        const point=world?.forward&&world.point(arm.w),depth=point?dot(sub(point,world.hips),world.forward)/world.torso:null;
        if(depth===null)unknown('behind-'+arm.name,arm.name+'手在背侧','背侧手暂时看不清，请略转身让手腕露出',[arm.w]);
        else metric('behind-'+arm.name,arm.name+'手在背侧',depth,-Infinity,.28,'请把'+arm.name+'手轻移到背侧，并略转身让手腕露出',[arm.w]);
      }
    }
    if(target==='rest'||target==='close'){
      for(const arm of sides)metric('lower-'+arm.name,arm.name+'手自然放低',(p[arm.w].y-p[arm.s].y)/width,.32,Infinity,arm.name+'手慢慢放低，回到腹前或身体两侧',[arm.e,arm.w]);
      upright();
    }else if(['prayer','chestPalms','earLift'].includes(target)){
      const hands=mid(p[15],p[16]);
      const separated=target!=='prayer',ear=target==='earLift';
      metric('together',separated?'双手保持分开':'双手在胸前靠拢',norm(sub(p[15],p[16]))/width,separated?.45:0,separated?1.65:.65,separated?'两手分开，保持左右两掌清晰可见':'两手轻轻向胸前靠拢，留出放松的空间',[15,16]);
      metric('chest-height',ear?'双手抬至耳侧附近':separated?'两掌位于胸前':'合掌位于胸前',(hands.y-sh.y)/width,ear?-.95:-.35,ear?.15:.85,ear?'双手抬至头部两侧，准备上托':hands.y<sh.y?'双手稍微放低，回到胸前高度':'双手抬到胸前，不要停在腹前',[15,16]);
      for(const arm of sides)metric('relax-'+arm.name,arm.name+'肘自然下沉',(p[arm.e].y-p[arm.s].y)/width,-.16,Infinity,arm.name+'侧手肘轻轻放低，肩膀放松',[arm.s,arm.e]);
      upright();
    }else if(target==='spread'||target==='sky'){
      sides.forEach(arm=>upperArm(arm,target));upright();
    }else if(target.startsWith('star')){
      upperArm(side,'sky');atWaist(other);upright();
    }else if(target.startsWith('pull')){
      lunge(side);metric('pull-front',side.name+'臂屈肘牵引',joint(side.s,side.e,side.w),target.startsWith('pullOpen')?120:40,target.startsWith('pullOpen')?180:145,target.startsWith('pullOpen')?side.name+'臂向前舒展开，保持前后牵引':side.name+'臂轻缓屈肘，把前手牵引到肩前附近',[side.s,side.e,side.w],'angle');
      metric('pull-back',other.name+'臂向后伸展',joint(other.s,other.e,other.w),120,180,other.name+'臂向后舒展，手肘不要收得过紧',[other.s,other.e,other.w],'angle');
      metric('pull-hands','前后手分开牵引',Math.abs(p[side.w].x-p[other.w].x)/width,.65,Infinity,'双手一前一后轻缓牵引，避免都收在胸前',[15,16]);
      metric('pull-body','上体保持稳定',Math.abs(sh.x-(hips?.x??NaN))/torso,0,.85,'上体有些前倾，轻轻回正一些',[11,12,23,24]);
    }else if(target==='push'){
      for(const arm of sides){
        const point=world?.forward&&world.point(arm.w),depth=point?dot(sub(point,world.shoulders),world.forward)/world.torso:null;
        if(depth===null)unknown('push-depth-'+arm.name,arm.name+'掌向前推','前伸深度暂时看不清，请稍向侧面转身，让手臂清晰可见',[arm.s,arm.e,arm.w]);
        else metric('push-depth-'+arm.name,arm.name+'掌向前推',depth,.30,Infinity,arm.name+'掌再缓缓向身体前方推开',[arm.s,arm.e,arm.w]);
        metric('push-elbow-'+arm.name,arm.name+'肘舒展',joint(arm.s,arm.e,arm.w,true),130,180,arm.name+'侧手肘再舒展一点，不要把手收在胸前',[arm.s,arm.e,arm.w],'angle');
        metric('push-height-'+arm.name,arm.name+'掌保持肩部高度',Math.abs(p[arm.w].y-p[arm.s].y)/width,0,.40,arm.name+'掌调整到肩膀附近的高度',[arm.s,arm.w]);
      }
    }else if(target.startsWith('knife')){
      metric('knife-elbow',side.name+'肘抬起绕头',(p[side.e].y-p[0].y)/width,-Infinity,.30,side.name+'侧手肘缓缓抬高，绕到头侧',[side.s,side.e]);
      metric('knife-hand',side.name+'手轻靠头后',norm(sub(p[side.w],p[0]))/width,0,.85,side.name+'手轻靠头后，不要向前伸出',[side.e,side.w,0]);
      atWaist(other,true);metric('knife-balance','保持重心稳定',Math.abs(sh.x-(hips?.x??NaN))/width,0,.60,'身体有些偏向一侧，请把重心轻轻收回',[11,12,23,24]);
    }else if(target==='squat'){
      metric('squat-width','双脚适当分开',Math.abs(p[27].x-p[28].x)/width,1.05,Infinity,'双脚适当分开，站稳后再缓缓屈膝',[27,28]);
      for(const leg of sides){
        const a=joint(leg.h,leg.k,leg.a);metric('squat-knee-'+leg.name,leg.name+'膝舒适屈曲',a,70,165,leg.name+(a>165?'膝再轻缓屈曲一点':'膝屈曲偏深，缓缓起身一些'),[leg.h,leg.k,leg.a],'angle');
        metric('squat-align-'+leg.name,leg.name+'膝与脚方向一致',Math.abs(p[leg.k].x-p[leg.a].x)/width,0,.55,leg.name+'膝朝同侧脚的方向调整，避免明显内扣',[leg.k,leg.a]);
        metric('squat-hand-'+leg.name,leg.name+'掌缓缓下按',(p[leg.w].y-sh.y)/torso,.35,Infinity,leg.name+'掌缓缓下按，肩膀放松',[leg.e,leg.w]);
        metric('squat-elbow-'+leg.name,leg.name+'肘保留余量',joint(leg.s,leg.e,leg.w),0,175,leg.name+'侧手肘保留轻微弯曲，不要锁紧',[leg.s,leg.e,leg.w],'angle');
      }upright();
    }else if(target.startsWith('claw')){
      const active=other,sign=Math.sign(p[side.s].x-p[other.s].x);
      metric('claw-reach','探掌越过身体中线',(p[active.w].x-sh.x)*sign/width,.30,Infinity,active.name+'掌随转体向'+side.name+'侧探出，越过身体中线',[active.s,active.e,active.w]);
      metric('claw-elbow','探出手臂舒展',joint(active.s,active.e,active.w),120,180,active.name+'侧手肘再舒展一点，让探掌路线连贯',[active.s,active.e,active.w],'angle');atWaist(side);
      if(!finite(world?.twist))unknown('claw-turn','肩髋配合转体','转体方向暂时看不清，请斜侧身并保持肩髋可见',[11,12,23,24]);
      else metric('claw-turn','肩髋配合转体',world.twist,6,85,world.twist<6?'腰身轻缓转动，让肩膀带着手臂探出':'转体幅度偏大，请缓缓回收一些',[11,12,23,24],'angle');
    }else if(target.startsWith('tiger')){
      lunge(side);bend(25);
      for(const arm of sides)metric('tiger-hand-'+arm.name,arm.name+'手向前下方伸',(p[arm.w].y-p[side.k].y)/width,-.25,Infinity,arm.name+'手随身体向前下方缓缓伸出',[arm.e,arm.w]);
    }else if(target==='bowReady'||target==='bow'){
      if(target==='bow')bend(20);else upright();
      sides.forEach(arm=>metric('bow-hand-'+arm.name,arm.name+'手轻贴耳侧',norm(sub(p[arm.w],p[0]))/width,0,.85,arm.name+'手轻贴耳侧，手肘自然展开，不要拉压颈部',[arm.e,arm.w,0]));kneeChecks();
    }else if(target.startsWith('tail')){
      bend(25);kneeChecks();const feet=mid(p[27],p[28]),hands=mid(p[15],p[16]),sign=Math.sign(p[side.s].x-p[other.s].x);
      metric('tail-hands','双手在两脚之间',Math.abs(hands.x-feet.x)/width,0,.55,'双手缓缓下落到两脚之间，摆转时尽量固定手的位置',[15,16,27,28]);
      metric('tail-hands-together','双手保持靠近',Math.abs(p[15].x-p[16].x)/width,0,.65,'双手保持在两脚之间，不要向两侧分开',[15,16]);
      metric('tail-hand-height','双手缓缓下探',(hands.y-(p[25].y+p[26].y)/2)/width,-.08,Infinity,'双手缓缓下落到膝部下方，保持舒适',[15,16]);
      if(target!=='tailCenter'){metric('tail-turn','头部轻向一侧摆转',(p[0].x-sh.x)*sign/width,.025,Infinity,'头轻向'+side.name+'侧摆转，双手保持在中间',[0,11,12]);
      metric('tail-hip','臀部轻向相反方向摆转',-((hips?.x??NaN)-feet.x)*sign/width,.025,Infinity,'臀部轻向头部的相反方向摆转，双手保持在中间',[23,24,27,28]);}
    }
    const required=options.verification?checks.filter(item=>!advisory.test(item.code)):checks;
    const reminders=checks.filter(item=>!required.includes(item));
    const failed=required.find(item=>!item.ready),passed=required.filter(item=>item.ready).length;
    const unseen=failed?.unknown&&failed.joints?.filter(id=>!visible(landmarks[id]));
    return{code:unseen?.length?'framing':failed?.code||'ready',message:failed?.message||(options.verification?'关键动作已识别。要领：'+tip(target):'本步要点已到位，保持片刻即可进入下一步'),joints:failed?.joints||[],ready:required.length>0&&!failed,checks:required,advisories:reminders,tip:tip(target),passed,total:required.length,tracking:true,hardFailure:required.some(item=>!item.ready&&item.gross)};
  }
  // Time-based smoothing: stable landmarks settle; moving joints respond quickly.
  // Current confidence is never smoothed, and absent joints are never synthesized.
  function createLandmarkFilter(){
    const history=new Map();let lastAt=null;
    function reset(){history.clear();lastAt=null;}
    function update(points,now,aspect=4/3){
      if(!finite(now)||!points?.length){reset();return points;}
      const dt=lastAt===null?0:now-lastAt;
      if(dt<=0||dt>config.smoothing.resetMs)history.clear();
      lastAt=now;
      const width=visible(points[11])&&visible(points[12])?Math.hypot((points[11].x-points[12].x)*aspect,points[11].y-points[12].y):.2;
      return points.map((p,id)=>{
        if(!visible(p)){history.delete(id);return p;}
        const old=history.get(id);let result={...p};
        if(old&&dt>0){
          const jump=Math.hypot((p.x-old.raw.x)*aspect,p.y-old.raw.y)/Math.max(.06,width);
          const speed=jump/(dt/1000),weight=Math.min(1,speed/config.smoothing.speedScale);
          const tau=config.smoothing.stillMs*(1-weight)+config.smoothing.movingMs*weight;
          const alpha=jump>.75?1:1-Math.exp(-dt/tau);
          result.x=old.filtered.x+alpha*(p.x-old.filtered.x);result.y=old.filtered.y+alpha*(p.y-old.filtered.y);
        }
        history.set(id,{raw:{x:p.x,y:p.y},filtered:result});return result;
      });
    }
    return{update,reset};
  }
  function createEvaluator(){
    let key='',lastAt=null;const history=new Map(),filter=createLandmarkFilter();
    function reset(){key='';lastAt=null;history.clear();filter.reset();}
    function measure(id,value,rule){
      if(!finite(value)){history.delete(id);return{value:null,ready:null};}
      const prior=history.get(id)||{samples:[],ready:false};
      const gross=value<rule.min-rule.guard||value>rule.max+rule.guard;
      const samples=gross?[value]:[...prior.samples,value].slice(-3),sorted=[...samples].sort((a,b)=>a-b);
      const filtered=sorted.length===2?(sorted[0]+sorted[1])/2:sorted[Math.floor(sorted.length/2)];
      const margin=prior.ready?rule.hysteresis:0;
      const ready=!gross&&filtered>=rule.min-margin-1e-7&&filtered<=rule.max+margin+1e-7;
      history.set(id,{samples,ready});return{value:filtered,ready};
    }
    return{reset,evaluate(landmarks,target,mode='standing',aspect=4/3,options={}){
      const nextKey=target+'|'+mode+'|'+aspect+'|'+!!options.verification,at=options.timestamp;
      if(nextKey!==key||finite(at)&&lastAt!==null&&(at<=lastAt||at-lastAt>config.staleMs))reset();
      key=nextKey;if(finite(at))lastAt=at;
      const smoothed=filter.update(landmarks,at,aspect);
      const raw=evaluate(landmarks,target,mode,aspect,options);
      const result=evaluate(smoothed,target,mode,aspect,{...options,measure});
      // Never let smoothing conceal a clear present-frame mistake or lost joint.
      const rawFailure=raw.checks.find(item=>item.unknown||!item.ready&&item.gross);
      if(!raw.tracking||rawFailure){
        if(!raw.tracking){history.clear();filter.reset();}
        if(rawFailure)history.delete(rawFailure.code);
        return{...raw,displayLandmarks:smoothed};
      }
      return{...result,displayLandmarks:smoothed};
    }};
  }
  const {holdMs,graceMs,staleMs}=config;
  // 只累计相邻有效观测之间的时间；短暂抖动暂停累计，不把遮挡时间当作到位。
  // 长时断流、明显偏差、暂停和换步均重新确认，杜绝用旧画面自动通关。
  function advanceHold(previous,observation,now,limit=holdMs){
    const ready=observation===true||observation?.ready===true;
    const empty={elapsed:0,lastAt:null,lastGoodAt:null,lastReady:false,samples:0,run:0,complete:false,recovering:false};
    let prior={...empty,...previous};
    if(!finite(now))return empty;
    if(prior.lastAt!==null&&(now<=prior.lastAt||now-prior.lastAt>staleMs))prior=empty;
    if(!ready){
      const expired=prior.lastGoodAt===null||now-prior.lastGoodAt>graceMs;
      if(expired||observation?.hardFailure)return{...empty,lastAt:now};
      return{...prior,lastAt:now,lastReady:false,run:0,complete:false,recovering:true};
    }
    if(prior.recovering&&(prior.lastGoodAt===null||now-prior.lastGoodAt>graceMs))prior=empty;
    const elapsed=Math.min(limit,prior.elapsed+(prior.lastReady?Math.min(250,now-prior.lastAt):0));
    const samples=prior.samples+1,run=prior.lastReady?prior.run+1:1;
    return{elapsed,lastAt:now,lastGoodAt:now,lastReady:true,samples,run,complete:elapsed>=limit&&samples>=4&&run>=2,recovering:false};
  }
  window.QimaiCoach={evaluate,createEvaluator,createLandmarkFilter,tip,advanceHold,holdMs,graceMs,staleMs,angle,worldFrame,isVisible:visible,supported};
})();
