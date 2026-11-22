import { listNotes, updateNote, storageMode } from '../practice-diary.mjs';
import { questions } from './questions.mjs';

const publicDaily = new URL('../?practice=daily', import.meta.url).href;
const moveLabels = {verified:'观察通过', followed:'已跟练', partial:'练了一部分', unstarted:'未开始'};
const number = value => Math.max(0, Math.floor(Number(value) || 0));
const points = note => note.moves.filter(move => move.status === 'verified').length;
const courseKey = note => note.courseKey || JSON.stringify([note.kind, note.mode, note.moves.map(move => move.id)]);

function duration(value) {
  const seconds = number(value);
  if (seconds < 60) return seconds + '秒';
  const minutes = Math.floor(seconds / 60);
  return minutes + '分' + (seconds % 60 ? (seconds % 60) + '秒' : '钟');
}

function modeName(note) {
  return note.mode === 'seated' ? '坐姿' : note.mode === 'standing' ? '站姿' : '';
}

function priorComparable(note, notes) {
  return notes.find(other => other.id !== note.id && other.startedAt < note.startedAt && courseKey(other) === courseKey(note));
}

function questionFor(note, scene) {
  const chosen = questions.find(item => String(item.id) === String(note.topic));
  if (chosen) return chosen;
  const byScene = key => key && questions.find(item => item.scene === key || item.scenes?.includes(key));
  const usedMoves = note.moves.filter(move => move.status !== 'unstarted').map(move => move.name).join(' ');
  const inferred = /肩|颈/.test(usedMoves) ? 'neck' : /腰|背|脊/.test(usedMoves) ? 'back' : '';
  return byScene(note.scene) || byScene(scene) || byScene(inferred) || byScene('general') || questions[0];
}

function recordTime(note) {
  const when = new Date(note.startedAt);
  const time = Number.isNaN(when.getTime()) ? '' : when.toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit', hour12:false});
  return [note.date, time].filter(Boolean).join(' ');
}

function entryTitle(note) {
  return note.title || (note.kind === 'daily' ? (note.pillar || '') + '日三式' : note.kind === 'course' ? '课程练习' : '单式练习');
}

function practiceDraft(note, question, feeling, prior) {
  const done = note.moves.filter(move => ['verified','followed'].includes(move.status));
  const partial = note.moves.filter(move => move.status === 'partial');
  const names = moves => moves.map(move => '「' + move.name + '」').join('、');
  const total = duration(note.seconds);
  const mode = modeName(note);
  const shortDate = String(note.date || '').match(/^\d{4}-(\d{2})-(\d{2})$/);
  const when = shortDate ? Number(shortDate[1]) + '月' + Number(shortDate[2]) + '日' : '这回';
  const session = (mode ? mode + '练习' : '练习');
  const lines = [when + '我做了一次' + session + (number(note.seconds) ? '，一共' + total : '') + '。'];
  if (done.length) lines.push('我跟着示范做完了' + names(done) + '。');
  if (partial.length) lines.push(names(partial) + '只练了一部分。');
  const score = points(note);
  let observation = '';
  if (score || note.method === 'camera' || note.method === 'mixed') {
    observation = score ? '这次有 ' + score + ' 式通过了动作观察，练习日记给我记了 ' + score + ' 分筋骨值。' : '这次还没有动作通过观察。';
    if (prior) {
      const previous = points(prior);
      if (score > previous) observation += '上次按同样的练法做这组动作，我通过了 ' + previous + ' 式，这次多通过了 ' + (score - previous) + ' 式。';
    }
  }
  const reflection = feeling.trim();
  return [question.answerLead || '', lines.join('') + observation, reflection].filter(Boolean).join('\n\n');
}

function mergePatch(before = {}, after = {}) {
  const value = {...before, ...after};
  if (before?.drafts || after?.drafts) value.drafts = {...before?.drafts, ...after?.drafts};
  return value;
}

