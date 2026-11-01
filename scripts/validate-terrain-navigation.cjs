const debug = require("debug")("h1emu:scripts:validate-terrain-navigation");
// Paired regression: real Z1 navmesh, NPC movement and zombie FSM.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
process.env.DISABLE_PLUGINS = "true";
delete process.env.DISABLE_AI;
delete process.env.FAKE_NAVMESH;
const { NavManager } = require("../out/utils/recast");
const { BasicNpc } = require("../out/servers/ZoneServer2016/entities/basicnpc");
const { ZoneServer2016 } = require("../out/servers/ZoneServer2016/zoneserver");
const {
  createZombie
} = require("../out/servers/ZoneServer2016/jsms/zombie.jsm");
async function main() {
  const nav = new NavManager();
  await nav.loadNav();
  const terrain = nav.terrain;
  const surfaceHeight = (x, z) => {
    const terrainY = terrain.getHeight(x, z);
    const roadY = nav.roads?.getSample(x, z)?.height;
    return roadY == null
      ? terrainY
      : terrainY == null
        ? roadY
        : Math.max(terrainY, roadY);
  };
  const spawns = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/2016/zoneData/Z1_npcs.json"))
  ).flatMap((n) => n.instances.map((i) => i.position));
  let packets = 0,
    hits = 0,
    samples = 0,
    maxGroundError = 0,
    maxNavError = 0;
  // Only network/player-damage delivery and spatial registration are stubbed.
  const server = {
    navManager: nav,
    aiEnabled: true,
    _npcs: {},
    _characters: {},
    _vehicles: {},
    _modelsData: {},
    charactersRenderDistance: 100,
    interactionDistance: 4,
    pushToGridCell() {},
    explosiveManager: { addEntity() {} },
    sounds: [],
    aiTargetSpatialMap: new Map(),
    getClientsInRange: () => [],
    sendDataToAllWithSpawnedEntity(_e, _i, name, payload) {
      if (name === "PlayerUpdatePosition") {
        if (payload.positionUpdate.position) {
          assert([...payload.positionUpdate.position].every(Number.isFinite));
          assert(Number.isFinite(payload.positionUpdate.verticalSpeed));
        } else {
          assert.equal(payload.positionUpdate.verticalSpeed, undefined);
          assert.equal(payload.positionUpdate.horizontalSpeed, undefined);
        }
        packets++;
      }
    }
  };
  function sync() {
    const characters = server._characters;
    server._characters = {};
    ZoneServer2016.prototype.updatePathfindingPositions.call(server);
    server._characters = characters;
  }
  function simulate(start, target, grounded) {
    nav.terrain = grounded ? terrain : undefined;
    const npc = new BasicNpc(
      "z",
      1,
      9510,
      NavManager.navToGame(start),
      new Float32Array(4),
      server
    );
    // Identical test starts, independent of production's randomized spawn scatter.
    npc.navAgent.teleport(start);
    npc.state.position = nav.npcNavToGame(start);
    const origin = [...npc.state.position];
    server._npcs = { z: npc };
    const targetPosition = NavManager.navToGame(target);
    targetPosition[1] = surfaceHeight(target.x, target.z) ?? target.y;
    server._characters = {
      player: { state: { position: targetPosition }, isAlive: true }
    };
    const fsm = createZombie(npc, server);
    npc.fsm = fsm;
    fsm.targetCharacterId = "player";
    fsm.event("seePlayer");
    npc.applyDamage = () => {
      if (grounded) hits++;
    };
    const states = new Set();
    let minY = Infinity,
      maxY = -Infinity;
    // Production defaults: 60 Hz crowd, 200 ms FSM, 150 ms position sync.
    for (let tick = 0; tick < 3600; tick++) {
      if (tick % 12 === 0) {
        fsm.tick(0.2);
        states.add(fsm.state);
      }
      nav.crowd.update(1 / 60, 1 / 60, 1);
      if (tick % 9 === 0) {
        sync();
        if (grounded) {
          const p = npc.state.position,
            h = surfaceHeight(p[0], p[2]);
          assert.notEqual(h, null);
          maxGroundError = Math.max(maxGroundError, Math.abs(p[1] - h));
          maxNavError = Math.max(
            maxNavError,
            Math.abs(npc.navAgent.position().y - h)
          );
          minY = Math.min(minY, p[1]);
          maxY = Math.max(maxY, p[1]);
          samples++;
        }
      }
      if (tick > 1800 && states.has("attacking")) break;
    }
    const end = [...npc.state.position];
    const result = {
      origin,
      end,
      travelled: Math.hypot(end[0] - origin[0], end[2] - origin[2]),
      states: [...states],
      elevationRange: grounded ? maxY - minY : undefined
    };
    if (grounded) {
      npc.state.position[1] += 10;
      sync();
      assert(
        Math.abs(
          npc.state.position[1] -
            surfaceHeight(npc.state.position[0], npc.state.position[2])
        ) < 0.0001
      );
      npc.deathTime = 1;
      const deadPosition = npc.state.position;
      nav.crowd.update(1 / 60, 1 / 60, 1);
      sync();
      assert.equal(npc.state.position, deadPosition);
    }
    nav.crowd.removeAgent(npc.navAgent);
    server._npcs = {};
    server._characters = {};
    return result;
  }
  const results = [];
  let successfulRoutes = 0,
    baselineBlockedRoutes = 0,
    verticalRoutes = 0;
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    for (
      let attempt = 0;
      attempt < spawns.length && results.length < 24;
      attempt++
    ) {
      const p = spawns[(attempt * 67) % spawns.length];
      const nearest = nav.navMeshQuery.findNearestPoly(
        { x: p[0], y: p[1], z: p[2] },
        { halfExtents: { x: 10, y: 10, z: 10 } }
      );
      if (!nearest.success || !nearest.nearestRef) continue;
      const start = nearest.nearestPoint;
      let target = null;
      for (const [dx, dz] of [
        [20, 0],
        [0, 20],
        [-20, 0],
        [0, -20]
      ]) {
        const n = nav.navMeshQuery.findNearestPoly(
          { x: start.x + dx, y: start.y, z: start.z + dz },
          { halfExtents: { x: 2, y: 20, z: 2 } }
        );
        if (!n.success || !n.nearestRef) continue;
        const computed = nav.navMeshQuery.computePath(start, n.nearestPoint);
        if (!computed.success || !computed.path.length) continue;
        const end = computed.path.at(-1);
        if (Math.hypot(end.x - n.nearestPoint.x, end.z - n.nearestPoint.z) > 1)
          continue;
        target = n.nearestPoint;
        break;
      }
      if (!target) continue;
      const baseline = simulate(start, target, false),
        grounded = simulate(start, target, true);
      const baselineReached = baseline.states.includes("attacking"),
        reached = grounded.states.includes("attacking");
      assert(
        !baselineReached || reached,
        `Route ${results.length}: chase/attack regression ${JSON.stringify({ baseline, grounded })}`
      );
      if (reached) {
        assert(grounded.travelled > 5);
        successfulRoutes++;
      } else baselineBlockedRoutes++;
      if (grounded.elevationRange > 1) verticalRoutes++;
      results.push({ start, target, baseline, grounded });
    }
    assert.equal(results.length, 24);
    assert(successfulRoutes >= 12);
    assert(verticalRoutes > 0);
    assert(maxGroundError < 0.0001);
    assert(hits > 0);
    const roadChases = [];
    // Targeted regression cases only; production selection never uses coordinates.
    for (const [x, z] of [
      [-1822.24, -2234.6],
      [-1989.04, -2235.25]
    ]) {
      const road = nav.roads.getSample(x, z);
      assert(road);
      const start = nav.getClosestNavPointVec3(
        new Float32Array([x, terrain.getHeight(x, z), z])
      );
      const endX = x + 10;
      const target = nav.getClosestNavPointVec3(
        new Float32Array([endX, terrain.getHeight(endX, z), z])
      );
      const grounded = simulate(start, target, true);
      assert(
        grounded.states.includes("chase") &&
          grounded.states.includes("attacking"),
        `Road chase failed: ${JSON.stringify(grounded)}`
      );
      roadChases.push({ input: [x, z], road, grounded });
    }
    const summary = {
      roadChases: roadChases.length,
      routes: results.length,
      successfulRoutes,
      baselineBlockedRoutes,
      verticalRoutes,
      samples,
      packets,
      hits,
      maxGroundError,
      maxNavError
    };
    fs.writeFileSync(
      path.join(__dirname, "../terrain-navigation-validation.json"),
      JSON.stringify({ ...summary, results, roadChases }, null, 2)
    );
    console.log(JSON.stringify(summary));
  } finally {
    Math.random = random;
    nav.terrain = terrain;
    nav.crowd.destroy();
    nav.navMeshQuery.destroy();
    nav.tilecache.destroy();
    nav.navmesh.destroy();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
