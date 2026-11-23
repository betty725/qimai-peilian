import { dailyScore, summarize, projectScenario } from './vitality-model.mjs';
import { todayInChina } from './season-calendar.mjs';
import { listNotes } from '../practice-diary.mjs';

const panel = document.getElementById('vitalityPanel');
const prefix = 'qimai.atlas.vitality.v1.';
const organNames = {
  heart: ['心', 'Heart'], liver: ['肝', 'Liver'], spleen: ['脾', 'Spleen'],
  lung: ['肺', 'Lung'], kidney: ['肾', 'Kidney'],
};
const labels = {
  bedtime: ['入睡时间', 'Bedtime'], sleep: ['睡眠时长', 'Sleep'],
  water: ['饮水量', 'Water'], walk: ['步行', 'Walking'], exercise: ['锻炼', 'Exercise'],
};
const startingGoals = { targetBedtime: '23:00', targetSleepHours: 8, targetWaterMl: 1500 };
const isEnglish = () => document.documentElement.lang.startsWith('en');
const t = (zh, en) => isEnglish() ? en : zh;
const $ = selector => panel.querySelector(selector);
const signed = value => value > 0 ? '+' + value : String(value);
const format = value => value.toLocaleString(isEnglish() ? 'en' : 'zh-CN', {maximumFractionDigits: 2});

let records = {};
let practiceDays = new Set();
let state;
let refreshId = 0;
let loadedVersion;
let notice = null;

function readRecords() {
  const result = {};
  const storage = window.localStorage;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const date = key.slice(prefix.length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    try {
      const record = JSON.parse(storage.getItem(key));
      if (record && typeof record === 'object' && !Array.isArray(record)) result[date] = record;
    } catch { /* Ignore an unreadable entry; other days remain available. */ }
  }
  return result;
}

function activitySelect(name) {
  return `<select name="${name}"><option value="">${t('未记录', 'Unrecorded')}</option><option value="yes">${t('已完成', 'Done')}</option><option value="no">${t('未完成', 'Not done')}</option></select>`;
}

