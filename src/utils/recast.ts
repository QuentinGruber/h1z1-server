// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import {
  createWriteStream,
  existsSync,
  readFileSync,
  readdirSync
} from "node:fs";
import {
  BoxObstacle,
  CrowdAgent,
  DetourTileCacheParams,
  getNavMeshPositionsAndIndices,
  importNavMesh,
  importTileCache,
  init as initRecast,
  NavMesh,
  NavMeshParams,
  Raw,
  statusToReadableString,
  TileCache,
  UnsignedCharArray,
  Vector3
} from "recast-navigation";
import { NavMeshQuery } from "recast-navigation";
import { Crowd } from "recast-navigation";
import { createDefaultTileCacheMeshProcess } from "recast-navigation/generators";
const debug = require("debug")("nav");
// dedicated namespace for tile streaming (enable with DEBUG=nav:stream)
const debugStream = require("debug")("nav:stream");

const MAX_OBSTACLE = 20000;
const MAX_PENDING_OBSTACLE = 50;

// Streaming navmesh: a whole-map FINE navmesh stored as a compressed TileCache
// on disk (data/2016/collision/z1_cache_*.bin, format "TSET", built by the
// h1emu-recast pipeline compiled fine, cs=0.2). The whole compressed tilecache
// (~600 MB / ~108k layers) is preloaded into RAM at boot; only the tiles within
// STREAM_RADIUS of a player are materialised into the live navmesh
// (buildNavMeshTilesAt), the rest are removed, so the navmesh stays bounded and
// under the 32-bit polyref budget. Grid params (orig, tileWidth) come from the
// TSET header. Construction obstacles carve natively via the tilecache.
const STREAM_ENABLED = process.env.NAV_STREAMING === "1";
const STREAM_RADIUS = 300; // materialise tiles within this many meters of a player
const STREAM_INTERVAL = 1000; // ms between window updates

export class NavManager {
  navmesh!: NavMesh;
  tilecache!: TileCache;
  obstaclesRequestsPending: number = 0;
  crowd!: Crowd;
  navMeshQuery!: NavMeshQuery;
  lastTimeCall: number = Date.now();
  updateFrequency = 1 / 5;
  obstacleCount = 0;
  // streaming state
  streaming = false;
  private _tcOrigX = 0;
  private _tcOrigZ = 0;
  private _tcTileWidth = 25.6;
  private _loadedCols = new Set<string>(); // materialised tile columns "tx,tz"
  private _lastStreamMs = 0;
  constructor() {}
  async loadNav() {
    if (STREAM_ENABLED) {
      const storePath = __dirname + "/../../data/2016/collision/z1_cache_0.bin";
      if (existsSync(storePath)) return this.loadNavStreaming();
      console.warn(
        "[NAV] NAV_STREAMING=1 but data/2016/collision/z1_cache_*.bin is missing - falling back to the standard navmesh"
      );
    }
    console.time("[NAV] Navmesh loaded");
    const mesh_parts: Buffer[] = [];
    const tc_parts: Buffer[] = [];
    let part = 0;
    while (true) {
      const partPath = __dirname + `/../../data/2016/navData/z1_${part}.bin`;
      if (!existsSync(partPath)) break;
      mesh_parts.push(readFileSync(partPath));
      console.log(`[NAV] loaded nav part ${part}`);
      part++;
    }
    part = 0;

    while (true) {
      const partPath =
        __dirname + `/../../data/2016/navData/z1_cache_${part}.bin`;
      if (!existsSync(partPath)) break;
      tc_parts.push(readFileSync(partPath));
      console.log(`[NAV] loaded nav cache part ${part}`);
      part++;
    }
    await initRecast();

    const navData = new Uint8Array(Buffer.concat(mesh_parts));
    const { navMesh } = importNavMesh(navData);
    const tcData = new Uint8Array(Buffer.concat(tc_parts));
    const tileCacheMeshProcess = createDefaultTileCacheMeshProcess();
    const { tileCache } = importTileCache(tcData, tileCacheMeshProcess);
    this.navmesh = navMesh;
    this.tilecache = tileCache;
    const maxAgents = 2000;
    const maxAgentRadius = 2.0;
    this.navMeshQuery = new NavMeshQuery(this.navmesh);
    this.crowd = new Crowd(navMesh, { maxAgents, maxAgentRadius });
    console.timeEnd("[NAV] Navmesh loaded");
  }

