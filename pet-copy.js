/* First-person companion copy. Reminder intervals are user preferences, not medical cutoffs.
   General health wording: NHS neck-pain guidance; WHO 2020 sedentary-behaviour guidance.
   Full source links and editable copy are documented in 看山关怀气泡-文案与依据.txt. */
(function(root){
'use strict';
const bank=[
 {id:'shoulders',title:m=>`${m} 分钟到啦，我陪你松松肩？`,detail:'长时间保持同一个姿势，颈肩可能会不舒服。跟我换个姿势，轻松活动一下吧。',action:'跟我活动一下 ↗'},
 {id:'walk',title:m=>`${m} 分钟啦，跟我起来走走？`,detail:'用一点轻松活动打断久坐，也是照顾身体的小习惯。我陪你先活动两分钟，再继续忙吧。',action:'和我练一式 ↗'},
 {id:'stretch',title:m=>`${m} 分钟到啦，我陪你伸展一下？`,detail:'不用追求动作幅度，舒服地动一动就好。点进来，我陪你慢慢练一式。',action:'跟我慢慢练 ↗'},
 {id:'company',title:m=>`${m} 分钟啦，和我歇一小会儿？`,detail:'你负责忙眼前的事，我负责记着休息。现在方便的话，换个姿势、走动一下吧。',action:'一起活动一下 ↗'},
 {id:'writing',title:m=>`${m} 分钟啦，我陪你抬头歇歇？`,detail:'如果正在低头读写，记得别让脖子一直停在同一位置。放下笔，和我轻松活动一下吧。',action:'跟我舒展一下 ↗',state:'writing'},
 {id:'screen',title:m=>`${m} 分钟到了，我陪你离屏片刻？`,detail:'屏幕里的事可以稍等一会儿。我陪你换个姿势、走动走动，让这段久坐告一段落。',action:'和我练一式 ↗',state:'screen'},
 {id:'gentle',title:m=>`${m} 分钟到啦，我陪你动一动？`,detail:'不用一下练很多，先从轻松的小动作开始。你按自己的节奏来，我陪着你。',action:'从一式开始 ↗'},
 {id:'promise',title:m=>`${m} 分钟啦，我来赴休息之约。`,detail:'这是我们约好的提醒时间。现在方便的话，和我站起来活动一下；忙的话，五分钟后再见也可以。',action:'赴一场小休息 ↗'}
];
const later=[
 {id:'later-gentle',title:'我又来啦，现在方便活动一下吗？',detail:'刚才说好五分钟后再见。手头的事如果告一段落，就和我起来走走吧。',action:'跟我活动一下 ↗'},
 {id:'later-company',title:'我等着你，要一起松松肩吗？',detail:'到我们约好的提醒时间啦。不必勉强，方便时再和我练一式。',action:'和我慢慢练 ↗'}
];
function create(){
 let cursor=0,laterCursor=0,episode=null,previewCopy=null,lastActive=0,lastMinutes=null,snoozed=false,ackUntil=0;
 function next(minutes,state){
  for(let n=0;n<bank.length;n++){
   const item=bank[cursor++%bank.length];
   if(!item.state||item.state===state)return {...item,title:item.title(minutes)};
  }
 }
 return {
  preview(minutes,state){previewCopy=next(minutes,state);},
  snooze(now,{preview=false}={}){episode=null;previewCopy=null;snoozed=!preview;ackUntil=now+6000;},
  clear(){episode=null;previewCopy=null;snoozed=false;ackUntil=0;},
  update({due,preview=false,minutes,state,activeMs,restRemaining=0},now){
   if(activeMs<lastActive||lastMinutes!==null&&minutes!==lastMinutes){episode=null;snoozed=false;previewCopy=null;ackUntil=0;}
   lastActive=activeMs;lastMinutes=minutes;
   if(preview){previewCopy??=next(minutes,state);return previewCopy;}
   if(due){
    if(!episode){episode=snoozed?{...later[laterCursor++%later.length]}:next(minutes,state);snoozed=false;}
    return episode;
   }
   if(restRemaining>0)return {id:'rest',title:'我在这里等你，慢慢活动就好。',detail:'按舒服的节奏来，不用追求动作幅度。两分钟活动时间不计入连续用功。'};
   if(now<ackUntil)return {id:'acknowledge',title:'好，我五分钟后再来。',detail:'你先忙手头的事，我会记着我们的约定。'};
   return null;
  }
 };
}
root.QimaiPetCopy={create};
})(typeof window==='undefined'?globalThis:window);
