// The Hong Kong Observatory marks 21 November 2026 as 己亥 (index 35, zero-based).
// https://www.hko.gov.hk/en/gts/astron2026/files/2026cal11.pdf
const STEMS = [...'甲乙丙丁戊己庚辛壬癸'];
const BRANCHES = [...'子丑寅卯辰巳午未申酉戌亥'];
const STEM_SOUND = ['Jiǎ','Yǐ','Bǐng','Dīng','Wù','Jǐ','Gēng','Xīn','Rén','Guǐ'];
const BRANCH_SOUND = ['Zǐ','Chǒu','Yín','Mǎo','Chén','Sì','Wǔ','Wèi','Shēn','Yǒu','Xū','Hài'];
const YEARBOOK_ANCHOR = Date.UTC(2026,10,21);
const DAY_MS = 86400000;
const PHASES = [
  {element:'木', organ:'肝', en:'Wood', organEn:'Liver', color:'#4b7157'},
  {element:'火', organ:'心', en:'Fire', organEn:'Heart', color:'#974b3b'},
  {element:'土', organ:'脾', en:'Earth', organEn:'Spleen', color:'#93671e'},
  {element:'金', organ:'肺', en:'Metal', organEn:'Lung', color:'#736354'},
  {element:'水', organ:'肾', en:'Water', organEn:'Kidney', color:'#44677c'}
];

export function getDayPillar(iso) {
  const time = Date.parse(iso+'T00:00:00Z');
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(time) || new Date(time).toISOString().slice(0,10)!==iso) {
    throw new RangeError('Invalid Gregorian civil date');
  }
  const elapsed = (time-YEARBOOK_ANCHOR)/DAY_MS;
  const cycleIndex = ((35+elapsed)%60+60)%60;
  const stemIndex = cycleIndex%10;
  const stem = STEMS[stemIndex], branch = BRANCHES[cycleIndex%12];
  return {date:iso,stem,branch,pillar:stem+branch,stemIndex,cycleIndex,pinyin:STEM_SOUND[stemIndex]+' '+BRANCH_SOUND[cycleIndex%12],...PHASES[Math.floor(stemIndex/2)]};
}

const MOVES = {
  lift: {
    name:['交替单举','Alternate palm lift'],
    cue:['取意八段锦「调理脾胃须单举」。一手从身前缓缓上托，另一手向下伸展，再收回换边。肩膀保持放松。','Inspired by the third Baduanjin form. Float one palm up in front of you as the other reaches down. Lower your arms, then switch sides. Keep the shoulders relaxed.'],
    pace:['先试左右各一次；觉得轻松，可交替共做 3～6 次。','Try each side once. If comfortable, alternate for 3–6 lifts in total.']
  },
  open: {
    name:['展臂松肩','Open the arms'],
    cue:['双肘轻轻弯曲，双手从胸前缓缓分开至身体两侧，再合回身前。双肩自然下垂。','Soften your elbows. Open both arms gently from in front of your chest, then bring them back together. Let your shoulders hang easily.'],
    pace:['舒适范围内做两次，自然呼吸。','Try two easy repetitions with natural breathing.']
  },
  warm: {
    name:['搓掌覆腰','Warm the palms'],
    cue:['轻搓双掌，手心微暖后轻轻贴在腰部两侧。手臂放松，停一口气，再把双手放回身前。','Rub your palms together gently. Rest the warm palms on the sides of your waist, pause for an easy breath and bring them forward again.'],
    pace:['以能轻松触到的位置为准，不用按揉。','Rest your hands wherever they reach comfortably, using light contact.']
  },
  reach: {
    name:['左右舒展','Reach to each side'],
    cue:['一手轻轻向同侧伸出，手指自然张开，然后收回换边。头顶向上，身体保持平稳。','Reach one arm gently out to its side and open the fingers. Return and switch. Keep your body upright and steady.'],
    pace:['左右各做一至两次。','Try once or twice on each side.']
  },
  wrists: {
    name:['转腕松手','Loosen the wrists'],
    cue:['双肘靠近身体，放松手指，让双腕慢慢各画一个小圈，再反方向画圈。','Keep your elbows close and fingers loose. Trace a small circle with each wrist, then reverse direction.'],
    pace:['动作放小，顺逆各两圈。','Keep the motion small. Try two circles each way.']
  },
  shoulder: {
    name:['松肩回环','Roll the shoulders'],
    cue:['两臂放松垂下，肩膀缓缓向上、向后、向下画小圈。下巴保持平稳。','Rest your arms at your sides. Slowly circle your shoulders up, back and down while keeping your chin steady.'],
    pace:['慢慢做两圈，在肩膀放下时停一口气。','Make two easy circles and pause for one breath with the shoulders lowered.']
  },
  settle: {
    name:['落掌收势','Lower and settle'],
    cue:['双手从身前轻轻落下。坐着时把手放在大腿上，站着时自然垂在身侧，感受脚掌与地面的接触。','Let your hands lower slowly. If seated, rest them on your thighs. If standing, let them hang at your sides. Feel your feet meet the floor.'],
    pace:['自然呼吸两次。','Take two natural breaths.']
  }
};

