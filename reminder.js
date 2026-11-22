(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'qimai_reminder_v2';
  const allowedMinutes = [20, 30, 45, 60];
  const dialog = $('breakDialog');
  let busy = false;
  let preview = false;
  let notice = null;
  let state = readState();

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && allowedMinutes.includes(saved.minutes) && Number.isFinite(saved.dueAt)) {
        return { minutes: saved.minutes, enabled: saved.enabled === true, dueAt: saved.dueAt, notifiedAt: saved.notifiedAt };
      }
    } catch (_) { /* 浏览器禁用存储时，本次打开期间仍可使用。 */ }
    return { minutes: 45, enabled: false, dueAt: 0, notifiedAt: 0 };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (_) { $('reminderStorage').textContent = '当前浏览器无法保存设置，关闭页面后计时设置会丢失。'; }
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
    if (notice) notice.close();
    notice = null;
  }

  function render() {
    $('reminderInterval').value = String(state.minutes);
    $('reminderToggle').textContent = state.enabled ? '关闭提醒' : '开启久坐提醒';
    $('reminderToggle').setAttribute('aria-pressed', String(state.enabled));
    const remaining = Math.max(0, Math.ceil((state.dueAt - Date.now()) / 1000));
    let text = '提醒未开启';
    if (state.enabled) {
      text = busy === 'demo' ? '演示中，返回后继续原计时' : busy ? '练习中，完成后重新计时' : remaining > 0
        ? '下次活动提醒 ' + String(Math.floor(remaining / 60)).padStart(2, '0') + '分' + String(remaining % 60).padStart(2, '0') + '秒'
        : '到活动时间了，来练一招';
    }
    document.querySelectorAll('[data-reminder-status]').forEach(el => { el.textContent = text; });
  }

  function showReminder(isPreview) {
    if (dialog.open) return;
    preview = isPreview;
    $('breakTitle').textContent = isPreview ? '体验一次活动提醒' : '到活动时间了，起来动一动';
    $('snoozeReminder').textContent = isPreview ? '关闭提醒体验' : '稍后再练 · 5 分钟后提醒';
    $('breakText').textContent = isPreview
      ? '跟着看山动一动。你可以练今天的三式，也可以继续当前课程。'
      : '计时已到。如果你仍在久坐，现在可以花一点时间，跟伙伴完成当前模式的短练习。';
    const settingsDialog=document.getElementById('settingsDialog');
    if(settingsDialog?.open) settingsDialog.close();
    window.dispatchEvent(new Event('qimai-reminder-shown'));
    dialog.showModal();
    if (!isPreview && state.notifiedAt !== state.dueAt) {
      state.notifiedAt = state.dueAt;
      save();
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          notice = new Notification('气脉陪练 · 活动时间到了', {
            body: '回到页面练一招，跟随动作提示完成一次短练习。', tag: 'qimai-break'
          });
          notice.onclick = () => { window.focus(); notice?.close(); };
        } catch (_) { /* 页面弹窗继续提供提醒。 */ }
      }
    }
  }

  function tick() {
    render();
    if (state.enabled && !busy && Date.now() >= state.dueAt) showReminder(false);
  }

  function snooze() {
    if (!preview && state.enabled) {
      state.dueAt = Date.now() + 5 * 60 * 1000;
      save();
    }
    closeDialog();
    render();
  }

  $('reminderToggle').addEventListener('click', () => {
    state.enabled = !state.enabled;
    state.dueAt = Date.now() + state.minutes * 60 * 1000;
    save();
    closeDialog();
    tick();
  });
  $('reminderInterval').addEventListener('change', event => {
    state.minutes = Number(event.target.value);
    state.dueAt = Date.now() + state.minutes * 60 * 1000;
    save();
    closeDialog();
    tick();
  });
  $('previewReminder').addEventListener('click', () => showReminder(true));
  $('snoozeReminder').addEventListener('click', snooze);
  dialog.addEventListener('cancel', event => { event.preventDefault(); snooze(); });
  $('almanacBreak').addEventListener('click', event => {
    event.preventDefault();
    closeDialog();
    window.dispatchEvent(new CustomEvent('qimai-start-daily', { detail: { source: 'reminder' } }));
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted && !busy) {
      state = readState();
      closeDialog();
      tick();
    }
  });
  $('takeBreak').addEventListener('click', () => {
    busy = true;
    closeDialog();
    render();
    window.dispatchEvent(new CustomEvent('qimai-start-practice'));
  });

  function notificationLabel() {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'unsupported';
    $('enableNotifications').disabled = permission === 'granted' || permission === 'denied' || !supported;
    $('enableNotifications').textContent = ({ granted: '系统通知已开启', denied: '系统通知已被浏览器禁用', unsupported: '当前浏览器仅支持页面提醒' })[permission] || '允许系统通知';
  }
  $('enableNotifications').addEventListener('click', async () => {
    try { await Notification.requestPermission(); }
    catch (_) { $('reminderStorage').textContent = '系统通知未能开启，页面仍会显示提醒。'; }
    notificationLabel();
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    state = readState();
    closeDialog();
    tick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.QimaiReminder = {
    setBusy(value) { busy = value; if (busy) closeDialog(); tick(); },
    complete() {
      state.dueAt = Date.now() + state.minutes * 60 * 1000;
      save();
      busy = false;
      closeDialog();
      tick();
    }
  };
  notificationLabel();
  tick();
  setInterval(tick, 1000);
})();
