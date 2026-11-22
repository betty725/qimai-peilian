import {mountBridge} from './bridge.mjs';
import {mountDiary} from './diary-ui.mjs';
import {getDailyMoves, getDayPillar} from '../atlas/daily.mjs';
import {todayInChina} from '../atlas/season-calendar.mjs';

const byId = id => document.getElementById(id);
const home = byId('zhihuHome');
function dailyTitle() {
  const date = todayInChina();
  return {date, pillar:getDayPillar(date).pillar + '日', moves:getDailyMoves(date).map(move=>move.name[0])};
}
const bridge = mountBridge({
  home, reminder:byId('zhihuReminder'),
  startDaily:()=>window.dispatchEvent(new CustomEvent('qimai-start-daily',{detail:{source:'home'}})),
  imagePaths:{neck:'assets/bridge/neck.webp',back:'assets/bridge/back.webp',afternoon:'assets/bridge/afternoon.webp'},
  getDailyTitle:dailyTitle
});
const hot = document.createElement('a');
hot.className = 'daily-zhihu-hot';
hot.href = 'https://www.zhihu.com/hot';
hot.textContent = '浏览知乎热榜';
hot.target = '_blank';
hot.rel = 'noopener noreferrer';
home.querySelector('.qs-topic').append(hot);

const diaryHost = byId('practiceDiary');
mountDiary(diaryHost, {surface:'journey'});
const openDiary = document.createElement('a');
openDiary.href = '?view=diary';
openDiary.className = 'diary-shortcut';
openDiary.textContent = '翻开练习日记';
openDiary.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  document.querySelector('.nav[data-page="journey"]').click();
  const route = new URL(location.href);
  route.searchParams.set('view','diary');
  history.replaceState(history.state,'',route);
  diaryHost.scrollIntoView({block:'start'});
  diaryHost.focus({preventScroll:true});
});
home.querySelector('.qs-practice-row').append(openDiary);

window.addEventListener('qimai-reminder-shown',bridge.refreshReminder);
let resultDiary;
window.addEventListener('qimai-practice-result',event=>{
  const {noteId, autoReturn} = event.detail;
  const result = byId('zhihuResult');
  resultDiary?.destroy();
  resultDiary = undefined;
  result.replaceChildren();
  result.hidden = !noteId || Boolean(autoReturn);
  if (!result.hidden) resultDiary = mountDiary(result, {surface:'result', entryId:noteId});
});
document.addEventListener('visibilitychange',()=>{if (!document.hidden) bridge.refreshDaily();});
const kind = byId('practiceKind');
new MutationObserver(()=>{
  if (byId('practice').dataset.daily === 'true') byId('dailyInk').textContent = kind.textContent[0] || '';
}).observe(kind,{childList:true});
