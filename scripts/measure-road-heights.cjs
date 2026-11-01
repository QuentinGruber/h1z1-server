const debug = require("debug")("h1emu:scripts:measure-road-heights");
const fs = require("node:fs");
const { NavManager } = require("../out/utils/recast");
async function main() {
  const nav = new NavManager();
  await nav.loadNav();
  try {
    const points = [
      [-1822.24, 58.17, -2234.6],
      [1989.04, 53.39, -2235.25]
    ];
    const report = [];
    for (const [x, y, z] of points) {
      const ground = nav.terrain.inspectHeight(x, z);
      const closest = nav.navMeshQuery.findNearestPoly(
        { x, y, z },
        { halfExtents: { x: 0.01, y: 1000, z: 0.01 } }
      );
      const navHeight =
        closest.success && closest.nearestRef
          ? nav.navMeshQuery.getPolyHeight(closest.nearestRef, {
              x,
              y: closest.nearestPoint.y,
              z
            })
          : null;
      const road = nav.roads.getSample(x, z);
      report.push({
        input: [x, y, z],
        ground,
        navmeshY: navHeight?.success ? navHeight.height : null,
        navmeshMinusTerrain: navHeight?.success
          ? navHeight.height - ground.height
          : null,
        suppliedYMinusTerrain: y - ground.height,
        npcYFromCurrentAdapter: nav.npcNavToGame({
          x,
          y: closest.nearestPoint.y,
          z
        })[1],
        observedNpcAtExactPoint: null,
        roadCollision: road,
        roadMinusTerrain: road ? road.height - ground.height : null
      });
    }
    fs.writeFileSync(
      "road-height-measurements.json",
      JSON.stringify(report, null, 2)
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    nav.crowd.destroy();
    nav.navMeshQuery.destroy();
    nav.tilecache.destroy();
    nav.navmesh.destroy();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