const ROUTES = [
  ['reach','open','settle'], ['shoulder','reach','settle'],
  ['wrists','open','settle'], ['open','wrists','settle'],
  ['lift','open','warm'], ['lift','reach','warm'],
  ['shoulder','open','settle'], ['wrists','shoulder','open'],
  ['open','reach','warm'], ['reach','wrists','warm']
];

export function getDailyMoves(iso) {
  return ROUTES[getDayPillar(iso).stemIndex].map(id=>({id,...MOVES[id]}));
}

const DEPARTURE_KEY='qimai.daily.departure';
const ARRIVAL_KEY='qimai.daily.arrival';
function takeSessionItem(key) {
  try {
    const raw=window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);
    return JSON.parse(raw);
  } catch {return null;}
}
function putSessionItem(key,data) {
  try {
    const value=JSON.stringify(data);
    window.sessionStorage.setItem(key,value);
    return window.sessionStorage.getItem(key)===value;
  } catch { return false; }
}

export function takeAtlasOrigin() {
  const prior=takeSessionItem(DEPARTURE_KEY);
  if(!prior || Date.now()-prior.at>120000 || Date.now()<prior.at)return null;
  try {
    const url=new URL(prior.url),atlas=new URL('meridians.html',location.href);
    const atlasPaths=[atlas.pathname,atlas.pathname.replace(/\.html$/, '')];
    if(url.origin!==atlas.origin||!atlasPaths.includes(url.pathname))return null;
    const previous=window.navigation?.entries().find(e=>e.index===window.navigation.currentEntry?.index-1);
    if(previous?.url){
      if(previous.url!==url.href)return null;
    }else {
      if(history.length<=1 || !document.referrer)return null;
      const ref=new URL(document.referrer);
      if(ref.origin!==url.origin || ref.pathname!==url.pathname)return null;
    }
    return url.href;
  } catch {return null;}
}

export function recordDailyArrival(detail) {
  return putSessionItem(ARRIVAL_KEY,{at:Date.now(),date:detail.date,source:detail.source,
    noteId:detail.noteId,partial:detail.partial===true});
}

// Each finished date has its own idempotent key. Tabs never overwrite a different day's stamp.
const STAMP_PREFIX = 'qimai.daily.stamp.v1.';
export function createStampBook(storage) {
  const days = new Set(), verifiedDays = new Set(), volatile = new Set();
  let writable = Boolean(storage);
  function read() {
    if (!storage) return;
    try {
      const stored = new Set(), verified = new Set();
      for (let i=0;i<storage.length;i++) {
        const key=storage.key(i);
        if (!key?.startsWith(STAMP_PREFIX)) continue;
        const value=storage.getItem(key);
        if (value!=='1' && value!=='camera-v1') continue;
        const day=key.slice(STAMP_PREFIX.length);
        try { getDayPillar(day); } catch { continue; }
        stored.add(day);
        if (value==='camera-v1') verified.add(day);
      }
      days.clear(); verifiedDays.clear();
      for (const day of [...stored,...volatile]) days.add(day);
      for (const day of [...verified,...volatile]) verifiedDays.add(day);
    } catch { writable=false; }
  }
  function earn(day) {
    getDayPillar(day);
    try {
      if (!storage) throw new Error('No storage');
      storage.setItem(STAMP_PREFIX+day,'camera-v1');
      volatile.delete(day);
      writable=volatile.size===0;
    } catch {
      writable=false;
      volatile.add(day);
    }
    days.add(day);
    verifiedDays.add(day);
  }
  function stems() {
    return new Set([...days].map(day=>getDayPillar(day).stem));
  }
  read();
  return {read,earn,stems,days,verifiedDays,get writable(){return writable;}};
}

