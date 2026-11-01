const assert = require("node:assert/strict");
const { test } = require("node:test");
const path = require("node:path");
const root = process.env.H1EMU_TEST_ROOT || path.resolve(__dirname, "..");
const { Npc } = require(
  path.join(root, "out/servers/ZoneServer2016/entities/npc")
);
const { Vehicle2016 } = require(
  path.join(root, "out/servers/ZoneServer2016/entities/vehicle")
);
const { ResourceIds } = require(
  path.join(root, "out/servers/ZoneServer2016/models/enums")
);

test("NPC attacks reduce mounted vehicle condition in PvE and PvP", () => {
  for (const isPvE of [true, false]) {
    for (const [species, damage] of [["bear", 4000], ["wolf", 2000], ["zombie", 2500]]) {
      const car = Object.create(Vehicle2016.prototype);
      Object.assign(car, {
        characterId: "car",
        _resources: { [ResourceIds.CONDITION]: 100000 },
        destroyedState: 0
      });
      const client = {
        isLoading: false,
        vehicle: { mountedVehicle: "car" },
        character: {
          characterId: "prey",
          state: { position: new Float32Array(4) },
          meleeHit: {},
          OnMeleeHit() { assert.fail("mounted occupant must not take the hit"); }
        }
      };
      const server = {
        isPvE,
        _vehicles: { car },
        _npcs: {},
        getClientByCharId: id => id === "prey" ? client : undefined,
        updateResourceToAllWithSpawnedEntity() {}
      };
      const npc = Object.assign(Object.create(Npc.prototype), {
        characterId: species, npcMeleeDamage: damage, server
      });
      server._npcs[species] = npc;
      npc.applyDamage("prey");
      assert.equal(car.getHealth(), 100000 - damage * 2, `${species}, PvE=${isPvE}`);
      if (isPvE) {
        const health = car.getHealth();
        car.OnMeleeHit(server, { entity: "unknown", damage: 1000 });
        assert.equal(car.getHealth(), health, "unregistered attackers remain blocked");
      }
    }
  }
});
const { createZombie } = require(
  path.join(root, "out/servers/ZoneServer2016/jsms/zombie.jsm")
);
const { createGasser } = require(
  path.join(root, "out/servers/ZoneServer2016/jsms/gasser.jsm")
);
const { createExploder } = require(
  path.join(root, "out/servers/ZoneServer2016/jsms/exploder.jsm")
);
const { Factions } = require(
  path.join(root, "out/servers/ZoneServer2016/jsms/factions")
);
const { vehicleCollisionProfile } = require(
  path.join(root, "out/utils/npccollisionprofiles")
);

function fixture(position) {
  const packets = [],
    requests = [];
  let stopped = 0,
    hits = 0;
  const car = {
    actorModelId: 10060,
    isDestroyed: false,
    engineOn: false,
    vehicleId: 2,
    state: {
      position: new Float32Array([0, 100, 0, 1]),
      rotation: new Float32Array([0, 0, 0, 1])
    },
    positionUpdate: { orientation: 0 }
  };
  const player = {
    state: { position: new Float32Array([0, 100.6, 0, 1]) },
    isAlive: true
  };
  const client = { vehicle: { mountedVehicle: "car" } };
  const server = {
    _vehicles: { car },
    _characters: { prey: player },
    _npcs: {},
    sounds: [],
    aiTargetSpatialMap: new Map(),
    getClientsInRange: () => [],
    getClientByCharId: () => client,
    navManager: {
      navMeshQuery: {
        findRandomPointAroundCircle: () => ({ success: false }),
        findNearestPoly: (p) => ({
          success: true,
          nearestRef: 1,
          nearestPoint: p
        })
      },
      getClosestNavPointVec3: (p) => ({ x: p[0], y: p[1], z: p[2] })
    },
    sendDataToAllWithSpawnedEntity(_entities, _id, name, data) {
      packets.push({ name, data });
      return 1;
    }
  };
  const npc = Object.create(Npc.prototype);
  Object.assign(npc, {
    faction: Factions.ZOMBIE,
    characterId: "zombie",
    actorModelId: 9510,
    deathTime: 0,
    currentAnimation: "",
    state: {
      position: new Float32Array(position),
      yaw: Math.atan2(-position[0], -position[2])
    },
    server,
    navAgent: {
      resetMoveTarget() {
        stopped++;
      },
      requestMoveTarget(p) {
        requests.push(p);
      },
      velocity: () => ({ x: 0, y: 0, z: 0 })
    },
    applyDamage() {
      hits++;
    }
  });
  server._npcs.zombie = npc;
  return {
    npc,
    server,
    car,
    player,
    client,
    packets,
    requests,
    counts: () => ({ stopped, hits })
  };
}

