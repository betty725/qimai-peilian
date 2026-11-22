import { getSeasonReading, todayInChina, MIN_DATE, MAX_DATE } from './season-calendar.mjs';
import {mountScrolls} from './term-covers.mjs';
import { points } from './meridian-data.mjs';

const byId = id => document.getElementById(id);
const put = (id, value) => { byId(id).textContent = value; };
const enCopy = {
  browseScrolls:'Browse scrolls',scrollTitle:'The 24 solar term scrolls',scrollPrev:'Previous',scrollNext:'Next',
  dayPillarSource:'Hong Kong Observatory · November 2026 day pillars',movementSource:'General Administration of Sport of China · Baduanjin',
  toJournal:'Open today’s journal', journalHeading:'Kanshan’s wellness journal', dailyTab:'Daily movement', constitutionTab:'Self check-in',
  skip:'Skip to the meridian atlas',brand:'Qimai',back:'Back to practice',edition:'Kanshan’s Seasonal Journal',
  title:'A Seasonal Meridian Atlas',intro:'Explore the five phases and trace a point with Kanshan.',termNow:'Solar term',
  todayRead:'Seasonal phase',birthTerm:'Solar term at birth',birthMove:'Birth-year movement',
  culture:'Traditional correspondences are cultural concepts. Dates cannot tell us how an organ is functioning or what caused a mood.',
  atlasKicker:'Meridians & points',atlasTitle:'Kanshan’s meridian map',atlasHint:'Choose a phase or tap a point on Kanshan.',
  modelLabel:'3D meridian map',rotateHint:'Drag to rotate',front:'Front',where:'On the human body',observe:'What to look for',
  modelNote:'Kanshan shows approximate relationships. Refer to the written landmarks and standard atlas for human anatomy.',
  method:'Calendar, sources & further reading',follow:'Each of the five organ traditions is represented by one meridian and one point. The figure traces selected surface segments.',
  hko:'Hong Kong Observatory · The 24 Solar Terms',bucm:'Beijing University of Chinese Medicine · Organs and seasonal cycles in the Neijing',gb:'Chinese national standard · Nomenclature and location of meridian points',who:'WHO · Standard acupuncture point locations in the Western Pacific Region',classic:'On Seasonal Diseases · The Five Movements and Six Qi',zhihu:'Read on Zhihu · Lung and Large Intestine Meridians (Chinese)',
  birthKicker:'Your seasonal note',birthdayTitle:'Which solar term welcomed you?',birthdayInfo:'Enter your Gregorian birthday to explore its solar term and annual movement.',birthdayLabel:'Date of birth',privacy:'Your date is calculated in this page. It is never saved or sent.',create:'Open my seasonal note',clear:'Clear birthday'
};
const texts = [...document.querySelectorAll('[data-t]')].map(el => [el,el.textContent]);
const englishElements = {木:'Wood',火:'Fire',土:'Earth',金:'Metal',水:'Water'};
const englishOrgans = {肝:'Liver',心:'Heart',脾:'Spleen',肺:'Lung',肾:'Kidney'};
const pointForElement = element => points.find(p => p.element === element);
const pointForId = id => points.find(p => p.id === id);
const modal = byId('birthday-modal');
const input = byId('birthday');
let lang = new URL(location.href).searchParams.get('lang') === 'en' ? 'en' : 'zh';
let today = todayInChina(), birthday = '', reading = getSeasonReading(today);
let journal;
let selected = pointForElement(reading.season.element), yaw = 0, model, modelFailed = false;
const t = (zh,en) => lang === 'en' ? en : zh;

