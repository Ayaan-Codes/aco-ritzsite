import * as THREE from './assets/vendor/three/three.module.min.js';
import {ribbonLayout,ribbonVerticalOffset} from './ritz-ribbon-layout.js?v=mobile-scale70-v14';

// Every column of every photograph feeds through an open spatial path.
// No circular geometry or whole-group rotation is used.
const section=document.querySelector('.swirl-section');
const canvas=document.querySelector('.ribbon-canvas');
if(section&&canvas){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{console.info('Using the accessible photo fallback.');}
 if(renderer){
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,150);
  const meshes=[],loader=new THREE.TextureLoader(),images=[...section.querySelectorAll('.swirl-card img')];
  const panelWidth=5,panelPitch=5.08,panelHeight=3.5;
  const stripLength=images.length*panelPitch;
  let progress=Number(section.dataset.progress||0),paused=document.body.classList.contains('motion-paused');
  let ready=0,failed=false,path=[],pathLength=1,portraitLift=0;
  const count=1200,clamp=n=>Math.max(0,Math.min(1,n));
  function sample(distance){
   const scaled=clamp(distance/pathLength)*count,index=Math.min(count-1,Math.floor(scaled)),f=scaled-index;
   const a=path[index],b=path[index+1];
   const point=[a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,a.z+(b.z-a.z)*f];
   if(distance<0)point[1]+=distance;
   if(distance>pathLength)point[1]+=distance-pathLength;
   return point;
  }
  function resize(){
   const rect=canvas.parentElement.getBoundingClientRect();
   const layout=ribbonLayout(rect.width,rect.height);
   camera.aspect=layout.aspect;camera.position.z=24;
   camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(layout.cameraWidth/(48*camera.aspect)));
   camera.updateProjectionMatrix();
   portraitLift=layout.portraitLift;
   const controls=layout.controls.map(p=>new THREE.Vector3(...p));
   const curve=new THREE.CatmullRomCurve3(controls,false,'centripetal');
   curve.arcLengthDivisions=2400;
   pathLength=curve.getLength();path=curve.getSpacedPoints(count);
   renderer.setPixelRatio(Math.min(devicePixelRatio,camera.aspect<.8?1.25:1.5));
   renderer.setSize(rect.width,rect.height,false);draw();
  }
  function draw(){
   if(paused||failed||ready!==images.length||!path.length)return;
   scene.position.y=ribbonVerticalOffset(progress,portraitLift);
   const head=clamp((progress-.04)/.80)*(pathLength+stripLength);
   for(const mesh of meshes){
    const g=mesh.geometry,positions=g.attributes.position,flat=g.userData.flat;
    for(let j=0;j<positions.count;j++){
     const distance=head-g.userData.index*panelPitch+flat[j*3]-panelWidth/2;
     const [x,y,z]=sample(distance);
     const next=sample(distance+.06),dx=next[0]-x,dy=next[1]-y,dz=next[2]-z;
     // Give steep entering/exiting panels a little roll so their surface
     // never collapses into a line when the path turns vertically.
     const vertical=Math.abs(dy)/Math.max(.0001,Math.hypot(dx,dy,dz));
     const side=.7*clamp((vertical-.55)/.4),up=Math.sqrt(1-side*side);
     positions.setXYZ(j,x+side*flat[j*3+1],y+up*flat[j*3+1],z);
    }
    positions.needsUpdate=true;
   }
   renderer.render(scene,camera);
  }
  images.forEach((img,index)=>loader.load(img.getAttribute('src').replace('-1920.webp','-960.webp'),texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;
   const geometry=new THREE.PlaneGeometry(panelWidth,panelHeight,40,1);
   // The visible foreground travels right-to-left. Keep that face readable.
   const uv=geometry.attributes.uv;
   for(let j=0;j<uv.count;j++)uv.setX(j,1-uv.getX(j));
   geometry.userData={index,flat:geometry.attributes.position.array.slice()};
   const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
   mesh.frustumCulled=false;scene.add(mesh);meshes.push(mesh);ready++;
   if(ready===images.length&&!failed){section.classList.add('ribbon-ready');draw();}
  },undefined,()=>{failed=true;section.classList.remove('ribbon-ready');}));
  addEventListener('ritz:ribbon',event=>{progress=event.detail.progress;paused=event.detail.paused;draw();});
  addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();section.classList.remove('ribbon-ready');});
  canvas.addEventListener('webglcontextrestored',()=>{if(!failed)section.classList.add('ribbon-ready');resize();});
  resize();
 }
}
