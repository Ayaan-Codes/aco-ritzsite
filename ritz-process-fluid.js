import * as THREE from './assets/vendor/three/three.module.min.js';
import {starts,ends,clamp,smooth,chapterState} from './ritz-process-timing.js?v=fluid-process-v18';

const section=document.querySelector('#approach');
if(section){
 const pin=section.querySelector('.approach-pin'),track=section.querySelector('.approach-track');
 const panels=[...section.querySelectorAll('.approach-panel')],images=panels.map(p=>p.querySelector('figure img'));
 const canvas=document.createElement('canvas');canvas.className='process-fluid-canvas';canvas.setAttribute('aria-hidden','true');pin.append(canvas);
 section.classList.add('process-fluid');
 const colors=['#f5f6f7','#13213c','#f5f6f7','#e3ebf2'].map(c=>new THREE.Color(c));
 let renderer,meshes=[],ready=0,failed=false,paused=document.body.classList.contains('motion-paused');
 let progress=Number(section.dataset.progress||0),width=1,height=1;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-.5,.5,.5,-.5,.1,10);camera.position.z=2;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;}catch{failed=true;}
 function fallback(){failed=true;section.classList.remove('process-webgl');canvas.style.display='none';}
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
 const vertexShader=`
 varying vec2 vUv;
 uniform float bend;
 uniform float travel;
 void main(){
  vUv=uv;
  vec3 p=position;
  // A travelling waist deforms the photograph itself, not only its outline.
  float waist=exp(-pow((uv.y-(travel>0.0?.30:.70))*3.6,2.0));
  p.x*=1.0-bend*.40*waist;
  p.x+=bend*.065*sin(uv.y*3.14159)*sign(travel);
  p.y*=1.0+bend*.38;
  p.y-=travel*1.55;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
 }`;
 const fragmentShader=`
 uniform sampler2D photo;
 uniform vec2 crop;
 uniform float aspect;
 varying vec2 vUv;
 void main(){
  vec2 q=abs((vUv-.5)*vec2(aspect,1.0))-(vec2(aspect,1.0)*.5-vec2(.035));
  float dist=length(max(q,0.0))+min(max(q.x,q.y),0.0)-.035;
  float alpha=1.0-smoothstep(-.002,.002,dist);
  if(alpha<.01)discard;
  gl_FragColor=vec4(texture2D(photo,(vUv-.5)*crop+.5).rgb,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
 if(renderer){
  const loader=new THREE.TextureLoader();
  images.forEach((img,i)=>loader.load(img.getAttribute('src').replace('-1920.webp','-960.webp'),texture=>{
   if(failed){texture.dispose();return;}
   texture.colorSpace=THREE.SRGBColorSpace;
   const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:false,
    uniforms:{photo:{value:texture},bend:{value:0},travel:{value:0},crop:{value:new THREE.Vector2(1,1)},aspect:{value:1}}});
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,24,48),material);mesh.frustumCulled=false;mesh.renderOrder=i;mesh.userData.imageAspect=texture.image.width/texture.image.height;meshes[i]=mesh;scene.add(mesh);
   if(++ready===images.length){section.classList.add('process-webgl');layout();}
  },undefined,fallback));
 }
 function layout(){
  if(paused)return;
  const r=panels[0].querySelector('figure').getBoundingClientRect(),base=pin.getBoundingClientRect();
  width=r.width;height=r.height;
  canvas.style.left=`${r.left-base.left}px`;canvas.style.top=`${r.top-base.top}px`;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  if(renderer&&!failed){
   renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(width,height,false);
   meshes.forEach(mesh=>{const a=width/height,ia=mesh.userData.imageAspect;mesh.material.uniforms.aspect.value=a;mesh.material.uniforms.crop.value.set(Math.min(1,a/ia),Math.min(1,ia/a));});
  }
  draw();
 }
 function draw(){
  if(paused){
   panels.forEach(p=>{p.style.opacity='';p.style.transform='';p.style.visibility='';p.inert=false;p.querySelector('figure').style.transform='';p.querySelector('header').style.opacity='';p.querySelector(':scope > p').style.opacity='';});
   track.style.background='';return;
  }
  let color=new THREE.Color('#13213c');
  panels.forEach((panel,i)=>{
   const state=chapterState(progress,i);
   if(progress>=starts[i])color.lerp(colors[i],smooth((progress-starts[i])/(ends[i]-starts[i])));
   panel.style.transform='none';panel.style.opacity='1';panel.style.visibility=state.visible?'visible':'hidden';panel.inert=state.text<.5;
   panel.querySelector('header').style.opacity=String(state.text);panel.querySelector(':scope > p').style.opacity=String(state.text);
   // Native-image fallback if WebGL is unavailable. Text and all four steps still work.
   panel.querySelector('figure').style.transform=`translateY(${state.travel*155}%) scale(${1-state.bend*.15},${1+state.bend*.25})`;
   if(meshes[i]){meshes[i].visible=state.visible;meshes[i].material.uniforms.travel.value=state.travel;meshes[i].material.uniforms.bend.value=state.bend;}
  });
  track.style.background=`#${color.getHexString()}`;
  if(renderer&&!failed&&ready===images.length)renderer.render(scene,camera);
 }
 addEventListener('ritz:process',event=>{progress=event.detail.progress;const wasPaused=paused;paused=event.detail.paused;if(wasPaused&&!paused)layout();draw();});
 let resizeFrame=0;
 new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(layout);}).observe(pin);
 // Starting from a saved scroll position works even before the first wheel event.
 requestAnimationFrame(layout);
}
