import { almanacReading, lunarDate } from './rhythm-reading.mjs';

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
    name:['调理脾胃须单举','Single palm lift · Baduanjin'],
    cue:['一手从身前缓缓上托，另一手向下舒展，然后收回换边。肩膀放松，一侧上托一次计一次。','Float one palm up as the other reaches down. Lower your arms and switch sides. Keep your shoulders relaxed. Count each single lift once.'],
    pace:['左右交替共 3～6 次，本次跟练左右各 2 次，共 4 次。','Alternate for 3–6 lifts in total. This practice uses two lifts on each side, four in all.']
  },
  open: {
    name:['展臂松肩','Open the arms'],
    cue:['双肘轻轻弯曲，双手从胸前缓缓分开至身体两侧，再合回身前。双肩自然下垂。','Soften your elbows. Open both arms gently from in front of your chest, then bring them back together. Let your shoulders hang easily.'],
    pace:['舒适范围内做两次，自然呼吸。','Try two easy repetitions with natural breathing.']
  },
  warm: {
    name:['搓掌揉腰','Warm palms at the waist'],
    cue:['轻搓双掌，再把手放在容易碰到的腰侧，轻轻上下摩动，最后收回身前。','Gently rub your palms together, then rest them at the sides of your waist. Make small up-and-down strokes and bring your hands back in front.'],
    pace:['腰侧轻摩两个来回，按自己舒服的幅度做。','Make two small strokes up and down within a comfortable range.']
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
    noteId:detail.noteId,partial:detail.partial===true,verified:detail.verified===true});
}

// Separate keys prevent a simultaneous guided completion from downgrading camera proof.
const STAMP_PREFIX = 'qimai.daily.stamp.v1.';
const GUIDED_PREFIX = STAMP_PREFIX + 'guided.';
export function createStampBook(storage) {
  const days = new Set(), verifiedDays = new Set(), pending = new Map();
  let writable = Boolean(storage);
  function read() {
    if (!storage) return;
    try {
      const stored = new Set(), verified = new Set();
      function remember(key, value) {
        const guided = key.startsWith(GUIDED_PREFIX);
        if (value !== '1' && value !== 'camera-v1') return;
        const day = key.slice(guided ? GUIDED_PREFIX.length : STAMP_PREFIX.length);
        try { getDayPillar(day); } catch { return; }
        stored.add(day);
        if (!guided && value === 'camera-v1') verified.add(day);
      }
      for (let i=0; i<storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(STAMP_PREFIX)) remember(key, storage.getItem(key));
      }
      for (const [key, value] of pending) remember(key, value);
      days.clear(); verifiedDays.clear();
      for (const day of stored) days.add(day);
      for (const day of verified) verifiedDays.add(day);
    } catch { writable = false; }
  }
  function stems() {
    return new Set([...days].map(day => getDayPillar(day).stem));
  }
  function earn(day, verified = true) {
    const {stem} = getDayPillar(day);
    read();
    const newStem = !stems().has(stem);
    const key = (verified ? STAMP_PREFIX : GUIDED_PREFIX) + day;
    const value = verified ? 'camera-v1' : '1';
    try {
      if (!storage) throw new Error('No storage');
      storage.setItem(key, value);
      pending.delete(key);
      writable = pending.size === 0;
    } catch {
      writable = false;
      pending.set(key, value);
    }
    days.add(day);
    if (verified) verifiedDays.add(day);
    return newStem;
  }
  read();
  return {read,earn,stems,days,verifiedDays,get writable(){return writable;}};
}

