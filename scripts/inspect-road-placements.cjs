const debug = require("debug")("h1emu:scripts:inspect-road-placements");
const fs=require('node:fs');
const b=fs.readFileSync('../Z1/Z1.zone');
if(b.readUInt32LE(4)!==4)throw Error('Expected the supplied ZONE v4');
let offset=b.readUInt32LE(24);
const count=b.readUInt32LE(offset);offset+=4;
const roads=[];
for(let i=0;i<count;i++){
 const end=b.indexOf(0,offset);if(end<offset)throw Error('Bad actor string');
 const actor=b.toString('utf8',offset,end);offset=end+1;
 const renderDistance=b.readFloatLE(offset),instances=b.readUInt32LE(offset+4);offset+=8;
 for(let j=0;j<instances;j++){
  const position=[0,4,8].map(k=>b.readFloatLE(offset+k));
  if(/road|bridge|highway|truckstop/i.test(actor))roads.push({actor,position,rotation:[16,20,24,28].map(k=>b.readFloatLE(offset+k)),scale:[32,36,40,44].map(k=>b.readFloatLE(offset+k)),id:b.readUInt32LE(offset+48),renderDistance});
  offset+=77;
 }
}
if(offset!==b.readUInt32LE(28))throw Error(`Object section length mismatch: ${offset}`);
const points=[[-1822.24,58.17,-2234.60],[1989.04,53.39,-2235.25]];
const report={objects:count,roadInstances:roads.length,points:points.map(input=>({input,nearestRoadInstances:roads.map(r=>({...r,distance:Math.hypot(input[0]-r.position[0],input[2]-r.position[2])})).sort((a,b)=>a.distance-b.distance).slice(0,5)}))};
debug(JSON.stringify(report,null,2));
fs.writeFileSync('road-placements-inspection.json',JSON.stringify(report,null,2));
