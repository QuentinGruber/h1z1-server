const debug = require("debug")("h1emu:scripts:build-npc-collision-profiles");
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = process.argv[2];
if (!root)
  throw Error(
    "Usage: node scripts/build-npc-collision-profiles.cjs <extracted assets>"
  );
const files = new Map();
for (const d of fs.readdirSync(root, { withFileTypes: true }))
  if (d.isDirectory())
    for (const f of fs.readdirSync(path.join(root, d.name)))
      files.set(f.toLowerCase(), path.join(root, d.name, f));
const models = JSON.parse(fs.readFileSync("data/2016/dataSources/Models.json"));
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const result = {
  version: 1,
  notes:
    "Conservative LOD0 body envelopes, NOT decoded PhysX articulated shapes. Human capsule retains existing navigation dimensions. Mass/resistance/damage parameters are configurable balance approximations, not recovered game rules.",
  impact: {
    minimumSpeed: 0.5,
    maximumSpeed: 75,
    maximumSampleSeconds: 1,
    maximumClockSkewSeconds: 0.25,
    parkedDelayMs: 750,
    worldCollisionWindowMs: 250,
    npcDamagePerJoule: 0.5,
    vehicleDamagePerJoule: 0.02,
    rotationStepRadians: Math.PI / 36
  },
  npcs: {
    default: {
      species: "humanoid",
      bounds: [-0.3, 0, -0.3, 0.3, 2, 0.3],
      radius: 0.3,
      height: 2,
      mass: 80,
      resistance: 1,
      walkSpeedLimit: 1.5
    }
  },
  vehicles: {}
};
for (const [id, species, mass, resistance] of [
  [9002, "deer", 90, 1],
  [9253, "deer", 90, 1],
  [9003, "wolf", 45, 1],
  [9187, "bear", 250, 1.5],
  [9212, "rabbit", 2, 1],
  [10060, "offroader", 1500, 1],
  [9258, "pickup", 1900, 1],
  [9301, "policecar", 1600, 1],
  [9588, "atv", 300, 1]
]) {
  const model = models.find((m) => m.ID === id),
    adr = fs.readFileSync(files.get(model.MODEL_FILE_NAME.toLowerCase()));
  const base = adr.toString().match(/<Base\s+fileName="([^"]+)"/)[1],
    b = fs.readFileSync(files.get(base.toLowerCase()));
  if (b.toString("ascii", 0, 4) !== "DMOD" || b.readUInt32LE(4) !== 4)
    throw Error("Unsupported DME");
  const o = 12 + b.readUInt32LE(8),
    bounds = [0, 4, 8, 12, 16, 20].map(
      (k) => b.readFloatLE(o + k) * model.SCALE
    );
  if (
    !bounds.every(Number.isFinite) ||
    bounds.slice(0, 3).some((v, k) => v >= bounds[k + 3])
  )
    throw Error("Invalid DME bounds");
  const collision = adr
    .toString()
    .match(/<CollisionData\s+fileName="([^"]+)"/)[1];
  const p = {
    species,
    bounds,
    radius: Math.hypot(
      Math.max(Math.abs(bounds[0]), Math.abs(bounds[3])),
      Math.max(Math.abs(bounds[2]), Math.abs(bounds[5]))
    ),
    height: bounds[4] - bounds[1],
    mass,
    resistance,
    walkSpeedLimit: species === "wolf" ? 3 : 2,
    source: {
      actor: model.MODEL_FILE_NAME,
      mesh: base,
      collision,
      adrSha256: sha(adr),
      meshSha256: sha(b),
      collisionSha256: files.has(collision.toLowerCase())
        ? sha(fs.readFileSync(files.get(collision.toLowerCase())))
        : null
    }
  };
  if (id >= 9258 && [10060, 9258, 9301, 9588].includes(id)) {
    // Vehicle broad-phase bounds must also enclose roof corners when pitched
    // or rolled on hills. Crowd markers use footprint dimensions separately.
    p.radius = Math.hypot(
      p.radius,
      Math.max(Math.abs(bounds[1]), Math.abs(bounds[4]))
    );
    result.vehicles[id] = p;
  } else result.npcs[id] = p;
  debug(id, species, JSON.stringify(bounds));
}
fs.writeFileSync(
  "data/2016/npcCollisionProfiles.json",
  JSON.stringify(result, null, 2) + "\n"
);
