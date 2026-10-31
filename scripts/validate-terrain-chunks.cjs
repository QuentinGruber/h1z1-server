const debug = require("debug")("h1emu:scripts:validate-terrain-chunks");
// Independently compare every packed vertex and face to decompressed CNK0 data.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
function parseChunk(data) {
  let offset = 8;
  assert.equal(data.toString("ascii", 0, 4), "CNK0");
  function u32() {
    const v = data.readUInt32LE(offset);
    offset += 4;
    return v;
  }
  function i32() {
    const v = data.readInt32LE(offset);
    offset += 4;
    return v;
  }
  function skip(n) {
    offset += n;
    assert(offset <= data.length);
  }
  const tiles = [];
  for (let n = u32(); n > 0; n--) {
    const x = i32(),
      z = i32();
    skip(8);
    for (let e = u32(); e > 0; e--) {
      skip(4);
      for (let f = u32(); f > 0; f--) skip(u32() * 8);
    }
    skip(12);
    skip(u32());
    skip(u32());
    tiles.push({ x, z });
  }
  skip(4);
  const heightSamples = u32();
  skip(heightSamples * 4);
  const ni = u32(),
    indicesOffset = offset;
  skip(ni * 2);
  const nv = u32(),
    verticesOffset = offset;
  skip(nv * 16);
  const batches = [];
  for (let n = u32(); n > 0; n--) {
    skip(4);
    batches.push({
      indexOffset: u32(),
      indexCount: u32(),
      vertexOffset: u32(),
      vertexCount: u32()
    });
  }
  return {
    tiles,
    heightSamples,
    ni,
    indicesOffset,
    nv,
    verticesOffset,
    batches
  };
}
function validate(directory, chunkDirectory) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, "manifest.json"))
  );
  let vertices = 0,
    faces = 0,
    heightSamples = 0;
  for (const tile of manifest.tiles) {
    const data = fs.readFileSync(path.join(chunkDirectory, tile.name + ".dec"));
    const c = parseChunk(data);
    const packed = zlib.gunzipSync(
      fs.readFileSync(path.join(directory, tile.file))
    );
    assert.equal(
      crypto.createHash("sha256").update(packed).digest("hex"),
      tile.sha256
    );
    assert.equal(c.nv, packed.readUInt32LE(4));
    const [, chunkZ, chunkX] = tile.name
      .match(/^Z1_(-?\d+)_(-?\d+)\.cnk0$/)
      .map(Number);
    const minX = Math.min(...c.tiles.map((t) => t.x)),
      minZ = Math.min(...c.tiles.map((t) => t.z));
    const starts = [...new Set(c.batches.map((b) => b.vertexOffset))].sort(
      (a, b) => a - b
    );
    let slice = 0;
    for (let i = 0; i < c.nv; i++) {
      while (slice + 1 < starts.length && i >= starts[slice + 1]) slice++;
      const t = c.tiles[slice],
        o = c.verticesOffset + i * 16;
      // ZONE header: tile_size=64, tile_height=1/32. Chunk names use tile units.
      const expected = [
        chunkX * 64 + (t.z - minZ) * 64 + data.readInt16LE(o),
        data.readInt16LE(o + 6) / 32,
        chunkZ * 64 + (t.x - minX) * 64 + data.readInt16LE(o + 2)
      ];
      for (let k = 0; k < 3; k++)
        assert.equal(
          packed.readFloatLE(16 + i * 12 + k * 4),
          expected[k],
          `${tile.name} vertex ${i} axis ${k}`
        );
    }
    let index = 0;
    for (const batch of c.batches) {
      for (let j = 0; j < batch.indexCount; j += 3) {
        for (const k of [2, 1, 0]) {
          const expected =
            data.readUInt16LE(
              c.indicesOffset + (batch.indexOffset + j + k) * 2
            ) + batch.vertexOffset;
          assert.equal(
            packed.readUInt32LE(16 + c.nv * 12 + index * 4),
            expected,
            `${tile.name} index ${index}`
          );
          index++;
        }
      }
    }
    assert.equal(index, packed.readUInt32LE(8));
    vertices += c.nv;
    faces += index / 3;
    heightSamples += c.heightSamples;
  }
  const report = {
    tiles: manifest.tiles.length,
    vertices,
    faces,
    heightSamples,
    allCoordinatesAndIndicesMatch: true
  };
  debug(JSON.stringify(report));
  return report;
}
if (require.main === module) {
  try {
    validate(...process.argv.slice(2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}
module.exports = { parseChunk, validate };
