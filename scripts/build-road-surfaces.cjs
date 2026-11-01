const debug = require("debug")("h1emu:scripts:build-road-surfaces");
// Extract real CDTA triangle collision data referenced by asphalt road actors.
const fs = require("node:fs"),
  path = require("node:path"),
  zlib = require("node:zlib"),
  crypto = require("node:crypto");
function readCollision(file) {
  const b = fs.readFileSync(file);
  let offset = 0;
  const u32 = () => {
    const v = b.readUInt32LE(offset);
    offset += 4;
    return v;
  };
  if (b.toString("ascii", 0, 4) !== "CDTA" || b.readUInt32LE(4) !== 1)
    throw Error("Unsupported CDTA: " + file);
  offset = 8;
  const collisionType = u32(),
    count = u32(),
    meshes = [];
  for (let m = 0; m < count; m++) {
    if (u32() !== 0) throw Error("Unsupported collision shape: " + file);
    const nv = u32(),
      vertices = [];
    for (let i = 0; i < nv * 3; i++) {
      const v = b.readFloatLE(offset);
      offset += 4;
      if (!Number.isFinite(v)) throw Error("Invalid vertex");
      vertices.push(v);
    }
    const nt = u32(),
      indices = [];
    for (let i = 0; i < nt * 3; i++) {
      const index = b.readUInt16LE(offset);
      offset += 2;
      if (index >= nv) throw Error("Invalid index");
      indices.push(index);
    }
    const cookedSize = u32();
    if (b.toString("ascii", offset, offset + 3) !== "NXS")
      throw Error("Missing cooked PhysX data");
    offset += cookedSize;
    if (offset > b.length) throw Error("Collision length mismatch");
    meshes.push({ vertices, indices });
  }
  if (offset !== b.length) throw Error("Unparsed collision data: " + file);
  return {
    collisionType,
    meshes,
    sha256: crypto.createHash("sha256").update(b).digest("hex")
  };
}
function zoneRoads(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(4) !== 4) throw Error("Expected ZONE v4");
  let offset = b.readUInt32LE(24);
  const count = b.readUInt32LE(offset);
  offset += 4;
  const roads = [];
  for (let i = 0; i < count; i++) {
    const end = b.indexOf(0, offset),
      actor = b.toString("utf8", offset, end);
    offset = end + 1;
    const n = b.readUInt32LE(offset + 4);
    offset += 8;
    for (let j = 0; j < n; j++) {
      if (/^Road/i.test(actor))
        roads.push({
          actor,
          position: [0, 4, 8].map((k) => b.readFloatLE(offset + k)),
          rotation: [16, 20, 24].map((k) => b.readFloatLE(offset + k)),
          scale: [32, 36, 40].map((k) => b.readFloatLE(offset + k)),
          id: b.readUInt32LE(offset + 48)
        });
      offset += 77;
    }
  }
  if (offset !== b.readUInt32LE(28))
    throw Error("ZONE object section mismatch");
  return roads;
}
function transform(p, instance) {
  const [yaw, pitch, roll] = instance.rotation;
  let [x, y, z] = p.map((v, k) => v * instance.scale[k]);
  [x, y] = [
    Math.cos(roll) * x - Math.sin(roll) * y,
    Math.sin(roll) * x + Math.cos(roll) * y
  ];
  [y, z] = [
    Math.cos(pitch) * y - Math.sin(pitch) * z,
    Math.sin(pitch) * y + Math.cos(pitch) * z
  ];
  [x, z] = [
    Math.cos(yaw) * x + Math.sin(yaw) * z,
    -Math.sin(yaw) * x + Math.cos(yaw) * z
  ];
  return [
    x + instance.position[0],
    y + instance.position[1],
    z + instance.position[2]
  ];
}
function build(assetDirectory, zoneFile, output) {
  const files = new Map();
  for (const dir of fs.readdirSync(assetDirectory, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const name of fs.readdirSync(path.join(assetDirectory, dir.name))) {
      if (/\.(adr|cdt|dme)$/i.test(name))
        files.set(
          name.toLowerCase(),
          path.join(assetDirectory, dir.name, name)
        );
    }
  }
  const models = {},
    instances = [],
    skipped = new Set();
  for (const instance of zoneRoads(zoneFile)) {
    const key = instance.actor.toLowerCase();
    if (!(key in models)) {
      const adr = files.get(key);
      if (!adr) throw Error("Missing road ADR: " + key);
      const xml = fs.readFileSync(adr, "utf8");
      if (!/<MaterialType\s+type="ASPHALT"/i.test(xml)) {
        models[key] = null;
        skipped.add(key);
        continue;
      }
      const collision = xml.match(/<CollisionData\s+fileName="([^"]+)"/i)?.[1];
      if (!collision) {
        models[key] = null;
        skipped.add(key);
        continue;
      }
      const collisionFile = files.get(collision.toLowerCase());
      if (!collisionFile) throw Error("Missing road collision: " + collision);
      const model = readCollision(collisionFile),
        type = Number(xml.match(/<CollisionType\s+type="(\d+)"/)?.[1]);
      if (type !== model.collisionType)
        throw Error("ADR/CDTA collision type mismatch");
      models[key] = {
        ...model,
        collision,
        adrSha256: crypto.createHash("sha256").update(xml).digest("hex")
      };
    }
    if (!models[key]) continue;
    const bounds = [
      Infinity,
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
      -Infinity
    ];
    for (const mesh of models[key].meshes)
      for (let i = 0; i < mesh.vertices.length; i += 3) {
        const v = transform(mesh.vertices.slice(i, i + 3), instance);
        for (let k = 0; k < 3; k++) {
          bounds[k] = Math.min(bounds[k], v[k]);
          bounds[k + 3] = Math.max(bounds[k + 3], v[k]);
        }
      }
    instances.push({ ...instance, bounds });
  }
  const data = {
    version: 1,
    source:
      "ZONE v4 placements and ADR-referenced CDTA v1 triangle collision meshes",
    zoneSha256: crypto
      .createHash("sha256")
      .update(fs.readFileSync(zoneFile))
      .digest("hex"),
    models: Object.fromEntries(Object.entries(models).filter(([, v]) => v)),
    instances
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, zlib.gzipSync(JSON.stringify(data)));
  console.log(
    JSON.stringify({
      models: Object.keys(data.models).length,
      instances: instances.length,
      skipped: [...skipped],
      bytes: fs.statSync(output).size
    })
  );
  return data;
}
module.exports = { readCollision, zoneRoads, transform, build };
if (require.main === module) {
  try {
    build(...process.argv.slice(2));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}
