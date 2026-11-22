/* Prefer device-supported capture settings; throttle analysis separately. */
(function(root){
  'use strict';
  async function open(isCurrent=()=>true){
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('请在支持摄像头的浏览器中单独打开本站 HTTPS 链接。');
    try{
      return await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:15}},audio:false});
    }catch(error){
      if(!isCurrent())throw Object.assign(new Error('开启请求已取消'),{name:'AbortError'});
      if(!['OverconstrainedError','ConstraintNotSatisfiedError'].includes(error.name))throw error;
      return navigator.mediaDevices.getUserMedia({video:true,audio:false});
    }
  }
  root.QimaiCameraAccess={open};
})(typeof window==='undefined'?globalThis:window);
