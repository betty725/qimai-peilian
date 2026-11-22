/* Engineering defaults, not learned weights. No labelled user dataset has been used. */
(function(root){
  'use strict';
  root.QimaiTrackingConfig=Object.freeze({
    version:'verification-1',
    model:'pose_landmarker_full.task',fallbackModel:'pose_landmarker_lite.task',
    detectionConfidence:.35,presenceConfidence:.35,trackingConfidence:.5,
    visibility:.4,landmarkPresence:.5,
    frameIntervalMs:50,holdMs:1200,graceMs:450,staleMs:900,
    smoothing:Object.freeze({stillMs:85,movingMs:25,speedScale:3.5,resetMs:450}),
    provenance:'manual-engineering-defaults; pretrained MediaPipe; no secondary training'
  });
})(typeof window==='undefined'?self:window);