function mount() {
  const expanded = $('#vProjection')?.open ?? false;
  const extra = $('#vExtra')?.value ?? '3';
  const habit = $('#vHabit')?.value ?? 'walk';
  panel.innerHTML = `
    <section class="v-card" aria-labelledby="vTitle">
      <div class="v-overview">
        <figure class="v-portrait"><img src="assets/gif/idle.gif" alt="${t('刘看山', 'Liu Kanshan')}"></figure>
        <div class="v-status">
          <h3 id="vTitle">${t('看山的气血值', 'Kanshan’s vitality')}</h3>
          <div class="v-reading"><strong id="vValue">50</strong><span>/ 100</span></div>
          <progress id="vMeter" max="100" value="50" aria-labelledby="vTitle"></progress>
          <p id="vToday"></p>
        </div>
        <div class="v-organs">
          <h4>${t('五脏养成', 'Organ collection')}</h4>
          <ul>${Object.entries(organNames).map(([key, name]) => `<li><span>${t(...name)}</span><progress max="100" value="50" aria-label="${t(...name)}"></progress><output data-organ="${key}">50</output></li>`).join('')}</ul>
        </div>
      </div>
      <div class="v-actions"><div><button type="button" class="ink-button" id="vRecord">${t('记一笔', 'Log a day')}</button></div>
      <small>${t('角色养成积分，仅保存在本机浏览器。', 'Game points saved in this browser.')}</small></div>
      <p id="vNotice" class="v-notice" role="status"></p>
    </section>
    <details id="vProjection" class="v-projection">
      <summary>${t('二十年习惯推演', 'Twenty-year habit scenario')}</summary>
      <div class="v-projection-body">
        <p class="v-help">${t('假设今后每天都维持近期记录日的平均节奏，比较两种情景能积累的净积分。推演只描述游戏积分，不能预测疾病或脏腑功能。', 'Compare net game points if every future day follows your recent logged-day average. This simulation cannot predict diseases or organ function.')}</p>
        <div class="v-scenarios"><label>${t('想调整哪项习惯？', 'Choose a habit')}<select id="vHabit">${Object.entries(labels).map(([key, name]) => `<option value="${key}">${t(...name)}</option>`).join('')}</select></label>
        <label>${t('假设每周有几天改变？', 'Days to change each week')}<select id="vExtra">${[-7,-3,-1,0,1,3,7].map(n => `<option value="${n}">${n === 0 ? t('维持现状', 'No change') : (n > 0 ? t('达到目标', 'Target met') : t('未达到目标', 'Target missed')) + t(' · ' + Math.abs(n) + ' 天', ' · ' + Math.abs(n) + ' days')}</option>`).join('')}</select></label></div>
        <p id="vBasis" class="v-help" aria-live="polite"></p>
        <div id="vTrajectory"></div>
      </div>
    </details>
    <dialog id="vDialog" aria-labelledby="vFormTitle">
      <form id="vForm"><header class="v-form-head"><h3 id="vFormTitle">${t('每日记录', 'Daily record')}</h3><button type="button" class="v-close" aria-label="${t('关闭记录', 'Close record')}">×</button></header>
        <label class="v-date">${t('记录日期', 'Record date')}<input name="date" type="date" required></label>
        <p class="v-help">${t('按起床日记下昨夜睡眠，饮水、步行和锻炼按当天填写。可以只填一项。', 'Log last night’s sleep on the day you wake up. Log water and activities for that day. Any field may be left blank.')}</p>
        <div class="v-fields">
          <label>${t('昨晚入睡时间', 'Bedtime last night')}<input name="bedtime" type="time"></label>
          <label>${t('睡眠时长（小时）', 'Sleep (hours)')}<input name="sleepHours" type="number" min="0" max="24" step="any" inputmode="decimal"></label>
          <label>${t('饮水量（毫升）', 'Water (mL)')}<input name="waterMl" type="number" min="0" step="1" inputmode="numeric"></label>
          <label>${t('步行', 'Walk')}${activitySelect('walk')}</label>
          <label>${t('锻炼', 'Exercise')}${activitySelect('exercise')}</label>
          <label>${t('活动积分记入', 'Assign activity points to')}<select name="organ">${Object.entries(organNames).map(([key, name]) => `<option value="${key}">${t(...name)}</option>`).join('')}</select></label>
        </div>
        <p id="vAuto" class="v-help" hidden>${t('当天已完成站内跟练，锻炼自动记 +1。', 'A completed practice in the app already counts as +1 for exercise.')}</p>
        <details class="v-goals"><summary>${t('我的游戏目标与计分规则', 'My game targets and scoring')}</summary>
          <div class="v-fields"><label>${t('目标入睡时间', 'Target bedtime')}<input name="targetBedtime" type="time" required></label>
          <label>${t('目标睡眠（小时）', 'Target sleep (hours)')}<input name="targetSleepHours" type="number" min="0.01" max="24" step="any" required></label>
          <label>${t('目标饮水（毫升）', 'Target water (mL)')}<input name="targetWaterMl" type="number" min="1" step="1" required></label></div>
          <p class="v-help">${t('入睡在目标前后半小时内、睡眠或饮水达到自定目标，各 +1；填了但未达到，各 −1。步行、锻炼各自完成 +1、未完成 −1。所选五脏栏同步加减，只决定活动积分记在哪里。空白记 0。血条从 50 起，上下限为 100 和 0。', 'Bedtime within 30 minutes of target, and sleep or water at or above your targets, each earn +1. A logged miss scores −1. Walking and exercise each score +1 if done or −1 if marked not done, also applied to your chosen organ meter. Blanks score 0. Meters start at 50 and range from 0 to 100.')}</p>
        </details>
        <p id="vPreview" class="v-preview" aria-live="polite"></p>
        <p id="vError" role="alert"></p>
        <div class="v-form-actions"><button type="submit" class="ink-button">${t('保存记录', 'Save record')}</button><button type="button" class="v-text-button v-cancel">${t('取消', 'Cancel')}</button></div>
      </form>
    </dialog>`;
  $('#vProjection').open = expanded;
  $('#vExtra').value = extra;
  $('#vHabit').value = habit;
  $('#vHabit').addEventListener('change', drawProjection);
  $('#vExtra').addEventListener('change', drawProjection);
  $('#vRecord').addEventListener('click', () => {
    loadDate(todayInChina());
    $('#vDialog').showModal();
  });
  $('.v-close').onclick = $('.v-cancel').onclick = () => $('#vDialog').close();
  const form = $('#vForm');
  form.elements.date.addEventListener('change', () => {
    if (form.elements.date.validity.valid) loadDate(form.elements.date.value);
  });
  form.addEventListener('input', preview);
  form.addEventListener('submit', save);
  draw();
}

function loadDate(date) {
  const form = $('#vForm');
  const fields = form.elements;
  const existing = records[date] || {};
  const previous = Object.keys(records).filter(key => key < date).sort().pop();
  loadedVersion = JSON.stringify(records[date] ?? null);
  fields.date.max = todayInChina();
  fields.date.value = date;
  for (const [name, initial] of Object.entries(startingGoals)) {
    fields[name].value = existing[name] ?? records[previous]?.[name] ?? initial;
  }
  for (const name of ['bedtime','sleepHours','waterMl']) fields[name].value = existing[name] ?? '';
  for (const name of ['walk','exercise']) {
    fields[name].value = existing[name] === true ? 'yes' : existing[name] === false ? 'no' : '';
  }
  fields.organ.value = Object.hasOwn(organNames, existing.organ) ? existing.organ : 'heart';
  $('.v-goals').open = false;
  $('#vError').textContent = '';
  syncPractice();
}

function syncPractice() {
  const fields = $('#vForm').elements;
  const done = practiceDays.has(fields.date.value);
  fields.exercise.disabled = done;
  if (done) fields.exercise.value = 'yes';
  $('#vAuto').hidden = !done;
  preview();
}

