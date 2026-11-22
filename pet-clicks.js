/* Shared by WebKit's native drag surface and the browser card. */
(function(root){
  'use strict';
  function create({single,double,triple,delay=500,now=()=>performance.now(),schedule=setTimeout,clear=clearTimeout}){
    let count=0,last=-Infinity,lockedUntil=-Infinity,timer=null;
    function hold(){if(timer!==null)clear(timer);timer=null;}
    function cancel(){hold();count=0;last=-Infinity;lockedUntil=-Infinity;}
    function click(){
      const t=now();hold();
      if(t<lockedUntil)return;
      if(t-last>delay)count=0;
      last=t;count++;
      if(count===3){count=0;lockedUntil=t+delay;triple();return;}
      timer=schedule(()=>{const total=count;timer=null;count=0;if(total===2)double();else if(total===1)single();},delay);
    }
    return {click,hold,cancel};
  }
  root.QimaiPetClicks={create};
})(typeof window==='undefined'?globalThis:window);
