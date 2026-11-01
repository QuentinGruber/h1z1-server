const debug = require("debug")("h1emu:scripts:verify-crowd-clock");
const assert = require("node:assert/strict");
const { NavManager } = require("../out/utils/recast");
const { Crowd } = require("recast-navigation");
async function main() {
  const nav = new NavManager();
  await nav.loadNav();
  const results = [];
  for (const cap of [1, 10]) {
    const crowd = new Crowd(nav.navmesh, { maxAgents: 10, maxAgentRadius: 2 });
    const start = nav.getClosestNavPointVec3(
      new Float32Array([-1810, 58, -2234.6])
    );
    const target = nav.getClosestNavPointVec3(
      new Float32Array([-1840, 60, -2234.6])
    );
    const agent = crowd.addAgent(start, {
      radius: 0.3,
      height: 2,
      maxSpeed: 2,
      maxAcceleration: 5,
      collisionQueryRange: 2,
      pathOptimizationRange: 4,
      separationWeight: 2
    });
    assert(agent.requestMoveTarget(target));
    for (let i = 0; i < 60; i++) crowd.update(1 / 60, 0.05, cap);
    const p = agent.position();
    results.push({
      cap,
      wallSeconds: 3,
      simulatedSeconds: 3 - crowd.accumulator,
      backlogSeconds: crowd.accumulator,
      displacement: Math.hypot(p.x - start.x, p.z - start.z)
    });
    crowd.destroy();
  }
  assert(results[0].backlogSeconds > 1.9);
  assert(results[1].backlogSeconds < 1 / 60 + 1e-9);
  assert(results[1].displacement > results[0].displacement * 2);
  const originalNow = Date.now;
  let now = originalNow();
  nav.lastTimeCall = now;
  nav.updateFrequency = 1 / 60;
  Date.now = () => now;
  let elapsed = 0;
  try {
    for (const milliseconds of [500, ...Array(60).fill(50)]) {
      const before = nav.crowd.accumulator;
      now += milliseconds;
      elapsed += milliseconds / 1000;
      nav.updt();
      const simulated = before + milliseconds / 1000 - nav.crowd.accumulator;
      assert(simulated <= 10 / 60 + 1e-9, "unbounded catch-up");
    }
    assert(
      nav.crowd.accumulator < 1 / 60 + 1e-9,
      "NavManager did not catch up"
    );
    results.push({
      integration: "NavManager.updt",
      wallSeconds: elapsed,
      simulatedSeconds: elapsed - nav.crowd.accumulator,
      backlogSeconds: nav.crowd.accumulator
    });
  } finally {
    Date.now = originalNow;
  }
  console.log(JSON.stringify(results, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
