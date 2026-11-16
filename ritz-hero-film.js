// Scroll seeks one paused video. No wheel/touch interception or ribbon state changes.
(()=>{'use strict';
 const section=document.querySelector('.hero-scroll');
 if(!section)return;
 const video=section.querySelector('video'),stage=section.querySelector('.hero-film');
 const copy=section.querySelector('.hero-copy'),hint=section.querySelector('.film-skip');
 const chapters=[...section.querySelectorAll('.film-chapter')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,target=0,ready=false,failed=false,requested=false,objectURL='',previousTick=0,position=0;
 const clamp=n=>Math.min(1,Math.max(0,n));
 const stopped=()=>reduced.matches||document.body.classList.contains('motion-paused');
 const ease=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 function seek(){
   if(!ready||stopped()||video.seeking||document.hidden)return;
   const seekTime=Math.round(target*30)/30;
   if(Math.abs(video.currentTime-seekTime)<1/60)return;
   // Coalesce scroll events while a frame decodes; seeked applies the newest target.
   try{video.currentTime=seekTime;section.dataset.targetTime=seekTime.toFixed(3);}catch(error){section.dataset.seekError=error.name;}
 }
 async function load(){
   if(requested||failed||stopped())return;
   requested=true;
   const source=matchMedia('(max-width: 700px) and (orientation: portrait)').matches?video.dataset.mobileSrc:video.dataset.desktopSrc;
   video.muted=true;
   try{
     // A complete local Blob is seekable even on preview servers without HTTP Range.
     // Every frame is independently decodable for responsive bidirectional scrubbing.
     const response=await fetch(source);
     if(!response.ok)throw new Error(`Film request failed: ${response.status}`);
     objectURL=URL.createObjectURL(await response.blob());
     video.src=objectURL;
     video.load();
   }catch(error){
     failed=true;section.dataset.filmError='load';schedule();
   }
 }
 function update(now){
   frame=0;load();
   const dt=Math.min(64,previousTick?now-previousTick:16.7);previousTick=now;
   const paused=stopped(),rect=section.getBoundingClientRect();
   const p=paused||!ready?0:clamp(-rect.top/Math.max(1,section.offsetHeight-stage.offsetHeight));
   // Damp scroll position so image and copy share a reversible chapter timeline.
   position=paused?0:position+(p-position)*(1-Math.exp(-dt/240));
   if(Math.abs(p-position)<.0001)position=p;
   const q=position,end=Math.max(0,(video.duration||0)-1/30),middle=Math.min(2.67,end);
   // Seven-second camera edit: planning -> installation detail -> finished room.
   // Give movement most of the scroll distance; finish on the completed room.
   let desired=0;
   if(q<.42)desired=middle*ease(.06,.42,q);
   else if(q<.50)desired=middle;
   else if(q<.90)desired=middle+(end-middle)*ease(.50,.90,q);
   else desired=end;
   target=paused?0:desired;
   const opacity=1-ease(.035,.085,q);
   // Copy enters after each camera arrival, and clears before the next move.
   const visibility=[ease(.40,.43,q)*(1-ease(.48,.53,q)),ease(.88,.92,q)];
   chapters.forEach((chapter,index)=>{
     const alpha=paused||!ready||Math.abs(video.currentTime-target)>.2?0:visibility[index];
     chapter.style.setProperty('--chapter-opacity',alpha.toFixed(4));
     chapter.style.setProperty('--chapter-y',`${14*(1-alpha)}px`);
     chapter.setAttribute('aria-hidden',String(alpha<.5));
   });
   section.style.setProperty('--film-copy',opacity.toFixed(4));
   section.style.setProperty('--film-copy-y',`${-20*(1-opacity)}px`);
   section.style.setProperty('--film-shade','1');
   section.style.setProperty('--film-progress',p.toFixed(4));
   section.dataset.progress=p.toFixed(4);
   section.dataset.phase=q<.06?'opening':q<.42?'advance-detail':q<.50?'detail':q<.90?'advance-space':'space';
   hint.textContent=paused||failed?'Discover our approach ↓':!ready?'Loading opening film…':q>.90?'Continue to our story ↓':'Scroll to explore ↓';
   copy.inert=opacity<.05;
   if(paused){video.pause();copy.inert=false;}else seek();
   if(ready&&!paused&&!document.hidden&&Math.abs(p-position)>=.0001)schedule();
 }
 function loaded(){
   if(!Number.isFinite(video.duration)||video.readyState<2)return;
   ready=true;section.classList.add('film-ready');schedule();
 }
 video.addEventListener('loadeddata',loaded);
 video.addEventListener('canplay',loaded);
 video.addEventListener('seeked',()=>{section.dataset.currentTime=video.currentTime.toFixed(3);schedule();});
 video.addEventListener('error',()=>{failed=true;ready=false;section.classList.remove('film-ready');section.dataset.filmError='true';schedule();});
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule);
 addEventListener('pageshow',schedule);
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',schedule);
 addEventListener('pagehide',event=>{if(!event.persisted&&objectURL)URL.revokeObjectURL(objectURL);});
 schedule();
})();