  // Streaming mode: preload the whole compressed TileCache (z1_cache_*.bin, TSET
  // format from h1emu-recast) into RAM, build an empty tiled navmesh, and add
  // every compressed layer to the tilecache. Tiles are materialised on demand
  // around players in streamAround() (buildNavMeshTilesAt).
  private async loadNavStreaming() {
    console.time("[NAV] streaming tilecache loaded");
    await initRecast();
    const dir = __dirname + "/../../data/2016/collision";
    const parts = readdirSync(dir)
      .filter((f) => /^z1_cache_\d+\.bin$/.test(f))
      .sort(
        (a, b) =>
          parseInt(a.match(/\d+/)![0], 10) - parseInt(b.match(/\d+/)![0], 10)
      );
    const buf = Buffer.concat(parts.map((p) => readFileSync(`${dir}/${p}`)));

    // parse TileCacheSetHeader (magic, version, numTiles, meshParams, cacheParams)
    let o = 0;
    const rI = () => {
      const v = buf.readInt32LE(o);
      o += 4;
      return v;
    };
    const rF = () => {
      const v = buf.readFloatLE(o);
      o += 4;
      return v;
    };
    const TSET =
      ("T".charCodeAt(0) << 24) |
      ("S".charCodeAt(0) << 16) |
      ("E".charCodeAt(0) << 8) |
      "T".charCodeAt(0);
    if (rI() !== TSET) throw new Error("[NAV] bad tilecache TSET magic");
    rI(); // version
    const numTiles = rI();
    const mesh = {
      orig: { x: rF(), y: rF(), z: rF() },
      tileWidth: rF(),
      tileHeight: rF(),
      maxTiles: rI(),
      maxPolys: rI()
    };
    const cache = {
      orig: [rF(), rF(), rF()],
      cs: rF(),
      ch: rF(),
      width: rI(),
      height: rI(),
      walkableHeight: rF(),
      walkableRadius: rF(),
      walkableClimb: rF(),
      maxSimplificationError: rF(),
      maxTiles: rI(),
      maxObstacles: rI()
    };
    this._tcOrigX = mesh.orig.x;
    this._tcOrigZ = mesh.orig.z;
    this._tcTileWidth = mesh.tileWidth;

    const meshProcess = createDefaultTileCacheMeshProcess();
    this.tilecache = new TileCache();
    this.tilecache.init(
      DetourTileCacheParams.create(cache),
      new (Raw as any).RecastLinearAllocator(1 << 20),
      new (Raw as any).RecastFastLZCompressor(),
      meshProcess
    );
    this.navmesh = new NavMesh();
    this.navmesh.initTiled(NavMeshParams.create(mesh));

    const FREE = (Raw.Detour as any).DT_COMPRESSEDTILE_FREE_DATA ?? 1;
    for (let i = 0; i < numTiles; i++) {
      o += 4; // tileRef (recomputed by addTile)
      const dataSize = buf.readInt32LE(o);
      o += 4;
      const arr = new UnsignedCharArray();
      arr.copy(buf.subarray(o, o + dataSize));
      o += dataSize;
      this.tilecache.addTile(arr, FREE);
    }

    this.navMeshQuery = new NavMeshQuery(this.navmesh);
    this.crowd = new Crowd(this.navmesh, {
      maxAgents: 1000,
      maxAgentRadius: 2.5
    });
    this.streaming = true;
    console.timeEnd("[NAV] streaming tilecache loaded");
    console.log(
      `[NAV] streaming tilecache ready (${numTiles} layers, ${(buf.length / 1048576) | 0} MB in RAM)`
    );
  }

