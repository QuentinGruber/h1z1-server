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
  const originalError = console.error;
  console.error = () => undefined;
  try {
    assert.equal(nav.removeObstacle(obstacle), false);
  } finally {
    console.error = originalError;
  }
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
  const originalWarn = console.warn;
  console.error = () => undefined;
  console.warn = () => undefined;
  try {
    assert.doesNotThrow(() => nav.updt());
    assert.doesNotThrow(() => nav.updt());
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
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

test("agent creation is rejected after the Crowd fault latch", () => {
  const nav = new NavManager();
  let additions = 0;
  nav.tilecache = { obstacles: new Map() } as never;
  nav.crowd = {
    update: () => {
      throw new WebAssembly.RuntimeError("memory access out of bounds");
    },
    addAgent: () => {
      additions++;
      return { agentIndex: 0 };
    }
  } as never;
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = () => undefined;
  console.warn = () => undefined;
  try {
    nav.updt();
    assert.equal(nav.createPassiveAgent(new Float32Array(4)), undefined);
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  assert.equal(additions, 0);
});

test("negative Crowd agent indexes are rejected", () => {
  const nav = new NavManager();
  nav.navMeshQuery = {
    findNearestPoly: () => ({
      nearestPoint: { x: 0, y: 0, z: 0 },
      nearestRef: 1,
      success: true
    })
  } as never;
  const rejectedAgent = { agentIndex: -1 };
  const agents = { "-1": rejectedAgent };
  nav.crowd = {
    agents,
    addAgent: () => rejectedAgent
  } as never;
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    assert.equal(nav.createPassiveAgent(new Float32Array(4)), undefined);
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(nav.rejectedAgentCount, 1);
  assert.deepEqual(agents, {});
});

test("obstacle native calls stop after a thrown fault", () => {
  const nav = new NavManager();
  let removals = 0;
  nav.tilecache = {
    obstacles: new Map(),
    update: () => {
      throw new WebAssembly.RuntimeError("memory access out of bounds");
    },
    removeObstacle: () => {
      removals++;
      return { success: true, status: 1 << 30 };
    }
  } as never;
  nav.crowd = { update: () => undefined } as never;
  nav.navmesh = {} as never;
  nav.obstaclesRequestsPending = 1;
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = () => undefined;
  console.warn = () => undefined;
  try {
    nav.updt();
    assert.equal(nav.removeObstacle({} as BoxObstacle), false);
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  assert.equal(removals, 0);
  assert.equal(nav.crowdHealthy, false);
  assert.equal(nav.obstacleUpdatesHealthy, false);
});

test("a non-throwing obstacle status failure does not poison the runtime", () => {
  const nav = new NavManager();
  nav.tilecache = {
    obstacles: new Map(),
    update: () => ({ success: false, status: 1, upToDate: false })
  } as never;
  nav.crowd = { update: () => undefined } as never;
  nav.navmesh = {} as never;
  nav.obstaclesRequestsPending = 1;
  const originalError = console.error;
  console.error = () => undefined;
  try {
    nav.updt();
  } finally {
    console.error = originalError;
  }
  assert.equal(nav.crowdHealthy, true);
  assert.equal(nav.obstacleUpdatesHealthy, true);
  assert.equal(nav.obstaclesRequestsPending, 0);
  assert.equal(nav.obstacleStatusFailureCount, 1);
});

test("navmesh queries are not re-entered after the Crowd fault latch", () => {
  const nav = new NavManager();
  let queries = 0;
  nav.tilecache = { obstacles: new Map() } as never;
  nav.crowd = {
    update: () => {
      throw new WebAssembly.RuntimeError("memory access out of bounds");
    }
  } as never;
  nav.navMeshQuery = {
    findNearestPoly: () => {
      queries++;
      return { success: true, nearestRef: 1 };
    }
  } as never;
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = () => undefined;
  console.warn = () => undefined;
  try {
    nav.updt();
    assert.equal(nav.getNavGroundPoint(0, 0), null);
    assert.deepEqual(
      nav.getClosestNavPointVec3(new Float32Array([1, 2, 3, 1])),
      { x: 1, y: 2, z: 3 }
    );
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  assert.equal(queries, 0);
});
