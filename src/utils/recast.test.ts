import assert from "node:assert";
import test from "node:test";
import type { BoxObstacle, CrowdAgent } from "recast-navigation";
import { NavManager } from "./recast";

test("removed obstacles release logical capacity exactly once", () => {
  const nav = new NavManager();
  const obstacle = {} as BoxObstacle;
  let succeeds = true;
  nav.obstacleCount = 1;
  nav.tilecache = {
    removeObstacle: () => ({ success: succeeds, status: 0 })
  } as never;

  assert.equal(nav.removeObstacle(obstacle), true);
  assert.equal(nav.obstacleCount, 0);
  assert.equal(nav.obstaclesRequestsPending, 1);
  succeeds = false;
  assert.equal(nav.removeObstacle(obstacle), false);
  assert.equal(nav.obstacleCount, 0);
  assert.equal(nav.obstaclesRequestsPending, 1);
});

test("obstacle updates drain without removing unrelated crowd agents", () => {
  const nav = new NavManager();
  let updates = 0;
  let crowdUpdates = 0;
  nav.obstaclesRequestsPending = 1;
  nav.navmesh = {} as never;
  nav.tilecache = {
    obstacles: new Map(),
    update: () => ({
      success: true,
      status: 1 << 30,
      upToDate: ++updates === 3
    })
  } as never;
  nav.crowd = {
    update: () => {
      crowdUpdates++;
    }
  } as never;

  nav.updt();

  assert.equal(updates, 3);
  assert.equal(crowdUpdates, 1);
  assert.equal(nav.obstaclesRequestsPending, 0);
  assert.equal(nav.obstacleUpdatesHealthy, true);
});

test("a Crowd WASM fault is contained and never re-entered", () => {
  const nav = new NavManager();
  let updates = 0;
  nav.tilecache = { obstacles: new Map() } as never;
  nav.crowd = {
    update: () => {
      updates++;
      throw new WebAssembly.RuntimeError("memory access out of bounds");
    }
  } as never;
  const originalError = console.error;
  console.error = () => undefined;
  try {
    assert.doesNotThrow(() => nav.updt());
    assert.doesNotThrow(() => nav.updt());
  } finally {
    console.error = originalError;
  }
  assert.equal(updates, 1);
  assert.equal(nav.crowdHealthy, false);
});

test("agent removal faults latch the Crowd before another native call", () => {
  const nav = new NavManager();
  let removals = 0;
  nav.crowd = {
    removeAgent: () => {
      removals++;
      throw new WebAssembly.RuntimeError("memory access out of bounds");
    }
  } as never;
  const originalError = console.error;
  console.error = () => undefined;
  try {
    assert.equal(nav.removeAgent({} as CrowdAgent), false);
    assert.equal(nav.removeAgent({} as CrowdAgent), false);
  } finally {
    console.error = originalError;
  }
  assert.equal(removals, 1);
  assert.equal(nav.crowdHealthy, false);
});