export function mountDaily(root,{language,date,birthday,onElement}) {
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
      (arrival?shown.date+' · '+(arrival.verified?t('三式已通过动作检验','Three movements camera-verified'):t('已完成三式跟练','Three movements completed')):
      earnedToday?t('已点亮','Collected'):t('完成今日三步舒展后点亮','Complete today’s three movements to light it up'))+'</small></div></div>';
    return '<section class="daily-book"><div class="daily-heading"><h3>'+t('十干印册','Ten-stem stamp book')+'</h3><span>'+collected.size+' / 10</span></div>'+
      '<p>'+t('六十种日柱，按十个天干集印。当天三式练完，点亮一枚；同一个天干只收一次。','Day pillars recur every 60 days. Collect their ten stems by completing the three movements on different days.')+'</p>'+
      seal+'<ul class="daily-stamps">'+cells+'</ul>'+
      '<p class="daily-achievement '+(achievement?'daily-full':'')+'">'+(achievement?t('成就已解锁 · 你的看山五行通畅','Unlocked · Kanshan’s Five Phases keepsake'):t('集齐十枚，解锁「你的看山五行通畅」。','Collect all ten to unlock Kanshan’s Five Phases keepsake.'))+'</p>'+
      '<small class="daily-local">'+(book.writable?t('印记只保存在当前浏览器。','Stamps are saved in this browser.'):t('浏览器存储不可用，本次新增印记仅在本页保留。','Browser storage is unavailable. New stamps may last only until you close this page.'))+'</small></section>';
  }

  function render({focus}={}) {
    const today=getDayPillar(date());
    book.read();
    const route=getDailyMoves(today.date);
    const collected=book.days.has(today.date);
    const verified=book.verifiedDays.has(today.date);
    const en=language()==='en';
    const reading=almanacReading(today,en);
    const lunar=lunarDate(today.date,en);
    const birthISO=birthday?.();
    const born=birthISO ? getDayPillar(birthISO) : null;
    const compare=born ? '<p id="rhythm-birth" class="daily-birth">'+t('我的生日日柱 · '+born.pillar+'（'+born.element+'）','My birth-day pillar · '+born.pillar+' ('+born.en+')')+'</p>' : '';
    const status=verified?t('今日三式已通过摄像头检验。','All three movements were camera-verified today.'):
      collected?t('今日三式已完成。','You completed today’s three movements.'):'';
    const signNote=today.pillar==='己亥'
      ? '<p class="almanac-note">'+t('古人用「土克水」描述这对五行。本签借己土配脾之意选单举，中间舒展两侧，再借亥水配肾之意，以轻揉腰侧收势。',
        'The traditional reading pairs Earth with Water in the restraining cycle. This routine echoes the Earth–Spleen theme with a single palm lift, opens out to both sides, then closes with a light waist rub inspired by the Water–Kidney theme.')+'</p>' : '';
    const href='./?practice=daily&amp;from=atlas&amp;day='+today.date;
    const moves=route.map(move=>'<li><strong>'+text(move.name)+'</strong><span>'+text(move.pace)+'</span></li>').join('');
    const practice='<div class="daily-practice"><h3>'+t('今日三式','Today’s three movements')+'</h3><ol class="almanac-moves">'+moves+'</ol>'+
      (partialExit?'<p class="daily-completed" role="status">'+t('本次已记入练习日记。','Your practice was saved to your diary.')+
        ' <a href="./?view=diary">'+t('翻开练习日记','Open practice diary')+'</a></p>':'')+
      (status?'<p class="daily-completed" role="status">'+status+'</p>':'')+
      '<div class="daily-actions"><a data-daily="start" class="daily-btn daily-primary" href="'+href+'&amp;mode=guided">'+
        (collected?t('再练一次','Practice again'):t('跟看山练三式','Practice with Kanshan'))+'</a>'+
      '<a data-daily="camera" class="daily-btn daily-secondary" href="'+href+'">'+t('摄像头检验','Camera check')+'</a></div></div>';
    const previous=root.contains(document.activeElement)?document.activeElement.dataset.daily:undefined;
    const resultHost=root.querySelector('#zhihuAtlasResult')||document.createElement('div');
    if(!resultHost.id){resultHost.id='zhihuAtlasResult';resultHost.hidden=true;}
    root.innerHTML='<div class="daily-layout"><section class="daily-sheet">'+
      '<header class="almanac-head"><div><p class="almanac-date"><time datetime="'+today.date+'">'+today.date+'</time>'+
      (lunar?' · '+lunar:'')+'</p><h2 id="rhythm-title" tabindex="-1">'+t(today.pillar+'日',today.pinyin+' · '+today.pillar)+'</h2></div>'+
      button('meridian',t('看'+today.organ+'经','View '+today.organEn+' meridian'),'daily-link')+'</header>'+
      '<p class="almanac-theme"><b>'+t('宜','Try')+'</b><strong>'+reading.theme+'</strong></p>'+
      '<p class="almanac-origin">'+t('传统五行 · ','Traditional correspondences · ')+reading.stems+'</p>'+signNote+compare+
      practice+'</section>'+stampGrid(today)+'</div>';
    if(resultHost)root.querySelector('.daily-book')?.append(resultHost);
    const target = focus || previous;
    if (target) root.querySelector('[data-daily="'+target+'"]')?.focus({preventScroll:true});
  }
  function onClick(event) {
    const start=event.target.closest('a[data-daily="start"], a[data-daily="camera"]');
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
    }else if(fresh&&book.days.has(received.date)){
      const verified=received.verified!==false && book.verifiedDays.has(received.date);
      partialExit=false;
      arrival={daily:true,verified,demo:false,noteId:typeof received.noteId==='string'?received.noteId:null,date:received.date,source:received.source,
        completed:getDailyMoves(received.date).map(m=>({id:m.id,name:m.name[0],verified}))};
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
