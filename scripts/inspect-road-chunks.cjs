const debug = require("debug")("h1emu:scripts:inspect-road-chunks");
const fs=require('node:fs');
const {parseChunk}=require('./validate-terrain-chunks.cjs');
for(const name of ['Z1_-36_-32.cnk0','Z1_-36_28.cnk0']){
 const b=fs.readFileSync('../assets/'+name+'.dec'),c=parseChunk(b);
 const ho=c.indicesOffset-4-c.heightSamples*4;
 let hmin=Infinity,hmax=-Infinity,vmin=Infinity,vmax=-Infinity;
 for(let i=0;i<c.heightSamples;i++){const h=b.readInt16LE(ho+i*4);hmin=Math.min(hmin,h);hmax=Math.max(hmax,h);}
 const starts=[...new Set(c.batches.map(x=>x.vertexOffset))].sort((a,b)=>a-b);
 const scores=Array.from({length:8},()=>({n:0,same:0,error:0}));
 let slice=0;
 for(let i=0;i<c.nv;i++){
  while(slice+1<starts.length && i>=starts[slice+1])slice++;
  const o=c.verticesOffset+i*16,x=b.readInt16LE(o),z=b.readInt16LE(o+2),hn=b.readInt16LE(o+6);
  vmin=Math.min(vmin,hn);vmax=Math.max(vmax,hn);
  if(x<0||x>64||z<0||z>64)continue;
  const tx=c.tiles[slice].x-Math.min(...c.tiles.map(t=>t.x)),tz=c.tiles[slice].z-Math.min(...c.tiles.map(t=>t.z));
  const indices=[slice*4225+z*65+x,slice*4225+x*65+z,(tx*65+z)*260+tz*65+x,(tz*65+x)*260+tx*65+z,(tz*4+tx)*4225+z*65+x,(tz*4+tx)*4225+x*65+z,(tz*65+z)*260+tx*65+x,(tx*65+x)*260+tz*65+z];
  indices.forEach((idx,k)=>{const h=b.readInt16LE(ho+idx*4),s=scores[k];s.n++;s.same+=h===hn;s.error+=Math.abs(h-hn);});
 }
 debug(JSON.stringify({name,heightOffset:ho,heightRange:[hmin/32,hmax/32],vertexRange:[vmin/32,vmax/32],tiles:c.tiles,scores:scores.map(s=>({same:s.same/s.n,error:s.error/s.n/32}))}));
}
