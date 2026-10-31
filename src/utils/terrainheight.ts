import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";

interface TerrainTileInfo {
  name: string;
  file: string;
  bounds: number[];
  vertices: number;
  triangles: number;
  sha256: string;
}

interface TerrainTile {
  vertices: Float32Array;
  indices: Uint32Array;
  bins: Map<string, number[]>;
}

/** Exact vertical intersection with exported CNK0 triangles. No extrapolation. */
export class TerrainHeight {
  private readonly tileBins = new Map<string, TerrainTileInfo[]>();
  private readonly cache = new Map<string, TerrainTile>();
  // Small queried cells survive tile eviction, so NPCs spread over the map
  // do not continually decompress each other's tiles on every movement tick.
  private readonly cellCache = new Map<string, Float32Array>();
  private readonly tileBinSize = 256;
  private readonly triangleBinSize = 8;
  readonly tiles: TerrainTileInfo[];

  constructor(
    private readonly directory: string,
    private readonly cacheSize = 32
  ) {
    const manifest = JSON.parse(
      readFileSync(join(directory, "manifest.json"), "utf8")
    );
    if (
      manifest.version !== 1 ||
      !Array.isArray(manifest.tiles) ||
      !manifest.tiles.length ||
      cacheSize < 1
    ) {
      throw new Error("Invalid terrain manifest or cache size");
    }
    this.tiles = manifest.tiles;
    for (const tile of this.tiles) {
      if (
        !/^\d+\.bin\.gz$/.test(tile.file) ||
        tile.bounds.length !== 6 ||
        !tile.bounds.every(Number.isFinite)
      ) {
        throw new Error("Invalid terrain tile metadata");
      }
      this.eachBin(
        tile.bounds[0],
        tile.bounds[2],
        tile.bounds[3],
        tile.bounds[5],
        this.tileBinSize,
        (key) => {
          const list = this.tileBins.get(key) ?? [];
          list.push(tile);
          this.tileBins.set(key, list);
        }
      );
    }
  }

  private eachBin(
    minX: number,
    minZ: number,
    maxX: number,
    maxZ: number,
    size: number,
    visit: (key: string) => void
  ) {
    for (let x = Math.floor(minX / size); x <= Math.floor(maxX / size); x++) {
      for (let z = Math.floor(minZ / size); z <= Math.floor(maxZ / size); z++)
        visit(`${x},${z}`);
    }
  }

  private loadTile(info: TerrainTileInfo): TerrainTile {
    const cached = this.cache.get(info.file);
    if (cached) {
      this.cache.delete(info.file);
      this.cache.set(info.file, cached);
      return cached;
    }
    const data = gunzipSync(readFileSync(join(this.directory, info.file)));
    const nv = data.readUInt32LE(4),
      ni = data.readUInt32LE(8);
    if (
      data.toString("ascii", 0, 4) !== "TRI1" ||
      nv !== info.vertices ||
      ni !== info.triangles * 3 ||
      data.length !== 16 + nv * 12 + ni * 4 ||
      createHash("sha256").update(data).digest("hex") !== info.sha256
    ) {
      throw new Error(`Invalid terrain tile ${info.file}`);
    }
    const vertices = new Float32Array(nv * 3);
    const indices = new Uint32Array(ni);
    for (let i = 0; i < vertices.length; i++)
      vertices[i] = data.readFloatLE(16 + i * 4);
    for (let i = 0; i < indices.length; i++) {
      indices[i] = data.readUInt32LE(16 + nv * 12 + i * 4);
      if (indices[i] >= nv) throw new Error("Invalid terrain triangle index");
    }
    const tile: TerrainTile = { vertices, indices, bins: new Map() };
    if (this.cache.size >= this.cacheSize)
      this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(info.file, tile);
    return tile;
  }

