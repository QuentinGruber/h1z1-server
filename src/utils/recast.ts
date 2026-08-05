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
import type {
  BoxObstacle,
  CrowdAgent,
  Crowd,
  NavMesh,
  NavMeshQuery,
  TileCache,
  Vector3
} from "recast-navigation";
import { join } from "node:path";
import {
  loadMonolithic64Navigation,
  type MonolithicNavigation
} from "./monolithicnavigation";
import {
  loadNavigationRuntime,
  navigationRuntime as R,
  selectNavigationRuntime
} from "./navigationruntime";
const debug = require("debug")("nav");

const MAX_OBSTACLE = 20000;
const MAX_PENDING_OBSTACLE = 50;

export class NavManager {
  navmesh!: NavMesh;
  tilecache!: TileCache;
  obstaclesRequestsPending: number = 0;
  crowd!: Crowd;
  navMeshQuery!: NavMeshQuery;
  lastTimeCall: number = Date.now();
  updateFrequency = 1 / 5;
  obstacleCount = 0;
  private _monolithic64 = false;
  private _monolithicResources?: MonolithicNavigation;
  constructor() {}
  async loadNav() {
    const runtimeSelection = selectNavigationRuntime(
      process.env.NAV_MONOLITHIC_64,
      process.env.NAV_64_CORE_MODULE,
      process.env.NAV_64_WASM_MODULE
    );
    await loadNavigationRuntime(runtimeSelection);

    if (runtimeSelection.mode === "monolithic64") {
      console.time("[NAV] monolithic64 tilecache loaded");
      const cacheDirectory =
        process.env.NAV_CACHE_DIR ??
        join(__dirname, "../../data/2016/collision");
      const resources = loadMonolithic64Navigation(R, cacheDirectory);
      this._monolithic64 = true;
      this._monolithicResources = resources;
      this.navmesh = resources.navMesh;
      this.tilecache = resources.tileCache;
      this.navMeshQuery = new R.NavMeshQuery(this.navmesh);
      this.crowd = new R.Crowd(this.navmesh, {
        maxAgents: 2000,
        maxAgentRadius: 2.0
      });
      const wasmBytes = Number(R.Raw.Module.HEAPU8?.byteLength ?? 0);
      console.timeEnd("[NAV] monolithic64 tilecache loaded");
      console.log(
        `[NAV] monolithic64 tilecache ready (${resources.layerCount} layers, ` +
          `${resources.columnCount} columns, ${(resources.bytes / 1048576).toFixed(1)} MB source, ` +
          `WASM heap=${(wasmBytes / 1048576).toFixed(1)} MB, complete-map mode)`
      );
      return;
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
    const navData = new Uint8Array(Buffer.concat(mesh_parts));
    const { navMesh } = R.importNavMesh(navData);
    const tcData = new Uint8Array(Buffer.concat(tc_parts));
    const tileCacheMeshProcess = new R.TileCacheMeshProcess(
      (params, polyAreas, polyFlags) => {
        for (let index = 0; index < params.polyCount(); index++) {
          polyAreas.set(index, 0);
          polyFlags.set(index, 1);
        }
      }
    );
    const { tileCache } = R.importTileCache(tcData, tileCacheMeshProcess);
    this.navmesh = navMesh;
    this.tilecache = tileCache;
    const maxAgents = 2000;
    const maxAgentRadius = 2.0;
    this.navMeshQuery = new R.NavMeshQuery(this.navmesh);
    this.crowd = new R.Crowd(navMesh, { maxAgents, maxAgentRadius });
    console.timeEnd("[NAV] Navmesh loaded");
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

  createAgent(gamePos: Float32Array): CrowdAgent {
    const navPosition = this.getClosestNavPointVec3(gamePos);
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
        `createAgent: findRandomPointAroundCircle failed (${R.statusToReadableString(status)}), using navPosition directly`
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
    const [positions, indices] = R.getNavMeshPositionsAndIndices(this.navmesh);
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
