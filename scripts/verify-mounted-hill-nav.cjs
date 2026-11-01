// Real C8 road/navmesh regression, using the car pose and approach in live capture.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const debug = require("debug")("h1emu:mounted-nav-test");
const { NavManager } = require("../out/utils/recast");
const { ZoneServer2016 } = require("../out/servers/ZoneServer2016/zoneserver");
const {
  NpcCollisionManager
} = require("../out/servers/ZoneServer2016/managers/npccollisionmanager");
const { BasicNpc } = require("../out/servers/ZoneServer2016/entities/basicnpc");
const {
  createZombie
} = require("../out/servers/ZoneServer2016/jsms/zombie.jsm");
const { Factions } = require("../out/servers/ZoneServer2016/jsms/factions");
const profiles = require("../out/utils/npccollisionprofiles");
const { makeBox, sweepBoxes } = require("../out/utils/collisiongeometry");
async function main() {
  const nav = new NavManager();
  await nav.loadNav();
  const originalNow = Date.now,
    originalRandom = Math.random;
  let now = Date.now();
  Date.now = () => now;
  Math.random = () => 0.5;
  const originalPadding = profiles.npcNavigationClearance;
  const results = [];
  try {
    for (const [padding, localProjection] of [
      [originalPadding, false],
      [0.3, false],
      [originalPadding, true]
    ]) {
      profiles.npcNavigationClearance = padding;
      const car = {
        characterId: "car",
        actorModelId: 9301,
        isDestroyed: false,
        engineOn: false,
        vehicleId: 2,
        state: {
          position: new Float32Array([-2003.819946, 49.720001, -2235.25, 1]),
          rotation: new Float32Array([0, 0, 0, 1]),
          yaw: 1.54818094
        },
        positionUpdate: {
          orientation: 1.54818094,
          frontTilt: -0.22,
          sideTilt: 0.01
        },
        getDriver: () => ({ characterId: "prey" })
      };
      const player = {
        characterId: "prey",
        state: { position: new Float32Array([-2003.82, 50.52, -2235.25, 1]) },
        isAlive: true
      };
      const server = {
        navManager: nav,
        _npcs: {},
        _characters: { prey: player },
        _vehicles: { car },
        _modelsData: {},
        aiEnabled: true,
        pathfindingUpdateRate: 150,
        aiTargetSpatialMap: new Map(),
        sounds: [],
        explosiveManager: { addEntity() {} },
        pushToGridCell() {},
        getClientsInRange: () => [],
        getClientByCharId: () => ({ vehicle: { mountedVehicle: "car" } }),
        sendDataToAllWithSpawnedEntity: () => 0
      };
      const manager = new NpcCollisionManager(server);
      server.npcCollisionManager = manager;
      const start = { x: -2003.56, y: 49.3, z: -2244 };
      const npc = new BasicNpc(
        "zombie",
        1,
        9510,
        NavManager.navToGame(start),
        new Float32Array(4),
        server
      );
      npc.faction = Factions.ZOMBIE;
      npc.navAgent.teleport(start);
      npc.state.position = nav.npcNavToGame(start);
      npc.resetGroundMotion();
      server._npcs.zombie = npc;
      if (!localProjection)
        npc.getZombieNavTarget = (position) =>
          nav.getClosestNavPointVec3(position);
      const fsm = createZombie(npc, server);
      npc.fsm = fsm;
      fsm.targetCharacterId = "prey";
      fsm.event("seePlayer");
      let hits = 0;
      npc.applyDamage = () => hits++;
      const vehicleBody = makeBox(
        profiles.vehicleCollisionProfile(9301).bounds,
        car.state.position,
        car.positionUpdate.orientation,
        -0.22,
        0.01
      );
      for (let tick = 0; tick < 800; tick++) {
        now += 50;
        if (tick % 4 === 0) {
          fsm.tick(0.2);
          nav.updt();
        }
        if (tick % 3 === 0) {
          ZoneServer2016.prototype.updatePathfindingPositions.call(server);
          const body = makeBox(
            profiles.npcCollisionProfile(9510).bounds,
            npc.state.position,
            npc.state.yaw
          );
          assert.equal(
            sweepBoxes(body, body, vehicleBody),
            null,
            "zombie entered physical vehicle geometry"
          );
          const expectedY = nav.sampleNpcGround(npc.navAgent.position()).height;
          assert.ok(
            Math.abs(npc.state.position[1] - expectedY) < 0.0001,
            "ground position changed"
          );
        }
        if (hits) break;
      }
      const target = npc.getZombieTargetPosition("prey", player.state.position);
      const result = {
        padding,
        localProjection,
        hits,
        state: fsm.state,
        position: Array.from(npc.state.position),
        nav: npc.navAgent.position(),
        goal: npc.navAgent.target(),
        range: Math.hypot(
          ...[0, 1, 2].map((k) => npc.state.position[k] - target[k])
        ),
        blocked: manager.metrics.blockedNpcMoves
      };
      results.push(result);
      debug("RESULT %s", JSON.stringify(result));
      manager.remove("car");
      nav.crowd.removeAgent(npc.navAgent);
      if (player.navAgent) nav.crowd.removeAgent(player.navAgent);
      server._npcs = {};
      server._characters = {};
      server._vehicles = {};
      now += 1000;
      nav.updt();
    }
    assert.equal(
      results[0].hits,
      0,
      "baseline must reproduce the captured stuck chase"
    );
    assert.equal(
      results[1].hits,
      0,
      "padding-only change must remain a negative control"
    );
    assert.ok(
      results[2].hits > 0,
      "actual local-projection source must reach and attack with original clearance"
    );
    fs.writeFileSync(
      "/results/npc-mounted-hill-nav-validation.json",
      JSON.stringify(results, null, 2)
    );
  } finally {
    profiles.npcNavigationClearance = originalPadding;
    Date.now = originalNow;
    Math.random = originalRandom;
  }
}
main().catch((error) => {
  debug("FAILED %s", error.stack);
  process.exitCode = 1;
});
