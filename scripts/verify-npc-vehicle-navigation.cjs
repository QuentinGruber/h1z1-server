const debug = require("debug")("h1emu:scripts:verify-npc-vehicle-navigation");
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { NavManager } = require("../out/utils/recast");
const {
  NpcCollisionManager
} = require("../out/servers/ZoneServer2016/managers/npccollisionmanager");
const { BasicNpc } = require("../out/servers/ZoneServer2016/entities/basicnpc");
const {
  npcCollisionProfile,
  vehicleCollisionProfile
} = require("../out/utils/npccollisionprofiles");
const { makeBox, sweepBoxes } = require("../out/utils/collisiongeometry");
async function main() {
  const nav = new NavManager();
  await nav.loadNav();
  const server = {
    navManager: nav,
    _npcs: {},
    _vehicles: {},
    _characters: {},
    aiEnabled: true,
    _modelsData: {},
    explosiveManager: { addEntity() {} },
    pushToGridCell() {},
    sendDataToAllWithSpawnedEntity() {
      return 0;
    }
  };
  const manager = new NpcCollisionManager(server);
  server.npcCollisionManager = manager;
  const start = nav.getClosestNavPointVec3(
    new Float32Array([-1924.9956, 62.7, -2268.831])
  );
  const target = nav.getClosestNavPointVec3(
    new Float32Array([start.x + 24, start.y, start.z])
  );
  const middle = nav.getClosestNavPointVec3(
    new Float32Array([(start.x + target.x) / 2, start.y, start.z])
  );
  const vehicle = {
    characterId: "parked",
    actorModelId: 10060,
    isDestroyed: false,
    state: {
      position: nav.npcNavToGame(middle),
      rotation: new Float32Array([0, 0, 0, 1]),
      yaw: 0
    },
    positionUpdate: { orientation: Math.PI / 2 },
    getDriver: () => ({ characterId: "occupant" })
  };
  server._vehicles.parked = vehicle;
  const realNow = Date.now;
  let now = realNow();
  Date.now = () => now;
  const results = [];
  try {
    for (const [model, label] of [
      [9510, "zombie"],
      [9187, "bear"],
      [9003, "wolf"],
      [9002, "deer"]
    ]) {
      const npc = new BasicNpc(
        label,
        results.length + 1,
        model,
        NavManager.navToGame(start),
        new Float32Array(4),
        server
      );
      npc.navAgent.teleport(start);
      npc.state.position = nav.npcNavToGame(start);
      npc.resetGroundMotion();
      server._npcs = { [label]: npc };
      manager.sync();
      nav.updt();
      const profile = npcCollisionProfile(model),
        body = makeBox(
          vehicleCollisionProfile(10060).bounds,
          vehicle.state.position,
          Math.PI / 2
        );
      npc.setSpeed(2);
      assert(npc.navAgent.requestMoveTarget(target));
      let samples = 0,
        reached = false,
        maxError = 0;
      for (let tick = 0; tick < 3600; tick++) {
        now += 1000 / 60;
        nav.updt();
        if (tick % 9 === 0) {
          manager.sync();
          const p = manager.constrain(npc, npc.navAgent.position());
          npc.goTo(nav.npcNavToGame(p));
          samples++;
          const current = makeBox(
            profile.bounds,
            npc.state.position,
            npc.state.yaw
          );
          assert.equal(
            sweepBoxes(current, current, body),
            null,
            `${label} entered vehicle geometry`
          );
          const y = nav.sampleNpcGround(p).height;
          maxError = Math.max(maxError, Math.abs(npc.state.position[1] - y));
        }
        const p = npc.navAgent.position();
        if (Math.hypot(p.x - target.x, p.z - target.z) < 1) {
          reached = true;
          break;
        }
      }
      results.push({
        species: label,
        radius: profile.radius,
        height: profile.height,
        reached,
        samples,
        maxGroundError: maxError,
        blockedMoves: manager.metrics.blockedNpcMoves
      });
      console.log(
        label,
        JSON.stringify({
          end: npc.navAgent.position(),
          target,
          result: results.at(-1)
        })
      );
      assert(reached, `${label} failed to route around vehicle`);
      nav.crowd.removeAgent(npc.navAgent);
      server._npcs = {};
      manager.sync();
    }
    Object.assign(server, {
      sounds: [],
      interactionDistance: 4,
      charactersRenderDistance: 100,
      aiTargetSpatialMap: new Map(),
      getClientsInRange: () => [], getClientByCharId: () => undefined
    });
    const { Factions } = require("../out/servers/ZoneServer2016/jsms/factions");
    for (const [label, model, faction, create, event] of [
      [
        "zombie",
        9510,
        Factions.ZOMBIE,
        require("../out/servers/ZoneServer2016/jsms/zombie.jsm").createZombie,
        "seePlayer"
      ],
      [
        "bear",
        9187,
        Factions.BEAR,
        require("../out/servers/ZoneServer2016/jsms/bear.jsm").createBear,
        "spottedTarget"
      ],
      [
        "wolf",
        9003,
        Factions.WOLF,
        require("../out/servers/ZoneServer2016/jsms/wolf.jsm").createWolf,
        "spottedTarget"
      ],
      [
        "deer",
        9002,
        Factions.PASSIVE,
        require("../out/servers/ZoneServer2016/jsms/deer.jsm").createDeer,
        "spottedPlayer"
      ]
    ]) {
      const npc = new BasicNpc(
        label,
        10,
        model,
        NavManager.navToGame(start),
        new Float32Array(4),
        server
      );
      npc.faction = faction;
      npc.navAgent.teleport(start);
      npc.state.position = nav.npcNavToGame(start);
      npc.resetGroundMotion();
      server._npcs = { [label]: npc };
      const playerPosition =
        label === "deer"
          ? nav.npcNavToGame({ x: start.x - 5, y: start.y, z: start.z })
          : nav.npcNavToGame(target);
      server._characters = {
        player: { state: { position: playerPosition }, isAlive: true }
      };
      server.aiTargetSpatialMap = new Map([
        [
          `${Math.floor(playerPosition[0] / 50)},${Math.floor(playerPosition[2] / 50)}`,
          [{ id: "player", faction: Factions.HUMAN, position: playerPosition }]
        ]
      ]);
      const fsm = create(npc, server);
      npc.fsm = fsm;
      fsm.targetCharacterId = "player";
      fsm.threatPos = playerPosition.slice();
      fsm.event(event);
      let hits = 0;
      const states = new Set();
      npc.applyDamage = () => hits++;
      for (let tick = 0; tick < 3600; tick++) {
        now += 1000 / 60;
        if (tick % 12 === 0) {
          fsm.tick(0.2);
          states.add(fsm.state);
        }
        nav.updt();
        if (tick % 9 === 0) {
          const p = manager.constrain(npc, npc.navAgent.position());
          npc.goTo(nav.npcNavToGame(p));
          manager.sync();
          const b = makeBox(
            vehicleCollisionProfile(10060).bounds,
            vehicle.state.position,
            Math.PI / 2
          );
          const n = makeBox(
            npcCollisionProfile(model).bounds,
            npc.state.position,
            npc.state.yaw
          );
          assert.equal(
            sweepBoxes(n, n, b),
            null,
            `${label} AI entered vehicle`
          );
          assert(
            Math.abs(npc.state.position[1] - nav.sampleNpcGround(p).height) <
              0.0001
          );
        }
        if (label === "deer" ? npc.state.position[0] > middle.x + 5 : hits > 0)
          break;
      }
      const succeeded =
        label === "deer" ? npc.state.position[0] > middle.x + 5 : hits > 0;
      const result = {
        kind: "actual-FSM",
        species: label,
        states: [...states],
        hits,
        succeeded,
        end: Array.from(npc.state.position)
      };
      console.log(JSON.stringify(result));
      results.push(result);
      assert(succeeded, `${label} AI did not chase/flee past vehicle`);
      nav.crowd.removeAgent(npc.navAgent);
      server._npcs = {};
      server._characters = {};
      manager.sync();
    }
    // Moving/rotation removes the parked obstacle; deletion restores the route.
    const state = manager.vehicles.get("parked");
    assert(state.obstacle);
    now += 100;
    assert(
      manager.moveVehicle(
        vehicle,
        new Float32Array([
          vehicle.state.position[0] + 1,
          ...vehicle.state.position.slice(1)
        ]),
        0,
        0,
        0,
        now
      )
    );
    assert.equal(state.obstacle, undefined);
    manager.remove("parked");
    assert.equal(manager.vehicles.size, 0);
    fs.writeFileSync(
      "npc-vehicle-navigation-validation.json",
      JSON.stringify(results, null, 2)
    );
    console.log(JSON.stringify(results, null, 2));
  } finally {
    Date.now = realNow;
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

