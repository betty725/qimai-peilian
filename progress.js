(function () {
  'use strict';
  const D = window.QimaiData;
  const allLessons = [...D.lessons,...D.seated];
  const dayKey = (date = new Date()) => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  function weekKey(date = new Date()) {
    const monday = new Date(date.getFullYear(),date.getMonth(),date.getDate());
    monday.setDate(monday.getDate() - (monday.getDay()+6)%7);
    return dayKey(monday);
  }
  function fresh() {
    return {version:3,id:crypto.randomUUID(),name:'山间练习者',coins:0,xp:0,owned:[],equipped:{},
      records:[],cards:{},claimed:[],groups:[],activeGroup:null,settings:{voice:true,breath:false,music:false,volume:.18}};
  }
  function normalize(value) {
    if(!value || value.version !== 3) return fresh();
    const defaults=fresh();
    return {...defaults,...value,settings:{...defaults.settings,...value.settings}};
  }
  function award(state,record) {
    if(record.demo) return {coins:0,xp:0,reason:'demo'};
    const lesson=allLessons.find(lesson=>lesson.id===record.lessonId);
    if(!lesson) throw Error('练习项目不存在');
    // 新流程按完成的全部步骤确认整段，真实练习时长不补写为旧版的固定时长。
    const fullSteps=lesson.steps.length*D.rounds;
    const minSeconds=record.completedSteps===fullSteps?fullSteps*(window.QimaiMotion?.moveMs||2000)/1000:38;
    if(!Number.isFinite(record.seconds) || record.seconds < minSeconds || record.seconds > 900) throw Error('请完成整段练习后领取记录');
    if(state.records.some(item=>item.id===record.id)) return {coins:0,xp:0,reason:'duplicate'};
    const date = dayKey();
    const today = state.records.filter(item=>item.date===date);
    const firstToday = !today.some(item=>item.lessonId===record.lessonId);
    const dailyCoins = today.reduce((sum,item)=>sum+item.coins,0);
    const coins = firstToday ? Math.min(12,Math.max(0,60-dailyCoins)) : 0;
    const xp = firstToday ? 10 : 0;
    state.records.push({id:record.id,lessonId:record.lessonId,date,seconds:Math.round(record.seconds),coins,xp,verified:record.verified===true});
    state.coins += coins;
    state.xp += xp;
    const card = state.cards[record.lessonId] || {firstDate:date,count:0,verified:0};
    card.count++;
    if(record.verified) card.verified++;
    state.cards[record.lessonId] = card;
    return {coins,xp,reason:firstToday?'completed':'practiced'};
  }
  function purchase(state,id) {
    const item = D.shop.find(item=>item.id===id);
    if(!item) throw Error('装扮不存在');
    if(!state.owned.includes(id)) {
      if(state.coins < item.price) throw Error('金币还差 '+(item.price-state.coins)+' 枚，完成练习后再来看看');
      state.coins-=item.price;
      state.owned.push(id);
    }
    state.equipped[item.slot] = state.equipped[item.slot]===id ? null : id;
  }
  function claim(state,id) {
    const milestone = D.milestones.find(item=>item.id===id);
    if(!milestone || Object.keys(state.cards).length < milestone.goal) throw Error('再完成一些新动作，就能打开这里');
    if(state.claimed.includes(id)) throw Error('这份奖励已经领取');
    state.claimed.push(id);
    state.coins+=milestone.coins;
    return milestone.coins;
  }
  function stats(state) {
    const week = weekKey(), today = dayKey();
    const records = state.records.filter(record=>record.date>=week && record.date<=today);
    return {days:new Set(records.map(item=>item.date)).size,minutes:Math.round(records.reduce((sum,item)=>sum+item.seconds,0)/6)/10,
      sessions:records.length,today:state.records.filter(record=>record.date===today).length};
  }
  function encode(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let text = '';
    bytes.forEach(byte=>{text+=String.fromCharCode(byte);});
    return 'QM3.'+btoa(text);
  }
  function decode(text) {
    const value = text.trim();
    if(value.length > 48000 || !value.startsWith('QM3.')) throw Error('请输入完整的 QM3 好友口令');
    try {
      const data = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(value.slice(4)),char=>char.charCodeAt(0))));
      if(data.v!==3 || !['invite','report'].includes(data.type)) throw Error();
      return data;
    } catch (_) { throw Error('口令格式不正确，请重新复制完整内容'); }
  }
  const validId = value => typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const validName = value => typeof value==='string' && value.trim().length>0 && value.length<=24;
  function createGroup(state,name) {
    if(!validName(name)) throw Error('圈子名称请填写 1—24 个字');
    if(state.groups.length>=5) throw Error('最多保存 5 个圈子，请先退出一个圈子');
    const group = {id:crypto.randomUUID(),name:name.trim(),members:{},cheers:[]};
    state.groups.push(group); state.activeGroup = group.id;
    return group;
  }
  function activeGroup(state) { return state.groups.find(group=>group.id===state.activeGroup); }
  function invite(state) {
    const group = activeGroup(state);
    if(!group) throw Error('请先创建或加入圈子');
    return encode({v:3,type:'invite',group:group.id,name:group.name});
  }
  function report(state) {
    const group = activeGroup(state);
    if(!group) throw Error('请先创建或加入圈子');
    const since = new Date(); since.setDate(since.getDate()-30);
    const days = {};
    state.records.filter(item=>item.date>=dayKey(since)).forEach(record=>{
      const daily = days[record.date] || {date:record.date,seconds:0,count:0};
      daily.seconds+=record.seconds; daily.count++; days[record.date]=daily;
    });
    return {v:3,type:'report',group:group.id,id:state.id,name:state.name,sentAt:Date.now(),days:Object.values(days)};
  }
  function importCode(state,text) {
    const data = decode(text);
    if(!validId(data.group)) throw Error('圈子口令无效');
    if(data.type==='invite') {
      if(!validName(data.name)) throw Error('圈子名称无效');
      let group = state.groups.find(group=>group.id===data.group);
      if(!group) {
        if(state.groups.length>=5) throw Error('最多保存 5 个圈子');
        group = {id:data.group,name:data.name,members:{},cheers:[]};
        state.groups.push(group);
      }
      state.activeGroup = group.id;
      return '已加入 '+group.name+'，请与好友交换战报更新榜单';
    }
    const group = activeGroup(state);
    if(!group || data.group!==group.id) throw Error('战报属于其他圈子，请先切换或加入对应圈子');
    if(!validId(data.id) || !validName(data.name) || !Number.isFinite(data.sentAt) || data.sentAt>Date.now()+300000 || data.sentAt<0) throw Error('战报信息无效');
    if(data.id===state.id) throw Error('这是你自己的战报，请导入好友的战报');
    if(!Array.isArray(data.days) || data.days.length>31) throw Error('战报日期数量异常');
    const dates = new Set();
    const today = dayKey();
    for(const day of data.days) {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || day.date>today || dates.has(day.date) ||
        dayKey(new Date(day.date+'T12:00:00'))!==day.date ||
        !Number.isInteger(day.seconds) || day.seconds<0 || day.seconds>86400 ||
        !Number.isInteger(day.count) || day.count<0 || day.count>2160) throw Error('战报练习数据无效');
      dates.add(day.date);
    }
    const old = group.members[data.id];
    if(old && old.sentAt>=data.sentAt) throw Error('已保存同一份或更新的战报');
    if(!old && Object.keys(group.members).length>=19) throw Error('一个圈子最多保存 20 位成员');
    group.members[data.id]={id:data.id,name:data.name,sentAt:data.sentAt,days:data.days.map(day=>({date:day.date,seconds:day.seconds,count:day.count}))};
    return '已更新 '+data.name+' 的战报';
  }
  function leaderboard(state) {
    const group = activeGroup(state);
    if(!group) return [];
    const week = weekKey();
    const rows = [report(state),...Object.values(group.members)].map(member=>{
      const days = member.days.filter(day=>day.date>=week && day.date<=dayKey() && day.count>0);
      return {...member,activeDays:days.length,minutes:Math.round(days.reduce((sum,day)=>sum+Math.min(1200,day.seconds),0)/6)/10,self:member.id===state.id};
    });
    return rows.sort((a,b)=>b.activeDays-a.activeDays || b.minutes-a.minutes || a.name.localeCompare(b.name));
  }
  window.QimaiProgress = {fresh,normalize,award,purchase,claim,stats,encode,decode,createGroup,activeGroup,invite,report,importCode,leaderboard,dayKey,weekKey};

  // IndexedDB 的读写事务将奖励、余额和装扮一次提交，避免多标签页重复扣款或丢失更新。
  let db;
  let state;
  let channel;
  try { if (typeof BroadcastChannel==='function') channel=new BroadcastChannel('qimai-v3'); } catch {}
  async function init() {
    try {
      db = await new Promise((resolve,reject)=>{
        const request = indexedDB.open('qimai-v3',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('state');
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
      });
      await transaction(value=>value);
    } catch {
      db?.close();
      db=null;
      state=fresh();
    }
    return state;
  }
  function transaction(change) {
    if (!db) {
      // Restricted embeds may reject IndexedDB. Keep the same validation and
      // rollback semantics for the lifetime of this document.
      return Promise.resolve().then(()=>{
        const next=structuredClone(state);
        const result=change(next);
        state=next;
        return result;
      });
    }
    return new Promise((resolve,reject)=>{
      const tx = db.transaction('state','readwrite');
      const store = tx.objectStore('state');
      const request = store.get('main');
      let next, result, error;
      request.onsuccess=()=>{
        try {
          next=normalize(request.result);
          result=change(next);
          store.put(next,'main');
        } catch(err) { error=err; tx.abort(); }
      };
      tx.oncomplete=()=>{
        state=next;
        channel?.postMessage('updated');
        resolve(result);
      };
      tx.onabort=()=>reject(error || Error('保存失败，请重试'));
      tx.onerror=()=>{ error=Error('本地存储空间不足或访问受限'); };
    });
  }
  function refresh() {
    if(!db) return;
    const tx=db.transaction('state','readonly');
    const request=tx.objectStore('state').get('main');
    request.onsuccess=()=>{ if(request.result) {state=normalize(request.result);window.dispatchEvent(new Event('qimai-progress'));} };
  }
  if(channel) channel.onmessage=refresh;
  window.QimaiStore={init,transaction,get:()=>state,refresh,isTemporary:()=>!db};
})();
