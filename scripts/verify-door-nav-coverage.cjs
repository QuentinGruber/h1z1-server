// Read-only nav coverage comparison; all mutation is confined to this test process.
const fs=require('node:fs'),assert=require('node:assert/strict'),debug=require('debug')('h1emu:door-nav-coverage');
const {NavManager}=require('../out/utils/recast');
const {NpcCollisionManager}=require('../out/servers/ZoneServer2016/managers/npccollisionmanager');
const {vehicleCollisionProfile}=require('../out/utils/npccollisionprofiles');
const {makeBox}=require('../out/utils/collisiongeometry');
async function main(){
 const frame=JSON.parse(fs.readFileSync('/results/npc-live-end-clusters.json','utf8'))[0],v=frame.players[0].vehicle,nav=new NavManager();await nav.loadNav();
 const car={characterId:'car',actorModelId:9301,isDestroyed:false,state:{position:new Float32Array(v.position),rotation:new Float32Array([0,0,0,1])},positionUpdate:{orientation:v.orientation,frontTilt:v.pitch,sideTilt:v.roll}};
 const server={navManager:nav,_npcs:{},_characters:{},_vehicles:{car}},manager=new NpcCollisionManager(server);
 function sample(){const rows=[];for(let x=-3;x<=3;x++)for(let z=-6;z<=6;z+=.5){const point={x:v.position[0]+x,y:v.position[1],z:v.position[2]+z};let nearest=Infinity,best;for(const ref of nav.navMeshQuery.queryPolygons(point,{x:.3,y:10,z:.3}).polyRefs){const r=nav.navMeshQuery.closestPointOnPoly(ref,point);if(!r.success)continue;const d=Math.hypot(r.closestPoint.x-point.x,r.closestPoint.z-point.z);if(d<nearest){nearest=d;best=r.closestPoint;}}rows.push({x,z,nearest:Number.isFinite(nearest)?nearest:null,point:best,physicalGround:nav.sampleNpcGround(point)});}return rows;}
 const before=sample();manager.sync();nav.updt();manager.allowZombieVehicleApproach('car');manager.sync();nav.updt();const after=sample();
 assert.equal(manager.vehicles.get('car').obstacle,undefined,'vehicle carve must be absent');
 const result={vehicle:v,before,after};fs.writeFileSync('/results/npc-door-nav-coverage.json',JSON.stringify(result,null,2));
 for(const side of [-1,1]){const points=after.filter(p=>p.x===0&&p.z===side*2);debug('DOOR side=%d %s',side,JSON.stringify(points));}
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="760" viewBox="0 0 900 760"><rect width="900" height="760" fill="#f7f7f7"/><text x="30" y="32" font-family="sans-serif" font-size="20">C8 vehicle: base navmesh coverage beside the doors</text><text x="30" y="58" font-family="sans-serif" font-size="14">Green: polygon within 0.3 m. Red: no polygon within the standing-point search.</text>';
 for(const p of after)svg+=`<rect x="${450+p.x*50-24}" y="${390-p.z*50-12}" width="48" height="24" fill="${p.nearest!==null&&p.nearest<=.3?'#8ecb9b':'#eea4a4'}" stroke="#fff"/>`;
 const body=makeBox(vehicleCollisionProfile(9301).bounds,car.state.position,v.orientation,v.pitch,v.roll),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[body.center[0]+x*body.half[0]*body.axes[0][0]+z*body.half[2]*body.axes[2][0],body.center[2]+x*body.half[0]*body.axes[0][2]+z*body.half[2]*body.axes[2][2]]);
 svg+='<polygon points="'+corners.map(p=>`${450+(p[0]-v.position[0])*50},${390-(p[1]-v.position[2])*50}`).join(' ')+'" fill="#718096" fill-opacity=".65" stroke="#222" stroke-width="3"/>';
 for(const npc of frame.npcs)svg+=`<circle cx="${450+(npc.position[0]-v.position[0])*50}" cy="${390-(npc.position[2]-v.position[2])*50}" r="5" fill="#183e9f"/>`;
 svg+='<text x="30" y="720" font-family="sans-serif" font-size="14">Grey: vehicle body. Blue: captured zombies. No live navmesh or geometry was changed.</text></svg>';
 fs.writeFileSync('/results/npc-door-nav-coverage.svg',svg);
 debug('RESULT beforeDoor=%s afterDoor=%s',JSON.stringify(before.filter(p=>p.x===0&&Math.abs(p.z)===2)),JSON.stringify(after.filter(p=>p.x===0&&Math.abs(p.z)===2)));
}
main().catch(e=>{debug('FAILED %s',e.stack);process.exitCode=1;});
