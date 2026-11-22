(function () {
  'use strict';
  let ctx,master,timer,voiceEnabled=true,musicEnabled=false,volume=.18,index=0;
  let voiceNode=null,voiceGeneration=0,speaking=false;
  let status=()=>{};
  const clips=new Map();
  const notes=[220,261.63,293.66,329.63,392,440,392,329.63,293.66,261.63,220,196];
  const active=new Set();
  function ensure(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio) return false;
    if(!ctx){ctx=new Audio();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    return true;
  }
  function note(freq,length=3){
    if(!ctx) return;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.value=freq;
    const at=ctx.currentTime;
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.15,at+.08);
    gain.gain.exponentialRampToValueAtTime(.0001,at+length);
    osc.connect(gain).connect(master);
    osc.start();osc.stop(at+length+.05);
    active.add(osc);osc.onended=()=>{active.delete(osc);osc.disconnect();gain.disconnect();};
  }
  function music(on){
    clearInterval(timer);timer=null;
    active.forEach(osc=>{try{osc.stop();}catch(_){}});
    if(!on||!ensure()) return;
    const play=()=>{note(notes[index++%notes.length],3.5);};
    play();timer=setInterval(play,2600);
  }
  function restore(){speaking=false;if(master) master.gain.setTargetAtTime(volume,ctx.currentTime,.15);}
  function cancelVoice(){
    voiceGeneration++;
    if(voiceNode){voiceNode.onended=null;try{voiceNode.stop();}catch(_){}voiceNode.disconnect();voiceNode=null;}
    if('speechSynthesis' in window) speechSynthesis.cancel();
    restore();
  }
  function systemSpeech(text,generation){
    if(generation!==voiceGeneration||!voiceEnabled)return;
    if(!('speechSynthesis' in window)){restore();status('暂时无法播放声音，请跟随画面文字继续练习。');return;}
    status('正在使用设备语音播放，口令同步显示文字。');
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='zh-CN';utterance.rate=.88;utterance.volume=.9;
    const chinese=speechSynthesis.getVoices().find(voice=>voice.lang.startsWith('zh'));
    if(chinese) utterance.voice=chinese;
    utterance.onend=utterance.onerror=()=>{if(generation===voiceGeneration)restore();};
    speechSynthesis.speak(utterance);
  }
  function speak(text){
    if(!voiceEnabled) return false;
    cancelVoice();
    const generation=voiceGeneration,path=window.QimaiVoiceClips?.[text];
    speaking=true;
    if(path&&ensure()){
      if(master) master.gain.setTargetAtTime(volume*.25,ctx.currentTime,.1);
      if(!clips.has(path))clips.set(path,fetch(path).then(response=>{
        if(!response.ok)throw Error('口令音频读取失败');
        return response.arrayBuffer();
      }).then(bytes=>ctx.decodeAudioData(bytes)).catch(error=>{clips.delete(path);throw error;}));
      clips.get(path).then(buffer=>{
        if(generation!==voiceGeneration||!voiceEnabled)return;
        const source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);
        voiceNode=source;
        source.onended=()=>{source.disconnect();if(generation===voiceGeneration){voiceNode=null;restore();}};
        source.start();
        status('离线中文口令已播放，动作与呼吸提示同步显示文字。');
      }).catch(()=>systemSpeech(text,generation));
    }else{
      if(master) master.gain.setTargetAtTime(volume*.25,ctx.currentTime,.1);
      systemSpeech(text,generation);
    }
    return true;
  }
  function settings(value,playing=false){
    voiceEnabled=value.voice;musicEnabled=value.music;volume=value.volume;
    if(!voiceEnabled) cancelVoice();
    if(master) master.gain.setTargetAtTime(volume*(speaking ? .25 : 1),ctx.currentTime,.1);
    music(playing && musicEnabled);
  }
  function stop(){music(false);cancelVoice();}
  window.QimaiSound={ensure,speak,settings,stop,isSpeaking:()=>speaking,onStatus:fn=>{status=fn;},start:()=>music(musicEnabled),chime:()=>{if((voiceEnabled||musicEnabled)&&ensure()){note(523.25,1);note(659.25,1.5);}}};
})();
