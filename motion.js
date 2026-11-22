/* 十二势的分段动作与连续关节路径；其余课程、奖励配置保持原数据。 */
(function(){
  'use strict';
  const D=window.QimaiData;
  const copy=p=>Object.fromEntries(Object.entries(p).map(([id,v])=>[id,[...v]]));
  const shape=(base,changes)=>({...copy(D.poses[base]),...changes});
  const mirror=p=>{const pairs={11:12,12:11,13:14,14:13,15:16,16:15,23:24,24:23,25:26,26:25,27:28,28:27};return Object.fromEntries(Object.entries(p).map(([id,v])=>[pairs[id]||id,[1-v[0],v[1]]]));};
  // 手臂角度与动作要点对应；前屈时髋与脚的高度不跟着头部漂移。
  D.poses.sky=shape('sky',{13:[.39,.185],14:[.61,.185],15:[.39,.025],16:[.61,.025]});
  D.poses.starL=shape('starL',{13:[.37,.19],15:[.35,.03],14:[.68,.48],16:[.56,.58]});
  D.poses.pullL=shape('pullL',{13:[.20,.36],15:[.25,.25]});
  D.poses.push=shape('push',{0:[.47,.19],11:[.38,.35],12:[.56,.35],13:[.54,.33],14:[.72,.38],15:[.71,.32],16:[.88,.40]});
  D.poses.knifeL=shape('knifeL',{13:[.27,.16],15:[.48,.20],14:[.71,.48],16:[.56,.58]});
  D.poses.clawL=shape('clawL',{0:[.43,.28],11:[.34,.40],12:[.55,.39],13:[.29,.44],15:[.46,.57],14:[.38,.34],16:[.16,.38],23:[.46,.61],24:[.60,.61]});
  D.poses.tigerL=shape('tigerL',{25:[.23,.77],27:[.24,.94]});
  D.poses.bow=shape('bow',{0:[.28,.47],11:[.29,.48],12:[.47,.51],13:[.22,.35],14:[.51,.37],15:[.27,.43],16:[.35,.45],23:[.43,.61],24:[.57,.61]});
  D.poses.tailL=shape('tailL',{0:[.35,.51],11:[.35,.54],12:[.55,.55],13:[.39,.68],14:[.54,.69],15:[.47,.84],16:[.53,.84],23:[.47,.61],24:[.61,.61]});
  for(const name of ['star','pull','knife','claw','tiger','tail'])D.poses[name+'R']=mirror(D.poses[name+'L']);
  D.poses.gather=shape('prayer',{13:[.29,.45],14:[.71,.45],15:[.43,.48],16:[.57,.48]});
  D.poses.scoop=shape('close',{13:[.28,.47],14:[.72,.47],15:[.30,.56],16:[.70,.56]});
  D.poses.raise=shape('prayer',{13:[.30,.29],14:[.70,.29],15:[.43,.18],16:[.57,.18]});
  D.poses.turnL=shape('close',{0:[.47,.20],11:[.37,.35],12:[.57,.35],15:[.40,.55],16:[.57,.56]});
  D.poses.turnR=mirror(D.poses.turnL);
  D.poses.lungeL=shape('pullL',{13:[.29,.49],15:[.35,.59],14:[.65,.49],16:[.62,.58]});D.poses.lungeR=mirror(D.poses.lungeL);
  D.poses.clawSweepL=shape('clawL',{0:[.43,.37],11:[.35,.47],12:[.56,.46],14:[.35,.59],16:[.37,.74]});D.poses.clawSweepR=mirror(D.poses.clawSweepL);
  const views={wei1:'正对镜头',wei2:'正对镜头',wei3:'正对镜头',star:'正面略转身，双手留在画面内',pull:'斜侧面对镜头，前后腿都要看清',push:'斜侧面对镜头，展示双掌前伸',knife:'斜侧面对镜头，让头后与背侧手可见',squat:'正对镜头，全身入镜',claw:'斜侧面对镜头，展示转体探掌',tiger:'斜侧面对镜头，前后脚与双手入镜',bow:'斜侧面对镜头，展示前屈幅度',tail:'斜侧面对镜头，双手与双脚留在画面中'};
  const paths={
    wei1:[[],['gather'],[],['gather']],wei2:[[],['raise'],[],['gather']],wei3:[[],['raise'],[],['raise']],
    star:[['turnL','raise'],['turnL'],['turnR','raise'],['turnR']],
    pull:[['lungeL'],['lungeL'],['lungeR'],['lungeR']],
    push:[['gather'],[],[],['gather']],knife:[['raise'],['raise'],['raise'],['raise']],
    squat:[['scoop'],[],[],['scoop']],claw:[['turnL'],['clawSweepL','turnL'],['turnR'],['clawSweepR','turnR']],
    tiger:[['lungeL'],['lungeL'],['lungeR'],['lungeR']],bow:[['raise'],[],[],['gather']],tail:[['scoop'],['scoop'],['scoop'],['scoop']]
  };
  const coverage={
    wei1:'观察合掌高度、手臂位置和身体中正；掌间用力不作判定。',wei2:'观察两臂高度、伸展与身体稳定；掌心朝向不作判定。',wei3:'观察托举高度、肘角和身体稳定；提踵与掌心朝向不作判定。',
    star:'观察左右手位置与躯干稳定；背侧手需清晰可见。',pull:'观察前后腿角度、牵引手臂和躯干；旋拧用力不作判定。',push:'结合三维关键点观察前伸深度与手肘；呼吸和用力不作判定。',
    knife:'观察绕臂位置、背侧手与躯干；遮挡时暂停判定。',squat:'观察开步、屈膝、下按和躯干；发声不作判定。',claw:'观察探掌、转体和膝部；手指形状不作判定。',
    tiger:'观察弓步、俯身和双手下探；手指支撑力不作判定。',bow:'观察前屈、手臂位置与膝部；脊柱逐节顺序不作判定。',tail:'观察前屈、双手位置与摆转；深层脊柱活动不作判定。'
  };
  D.lessons.forEach(lesson=>{lesson.ai=true;lesson.view=views[lesson.id];lesson.coverage=coverage[lesson.id];lesson.steps=lesson.steps.map((step,index)=>({...step,check:step.pose,via:paths[lesson.id][index],view:views[lesson.id]}));});
  // 五次缓动使起停的速度和加速度连续；通过中间姿态绘制关节角曲线。
  const ease=t=>t*t*t*(t*(t*6-15)+10);
  const mix=(a,b,t)=>a+(b-a)*t;
  const unwrap=(a,b)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a));
  function interpolate(from,to,amount,seated=false){
    const t=ease(Math.max(0,Math.min(1,amount))),points={};
    Object.keys(from).forEach(id=>{points[id]=[mix(from[id][0],to[id][0],t),mix(from[id][1],to[id][1],t)];});
    for(const [root,elbow,wrist]of [[11,13,15],[12,14,16]]){
      let parent=points[root];
      for(const [a,b]of [[root,elbow],[elbow,wrist]]){
        const start=[from[b][0]-from[a][0],from[b][1]-from[a][1]],end=[to[b][0]-to[a][0],to[b][1]-to[a][1]];
        const theta=Math.atan2(start[1],start[0]),angle=mix(theta,unwrap(theta,Math.atan2(end[1],end[0])),t),length=mix(Math.hypot(...start),Math.hypot(...end),t);
        points[b]=[parent[0]+Math.cos(angle)*length,parent[1]+Math.sin(angle)*length];parent=points[b];
      }
    }
    if(seated){points[23]=[.43,.61];points[24]=[.57,.61];points[25]=[.34,.70];points[26]=[.66,.70];points[27]=[.34,.88];points[28]=[.66,.88];}
    return points;
  }
  function sample(fromName,step,amount,seated=false){
    const names=[fromName,...(step.via||[]),step.pose].filter((name,i,all)=>i===0||name!==all[i-1]);
    if(names.length===1)return interpolate(D.poses[fromName],D.poses[fromName],1,seated);
    const t=Math.max(0,Math.min(1,amount)),position=ease(t)*(names.length-1),i=Math.min(names.length-2,Math.floor(position)),u=position-i;
    const frames=names.map(name=>D.poses[name]);
    const curve=values=>{
      const p0=values[Math.max(0,i-1)],p1=values[i],p2=values[i+1],p3=values[Math.min(values.length-1,i+2)];
      return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u);
    };
    const result={};
    for(const id of Object.keys(frames[0]))result[id]=[0,1].map(axis=>curve(frames.map(frame=>frame[id][axis])));
    for(const [root,elbow,wrist]of [[11,13,15],[12,14,16]]){
      let parent=result[root];
      for(const [a,b]of [[root,elbow],[elbow,wrist]]){
        let angles=[],lengths=[];
        for(const frame of frames){const dx=frame[b][0]-frame[a][0],dy=frame[b][1]-frame[a][1],theta=Math.atan2(dy,dx);angles.push(angles.length?unwrap(angles[angles.length-1],theta):theta);lengths.push(Math.hypot(dx,dy));}
        const angle=curve(angles),length=Math.max(.02,curve(lengths));
        result[b]=[parent[0]+Math.cos(angle)*length,parent[1]+Math.sin(angle)*length];parent=result[b];
      }
    }
    if(seated){result[23]=[.43,.61];result[24]=[.57,.61];result[25]=[.34,.70];result[26]=[.66,.70];result[27]=[.34,.88];result[28]=[.66,.88];}
    else if(t>0&&t<1)for(const id of [27,28]){const a=frames[0][id],b=frames[frames.length-1][id];if(Math.abs(a[0]-b[0])>.13)result[id][1]-=.025*Math.sin(Math.PI*t);}
    return result;
  }
  window.QimaiMotion={sample,interpolate,ease,moveMs:2000,holdMs:3000};
})();
