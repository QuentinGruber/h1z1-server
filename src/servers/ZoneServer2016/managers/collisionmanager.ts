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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BufferGeometry,
  BufferAttribute,
  Ray,
  Vector3,
  Matrix4,
  Quaternion,
  DoubleSide
} from "three";
import { MeshBVH } from "three-mesh-bvh";

// Server-side collision/ground sampling from the extracted Forgelight Z1
// structure mesh (roads/sidewalks/floors/foundations/bridges that the terrain
// heightmap ignores). Instanced: one BVH per unique actor mesh + an XZ
// broadphase grid over per-instance world AABBs. A downward raycast returns the
// structure surface Y at (x,z), used to ground NPC feet on man-made surfaces.
//
// Data: data/2016/collision/z1_collision.bin (gitignored, produced by
// tools/forgelight/export_z1_instanced.py). Format "H1COL2":
//   header: magic(8) version(u32) meshCount(u32) instCount(u32)
//   meshes: [kind(u8) vertCount(u32) idxCount(u32) positions(vertCount*3 f32) indices(idxCount u32)]
//           kind: 0 walkable / 1 solid obstacle / 2 thin non-walkable / 3 door
//   instances: meshIndex(instCount u32) then transform(instCount * 16 f32:
//              tx ty tz, qx qy qz qw, sx sy sz, minXYZ, maxXYZ)

const MAP_HALF = 4096;
const CELL = 16; // broadphase cell size in meters
const GRID_W = (MAP_HALF * 2) / CELL; // 512 cells per axis
// how far above the NPC's current Y the ray starts, and the max step-up under
// which a surface still counts as "ground it stands on". Sidewalk/foundation
// walkable tops sit ~1.2m above their anchor, so this must stay >=~1.5 or NPCs
// sink into them; that overlaps car/wreck heights, which is why the
// "don't climb onto wrecks/walls" problem is solved by tagging those actors as
// non-walkable in the exporter, not by lowering this threshold.
const RAY_ABOVE = 3.0;
const HEADROOM = 2.0;
// max half-extent of a carved obstacle box, so one large mesh (e.g. a long
// wall's bounding box) can't carve out a huge chunk of navmesh
const OBSTACLE_HALF_CAP = 8.0;

export interface ObstacleBox {
  id: number; // stable instance id (for add/remove tracking)
  cx: number;
  cy: number;
  cz: number; // world AABB centre
  hx: number;
  hy: number;
  hz: number; // world AABB half-extents (hx/hz capped)
}

export class CollisionManager {
  private _meshBVH: MeshBVH[] = [];
  private _meshKind!: Uint8Array; // 0 walkable / 1 obstacle, per mesh
  private _instMesh!: Uint32Array;
  private _instData!: Float32Array; // 16 floats per instance
  private _grid: (number[] | undefined)[] = [];
  private _loaded = false;

  // reusable temporaries (groundRaycast runs for many NPCs per AI tick)
  private readonly _mat = new Matrix4();
  private readonly _inv = new Matrix4();
  private readonly _pos = new Vector3();
  private readonly _quat = new Quaternion();
  private readonly _scl = new Vector3();
  private readonly _ray = new Ray();
  private readonly _localRay = new Ray();
  private readonly _hitPoint = new Vector3();

  get loaded(): boolean {
    return this._loaded;
  }

  private cell(v: number): number {
    return Math.floor((v + MAP_HALF) / CELL);
  }

