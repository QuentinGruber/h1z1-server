// Container-local snapshots. Optional bounded packet experiment; auto-restores.
// No session/auth data, terrain edits or navigation changes.
const path = require("node:path");
const fs = require("node:fs");
const { WebSocket } = require(path.join(process.cwd(), "node_modules/ws"));
const debug = require(path.join(process.cwd(), "node_modules/debug"))("h1emu:npc-inspect");
async function main() {
  const targets = await (await fetch("http://127.0.0.1:9229/json/list")).json();
  const socket = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  let id = 0;
  const pending = new Map();
  socket.on("message", data => {
    const reply = JSON.parse(data);
    const request = pending.get(reply.id);
    if (request) { pending.delete(reply.id); reply.error ? request.reject(Error(reply.error.message)) : request.resolve(reply.result); }
  });
  const send = (method, params) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const frames = [];
  let packetProbe;
  let navProbe;
  try {
    const prototype = await send("Runtime.evaluate", {
      expression: "process.mainModule.require(process.cwd() + '/out/servers/ZoneServer2016/zoneserver').ZoneServer2016.prototype",
      objectGroup: "npc-inspect"
    });
    if (prototype.exceptionDetails) throw Error(prototype.exceptionDetails.text);
    const objects = await send("Runtime.queryObjects", { prototypeObjectId: prototype.result.objectId, objectGroup: "npc-inspect" });
    if (process.env.NPC_NAV_PROBE === "1") {
      navProbe=await send("Runtime.callFunctionOn",{
        objectId:objects.objects.objectId,
        functionDeclaration:`function(){
          const server=this.find(s=>s._npcs&&s.navManager);
          const client=Object.values(server._clients).find(c=>c.vehicle.mountedVehicle);
          if(!client) throw Error('No mounted player');
          const state=server.npcCollisionManager.vehicles.get(client.vehicle.mountedVehicle);
          if(!state) throw Error('No vehicle collision state');
          const previous=state.movedAt, sentinel=Date.now()+60000;
          server.npcCollisionManager.clearObstacle(state);
          state.movedAt=sentinel;
          function restore(){if(state.movedAt===sentinel)state.movedAt=previous;}
          const timer=setTimeout(restore,60000);timer.unref();
          return {restore(){restore();clearTimeout(timer);return true;}};
        }`
      });
      if(navProbe.exceptionDetails) throw Error(navProbe.exceptionDetails.text);
      debug("Temporary parked-car nav-obstacle experiment active; physical collision checks unchanged; auto-restores within 60s");
    }
    const mode = process.env.NPC_SLOPE_PROBE;
    if (mode) {
      if (!["tilt", "vertical", "both"].includes(mode)) throw Error("Invalid slope probe mode");
      packetProbe = await send("Runtime.callFunctionOn", {
        objectId: objects.objects.objectId,
        arguments: [{value:mode}],
        functionDeclaration: `function(mode) {
          const server=this.find(s=>s._npcs&&s.navManager);
          const original=server.sendDataToAllWithSpawnedEntity;
          let packets=0;
          function wrapped(dictionary,id,name,obj) {
            const npc=server._npcs[id];
            if(name==='PlayerUpdatePosition' && npc?.isAlive && npc.faction===2 && server._entityObservers.get(id)?.size) {
              const update={...obj.positionUpdate};
              if(mode==='tilt'||mode==='both') {
                if('frontTilt' in update) update.frontTilt=0;
                if('sideTilt' in update) update.sideTilt=0;
              }
              if((mode==='vertical'||mode==='both') && 'verticalSpeed' in update) update.verticalSpeed=0;
              packets++;
              return original.call(this,dictionary,id,name,{...obj,positionUpdate:update});
            }
            return original.apply(this,arguments);
          }
          function restore() { if(server.sendDataToAllWithSpawnedEntity===wrapped) server.sendDataToAllWithSpawnedEntity=original; }
          server.sendDataToAllWithSpawnedEntity=wrapped;
          const timer=setTimeout(restore,60000); timer.unref();
          return {restore(){restore();clearTimeout(timer);return packets;}};
        }`
      });
      if(packetProbe.exceptionDetails) throw Error(packetProbe.exceptionDetails.text);
      debug("Temporary %s packet experiment active; automatic restore within 60 seconds",mode);
    }
    for (let i = 0; i < Number(process.env.NPC_INSPECT_SECONDS || 5); i++) {
      const snapshot = await send("Runtime.callFunctionOn", {
        objectId: objects.objects.objectId,
        returnByValue: true,
        functionDeclaration: `function() {
          const server = this.find(s => s._npcs && s.navManager);
          if (!server) return {error: 'No running zone'};
          const safe = fn => { try { return fn(); } catch(e) { return {error: e.message}; } };
          const players = Object.values(server._clients).map(c => ({
            id: c.character.characterId, position: Array.from(c.character.state.position), mounted: c.vehicle.mountedVehicle,
            ground:server.navManager.sampleNpcGround({x:c.character.state.position[0],y:c.character.state.position[1],z:c.character.state.position[2]}),
            vehicle:c.vehicle.mountedVehicle && (()=>{const v=server._vehicles[c.vehicle.mountedVehicle];return v&&{engineOn:v.engineOn,position:Array.from(v.state.position),orientation:v.positionUpdate.orientation,pitch:v.positionUpdate.frontTilt,roll:v.positionUpdate.sideTilt};})()
          }));
          const npcs = Object.values(server._npcs).filter(n => n.isAlive && n.navAgent).map(n => ({
            npc:n, distance: Math.min(...players.map(p => Math.hypot(n.state.position[0]-p.position[0], n.state.position[2]-p.position[2])))
          })).filter(n => n.distance < 80).sort((a,b) => a.distance-b.distance).slice(0, 40).map(({npc:n, distance}) => ({
            id:n.characterId, model:n.actorModelId, class:n.constructor.name, faction:n.faction, distance, state:n.fsm?.state,
            targetId:n.fsm?.targetCharacterId, noise:n.fsm?.lastNoisePos && Array.from(n.fsm.lastNoisePos),
            position:Array.from(n.state.position), yaw:n.state.yaw, animation:n.currentAnimation,
            agent:n.navAgent.agentIndex, nav:safe(()=>n.navAgent.position()), velocity:safe(()=>n.navAgent.velocity()),
            target:safe(()=>n.navAgent.target()), corners:safe(()=>n.navAgent.corners()),
            effectiveTarget:safe(()=>{const p=players.find(p=>p.id===n.fsm?.targetCharacterId);return p&&Array.from(n.getZombieTargetPosition(p.id,new Float32Array(p.position)));}),
            projectedCandidates:safe(()=>{const p=players.find(p=>p.id===n.fsm?.targetCharacterId);if(!p)return;const t=n.getZombieTargetPosition(p.id,new Float32Array(p.position)),point={x:t[0],y:t[1],z:t[2]},q=server.navManager.navMeshQuery;return q.queryPolygons(point,{x:10,y:10,z:10}).polyRefs.map(ref=>{const r=q.closestPointOnPoly(ref,point);return {ref,point:r.closestPoint,success:r.success,distance:Math.hypot(r.closestPoint.x-point.x,r.closestPoint.z-point.z)};}).filter(r=>r.success).sort((a,b)=>a.distance-b.distance).slice(0,3);}),ground:server.navManager.sampleNpcGround(n.navAgent.position()), motion:n.groundMotionDiagnostics,
            recipients:n.lastMovementRecipients, packetTime:n.lastMovementPacketTime
          }));
          return {time:Date.now(), players, npcs, velocityReplication:process.mainModule.require(process.cwd()+'/out/servers/ZoneServer2016/entities/npc').Npc.prototype.goTo.toString().includes('locomotionSpeed')};
        }`
      });
      if (snapshot.exceptionDetails) throw Error(snapshot.exceptionDetails.text);
      frames.push(snapshot.result.value);
      debug(JSON.stringify({time:snapshot.result.value.time, players:snapshot.result.value.players, states:snapshot.result.value.npcs?.reduce((counts,n)=>{counts[n.state]=(counts[n.state]||0)+1;return counts;},{})}));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } finally {
    if(navProbe?.result?.objectId) {
      await send("Runtime.callFunctionOn",{objectId:navProbe.result.objectId,functionDeclaration:"function(){return this.restore();}",returnByValue:true});
      debug("Parked-car navigation experiment restored");
    }
    if(packetProbe?.result?.objectId) {
      const restored=await send("Runtime.callFunctionOn",{objectId:packetProbe.result.objectId,functionDeclaration:"function(){return this.restore();}",returnByValue:true});
      debug("Packet experiment restored; packets observed=%d",restored.result.value);
    }
    fs.writeFileSync(process.env.NPC_INSPECT_OUTPUT || "/tmp/npc-inspection.json", JSON.stringify(frames, null, 2));
    await send("Runtime.releaseObjectGroup", {objectGroup:"npc-inspect"});
    if (process.env.NPC_INSPECT_CLOSE === "1") {
      await send("Runtime.evaluate", {expression:"(() => {setTimeout(() => process.mainModule.require('node:inspector').close(),100).unref();return true;})()"});
    }
    socket.close();
  }
}
main().catch(error => { debug("Failed: %s", error.message); process.exitCode = 1; });