const template = `
  <header class="qd-heading"><div><h2></h2><p class="qd-summary"></p></div><span class="qd-device"></span></header>
  <p class="qd-empty" role="status">正在读取练习记录…</p>
  <details class="qd-empty-topics" hidden><summary>看看可以回答哪些知乎问题</summary><ul></ul></details>
  <div class="qd-body" hidden>
    <label class="qd-history"><span>回看练习</span><select aria-label="回看练习"></select></label>
    <article class="qd-entry">
      <div class="qd-date"></div><h3 class="qd-name"></h3>
      <p class="qd-facts"></p>
      <ul class="qd-moves" aria-label="本次动作记录"></ul>
      <p class="qd-score"></p><p class="qd-compare"></p>
    </article>
    <div class="qd-writing">
      <label class="qd-field"><span>我的练后感受</span><textarea class="qd-feeling" rows="2" placeholder="哪一个动作最容易跟上？想留给下次练习的自己一句什么话？"></textarea></label>
      <div class="qd-save-row"><button class="qd-light qd-save" type="button">保存日记</button><span class="qd-save-state" role="status"></span></div>
    </div>
    <div class="qd-answer" hidden>
      <h3>用这次经历回答知乎问题</h3>
      <div class="qd-question-line"><a class="qd-question" target="_blank" rel="noopener noreferrer"></a></div>
      <details class="qd-compose">
        <summary>整理回答草稿</summary>
        <div class="qd-compose-body">
          <label class="qd-field qd-topics"><span>选择知乎问题</span><select></select></label>
          <p class="qd-prompt"></p>
          <button class="qd-light qd-generate" type="button">从日记生成草稿</button>
          <div class="qd-replace" hidden><p>用当前日记重新生成，会替换这道题已保存的草稿。</p>
            <button class="qd-light qd-confirm" type="button">替换草稿</button>
            <button class="qd-light qd-cancel" type="button">保留原稿</button></div>
          <label class="qd-field qd-draft-field"><span>我的回答草稿</span>
            <textarea class="qd-draft" rows="6" placeholder="可以从日记生成，也可以直接在这里写。"></textarea></label>
          <label class="qd-include"><input type="checkbox"> 复制时附上「一起做今日小练」公开链接</label>
          <div class="qd-share"><button class="qd-primary qd-copy" type="button">复制回答</button>
            <a class="qd-discuss" target="_blank" rel="noopener noreferrer">打开知乎原题 ↗</a></div>
          <p class="qd-copy-state" role="status">打开原题后，可以粘贴、校对，再自行发表。</p>
          <textarea class="qd-manual" rows="5" aria-label="可手动复制的回答" readonly hidden></textarea>
        </div>
      </details>
    </div>
  </div>`;

