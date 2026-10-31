const debug = require("debug")("h1emu:scripts:benchmark-terrain");
const fs = require("node:fs");
const { performance } = require("node:perf_hooks");
const { TerrainHeight } = require("../out/utils/terrainheight");
const terrain = new TerrainHeight("data/2016/terrainData");
const spawns = JSON.parse(
  fs.readFileSync("data/2016/zoneData/Z1_npcs.json")
).flatMap((n) => n.instances.map((i) => i.position));
let missing = 0;
const cold = performance.now();
for (const p of spawns) if (terrain.getHeight(p[0], p[2]) === null) missing++;
const coldMs = performance.now() - cold;
const ticks = [];
for (let tick = 0; tick < 100; tick++) {
  const start = performance.now();
  for (const p of spawns)
    terrain.getHeight(p[0] + tick * 0.001, p[2] + tick * 0.001);
  ticks.push(performance.now() - start);
}
ticks.sort((a, b) => a - b);
const report = {
  npcPositions: spawns.length,
  missing,
  coldMs,
  warmMedianMs: ticks[50],
  warmP95Ms: ticks[95],
  rssMiB: process.memoryUsage().rss / 1024 / 1024
};
fs.writeFileSync("terrain-benchmark.json", JSON.stringify(report, null, 2));
debug(JSON.stringify(report));
