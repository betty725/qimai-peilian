/* CPU inference runs off the UI thread; full -> lite only on loading failure. */
importScripts('./tracking-config.js');
const config=self.QimaiTrackingConfig;
let model,variant;
self.onmessage=async({data})=>{
  const {id,type,frame,timestamp}=data;
  try{
    if(type==='init'){
      const vision=await import('./vendor/tasks-vision/vision_bundle.mjs');
      const files=await vision.FilesetResolver.forVisionTasks(new URL('./vendor/tasks-vision/wasm',self.location.href).href);
      for(const name of [config.model,config.fallbackModel]){
        try{
          model=await vision.PoseLandmarker.createFromOptions(files,{
            baseOptions:{modelAssetPath:new URL('./vendor/tasks-vision/'+name,self.location.href).href,delegate:'CPU'},
            runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:config.detectionConfidence,
            minPosePresenceConfidence:config.presenceConfidence,minTrackingConfidence:config.trackingConfidence
          });variant=name===config.model?'full':'lite';break;
        }catch(error){if(name===config.fallbackModel)throw error;}
      }
      self.postMessage({id,ready:true});
    }else if(type==='detect'){
      if(!model)throw Error('识别模型尚未就绪');
      const result=model.detectForVideo(frame,timestamp);
      self.postMessage({id,result:{landmarks:result.landmarks,worldLandmarks:result.worldLandmarks,modelVariant:variant}});
    }
  }catch(error){self.postMessage({id,error:error.message||String(error)});}
  finally{frame?.close();}
};
