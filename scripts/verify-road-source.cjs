const debug = require("debug")("h1emu:scripts:verify-road-source");
// Compare decoded collision triangles to independent LOD0 render geometry.
const fs = require("node:fs"),
  path = require("node:path"),
  zlib = require("node:zlib"),
  assert = require("node:assert/strict");
const root = process.argv[2],
  files = new Map();
for (const d of fs.readdirSync(root, { withFileTypes: true }))
  if (d.isDirectory())
    for (const n of fs.readdirSync(path.join(root, d.name)))
      if (/\.(adr|dme)$/i.test(n))
        files.set(n.toLowerCase(), path.join(root, d.name, n));
const data = JSON.parse(
  zlib.gunzipSync(fs.readFileSync("data/2016/roadSurfaces.json.gz"))
);
let vertices = 0,
  indices = 0,
  models = 0;
for (const [name, model] of Object.entries(data.models).filter(([name]) =>
  ["roadstraightslopeup_256.adr", "roadstraightslope_512.adr"].includes(name)
)) {
  const xml = fs.readFileSync(files.get(name), "utf8"),
    base = xml.match(/<Base\s+fileName="([^"]+)"/)[1];
  const b = fs.readFileSync(files.get(base.toLowerCase()));
  assert.equal(b.toString("ascii", 0, 4), "DMOD");
  assert.equal(b.readUInt32LE(4), 4);
  let o = 12 + b.readUInt32LE(8) + 24;
  const meshCount = b.readUInt32LE(o);
  o += 4;
  assert.equal(meshCount, 1, "Expected static single-mesh road");
  const streams = b.readUInt32LE(o + 16),
    indexSize = b.readUInt32LE(o + 20),
    ni = b.readUInt32LE(o + 24),
    nv = b.readUInt32LE(o + 28);
  o += 32;
  const collision = model.meshes[0];
  assert.equal(model.meshes.length, 1);
  assert.equal(collision.vertices.length, nv * 3);
  assert.equal(collision.indices.length, ni);
  for (let s = 0; s < streams; s++) {
    const stride = b.readUInt32LE(o);
    o += 4;
    if (s === 0) {
      assert(stride >= 12);
      for (let i = 0; i < nv; i++)
        for (let k = 0; k < 3; k++)
          assert.equal(
            collision.vertices[i * 3 + k],
            b.readFloatLE(o + i * stride + k * 4),
            `${name} vertex ${i}`
          );
    }
    o += stride * nv;
  }
  const render = Array.from({ length: ni }, (_, i) =>
    indexSize === 2 ? b.readUInt16LE(o + i * 2) : b.readUInt32LE(o + i * 4)
  );
  const canonical = (a) =>
    Array.from({ length: a.length / 3 }, (_, i) =>
      a
        .slice(i * 3, i * 3 + 3)
        .sort((x, y) => x - y)
        .join(",")
    ).sort();
  assert.deepEqual(
    canonical(collision.indices),
    canonical(render),
    `${name} triangle topology`
  );
  vertices += nv;
  indices += ni;
  models++;
}
const report = {
  models,
  vertices,
  triangles: indices / 3,
  collisionVerticesAndTriangleTopologyMatchLOD0: true
};
debug(JSON.stringify(report));
fs.writeFileSync(
  "road-source-validation.json",
  JSON.stringify(report, null, 2)
);