export function mountDaily(root,{language,date,onElement}) {
  let storage;
  try { storage=window.localStorage; } catch { /* Private mode may deny access. */ }
  const book=createStampBook(storage);
  let arrival=null,partialExit=false;
  const t=(zh,en)=>language()==='en'?en:zh;
  const text=pair=>language()==='en'?pair[1]:pair[0];
  const button=(action,label,kind='')=>'<button type="button" class="daily-btn '+kind+'" data-daily="'+action+'">'+label+'</button>';

  function stampGrid(pillar) {
    const collected=book.stems();
    const shown=arrival?getDayPillar(arrival.date):pillar;
    const cells=STEMS.map((stem,i)=>{
      const earned=collected.has(stem);
      const phase=PHASES[Math.floor(i/2)];
      const state=earned?t('已集','Collected'):t('待集','Uncollected');
      const label=stem+' '+t(phase.element,phase.en)+' · '+state;
      return '<li class="daily-stamp '+(earned?'daily-earned ':'')+(i===pillar.stemIndex?'daily-current':'')+'" style="--stamp-ink:'+phase.color+'" aria-label="'+label+'"><span class="daily-glyph" aria-hidden="true">'+stem+(earned?'<i>✓</i>':'')+'</span><small>'+t(phase.element,STEM_SOUND[i])+'</small></li>';
    }).join('');
    const achievement=collected.size===10;
    const earnedToday=collected.has(shown.stem);
    const seal='<div class="daily-keepsake '+(earnedToday?'is-lit':'')+'" tabindex="-1" style="--seal-color:'+shown.color+'">'+
      '<div class="daily-enamel" aria-hidden="true"><img src="assets/mascot/liukanshan-body.png" alt=""><b>'+shown.stem+'</b></div>'+
      '<div><strong>'+t(shown.stem+'字看山印',STEM_SOUND[shown.stemIndex]+' · Kanshan stamp')+'</strong><small>'+
      (arrival?t(shown.date+' · 三式已通过动作检验',shown.date+' · Three movements camera-verified'):
      earnedToday?t('已点亮','Collected'):t('完成今日三步舒展后点亮','Complete today’s three movements to light it up'))+'</small></div></div>';
    return '<section class="daily-book"><div class="daily-heading"><h3>'+t('十干印册','Ten-stem stamp book')+'</h3><span>'+collected.size+' / 10</span></div>'+
      '<p>'+t('六十种日柱轮转，印记按十个日干收集。完成三步，收下今天这一枚。','Day pillars recur every 60 days. Collect their ten stems by completing the three movements on different days.')+'</p>'+
      seal+'<ul class="daily-stamps">'+cells+'</ul>'+
      '<p class="daily-achievement '+(achievement?'daily-full':'')+'">'+(achievement?t('已解锁看山纪念章「五行通畅」','Unlocked · Kanshan’s Five Phases keepsake'):t('集齐十枚，解锁看山纪念章「五行通畅」。','Collect all ten to unlock Kanshan’s Five Phases keepsake.'))+'</p>'+
      '<small class="daily-local">'+(book.writable?t('印记只保存在当前浏览器。','Stamps are saved in this browser.'):t('浏览器存储不可用，本次新增印记仅在本页保留。','Browser storage is unavailable. New stamps may last only until you close this page.'))+'</small></section>';
  }

  function render({focus}={}) {
    const today=getDayPillar(date());
    book.read();
    const route=getDailyMoves(today.date);
    const collected=book.days.has(today.date);
    const verified=book.verifiedDays.has(today.date);
    const explain=t('日干属'+today.element+'，在传统五行中与'+today.organ+'相配。','The '+STEM_SOUND[today.stemIndex]+' stem belongs to '+today.en+', traditionally paired with the '+today.organEn+'.');
    const title=t(today.pillar+'日',today.pinyin+' · '+today.pillar);
    const status=verified?
      t('今日三式已通过摄像头动作检验，'+today.stem+'字印已点亮。','All three movements passed the camera check today. Your stamp is lit.'):
      collected?t('已保留旧版跟练印记，今天可再做一次摄像头小练。','Your earlier stamp is saved. You can try today’s camera practice.'):'';
    const practice='<p class="daily-route">'+route.map(m=>text(m.name)).join(' · ')+'</p>'+
      '<p>'+t('跟着刘看山做三式舒展。摄像头会在本机观察动作、提示调整，三式通过后收下今日印。请按舒适幅度练习。','Follow Kanshan through three movements. The camera checks your movement on this device and offers adjustments. Complete all three checks to collect today’s stamp. Move within a comfortable range.')+'</p>'+
      (partialExit?'<p class="daily-completed" role="status">'+t('本次已记入练习日记。','Your practice was saved to your diary.')+
        ' <a href="./?view=diary">'+t('翻开练习日记','Open practice diary')+'</a></p>':'')+
      (status?'<p class="daily-completed" role="status">'+status+'</p>':'')+
      '<div class="daily-actions"><a data-daily="start" class="daily-btn daily-primary" href="./?practice=daily&amp;from=atlas&amp;day='+today.date+'">'+
      (verified?t('再做一次摄像头陪练','Repeat camera practice'):t('进入摄像头陪练','Start camera practice'))+'</a></div>';
    const previous=root.contains(document.activeElement)?document.activeElement.dataset.daily:undefined;
    const resultHost=root.querySelector('#zhihuAtlasResult')||document.createElement('div');
    if(!resultHost.id){resultHost.id='zhihuAtlasResult';resultHost.hidden=true;}
    root.innerHTML='<div class="daily-layout"><section class="daily-sheet"><div class="daily-heading"><h3>'+t('今日干支','Today’s day pillar')+'</h3><span>'+today.date+' · UTC+8</span></div>'+
      '<div class="daily-pillar"><strong>'+title+'</strong>'+button('meridian',t('看'+today.organ+'经','View '+today.organEn+' meridian'),'daily-link')+'</div>'+
      '<p>'+explain+' '+t('今天借这个主题做一组工位舒展。','Use today’s theme for a short desk break.')+'</p>'+
      '<div class="daily-practice">'+practice+'</div></section>'+stampGrid(today)+'</div>';
    if(resultHost)root.querySelector('.daily-book')?.append(resultHost);
    const target = focus || previous;
    if (target) root.querySelector('[data-daily="'+target+'"]')?.focus({preventScroll:true});
  }
  function onClick(event) {
    const start=event.target.closest('a[data-daily="start"]');
    if(start&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&!event.defaultPrevented)
      putSessionItem(DEPARTURE_KEY,{at:Date.now(),url:location.href});
    const action=event.target.closest('button[data-daily]')?.dataset.daily;
    if (action==='meridian') onElement?.(getDayPillar(date()).element);
  }
  function onStorage(e) {
    if (e.key!==null && !e.key.startsWith(STAMP_PREFIX)) return;
    book.read();render();
  }
  root.addEventListener('click',onClick);
  window.addEventListener('storage',onStorage);
  function refresh() {
    book.read();
    const received=takeSessionItem(ARRIVAL_KEY);
    const fresh=received&&Number.isFinite(received.at)&&Date.now()-received.at<300000&&Date.now()>=received.at;
    if(fresh&&received.partial){
      partialExit=true;arrival=null;
      const previousResult=root.querySelector('#zhihuAtlasResult');
      if(previousResult)previousResult.hidden=true;
      render();
      window.dispatchEvent(new CustomEvent('qimai-daily-return'));
    }else if(fresh&&book.verifiedDays.has(received.date)){
      partialExit=false;
      arrival={daily:true,verified:true,demo:false,noteId:typeof received.noteId==='string'?received.noteId:null,date:received.date,source:received.source,
        completed:getDailyMoves(received.date).map(m=>({id:m.id,name:m.name[0],verified:true}))};
      render();
      window.dispatchEvent(new CustomEvent('qimai-daily-return'));
      const seal=root.querySelector('.daily-keepsake');
      seal.classList.add('newly-lit');seal.focus({preventScroll:true});
      seal.scrollIntoView({block:'center',behavior:'instant'});
      window.dispatchEvent(new CustomEvent('qimai-daily-arrival',{detail:arrival}));
    }else if(!arrival)render();
  }
  window.addEventListener('pageshow',refresh);
  // Allow the journal to install its panel navigation before announcing the arrival.
  render();queueMicrotask(refresh);
  return {render,destroy(){root.removeEventListener('click',onClick);window.removeEventListener('storage',onStorage);window.removeEventListener('pageshow',refresh);}};
}
