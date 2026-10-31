const debug = require("debug")("h1emu:scripts:profile-npc-slopes");
const fs = require("node:fs");
const { NavManager } = require("../out/utils/recast");
const { TerrainHeight } = require("../out/utils/terrainheight");
const { RoadSurfaces } = require("../out/utils/roadsurfaces");
const { Npc } = require("../out/servers/ZoneServer2016/entities/npc");
const nav = new NavManager();
nav.terrain = new TerrainHeight("data/2016/terrainData");
nav.roads = new RoadSurfaces("data/2016/roadSurfaces.json.gz");
const originalNow = Date.now;
let now = Date.now();
Date.now = () => now;
const cases = [];
try {
  for (const [label, x0, x1, z] of [
    ["road-uphill", -1810, -1840, -2234.6],
    ["road-downhill", -1840, -1810, -2234.6],
    ["terrain-uphill", 1980, 2000, -2235.25],
    ["terrain-downhill", 2000, 1980, -2235.25],
    ["negative-sign-road-uphill", -2000, -1980, -2235.25],
    ["negative-sign-road-downhill", -1980, -2000, -2235.25]
  ]) {
    let packet;
    const npc = Object.create(Npc.prototype);
    const direction = Math.sign(x1 - x0);
    Object.assign(npc, {
      characterId: label,
      transientId: 1,
      state: { position: nav.npcNavToGame({ x: x0, y: 0, z }), yaw: 0 },
      lookAtTarget: null,
      navAgent: { velocity: () => ({ x: direction * 2, y: 0, z: 0 }) },
      server: {
        navManager: nav,
        pathfindingUpdateRate: 150,
        _npcs: {},
        sendDataToAllWithSpawnedEntity(_e, _i, _n, p) {
          packet = p.positionUpdate;
        }
      }
    });
    const samples = [];
    for (let i = 1; i <= 100; i++) {
      const x = x0 + ((x1 - x0) * i) / 100,
        terrainY = nav.terrain.getHeight(x, z),
        road = nav.roads.getSample(x, z),
        next = nav.npcNavToGame({ x, y: terrainY, z }),
        previous = [...npc.state.position];
      now += 150;
      npc.goTo(next);
      const dy = next[1] - previous[1];
      samples.push({
        x,
        y: next[1],
        terrainY,
        roadY: road?.height ?? null,
        source:
          road && road.height > terrainY
            ? "road:" + road.instanceId
            : "terrain",
        dy,
        dt: 0.15,
        verticalSpeed: packet.verticalSpeed
      });
    }
    const changes = samples
      .slice(1)
      .filter((s, i) => s.source !== samples[i].source).length;
    const reversals = samples
      .slice(1)
      .filter((s, i) => s.dy * samples[i].dy < 0).length;
    cases.push({
      label,
      surfaceChanges: changes,
      heightReversals: reversals,
      downwardSamples: samples.filter((s) => s.dy < 0).length,
      upwardVelocityOnDownhill: samples.filter(
        (s) => s.dy < 0 && s.verticalSpeed > 0
      ).length,
      minY: Math.min(...samples.map((s) => s.y)),
      maxY: Math.max(...samples.map((s) => s.y)),
      samples
    });
  }
} finally {
  Date.now = originalNow;
}
const summary = cases.map(({ samples, ...rest }) => rest);
debug(JSON.stringify(summary, null, 2));
fs.writeFileSync(
  process.argv[2] ?? "npc-slope-profile.json",
  JSON.stringify({ summary, cases }, null, 2)
);
