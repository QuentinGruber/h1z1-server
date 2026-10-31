const debug = require("debug")("h1emu:scripts:build-terrain");
// Pack the original OBJ triangles, without resampling or changing coordinates.
// Usage: node scripts/build-terrain.cjs <terrain.obj[.gz]> <output-directory>
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const readline = require("node:readline");
const crypto = require("node:crypto");

async function build(source, directory) {
  if (!source || !directory)
    throw Error("Expected source OBJ and output directory");
  fs.mkdirSync(directory, { recursive: true });
  if (fs.existsSync(path.join(directory, "manifest.json")))
    throw Error("Output already has a manifest; use a new directory");
  const raw = fs.createReadStream(source);
  const input = source.endsWith(".gz") ? raw.pipe(zlib.createGunzip()) : raw;
  raw.on("error", (e) => input.destroy(e));
  const hash = crypto.createHash("sha256");
  input.on("data", (b) => hash.update(b));
  const tiles = [];
  let name = "",
    vertices = [],
    indices = [],
    base = 0,
    totalVertices = 0;
  let skippedObjects = 0;
  function flush() {
    if (!name || !indices.length) return;
    const bounds = [
      Infinity,
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
      -Infinity
    ];
    for (let i = 0; i < vertices.length; i++) {
      const k = i % 3;
      bounds[k] = Math.min(bounds[k], vertices[i]);
      bounds[k + 3] = Math.max(bounds[k + 3], vertices[i]);
    }
    const data = Buffer.alloc(16 + (vertices.length + indices.length) * 4);
    data.write("TRI1");
    data.writeUInt32LE(vertices.length / 3, 4);
    data.writeUInt32LE(indices.length, 8);
    data.writeUInt32LE(0, 12);
    vertices.forEach((v, i) => data.writeFloatLE(v, 16 + i * 4));
    indices.forEach((v, i) =>
      data.writeUInt32LE(v, 16 + vertices.length * 4 + i * 4)
    );
    const file = `${tiles.length}.bin.gz`;
    fs.writeFileSync(path.join(directory, file), zlib.gzipSync(data));
    tiles.push({
      name,
      file,
      bounds,
      vertices: vertices.length / 3,
      triangles: indices.length / 3,
      sha256: crypto.createHash("sha256").update(data).digest("hex")
    });
  }
  for await (const line of readline.createInterface({
    input,
    crlfDelay: Infinity
  })) {
    if (line.startsWith("o ")) {
      flush();
      name = line.slice(2).trim();
      // Terrain only: roofs, trees and decorative meshes are not heightmaps.
      if (!/^Z1_-?\d+_-?\d+\.cnk0$/.test(name)) {
        skippedObjects++;
        name = "";
      }
      vertices = [];
      indices = [];
      base = totalVertices;
    } else if (line.startsWith("v ")) {
      totalVertices++;
      if (!name) continue;
      const p = line.slice(2).trim().split(/\s+/).map(Number);
      if (
        p.length !== 3 ||
        !p.every(Number.isFinite) ||
        p.some((v) => Math.fround(v) !== v)
      )
        throw Error("Invalid or non-float32 vertex");
      vertices.push(...p);
    } else if (name && line.startsWith("f ")) {
      const face = line
        .slice(2)
        .trim()
        .split(/\s+/)
        .map((s) => Number(s.split("/")[0]));
      if (face.length !== 3) throw Error("Expected triangulated terrain");
      for (const index of face) {
        const local =
          index < 0 ? totalVertices + index - base : index - 1 - base;
        if (
          !Number.isInteger(local) ||
          local < 0 ||
          local >= vertices.length / 3
        )
          throw Error(`Invalid index in ${name}`);
        indices.push(local);
      }
    }
  }
  flush();
  if (!tiles.length) throw Error("No terrain triangles found");
  const manifest = {
    version: 1,
    coordinates: "game XYZ, Y up; unmodified OBJ coordinates",
    source: path.basename(source),
    sourceSha256: hash.digest("hex"),
    skippedObjects,
    tiles
  };
  fs.writeFileSync(
    path.join(directory, "manifest.json"),
    JSON.stringify(manifest)
  );
  debug(
    JSON.stringify({
      tiles: tiles.length,
      vertices: tiles.reduce((s, t) => s + t.vertices, 0),
      triangles: tiles.reduce((s, t) => s + t.triangles, 0),
      sourceSha256: manifest.sourceSha256,
      skippedObjects
    })
  );
}
if (require.main === module)
  build(...process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { build };
