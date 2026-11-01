// Run after build-zone-2016: node --test scripts/verify-zombie-locomotion.cjs
// Server packet regressions only; these do not establish client visual results.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const path = require("node:path");
const root = process.env.H1EMU_TEST_ROOT || path.resolve(__dirname, "..");
const { Npc } = require(
  path.join(root, "out/servers/ZoneServer2016/entities/npc")
);
const { ZoneServer2016 } = require(
  path.join(root, "out/servers/ZoneServer2016/zoneserver")
);
const { Factions } = require(
  path.join(root, "out/servers/ZoneServer2016/jsms/factions")
);
const { createZombie } = require(
  path.join(root, "out/servers/ZoneServer2016/jsms/zombie.jsm")
);
const { packPositionUpdateData, readPositionUpdateData } = require(
  path.join(root, "out/packets/ClientProtocol/ClientProtocol_1080/shared")
);

test("zombie locomotion and idle packet transitions", async (t) => {
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  try {
    function fixture(slope) {
      const packets = [];
      let agentSpeed = 0;
      let proposed = { x: 0, y: 100, z: 0 };
      const ground = (x = 0) => ({
        height: 100 + x * slope,
        valid: true,
        surface: "terrain",
        slopeX: slope,
        slopeZ: 0
      });
      const npc = Object.create(Npc.prototype);
      Object.assign(npc, {
        characterId: "0x123",
        transientId: 1,
        actorModelId: 9510,
        faction: Factions.ZOMBIE,
        currentAnimation: "",
        deathTime: 0,
        lookAtTarget: null,
        state: { position: new Float32Array([0, 100, 0, 1]), yaw: 0 },
        navAgent: {
          resetMoveTarget() {},
          requestMoveTarget() {},
          position: () => proposed,
          velocity: () => ({ x: agentSpeed, y: agentSpeed * slope, z: 0 })
        },
        server: {
          pathfindingUpdateRate: 150,
          _npcs: {},
          _characters: {},
          _vehicles: {},
          navManager: {
            npcNavToGame: (p) => new Float32Array([p.x, p.y, p.z, 1]),
            groundDiagnostics: { trace() {} },
            sampleNpcGround: (p) => ground(p.x),
            navMeshQuery: {
              findRandomPointAroundCircle: () => ({ success: false })
            }
          },
          sendDataToAllWithSpawnedEntity(_entities, _id, name, data) {
            packets.push({ name, data });
            return 1;
          }
        }
      });
      npc.server._npcs[npc.characterId] = npc;
      npc.resetGroundMotion();
      function step(speed, yOnly = 0, crowdSpeed = speed) {
        agentSpeed = crowdSpeed;
        now += 150;
        const x = npc.state.position[0] + speed * 0.15;
        proposed = {
          x: Math.fround(x),
          y: Math.fround(100 + slope * x + yOnly),
          z: 0
        };
        ZoneServer2016.prototype.updatePathfindingPositions.call(npc.server);
        const packet = packets.at(-1);
        if (!packet) return;
        assert.equal(packet.name, "PlayerUpdatePosition");
        const sent = packet.data.positionUpdate;
        const decoded = readPositionUpdateData(
          packPositionUpdateData(sent),
          0
        ).value;
        assert.equal(decoded.stance, sent.stance);
        assert.ok(
          Math.abs(decoded.horizontalSpeed - sent.horizontalSpeed) <= 0.051
        );
        assert.ok(
          Math.abs(decoded.verticalSpeed - sent.verticalSpeed) <= 0.006
        );
        assert.ok(decoded.stance & 1024, "grounded");
        return decoded;
      }
      return { npc, packets, step };
    }

    for (const [terrain, slope] of [
      ["level", 0],
      ["uphill", 0.5],
      ["downhill", -0.5]
    ]) {
      for (const [gait, speed, sprint] of [
        ["walking", 1, false],
        ["running", 4, true]
      ]) {
        await t.test(`${gait} ${terrain}`, () => {
          const f = fixture(slope);
          for (let i = 0; i < 5; i++) {
            const p = f.step(speed);
            assert.ok(p.stance & 65536, "forward");
            assert.equal(p.stance & 64, 0, "not stationary");
            assert.equal(Boolean(p.stance & 4), sprint);
            assert.equal(
              p.verticalSpeed,
              0,
              "grounded zombie slope movement must use zero vertical prediction"
            );
            assert.equal(
              f.npc.state.position[1],
              Math.fround(100 + slope * f.npc.state.position[0])
            );
          }
          assert.equal(
            f.packets.filter((p) => p.name === "Character.PlayAnimation")
              .length,
            0
          );
        });
      }
    }
    await t.test(
      "downhill to stop, including FSM idle while decelerating",
      () => {
        const f = fixture(-0.5);
        f.step(4);
        const zombie = createZombie(f.npc, f.npc.server);
        zombie.event("idleTimeout");
        assert.equal(zombie.state, "idle");
        assert.equal(f.npc.currentAnimation, "");
        assert.ok(f.step(1).stance & 65536, "deceleration remains moving");
        const stopped = f.step(0);
        assert.ok(stopped.stance & 64);
        assert.equal(stopped.horizontalSpeed, 0);
        assert.equal(stopped.verticalSpeed, 0);
        assert.equal(f.npc.hasPendingMovementStop(), false);
        zombie.event("seePlayer");
        assert.equal(zombie.state, "chase");
        assert.ok(f.step(4).stance & 4, "resumed chase selects running");
        assert.equal(
          f.npc.currentAnimation,
          "",
          "no stale Idle for new observers"
        );
        assert.equal(
          f.packets.filter((p) => p.name === "Character.PlayAnimation").length,
          0
        );
      }
    );
    await t.test("walk/run/walk downhill; facing and Y-only updates", () => {
      const f = fixture(-0.5);
      assert.equal(f.step(1).stance & 4, 0);
      assert.ok(f.step(4).stance & 4);
      f.npc.lookAt(new Float32Array([10, 50, 10, 1]));
      const facing = f.packets.at(-1).data.positionUpdate;
      for (const field of [
        "stance",
        "position",
        "horizontalSpeed",
        "verticalSpeed"
      ])
        assert.equal(field in facing, false);
      assert.equal(f.step(1).stance & 4, 0);
      const yOnly = f.step(0, 0.1);
      assert.equal(yOnly.horizontalSpeed, 0);
      assert.equal(yOnly.verticalSpeed, 0);
      assert.equal(
        f.packets.filter((p) => p.name === "Character.PlayAnimation").length,
        0,
        "Y-only correction sends no Idle command or locomotion restart"
      );
    });
    await t.test(
      "unchanged crowd snapshot must not idle a moving zombie",
      () => {
        const f = fixture(-0.5);
        f.step(4);
        const before = f.packets.length;
        const repeated = f.step(0, 0, 4);
        assert.equal(
          f.packets.length,
          before,
          "unchanged crowd snapshot must not publish new XYZ or prediction velocity"
        );
        assert.equal(repeated.stance & 64, 0);
        assert.ok(repeated.stance & 65536);
        assert.ok(repeated.stance & 4);
        assert.ok(repeated.horizontalSpeed > 0);
      }
    );
    await t.test(
      "wildlife keeps existing displacement-based replication",
      () => {
        for (const faction of [
          Factions.WOLF,
          Factions.BEAR,
          Factions.PASSIVE
        ]) {
          const f = fixture(0.5);
          f.npc.faction = faction;
          const p = f.step(1, 0, 4);
          assert.ok(Math.abs(p.horizontalSpeed - 1 / 0.3048) < 0.051);
          assert.ok(p.verticalSpeed > 0, "wildlife retains slope prediction");
          assert.equal(p.stance & 4, 0);
          assert.ok(f.step(0, 0, 4).stance & 64);
        }
      }
    );
    await t.test(
      "stalled or collision-constrained motion still publishes a stop",
      () => {
        const stalled = fixture(-0.5);
        stalled.step(4);
        stalled.step(0, 0, 4);
        const stopped = stalled.step(0, 0, 4);
        assert.equal(
          stopped.horizontalSpeed,
          0,
          "residual agent velocity must not extrapolate forever"
        );
        const blocked = fixture(0.5);
        blocked.step(4);
        const previous = blocked.npc.state.position.slice();
        blocked.npc.server.npcCollisionManager = {
          constrain: () => ({ x: previous[0], y: previous[1], z: previous[2] }),
          sync() {}
        };
        const packet = blocked.step(4);
        assert.equal(
          packet.horizontalSpeed,
          0,
          "a blocked step must stop prediction immediately"
        );
        assert.deepEqual(blocked.npc.state.position, previous);
      }
    );
    for (const slope of [0, 0.5, -0.5]) {
      for (const speed of [1, 4]) {
        await t.test(
          `200ms crowd / 150ms replication: slope=${slope} speed=${speed}`,
          () => {
            const f = fixture(slope);
            let previousCrowdSteps = 0;
            for (let tick = 1; tick <= 12; tick++) {
              const crowdSteps = Math.floor((tick * 150) / 200);
              const distance = (crowdSteps - previousCrowdSteps) * speed * 0.2;
              const p = f.step(distance / 0.15, 0, crowdSteps ? speed : 0);
              previousCrowdSteps = crowdSteps;
              if (!crowdSteps) continue;
              assert.equal(
                p.stance & 64,
                0,
                "moving crowd agent must not receive stationary stance between crowd steps"
              );
              assert.ok(p.stance & 65536);
              assert.equal(Boolean(p.stance & 4), speed === 4);
              assert.ok(
                p.horizontalSpeed > 0,
                "no artificial stop between crowd steps"
              );
              assert.equal(
                f.npc.state.position[1],
                Math.fround(100 + slope * f.npc.state.position[0])
              );
            }
            const stopped = f.step(0);
            assert.ok(stopped.stance & 64);
            assert.equal(stopped.horizontalSpeed, 0);
            assert.equal(f.npc.hasPendingMovementStop(), false);
          }
        );
      }
    }
    await t.test(
      "Y-only correction cannot invent horizontal prediction",
      () => {
        const f = fixture(-0.5);
        f.step(4);
        const correction = f.step(0, 0.1, 4);
        assert.equal(correction.horizontalSpeed, 0);
        assert.equal(
          f.npc.state.position[1],
          Math.fround(100 - 0.5 * f.npc.state.position[0] + 0.1)
        );
        assert.equal(
          f.packets.filter((p) => p.name === "Character.PlayAnimation").length,
          0
        );
      }
    );
  } finally {
    Date.now = originalNow;
  }
});

