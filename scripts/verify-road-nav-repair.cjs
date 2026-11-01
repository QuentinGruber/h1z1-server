// Reproduce the captured C8 crowd using production FSM, map and collision code.
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const debug = require("debug")("h1emu:vehicle-crowd-test");
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
const {
  npcCollisionProfile,
  vehicleCollisionProfile
} = require("../out/utils/npccollisionprofiles");
const { makeBox, sweepBoxes } = require("../out/utils/collisiongeometry");
async function main() {
  const frame = JSON.parse(
    fs.readFileSync("/results/npc-live-end-clusters.json", "utf8")
  )[0];
  const prey = frame.players[0];
  let nav;
  const realNow = Date.now,
    realRandom = Math.random;
  let now = Date.now();
  Date.now = () => now;
  Math.random = () => 0.5;
  const results = [];
  try {
    for (const mode of ["baseline", "fixed"]) {
      nav = new NavManager();
      await nav.loadNav();
      if (mode === "baseline") {
        const R = require("recast-navigation"),
          {
            createDefaultTileCacheMeshProcess
          } = require("recast-navigation/generators");
        nav.crowd.destroy();
        nav.navMeshQuery.destroy();
        nav.tilecache.destroy();
        nav.navmesh.destroy();
        nav.roadTileCache?.destroy();
        nav.roadTileCache = undefined;
        nav.roadPatchTile = undefined;
        nav.roadObstacles = new WeakMap();
        const mesh = R.importNavMesh(
          new Uint8Array(
            Buffer.concat(
              [0, 1, 2].map((n) =>
                fs.readFileSync(`data/2016/navData/z1_${n}.bin`)
              )
            )
          )
        ).navMesh;
        nav.navmesh = mesh;
        nav.tilecache = R.importTileCache(
          new Uint8Array(
            Buffer.concat(
              [0, 1].map((n) =>
                fs.readFileSync(`data/2016/navData/z1_cache_${n}.bin`)
              )
            )
          ),
          createDefaultTileCacheMeshProcess()
        ).tileCache;
        nav.navMeshQuery = new R.NavMeshQuery(mesh);
        nav.crowd = new R.Crowd(mesh, { maxAgents: 2000, maxAgentRadius: 2 });
      }
      const car = {
        characterId: "car",
        actorModelId: 9301,
        isDestroyed: false,
        engineOn: false,
        vehicleId: 2,
        state: {
          position: new Float32Array(prey.vehicle.position),
          rotation: new Float32Array([0, 0, 0, 1])
        },
        positionUpdate: {
          orientation: prey.vehicle.orientation,
          frontTilt: prey.vehicle.pitch,
          sideTilt: prey.vehicle.roll
        },
        getDriver: () => ({ characterId: "prey" })
      };
      const player = {
        characterId: "prey",
        state: { position: new Float32Array(prey.position) },
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

      manager.sync();
      now += 1000;
      nav.updt();
      assert.ok(
        manager.vehicles.get("car").obstacle,
        "baseline must begin with parked exclusion"
      );
      manager.allowZombieVehicleApproach("car");
      manager.sync();
      nav.updt();
      const before = JSON.stringify(car);
      const group = frame.npcs
        .filter((n) => n.class !== "Gasser")
        .slice(0, 40)
        .map((captured, i) => {
          const npc = new BasicNpc(
            "z" + i,
            i + 1,
            9510,
            new Float32Array(captured.position),
            new Float32Array(4),
            server
          );
          npc.faction = Factions.ZOMBIE;

          npc.state.yaw = captured.yaw;
          const start =
            mode === "fixed"
              ? nav.getClosestNavPointVec3(new Float32Array(captured.position))
              : {
                  x: captured.position[0],
                  y: captured.nav.y,
                  z: captured.position[2]
                };
          assert.ok(
            Math.hypot(
              start.x - captured.position[0],
              start.z - captured.position[2]
            ) < 0.05,
            "repair must not teleport NPC horizontally"
          );
          npc.navAgent.teleport(start);
          npc.state.position = nav.npcNavToGame(start);
          manager.constrain(npc, start);
          npc.resetGroundMotion();
          server._npcs[npc.characterId] = npc;
          npc.fsm = createZombie(npc, server);
          npc.fsm.targetCharacterId = "prey";
          npc.fsm.event("seePlayer");
          let hits = 0;
          npc.applyDamage = () => hits++;
          return {
            npc,
            hits: () => hits,
            travel: 0,
            last: npc.state.position.slice()
          };
        });
      ZoneServer2016.prototype.updatePathfindingPositions.call(server);
      const carBody = makeBox(
        vehicleCollisionProfile(9301).bounds,
        car.state.position,
        car.positionUpdate.orientation,
        car.positionUpdate.frontTilt,
        car.positionUpdate.sideTilt
      );
      for (let tick = 0; tick < 1200; tick++) {
        now += 50;
        if (tick % 4 === 0) {
          for (const row of group) row.npc.fsm.tick(0.2);
          nav.updt();
        }
        if (tick % 3 === 0) {
          ZoneServer2016.prototype.updatePathfindingPositions.call(server);
          for (const row of group) {
            const p = row.npc.state.position;
            row.travel += Math.hypot(p[0] - row.last[0], p[2] - row.last[2]);
            row.last = p.slice();
            const box = makeBox(
              npcCollisionProfile(9510).bounds,
              p,
              row.npc.state.yaw
            );
            assert.equal(
              sweepBoxes(box, box, carBody),
              null,
              "physical vehicle penetration " +
                row.npc.characterId +
                " tick " +
                tick +
                " position " +
                Array.from(p) +
                " state " +
                row.npc.fsm.state +
                " approach " +
                row.npc.getZombieVehicleApproachDistance("prey", 2)
            );
            assert.ok(
              Math.abs(
                p[1] - nav.sampleNpcGround(row.npc.navAgent.position()).height
              ) < 0.0001,
              "ground changed"
            );
          }
        }
      }
      assert.equal(
        JSON.stringify(car),
        before,
        "vehicle geometry/pose changed"
      );
      if (mode === "fixed")
        assert.ok(
          manager.vehicles.get("car").markers.length > 0,
          "avoidance markers must remain"
        );
      const rows = group.map(({ npc, hits, travel }) => ({
        id: npc.characterId,
        hits: hits(),
        state: npc.fsm.state,
        position: Array.from(npc.state.position),
        goal: npc.navAgent.target(),
        travel,
        range: Math.hypot(
          ...[0, 1, 2].map(
            (k) =>
              npc.state.position[k] -
              npc.getZombieTargetPosition("prey", player.state.position)[k]
          )
        )
      }));
      const result = {
        mode,
        attackers: rows.filter((r) => r.hits > 0).length,
        total: group.length,
        blocked: manager.metrics.blockedNpcMoves,
        doorArea: rows.filter((row) => {
          const dx = row.position[0] - car.state.position[0],
            dz = row.position[2] - car.state.position[2];
          return (
            Math.abs(
              dx * Math.sin(car.positionUpdate.orientation) +
                dz * Math.cos(car.positionUpdate.orientation)
            ) < 2.7
          );
        }).length,
        rows
      };
      results.push(result);
      debug("RESULT %s", JSON.stringify(result));
      if (mode === "fixed") {
        assert.equal(
          manager.vehicles.get("car").obstacle,
          undefined,
          "active pursuit must keep shell reachable"
        );
        now += 1100;
        manager.sync();
        nav.updt();
        assert.ok(
          manager.vehicles.get("car").obstacle,
          "parked exclusion must return after pursuit expires"
        );
      }
      manager.remove("car");
      for (const row of group) nav.crowd.removeAgent(row.npc.navAgent);
      if (player.navAgent) nav.crowd.removeAgent(player.navAgent);
      now += 1000;
      nav.updt();
    }
    assert.ok(results[0].attackers > 0, "baseline must reproduce attacks");
    const gap = (result) => {
      const values = result.rows
        .filter((r) => r.hits > 0)
        .map((r) => r.range)
        .sort((a, b) => a - b);
      return values[Math.floor(values.length / 2)];
    };
    assert.ok(
      results[1].doorArea >= results[0].doorArea + 4,
      "repaired navigation must allow a door-side surround"
    );
    fs.writeFileSync(
      "/results/npc-road-nav-repair-validation.json",
      JSON.stringify(results, null, 2)
    );
  } finally {
    Date.now = realNow;
    Math.random = realRandom;
  }
}
main().catch((error) => {
  debug("FAILED %s", error.stack);
  process.exitCode = 1;
});
