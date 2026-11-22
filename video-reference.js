/* Choreography annotated from the user's plus(1).mp4 (13:13.48).
 * This is a cartoon retargeting of visible milestones, not motion capture or model training.
 * The source credit reads 天津中医药大学体育健康学院. Times refer to that local video.
 */
(function(){
  'use strict';
  const D=window.QimaiData,clone=p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,[...v]]));
  const pose=(name,base,changes)=>D.poses[name]={...clone(D.poses[base]),...changes};
  const mirror=p=>{const pairs={11:12,12:11,13:14,14:13,15:16,16:15,23:24,24:23,25:26,26:25,27:28,28:27};return Object.fromEntries(Object.entries(p).map(([k,v])=>[pairs[k]||k,[1-v[0],v[1]]]));};
  pose('push','push',{0:[.5,.19],11:[.39,.35],12:[.61,.35],13:[.36,.40],14:[.64,.40],15:[.34,.35],16:[.66,.35]});
  pose('ready','rest',{27:[.46,.94],28:[.54,.94]});
  pose('prayer','prayer',{13:[.35,.46],14:[.65,.46],15:[.49,.36],16:[.51,.36]});
  pose('chestPalms','prayer',{13:[.33,.46],14:[.67,.46],15:[.39,.36],16:[.61,.36]});
  pose('frontLift','rest',{13:[.35,.43],14:[.65,.43],15:[.40,.42],16:[.60,.42]});
  // Forward reach is shown from a slight angle so its depth is readable in 2-D.
  pose('forwardFlat','push',{});
  pose('spreadUp','spread',{});pose('spreadDown','spread',{});
  pose('earLift','sky',{13:[.27,.29],14:[.73,.29],15:[.39,.22],16:[.61,.22],27:[.4,.94],28:[.6,.94]});
  pose('sky','sky',{13:[.405,.185],14:[.595,.185],15:[.43,.02],16:[.57,.02],27:[.4,.94],28:[.6,.94]});
  pose('skyHeels','sky',{27:[.4,.91],28:[.6,.91]});pose('skyFists','sky',{});
  pose('waistFists','rest',{13:[.31,.49],14:[.69,.49],15:[.39,.58],16:[.61,.58]});
  pose('starL','starL',{0:[.46,.18],13:[.29,.22],15:[.42,.075],14:[.69,.49],16:[.56,.57]});
  pose('starTurnL','turnL',{13:[.29,.36],15:[.36,.26],14:[.68,.49],16:[.56,.57]});
  pose('pullOpenL','pullL',{13:[.22,.36],15:[.07,.31],14:[.70,.47],16:[.84,.54]});
  pose('pullL','pullL',{13:[.22,.38],15:[.34,.29],14:[.71,.47],16:[.85,.55]});
  pose('knifeL','knifeL',{13:[.26,.17],15:[.48,.22],14:[.70,.49],16:[.55,.57]});
  pose('knifeFoldL','knifeL',{0:[.35,.35],11:[.32,.43],12:[.52,.44],13:[.26,.35],15:[.35,.36],14:[.65,.52],16:[.53,.59]});
  pose('squatOpen','spreadDown',{27:[.23,.94],28:[.77,.94],25:[.33,.77],26:[.67,.77]});
  pose('squat','squat',{13:[.30,.61],14:[.70,.61],15:[.27,.73],16:[.73,.73]});
  pose('squatScoop','squat',{0:[.5,.22],11:[.39,.38],12:[.61,.38],13:[.31,.49],14:[.69,.49],15:[.34,.58],16:[.66,.58],23:[.43,.64],24:[.57,.64],25:[.31,.79],26:[.69,.79]});
  pose('clawL','clawL',{14:[.35,.36],16:[.14,.38],13:[.30,.49],15:[.43,.59]});
  pose('clawPressL','clawL',{0:[.38,.37],11:[.33,.47],12:[.53,.47],14:[.29,.58],16:[.25,.72]});
  pose('clawCircleL','clawPressL',{0:[.32,.48],11:[.30,.51],12:[.50,.54],14:[.39,.72],16:[.49,.88],13:[.45,.52],15:[.49,.60]});
  pose('tigerReadyL','waistFists',{0:[.45,.20],11:[.35,.35],12:[.55,.35],23:[.42,.61],24:[.56,.61],25:[.38,.76],27:[.47,.91],28:[.65,.94]});
  pose('tigerReachL','tigerL',{0:[.32,.36],11:[.30,.43],12:[.49,.44],13:[.19,.43],14:[.42,.48],15:[.09,.46],16:[.30,.50]});
  pose('tigerL','tigerL',{0:[.26,.49],11:[.28,.55],12:[.44,.57],13:[.23,.75],14:[.37,.75],15:[.22,.92],16:[.37,.92],23:[.53,.64],24:[.66,.64],25:[.25,.78],27:[.24,.94],26:[.77,.79],28:[.91,.94]});
  pose('bowReady','bowReady',{13:[.29,.26],14:[.71,.26],15:[.36,.24],16:[.64,.24]});
  pose('bow','bow',{13:[.24,.46],14:[.49,.42],15:[.26,.48],16:[.39,.45]});
  pose('bowRise','bowReady',{});
  pose('interlockFront','chestPalms',{13:[.32,.40],14:[.68,.40],15:[.49,.35],16:[.51,.35]});
  pose('interlockPress','interlockFront',{13:[.37,.36],14:[.63,.36],15:[.49,.30],16:[.51,.30]});
  pose('tailCenter','tailL',{0:[.31,.51],11:[.30,.54],12:[.48,.55],13:[.40,.74],14:[.55,.74],15:[.46,.91],16:[.54,.91],23:[.43,.61],24:[.57,.61]});
  pose('tailL','tailCenter',{0:[.27,.50],11:[.28,.54],12:[.48,.55],23:[.47,.61],24:[.61,.61]});
  pose('closingOpen','rest',{13:[.28,.47],14:[.72,.47],15:[.19,.56],16:[.81,.56]});
  pose('closingLift','prayer',{13:[.29,.26],14:[.71,.26],15:[.45,.14],16:[.55,.14]});
  pose('closingLower','close',{13:[.31,.46],14:[.69,.46],15:[.45,.45],16:[.55,.45]});
  for(const name of ['star','starTurn','pull','pullOpen','knife','knifeFold','claw','clawPress','clawCircle','tigerReady','tigerReach','tiger','tail'])D.poses[name+'R']=mirror(D.poses[name+'L']);
  // Keep the sagittal bend throughout lateral tail swings; screen mirroring
  // would incorrectly stand the mascot up halfway between the two sides.
  pose('tailR','tailCenter',{0:[.36,.51],11:[.33,.54],12:[.52,.55],23:[.40,.61],24:[.54,.61]});
  // Signed visible face: +1 shows the pads, -1 shows the furry back, 0 is edge-on.
  const palmFaces={relaxed:-1,level:0,prayer:0,open:1,up:1,down:-1,fist:-1,grip:-1,cover:-1,claw:1,round:.7,interlock:-1};
  const hand=(kind,angle=0,palm=palmFaces[kind]??-1)=>({kind,angle,palm});
  const pair=(a,b=a)=>({left:a,right:b});
  D.handPoses={
    rest:pair(hand('relaxed',Math.PI)),ready:pair(hand('relaxed',Math.PI)),close:pair(hand('relaxed',Math.PI)),
    prayer:pair(hand('prayer')),frontLift:pair(hand('up',Math.PI/2),hand('up',-Math.PI/2)),
    chestPalms:pair(hand('open')),push:pair(hand('open')),forwardFlat:pair(hand('level')),
    spread:pair(hand('open')),spreadUp:pair(hand('up',-Math.PI/2),hand('up',Math.PI/2)),spreadDown:pair(hand('down',-Math.PI/2),hand('down',Math.PI/2)),
    earLift:pair(hand('up',Math.PI/2),hand('up',-Math.PI/2)),sky:pair(hand('up',Math.PI/2),hand('up',-Math.PI/2)),skyHeels:pair(hand('up',Math.PI/2),hand('up',-Math.PI/2)),skyFists:pair(hand('fist')),
    waistFists:pair(hand('grip')),squatOpen:pair(hand('down',-Math.PI/2),hand('down',Math.PI/2)),squat:pair(hand('down',Math.PI/2),hand('down',-Math.PI/2)),squatScoop:pair(hand('up',Math.PI/2),hand('up',-Math.PI/2)),
    bowReady:pair(hand('cover',Math.PI/2),hand('cover',-Math.PI/2)),bow:pair(hand('cover',Math.PI/2),hand('cover',-Math.PI/2)),bowRise:pair(hand('cover',Math.PI/2),hand('cover',-Math.PI/2)),
    interlockFront:pair(hand('interlock')),interlockPress:pair(hand('interlock',0,1)),tailCenter:pair(hand('down',Math.PI)),
    closingOpen:pair(hand('up',Math.PI/2),hand('up',-Math.PI/2)),closingLift:pair(hand('round',Math.PI/2),hand('round',-Math.PI/2)),closingLower:pair(hand('down',Math.PI/2),hand('down',-Math.PI/2))
  };
  D.handPoses.push.projection=.43;D.handPoses.forwardFlat.projection=.43;
  for(const side of ['L','R']){
    const opposite=side==='L'?'right':'left',active=side==='L'?'left':'right';
    D.handPoses['star'+side]={[active]:hand('up',side==='L'?Math.PI/2:-Math.PI/2),[opposite]:hand('down',Math.PI)};
    D.handPoses['starTurn'+side]=D.handPoses['star'+side];
    for(const name of ['pull','pullOpen'])D.handPoses[name+side]=pair(hand('fist'));
    for(const name of ['knife','knifeFold'])D.handPoses[name+side]={[active]:hand('cover'),[opposite]:hand('down',Math.PI)};
    for(const name of ['claw','clawPress','clawCircle'])D.handPoses[name+side]={[active]:hand('grip'),[opposite]:hand(name==='claw'?'claw':'down',name==='claw'?(side==='L'?-Math.PI/2:Math.PI/2):Math.PI)};
    D.handPoses['tigerReady'+side]=pair(hand('grip'));D.handPoses['tigerReach'+side]=pair(hand('claw'));D.handPoses['tiger'+side]=pair(hand('down',Math.PI));D.handPoses['tail'+side]=pair(hand('down',Math.PI));
  }
  const st=(pose,check,cue,tip,reference,via=[])=>({pose,check,cue,tip,breath:'自然呼吸',reference,via,moveMs:Math.max(3000,2500+via.length*750)});
  const refs={
    wei1:[51,65],wei2:[65,91],wei3:[91,113],star:[113,138],pull:[138,200],push:[200,267],knife:[267,372],squat:[372,425],claw:[425,490],tiger:[490,535],bow:[535,632],tail:[632,712]
  };
  const entries={
    wei1:[
      st('rest','rest','左脚侧开半步，两脚平行站稳','头颈自然立起，肩膀放松。',[38,51]),
      st('prayer','prayer','两臂从前方抬起，在胸前轻轻合掌','掌心轻合，肘部自然下沉，腋下留出空间。',[54,60],['frontLift']),
      st('prayer','prayer','保持胸前合掌，目光看向前下方','手掌轻合，不用挤压；保持自然呼吸。',[60,63]),
      st('prayer','prayer','保持松肩合掌，准备下一势','这一势以胸前合掌结束，不急着把手放下。',[63,65])
    ],
    wei2:[
      st('forwardFlat','push','抬肘，两臂向前平伸','两手分开，沿肩部高度向前伸出。',[68,73],['chestPalms']),
      st('spreadUp','spread','双臂沿水平方向向两侧展开','沿水平路线展开，不绕到头顶。',[73,77]),
      st('spread','spread','坐腕立掌，双臂保持平展','手指朝上，肩膀放松，避免用力锁肘。',[77,83]),
      st('forwardFlat','push','松腕松肘，双臂水平收向前方','两臂沿来路内收，双手保持分开。',[83,91],['spreadUp'])
    ],
    wei3:[
      st('earLift','earLift','翻掌，屈肘收至耳侧附近','两掌翻向上，准备从头部两侧上举。',[94,98],['chestPalms']),
      st('sky','sky','双掌向上托举，指尖相对','掌心向上，手臂在舒适范围内伸展。',[98,102]),
      st('skyHeels','sky','站稳后轻提脚跟，继续向上托掌','先保持平衡；不稳时脚跟留在地面。',[102,106]),
      st('rest','rest','两手握拳，双臂缓缓下落','脚跟轻落，松肩回到站立位置。',[106,113],['skyFists','earLift','waistFists'])
    ],
    star:[
      st('starL','starL','转身，一手向上托掌，另一手贴背','按画面方向伸展，目光随上举的手；不要挺腹。',[116,125],['starTurnL']),
      st('spreadUp','spread','放松回正，两臂自然平展','上举的手缓缓放下，另一手从背侧展开。',[125,130]),
      st('starR','starR','换向转身，交换上托与贴背的手','两侧交替做，动作轻缓，保持站稳。',[130,137],['starTurnR']),
      st('waistFists','rest','放下双臂，准备前后开步','松肩，平稳衔接下一势。',[137,142],['closingOpen'])
    ],
    pull:[
      st('pullL','pullL','前后开步，双手握拳，前手缓缓回拽','前腿轻屈，前臂屈肘牵引，后臂向后伸展。',[142,154],['lungeL','pullOpenL']),
      st('pullOpenL','pullOpenL','前后双臂缓缓展开，再舒展一次','保持前后脚稳定，双拳不必用力攥紧。',[154,170],['pullL']),
      st('pullR','pullR','换脚转身，换侧握拳牵引','换侧前先站稳，再把前手缓缓回拽。',[171,186],['waistFists','lungeR','pullOpenR']),
      st('pullOpenR','pullOpenR','双臂前后展开，完成这一侧','回拽与展开连贯完成，保持自然呼吸。',[186,200],['pullR'])
    ],
    push:[
      st('chestPalms','chestPalms','展肩扩胸，两手收至胸前立掌','双掌分开、掌心向前，这里不做合掌。',[200,211],['spreadUp']),
      st('push','push','双掌缓缓向前推出','手指舒展，肩膀放松，避免屏气用力。',[211,217]),
      st('push','push','松腕放松，双掌保持前伸','先放松，再准备收回，不必僵硬撑住。',[217,222]),
      st('chestPalms','chestPalms','屈肘收回，在胸前重新立掌','两手保持分开，回到下一次推掌的起点。',[222,227])
    ],
    knife:[
      st('knifeL','knifeL','转身抡臂，一手绕头拨耳，另一手贴背','头后手轻贴，背侧手放松，不拉扯颈部。',[267,282],['spreadDown','earLift']),
      st('knifeFoldL','knifeL','两肘缓缓合拢，上体随之轻缓前俯','先展再合；幅度小一点，不用手压头。',[282,316],['knifeL','knifeFoldL','knifeL']),
      st('knifeR','knifeR','转正展开双臂，换侧绕头贴背','先回正，再交换两只手的位置。',[316,330],['spreadDown','earLift']),
      st('knifeFoldR','knifeR','换侧做肘部开合，随动作轻缓俯身','肘部开合与上体动作配合，保持自然呼吸。',[330,363],['knifeR','knifeFoldR','knifeR'])
    ],
    squat:[
      st('squatOpen','spread','双臂侧平举，掌心向下，开步站稳','两脚适当分开，先稳住再下蹲。',[366,377],['spreadDown']),
      st('squat','squat','缓缓屈膝下落，两掌向下按','膝盖沿脚尖方向，蹲到自己能控制的位置。',[377,383]),
      st('squatScoop','rest','翻掌向上，像捧起物品一样缓缓起身','上捧与起身连贯，不急着弹起。',[383,388]),
      st('squatOpen','spread','起身后翻掌向下，两臂回到侧平举','肩膀保持放松，准备下一次下落。',[388,394])
    ],
    claw:[
      st('clawL','clawL','双手握固收腰，右手松开，向左探掌','探掌越过身体中线，另一拳留在腰间。',[428,444],['waistFists','chestPalms']),
      st('waistFists','rest','掌向下按，前俯划弧，再握固收腰','探、按、划弧、回收连贯完成，幅度以舒适为准。',[444,460],['clawPressL','clawCircleL']),
      st('clawR','clawR','换左手松开，向右侧探掌','身体随手轻缓转动，另一拳仍留在腰间。',[460,471],['chestPalms']),
      st('waistFists','rest','换侧下按划弧，起身收拳于腰间','起身保持缓慢，不用惯性甩动手臂。',[471,490],['clawPressR','clawCircleR'])
    ],
    tiger:[
      st('tigerReadyL','rest','扣脚转身，收成丁步，双手握固','先站稳，再准备向前迈步。',[493,498],['waistFists']),
      st('tigerL','tigerL','前迈成弓步，双手前扑，俯身下按','手随身体向前下方伸；不必勉强触地。',[498,513],['lungeL','tigerReachL']),
      st('tigerReadyR','rest','缓缓起身握固，转身换侧成丁步','先恢复平衡，再准备换腿前迈。',[513,523],['waistFists']),
      st('tigerR','tigerR','换侧前扑俯身，两掌缓缓下按','前后脚站稳，保持自然呼吸。',[523,535],['lungeR','tigerReachR'])
    ],
    bow:[
      st('bowReady','bowReady','双臂从两侧抬起，两掌轻掩耳侧','手指轻贴枕后，可轻叩；不要拉压颈部。',[542,566],['spreadUp','earLift']),
      st('bow','bow','上体缓缓前屈，双手保持轻贴','手肘随身体自然收合，不用力拉头。',[566,575]),
      st('bowRise','bowReady','缓缓伸展起身，保持肩颈放松','沿来路慢慢起身，避免突然抬头。',[575,584]),
      st('bow','bow','再次缓慢前屈，停在舒适的位置','保持自然呼吸；结束时再沿来路起身。',[584,597])
    ],
    tail:[
      st('tailCenter','tailCenter','十指交叉翻掌外撑，再内收下按、缓缓前俯','上体下降时双手下探，停在自己稳定的位置。',[628,645],['bowRise','interlockFront','interlockPress','closingLower']),
      st('tailL','tailL','保持前俯，轻轻向左摆尾，再回中间','双手位置尽量稳定，头与髋部轻缓配合。',[645,655]),
      st('tailR','tailR','身体仍保持前俯，换向右侧轻缓摆尾','左右摆转之间不站起来，摆幅以舒适为准。',[655,669],['tailCenter']),
      st('rest','rest','转正慢慢起身，两臂上抱，再缓缓下引','自然呼吸，双手轻落后，回到松静站立。',[706,775],['tailCenter','closingOpen','closingLift','closingLower'])
    ]
  };
  D.lessons.forEach(l=>{l.reference=refs[l.id];l.steps=entries[l.id];l.tip=l.steps[0].tip;l.short={wei1:'前抬合掌',wei2:'平伸外展 · 坐腕立掌',wei3:'翻掌上托 · 握拳下落',star:'转身摘星 · 左右换手',pull:'握拳牵引 · 回拽展开',push:'胸前立掌 · 推松收回',knife:'绕臂拨耳 · 开合俯身',squat:'下按上捧 · 缓起缓落',claw:'跨身探掌 · 下按划弧',tiger:'丁步前扑 · 俯身下按',bow:'掩耳前屈 · 缓缓伸展',tail:'连续摆尾 · 上抱下引'}[l.id];
    l.coverage='检验可见的关键动作；掌心朝向、握固、掩耳轻叩与用力方式按示范学习，不作为摄像头已验证的项目。';
  });
  // Seated lessons remain the existing upper-body adaptations, not the standing video routine.
  D.sources=[['本次动作参考：用户提供的天津中医药大学体育健康学院演练视频','reference.html'],...D.sources];
  const handState=(from,step,amount)=>{
    const names=[from,...(step.via||[]),step.pose].filter((n,i,a)=>i===0||n!==a[i-1]);
    const position=QimaiMotion.ease(Math.max(0,Math.min(1,amount)))*(names.length-1),i=Math.min(names.length-1,Math.floor(position));
    const a=D.handPoses[names[i]]||D.handPoses.rest,b=D.handPoses[names[Math.min(i+1,names.length-1)]]||D.handPoses.rest,u=position-i;
    const mix=(x,y)=>({kind:u<.5?x.kind:y.kind,palm:x.palm+(y.palm-x.palm)*u,cover:(x.kind==='cover'?1:0)*(1-u)+(y.kind==='cover'?1:0)*u,angle:x.angle+Math.atan2(Math.sin(y.angle-x.angle),Math.cos(y.angle-x.angle))*u});
    return{left:mix(a.left,b.left),right:mix(a.right,b.right),projection:(a.projection||1)+((b.projection||1)-(a.projection||1))*u};
  };
  const duration=(step,seated=false)=>seated?QimaiMotion.moveMs:(step.moveMs||3000);
  QimaiMotion.handState=handState;QimaiMotion.duration=duration;
  window.QimaiVideoReference={filename:'plus(1).mp4',credit:'天津中医药大学体育健康学院',duration:793.48,segments:refs,closing:[712,775],mode:'manually-annotated-cartoon-reference',frameRate:25};
})();
