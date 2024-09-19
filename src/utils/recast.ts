// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { init as initRecast, NavMesh } from "recast-navigation";
import { NavMeshQuery } from "recast-navigation";
import { importNavMesh } from "recast-navigation";

export class Navig {
  navmesh!: NavMesh;
  constructor() {}
  async loadNav(navData: Uint8Array) {
    await initRecast();
    const { navMesh } = importNavMesh(navData);
    this.navmesh = navMesh;
  }
  testNavMesh(a: Float32Array, b: Float32Array): Float32Array[] {
    console.time("calculating path");
    const navMeshQuery = new NavMeshQuery(this.navmesh);

    const start = { x: a[0], y: a[1], z: a[2] };
    const end = { x: b[0], y: b[1], z: b[2] };
    const { success, error, path } = navMeshQuery.computePath(start, end);
    console.log(success);
    console.log(error);
    console.log(path);
    console.timeEnd("calculating path");
    const pathNodes: Float32Array[] = [];
    if (path) {
      path.forEach((v) => {
        pathNodes.push(new Float32Array([v.x, v.y, v.z]));
      });
    }
    return pathNodes;
  }
}