test("mounted prey can be attacked from every vehicle side without steering into its seat", async (t) => {
  const b = vehicleCollisionProfile(10060).bounds;
  for (const [label, pos] of [
    ["left", [b[0] - 0.6, 100, 0, 1]],
    ["right", [b[3] + 0.6, 100, 0, 1]],
    ["rear", [0, 100, b[2] - 0.6, 1]],
    ["front", [0, 100, b[5] + 0.6, 1]]
  ]) {
    await t.test(label, () => {
      const f = fixture(pos),
        before = JSON.stringify(f.car);
      if (label === "rear" || label === "front")
        assert.ok(
          Math.hypot(pos[0], pos[2]) > 2,
          "seat center remains outside old melee range"
        );
      const target = f.npc.getZombieTargetPosition(
        "prey",
        f.player.state.position
      );
      assert.ok(Math.hypot(...[0, 1, 2].map((k) => pos[k] - target[k])) < 2);
      assert.equal(
        JSON.stringify(f.car),
        before,
        "targeting must not change vehicle geometry/state"
      );
      const zombie = createZombie(f.npc, f.server);
      zombie.targetCharacterId = "prey";
      zombie.event("seePlayer");
      zombie.tick(0.2);
      assert.equal(zombie.state, "attack");
      zombie.tick(0.2);
      assert.equal(zombie.state, "attacking");
      assert.ok(f.counts().stopped > 0);
      assert.equal(
        f.requests.length,
        0,
        "no unreachable seat target while already in shell melee range"
      );
      zombie.tick(1);
      assert.equal(
        f.counts().hits,
        1,
        "existing melee damage path is called once"
      );
      assert.equal(zombie.state, "attack");
    });
  }
});

test("rotated vehicle targeting and dismount preserve target semantics", () => {
  const f = fixture([4, 100, 0, 1]);
  f.car.positionUpdate.orientation = Math.PI / 2;
  const target = f.npc.getZombieTargetPosition("prey", f.player.state.position);
  assert.ok(target[0] > 1.9 && target[0] < 2.1);
  f.client.vehicle.mountedVehicle = undefined;
  assert.equal(
    f.npc.getZombieTargetPosition("prey", f.player.state.position),
    f.player.state.position
  );
});

test("idling engine remains audible to zombies without changing wildlife hearing", () => {
  const f = fixture([0, 100, 27, 1]);
  f.car.engineOn = true;
  const sounds = f.npc.getZombieSounds([]);
  assert.equal(sounds.length, 1);
  assert.equal(sounds[0].radius, 50);
  assert.equal(sounds[0].agitation, 3);
  assert.equal(
    f.npc.getZombieSounds([]).length,
    0,
    "stimulus must be throttled"
  );
  f.npc.nextEngineSoundTime = 0;
  f.car.engineOn = false;
  assert.equal(f.npc.getZombieSounds([]).length, 0);
  f.npc.faction = Factions.WOLF;
  f.car.engineOn = true;
  const original = [];
  assert.equal(f.npc.getZombieSounds(original), original);
});

test("looping Idle cannot persist over zombie locomotion; wildlife animation is unchanged", () => {
  const f = fixture([0, 100, 4, 1]);
  f.npc.setAnimation("Idle");
  assert.equal(f.npc.currentAnimation, "");
  assert.equal(f.packets.length, 0);
  f.npc.faction = Factions.WOLF;
  f.npc.setAnimation("Idle");
  assert.equal(f.packets.at(-1).name, "Character.PlayAnimation");
});

test("special zombie attack transitions cancel steering once", () => {
  for (const create of [createGasser, createExploder]) {
    const f = fixture([0, 100, 2.7, 1]);
    const zombie = create(f.npc, f.server);
    zombie.targetCharacterId = "prey";
    zombie.event("seePlayer");
    zombie.event("reachPlayer");
    assert.equal(zombie.state, "attack");
    const before = f.counts().stopped;
    zombie.event("startAttacking");
    assert.equal(zombie.state, "attacking");
    assert.equal(f.counts().stopped, before + 1);
    if (create === createGasser) {
      zombie.event("doneAttacking");
      zombie.event("spit");
      assert.equal(f.counts().stopped, before + 2);
    }
  }
});

