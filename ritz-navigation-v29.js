// Keep section navigation within the current page, including review query strings.
(()=>{
 const samePage=url=>url.origin===location.origin&&url.pathname===location.pathname;
 document.querySelectorAll('a[href*="#"]').forEach(link=>link.addEventListener('click',event=>{
   const url=new URL(link.href);
   if(!samePage(url)||!url.hash)return;
   const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));
   if(!target)return;
   event.preventDefault();
   history.pushState(null,'',location.pathname+location.search+url.hash);
   target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
 }));
 // Keep direct links aligned as video decoding and fonts change preceding layout.
 const initialHash=location.hash,hero=document.querySelector('.hero-scroll');
 if(!initialHash||initialHash==='#top'||!hero)return;
 let interacted=false;
 ['wheel','touchstart','keydown','pointerdown'].forEach(type=>addEventListener(type,()=>{interacted=true;},{once:true,passive:true}));
 const align=()=>{if(!interacted)document.getElementById(initialHash.slice(1))?.scrollIntoView({behavior:'instant',block:'start'});};
 document.fonts.ready.then(align);
 addEventListener('pageshow',()=>requestAnimationFrame(align),{once:true});
 addEventListener('load',()=>requestAnimationFrame(align),{once:true});
 const layoutObserver=new ResizeObserver(()=>{
   if(interacted){layoutObserver.disconnect();return;}
   requestAnimationFrame(align);
 });
 document.querySelectorAll('.hero-scroll,.swirl-section').forEach(section=>layoutObserver.observe(section));
 const observer=new MutationObserver(()=>{if(hero.classList.contains('film-ready')){align();observer.disconnect();}});
 observer.observe(hero,{attributes:true,attributeFilter:['class']});
})();
