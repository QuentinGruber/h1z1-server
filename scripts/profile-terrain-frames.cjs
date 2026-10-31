const debug = require("debug")("h1emu:scripts:profile-terrain-frames");
const fs = require("node:fs");
const { TerrainHeight } = require("../out/utils/terrainheight");
const terrain = new TerrainHeight("data/2016/terrainData");
const all = JSON.parse(
  fs.readFileSync("data/2016/zoneData/Z1_npcs.json")
).flatMap((n) => n.instances.map((i) => i.position));
// Keep real spawn order and cover the entire map without spawning game actors.
const points = all.filter((_, i) => i % Math.ceil(all.length / 1000) === 0);
let cold = 0,
  loadMs = 0;
const original = terrain.loadTile.bind(terrain);
terrain.loadTile = function (info) {
  const missed = !this.cache.has(info.file);
  const t = performance.now();
  const r = original(info);
  if (missed) {
    cold++;
    loadMs += performance.now() - t;
  }
  return r;
};
const frames = [];
for (let frame = 0; frame < 12; frame++) {
  cold = 0;
  loadMs = 0;
  const t = performance.now();
  let sum = 0;
  for (const p of points) {
    const s = terrain.getSurface(p[0] + frame * 0.3, p[2]);
    sum += s?.height ?? 0;
  }
  frames.push({
    frame,
    queries: points.length,
    ms: performance.now() - t,
    coldTiles: cold,
    tileLoadMs: loadMs,
    sum
  });
}
fs.writeFileSync(
  process.argv[2] ?? "terrain-frame-profile.json",
  JSON.stringify(frames, null, 2)
);
debug(JSON.stringify(frames, null, 2));
