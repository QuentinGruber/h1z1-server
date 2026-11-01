const debug = require("debug")("h1emu:scripts:verify-npc-corpse-placement");
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { NavManager } = require("../out/utils/recast");
const {
  NpcCollisionManager
} = require("../out/servers/ZoneServer2016/managers/npccollisionmanager");
const { makeBox, sweepBoxes } = require("../out/utils/collisiongeometry");
const { corpseBounds } = require("../out/utils/npccorpseplacement");
const { npcCollisionProfile } = require("../out/utils/npccollisionprofiles");
const {
  packPositionUpdateData,
  readPositionUpdateData
} = require("../out/packets/ClientProtocol/ClientProtocol_1080/shared");
const { scene } = require("../tests/helpers/npc-collision-scene.cjs");
async function main() {
  const nav = new NavManager();
  await nav.loadNav();
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  const results = [];
  try {
    for (const [model, label, x, z, foundation] of [
      [9510, "zombie-road", -1822.24, -2234.6, false],
      [9187, "bear-police-road", -1822.24, -2234.6, false],
      [9002, "deer-road", -1822.24, -2234.6, false],
      [9003, "wolf-road", -1822.24, -2234.6, false],
      [9510, "zombie-foundation", -1924.9956, -2268.831, true],
      [9510, "stopped-car-uncarve", -1924.9956, -2268.831, false]
    ]) {
      const s = scene([model]),
        npc = s.server._npcs.npc0;
      s.server.navManager = nav;
      const manager = new NpcCollisionManager(s.server);
      s.server.npcCollisionManager = manager;
      const sample = (x, z) => nav.sampleNpcGround({ x, y: 60, z });
      npc.state.position = new Float32Array([x, sample(x, z).height, z, 0]);
      npc.navAgent = nav.createAgent(
        npc.state.position,
        npcCollisionProfile(model)
      );
      const agentIndex = npc.navAgent.agentIndex;
      npc.navAgent.teleport(nav.getClosestNavPointVec3(npc.state.position));
      npc.state.position = nav.npcNavToGame(npc.navAgent.position());
      let obstacle;
      if (foundation) {
        obstacle = nav.addObstacle(
          new Float32Array([x, sample(x, z).height + 1, z + 4, 0]),
          { x: 1, y: 1, z: 1 }
        );
        now += 20;
        nav.updt();
      }
      s.vehicle.actorModelId = model === 9187 ? 9301 : 10060;
      const near = label === "stopped-car-uncarve",
        travel = near ? 2 : 8;
      if (near) npc.health = 1;
      const start = sample(x - travel, z),
        end = sample(x + travel, z);
      s.vehicle.state.position = new Float32Array([
        x - travel,
        start.height,
        z,
        0
      ]);
      s.vehicle.positionUpdate = {
        orientation: Math.PI / 2,
        frontTilt: -Math.atan(start.slopeX),
        sideTilt: Math.atan(start.slopeZ)
      };
      manager.sync();
      if (near) {
        now += 20;
        nav.updt();
        const old = nav.navMeshQuery.findNearestPoly(
          {
            x: npc.state.position[0],
            y: npc.state.position[1],
            z: npc.state.position[2]
          },
          { halfExtents: { x: 0.01, y: 1000, z: 0.01 } }
        );
        assert(
          !old.success || !old.nearestRef,
          "fixture did not reproduce stale source-car carve"
        );
      }
      now += near ? 200 : 500;
      assert(
        manager.moveVehicle(
          s.vehicle,
          new Float32Array([x + travel, end.height, z, 0]),
          Math.PI / 2,
          -Math.atan(end.slopeX),
          Math.atan(end.slopeZ),
          now
        )
      );
      assert(!npc.isAlive, `${label} was not killed`);
      assert(npc.vehicleImpactCorpse, `${label} lost death context`);
      assert.equal(npc.navAgent, undefined);
      assert(!nav.crowd.getAgents().some((a) => a.agentIndex === agentIndex));
      const body = makeBox(
        corpseBounds(npcCollisionProfile(model)),
        npc.state.position
      );
      const impact = npc.vehicleImpactCorpse.impact;
      for (const [a, b] of impact.segments)
        assert.equal(sweepBoxes(a, b, body), null, label + " sweep overlap");
      const ground = sample(npc.state.position[0], npc.state.position[2]);
      assert(ground.valid);
      assert(Math.abs(ground.height - npc.state.position[1]) < 0.0001);
      const packet = s.packets.find((p) => p.n === "PlayerUpdatePosition").p
        .positionUpdate;
      const decoded = readPositionUpdateData(
        packPositionUpdateData(packet),
        0
      ).value;
      for (const [a, b] of impact.segments)
        assert.equal(
          sweepBoxes(
            a,
            b,
            makeBox(corpseBounds(npcCollisionProfile(model)), decoded.position)
          ),
          null,
          label + " quantized overlap"
        );
      if (obstacle) {
        const b = makeBox(
          [-1, -1, -1, 1, 1, 1],
          [obstacle.position.x, obstacle.position.y, obstacle.position.z]
        );
        assert.equal(sweepBoxes(body, body, b), null);
      }
      results.push({
        label,
        original: Array.from(impact.original.slice(0, 3)),
        corpse: Array.from(npc.state.position.slice(0, 3)),
        surface: ground.surface,
        groundError: Math.abs(ground.height - npc.state.position[1]),
        agentRemoved: true,
        lootCalls: npc.loot,
        packetBeforeDeath:
          s.packets.findIndex((p) => p.n === "PlayerUpdatePosition") <
          s.packets.findIndex((p) => p.n === "Character.StartMultiStateDeath")
      });
      manager.remove(npc.characterId);
      manager.remove("vehicle");
      if (obstacle) nav.removeObstacle(obstacle);
      now += 20;
      nav.updt();
    }
    assert.equal(nav.obstacleCount, 0);
    console.log(JSON.stringify(results, null, 2));
    fs.writeFileSync(
      "npc-corpse-map-validation.json",
      JSON.stringify(results, null, 2)
    );
  } finally {
    Date.now = originalNow;
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
