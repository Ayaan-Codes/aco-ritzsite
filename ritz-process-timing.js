// Scroll positions include a full reading interval after each release.
export const starts=[.19,.40,.61,.82];
export const ends=[.30,.51,.72,.93];
export const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export function chapterState(p,i){
 const enter=clamp((p-starts[i])/(ends[i]-starts[i]));
 const leave=i<3?clamp((p-starts[i+1])/(ends[i+1]-starts[i+1])):0;
 const travel=(1-smooth(enter))-smooth(leave);
 return {enter,leave,travel,bend:Math.sin(Math.PI*(enter<1?enter:leave)),
  text:smooth((enter-.55)/.45)*(1-smooth(leave/.4)),
  visible:p>=starts[i]&&(i===3||p<ends[i+1])};
}
