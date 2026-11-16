(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(max-width:700px)');
let paused=reduced.matches, scheduled=0;
let storyProgress=null,swirlProgress=null,lastTime=0;
const clamp=n=>Math.min(1,Math.max(0,n));
const ease=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const menu=$('#site-menu'); const menuButton=$('.menu-toggle');
function openDialog(dialog){dialog.showModal();}
menuButton.addEventListener('click',()=>{openDialog(menu);menuButton.setAttribute('aria-expanded','true');});
menu.addEventListener('close',()=>menuButton.setAttribute('aria-expanded','false'));
$$('#site-menu a').forEach(a=>a.addEventListener('click',()=>menu.close()));
$$('[data-enquire]').forEach(b=>b.addEventListener('click',()=>openDialog($('#enquiry'))));
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#enquiry-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);$('#form-result').textContent=`Draft ready for ${data.get('name')}: ${data.get('type')} project. ${data.get('brief')} Nothing has been sent or stored.`;});
$$('.gallery-item').forEach(b=>b.addEventListener('click',()=>{const d=$('#lightbox');d.querySelector('img').src=b.dataset.image;d.querySelector('img').alt=b.dataset.caption;d.querySelector('p').textContent=b.dataset.caption;openDialog(d);}));
const cards=$$('.project-card');
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.filter;$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;cards.forEach(card=>{card.hidden=type!=='all'&&!card.dataset.sector.split(' ').includes(type);if(!card.hidden){count++;card.classList.add('visible');}});$('#filter-status').textContent=`${count} entries shown`; }));
const slides=$$('.featured-slide');let active=0;
function showSlide(index){active=(index+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('active',i===active);s.inert=i!==active;});$('#feature-count').textContent=`${String(active+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;}
$('#feature-prev')?.addEventListener('click',()=>showSlide(active-1));
$('#feature-next')?.addEventListener('click',()=>showSlide(active+1));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
$$('.reveal').forEach(el=>observer.observe(el));
const hero=$('.hero'),heroMedia=$('.hero-media'),floatImages=$$('[data-depth]'),feature=$('.featured-wrap'),gallery=$('.featured-gallery'),approach=$('.approach-scroll'),track=$('.approach-track');
const header=$('.site-header'),controls=$$('.site-header .control'),intro=$('.approach-intro'),pin=$('.approach-pin'),progressLine=$('.approach-progress i'),mosaic=$$('.design-mosaic img');
const swirl=$('.swirl-section'),swirlPin=$('.swirl-pin'),swirlCards=$$('.swirl-card'),swirlHeading=$('.swirl-heading');
const riseCards=$$('.rise-card'),riseShade=$('.rise-shade'),riseCopy=$('.rise-copy'),perspectiveCopy=$('.perspective-copy'),swirlFooter=$('.swirl-footer');
const processPanels=$$('.approach-panel');
const darkElements=[hero,intro,$('.design-panel'),$('.contact-section')].filter(Boolean);
// Fetch and decode the offscreen panels before they enter the moving strip.
[approach,swirl].filter(Boolean).forEach(section=>{const preload=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;section.querySelectorAll('img').forEach(img=>{img.loading='eager';img.decoding='async';img.decode?.().catch(()=>{});});preload.disconnect();},{rootMargin:'1200px 0px'});preload.observe(section);});
function update(time=performance.now()){
 scheduled=0;const vh=innerHeight,dt=Math.min(32,Math.max(1,time-lastTime||16));lastTime=time;
 // Complete layout reads before writing styles. The former mixed loop forced repeated layouts.
 const heroRect=hero?.getBoundingClientRect();
 const swirlRect=swirl?.getBoundingClientRect(),swirlH=swirlPin?.clientHeight||vh;
 const cardW=swirlCards[0]?.offsetWidth||0,cardH=swirlCards[0]?.offsetHeight||0;
 const floatRects=floatImages.map(img=>img.parentElement.getBoundingClientRect());
 const featureRect=feature?.getBoundingClientRect();
 const r=approach?.getBoundingClientRect();
 const stageHeight=pin?.clientHeight||vh,w=approach?.clientWidth||innerWidth;
 const travel=track?Math.max(0,track.scrollWidth-w):0;
 const headerRect=header.getBoundingClientRect(),controlRects=controls.map(el=>el.getBoundingClientRect());
 const darkRects=darkElements.filter(el=>el!==intro||Number(intro.style.opacity||1)>=.5).map(el=>el.getBoundingClientRect());
 const overDark=(x,y)=>darkRects.some(rect=>rect.top<y&&rect.bottom>y&&rect.left<x&&rect.right>x);
 const isMobile=mobile.matches;
 if(swirl&&!paused&&(swirlRect.bottom>0&&swirlRect.top<vh)){
   const target=clamp(-swirlRect.top/Math.max(1,swirlRect.height-swirlH));
   if(swirlProgress===null)swirlProgress=target;
   swirlProgress+=(target-swirlProgress)*(1-Math.exp(-dt/100));
   if(Math.abs(target-swirlProgress)<.00005)swirlProgress=target;
   const p=swirlProgress,width=swirlRect.width;
   // Non-WebGL fallback: independent cards travel up an open S path.
   // The WebGL strip hides these figures once all textures are ready.
   if(!swirl.classList.contains('ribbon-ready'))swirlCards.forEach((card,i)=>{
     const q=(p-.04)/.8*1.8-i*.105;
     const x=Math.sin(q*Math.PI*2-1.3)*width*.32;
     const y=(.95-q*1.8)*swirlH;
     card.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,0) rotate(${-12*Math.cos(q*Math.PI*2)}deg)`;
     card.style.opacity='1';
   });
   swirlHeading.style.transform=`translate3d(${-width*.24*ease(.03,.30,p)}px,0,0)`;
   swirlHeading.style.opacity=String(1-ease(.10,.23,p));
   const copyIn=ease(.54,.68,p);
   perspectiveCopy.style.opacity=String(copyIn);
   perspectiveCopy.style.transform='none';
   perspectiveCopy.inert=copyIn<.9;
   swirlFooter.style.opacity=String(1-ease(.18,.27,p));swirlFooter.inert=p>.26;
   dispatchEvent(new CustomEvent('ritz:ribbon',{detail:{progress:p,paused:false}}));
   swirl.dataset.progress=p.toFixed(3);
   if(swirlProgress!==target)requestUpdate();
 }

 // Only visible chapters need parallax updates while the story is moving.
 if(heroMedia&&(paused||heroRect.bottom>0)){const y=Math.max(0,-heroRect.top);heroMedia.style.transform=paused?'none':`translate3d(0,${Math.min(vh,y)*.18}px,0)`;}
 floatImages.forEach((img,i)=>{const rect=floatRects[i];if(!paused&&(rect.bottom<0||rect.top>vh))return;const offset=(vh/2-rect.top-rect.height/2)*Number(img.dataset.depth);img.style.transform=paused?'none':`translate3d(0,${Math.max(-65,Math.min(65,offset))}px,0)`;});
 if(feature&&gallery&&!isMobile&&(paused||(featureRect.bottom>0&&featureRect.top<vh))){const p=clamp((230-featureRect.top)/(vh*.7));gallery.style.width=paused?'100%':`${84+16*p}%`;gallery.style.height=paused?'100%':`${85+15*p}%`;}
 header.classList.toggle('is-hero',!!heroRect&&heroRect.bottom>headerRect.height+40);
 header.classList.toggle('is-dark',overDark(innerWidth/2,headerRect.top+headerRect.height/2));
 controls.forEach((el,i)=>{const rect=controlRects[i];el.classList.toggle('on-dark-surface',overDark(rect.left+rect.width/2,rect.top+rect.height/2));});
 if(approach&&track&&!paused&&r.bottom>0&&r.top<vh){
   const target=clamp(-r.top/Math.max(1,r.height-stageHeight));
   if(storyProgress===null)storyProgress=target;
   storyProgress+=(target-storyProgress)*(1-Math.exp(-dt/(isMobile?75:90)));
   if(Math.abs(target-storyProgress)<.00005)storyProgress=target;
   const p=storyProgress;
   // Twelve independent photographs pass upward; none expands to fill the stage.
   const drift=ease(0,.30,p);
   const positions=isMobile?
     [[-.35,-.32],[0,-.34],[.35,-.32],[-.50,-.02],[.50,.03],[-.34,.35],[0,.37],[.34,.36],[-.29,.64],[.27,.68],[-.35,.88],[.34,.93]]:
     [[-.41,-.25],[-.23,-.35],[.24,-.33],[.42,-.20],[-.43,.10],[.43,.14],[-.30,.37],[-.08,.40],[.17,.39],[.38,.40],[-.19,.72],[.24,.76]];
   riseCards.forEach((card,i)=>{
     const [x,y]=positions[i];
     const speed=.85+(i%4)*.13;
     card.style.transform=`translate(-50%,-50%) translate3d(${x*w}px,${(y-drift*speed)*stageHeight}px,0)`;
     card.style.opacity=String((i%3===1?.40:1)*(1-ease(.25,.31,p)));
   });
   riseShade.style.opacity='0';
   riseCopy.style.opacity=String(1-ease(.11,.20,p));
   riseCopy.style.transform=`translate3d(0,${-stageHeight*.08*drift}px,0)`;
   riseCopy.inert=p>.20;
   // Go directly from the photo field into the requested process chapters.
   track.style.transform='none';
   track.style.opacity=String(ease(.19,.20,p));
   const panelStarts=[.19,.40,.61,.82],panelEnds=[.30,.51,.72,.93];
   processPanels.forEach((panel,i)=>{
     const lift=ease(panelStarts[i],panelEnds[i],p);
     panel.style.transform=`translate3d(0,${(stageHeight*(1-lift)).toFixed(2)}px,0)`;
     panel.style.visibility=p<panelStarts[i]?'hidden':'visible';
     panel.inert=p<panelStarts[i]||(i<processPanels.length-1&&p>=panelEnds[i+1]);
   });
   intro.style.opacity=String(1-ease(.29,.31,p));
   intro.style.transform='none';
   progressLine.style.transform=`scaleX(${p})`;
   approach.dataset.progress=p.toFixed(3);
   approach.dataset.phase=p<.19?'moving-images':p<.40?'consultation':p<.61?'design-planning':p<.82?'execution-fitout':'handover-completion';
   dispatchEvent(new CustomEvent('ritz:process',{detail:{progress:p,paused:false}}));
   header.classList.toggle('is-story-hidden',p>.015&&r.bottom>85);
   if(storyProgress!==target)requestUpdate();
 }else{header.classList.remove('is-story-hidden');storyProgress=null;}
}
function requestUpdate(){if(!scheduled)scheduled=requestAnimationFrame(update);}
function setMotion(){processPanels.forEach(panel=>{panel.inert=false;panel.style.visibility='';});if(riseCopy)riseCopy.inert=false;swirlProgress=null;storyProgress=null;if(perspectiveCopy)perspectiveCopy.inert=!paused;if(swirlFooter)swirlFooter.inert=false;dispatchEvent(new CustomEvent('ritz:ribbon',{detail:{progress:Number(swirl?.dataset.progress||0),paused}}));document.body.classList.toggle('motion-paused',paused);document.body.classList.toggle('motion-enabled',!paused);dispatchEvent(new CustomEvent('ritz:process',{detail:{progress:Number(approach?.dataset.progress||0),paused}}));$('.motion-toggle').setAttribute('aria-pressed',String(paused));$('.motion-toggle').textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';requestUpdate();}
$('.motion-toggle').addEventListener('click',()=>{paused=!paused;setMotion();});
reduced.addEventListener('change',()=>{paused=reduced.matches;setMotion();});mobile.addEventListener('change',requestUpdate);
addEventListener('scroll',requestUpdate,{passive:true});addEventListener('resize',requestUpdate);
setMotion();requestUpdate();
})();
