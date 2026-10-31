const debug = require("debug")("h1emu:scripts:verify-foundation-navigation");
const assert = require("node:assert/strict");
const { NavManager } = require("../out/utils/recast");
async function main() {
  const nav = new NavManager();
  await nav.loadNav();
  try {
    const start = nav.getClosestNavPointVec3(
      new Float32Array([-1924.9956, 62.7, -2268.831])
    );
    const target = nav.getClosestNavPointVec3(
      new Float32Array([start.x + 20, start.y, start.z])
    );
    const center = {
      x: (start.x + target.x) / 2,
      y: start.y,
      z: (start.z + target.z) / 2
    };
    const obstacle = nav.addObstacle(NavManager.navToGame(center), {
      x: 2,
      y: 4,
      z: 3
    });
    assert(obstacle, "Could not add foundation-style obstacle");
    nav.updt();
    const nearest = nav.navMeshQuery.findNearestPoly(start, {
      halfExtents: { x: 1, y: 4, z: 1 }
    });
    const ray = nav.navMeshQuery.raycast(nearest.nearestRef, start, target);
    assert(
      ray.success && ray.t < 1,
      "Foundation obstacle did not block the direct path"
    );
    const agent = nav.crowd.addAgent(start, {
      radius: 0.3,
      height: 2,
      maxSpeed: 2.5,
      maxAcceleration: 5,
      collisionQueryRange: 2,
      pathOptimizationRange: 4,
      separationWeight: 2
    });
    assert(agent.requestMoveTarget(target));
    let minY = Infinity,
      maxY = -Infinity,
      checks = 0;
    for (let tick = 0; tick < 2400; tick++) {
      nav.crowd.update(1 / 60, 1 / 60, 1);
      const p = agent.position(),
        ground = nav.npcNavToGame(p);
      assert(
        !(
          Math.abs(p.x - center.x) < 2 - 1e-4 &&
          Math.abs(p.z - center.z) < 3 - 1e-4
        ),
        "Agent entered foundation bounds"
      );
      assert.equal(ground[0], p.x);
      assert.equal(ground[2], p.z);
      const height = Math.max(
        nav.terrain.getHeight(p.x, p.z),
        nav.roads?.getSample(p.x, p.z)?.height ?? -Infinity
      );
      assert(Math.abs(ground[1] - height) < 1e-4);
      minY = Math.min(minY, ground[1]);
      maxY = Math.max(maxY, ground[1]);
      checks++;
      if (Math.hypot(p.x - target.x, p.z - target.z) < 0.5) break;
    }
    const end = agent.position();
    assert(
      Math.hypot(end.x - target.x, end.z - target.z) < 0.5,
      "Agent did not reach target around foundation"
    );
    debug(
      JSON.stringify({
        foundationAvoided: true,
        reachedTarget: true,
        groundSamples: checks,
        rayHitFraction: ray.t,
        elevationRange: maxY - minY
      })
    );
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