  load(
    path = join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "data",
      "2016",
      "collision",
      "z1_collision.bin"
    )
  ): void {
    let buf: Buffer;
    try {
      buf = readFileSync(path);
    } catch {
      console.log(
        "[Collision] z1_collision.bin not found - structure collision disabled"
      );
      return;
    }
    if (buf.subarray(0, 6).toString("latin1") !== "H1COL2") {
      console.log("[Collision] bad magic - structure collision disabled");
      return;
    }
    let off = 8;
    off += 4; // version
    const meshCount = buf.readUInt32LE(off);
    off += 4;
    const instCount = buf.readUInt32LE(off);
    off += 4;

    this._meshKind = new Uint8Array(meshCount);
    for (let m = 0; m < meshCount; m++) {
      this._meshKind[m] = buf.readUInt8(off);
      off += 1;
      const vertCount = buf.readUInt32LE(off);
      off += 4;
      const idxCount = buf.readUInt32LE(off);
      off += 4;
      // copy out (BVH wants its own backing arrays; the file Buffer is reused)
      const positions = new Float32Array(
        buf.buffer.slice(
          buf.byteOffset + off,
          buf.byteOffset + off + vertCount * 3 * 4
        )
      );
      off += vertCount * 3 * 4;
      const indices = new Uint32Array(
        buf.buffer.slice(
          buf.byteOffset + off,
          buf.byteOffset + off + idxCount * 4
        )
      );
      off += idxCount * 4;
      const geom = new BufferGeometry();
      geom.setAttribute("position", new BufferAttribute(positions, 3));
      geom.setIndex(new BufferAttribute(indices, 1));
      this._meshBVH.push(new MeshBVH(geom));
    }

    this._instMesh = new Uint32Array(
      buf.buffer.slice(
        buf.byteOffset + off,
        buf.byteOffset + off + instCount * 4
      )
    );
    off += instCount * 4;
    this._instData = new Float32Array(
      buf.buffer.slice(
        buf.byteOffset + off,
        buf.byteOffset + off + instCount * 16 * 4
      )
    );
    off += instCount * 16 * 4;

    // broadphase: bucket each instance into the XZ cells its world AABB covers
    this._grid = Array.from({ length: GRID_W * GRID_W });
    for (let i = 0; i < instCount; i++) {
      const b = i * 16;
      const minX = this._instData[b + 10],
        minZ = this._instData[b + 12],
        maxX = this._instData[b + 13],
        maxZ = this._instData[b + 15];
      const cx0 = Math.max(0, this.cell(minX)),
        cx1 = Math.min(GRID_W - 1, this.cell(maxX)),
        cz0 = Math.max(0, this.cell(minZ)),
        cz1 = Math.min(GRID_W - 1, this.cell(maxZ));
      for (let cx = cx0; cx <= cx1; cx++) {
        for (let cz = cz0; cz <= cz1; cz++) {
          const c = cz * GRID_W + cx;
          (this._grid[c] ??= []).push(i);
        }
      }
    }

    this._loaded = true;
    const kindCounts = [0, 0, 0, 0];
    for (let m = 0; m < meshCount; m++) kindCounts[this._meshKind[m]]++;
    console.log(
      `[Collision] loaded ${meshCount} meshes ` +
        `(${kindCounts[0]} walkable, ${kindCounts[1]} solid, ` +
        `${kindCounts[2]} thin, ${kindCounts[3]} door), ` +
        `${instCount} instances`
    );
  }

  // Highest structure surface Y at (x,z) that is not above currentY+HEADROOM,
  // or null if no structure covers the point (caller falls back to heightmap).
  groundRaycast(x: number, z: number, currentY: number): number | null {
    if (!this._loaded) return null;
    const cx = this.cell(x),
      cz = this.cell(z);
    if (cx < 0 || cx >= GRID_W || cz < 0 || cz >= GRID_W) return null;
    const cell = this._grid[cz * GRID_W + cx];
    if (!cell || cell.length === 0) return null;

    const top = currentY + RAY_ABOVE;
    this._ray.origin.set(x, top, z);
    this._ray.direction.set(0, -1, 0);

    let bestY: number | null = null;
    for (let k = 0; k < cell.length; k++) {
      const i = cell[k];
      // only stand on walkable surfaces; solid obstacles (walls/wrecks/fences)
      // are gone around (see obstaclesNear), never climbed onto
      if (this._meshKind[this._instMesh[i]]) continue;
      const b = i * 16;
      const minX = this._instData[b + 10],
        minY = this._instData[b + 11],
        minZ = this._instData[b + 12],
        maxX = this._instData[b + 13],
        maxZ = this._instData[b + 15];
      // cheap reject: query point outside this instance's XZ AABB, or instance
      // entirely above the ray origin
      if (x < minX || x > maxX || z < minZ || z > maxZ || minY > top) continue;

      this._pos.set(
        this._instData[b],
        this._instData[b + 1],
        this._instData[b + 2]
      );
      this._quat.set(
        this._instData[b + 3],
        this._instData[b + 4],
        this._instData[b + 5],
        this._instData[b + 6]
      );
      this._scl.set(
        this._instData[b + 7],
        this._instData[b + 8],
        this._instData[b + 9]
      );
      this._mat.compose(this._pos, this._quat, this._scl);
      this._inv.copy(this._mat).invert();
      this._localRay.copy(this._ray).applyMatrix4(this._inv);

      const hit = this._meshBVH[this._instMesh[i]].raycastFirst(
        this._localRay,
        DoubleSide
      );
      if (!hit) continue;
      // hit.point is in local space; bring back to world to read the real Y
      this._hitPoint.copy(hit.point).applyMatrix4(this._mat);
      const wy = this._hitPoint.y;
      if (wy <= currentY + HEADROOM && (bestY === null || wy > bestY)) {
        bestY = wy;
      }
    }
    return bestY;
  }

  segmentBlocked(from: Float32Array, to: Float32Array): boolean {
    if (!this._loaded) return false;
    const dx = to[0] - from[0],
      dy = to[1] - from[1],
      dz = to[2] - from[2],
      length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length < 0.001) return false;

    this._ray.origin.set(from[0], from[1], from[2]);
    this._ray.direction.set(dx / length, dy / length, dz / length);

    const cx0 = Math.max(0, this.cell(Math.min(from[0], to[0]))),
      cx1 = Math.min(GRID_W - 1, this.cell(Math.max(from[0], to[0]))),
      cz0 = Math.max(0, this.cell(Math.min(from[2], to[2]))),
      cz1 = Math.min(GRID_W - 1, this.cell(Math.max(from[2], to[2])));
    const seen = new Set<number>();

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const cell = this._grid[cz * GRID_W + cx];
        if (!cell) continue;
        for (const i of cell) {
          // Mesh kind describes navigation use, not projectile permeability.
          // A house is tagged walkable because it contains floors and stairs,
          // but the same mesh also contains its walls. Every triangle kind can
          // therefore block a shot.
          if (seen.has(i)) continue;
          seen.add(i);
          const b = i * 16;
          this._pos.set(
            this._instData[b],
            this._instData[b + 1],
            this._instData[b + 2]
          );
          this._quat.set(
            this._instData[b + 3],
            this._instData[b + 4],
            this._instData[b + 5],
            this._instData[b + 6]
          );
          this._scl.set(
            this._instData[b + 7],
            this._instData[b + 8],
            this._instData[b + 9]
          );
          this._mat.compose(this._pos, this._quat, this._scl);
          this._inv.copy(this._mat).invert();
          this._localRay.copy(this._ray).applyMatrix4(this._inv);

          const hit = this._meshBVH[this._instMesh[i]].raycastFirst(
            this._localRay,
            DoubleSide
          );
          if (!hit) continue;
          this._hitPoint.copy(hit.point).applyMatrix4(this._mat);
          const hitDx = this._hitPoint.x - from[0],
            hitDy = this._hitPoint.y - from[1],
            hitDz = this._hitPoint.z - from[2],
            distanceAlong =
              hitDx * this._ray.direction.x +
              hitDy * this._ray.direction.y +
              hitDz * this._ray.direction.z;
          if (distanceAlong > 0.05 && distanceAlong < length - 0.05) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Solid-obstacle instances (walls/wrecks/fences) whose world-AABB centre is
  // within `radius` of (x,z). Used to carve a moving navmesh-obstacle window
  // around players so NPCs route around them. Box is the instance world AABB,
  // half-extents capped so a single large mesh can't carve a huge area.
  obstaclesNear(x: number, z: number, radius: number): ObstacleBox[] {
    const out: ObstacleBox[] = [];
    if (!this._loaded) return out;
    const r2 = radius * radius;
    const cx0 = Math.max(0, this.cell(x - radius)),
      cx1 = Math.min(GRID_W - 1, this.cell(x + radius)),
      cz0 = Math.max(0, this.cell(z - radius)),
      cz1 = Math.min(GRID_W - 1, this.cell(z + radius));
    const seen = new Set<number>();
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const cell = this._grid[cz * GRID_W + cx];
        if (!cell) continue;
        for (let k = 0; k < cell.length; k++) {
          const i = cell[k];
          // only SOLID obstacles (kind 1) are carved; thin ones (kind 2) are
          // merely non-walkable and skipped here
          if (this._meshKind[this._instMesh[i]] !== 1 || seen.has(i)) continue;
          const b = i * 16;
          const ccx = (this._instData[b + 10] + this._instData[b + 13]) / 2,
            ccz = (this._instData[b + 12] + this._instData[b + 15]) / 2;
          const dx = ccx - x,
            dz = ccz - z;
          if (dx * dx + dz * dz > r2) continue;
          seen.add(i);
          out.push({
            id: i,
            cx: ccx,
            cy: (this._instData[b + 11] + this._instData[b + 14]) / 2,
            cz: ccz,
            hx: Math.min(
              OBSTACLE_HALF_CAP,
              (this._instData[b + 13] - this._instData[b + 10]) / 2
            ),
            hy: (this._instData[b + 14] - this._instData[b + 11]) / 2,
            hz: Math.min(
              OBSTACLE_HALF_CAP,
              (this._instData[b + 15] - this._instData[b + 12]) / 2
            )
          });
        }
      }
    }
    return out;
  }
}
