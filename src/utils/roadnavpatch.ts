import { createHash } from "node:crypto";
import {
  DetourTileCacheParams,
  Raw,
  statusSucceed,
  TileCache,
  TileCacheMeshProcess,
  UnsignedCharArray
} from "recast-navigation";

export interface RoadNavPatch {
  version: number;
  baseCacheSha256: string;
  baseLayerSha256: string;
  roadCollisionSha256: string;
  tile: { x: number; z: number; layer: number; ref: number };
  replacement: string;
  addition: { ref: number; data: string };
  fineCache: string;
}

const sha256 = (data: Uint8Array) =>
  createHash("sha256").update(data).digest("hex");

const roadCacheResources = new WeakMap<TileCache, object>();

/** The fine road grid requires a larger scratch allocator than the importer's
 * default coarse-tile allocation. Existing world-cache settings are untouched. */
export function createRoadNavCache(
  patch: RoadNavPatch,
  process: TileCacheMeshProcess
): TileCache {
  const bytes = Buffer.from(patch.fineCache, "base64");
  if (
    bytes.length < 156 ||
    bytes.readUInt32LE(0) !== 0x54534554 ||
    bytes.readUInt32LE(8) !== 1 ||
    bytes.readUInt32LE(96) !== bytes.length - 100
  )
    throw new Error("Invalid precise road cache");
  if (
    bytes.readInt32LE(108) !== patch.tile.x ||
    bytes.readInt32LE(112) !== patch.tile.z ||
    bytes.readInt32LE(116) !== patch.tile.layer + 1
  )
    throw new Error("Precise road cache is outside the approved tile");
  const width = bytes.readInt32LE(60),
    height = bytes.readInt32LE(64);
  if (width <= 0 || width > 255 || height <= 0 || height > 255)
    throw new Error("Invalid precise road cache dimensions");
  const params = DetourTileCacheParams.create({
    orig: [0, 1, 2].map((k) => bytes.readFloatLE(40 + k * 4)),
    cs: bytes.readFloatLE(52),
    ch: bytes.readFloatLE(56),
    width,
    height,
    walkableHeight: bytes.readFloatLE(68),
    walkableRadius: bytes.readFloatLE(72),
    walkableClimb: bytes.readFloatLE(76),
    maxSimplificationError: bytes.readFloatLE(80),
    maxTiles: bytes.readInt32LE(84),
    maxObstacles: bytes.readInt32LE(88)
  });
  const allocator = new Raw.Module.RecastLinearAllocator(width * height * 64);
  const compressor = new Raw.Module.RecastFastLZCompressor();
  const data = new UnsignedCharArray();
  data.copy(bytes.subarray(100));
  const cache = new TileCache();
  if (
    !cache.init(params, allocator, compressor, process) ||
    !statusSucceed(cache.addTile(data).status)
  )
    throw new Error("Could not initialise precise road cache");
  roadCacheResources.set(cache, { params, allocator, compressor, data });
  return cache;
}

/** Add the reviewed road layer without rewriting the original navigation files.
 * All other compressed tiles and cache parameters remain byte-for-byte intact.
 */
export function applyRoadNavPatch(
  input: Uint8Array,
  patch: RoadNavPatch,
  roadCollision: Uint8Array
): Uint8Array {
  const cache = Buffer.from(input);
  if (
    patch.version !== 1 ||
    sha256(cache) !== patch.baseCacheSha256 ||
    sha256(roadCollision) !== patch.roadCollisionSha256 ||
    cache.readUInt32LE(0) !== 0x54534554 ||
    cache.readUInt32LE(4) !== 1
  )
    throw new Error("Road navigation patch does not match its source data");

  const replacement = Buffer.from(patch.replacement, "base64");
  const addition = Buffer.from(patch.addition.data, "base64");
  if (
    replacement.length < 56 ||
    addition.length < 56 ||
    replacement.readInt32LE(8) !== patch.tile.x ||
    replacement.readInt32LE(12) !== patch.tile.z ||
    replacement.readInt32LE(16) !== patch.tile.layer ||
    addition.readInt32LE(8) !== patch.tile.x ||
    addition.readInt32LE(12) !== patch.tile.z ||
    addition.readInt32LE(16) !== patch.tile.layer + 1
  )
    throw new Error("Invalid road navigation patch layers");

  const header = Buffer.from(cache.subarray(0, 92));
  const count = cache.readUInt32LE(8);
  const chunks: Buffer[] = [header];
  let offset = 92,
    replaced = false;
  for (let i = 0; i < count; i++) {
    const start = offset;
    const ref = cache.readUInt32LE(offset);
    const size = cache.readUInt32LE(offset + 4);
    offset += 8;
    if (size < 56 || offset + size > cache.length || ref === patch.addition.ref)
      throw new Error("Invalid road navigation cache record");
    const layer = cache.subarray(offset, offset + size);
    if (ref === patch.tile.ref) {
      if (
        replaced ||
        sha256(layer) !== patch.baseLayerSha256 ||
        !layer.subarray(0, 54).equals(replacement.subarray(0, 54))
      )
        throw new Error(
          "Road navigation patch would change the existing layer header"
        );
      const record = Buffer.alloc(8);
      record.writeUInt32LE(ref, 0);
      record.writeUInt32LE(replacement.length, 4);
      chunks.push(record, replacement);
      replaced = true;
    } else chunks.push(cache.subarray(start, offset + size));
    offset += size;
  }
  if (!replaced || offset !== cache.length)
    throw new Error("Road navigation patch source layer is missing");
  header.writeUInt32LE(count + 1, 8);
  const record = Buffer.alloc(8);
  record.writeUInt32LE(patch.addition.ref, 0);
  record.writeUInt32LE(addition.length, 4);
  chunks.push(record, addition);
  return Buffer.concat(chunks);
}
