const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  crypto = require("node:crypto");
const { applyRoadNavPatch } = require("../out/utils/roadnavpatch");
const { decode } = require("./build-local-road-nav-patch.cjs");
const { RoadSurfaces } = require("../out/utils/roadsurfaces");
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
const base = Buffer.concat([
    fs.readFileSync("data/2016/navData/z1_cache_0.bin"),
    fs.readFileSync("data/2016/navData/z1_cache_1.bin")
  ]),
  road = fs.readFileSync("data/2016/roadSurfaces.json.gz"),
  patch = JSON.parse(
    fs.readFileSync("data/2016/navData/roadWalkabilityPatch.json", "utf8")
  );
function records(b) {
  const out = [];
  let offset = 92;
  for (let n = 0; n < b.readUInt32LE(8); n++) {
    const ref = b.readUInt32LE(offset),
      size = b.readUInt32LE(offset + 4);
    out.push({ ref, data: b.subarray(offset + 8, offset + 8 + size) });
    offset += 8 + size;
  }
  assert.equal(offset, b.length);
  return out;
}
test("road cache patch preserves every existing height, area and unrelated tile", () => {
  const actual = Buffer.from(applyRoadNavPatch(base, patch, road)),
    before = records(base),
    after = records(actual);
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(actual.subarray(12, 92), base.subarray(12, 92));
  for (let n = 0; n < before.length; n++) {
    assert.equal(after[n].ref, before[n].ref);
    if (before[n].ref !== patch.tile.ref) {
      assert.deepEqual(after[n].data, before[n].data);
      continue;
    }
    const old = decode(before[n].data.subarray(56), 12288),
      updated = decode(after[n].data.subarray(56), 12288);
    assert.deepEqual(updated.subarray(0, 8192), old.subarray(0, 8192));
    assert.equal(hash(old.subarray(0, 4096)), patch.existingHeightsSha256);
    assert.equal(hash(old.subarray(4096, 8192)), patch.existingAreasSha256);
    for (let i = 0; i < 4096; i++) {
      const edit = patch.connectivityEdits.find((e) => e.cell === i);
      assert.equal(updated[8192 + i], edit ? edit.after : old[8192 + i]);
    }
  }
  const addition = after.at(-1).data,
    layer = decode(addition.subarray(56), 12288),
    roads = new RoadSurfaces("data/2016/roadSurfaces.json.gz"),
    min = [0, 1, 2].map((k) => addition.readFloatLE(20 + k * 4));
  let cells = 0,
    maxHeight = 0;
  for (let i = 0; i < 4096; i++) {
    if (!layer[4096 + i]) continue;
    cells++;
    maxHeight = Math.max(maxHeight, layer[i]);
    const x = i % 64,
      z = Math.floor(i / 64),
      sample = roads.getSample(
        min[0] + (x + 0.5) * patch.cellSize,
        min[2] + (z + 0.5) * patch.cellSize
      );
    assert.equal(sample.instanceId, patch.roadInstanceId);
    assert.ok(
      Math.abs(min[1] + layer[i] * patch.cellHeight - sample.height) <
        patch.cellHeight * 0.501
    );
  }
  assert.equal(cells, patch.addedRoadCells);
  assert.ok(
    maxHeight <= addition.readUInt16LE(46) - addition.readUInt16LE(44),
    "new road layer exceeds its height envelope"
  );
});
test("road cache patch rejects mismatched cache or collision source data", () => {
  const bad = Buffer.from(base);
  bad[100] ^= 1;
  assert.throws(() => applyRoadNavPatch(bad, patch, road), /does not match/);
  assert.throws(
    () => applyRoadNavPatch(base, patch, Buffer.from("changed collision")),
    /does not match/
  );
});

test("precise road cache retains original obstacle settings and road source heights", async () => {
  const R = require("recast-navigation"),
    {
      createDefaultTileCacheMeshProcess
    } = require("recast-navigation/generators"),
    { createRoadNavCache } = require("../out/utils/roadnavpatch");
  await R.init();
  const bytes = Buffer.from(patch.fineCache, "base64"),
    record = records(bytes)[0].data,
    width = record[48],
    height = record[49],
    cells = width * height,
    layer = decode(record.subarray(56), cells * 3),
    roads = new RoadSurfaces("data/2016/roadSurfaces.json.gz"),
    step = bytes.readFloatLE(52),
    min = [0, 1, 2].map((k) => record.readFloatLE(20 + k * 4));
  assert.deepEqual(
    bytes.subarray(68, 92),
    base.subarray(68, 92),
    "height/radius/climb/obstacle settings changed"
  );
  let count = 0;
  for (let i = 0; i < cells; i++) {
    if (!layer[cells + i]) continue;
    count++;
    const sample = roads.getSample(
      min[0] + ((i % width) + 0.5) * step,
      min[2] + (Math.floor(i / width) + 0.5) * step
    );
    assert.equal(sample.instanceId, patch.roadInstanceId);
    assert.ok(
      Math.abs(min[1] + layer[i] * patch.cellHeight - sample.height) <
        patch.cellHeight * 0.502
    );
  }
  assert.equal(count, patch.fineRoadCells);
  const cache = createRoadNavCache(patch, createDefaultTileCacheMeshProcess()),
    mesh = new R.NavMesh(),
    params = R.NavMeshParams.create({
      orig: {
        x: bytes.readFloatLE(12),
        y: bytes.readFloatLE(16),
        z: bytes.readFloatLE(20)
      },
      tileWidth: bytes.readFloatLE(24),
      tileHeight: bytes.readFloatLE(28),
      maxTiles: bytes.readInt32LE(32),
      maxPolys: bytes.readInt32LE(36)
    });
  assert.ok(mesh.initTiled(params));
  assert.ok(
    R.statusSucceed(
      cache.buildNavMeshTilesAt(patch.tile.x, patch.tile.z, mesh)
    ),
    "precise cache must rebuild with adequate scratch memory"
  );
  cache.destroy();
  mesh.destroy();
});
