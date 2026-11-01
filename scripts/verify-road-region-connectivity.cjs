const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  debug = require("debug")("h1emu:road-connectivity");
const { NavManager } = require("../out/utils/recast");
(async () => {
  const nav = new NavManager();
  await nav.loadNav();
  const results = [];
  for (const [label, x, z] of [
    ["north-bank", -1991.77, -2218.76],
    ["south-bank", -1991.77, -2248.76],
    ["west-road", -2018, -2233.76],
    ["east-road", -1950, -2233.76]
  ])
    for (const side of [-1, 1]) {
      const to = { x: -1991.77, y: 52.74, z: -2233.76 + side * 2 },
        from = { x, y: nav.sampleNpcGround({ x, y: 50, z }).height, z },
        q = nav.navMeshQuery,
        a = q.findNearestPoly(from, { halfExtents: { x: 8, y: 10, z: 8 } }),
        b = q.findNearestPoly(to, { halfExtents: { x: 0.3, y: 10, z: 0.3 } });
      assert.ok(a.success && a.nearestRef && b.success && b.nearestRef);
      const path = q.computePath(a.nearestPoint, b.nearestPoint, {
          halfExtents: { x: 0.3, y: 1, z: 0.3 }
        }),
        end = path.path.at(-1),
        complete =
          path.success &&
          end &&
          Math.hypot(end.x - b.nearestPoint.x, end.z - b.nearestPoint.z) <
            0.3 &&
          Math.abs(end.y - b.nearestPoint.y) < 0.5;
      const result = {
        label,
        side,
        complete: !!complete,
        points: path.path.length
      };
      results.push(result);
      debug("RESULT %s", JSON.stringify(result));
      assert.ok(complete, "road patch disconnected from " + label);
    }
  fs.writeFileSync(
    "/results/npc-road-connectivity-validation.json",
    JSON.stringify(results, null, 2)
  );
})().catch((e) => {
  debug("FAILED %s", e.stack);
  process.exitCode = 1;
});
