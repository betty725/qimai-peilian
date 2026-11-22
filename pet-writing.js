/* Original seated body loop, reader-facing book, and a paper-contact pen grip. */
(function(root){
  'use strict';
  const FRAME_MS=120,FRAME_COUNT=16,CYCLE_MS=FRAME_MS*FRAME_COUNT,LINE_MS=2400,WRITING_MS=LINE_MS*3;
  const frameAt=ms=>Math.floor(((ms%CYCLE_MS)+CYCLE_MS)%CYCLE_MS/FRAME_MS);
  const smooth=t=>t*t*(3-2*t);
  // u runs from the writer's left to right; v runs away from the writer.
  // The page bottoms face Kanshan at upper left, not the viewer below.
  function paperPoint(u,v){
    const a=[124,239],b=[231,219],c=[274,257],d=[160,278];
    return a.map((n,i)=>n*(1-u)*(1-v)+b[i]*u*(1-v)+c[i]*u*v+d[i]*(1-u)*v);
  }
  function stroke(row,progress){return paperPoint(.14+.28*progress,.64-row*.15+.025*Math.sin(progress*Math.PI*22));}
  function writingPose(ms){
    const t=((ms%WRITING_MS)+WRITING_MS)%WRITING_MS,row=Math.floor(t/LINE_MS),phase=t%LINE_MS;
    const progress=Math.min(1,phase/1850),point=stroke(row,progress);
    let lift=0;
    if(phase>1950){
      const amount=(phase-1950)/450,s=smooth(amount),next=stroke((row+1)%3,0);
      point[0]+=(next[0]-point[0])*s;point[1]+=(next[1]-point[1])*s;
      lift=7*Math.sin(Math.PI*amount);point[1]-=lift;
    }
    const angle=-.44,grip=[point[0]+18*Math.sin(angle),point[1]-18*Math.cos(angle)];
    return {row,progress,point,grip,lift,contact:phase<=1950,angle};
  }
  function surface(){const c=root.document.createElement('canvas');c.width=c.height=320;return c;}
  function clearTypingArm(c){
    // Retarget only the old near-side arm. Reconstruct its covered torso from
    // adjacent pixels in this same frame; face, tail and feet are outside ROI.
    const pixels=c.getImageData(0,0,320,320),source=new Uint8ClampedArray(pixels.data);
    const light=(x,y)=>{const i=(y*320+x)*4;return source[i+3]>240&&Math.min(source[i],source[i+1],source[i+2])>150;};
    for(let y=211;y<271;y++){
      const core=[];
      for(let x=90;x<176;x++){
        const i=(y*320+x)*4;
        if((y>=230||x<121)&&source[i+3]>120&&Math.max(source[i],source[i+1],source[i+2])<100)core.push(x);
      }
      if(!core.length)continue;
      for(let x=Math.max(90,core[0]-2);x<=Math.min(175,core[core.length-1]+2);x++){
        if(!core.some(p=>Math.abs(x-p)<=2))continue;
        let left=x-1,right=x+1;
        while(left>=78&&!light(left,y))left--;
        while(right<=190&&!light(right,y))right++;
        const hasLeft=left>=78,hasRight=right<=190;
        if(!hasLeft&&!hasRight)continue;
        if(!hasLeft)left=right;if(!hasRight)right=left;
        const fraction=left===right?0:(x-left)/(right-left),at=(y*320+x)*4;
        for(let k=0;k<3;k++)pixels.data[at+k]=source[(y*320+left)*4+k]*(1-fraction)+source[(y*320+right)*4+k]*fraction;
      }
    }
    c.putImageData(pixels,0,0);
  }
  function compose(original,book){
    const result=surface(),c=result.getContext('2d');c.drawImage(original,0,0);
    clearTypingArm(c);
    c.save();c.globalCompositeOperation='destination-out';c.beginPath();
    c.moveTo(181,218);c.lineTo(284,218);c.lineTo(260,283);c.lineTo(161,287);
    c.lineTo(114,275);c.lineTo(114,265);c.lineTo(165,265);c.closePath();c.fill();c.restore();
    c.drawImage(book,111,209,177,84);
    return result;
  }
  function drawWriting(c,ms){
    const p=writingPose(ms);
    const line=(points,width,color)=>{c.beginPath();c.moveTo(...points[0]);for(const q of points.slice(1))c.lineTo(...q);c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.stroke();};
    const gradient=(x,y,ex,ey,a,b)=>{const g=c.createLinearGradient(x,y,ex,ey);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
    const oval=(x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();};
    // Ink terminates at the same point as the graphite tip while it touches paper.
    for(let row=0;row<=p.row;row++){
      const amount=row<p.row?1:p.progress;if(amount<=0)continue;
      const ink=[];for(let t=0;t<amount;t+=.008)ink.push(stroke(row,t));ink.push(stroke(row,amount));
      line(ink,1.05,'#65758b');
    }
    // Fixed-length segments flex at the elbow instead of stretching the arm.
    const cycle=((ms%CYCLE_MS)+CYCLE_MS)%CYCLE_MS/CYCLE_MS;
    const lean=(1-Math.cos(cycle*Math.PI*2))*.5;
    const shoulder=[101+6*lean,220+3*lean],wrist=p.grip;
    const dx=wrist[0]-shoulder[0],dy=wrist[1]-shoulder[1],distance=Math.hypot(dx,dy),upper=35,lower=52;
    const direction=Math.atan2(dy,dx),offset=Math.acos(Math.max(-1,Math.min(1,(upper*upper+distance*distance-lower*lower)/(2*upper*distance))));
    const elbows=[direction-offset,direction+offset].map(a=>[shoulder[0]+upper*Math.cos(a),shoulder[1]+upper*Math.sin(a)]);
    const elbow=elbows[0][1]>elbows[1][1]?elbows[0]:elbows[1];
    const armShade=gradient(shoulder[0]-4,shoulder[1],wrist[0]+2,wrist[1]+6,'#343b40','#151b1f');
    c.beginPath();c.moveTo(...shoulder);c.quadraticCurveTo(elbow[0],elbow[1]+5,...wrist);
    c.lineWidth=8;c.lineCap='round';c.strokeStyle=armShade;c.stroke();
    c.beginPath();c.moveTo(shoulder[0]-1,shoulder[1]);c.quadraticCurveTo(elbow[0]-1,elbow[1]+3,wrist[0]-1,wrist[1]-1);
    c.lineWidth=.9;c.strokeStyle='#4b5359';c.stroke();
    // Closed paw behind the shaft, with thumb and index curled around it.
    oval(wrist[0]-1,wrist[1],7.5,6,gradient(wrist[0]-7,wrist[1]-5,wrist[0]+5,wrist[1]+5,'#3d464b','#1e252a'));
    c.save();c.translate(...p.point);c.rotate(p.angle);
    c.fillStyle='#deb477';c.beginPath();c.moveTo(0,0);c.lineTo(-2.6,-8);c.lineTo(2.6,-8);c.closePath();c.fill();
    c.fillStyle='#303740';c.beginPath();c.moveTo(0,0);c.lineTo(-1,-3);c.lineTo(1,-3);c.closePath();c.fill();
    c.fillStyle=gradient(-2.6,-25,2.6,-25,'#f1cf85','#bd8d3d');c.fillRect(-2.6,-36,5.2,28);
    c.fillStyle='#7798b9';c.fillRect(-2.6,-40,5.2,4);line([[-1,-33],[-1,-9]],.7,'#ffe8b1');
    // The pen is visibly pinched, not balanced across an open typing palm.
    c.beginPath();c.moveTo(-6,-18);c.bezierCurveTo(-5,-23,2,-24,3,-19);c.lineWidth=4;c.lineCap='round';c.strokeStyle='#303a41';c.stroke();
    c.beginPath();c.moveTo(-5,-14);c.bezierCurveTo(-1,-11,5,-14,3,-18);c.lineWidth=4.2;c.strokeStyle='#263138';c.stroke();
    line([[-4,-21],[-1,-22]],.8,'#6b777e');line([[1,-14],[3,-16]],.8,'#5d6a72');
    c.restore();
  }
  function draw(canvas,frames,index,ms){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const ratio=Math.min(root.devicePixelRatio||1,2),w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);
    const size=Math.min(w,h),x=(w-size)/2,y=(h-size)/2;c.drawImage(frames[index],x,y,size,size);
    c.save();c.translate(x,y);c.scale(size/320,size/320);drawWriting(c,ms);c.restore();
  }
  function create(canvas){
    if(!canvas?.getContext?.('2d'))return {setActive(){},dispose(){}};
    let active=false,reduced=false,ready=false,frame=null,last=null,elapsed=0,disposed=false,failed=false,loaded=0;
    const images=[],frames=[];
    const stop=()=>{if(frame!==null)root.cancelAnimationFrame(frame);frame=null;last=null;};
    function paint(now){
      frame=null;if(disposed||!active||!ready||root.document.hidden){last=null;return;}
      if(last!==null&&!reduced)elapsed+=Math.min(250,Math.max(0,now-last));last=now;
      draw(canvas,frames,reduced?4:frameAt(elapsed),reduced?1000:elapsed);
      if(!reduced)frame=root.requestAnimationFrame(paint);
    }
    const start=()=>{if(frame===null&&active&&ready&&!root.document.hidden&&!disposed)paint(root.performance.now());};
    function completed(){
      if(disposed||failed||++loaded!==FRAME_COUNT+1)return;
      try{for(let i=0;i<FRAME_COUNT;i++)frames.push(compose(images[i],images[FRAME_COUNT]));}
      catch(_){failed=true;return;}
      ready=true;canvas.dataset.ready='true';start();
    }
    for(let i=0;i<=FRAME_COUNT;i++){
      const image=new root.Image();images.push(image);image.onload=completed;
      image.onerror=()=>{failed=true;ready=false;delete canvas.dataset.ready;stop();};
      image.src=i===FRAME_COUNT?'assets/pet-quiet/open-book-facing-pet.png':'assets/pet-quiet/typing-frames/'+String(i).padStart(2,'0')+'.png';
    }
    const visibility=()=>{if(root.document.hidden)stop();else start();};root.document.addEventListener('visibilitychange',visibility);
    const resize=typeof root.ResizeObserver==='function'?new root.ResizeObserver(()=>{if(active&&ready)draw(canvas,frames,reduced?4:frameAt(elapsed),reduced?1000:elapsed);}):null;
    resize?.observe(canvas);
    return {
      setActive(value,reduce=false){if(active===value&&reduced===reduce)return;active=value;reduced=reduce;stop();if(active)start();},
      dispose(){disposed=true;active=false;stop();resize?.disconnect();root.document.removeEventListener('visibilitychange',visibility);}
    };
  }
  root.QimaiPetWriting={create,frameAt,cycleMs:CYCLE_MS,writingPose,paperPoint,writingCycleMs:WRITING_MS};
})(typeof window==='undefined'?globalThis:window);
