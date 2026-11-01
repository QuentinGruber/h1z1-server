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

import { createWriteStream, existsSync, readFileSync } from "node:fs";
import {
  BoxObstacle,
  CrowdAgent,
  getNavMeshPositionsAndIndices,
  importNavMesh,
  importTileCache,
  init as initRecast,
  NavMesh,
  statusToReadableString,
  statusSucceed,
  TileCache,
  Vector3
} from "recast-navigation";
import { NavMeshQuery } from "recast-navigation";
import { Crowd } from "recast-navigation";
import { createDefaultTileCacheMeshProcess } from "recast-navigation/generators";
import { TerrainHeight } from "./terrainheight";
import { NpcGroundDiagnostics } from "./npcgrounddiagnostics";
import { RoadSurfaces } from "./roadsurfaces";
import type { NpcGroundSample } from "./npcgroundmotion";
import {
  applyRoadNavPatch,
  createRoadNavCache,
  RoadNavPatch
} from "./roadnavpatch";
const debug = require("debug")("nav");

const MAX_OBSTACLE = 20000;
const MAX_PENDING_OBSTACLE = 50;

export class NavManager {
  readonly groundDiagnostics = new NpcGroundDiagnostics();
  terrain?: TerrainHeight;
  roads?: RoadSurfaces;
  navmesh!: NavMesh;
  tilecache!: TileCache;
  private roadTileCache?: TileCache;
  private roadPatchTile?: { x: number; z: number };
  private roadObstacles = new WeakMap<BoxObstacle, BoxObstacle>();
  obstaclesRequestsPending: number = 0;
  crowd!: Crowd;
  navMeshQuery!: NavMeshQuery;
  lastTimeCall: number = Date.now();
  lastCrowdTiming?: { elapsedSeconds: number; durationMs: number };
  updateFrequency = 1 / 5;
  obstacleCount = 0;
  constructor() {}
  async loadNav() {
    if (!process.env.FAKE_NAVMESH) {
      const directory =
        process.env.TERRAIN_DATA_PATH ??
        __dirname + "/../../data/2016/terrainData";
      // Require the terrain manifest at startup. Tiles are checked on first use.
      this.terrain = new TerrainHeight(directory);
      this.roads = new RoadSurfaces(
        __dirname + "/../../data/2016/roadSurfaces.json.gz"
      );
      console.log(
        `[ROAD] Loaded ${this.roads.instanceCount} asphalt-road collision instances`
      );
      console.log(
        `[TERRAIN] Loaded ${this.terrain.tiles.length} terrain tile records from ${directory}`
      );
    }
    console.time("[NAV] Navmesh loaded");
    const mesh_parts: Buffer[] = [];
    const tc_parts: Buffer[] = [];
    let part = 0;
    if (!process.env.FAKE_NAVMESH) {
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
    } else {
      console.log(`"[NAV]" Empty navmesh loaded`);
    }
    await initRecast();

    const navData = new Uint8Array(Buffer.concat(mesh_parts));
    const { navMesh } = importNavMesh(navData);
    let tcData: Uint8Array = new Uint8Array(Buffer.concat(tc_parts));
    const roadPatchPath =
      __dirname + "/../../data/2016/navData/roadWalkabilityPatch.json";
    let roadPatch: RoadNavPatch | undefined;
    if (!process.env.FAKE_NAVMESH && existsSync(roadPatchPath)) {
      const parsed: RoadNavPatch = JSON.parse(readFileSync(roadPatchPath, "utf8"));
      roadPatch = parsed;
      tcData = applyRoadNavPatch(
        tcData,
        parsed,
        readFileSync(__dirname + "/../../data/2016/roadSurfaces.json.gz")
      );
    }
    const tileCacheMeshProcess = createDefaultTileCacheMeshProcess();
    const { tileCache } = importTileCache(tcData, tileCacheMeshProcess);
    this.navmesh = navMesh;
    this.tilecache = tileCache;
    if (roadPatch) {
      const status = tileCache.buildNavMeshTilesAt(
        roadPatch.tile.x,
        roadPatch.tile.z,
        navMesh
      );
      if (!statusSucceed(status))
        throw new Error("Could not build repaired road navigation tile");
      this.roadTileCache = createRoadNavCache(roadPatch, tileCacheMeshProcess);
      this.roadPatchTile = roadPatch.tile;
      this.rebuildRoadTile();
      debug(
        "Restored road walkability in tile %d,%d",
        roadPatch.tile.x,
        roadPatch.tile.z
      );
    }
    const maxAgents = 2000;
    const maxAgentRadius = 2.0;
    this.navMeshQuery = new NavMeshQuery(this.navmesh);
    this.crowd = new Crowd(navMesh, { maxAgents, maxAgentRadius });
    this.groundDiagnostics.reportReferences(
      this.terrain,
      this.navMeshQuery,
      this.roads
    );
    console.timeEnd("[NAV] Navmesh loaded");
    // Loading geometry is not elapsed simulation time for this new crowd.
    this.lastTimeCall = Date.now();
  }

