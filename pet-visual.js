/* Tracking confirms presence first; only changes between working poses wait. */
(function(root){
  'use strict';
  const working=state=>state==='screen'||state==='writing';
  function create(){
    let shown='idle',candidate='idle',since=0;
    return {update(state,now,{immediate=false}={}){
      // Generic desk presence keeps the current working pose. On first arrival,
      // reuse the quiet typing loop without claiming a more specific activity.
      const target=state==='desk'?(working(shown)?shown:'screen'):working(state)?state:state==='rest'||state==='away'?'sleep':'idle';
      if(target!==candidate){candidate=target;since=now;}
      // The upstream state already passed its live-frame confirmation window.
      // Do not leave a confirmed working user standing still for another 8 s.
      if(immediate||state==='rest'||(working(target)&&!working(shown))||now-since>=8000)shown=target;
      return shown;
    }};
  }
  function asset(state,reduced=false){
    if(state==='screen'||state==='writing')return 'assets/pet-quiet/'+(reduced?'typing-still.png':'typing.gif');
    return 'assets/pet-quiet/'+(state==='sleep'?'sleep.png':'stand.png');
  }
  root.QimaiPetVisual={create,asset};
})(typeof window==='undefined'?globalThis:window);