export function mountDiary(host, {surface = 'journey', entryId = '', scene = ''} = {}) {
  const isHistory = surface === 'journey';
  const writes = new Map();
  let selected = entryId, notes = [], activeTopic = '', local = false, version = 0, closed = false;
  let replaceText = '', lastEditor = '', lastOptions = '';
  host.classList.add('qd-diary');
  host.dataset.diarySurface = surface;
  host.innerHTML = template;
  host.hidden = !isHistory && !selected;
  const find = name => host.querySelector(name);
  const empty = find('.qd-empty'), body = find('.qd-body');
  const history = find('.qd-history select'), topics = find('.qd-topics select');
  const feeling = find('.qd-feeling'), draft = find('.qd-draft');
  const saveState = find('.qd-save-state'), copyState = find('.qd-copy-state');
  const copy = find('.qd-copy'), compose = find('.qd-compose');
  const copyHint = copyState.textContent;
  const include = find('.qd-include input'), manual = find('.qd-manual');
  function clearCopy() {
    copyState.textContent = copyHint;
    manual.hidden = true;
    manual.value = '';
  }
  include.addEventListener('change', clearCopy);
  find('.qd-heading h2').textContent = isHistory ? '我的练习日记' : '本次练习日记';
  find('.qd-history').hidden = !isHistory;
  const explore = find('.qd-empty-topics');
  for (const question of questions) {
    topics.add(new Option(question.title, String(question.id)));
    if (isHistory) {
      const item = document.createElement('li'), link = document.createElement('a');
      link.textContent = question.title;
      link.href = question.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      item.append(link);
      explore.querySelector('ul').append(item);
    }
  }
  find('.qd-topics').hidden = questions.length < 2;

  function view(note) {
    if (!note) return null;
    const edits = writes.get(note.id);
    return edits ? mergePatch(mergePatch(note, edits.sending), edits.pending) : note;
  }
  const current = () => view(notes.find(note => note.id === selected));

  function describe(note) {
    const mode = modeName(note);
    find('.qd-date').textContent = recordTime(note);
    find('.qd-name').textContent = entryTitle(note);
    const methods = {camera:'摄像头检验', free:'自由跟练', mixed:'含检验与自由跟练'};
    find('.qd-facts').textContent = [mode, methods[note.method], duration(note.seconds), note.status === 'partial' ? '部分练习' : '完成练习'].filter(Boolean).join(' · ');
    const list = find('.qd-moves');
    list.replaceChildren();
    for (const move of note.moves) {
      const row = document.createElement('li');
      row.dataset.progress = move.status;
      const name = document.createElement('span'), label = document.createElement('small');
      name.textContent = move.name;
      label.textContent = moveLabels[move.status] || '';
      row.append(name, label);
      list.append(row);
    }
    list.hidden = !list.childElementCount;
    const score = points(note);
    find('.qd-score').textContent = '本次筋骨值 +' + score + ' · 每通过一式动作观察积 1 分';
    const prior = priorComparable(note, notes);
    const comparison = find('.qd-compare');
    comparison.hidden = false;
    comparison.textContent = '首次记录这组动作与练法。';
    if (prior) {
      const diff = score - points(prior);
      const change = diff === 0 ? '与上次相同' : (diff > 0 ? '比上次多 ' : '比上次少 ') + Math.abs(diff) + ' 式';
      comparison.textContent = '同组同练法上次通过 ' + points(prior) + ' 式，本次 ' + score + ' 式，' + change + '。';
    }
  }

  function setSaveState() {
    const edits = writes.get(selected);
    saveState.textContent = edits?.error ? '保存未完成，请再点一次保存日记。' : edits ? '正在保存…'
      : local ? '日记与草稿自动保存在此浏览器' : '当前仅在此页保留，离开前可先复制文字';
  }

  function render() {
    if (closed) return;
    const note = current();
    host.hidden = !isHistory && !note;
    body.hidden = !note;
    empty.hidden = !!note;
    explore.hidden = !!note || !isHistory || !questions.length;
    empty.textContent = '完成或结束一次跟练后，可以在这里回看动作、写感受。';
    find('.qd-device').textContent = local ? '本机记录' : '临时记录';
    find('.qd-summary').textContent = notes.length ? '已记 ' + notes.length + ' 次练习 · 累计筋骨值 ' + notes.reduce((sum, n) => sum + points(n), 0) : '';
    if (!note) return;
    if (isHistory) {
      const options = JSON.stringify(notes.map(n => [n.id, recordTime(n), entryTitle(n), duration(n.seconds)]));
      if (options !== lastOptions) {
        lastOptions = options;
        history.replaceChildren(...notes.map(n => new Option([recordTime(n), entryTitle(n), duration(n.seconds)].join(' · '), n.id)));
      }
      history.value = selected;
    }
    describe(note);
    if (feeling.value !== (note.feeling || '')) feeling.value = note.feeling || '';
    setSaveState();
    const question = questionFor(note, scene);
    find('.qd-answer').hidden = !question;
    if (!question) return;
    activeTopic = String(question.id);
    if (lastEditor !== selected + '/' + activeTopic) {
      lastEditor = selected + '/' + activeTopic;
      replaceText = '';
      find('.qd-replace').hidden = true;
      include.checked = false;
      clearCopy();
    }
    topics.value = activeTopic;
    const link = find('.qd-question');
    link.textContent = question.title;
    link.href = question.url;
    find('.qd-discuss').href = question.url;
    find('.qd-prompt').textContent = question.prompt || question.angle || '';
    const text = note.drafts?.[activeTopic] || '';
    if (draft.value !== text) draft.value = text;
    find('.qd-generate').textContent = text.trim() ? '用当前日记重新整理' : '从日记生成草稿';
    copy.disabled = !text.trim();
    compose.querySelector('summary').textContent = text.trim() ? '编辑回答草稿' : '整理回答草稿';
  }

  async function refresh(id) {
    if (closed) return;
    if (id !== undefined) selected = id;
    const revision = ++version;
    try {
      const [records, mode] = await Promise.all([listNotes(), storageMode()]);
      if (revision !== version || closed) return;
      notes = records;
      local = mode === 'local';
      if (isHistory && !notes.some(n => n.id === selected)) selected = notes[0]?.id || '';
      render();
    } catch {
      if (revision !== version || closed) return;
      if (!notes.length) {
        host.hidden = !isHistory && !selected;
        empty.hidden = false;
        empty.textContent = '暂时无法读取本机日记。请重新打开此页。';
      }
    }
  }

  async function flush(id) {
    const edits = writes.get(id);
    if (!edits) return;
    clearTimeout(edits.timer);
    if (edits.sending || !edits.pending) return;
    const patch = edits.pending;
    edits.pending = null;
    edits.sending = patch;
    edits.error = false;
    try {
      const saved = await updateNote(id, patch);
      const index = notes.findIndex(note => note.id === id);
      if (index >= 0) notes[index] = saved;
      edits.sending = null;
      if (edits.pending) return flush(id);
      writes.delete(id);
      await refresh();
    } catch {
      edits.pending = mergePatch(patch, edits.pending || {});
      edits.sending = null;
      edits.error = true;
    }
    if (!closed && selected === id) setSaveState();
  }

  function queue(patch, immediate = false) {
    if (!selected) return;
    const id = selected;
    const edits = writes.get(id) || {};
    edits.error = false;
    edits.pending = mergePatch(edits.pending, patch);
    writes.set(id, edits);
    clearTimeout(edits.timer);
    if (immediate) void flush(id);
    else edits.timer = setTimeout(() => { void flush(id); }, 300);
    setSaveState();
  }

  function writeDraft(text) {
    draft.value = text;
    replaceText = '';
    find('.qd-replace').hidden = true;
    queue({topic:activeTopic, drafts:{[activeTopic]:text}}, true);
    clearCopy();
    copyState.textContent = '草稿已生成，可以逐句修改。';
    copy.disabled = !text.trim();
    draft.focus();
  }
  history.addEventListener('change', () => {
    void flush(selected);
    selected = history.value;
    render();
  });
  topics.addEventListener('change', () => {
    queue({topic:topics.value}, true);
    render();
  });
  feeling.addEventListener('input', () => {
    queue({feeling:feeling.value, ...(activeTopic && !current()?.topic ? {topic:activeTopic} : {})});
    find('.qd-replace').hidden = true;
  });
  draft.addEventListener('input', () => {
    queue({topic:activeTopic, drafts:{[activeTopic]:draft.value}});
    copy.disabled = !draft.value.trim();
    find('.qd-replace').hidden = true;
    clearCopy();
  });
  find('.qd-save').addEventListener('click', () => {
    queue({feeling:feeling.value, ...(activeTopic ? {topic:activeTopic} : {})}, true);
  });
  find('.qd-generate').addEventListener('click', () => {
    const note = current(), question = questionFor(note, scene);
    const next = practiceDraft(note, question, feeling.value, priorComparable(note, notes));
    if (draft.value.trim() && next !== draft.value) {
      replaceText = next;
      find('.qd-replace').hidden = false;
      find('.qd-cancel').focus();
    } else writeDraft(next);
  });
  find('.qd-confirm').addEventListener('click', () => writeDraft(replaceText));
  find('.qd-cancel').addEventListener('click', () => {
    find('.qd-replace').hidden = true;
    replaceText = '';
    find('.qd-generate').focus();
  });
  copy.addEventListener('click', async () => {
    const answer = draft.value.trim();
    if (!answer) return;
    const text = answer + (include.checked ? '\n\n一起做今日小练\n' + publicDaily : '');
    const editor = lastEditor;
    try {
      await navigator.clipboard.writeText(text);
      if (!closed && editor === lastEditor) {
        clearCopy();
        copyState.textContent = '回答已复制。打开知乎原题后，可以粘贴并自行发表。';
      }
    } catch {
      if (closed || editor !== lastEditor) return;
      manual.value = text;
      manual.hidden = false;
      manual.focus();
      manual.select();
      copyState.textContent = '已选中下方文字，请按复制快捷键或长按复制，再打开知乎原题。';
    }
  });
  const changed = () => { void refresh(); };
  const flushAll = () => { for (const id of writes.keys()) void flush(id); };
  const leaving = () => { if (document.hidden) flushAll(); };
  host.addEventListener('focusout', flushAll);
  window.addEventListener('qimai-diary-change', changed);
  window.addEventListener('pagehide', flushAll);
  document.addEventListener('visibilitychange', leaving);
  void refresh();
  return {refresh, destroy() {
    flushAll();
    closed = true;
    host.removeEventListener('focusout', flushAll);
    window.removeEventListener('qimai-diary-change', changed);
    window.removeEventListener('pagehide', flushAll);
    document.removeEventListener('visibilitychange', leaving);
    host.replaceChildren();
  }};
}
