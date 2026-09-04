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

// Minimal ambient declaration for three-mesh-bvh: the package ships its types
// via the "exports" field, which this project's classic ("node") module
// resolution does not honor. This file lives beside CollisionManager so the
// narrowed zone tsconfigs include it. Only the used surface is typed.
declare module "three-mesh-bvh" {
  import { BufferGeometry, Ray, Side, Vector3 } from "three";

  export interface BVHRaycastHit {
    point: Vector3;
    distance: number;
    faceIndex: number;
  }

  export class MeshBVH {
    constructor(geometry: BufferGeometry, options?: object);
    raycastFirst(ray: Ray, side?: Side): BVHRaycastHit | null;
  }
}
