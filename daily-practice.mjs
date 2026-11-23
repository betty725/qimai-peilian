import {createStampBook,getDailyMoves,getDayPillar,takeAtlasOrigin,recordDailyArrival} from './atlas/daily.mjs';
import {todayInChina} from './atlas/season-calendar.mjs';

// Coordinates use the same mirrored joint rig as the course demonstrations.
const pose=changes=>({...window.QimaiData.poses.rest,...changes});
const rest=()=>pose({});
const front=()=>pose({13:[.32,.48],14:[.68,.48],15:[.465,.41],16:[.535,.41]});
const open=()=>pose({13:[.24,.37],14:[.76,.37],15:[.09,.34],16:[.91,.34]});
const side=(left,lift)=>pose(left?{
  13:lift?[.34,.21]:[.24,.36],15:lift?[.38,.075]:[.09,.35]
}:{
  14:lift?[.66,.21]:[.76,.36],16:lift?[.62,.075]:[.91,.35]
});
const waist=(offset=0)=>pose({13:[.32,.48],14:[.68,.48],15:[.40,.57+offset],16:[.60,.57+offset]});
const lowerSides=()=>pose({13:[.34,.50],14:[.66,.50],15:[.35,.64],16:[.65,.64]});
const thighs=()=>pose({13:[.32,.51],14:[.68,.51],15:[.38,.67],16:[.62,.67]});
const rub=up=>pose({13:[.32,.47],14:[.68,.47],15:[.487,up?.39:.44],16:[.513,up?.44:.39]});
const shoulder=(lift,spread)=>pose({
  11:[.39-spread,.35-lift],12:[.61+spread,.35-lift],
  13:[.35-spread,.47-lift],14:[.65+spread,.47-lift],15:[.36-spread,.59-lift],16:[.64+spread,.59-lift]
});

const paths={
  lift:[rest,()=>side(true,true),rest,()=>side(false,true),rest,()=>side(true,true),rest,()=>side(false,true),rest],
  reach:[rest,()=>side(true,false),rest,()=>side(false,false),rest],
  open:[front,open,front,open,front],
  warm:[front,()=>rub(true),()=>rub(false),()=>rub(true),()=>rub(false),()=>rub(true),()=>rub(false),
    ()=>waist(),()=>waist(.025),()=>waist(),()=>waist(.025),()=>waist(),front],
  shoulder:[rest,()=>shoulder(.055,0),()=>shoulder(.032,.018),rest,()=>shoulder(.055,0),()=>shoulder(.032,.018),rest],
  settle:[front,mode=>mode==='seated'?thighs():lowerSides(),mode=>mode==='seated'?thighs():lowerSides()]
};
const durations={lift:20,reach:10,open:8,warm:12,shoulder:7,settle:6,wrists:10};
const quickCues={
  lift:'左右交替上托，每次回到身侧。左右各两次，共四次。',reach:'一手向同侧伸出，收回，再换另一边。',
  open:'从胸前展开双臂，再合回，慢慢做两次。',warm:'轻搓双掌，贴在腰侧上下轻摩两个来回，再收回。',
  shoulder:'放下双手，肩膀缓缓提起、向后、落下，做两圈。',settle:'双手从胸前缓缓落下，放松停稳。',
  wrists:'双肘靠近身体，双腕慢慢画小圈，顺逆各两圈。'
};
const coverage={
  lift:'观察左右手交替上举和回位。',reach:'观察两侧分别伸展及手臂回收。',
  open:'观察双臂从合到开、再合回的路径。',warm:'观察双手靠近时的往复移动、腰侧停留与收回。',
  shoulder:'从正面观察双肩的起落，回环的前后方向请参照示范。',settle:'观察双手从胸前下落并停稳。',
  wrists:'观察双手绕腕的路径、方向变化和肘部位置。'
};

export function sampleDaily(id,seconds,mode) {
  const phase=(seconds%durations[id])/durations[id];
  let points;
  let leftAngle=Math.PI,rightAngle=Math.PI;
  if(id==='wrists'){
    // First two turns in one direction, then trace two in reverse.
    const a=(phase<.5?phase:1-phase)*8*Math.PI;
    const dx=.030*Math.cos(a),dy=.027*Math.sin(a);
    const frame=pose({13:[.345,.49],14:[.655,.49],15:[.385+dx,.409+dy],16:[.615-dx,.409+dy]});
    points=window.QimaiMotion.interpolate(frame,frame,1,mode==='seated');
    leftAngle=.55*Math.sin(a);rightAngle=-leftAngle;
  }else{
    const frames=paths[id],position=phase*(frames.length-1),i=Math.floor(position);
    points=window.QimaiMotion.interpolate(frames[i](mode),frames[i+1](mode),position-i,mode==='seated');
    leftAngle=Math.atan2(points[15][0]-points[13][0],points[13][1]-points[15][1]);
    rightAngle=Math.atan2(points[16][0]-points[14][0],points[14][1]-points[16][1]);
  }
  return {points,handPose:{
    left:{kind:'open',angle:leftAngle,palm:.8},right:{kind:'open',angle:rightAngle,palm:.8}
  }};
}

export function dailySession(source,mode) {
  const date=todayInChina();
  const pillar=getDayPillar(date);
  let storage;
  try {storage=window.localStorage;}catch{}
  const lessons=getDailyMoves(date).map(move=>({
    id:move.id,name:move.name[0],ai:true,view:'正对镜头，头、肩、肘、手和腰部入镜',
    coverage:coverage[move.id],duration:durations[move.id],
    steps:[{pose:'rest',check:move.id,cue:quickCues[move.id],tip:move.cue[0],breath:'自然呼吸'}]
  }));
  return {lessons,daily:{date,pillar:pillar.pillar,stem:pillar.stem,source,mode,book:createStampBook(storage),
    atlasOrigin:source==='atlas'?takeAtlasOrigin():null,recordArrival:recordDailyArrival,
    evaluator:window.QimaiDailyEvaluator.create(lessons[0].id,mode),progress:0,sample:sampleDaily}};
}