const scrolls = mountScrolls();
function renderSeason() {
  const {term,season,hostQi,birth} = reading;
  scrolls.update(term,lang);
  put('term-name',term.name);
  put('term-en',term.en);
  put('today-topic',t(season.name+' · '+season.element,season.en+' · '+englishElements[season.element]));
  put('today-point',t('读'+season.organ+'经','Explore '+englishOrgans[season.organ]));
  put('china-date',t('中国历日 ','China calendar ')+today+'  ·  UTC+8');
  put('host-qi',t('主气 · '+hostQi.name,'Host qi · '+hostQi.en));
  put('birth-action',birth ? t('修改我的生辰','Edit my birthday') : t('填写生辰，展笺','Add my birthday'));
  put('birth-term',birth ? t(birth.term.name,birth.term.en) : t('待展笺','Not entered'));
  put('birth-term-note',birth ? birth.date : t('依出生月日查节气','Based on month and day'));
  put('birth-move',birth ? t(birth.stemBranch+' · '+birth.movement.element+'运',birth.stemBranch+' · '+birth.movement.en) : t('待展笺','Not entered'));
  byId('birth-point').hidden = !birth;
  put('birth-point',birth ? t('读'+birth.movement.organ+'经','Explore '+birth.movement.organEn) : '');
  put('birth-move-note',birth ? '' : t('依岁运天干查五行','Based on the year’s stem'));
  byId('clear-birth').hidden = !birth;
  byId('personal-reading').hidden = !birth;
  if (birth) {
    const b = pointForElement(birth.movement.element), s = pointForElement(season.element);
    const comparison = b.id === s.id ?
      t('生年与当令同属'+s.element+'，可从'+s.meridian+'的'+s.name+'读起。',
        'Both traditions point to '+englishElements[s.element]+'. Start with '+s.pinyin+' on the '+s.meridianEn+'.') :
      t('生年取'+b.element+'，当令取'+s.element+'。可以对读'+b.meridian+'的'+b.name+'和'+s.meridian+'的'+s.name+'。',
        'Your birth-year movement is '+englishElements[b.element]+' and the current season corresponds to '+englishElements[s.element]+'. Compare '+b.pinyin+' on the '+b.meridianEn+' with '+s.pinyin+' on the '+s.meridianEn+'.');
    put('personal-reading',t('你的节令笺 · ','Your seasonal note · ')+comparison);
  }
  put('method-text',t('节气按香港天文台历表的中国历日（UTC+8）在交节当日切换。此笺取五运六气中的生年岁运与当令主气：大寒换岁，按年干配五运；大寒、春分、小满、大暑、秋分、小雪依次换主气。今属'+hostQi.name+'。按四立划分春夏秋冬；土另作脾经主题供浏览。',
    'Solar terms change on their published Chinese calendar date (UTC+8), using the Hong Kong Observatory tables. This atlas uses two parts of the traditional system. The annual movement follows the year’s Heavenly Stem, with Major Cold as the year boundary. The six host qi change at Major Cold, Spring Equinox, Grain Buds, Major Heat, Autumn Equinox and Minor Snow. The present host qi is '+hostQi.en+'. The four seasonal beginnings define spring, summer, autumn and winter. Earth is also available as the Spleen theme.'));
}
const picks = new Map();
for (const p of points) {
  const btn=document.createElement('button');
  btn.className='pick'; btn.type='button'; btn.style.setProperty('--point-color',p.color);
  const dot=document.createElement('span'); dot.className='dot';dot.setAttribute('aria-hidden','true');
  const name=document.createElement('span'); name.className='pick-name';
  const detail=document.createElement('span');detail.className='pick-detail';
  btn.append(dot,name,detail);btn.addEventListener('click',()=>selectPoint(p.id));
  picks.set(p.id,{btn,name,detail});byId('picker').append(btn);
}
function renderPoint() {
  for (const p of points) {
    const {btn,name,detail}=picks.get(p.id);
    name.textContent=t(p.element,englishElements[p.element]);
    detail.textContent=t(p.organ+'经',englishOrgans[p.organ]);
    btn.setAttribute('aria-pressed',String(p.id===selected.id));
  }
  put('entry-branch',t(selected.meridian,selected.meridianEn));
  put('point-code',selected.id);
  put('point-name',t(selected.name,selected.enName));
  put('point-roman',t(selected.pinyin,selected.pinyin+' · '+selected.name));
  put('point-location',t(selected.location,selected.locationEn));
  put('point-note',t(selected.note,selected.noteEn));
  const discussion=byId('point-discussion');
  discussion.href='https://www.zhihu.com/search?type=content&q='+encodeURIComponent(selected.name+' '+selected.meridian+' 穴名由来');
  discussion.textContent=t('去知乎了解「'+selected.name+'」的穴名由来','Explore '+selected.pinyin+' on Zhihu (Chinese)');

}
function selectPoint(id, focusModel=true) {
  const next=pointForId(id);
  if (!next) return;
  selected=next;renderPoint();if(focusModel)model?.select(id);
}
function renderView() {
  const abs=Math.abs(yaw);
  const dir=abs<5?t('正面','Front'):abs>155?t('背面','Back'):abs<65?t('斜前','Front oblique'):abs<115?t('侧面','Side'):t('斜后','Rear oblique');
  put('view-label',modelFailed?t('静态预览','Still preview') : dir+' · '+Math.round(abs)+'°');
}
function renderLanguage() {
  document.documentElement.lang=t('zh-CN','en');document.title=t('时令经络图鉴 · 气脉陪练','A Seasonal Meridian Atlas · Qimai');
  texts.forEach(([el,zh]) => {el.textContent=t(zh,enCopy[el.dataset.t]);});
  byId('lang-zh').setAttribute('aria-pressed',String(lang==='zh'));byId('lang-en').setAttribute('aria-pressed',String(lang==='en'));
  for (const [id,zh,en] of [['model','可旋转的刘看山经络模型，用左右方向键旋转','Rotatable Kanshan meridian model. Use the left and right arrow keys.'],['left-view','向左转','Rotate left'],['right-view','向右转','Rotate right'],['picker','五行经络','Select a meridian by phase'],['cancel-birth','关闭','Close']]) byId(id).setAttribute('aria-label',t(zh,en));
  renderSeason();renderPoint();renderView();journal?.render();
}
for (const l of ['zh','en']) byId('lang-'+l).addEventListener('click',()=>{
  lang=l;const url=new URL(location.href);
  if(l==='en')url.searchParams.set('lang','en');else url.searchParams.delete('lang');
  history.replaceState(null,'',url);renderLanguage();
});
function openPoint(element) {
  selectPoint(pointForElement(element).id);
  byId('map').scrollIntoView({block:'start'});picks.get(selected.id).btn.focus({preventScroll:true});
}
byId('today-point').addEventListener('click',()=>openPoint(reading.season.element));
byId('birth-point').addEventListener('click',()=>{if(reading.birth)openPoint(reading.birth.movement.element);});
function refreshDate() {
  const next=todayInChina();
  if(next===today)return;
  today=next;reading=getSeasonReading(today,birthday);input.max=today<MAX_DATE?today:MAX_DATE;renderSeason();journal?.render();
}
function clearError() {put('birth-error','');input.removeAttribute('aria-invalid');}
input.min=MIN_DATE;input.max=today<MAX_DATE?today:MAX_DATE;
byId('personalize').addEventListener('click',()=>{
  refreshDate();input.value=birthday;clearError();modal.showModal();input.focus();
});
byId('cancel-birth').addEventListener('click',()=>modal.close());
input.addEventListener('input',clearError);
byId('birth-form').addEventListener('submit',e=>{
  e.preventDefault();refreshDate();const value=input.value;
  try {
    if(!value)throw new Error('empty');
    reading=getSeasonReading(today,value);
  } catch {
    put('birth-error',t('请输入 1901 年 1 月 1 日至今天之间的有效日期。','Enter a valid date from 1 January 1901 through today.'));
    input.setAttribute('aria-invalid','true');input.focus();return;
  }
  birthday=value;renderSeason();modal.close();
});
byId('clear-birth').addEventListener('click',()=>{
  birthday='';input.value='';clearError();reading=getSeasonReading(today);renderSeason();modal.close();
});
byId('left-view').addEventListener('click',()=>model?.rotate(-30));
byId('right-view').addEventListener('click',()=>model?.rotate(30));
byId('reset-view').addEventListener('click',()=>model?.reset());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate();});
window.addEventListener('pageshow',refreshDate);window.setInterval(refreshDate,60000);
renderLanguage();
try {
  const {createMeridianModel}=await import('./meridian-model.mjs');
  model=createMeridianModel(byId('model'),{onSelect:id=>selectPoint(id,false),onViewChange:angle=>{yaw=angle;renderView();}});
  model.select(selected.id);
} catch {
  modelFailed=true;renderView();byId('model').hidden=true;
  const fallback=document.createElement('img');fallback.alt='刘看山 · Kanshan';fallback.className='model-fallback';fallback.src='assets/gif/idle.gif';
  byId('model').after(fallback);document.querySelector('.plate-controls').hidden=true;
}

// Load the journal independently so the original calendar and atlas stay usable.
import('./journal.mjs').then(({mountJournal}) => {
  journal=mountJournal({language:()=>lang,date:todayInChina,onElement:openPoint});
}).catch(() => {
  byId('daily').textContent=t('手记未能载入，请刷新后再试。','The journal did not load. Please refresh to try again.');
});
