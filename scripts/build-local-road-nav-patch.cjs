// Offline, scoped cache repair. Existing layer heights/areas are immutable.
const fs = require("node:fs"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict");
const debug = require("debug")("h1emu:road-nav-patch");
const { RoadSurfaces } = require("../out/utils/roadsurfaces");
const R = require("recast-navigation");
function decode(input, size) {
  const out = Buffer.alloc(size);
  const level = (input[0] >> 5) + 1;
  assert.ok(level === 1 || level === 2);
  let ip = 1,
    op = 0,
    c = input[0] & 31;
  for (;;) {
    if (c >= 32) {
      let n = (c >> 5) - 1,
        ref = op - ((c & 31) << 8) - 1;
      if (n === 6) {
        let extension;
        do {
          extension = input[ip++];
          n += extension;
        } while (level === 2 && extension === 255);
      }
      const low = input[ip++];
      ref -= low;
      if (level === 2 && low === 255 && (c & 31) === 31)
        ref = op - ((input[ip++] << 8) + input[ip++]) - 8192;
      n += 3;
      assert.ok(ref >= 0 && op + n <= size);
      while (n--) out[op++] = out[ref++];
    } else {
      const n = c + 1;
      assert.ok(ip + n <= input.length && op + n <= size);
      input.copy(out, op, ip, ip + n);
      ip += n;
      op += n;
    }
    if (ip >= input.length) break;
    c = input[ip++];
  }
  assert.equal(op, size);
  return out;
}
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
async function main() {
  await R.init();
  const base = Buffer.concat([
    fs.readFileSync("data/2016/navData/z1_cache_0.bin"),
    fs.readFileSync("data/2016/navData/z1_cache_1.bin")
  ]);
  const cs = base.readFloatLE(52),
    ch = base.readFloatLE(56),
    climb = Math.floor(base.readFloatLE(76) / ch + 0.001),
    records = [];
  let offset = 92,
    maxRef = 0;
  for (let i = 0; i < base.readUInt32LE(8); i++) {
    const ref = base.readUInt32LE(offset),
      size = base.readUInt32LE(offset + 4),
      data = base.subarray(offset + 8, offset + 8 + size);
    records.push({ ref, data });
    maxRef = Math.max(maxRef, ref);
    offset += 8 + size;
  }
  assert.equal(offset, base.length);
  const target = records.find(
    (t) =>
      t.data.readInt32LE(8) === 27 &&
      t.data.readInt32LE(12) === 24 &&
      t.data.readInt32LE(16) === 0
  );
  assert.ok(target);
  const header = target.data.subarray(0, 56),
    width = header[48],
    height = header[49],
    cells = width * height,
    original = decode(target.data.subarray(56), cells * 3),
    changed = Buffer.from(original),
    road = Buffer.alloc(cells * 3);
  road.fill(255, 0, cells);
  const min = [0, 1, 2].map((k) => header.readFloatLE(20 + k * 4)),
    roads = new RoadSurfaces("data/2016/roadSurfaces.json.gz"),
    roadId = 2777289806;
  let added = 0;
  for (let z = 0; z < height; z++)
    for (let x = 0; x < width; x++) {
      const wx = min[0] + (x + 0.5) * cs,
        wz = min[2] + (z + 0.5) * cs,
        sample = roads.getSample(wx, wz);
      if (sample?.instanceId !== roadId) continue;
      if (
        ![-1, 1].every((sx) =>
          [-1, 1].every(
            (sz) =>
              roads.getSample(wx + sx * cs * 0.5, wz + sz * cs * 0.5)
                ?.instanceId === roadId
          )
        )
      )
        continue;
      const h = Math.round((sample.height - min[1]) / ch);
      assert.ok(h >= 0 && h < 255);
      const i = x + z * width;
      road[i] = h;
      road[cells + i] = 63;
      added++;
    }
  const dirs = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1]
  ];
  let portalPairs = 0;
  const edits = [];
  for (let z = 0; z < height; z++)
    for (let x = 0; x < width; x++) {
      const i = x + z * width;
      if (road[cells + i] === 0) continue;
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0],
          nz = z + dirs[d][1];
        if (nx < 0 || nz < 0 || nx >= width || nz >= height) {
          road[cells * 2 + i] |= 1 << (d + 4);
          continue;
        }
        const j = nx + nz * width;
        if (road[cells + j] && Math.abs(road[i] - road[j]) <= climb) {
          road[cells * 2 + i] |= 1 << d;
          continue;
        }
        if (
          !road[cells + j] &&
          original[cells + j] &&
          Math.abs(road[i] - original[j]) <= climb
        ) {
          const opposite = (d + 2) & 3;
          road[cells * 2 + i] |= 1 << (d + 4);
          changed[cells * 2 + j] =
            (changed[cells * 2 + j] & ~(1 << opposite)) | (1 << (opposite + 4));
          changed[cells * 2 + i] &= ~(1 << d);
          portalPairs++;
        }
      }
    }
  assert.ok(added > 0 && portalPairs > 0);
  assert.deepEqual(
    changed.subarray(0, cells * 2),
    original.subarray(0, cells * 2),
    "existing terrain height/area arrays changed"
  );
  for (let i = 0; i < cells; i++)
    if (changed[cells * 2 + i] !== original[cells * 2 + i])
      edits.push({
        cell: i,
        before: original[cells * 2 + i],
        after: changed[cells * 2 + i]
      });
  function encode(data, layer, gridWidth = width, gridHeight = height) {
    const gridCells = gridWidth * gridHeight;
    const h = new R.Raw.Module.dtTileCacheLayerHeader();
    h.magic = header.readInt32LE(0);
    h.version = header.readInt32LE(4);
    h.tx = 27;
    h.ty = 24;
    h.tlayer = layer;
    for (let k = 0; k < 3; k++) {
      h.set_bmin(k, header.readFloatLE(20 + k * 4));
      h.set_bmax(k, header.readFloatLE(32 + k * 4));
    }
    h.hmin = header.readUInt16LE(44);
    h.hmax = header.readUInt16LE(46);
    h.width = gridWidth;
    h.height = gridHeight;
    h.minx = header[50];
    h.maxx = header[51];
    h.miny = header[52];
    h.maxy = header[53];
    if (gridWidth !== width) {
      h.minx = 0;
      h.maxx = gridWidth - 1;
      h.miny = 0;
      h.maxy = gridHeight - 1;
      const maximum = Math.max(
        ...data.subarray(0, gridCells).filter((v) => v !== 255)
      );
      h.hmax = h.hmin + maximum;
      h.set_bmax(1, min[1] + maximum * ch);
    }
    const arrays = [0, 1, 2].map((k) => {
        const a = new R.UnsignedCharArray();
        a.copy(data.subarray(k * gridCells, (k + 1) * gridCells));
        return a;
      }),
      output = new R.UnsignedCharArray(),
      comp = new R.Raw.Module.RecastFastLZCompressor();
    try {
      const status = R.buildTileCacheLayer(comp, h, ...arrays, output);
      assert.ok(R.statusSucceed(status));
      const out = Buffer.from(output.toTypedArray());
      assert.deepEqual(
        decode(out.subarray(56), gridCells * 3),
        data,
        "native compression round trip failed"
      );
      return out;
    } finally {
      for (const a of arrays) a.destroy();
      output.destroy();
      R.Raw.destroy(h);
      R.Raw.destroy(comp);
    }
  }
  const replacement = encode(changed, 0),
    addition = encode(road, 1),
    head = Buffer.from(base.subarray(0, 92));
  head.writeUInt32LE(records.length + 1, 8);
  const chunks = [head];
  for (const record of [...records, { ref: maxRef + 1, data: addition }]) {
    const data = record === target ? replacement : record.data,
      h = Buffer.alloc(8);
    h.writeUInt32LE(record.ref);
    h.writeUInt32LE(data.length, 4);
    chunks.push(h, data);
  }
  const patched = Buffer.concat(chunks);
  const scale = 3,
    fw = width * scale,
    fh = height * scale,
    fc = fw * fh,
    fine = Buffer.alloc(fc * 3);
  fine.fill(255, 0, fc);
  for (let z = 0; z < fh; z++)
    for (let x = 0; x < fw; x++) {
      const coarse = Math.floor(x / scale) + Math.floor(z / scale) * width;
      if (!road[cells + coarse]) continue;
      const sample = roads.getSample(
        min[0] + ((x + 0.5) * cs) / scale,
        min[2] + ((z + 0.5) * cs) / scale
      );
      assert.equal(sample.instanceId, roadId);
      const i = x + z * fw;
      fine[i] = Math.round((sample.height - min[1]) / ch);
      fine[fc + i] = 63;
    }
  for (let z = 0; z < fh; z++)
    for (let x = 0; x < fw; x++) {
      const i = x + z * fw;
      if (!fine[fc + i]) continue;
      const coarse = Math.floor(x / scale) + Math.floor(z / scale) * width;
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0],
          nz = z + dirs[d][1];
        if (
          nx >= 0 &&
          nz >= 0 &&
          nx < fw &&
          nz < fh &&
          fine[fc + nx + nz * fw] &&
          Math.abs(fine[i] - fine[nx + nz * fw]) <= climb
        )
          fine[fc * 2 + i] |= 1 << d;
        else if (road[cells * 2 + coarse] & (1 << (d + 4)))
          fine[fc * 2 + i] |= 1 << (d + 4);
      }
    }
  const fineLayer = encode(fine, 1, fw, fh),
    fineHeader = Buffer.from(base.subarray(0, 92));
  fineHeader.writeUInt32LE(1, 8);
  fineHeader.writeFloatLE(cs / scale, 52);
  fineHeader.writeInt32LE(fw, 60);
  fineHeader.writeInt32LE(fh, 64);
  const fineRecord = Buffer.alloc(8);
  fineRecord.writeUInt32LE(maxRef + 1);
  fineRecord.writeUInt32LE(fineLayer.length, 4);
  const fineCache = Buffer.concat([fineHeader, fineRecord, fineLayer]);
  const manifest = {
    version: 1,
    baseCacheSha256: hash(base),
    baseLayerSha256: hash(target.data),
    existingHeightsSha256: hash(original.subarray(0, cells)),
    existingAreasSha256: hash(original.subarray(cells, cells * 2)),
    roadCollisionSha256: hash(
      fs.readFileSync("data/2016/roadSurfaces.json.gz")
    ),
    tile: {
      x: 27,
      z: 24,
      layer: 0,
      ref: target.ref,
      boundsMin: min,
      boundsMax: [0, 1, 2].map((k) => header.readFloatLE(32 + k * 4))
    },
    roadInstanceId: roadId,
    cellSize: cs,
    cellHeight: ch,
    fineCellSize: cs / scale,
    fineRoadCells: added * scale * scale,
    fineCache: fineCache.toString("base64"),
    addedRoadCells: added,
    portalPairs,
    connectivityEdits: edits,
    replacement: replacement.toString("base64"),
    addition: { ref: maxRef + 1, data: addition.toString("base64") }
  };
  fs.writeFileSync(
    "/results/npc-road-nav-patch.json",
    JSON.stringify(manifest, null, 2)
  );
  fs.writeFileSync("/results/npc-patched-cache.bin", patched);
  debug(
    "RESULT %s",
    JSON.stringify({
      added,
      portalPairs,
      changedConnectivityCells: edits.length,
      existingHeightBytesChanged: 0,
      existingAreaBytesChanged: 0,
      patchedBytes: patched.length
    })
  );
}
module.exports = { decode };
if (require.main === module)
  main().catch((e) => {
    debug("FAILED %s", e.stack);
    process.exitCode = 1;
  });