function readForm() {
  const f = $('#vForm').elements;
  const activity = field => field.value === '' ? null : field.value === 'yes';
  const number = field => Number.isFinite(field.valueAsNumber) ? field.valueAsNumber : null;
  return {
    bedtime: f.bedtime.value || null, targetBedtime: f.targetBedtime.value,
    sleepHours: number(f.sleepHours), targetSleepHours: number(f.targetSleepHours),
    waterMl: number(f.waterMl), targetWaterMl: number(f.targetWaterMl),
    walk: activity(f.walk),
    exercise: f.exercise.disabled ? (records[f.date.value]?.exercise ?? null) : activity(f.exercise),
    organ: f.organ.value,
  };
}

function preview() {
  const date = $('#vForm').elements.date.value;
  const score = dailyScore(readForm(), practiceDays.has(date));
  const parts = Object.entries(score.parts).filter(([, n]) => n)
    .map(([key, n]) => t(...labels[key]) + ' ' + signed(n)).join(' · ');
  $('#vPreview').textContent = t('当日合计 ', 'Day total ') + signed(score.total) + (parts ? '　' + parts : '');
}

function save(event) {
  event.preventDefault();
  const date = $('#vForm').elements.date.value;
  if (!date || date > todayInChina()) return;
  try {
    const current = readRecords();
    if (JSON.stringify(current[date] ?? null) !== loadedVersion) {
      records = current;
      loadDate(date);
      $('#vError').textContent = t('这天的记录刚有更新，已载入最新内容。请核对后再保存。', 'This day changed in another tab. Review the reloaded record before saving.');
      return;
    }
    const entry = readForm();
    window.localStorage.setItem(prefix + date, JSON.stringify(entry));
    records = {...current, [date]: entry};
  } catch {
    $('#vError').textContent = t('浏览器未能保存，请检查本地存储后重试。', 'Could not save. Check browser storage and try again.');
    return;
  }
  notice = [date + ' 的记录已保存。', 'Saved the record for ' + date + '.'];
  $('#vDialog').close();
  draw();
}

function drawProjection() {
  const rows = projectScenario(state.recentAverage, Number($('#vExtra').value), state.recentParts[$('#vHabit').value]);
  const result = $('#vTrajectory');
  $('#vBasis').textContent = rows.length
    ? t(`近 28 天有 ${state.recentCount} 个记录日，平均每天净得 ${format(state.recentAverage)} 分。空白日不参与平均。`,
      `Based on ${state.recentCount} logged days in the last 28 days, averaging ${format(state.recentAverage)} net points per logged day. Blank days are excluded.`)
    : t('近 28 天还没有可计分的记录。记下一次步行，或完成一段跟练，即可看到推演。', 'No scored days in the past 28 days. Log a walk or complete a practice to see the projection.');
  if (!rows.length) { result.replaceChildren(); return; }
  const label = t('累计净积分', 'Cumulative net points');
  result.innerHTML = `<table><caption>${label}</caption><thead><tr><th scope="col">${t('从今天起', 'Years ahead')}</th><th scope="col">${t('维持当前习惯', 'Current habits')}</th><th scope="col">${t('调整后', 'Adjusted habits')}</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${row.year ? t(row.year + ' 年后', 'Year ' + row.year) : t('今天', 'Today')}</th><td>${format(row.baseline)}</td><td>${format(row.scenario)}</td></tr>`).join('')}</tbody></table><p class="v-help">${t('由今天的 0 分起累计。所选天数按新习惯替换，其余习惯照旧。每日净分限于 −5 至 +5；上方血条另按 0–100 显示。', 'Net points accumulate from zero today. The selected habit changes on the chosen days, with other habits held fixed. Net scores are capped at ±5 per day. The character meters above display on a separate 0–100 scale.')}</p>`;
}

function draw() {
  state = summarize(records, practiceDays, todayInChina());
  $('#vValue').textContent = state.value;
  $('#vMeter').value = state.value;
  $('#vToday').textContent = state.today.count ? t('今日 ', 'Today ') + signed(state.today.total)
    : t('今日尚无记录', 'No entry today');
  for (const output of panel.querySelectorAll('[data-organ]')) {
    const n = state.organs[output.dataset.organ];
    output.value = n;
    output.previousElementSibling.value = n;
  }
  $('#vNotice').textContent = notice ? t(...notice) : '';
  drawProjection();
}

async function refresh() {
  const request = ++refreshId;
  try { records = readRecords(); }
  catch { notice = ['浏览器的本地存储暂不可用。', 'Browser storage is unavailable.']; }
  const notes = await listNotes();
  if (request !== refreshId) return;
  practiceDays = new Set(notes.filter(note => note.seconds > 0 &&
    note.moves.some(move => move?.status === 'verified' || move?.status === 'followed')).map(note => note.date));
  draw();
  if ($('#vDialog').open) syncPractice();
}

mount();
refresh();
window.addEventListener('qimai-atlas-day-change', () => {
  $('#vForm').elements.date.max = todayInChina();
  refresh();
});
window.addEventListener('pageshow', refresh);
window.addEventListener('qimai-diary-change', refresh);
window.addEventListener('storage', e => {
  if (e.key === null || e.key.startsWith(prefix)) refresh();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
new MutationObserver(() => { if (!$('#vDialog').open) mount(); }).observe(document.documentElement, {
  attributes: true, attributeFilter: ['lang'],
});
