const debug = require("debug")("h1emu:scripts:verify-terrain-index");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const old = new Module(__filename, module);
old.filename = __filename;
old.paths = module.paths;
old._compile(
  ts.transpileModule(fs.readFileSync("scripts/fixtures/terrainheight-pre-sync.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText,
  __filename
);
const before = new old.exports.TerrainHeight("data/2016/terrainData");
const { TerrainHeight } = require("../out/utils/terrainheight");
const after = new TerrainHeight("data/2016/terrainData");
let checks = 0;
for (let tile = 0; tile < before.tiles.length; tile += 13) {
  const b = before.tiles[tile].bounds;
  for (const [dx, dz] of [
    [0, 0],
    [0.001, 0.001],
    [8, 8],
    [127.3, 63.2],
    [255.999, 255.999],
    [256, 256]
  ]) {
    const x = b[0] + dx,
      z = b[2] + dz;
    assert.deepEqual(
      after.getSurface(x, z),
      before.getSurface(x, z),
      `surface mismatch at ${x},${z}`
    );
    checks++;
  }
}
console.log(
  `PASS: ${checks} exact height/slope comparisons, including tile and cell boundaries, versus pre-change index.`
);