  static gameToNav(f: Float32Array): Vector3 {
    return { x: f[0], y: f[1], z: f[2] };
  }
  static navToGame(v: Vector3): Float32Array {
    return new Float32Array([v.x, v.y, v.z, 0]);
  }

  /** Keep Detour's corridor/agent Y separate from the NPC's physical ground Y. */
  npcNavToGame(v: Vector3): Float32Array {
    return new Float32Array([v.x, this.sampleNpcGround(v).height, v.z, 0]);
  }

  sampleNpcGround(v: Vector3): NpcGroundSample {
    const terrain = this.terrain?.getSurface?.(v.x, v.z);
    const height = terrain?.height ?? this.terrain?.getHeight(v.x, v.z);
    const road = this.roads?.getSample(v.x, v.z);
    // Only the exact road collision footprint can raise terrain Y. Detour's
    // own agent/corridor and X/Z remain unchanged, including obstacle avoidance.
    if (road && (height == null || road.height > height))
      return {
        ...road,
        surface: "road",
        valid: true,
        roadInstanceId: road.instanceId
      };
    if (height != null)
      return {
        height,
        surface: "terrain",
        valid: !!terrain,
        slopeX: terrain?.slopeX ?? 0,
        slopeZ: terrain?.slopeZ ?? 0
      };
    return {
      height: v.y,
      surface: "navmesh",
      valid: false,
      slopeX: 0,
      slopeZ: 0
    };
  }

  removeObstacle(obstacle: BoxObstacle) {
    this.tilecache.removeObstacle(obstacle);
    const roadObstacle = this.roadObstacles.get(obstacle);
    if (roadObstacle && this.roadTileCache) {
      this.roadTileCache.removeObstacle(roadObstacle);
      this.roadObstacles.delete(obstacle);
    }
    this.obstacleCount = Math.max(0, this.obstacleCount - 1);
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
      // Should be only used at startup, but may be bad
      this.updateTileCaches();
      this.obstaclesRequestsPending = 0;
    }
    const { success, obstacle } = this.tilecache.addBoxObstacle(
      NavManager.gameToNav(position),
      halfExtents,
      yRotation
    );
    if (success) {
      if (this.roadTileCache) {
        const road = this.roadTileCache.addBoxObstacle(
          NavManager.gameToNav(position),
          halfExtents,
          yRotation
        );
        if (!road.success)
          throw new Error("Could not mirror road navigation obstacle");
        this.roadObstacles.set(obstacle, road.obstacle);
      }
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
    const started = performance.now();
    const timeSinceLastCalled = (now - this.lastTimeCall) / 1000;
    if (this.obstaclesRequestsPending) {
      this.updateTileCaches();
      this.obstaclesRequestsPending = 0;
    }
    console.log(
      `requests: ${this.obstaclesRequestsPending}, total: ${this.tilecache.obstacles.size}`
    );
    this.lastTimeCall = now;
    // Use Recast's bounded catch-up (10 fixed substeps). A single substep
    // permanently starves every agent when callbacks exceed the fixed step.
    this.crowd.update(this.updateFrequency, timeSinceLastCalled);
    if (process.env.NPC_MOTION_TRACE === "1") {
      this.lastCrowdTiming = {
        elapsedSeconds: timeSinceLastCalled,
        durationMs: performance.now() - started
      };
    }
  }

