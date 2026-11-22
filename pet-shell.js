(function(){
  'use strict';
  const $=id=>document.getElementById(id),bridge=window.webkit?.messageHandlers?.pet;
  let gesture;
  const ids=new Set(['home','collections','news']);
  function validLikes(value){try{const u=new URL(value);return value.length<=2048&&u.protocol==='https:'&&['zhihu.com','www.zhihu.com'].includes(u.hostname)&&!u.username&&!u.password&&(!u.port||u.port==='443')?u.href:'';}catch(_){return '';}}
  function readLikes(){try{return validLikes(bridge?(window.QimaiZhihuLikesURL||''):(localStorage.getItem('qimai_zhihu_likes')||''));}catch(_){return '';}}
  let likesURL=readLikes();
  function updateLikes(){ $('zhihuLikesHint').textContent=likesURL?'回看喜欢的内容':'首次设置专属入口';$('zhihuLikesURL').value=likesURL;}
  function configureLikes(){cancelClick();updateLikes();$('zhihuLikesMessage').textContent='';$('zhihuLikesSetup').hidden=false;}
  function storeLikes(value){likesURL=value;try{localStorage.setItem('qimai_zhihu_likes',value);}catch(_){}bridge?.postMessage({action:'zhihuSettings',likesURL:value});updateLikes();}
  $('zhihuLikes').onclick=()=>{if(!likesURL){configureLikes();return;}if(bridge)bridge.postMessage({action:'zhihu',destination:'likes'});else window.open(likesURL,'_blank','noopener,noreferrer');};
  $('zhihuManageLikes').onclick=configureLikes;
  $('zhihuLikesCancel').onclick=()=>{$('zhihuLikesSetup').hidden=true;};
  $('zhihuLikesSave').onclick=()=>{const value=validLikes($('zhihuLikesURL').value.trim());if(!value){$('zhihuLikesMessage').textContent='请填写知乎官网的 HTTPS 页面链接。';return;}storeLikes(value);$('zhihuLikesMessage').textContent='已保存。返回菜单后，点击「我的喜欢」即可打开。';};
  $('zhihuLikesClear').onclick=()=>{storeLikes('');$('zhihuLikesMessage').textContent='已清除，可以重新绑定。';};
  updateLikes();
  function cancelClick(){gesture?.cancel();}
  function changeView(view){
    document.body.classList.toggle('compact',view==='pet');
    document.body.classList.toggle('zhihu-mode',view==='orb'||view==='portal');
    $('zhihuDock').hidden=!['orb','portal'].includes(view);
    $('zhihuDock').className=view==='portal'?'is-open':'';$('zhihuLikesSetup').hidden=true;
    $('zhihuBall').hidden=view!=='orb';$('zhihuPanel').hidden=view!=='portal';
    bridge?.postMessage({action:'layout',view,expanded:view==='card'});
  }
  function setExpanded(expanded){
    cancelClick();$('options').hidden=true;
    $('petHint').textContent=expanded?'单击收回 · 双击练习 · 三击知乎':'单击陪伴 · 双击练习 · 三击知乎';
    $('scene').setAttribute('aria-label',expanded?'刘看山：单击收回，双击练习，三击知乎':'刘看山：单击陪伴，双击练习，三击知乎');
    changeView(expanded?'card':'pet');
  }
  function toggle(){setExpanded(document.body.classList.contains('compact'));}
  function openMain(){cancelClick();window.QimaiPetOpenMain();}
  function showOrb(){cancelClick();changeView('orb');}
  function showPortal(){cancelClick();changeView('portal');}
  gesture=QimaiPetClicks.create({single:toggle,double:openMain,triple:()=>changeView('orb'),delay:window.QimaiDoubleClickMs||500});
  function bindSurface(element,activate){
    let start=null,last=null,dragged=false;
    element.onpointerdown=e=>{
      if(e.button!==0)return;
      gesture.hold();dragged=false;start=last={x:e.screenX,y:e.screenY};
      element.setPointerCapture?.(e.pointerId);
    };
    element.onpointermove=e=>{
      if(!start)return;
      if(Math.hypot(e.screenX-start.x,e.screenY-start.y)>5)dragged=true;
      if(dragged){
        cancelClick();e.preventDefault();
        bridge?.postMessage({action:'move',dx:e.screenX-last.x,dy:e.screenY-last.y});
      }
      last={x:e.screenX,y:e.screenY};
    };
    element.onpointerup=e=>{if(dragged)e.preventDefault();start=null;if(element.hasPointerCapture?.(e.pointerId))element.releasePointerCapture(e.pointerId);};
    element.onpointercancel=()=>{start=null;dragged=true;cancelClick();};
    element.onclick=e=>{if(dragged){dragged=false;e.preventDefault();return;}activate();};
  }
  bindSurface($('scene'),()=>gesture.click());
  bindSurface($('zhihuBall'),showPortal);
  $('scene').ondblclick=e=>e.preventDefault();
  $('scene').onkeydown=e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();if(e.shiftKey)showOrb();else if(e.ctrlKey||e.metaKey)openMain();else toggle();}
  };
  $('collapse').onclick=()=>setExpanded(false);
  document.querySelector('.bubble').onclick=()=>{if(document.body.classList.contains('compact'))setExpanded(true);};
  $('zhihuFold').onclick=showOrb;
  $('zhihuReturn').onclick=()=>setExpanded(false);
  $('zhihuOrbBack').onclick=()=>setExpanded(false);
  for(const link of document.querySelectorAll('[data-zhihu]'))link.onclick=e=>{
    if(bridge){e.preventDefault();const destination=link.dataset.zhihu;if(ids.has(destination))bridge.postMessage({action:'zhihu',destination});}
  };
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.body.classList.contains('zhihu-mode')){
      e.preventDefault();if(!$('zhihuLikesSetup').hidden){$('zhihuLikesSetup').hidden=true;return;}if(!$('zhihuPanel').hidden)showOrb();else setExpanded(false);
    }
  });
  window.QimaiPetUI={setExpanded,openMain,showOrb,showPortal,click:()=>gesture.click(),holdClick:()=>gesture.hold(),cancelClicks:cancelClick};
  window.addEventListener('pagehide',cancelClick);
  setExpanded(false);
})();
