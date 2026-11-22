(function(){'use strict';
const $=id=>document.getElementById(id),S=QimaiPetState,clock=S.create(),copy=QimaiPetCopy.create(),bridge=window.webkit?.messageHandlers?.pet,visual=QimaiPetVisual.create(),reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const writer=window.QimaiPetWriting?.create($('writingScene'));
let stream=null,model=null,epoch=0,pending=false,lastVideo=-1,lastSeen=0,cameraReadyAt=0,lastGuess={state:'unknown',detail:'摄像头未开启'},mode='auto',profiles={},calibration=null,preview=false,shown='',loading=false;
try{const data=window.QimaiPetSaved||JSON.parse(localStorage.getItem('qimai_pet_settings')||'{}');if([20,30,45,60].includes(data.minutes))clock.setMinutes(data.minutes);for(const k of ['screen','writing'])if(Array.isArray(data[k])&&data[k].length===4&&data[k].every(Number.isFinite))profiles[k]=data[k];}catch(_){}
$('minutes').value=clock.minutes;
function setText(id,text){const el=$(id);if(el.textContent!==text)el.textContent=text;}
function save(){bridge?.postMessage({action:'settings',settings:{...profiles,minutes:clock.minutes}});try{localStorage.setItem('qimai_pet_settings',JSON.stringify({...profiles,minutes:clock.minutes}));}catch(_){$('error').textContent='当前设置无法保存，下次打开需重新校准。';}}
function native(action){bridge?.postMessage({action});}
function stopCamera(){epoch++;stream?.getTracks().forEach(t=>t.stop());stream=null;model?.close();model=null;$('video').srcObject=null;loading=false;pending=false;lastSeen=0;cameraReadyAt=0;calibration=null;clock.reset();$('camera').textContent='开启摄像头观察';$('camera').disabled=false;$('privacy').textContent='仅本机分析 · 不录像、不上传';lastGuess={state:'unknown',detail:'摄像头未开启，自动计时暂停'};}
async function startCamera(){
 if(stream||loading){stopCamera();return;}
 const token=++epoch;loading=true;mode='auto';$('mode').value='auto';$('camera').disabled=true;$('camera').textContent='正在开启…';$('error').textContent='';
 try{
  const incoming=await QimaiCameraAccess.open(()=>token===epoch);
  if(token!==epoch){incoming.getTracks().forEach(t=>t.stop());return;}
  stream=incoming;$('video').srcObject=stream;await $('video').play();
  stream.getVideoTracks()[0].addEventListener('ended',()=>{if(token===epoch)stopCamera();});
  const detector=await QimaiTracker.create();if(token!==epoch){detector.close();return;}model=detector;lastVideo=-1;cameraReadyAt=Date.now();
  $('camera').textContent='关闭摄像头';$('privacy').textContent='● 摄像头观察中 · 仅本机分析';
 }catch(e){if(token!==epoch)return;stopCamera();$('error').textContent=e.name==='NotAllowedError'?'摄像头未获授权。可以用手动状态继续陪伴。':(e.name==='NotReadableError'?'摄像头可能被其他应用占用，请关闭其他摄像头页面后重试。':e.name==='NotFoundError'?'没有找到摄像头，请检查设备连接。':'未能启动：'+e.name+' · '+e.message);$('options').hidden=false;}
 finally{if(token===epoch){loading=false;$('camera').disabled=false;}}
}
async function observe(){
 if(!stream||!model||pending||$('video').readyState<2||$('video').currentTime===lastVideo)return;
 const token=epoch;pending=true;lastVideo=$('video').currentTime;const began=performance.now();
 try{const result=await model.detectForVideo($('video'),began);if(token!==epoch||performance.now()-began>2500)return;const f=S.features(result.landmarks?.[0]);lastSeen=Date.now();lastGuess={...S.guess(f,profiles),sampleAt:lastSeen};
 if(calibration){if(S.complete(f))calibration.samples.push(f);if(Date.now()-calibration.started>=5000){const {kind,samples}=calibration;calibration=null;if(samples.length<6){$('calibrationStatus').textContent='可见样本不足，请调整镜头后重试。';return;}const average=samples[0].map((_,i)=>samples.reduce((n,v)=>n+v[i],0)/samples.length);if(samples.some(f=>S.distance(f,average)>.15)){$('calibrationStatus').textContent='姿势变化较大，请保持自然姿势重新校准。';return;}profiles[kind]=average;save();$('calibrationStatus').textContent=profiles.screen&&profiles.writing?(S.distance(profiles.screen,profiles.writing)<.055?'两种姿势太相似，先按桌前姿态计时；可重新校准。':'两种姿势已保存。仍为姿态推测，可随时手动切换。'):'已保存这一种姿势并启用；也可再校准另一种。';}else $('calibrationStatus').textContent='保持'+(calibration.kind==='screen'?'平常看屏幕':'平常低头书写')+'的姿势，剩余 '+Math.ceil((5000-Date.now()+calibration.started)/1000)+' 秒';}
 }catch(_){lastGuess={state:'unknown',detail:'观察暂时中断，计时暂停'};lastSeen=0;}finally{if(token===epoch)pending=false;}
}
const names={screen:'看屏幕',writing:'低头书写',desk:'桌前陪伴',away:'暂未入镜',unknown:'观察中',idle:'安静陪伴',rest:'活动休息'};
function tick(){
 const now=Date.now();if(calibration&&now-calibration.started>9000){calibration=null;$('calibrationStatus').textContent='没有获得足够新画面，请重新校准。';}let observation=mode==='auto'?(stream&&lastSeen&&now-lastSeen<2600?lastGuess:{sampleAt:NaN,state:'unknown',detail:stream?(model?(now-cameraReadyAt>8000?'没有收到清晰的新画面，请检查摄像头预览或重新开启':'正在获取头肩姿态，请面向镜头'):'正在加载本地识别引擎…'):'打开观察，或选一个现在的状态。'}):{state:mode,detail:'手动选择 · 按你选择的状态计时'};
 const r=clock.update(observation,now,{manual:mode!=='auto'}),state=r.state;
 const appearance=visual.update(state,now,{immediate:mode!=='auto'||!stream});
 const source=QimaiPetVisual.asset(appearance,!!reducedMotion?.matches);if(shown!==source){$('mascot').src=source;shown=source;}
 $('scene').className='scene '+appearance;$('activityIcon').textContent=({screen:'▣',writing:'✎',desk:'▣',rest:'☀',away:'☾'})[state]||'✦';
 writer?.setActive(appearance==='writing',!!reducedMotion?.matches);
 $('status').textContent=(mode==='auto'&&['screen','writing'].includes(state)?'疑似 · ':mode!=='auto'&&state!=='rest'?'手动 · ':'')+(mode==='auto'&&!stream?'安静陪伴':(state==='unknown'&&stream&&model&&now-cameraReadyAt>8000?'观察暂停':names[state])||'安静陪伴');
 $('timer').textContent=r.restRemaining?'活动中 '+Math.ceil(r.restRemaining/1000)+' 秒':r.activeMs>0?'已陪你 '+(r.activeMs<60000?Math.floor(r.activeMs/1000)+' 秒':Math.floor(r.activeMs/60000)+' 分钟'):'计时未开始';
 const due=preview||r.due;document.body.classList.toggle('break-due',due);$('breakActions').hidden=!due;
 const words=copy.update({due:r.due,preview,minutes:clock.minutes,state,activeMs:r.activeMs,restRemaining:r.restRemaining},now);
 setText('eyebrow',due?(preview?'提醒效果预览':`看山记着 · 你设定的 ${clock.minutes} 分钟提醒`):'看山陪你，慢慢来');
 setText('practice',words?.action||'跟我活动一下 ↗');
 setText('message',words?.title||({screen:'电脑陪你工作，我陪你休息。',writing:'你写下一笔，我陪你一点。',desk:'你专心忙，我记着休息时间。',rest:'慢慢活动，我在这里等你。',away:'你离开一会儿，我也歇一歇。',unknown:'你忙你的，我陪着你。',idle:'不着急，按自己的节奏来。'})[state]);
 setText('detail',words?.detail||observation.detail);
 observe();
}
$('camera').onclick=startCamera;$('mode').onchange=e=>{mode=e.target.value;stopCamera();preview=false;tick();};
$('position').onclick=()=>{if(bridge)native('position');else $('error').textContent='浏览器版跟随浏览器窗口；桌面版支持复原悬浮位置。';};
$('settings').onclick=()=>{$('options').hidden=!$('options').hidden;};$('dismiss').onclick=()=>{$('options').hidden=true;};
$('minutes').onchange=e=>{clock.setMinutes(+e.target.value);save();tick();};
$('previewBreak').onclick=()=>{copy.preview(clock.minutes,mode==='auto'?lastGuess.state:mode);preview=true;$('options').hidden=true;tick();};
$('snooze').onclick=()=>{copy.snooze(Date.now(),{preview});preview=false;clock.snooze(Date.now());tick();};$('rest').onclick=()=>{preview=false;copy.clear();clock.rest(Date.now());tick();};
function openMain(){preview=false;copy.clear();stopCamera();clock.rest(Date.now());if(bridge)native('practice');else window.open('index.html','qimai-practice');tick();}
window.QimaiPetOpenMain=openMain;$('practice').onclick=openMain;
$('close').onclick=()=>{stopCamera();if(bridge)native('close');else{$('pet').hidden=true;document.body.innerHTML='<p style="padding:30px">陪伴已结束，摄像头已关闭。刷新页面可以再次开启。</p>';}};
$('drag').onmousedown=()=>native('drag');$('drag').onclick=()=>{if(!bridge){$('error').textContent='桌面程序可拖动宠物；浏览器版跟随浏览器窗口。';$('options').hidden=false;}};
for(const button of document.querySelectorAll('[data-calibrate]'))button.onclick=()=>{if(!stream||!model){$('calibrationStatus').textContent='请先开启摄像头观察，再进行校准。';return;}calibration={kind:button.dataset.calibrate,started:Date.now(),samples:[]};$('calibrationStatus').textContent='请保持姿势 5 秒…';};
$('checkEngine').onclick=async()=>{const button=$('checkEngine');button.disabled=true;$('error').textContent='正在检查本地识别引擎…';let probe;try{probe=await QimaiTracker.create();const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;await probe.detectForVideo(canvas,performance.now());$('error').textContent='识别引擎加载、推理检查通过。可再开启摄像头观察。';}catch(e){$('error').textContent='识别引擎未就绪：'+e.name+' · '+e.message;}finally{probe?.close();button.disabled=false;}};
$('clearCalibration').onclick=()=>{profiles={};calibration=null;save();$('calibrationStatus').textContent='已清除，可以重新校准两种姿势。';};
window.addEventListener('pagehide',()=>{stopCamera();writer?.dispose();});setInterval(tick,400);tick();
})();