test("zombie target projection prefers local X/Z and falls back only when absent", () => {
  const f = fixture([0, 100, 0, 1]);
  const calls = [];
  const localPoint = { x: 2, y: 90, z: 3 };
  f.server.navManager.navMeshQuery.findNearestPoly = (point, options) => {
    calls.push({ point, options });
    return { success: true, nearestRef: 1, nearestPoint: localPoint };
  };
  assert.equal(
    f.npc.getZombieNavTarget(new Float32Array([2, 100, 3, 1])),
    localPoint
  );
  assert.equal(calls.length, 1);
  assert.ok(calls[0].options.halfExtents.x < 1);
  assert.equal(calls[0].options.halfExtents.y, 10);
  let attempts = 0;
  f.server.navManager.navMeshQuery.findNearestPoly = (_point, options) => {
    attempts++;
    return options.halfExtents.x === 10
      ? { success: true, nearestRef: 2, nearestPoint: localPoint }
      : { success: false, nearestRef: 0 };
  };
  assert.equal(
    f.npc.getZombieNavTarget(new Float32Array([2, 100, 3, 1])),
    localPoint
  );
  assert.equal(attempts, 2);
  f.server.navManager.navMeshQuery.findNearestPoly = () => ({
    success: false,
    nearestRef: 0
  });
  assert.equal(
    f.npc.getZombieNavTarget(new Float32Array([2, 100, 3, 1])),
    undefined
  );
});

test("only a zombie pursuing a mounted character opens the vehicle approach", () => {
  const f = fixture([0, 100, 5, 1]),
    opened = [];
  f.server.npcCollisionManager = {
    allowZombieVehicleApproach: (id) => opened.push(id)
  };
  f.server.navManager.navMeshQuery.findNearestPoly = (p) => ({
    success: true,
    nearestRef: 1,
    nearestPoint: p
  });
  f.npc.refreshZombieVehicleApproach("prey");
  assert.deepEqual(opened, ["car"]);
  opened.length = 0;
  f.npc.getZombieNavTarget(f.player.state.position);
  f.npc.faction = Factions.BEAR;
  f.npc.refreshZombieVehicleApproach("prey");
  assert.deepEqual(opened, []);
  f.npc.faction = Factions.ZOMBIE;
  f.client.vehicle.mountedVehicle = undefined;
  f.npc.refreshZombieVehicleApproach("prey");
  assert.deepEqual(opened, []);
});

test("mounted zombie closes beyond damage reach and holds a stable stopping band", () => {
  const front = vehicleCollisionProfile(10060).bounds[5],
    f = fixture([0, 100, front + 1.5, 1]);
  const zombie = createZombie(f.npc, f.server);
  zombie.targetCharacterId = "prey";
  zombie.event("seePlayer");
  zombie.tick(0.2);
  assert.equal(
    zombie.state,
    "chase",
    "damage reach must not stop the vehicle approach"
  );
  assert.ok(f.requests.length > 0);
  f.npc.state.position = new Float32Array([0, 100, front + 0.6, 1]);
  zombie.tick(0.2);
  assert.equal(zombie.state, "attack");
  assert.ok(
    f.counts().stopped > 0,
    "stop on arrival, before next crowd update"
  );
  zombie.lastAttackTime = 0;
  f.npc.state.position = new Float32Array([0, 100, front + 0.85, 1]);
  zombie.tick(0.2);
  assert.equal(
    zombie.state,
    "attack",
    "small crowd displacement must not restart chase"
  );
  f.npc.state.position = new Float32Array([0, 100, front + 1.2, 1]);
  zombie.tick(0.2);
  assert.equal(
    zombie.state,
    "chase",
    "separated zombie must resume approaching"
  );
  f.client.vehicle.mountedVehicle = undefined;
  assert.equal(
    f.npc.getZombieVehicleApproachDistance("prey", 2),
    2,
    "on-foot combat retains original reach"
  );
});

test("zombie facing-only replication cannot rotate a clear body into the vehicle", () => {
  const edge = vehicleCollisionProfile(10060).bounds[3],
    f = fixture([edge + 0.35, 100, 0, 1]);
  f.npc.state.yaw = 0;
  f.npc.refreshZombieVehicleApproach("prey");
  const target = new Float32Array([edge + 10.35, 100, 10, 1]);
  f.npc.lookAt(target);
  assert.equal(f.npc.state.yaw, 0);
  assert.equal(f.packets.at(-1).data.positionUpdate.orientation, 0);
  assert.equal(f.packets.at(-1).data.positionUpdate.angleChange, 0);
  f.npc.faction = Factions.BEAR;
  f.npc.lookAt(target);
  assert.ok(
    Math.abs(f.npc.state.yaw - Math.PI / 4) < 0.001,
    "wildlife facing remains unchanged"
  );
});