  private rebuildRoadTile() {
    if (!this.roadTileCache || !this.roadPatchTile) return;
    const status = this.roadTileCache.buildNavMeshTilesAt(
      this.roadPatchTile.x,
      this.roadPatchTile.z,
      this.navmesh
    );
    if (!statusSucceed(status))
      throw new Error("Could not rebuild repaired road navigation");
  }

  private updateTileCaches() {
    for (const cache of [this.tilecache, this.roadTileCache]) {
      if (!cache) continue;
      let upToDate = false;
      while (!upToDate) ({ upToDate } = cache.update(this.navmesh));
    }
    // The coarse cache can also rebuild this layer. Finish with the precise
    // road cache, using the exact same obstacle positions and dimensions.
    this.rebuildRoadTile();
  }

  // Returns nearest navmesh point (in nav coords) to the given game position.
  // Uses large halfExtents so Y offset doesn't prevent finding a polygon.
  getClosestNavPointVec3(gamePos: Float32Array): Vector3 {
    const navInput = NavManager.gameToNav(gamePos);
    const n = this.navMeshQuery.findNearestPoly(navInput, {
      halfExtents: { x: 10, y: 10, z: 10 }
    });
    console.log(
      `getClosestNavPoint gameIn=[${gamePos[0].toFixed(2)}, ${gamePos[1].toFixed(2)}, ${gamePos[2].toFixed(2)}] navOut=[${n.nearestPoint.x.toFixed(2)}, ${n.nearestPoint.y.toFixed(2)}, ${n.nearestPoint.z.toFixed(2)}] polyRef=${n.nearestRef}`
    );
    return n.nearestPoint;
  }

  // Nearest navmesh point at (x, z), searched from above with height ignored.
  // Returns null when the spot is off-mesh (water/void/gap)
  getNavGroundPoint(x: number, z: number): Float32Array | null {
    if (!this.navMeshQuery) return null;
    const n = this.navMeshQuery.findNearestPoly(
      { x, y: 1000, z },
      { halfExtents: { x: 10, y: 2000, z: 10 } }
    );
    if (!n.success || !n.nearestRef) return null;
    return NavManager.navToGame(n.nearestPoint);
  }

  createAgent(
    gamePos: Float32Array,
    dimensions = { radius: 0.3, height: 2 }
  ): CrowdAgent {
    const navPosition = this.getClosestNavPointVec3(gamePos);
    console.log(
      `createAgent: navPos=[${navPosition.x.toFixed(2)}, ${navPosition.y.toFixed(2)}, ${navPosition.z.toFixed(2)}]`
    );

    const {
      randomPoint: initialAgentPosition,
      success,
      status
    } = this.navMeshQuery.findRandomPointAroundCircle(navPosition, 0.5);

    if (!success) {
      console.log(
        `createAgent: findRandomPointAroundCircle failed (${statusToReadableString(status)}), using navPosition directly`
      );
    }

    const spawnPoint = success ? initialAgentPosition : navPosition;
    const agent = this.crowd.addAgent(spawnPoint, {
      radius: dimensions.radius,
      height: dimensions.height,
      maxAcceleration: 1.0,
      maxSpeed: 1.0,
      collisionQueryRange: Math.max(2, dimensions.radius * 4),
      pathOptimizationRange: 4.0,
      separationWeight: 2.0
    });
    console.log(
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
