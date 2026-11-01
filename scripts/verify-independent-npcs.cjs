const debug = require("debug")("h1emu:scripts:verify-independent-npcs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { NavManager } = require("../out/utils/recast");
const { TerrainHeight } = require("../out/utils/terrainheight");
const { RoadSurfaces } = require("../out/utils/roadsurfaces");
const { Npc } = require("../out/servers/ZoneServer2016/entities/npc");
const { H1Z1Protocol } = require("../out/protocols/h1z1protocol");
const {
  readUnsignedIntWith2bitLengthValue,
  readPositionUpdateData
} = require("../out/packets/ClientProtocol/ClientProtocol_1080/shared");
const nav = new NavManager();
nav.terrain = new TerrainHeight("data/2016/terrainData");
nav.roads = new RoadSurfaces("data/2016/roadSurfaces.json.gz");
// Find an actual horizontal terrain triangle near the supplied high-ground point.
let flat;
for (let x = 1900; x <= 2050 && !flat; x += 2) {
  for (let z = -2300; z <= -2150; z += 2) {
    const sample = nav.terrain.getSurface(x, z);
    if (
      sample &&
      sample.slopeX === 0 &&
      sample.slopeZ === 0 &&
      !nav.roads.getSample(x, z)
    ) {
      flat = { x, z, height: sample.height };
      break;
    }
  }
}
assert(flat, "No real flat-ground test fixture found");
const protocol = new H1Z1Protocol("ClientProtocol_1080");
const realNow = Date.now;
let clock = realNow();
Date.now = () => clock;
const startTime = clock;
function run(roles) {
  clock = startTime;
  const packets = [],
    retained = [],
    snapshots = [],
    npcs = [];
  for (const role of roles) {
    const id = ["uphill", "downhill", "stationary"].indexOf(role) + 1;
    const x0 = role === "uphill" ? -1810 : role === "downhill" ? -1840 : flat.x;
    const z = role === "stationary" ? flat.z : -2234.6;
    const npc = Object.create(Npc.prototype);
    Object.assign(npc, {
      characterId: role,
      transientId: id,
      lookAtTarget: null,
      state: { position: nav.npcNavToGame({ x: x0, y: 0, z }), yaw: 0 },
      navAgent: {
        velocity: () => ({
          x: role === "stationary" ? 0 : role === "uphill" ? -2 : 2,
          y: 0,
          z: 0
        })
      },
      server: {
        navManager: nav,
        pathfindingUpdateRate: 150,
        _npcs: {},
        sendDataToAllWithSpawnedEntity(_e, _id, _name, payload) {
          const buffer = protocol.pack("PlayerUpdatePosition", payload);
          const transient = readUnsignedIntWith2bitLengthValue(buffer, 1);
          const decoded = readPositionUpdateData(
            buffer,
            1 + transient.length
          ).value;
          assert.equal(transient.value, id);
          assert(
            Math.abs(decoded.position[1] - npc.state.position[1]) <= 0.011
          );
          retained.push({ buffer, hex: buffer.toString("hex") });
          packets.push({
            role,
            time: payload.positionUpdate.sequenceTime,
            hex: buffer.toString("hex")
          });
          return 1;
        }
      }
    });
    npc.resetGroundMotion();
    npcs.push({ npc, role, x0, z });
  }
  for (let tick = 1; tick <= 100; tick++) {
    clock += [150, 200, 100, 300][tick % 4];
    for (const { npc, role, x0, z } of npcs) {
      const x =
        x0 +
        (role === "stationary" ? 0 : role === "uphill" ? -0.3 : 0.3) * tick;
      const before = [...npc.state.position];
      const navPoint = { x, y: nav.terrain.getHeight(x, z), z };
      const ground = nav.sampleNpcGround(navPoint);
      npc.goTo(nav.npcNavToGame(navPoint), ground);
      const m = npc.groundMotionDiagnostics;
      assert.equal(npc.state.position[0], Math.fround(x));
      assert.equal(npc.state.position[2], Math.fround(z));
      assert.equal(npc.state.position[1], Math.fround(ground.height));
      if (role === "stationary") {
        assert.deepEqual([...npc.state.position], before);
        assert.equal(m.verticalSpeed, 0);
        assert.equal(m.horizontalSpeed, 0);
      }
      if (role === "downhill") assert(m.packetVerticalSpeed <= 0);
      snapshots.push({
        tick,
        role,
        previousY: before[1],
        finalY: npc.state.position[1],
        terrainY: nav.terrain.getHeight(x, z),
        roadY: nav.roads.getSample(x, z)?.height ?? null,
        navmeshY: null,
        targetY: ground.height,
        surface: ground.surface,
        dt: m.dt,
        verticalSpeed: m.verticalSpeed,
        horizontalSpeed: m.horizontalSpeed,
        packetSent: true
      });
    }
  }
  for (const { buffer, hex } of retained)
    assert.equal(
      buffer.toString("hex"),
      hex,
      "another NPC mutated a retained packet"
    );
  return { packets, snapshots };
}
try {
  const together = run(["uphill", "downhill", "stationary"]);
  for (const role of ["uphill", "downhill", "stationary"]) {
    const alone = run([role]);
    assert.deepEqual(
      together.packets.filter((p) => p.role === role),
      alone.packets,
      "cross-NPC packet contamination"
    );
    assert.deepEqual(
      together.snapshots.filter((p) => p.role === role),
      alone.snapshots,
      "cross-NPC motion contamination"
    );
  }
  fs.writeFileSync(
    "npc-independent-validation.json",
    JSON.stringify(together, null, 2)
  );
  console.log(
    "PASS: 300 concurrent samples + 300 isolated controls, full position packet roundtrips, retained buffer integrity, stationary Y unchanged, downhill signed velocity, identical solo/concurrent results."
  );
} finally {
  Date.now = realNow;
}