  /** Index only the requested cell; rebuilding every bin on distant tile
   * cache misses used to block all NPC movement on the shared JS thread. */
  private trianglesForCell(
    tile: TerrainTile,
    x: number,
    z: number,
    key: string
  ) {
    const cached = tile.bins.get(key);
    if (cached) return cached;
    const minX = Math.floor(x / this.triangleBinSize) * this.triangleBinSize;
    const minZ = Math.floor(z / this.triangleBinSize) * this.triangleBinSize;
    const maxX = minX + this.triangleBinSize;
    const maxZ = minZ + this.triangleBinSize;
    const { vertices: v, indices } = tile;
    const matches: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3,
        b = indices[i + 1] * 3,
        c = indices[i + 2] * 3;
      if (
        Math.max(v[a], v[b], v[c]) < minX ||
        Math.min(v[a], v[b], v[c]) > maxX ||
        Math.max(v[a + 2], v[b + 2], v[c + 2]) < minZ ||
        Math.min(v[a + 2], v[b + 2], v[c + 2]) > maxZ
      )
        continue;
      matches.push(i);
    }
    tile.bins.set(key, matches);
    return matches;
  }

  /** Null means no triangle at this X/Z; never invent a height for a hole. */
  getHeight(x: number, z: number): number | null {
    return this.getSurface(x, z)?.height ?? null;
  }

  /** Same upper triangle as getHeight, including its exact plane derivatives. */
  getSurface(x: number, z: number) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    const key = `${Math.floor(x / this.triangleBinSize)},${Math.floor(z / this.triangleBinSize)}`;
    let triangles = this.cellCache.get(key);
    if (!triangles) {
      triangles = this.loadCell(x, z, key);
      if (this.cellCache.size >= 8192)
        this.cellCache.delete(this.cellCache.keys().next().value!);
    } else {
      this.cellCache.delete(key);
    }
    this.cellCache.set(key, triangles);
    let selected: { height: number; slopeX: number; slopeZ: number } | null =
      null;
    for (let i = 0; i < triangles.length; i += 9) {
      const v = triangles,
        a = i,
        b = i + 3,
        c = i + 6;
      const bx = v[b] - v[a],
        bz = v[b + 2] - v[a + 2];
      const cx = v[c] - v[a],
        cz = v[c + 2] - v[a + 2];
      const det = bx * cz - bz * cx;
      if (det === 0) continue;
      const dx = x - v[a],
        dz = z - v[a + 2];
      const u = (dx * cz - dz * cx) / det;
      const w = (bx * dz - bz * dx) / det;
      // Barycentric roundoff tolerance, not a world-space height offset.
      if (u < -1e-9 || w < -1e-9 || u + w > 1 + 1e-9) continue;
      const y =
        v[a + 1] + u * (v[b + 1] - v[a + 1]) + w * (v[c + 1] - v[a + 1]);
      if (!selected || y > selected.height)
        selected = {
          height: y,
          slopeX:
            ((v[b + 1] - v[a + 1]) * cz - bz * (v[c + 1] - v[a + 1])) / det,
          slopeZ:
            (bx * (v[c + 1] - v[a + 1]) - (v[b + 1] - v[a + 1]) * cx) / det
        };
    }
    return selected;
  }

  private loadCell(x: number, z: number, key: string): Float32Array {
    const minX = Math.floor(x / this.triangleBinSize) * this.triangleBinSize;
    const minZ = Math.floor(z / this.triangleBinSize) * this.triangleBinSize;
    const candidates =
      this.tileBins.get(
        `${Math.floor(x / this.tileBinSize)},${Math.floor(z / this.tileBinSize)}`
      ) ?? [];
    const triangles: number[] = [];
    for (const info of candidates) {
      const bounds = info.bounds;
      if (
        minX + this.triangleBinSize < bounds[0] ||
        minX > bounds[3] ||
        minZ + this.triangleBinSize < bounds[2] ||
        minZ > bounds[5]
      )
        continue;
      const tile = this.loadTile(info);
      const { vertices: v, indices } = tile;
      for (const i of this.trianglesForCell(tile, x, z, key)) {
        const a = indices[i] * 3,
          b = indices[i + 1] * 3,
          c = indices[i + 2] * 3;
        triangles.push(
          v[a],
          v[a + 1],
          v[a + 2],
          v[b],
          v[b + 1],
          v[b + 2],
          v[c],
          v[c + 1],
          v[c + 2]
        );
      }
    }
    return new Float32Array(triangles);
  }

  /** Diagnostic-only exact intersection provenance; the movement lookup is unchanged. */
  inspectHeight(x: number, z: number) {
    const height = this.getHeight(x, z);
    const tiles = this.tiles.filter(
      (t) =>
        x >= t.bounds[0] &&
        x <= t.bounds[3] &&
        z >= t.bounds[2] &&
        z <= t.bounds[5]
    );
    let selected: { name: string; triangle: number; height: number } | null =
      null;
    for (const info of tiles) {
      const tile = this.loadTile(info);
      const { vertices: v, indices } = tile;
      const key = `${Math.floor(x / this.triangleBinSize)},${Math.floor(z / this.triangleBinSize)}`;
      for (const i of this.trianglesForCell(tile, x, z, key)) {
        const a = indices[i] * 3,
          b = indices[i + 1] * 3,
          c = indices[i + 2] * 3;
        const bx = v[b] - v[a],
          bz = v[b + 2] - v[a + 2],
          cx = v[c] - v[a],
          cz = v[c + 2] - v[a + 2];
        const det = bx * cz - bz * cx;
        if (det === 0) continue;
        const u = ((x - v[a]) * cz - (z - v[a + 2]) * cx) / det;
        const w = (bx * (z - v[a + 2]) - bz * (x - v[a])) / det;
        if (u < -1e-9 || w < -1e-9 || u + w > 1 + 1e-9) continue;
        const y =
          v[a + 1] + u * (v[b + 1] - v[a + 1]) + w * (v[c + 1] - v[a + 1]);
        if (!selected || y > selected.height)
          selected = { name: info.name, triangle: i / 3, height: y };
      }
    }
    return {
      height,
      selected,
      failedQuery: height === null,
      tiles: tiles.map((t) => ({ name: t.name, bounds: t.bounds }))
    };
  }
}
