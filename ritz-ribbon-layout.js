// Phones share the approved 1280x800 scene. Their tall viewport must not
// lengthen the spline, change its bends, or alter the speed of the photographs.
export function ribbonLayout(width,height){
 const aspect=width/height,portrait=width<=700&&aspect<1;
 const cameraWidth=portrait?(21.6/1.7):24;
 const pathHeight=portrait?15:24/aspect,h=Math.min(pathHeight,20);
 return {
  aspect,cameraWidth,
  portraitLift:portrait?Math.max(0,(cameraWidth/aspect-pathHeight)*.55):0,
  controls:[
   [-8,-.86*pathHeight,-6],[-8,-.43*h,-6],[-4,-.23*h,-5],
   [3,-.17*h,-4],[6.2,-.12*h,0],[5,-.02*h,5],
   [0,.07*h,6],[-5.8,.16*h,4],[-7,.21*h,-1],
   [-4,.26*h,-5],[3,.34*h,-6],[7,.60*h,-6],[9,pathHeight,-5]
  ]
 };
}

export function ribbonVerticalOffset(progress,lift){
 const smooth=(a,b)=>{const t=Math.max(0,Math.min(1,(progress-a)/(b-a)));return t*t*(3-2*t);};
 return lift*(-(1-smooth(.04,.22))+smooth(.60,.82));
}