  // Materialise the navmesh tiles within STREAM_RADIUS of any player from the
  // in-RAM tilecache (buildNavMeshTilesAt) and remove the columns that left the
  // window. Throttled. No-op unless streaming.
  streamAround(positions: Float32Array[]): void {
    if (!this.streaming) return;
    const now = Date.now();
    if (now - this._lastStreamMs < STREAM_INTERVAL) return;
    this._lastStreamMs = now;
    const tw = this._tcTileWidth;
    const rad = Math.ceil(STREAM_RADIUS / tw);
    const want = new Set<string>();
    for (const p of positions) {
      const cx = Math.floor((p[0] - this._tcOrigX) / tw),
        cz = Math.floor((p[2] - this._tcOrigZ) / tw);
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          want.add(`${cx + dx},${cz + dz}`);
        }
      }
    }
    let removed = 0;
    // unload columns outside the window
    for (const k of this._loadedCols) {
      if (!want.has(k)) {
        const [tx, tz] = k.split(",").map(Number);
        const res = this.navmesh.getTilesAt(tx, tz, 8);
        for (let i = 0; i < res.tileCount(); i++) {
          const ref = this.navmesh.getTileRef(res.tiles(i));
          if (ref) this.navmesh.removeTile(ref);
        }
        this._loadedCols.delete(k);
        removed++;
      }
    }
    let added = 0;
    // materialise columns entering the window; obstacles already registered in
    // the tilecache are carved in automatically by buildNavMeshTilesAt
    for (const k of want) {
      if (this._loadedCols.has(k)) continue;
      const [tx, tz] = k.split(",").map(Number);
      this.tilecache.buildNavMeshTilesAt(tx, tz, this.navmesh);
      this._loadedCols.add(k);
      added++;
    }
    // only log when the window actually changed (no spam while standing still)
    if ((added || removed) && debugStream.enabled) {
      debugStream(
        `+${added} -${removed} columns (loaded: ${this._loadedCols.size}, players: ${positions.length})`
      );
    }
  }

  static gameToNav(f: Float32Array): Vector3 {
    return { x: f[0], y: f[1], z: f[2] };
  }
  static navToGame(v: Vector3): Float32Array {
    return new Float32Array([v.x, v.y, v.z, 0]);
  }

  removeObstacle(obstacle: BoxObstacle) {
    this.tilecache.removeObstacle(obstacle);
    this.obstaclesRequestsPending++;
  }

  addObstacle(
    position: Float32Array,
    halfExtents: Vector3,
    yRotation: number = 0.0
  ) {
    if (this.obstacleCount >= MAX_OBSTACLE) {
      return null;
    }
    if (this.obstaclesRequestsPending >= MAX_PENDING_OBSTACLE) {
      let upToDate = false;
      // Should be only used at startup, but may be bad
      while (!upToDate) {
        ({ upToDate } = this.tilecache.update(this.navmesh));
      }
      this.obstaclesRequestsPending = 0;
    }
    const { success, obstacle } = this.tilecache.addBoxObstacle(
      NavManager.gameToNav(position),
      halfExtents,
      yRotation
    );
    if (success) {
      this.obstaclesRequestsPending++;
      this.obstacleCount++;
      return obstacle;
    }
    return null;
  }

  getClosestNavPoint(gamePos: Float32Array): any {
    const navInput = NavManager.gameToNav(gamePos);
    const n = this.navMeshQuery.findClosestPoint(navInput);
    return n;
  }

  raycast(origin: Float32Array, target: Float32Array) {
    const origin_data = this.getClosestNavPoint(origin);

    const startPoly = origin_data.polyRef;
    const start = origin_data.point;
    const end = this.getClosestNavPointVec3(target);

    const result = this.navMeshQuery.raycast(startPoly, start, end);
    return result;
  }

  updt() {
    const now = Date.now();
    const timeSinceLastCalled = (now - this.lastTimeCall) / 1000;
    // tilecache carving runs in both modes now: in streaming the obstacles are
    // applied to the materialised window tiles, in normal mode to the whole mesh
    if (this.obstaclesRequestsPending) {
      let upToDate = false;
      while (!upToDate) {
        ({ upToDate } = this.tilecache.update(this.navmesh));
      }
      this.obstaclesRequestsPending = 0;
    }
    debug(
      `requests: ${this.obstaclesRequestsPending}, total: ${this.tilecache.obstacles.size}`
    );
    this.lastTimeCall = now;
    this.crowd.update(this.updateFrequency, timeSinceLastCalled, 1);
  }

  // Returns nearest navmesh point (in nav coords) to the given game position.
  // Uses large halfExtents so Y offset doesn't prevent finding a polygon.
  getClosestNavPointVec3(gamePos: Float32Array): Vector3 {
    const navInput = NavManager.gameToNav(gamePos);
    const n = this.navMeshQuery.findNearestPoly(navInput, {
      halfExtents: { x: 10, y: 10, z: 10 }
    });
    debug(
      `getClosestNavPoint gameIn=[${gamePos[0].toFixed(2)}, ${gamePos[1].toFixed(2)}, ${gamePos[2].toFixed(2)}] navOut=[${n.nearestPoint.x.toFixed(2)}, ${n.nearestPoint.y.toFixed(2)}, ${n.nearestPoint.z.toFixed(2)}] polyRef=${n.nearestRef}`
    );
    return n.nearestPoint;
  }

  createAgent(gamePos: Float32Array): CrowdAgent | undefined {
    // In streaming mode the navmesh only exists around players; if no tile is
    // loaded under this spawn point yet, defer (caller retries when it loads)
    // instead of placing the agent at a garbage position.
    const { nearestRef, nearestPoint } = this.navMeshQuery.findNearestPoly(
      NavManager.gameToNav(gamePos),
      { halfExtents: { x: 10, y: 10, z: 10 } }
    );
    if (!nearestRef) return undefined;
    const navPosition = nearestPoint;
    debug(
      `createAgent: navPos=[${navPosition.x.toFixed(2)}, ${navPosition.y.toFixed(2)}, ${navPosition.z.toFixed(2)}]`
    );

    const {
      randomPoint: initialAgentPosition,
      success,
      status
    } = this.navMeshQuery.findRandomPointAroundCircle(navPosition, 0.5);

    if (!success) {
      debug(
        `createAgent: findRandomPointAroundCircle failed (${statusToReadableString(status)}), using navPosition directly`
      );
    }

    const spawnPoint = success ? initialAgentPosition : navPosition;
    const agent = this.crowd.addAgent(spawnPoint, {
      radius: 0.3,
      height: 2,
      maxAcceleration: 1.0,
      maxSpeed: 1.0,
      collisionQueryRange: 2.0,
      pathOptimizationRange: 4.0,
      separationWeight: 2.0
    });
    debug(
      `createAgent: agentIdx=${agent.agentIndex} navPos=[${spawnPoint.x.toFixed(2)}, ${spawnPoint.y.toFixed(2)}, ${spawnPoint.z.toFixed(2)}]`
    );
    return agent;
  }

  createPassiveAgent(gamePos: Float32Array, radius: number = 0.5): CrowdAgent {
    const navPosition = this.getClosestNavPointVec3(gamePos);
    const agent = this.crowd.addAgent(navPosition, {
      radius,
      height: 2,
      maxAcceleration: 0,
      maxSpeed: 0,
      collisionQueryRange: radius * 2,
      pathOptimizationRange: 0,
      separationWeight: 1,
      updateFlags: 0
    });
    return agent;
  }

  async dumpNavmesh() {
    const [positions, indices] = getNavMeshPositionsAndIndices(this.navmesh);
    const stream = createWriteStream("navMeshDump.obj");

    for (let i = 0; i < positions.length; i += 3) {
      stream.write(
        `v ${positions[i]} ${positions[i + 1]} ${positions[i + 2]}\n`
      );
    }

    for (let i = 0; i < indices.length; i += 3) {
      stream.write(
        `f ${indices[i] + 1} ${indices[i + 1] + 1} ${indices[i + 2] + 1}\n`
      );
    }

    await new Promise((resolve, reject) => {
      stream.end(resolve);
      stream.on("error", reject);
    });
  }
}
