/* One frame in flight: keep inference off the animation/UI thread where supported. */
(function(){
  'use strict';
  const config=window.QimaiTrackingConfig;
  const base=new URL('.',document.currentScript?.src||location.href);
  async function mainThread(){
    const vision=await import('./vendor/tasks-vision/vision_bundle.mjs');
    const files=await vision.FilesetResolver.forVisionTasks(new URL('./vendor/tasks-vision/wasm',base).href);
    // Compatibility mode keeps the lighter model on the UI thread.
    const detector=await vision.PoseLandmarker.createFromOptions(files,{
      baseOptions:{modelAssetPath:new URL('./vendor/tasks-vision/'+config.fallbackModel,base).href,delegate:'CPU'},
      runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:config.detectionConfidence,
      minPosePresenceConfidence:config.presenceConfidence,minTrackingConfidence:config.trackingConfidence
    });
    return{modelVariant:'lite',close:()=>detector.close(),async detectForVideo(video,timestamp){
      return{...await detector.detectForVideo(video,timestamp),modelVariant:'lite'};
    }};
  }

  async function workerThread(){
    const worker=new Worker(new URL('./pose-worker.js',base));
    const pending=new Map();let nextId=0,closed=false;
    function close(){
      if(closed)return;closed=true;worker.terminate();
      for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(Error('动作识别线程已关闭'));}
      pending.clear();
    }
    function request(data,transfer=[],timeout=2500){
      return new Promise((resolve,reject)=>{
        if(closed){reject(Error('动作识别线程不可用'));return;}
        const id=++nextId,timer=setTimeout(()=>{pending.delete(id);reject(Error('动作识别响应超时'));},timeout);
        pending.set(id,{resolve,reject,timer});
        try{worker.postMessage({...data,id},transfer);}
        catch(error){clearTimeout(timer);pending.delete(id);reject(error);}
      });
    }
    worker.onmessage=({data})=>{
      const entry=pending.get(data.id);if(!entry)return;
      pending.delete(data.id);clearTimeout(entry.timer);
      if(data.error)entry.reject(Error(data.error));else entry.resolve(data.result);
    };
    worker.onerror=event=>{event.preventDefault?.();close();};
    try{await request({type:'init'},[],20000);}catch(error){close();throw error;}
    return{close,async detectForVideo(video,timestamp){
      const frame=await createImageBitmap(video);
      try{return await request({type:'detect',frame,timestamp},[frame]);}
      finally{frame.close();}
    }};
  }
  async function create(){
    let worker=null,fallback=null,variant=null,latency=0;
    if(typeof Worker!=='undefined'&&typeof createImageBitmap==='function'&&typeof OffscreenCanvas!=='undefined'){
      try{worker=await workerThread();}catch(_){}
    }
    if(!worker)fallback=await mainThread();
    return{get backend(){return worker?'worker':'main';},get modelVariant(){return variant;},get intervalMs(){return Math.max(config.frameIntervalMs,Math.min(120,latency*.25));},async detectForVideo(video,timestamp){
      const begin=performance.now();let result;
      if(worker){
        try{result=await worker.detectForVideo(video,timestamp);}
        catch(_){worker.close();worker=null;fallback=await mainThread();}
      }
      if(!result)result=await fallback.detectForVideo(video,timestamp);
      variant=result.modelVariant||fallback?.modelVariant||'full';
      latency=latency*.75+(performance.now()-begin)*.25;
      return result;
    },close(){worker?.close();fallback?.close();}};
  }
  window.QimaiTracker={create};
})();
