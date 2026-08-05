// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2021 - 2026 H1emu community
//
// ======================================================================

import { closeSync, openSync, readSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { NavigationRuntime } from "./navigationruntime";

const TSET_HEADER_BYTES = 92;
const TSET_ENTRY_BYTES = 8;
const TSET_MAGIC =
  ("T".charCodeAt(0) << 24) |
  ("S".charCodeAt(0) << 16) |
  ("E".charCodeAt(0) << 8) |
  "T".charCodeAt(0);

type CachePart = {
  path: string;
  fd: number;
  start: number;
  length: number;
};

export type TileCacheLayer = { offset: number; length: number };

export type MonolithicCacheIndex = {
  store: SplitTileCacheStore;
  layerCount: number;
  columns: Map<string, TileCacheLayer[]>;
  mesh: {
    orig: { x: number; y: number; z: number };
    tileWidth: number;
    tileHeight: number;
    maxTiles: number;
    maxPolys: number;
  };
  cache: {
    orig: number[];
    cs: number;
    ch: number;
    width: number;
    height: number;
    walkableHeight: number;
    walkableRadius: number;
    walkableClimb: number;
    maxSimplificationError: number;
    maxTiles: number;
    maxObstacles: number;
  };
  generatedMeshCapacity: { maxTiles: number; maxPolys: number };
  bytes: number;
};

export type MonolithicNavigation = {
  navMesh: InstanceType<NavigationRuntime["NavMesh"]>;
  tileCache: InstanceType<NavigationRuntime["TileCache"]>;
  allocator: any;
  compressor: any;
  meshProcess: InstanceType<NavigationRuntime["TileCacheMeshProcess"]>;
  layerCount: number;
  columnCount: number;
  bytes: number;
};

export function sortTileCacheParts(parts: string[]): string[] {
  return [...parts].sort((left, right) => {
    const leftIndex = Number(left.match(/_(\d+)\.bin$/)?.[1] ?? -1);
    const rightIndex = Number(right.match(/_(\d+)\.bin$/)?.[1] ?? -1);
    return leftIndex - rightIndex;
  });
}

export function selectMonolithic64ReferenceCapacity(layerCount: number): {
  meshMaxTiles: number;
  meshMaxPolys: number;
  cacheMaxTiles: number;
} {
  if (!Number.isSafeInteger(layerCount) || layerCount <= 0) {
    throw new Error(`[NAV] invalid monolithic layer count ${layerCount}`);
  }
  const maxTiles = 2 ** Math.ceil(Math.log2(layerCount));
  return {
    meshMaxTiles: maxTiles,
    meshMaxPolys: 1 << 20,
    cacheMaxTiles: maxTiles
  };
}

export class SplitTileCacheStore {
  readonly parts: CachePart[];
  readonly length: number;

  constructor(directory: string) {
    const names = sortTileCacheParts(
      readdirSync(directory).filter((name) => /^z1_cache_\d+\.bin$/.test(name))
    );
    if (!names.length) {
      throw new Error(`[NAV] no z1_cache_*.bin files found in ${directory}`);
    }
    let start = 0;
    this.parts = names.map((name) => {
      const path = join(directory, name);
      const length = statSync(path).size;
      const part = { path, fd: openSync(path, "r"), start, length };
      start += length;
      return part;
    });
    this.length = start;
  }

  read(offset: number, length: number): Buffer {
    if (offset < 0 || length < 0 || offset + length > this.length) {
      throw new Error(
        `[NAV] tilecache read outside store (${offset}+${length}/${this.length})`
      );
    }
    const output = Buffer.allocUnsafe(length);
    let outputOffset = 0;
    let sourceOffset = offset;
    while (outputOffset < length) {
      const part = this.parts.find(
        (candidate) =>
          sourceOffset >= candidate.start &&
          sourceOffset < candidate.start + candidate.length
      );
      if (!part) {
        throw new Error(`[NAV] no tilecache part for offset ${sourceOffset}`);
      }
      const localOffset = sourceOffset - part.start;
      const bytesToRead = Math.min(
        length - outputOffset,
        part.length - localOffset
      );
      const bytesRead = readSync(
        part.fd,
        output,
        outputOffset,
        bytesToRead,
        localOffset
      );
      if (bytesRead !== bytesToRead) {
        throw new Error(
          `[NAV] short tilecache read in ${part.path}: ${bytesRead}/${bytesToRead}`
        );
      }
      outputOffset += bytesRead;
      sourceOffset += bytesRead;
    }
    return output;
  }

  close(): void {
    for (const part of this.parts) closeSync(part.fd);
    this.parts.length = 0;
  }
}

export function indexMonolithicCache(directory: string): MonolithicCacheIndex {
  const store = new SplitTileCacheStore(directory);
  try {
    if (store.length < TSET_HEADER_BYTES) {
      throw new Error("[NAV] truncated tilecache header");
    }
    const header = store.read(0, TSET_HEADER_BYTES);
    let offset = 0;
    const readInt = () => {
      const value = header.readInt32LE(offset);
      offset += 4;
      return value;
    };
    const readFloat = () => {
      const value = header.readFloatLE(offset);
      offset += 4;
      return value;
    };

    if (readInt() !== TSET_MAGIC) {
      throw new Error("[NAV] bad tilecache TSET magic");
    }
    const version = readInt();
    if (version !== 1) {
      throw new Error(`[NAV] unsupported tilecache TSET version ${version}`);
    }
    const layerCount = readInt();
    if (layerCount <= 0) throw new Error("[NAV] tilecache contains no layers");
    const meshOrig = { x: readFloat(), y: readFloat(), z: readFloat() };
    const meshTileWidth = readFloat();
    const meshTileHeight = readFloat();
    const generatedMeshMaxTiles = readInt();
    const generatedMeshMaxPolys = readInt();
    const cacheOrig = [readFloat(), readFloat(), readFloat()];
    const cs = readFloat();
    const ch = readFloat();
    const width = readInt();
    const height = readInt();
    const walkableHeight = readFloat();
    const walkableRadius = readFloat();
    const walkableClimb = readFloat();
    const maxSimplificationError = readFloat();
    readInt(); // generated cache capacity, replaced below
    const maxObstacles = readInt();
    const capacity = selectMonolithic64ReferenceCapacity(layerCount);

    const columns = new Map<string, TileCacheLayer[]>();
    let cursor = TSET_HEADER_BYTES;
    for (let index = 0; index < layerCount; index++) {
      if (cursor + 28 > store.length) {
        throw new Error(`[NAV] truncated tilecache before layer ${index}`);
      }
      const entry = store.read(cursor, 28);
      const dataSize = entry.readInt32LE(4);
      if (
        dataSize < 20 ||
        cursor + TSET_ENTRY_BYTES + dataSize > store.length
      ) {
        throw new Error(
          `[NAV] invalid tilecache layer ${index} size ${dataSize} at offset ${cursor + TSET_ENTRY_BYTES}`
        );
      }
      const tx = entry.readInt32LE(16);
      const ty = entry.readInt32LE(20);
      const key = `${tx},${ty}`;
      const layers = columns.get(key) ?? [];
      layers.push({ offset: cursor + TSET_ENTRY_BYTES, length: dataSize });
      columns.set(key, layers);
      cursor += TSET_ENTRY_BYTES + dataSize;
    }
    if (cursor !== store.length) {
      throw new Error(
        `[NAV] tilecache has ${store.length - cursor} trailing bytes`
      );
    }

    return {
      store,
      layerCount,
      columns,
      mesh: {
        orig: meshOrig,
        tileWidth: meshTileWidth,
        tileHeight: meshTileHeight,
        maxTiles: capacity.meshMaxTiles,
        maxPolys: capacity.meshMaxPolys
      },
      cache: {
        orig: cacheOrig,
        cs,
        ch,
        width,
        height,
        walkableHeight,
        walkableRadius,
        walkableClimb,
        maxSimplificationError,
        maxTiles: capacity.cacheMaxTiles,
        maxObstacles
      },
      generatedMeshCapacity: {
        maxTiles: generatedMeshMaxTiles,
        maxPolys: generatedMeshMaxPolys
      },
      bytes: store.length
    };
  } catch (error) {
    store.close();
    throw error;
  }
}

export function createDefaultMeshProcess(runtime: NavigationRuntime) {
  return new runtime.TileCacheMeshProcess((params, polyAreas, polyFlags) => {
    for (let index = 0; index < params.polyCount(); index++) {
      polyAreas.set(index, 0);
      polyFlags.set(index, 1);
    }
  });
}

export function loadMonolithic64Navigation(
  runtime: NavigationRuntime,
  directory: string,
  onProgress: (message: string) => void = console.log
): MonolithicNavigation {
  const indexed = indexMonolithicCache(directory);
  const { store } = indexed;
  const allocator = new (runtime.Raw as any).RecastLinearAllocator(1n << 20n);
  const compressor = new (runtime.Raw as any).RecastFastLZCompressor();
  const meshProcess = createDefaultMeshProcess(runtime);
  const tileCache = new runtime.TileCache();
  const navMesh = new runtime.NavMesh();
  let initializedTileCache = false;
  let initializedNavMesh = false;

  try {
    if (
      !tileCache.init(
        runtime.DetourTileCacheParams.create(indexed.cache),
        allocator,
        compressor,
        meshProcess
      )
    ) {
      throw new Error("[NAV] failed to initialize monolithic64 tilecache");
    }
    initializedTileCache = true;
    if (!navMesh.initTiled(runtime.NavMeshParams.create(indexed.mesh))) {
      throw new Error("[NAV] failed to initialize monolithic64 navmesh");
    }
    initializedNavMesh = true;

    const addTileCopy = (tileCache as any).addTileCopy;
    if (typeof addTileCopy !== "function") {
      throw new Error(
        "[NAV] 64-bit runtime is missing the Detour-owned addTileCopy API"
      );
    }

    let imported = 0;
    for (const [key, layers] of indexed.columns) {
      for (const layer of layers) {
        const bytes = store.read(layer.offset, layer.length);
        const data = new runtime.UnsignedCharArray();
        data.copy(bytes);
        try {
          const result = addTileCopy.call(tileCache, data) as {
            status: number;
          };
          if (!runtime.statusSucceed(result.status)) {
            throw new Error(
              `[NAV] monolithic64 failed to import layer ${imported} for ${key}: ` +
                runtime.statusToReadableString(result.status)
            );
          }
        } finally {
          data.destroy();
        }
        imported++;
        if (imported % 25000 === 0) {
          onProgress(
            `[NAV] monolithic64 imported ${imported}/${indexed.layerCount} layers`
          );
        }
      }
    }
    if (imported !== indexed.layerCount) {
      throw new Error(
        `[NAV] monolithic64 layer count mismatch: ${imported}/${indexed.layerCount}`
      );
    }

    let built = 0;
    for (const key of indexed.columns.keys()) {
      const [tx, ty] = key.split(",").map(Number);
      const status = tileCache.buildNavMeshTilesAt(tx, ty, navMesh);
      if (!runtime.statusSucceed(status)) {
        throw new Error(
          `[NAV] monolithic64 failed to build column ${key}: ` +
            runtime.statusToReadableString(status)
        );
      }
      built++;
      if (built % 25000 === 0) {
        onProgress(
          `[NAV] monolithic64 built ${built}/${indexed.columns.size} columns`
        );
      }
    }
    return {
      navMesh,
      tileCache,
      allocator,
      compressor,
      meshProcess,
      layerCount: imported,
      columnCount: built,
      bytes: indexed.bytes
    };
  } catch (error) {
    if (initializedNavMesh) navMesh.destroy();
    if (initializedTileCache) tileCache.destroy();
    runtime.Raw.destroy(allocator);
    runtime.Raw.destroy(compressor);
    runtime.Raw.destroy(meshProcess.raw);
    throw error;
  } finally {
    store.close();
  }
}
