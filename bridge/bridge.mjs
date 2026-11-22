import {questions} from './questions.mjs';
// The first-person tips are original copy in 看山's voice.
const scenes = {
  neck: {
    label: '肩颈紧', title: '把肩膀从耳朵旁放下来',
    tip: '我一专心，肩膀就悄悄耸起来了。陪我把手从键盘上拿开，让胳膊自然垂一会儿吧。',
  },
  back: {
    label: '腰背累', title: '换个姿势，再看下一页',
    tip: '我总想把这一页看完再起身，可下一页还有下一页。先给书夹个签，陪我站起来走两步吧。',
  },
  afternoon: {
    label: '午后犯困', title: '把午后的空档留给自己',
    tip: '我刚把同一行字看了三遍。陪我放下鼠标，去窗边看看天色，再决定是动一动，还是歇一会儿。',
  },
};
const selectionKey = 'qimai.desk.scene.v1';

function savedScene() {
  try {
    const key = localStorage.getItem(selectionKey);
    return Object.hasOwn(scenes, key) ? key : 'neck';
  } catch { return 'neck'; }
}

function setTopic(link, selection) {
  const topic = questions.find(question => question.scene === selection) || questions[0];
  link.href = topic.url;
  link.textContent = topic.title;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
}

export function mountBridge({home, reminder, startDaily, imagePaths = {}, getDailyTitle}) {
  let selection = savedScene();
  const question = () => scenes[selection];
  if (home) {
    home.classList.add('qs-bridge', 'qs-home');
    home.innerHTML = `
      <div class="qs-story">
        <div class="qs-copy">
          <p class="qs-kicker">看山的工位手记</p>
          <h2>坐了一会儿，你感觉怎样？</h2>
          <div class="qs-choices" role="group" aria-label="选择工位感受"></div>
          <div class="qs-tip" aria-live="polite"><h3></h3><p></p></div>
          <div class="qs-topic"><span>知乎讨论</span><a></a></div>
        </div>
        <div class="qs-illustration"><img alt="" decoding="async"></div>
      </div>
      <div class="qs-practice-row"><div><strong>跟看山做今日小练</strong><p class="qs-daily-info"></p></div><button class="qs-primary" type="button">进入日柱动作陪练</button></div>`;
    const choices = home.querySelector('.qs-choices');
    for (const [key, scene] of Object.entries(scenes)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = scene.label;
      button.dataset.scene = key;
      button.addEventListener('click', () => {
        selection = key;
        try { localStorage.setItem(selectionKey, key); } catch { /* In-memory mode. */ }
        refreshScene();
      });
      choices.append(button);
    }
    home.querySelector('.qs-primary').addEventListener('click', () => startDaily());
  }
  if (reminder) {
    reminder.classList.add('qs-bridge', 'qs-reminder');
    reminder.innerHTML = `<div class="qs-reminder-art"><img alt="" decoding="async"></div>
      <div class="qs-reminder-copy"><p class="qs-kicker"></p><p class="qs-reminder-tip"></p><div class="qs-topic"><span>知乎讨论</span><a></a></div></div>`;
  }
  function updateArt(container, selector) {
    const image = container.querySelector(selector);
    const src = imagePaths[selection];
    if (src && image.getAttribute('src') !== src) image.src = src;
    image.parentElement.hidden = !src;
  }
  function refreshReminder() {
    if (!reminder) return;
    const scene = question();
    reminder.dataset.scene = selection;
    updateArt(reminder, 'img');
    reminder.querySelector('.qs-kicker').textContent = '看山的工位手记 · ' + scene.label;
    reminder.querySelector('.qs-reminder-tip').textContent = scene.tip;
    setTopic(reminder.querySelector('a'), selection);
  }
  function refreshScene() {
    refreshReminder();
    if (!home) return;
    const scene = question();
    home.dataset.scene = selection;
    for (const button of home.querySelectorAll('.qs-choices button')) button.setAttribute('aria-pressed', String(button.dataset.scene === selection));
    home.querySelector('.qs-tip h3').textContent = scene.title;
    home.querySelector('.qs-tip p').textContent = scene.tip;
    setTopic(home.querySelector('.qs-topic a'), selection);
    updateArt(home, '.qs-illustration img');
  }
  function refreshDaily() {
    if (!home) return;
    const daily = getDailyTitle?.() || {};
    const names = Array.isArray(daily.moves) ? daily.moves.filter(Boolean).join('、') : '';
    const info = home.querySelector('.qs-daily-info');
    info.textContent = [daily.date, daily.pillar, names].filter(Boolean).join(' · ');
    info.hidden = !info.textContent;
  }
  window.addEventListener('storage', event => {
    if (event.key === selectionKey || event.key === null) {
      selection = savedScene();
      refreshScene();
    }
  });
  refreshScene();
  refreshDaily();

  return {refreshReminder, refreshDaily};
}
