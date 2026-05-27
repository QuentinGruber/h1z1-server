// ======================================================================
// NPC AI tick stress test — profiles zombie FSM + Recast navigation
// at scale, with a configurable number of zombies and fake player targets.
//
// Run after `npm run build`:
//   npm run stress-ai          — normal run
//   npm run stress-ai-profile  — with --cpu-prof (writes cpuprofile file)
//   npm run stress-ai-inspect  — with --inspect for DevTools
// ======================================================================

/* eslint-disable @typescript-eslint/no-require-imports */
export {};
process.env["DISABLE_PLUGINS"] = "true";

// ---- CONFIG (edit these) --------------------------------------------
const CONFIG = {
  /** Number of zombie NPCs to spawn */
  npcCount: 500,
  /** Number of fake player characters placed in the zombie cluster (triggers chase/attack) */
  playerCount: 10,
  durationSeconds: 60,
  /** Stats print interval in ms */
  statsIntervalMs: 5000
};
// ---------------------------------------------------------------------

const { ZoneServer2016 } = require("../../../h1z1-server");
const {
  ModelIds
} = require("../../../out/servers/ZoneServer2016/models/enums");
const { createFakeCharacter } = require("../../../out/utils/test.utils");

// ---- Helpers --------------------------------------------------------

function randomPosition(
  cx: number,
  cy: number,
  cz: number,
  radius: number
): Float32Array {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * radius;
  return new Float32Array([
    cx + Math.cos(angle) * dist,
    cy,
    cz + Math.sin(angle) * dist,
    1
  ]);
}

/** Rolling window of the last N samples */
class RollingStats {
  private samples: number[] = [];
  constructor(private readonly window: number = 20) {}
  push(v: number) {
    this.samples.push(v);
    if (this.samples.length > this.window) this.samples.shift();
  }
  avg() {
    return this.samples.length === 0
      ? 0
      : this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }
  max() {
    return this.samples.length === 0 ? 0 : Math.max(...this.samples);
  }
}

// ---- Main -----------------------------------------------------------

async function main() {
  console.log("=== H1Z1 NPC AI Tick Stress Test ===");
  console.log(
    `Config: ${CONFIG.npcCount} zombies | ${CONFIG.playerCount} fake players` +
      ` | ${CONFIG.durationSeconds}s | stats every ${CONFIG.statsIntervalMs / 1000}s`
  );

  const server = new ZoneServer2016(0);

  console.log("Starting server (no network, no MongoDB)…");
  await server.start();

  // Stub out sendData — NPCs will try to broadcast movement/animation packets
  // to connected clients; fake characters have no real UDP connection.
  server.sendData = () => {};
  server.sendUnbufferedData = () => {};
  server.sendOrderedData = () => {};

  // Known-good open area near the H1Z1 Z1 map centre, snapped to navmesh height.
  // Positions outside the navmesh still work — agents park on the nearest valid point.
  const CENTER_X = -600;
  const CENTER_Y = 30;
  const CENTER_Z = 700;
  const SPAWN_RADIUS = 400;

  // --- Spawn zombies --------------------------------------------------
  console.log(
    `Spawning ${CONFIG.npcCount} zombies around (${CENTER_X}, ${CENTER_Y}, ${CENTER_Z})…`
  );
  const rot = new Float32Array([0, 0, 0, 0]);

  for (let i = 0; i < CONFIG.npcCount; i++) {
    const pos = randomPosition(CENTER_X, CENTER_Y, CENTER_Z, SPAWN_RADIUS);
    server.worldObjectManager.createNpc(
      server,
      ModelIds.ZOMBIE_MALE_WALKER,
      pos,
      rot
    );
  }

  const npcCount = Object.keys(server._npcs).length;
  console.log(`Zombies spawned: ${npcCount}`);

  // --- Create fake players --------------------------------------------
  // Place them inside the zombie cluster so zombies eventually enter
  // chase/attack states, giving a realistic mixed-state distribution.
  console.log(`Creating ${CONFIG.playerCount} fake player characters…`);
  for (let i = 0; i < CONFIG.playerCount; i++) {
    const character = createFakeCharacter(server);
    const pos = randomPosition(CENTER_X, CENTER_Y, CENTER_Z, SPAWN_RADIUS / 4);
    if (!character.state) character.state = {};
    character.state.position = pos;
  }
  console.log("Setup complete. Measuring AI tick performance…\n");

  // --- Instrument updatePathfindingPositions --------------------------
  // The server already schedules this via setInterval(200ms) in start().
  // We wrap it to capture wall-clock timing without changing scheduling.
  //
  // Metrics are split into three buckets:
  //   nav  — Recast crowd.update() (pathfinding computation)
  //   sync — NPC position-sync loop (reads interpolatedPosition, calls goTo)
  //   tick — total (nav + sync + overhead)
  let totalTicks = 0;
  let totalTickMs = 0;
  let totalNavMs = 0;
  let totalSyncMs = 0;
  let lastNavMs = 0;

  const tickStats = new RollingStats();
  const navStats = new RollingStats(); // crowd.update() time
  const syncStats = new RollingStats(); // position-sync loop time

  // Wrap navManager.updt so we can time the Recast crowd update separately.
  const origNavUpdt = server.navManager.updt.bind(server.navManager);
  server.navManager.updt = () => {
    const t0 = performance.now();
    origNavUpdt();
    lastNavMs = performance.now() - t0;
    navStats.push(lastNavMs);
    totalNavMs += lastNavMs;
  };

  const origTick = server.updatePathfindingPositions.bind(server);
  server.updatePathfindingPositions = () => {
    const t0 = performance.now();
    origTick(); // calls the wrapped navManager.updt internally
    const dt = performance.now() - t0;
    const syncMs = dt - lastNavMs; // remainder = NPC position-sync loop
    tickStats.push(dt);
    syncStats.push(syncMs);
    totalTickMs += dt;
    totalSyncMs += syncMs;
    totalTicks++;
  };

  // --- Stats loop -----------------------------------------------------
  const startTime = Date.now();
  const statRows: {
    t: number;
    tickAvgMs: number;
    tickMaxMs: number;
    navMaxMs: number;
    syncMaxMs: number;
    memMB: number;
    stateDist: Record<string, number>;
  }[] = [];

  const ZOMBIE_STATES = [
    "idle",
    "wander",
    "investigate",
    "chase",
    "attack",
    "feed",
    "dead"
  ];

  function getStateDist(srv: any): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const s of ZOMBIE_STATES) dist[s] = 0;
    for (const k in srv._npcs) {
      const npc = srv._npcs[k];
      if (npc.zombieFsm) {
        const state: string = npc.zombieFsm.state ?? "unknown";
        dist[state] = (dist[state] ?? 0) + 1;
      }
    }
    return dist;
  }

  const statsTimer = setInterval(() => {
    const t = Math.round((Date.now() - startTime) / 1000);
    const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const tAvg = tickStats.avg();
    const tMax = tickStats.max();
    const ticksPerSec = tAvg > 0 ? (1000 / tAvg).toFixed(1) : "?";
    const dist = getStateDist(server);

    const nAvg = navStats.avg();
    const nMax = navStats.max();
    const sAvg = syncStats.avg();
    const sMax = syncStats.max();

    statRows.push({
      t,
      tickAvgMs: tAvg,
      tickMaxMs: tMax,
      navMaxMs: nMax,
      syncMaxMs: sMax,
      memMB,
      stateDist: dist
    });

    const distStr = ZOMBIE_STATES.filter((s) => dist[s] > 0)
      .map((s) => `${s}:${dist[s]}`)
      .join(" ");

    console.log(
      `[${String(t).padStart(3)}s]` +
        `  tick avg=${tAvg.toFixed(2).padStart(7)}ms  max=${tMax.toFixed(2).padStart(7)}ms` +
        `  (~${String(ticksPerSec).padStart(5)}/s)` +
        `  mem=${memMB}MB` +
        `  [${distStr}]`
    );
    console.log(
      `        ` +
        `  nav  avg=${nAvg.toFixed(2).padStart(7)}ms  max=${nMax.toFixed(2).padStart(7)}ms` +
        `  |  sync avg=${sAvg.toFixed(2).padStart(7)}ms  max=${sMax.toFixed(2).padStart(7)}ms`
    );
  }, CONFIG.statsIntervalMs);

  // --- Shutdown -------------------------------------------------------
  setTimeout(async () => {
    clearInterval(statsTimer);

    const elapsed = (Date.now() - startTime) / 1000;
    const memPeak = statRows.length
      ? Math.max(...statRows.map((r) => r.memMB))
      : 0;
    const memAvg = statRows.length
      ? Math.round(statRows.reduce((a, r) => a + r.memMB, 0) / statRows.length)
      : 0;
    const tickPeak = statRows.length
      ? Math.max(...statRows.map((r) => r.tickMaxMs)).toFixed(2)
      : "0";
    const tickAvgOverall =
      totalTicks > 0 ? (totalTickMs / totalTicks).toFixed(2) : "0";

    // CPU % = total ms spent in AI tick / total wall-time ms * 100
    const wallMs = elapsed * 1000;
    const cpuPct = ((totalTickMs / wallMs) * 100).toFixed(1);
    const navCpuPct = ((totalNavMs / wallMs) * 100).toFixed(1);
    const syncCpuPct = ((totalSyncMs / wallMs) * 100).toFixed(1);

    const navAvgOverall =
      totalTicks > 0 ? (totalNavMs / totalTicks).toFixed(2) : "0";
    const syncAvgOverall =
      totalTicks > 0 ? (totalSyncMs / totalTicks).toFixed(2) : "0";

    // Collect nav/sync peaks from the stat rows (rolling windows only cover last N samples).
    const navPeak = statRows.length
      ? Math.max(...statRows.map((r) => r.navMaxMs)).toFixed(2)
      : "0";
    const syncPeak = statRows.length
      ? Math.max(...statRows.map((r) => r.syncMaxMs)).toFixed(2)
      : "0";

    // Final state distribution
    const finalDist = getStateDist(server);

    console.log("\n=== FINAL REPORT ===");
    console.log(`Duration:              ${elapsed.toFixed(1)}s`);
    console.log(`Zombies:               ${npcCount}`);
    console.log(`Fake players:          ${CONFIG.playerCount}`);
    console.log(`Total AI ticks:        ${totalTicks}`);
    console.log(`Tick latency avg:      ${tickAvgOverall}ms`);
    console.log(`Tick latency peak:     ${tickPeak}ms`);
    console.log(`AI tick CPU:           ${cpuPct}% of wall time`);
    console.log(
      `  Nav (crowd) avg:     ${navAvgOverall}ms  peak: ${navPeak}ms  (${navCpuPct}% of wall time)`
    );
    console.log(
      `  Pos-sync avg:        ${syncAvgOverall}ms  peak: ${syncPeak}ms  (${syncCpuPct}% of wall time)`
    );
    console.log(`Memory avg / peak:     ${memAvg}MB / ${memPeak}MB`);
    console.log(`Final state dist:`);
    for (const s of ZOMBIE_STATES) {
      if (finalDist[s] > 0) {
        const pct = ((finalDist[s] / npcCount) * 100).toFixed(1);
        console.log(
          `  ${s.padEnd(12)} ${String(finalDist[s]).padStart(5)} (${pct}%)`
        );
      }
    }

    if (process.execArgv.some((a: string) => a.startsWith("--cpu-prof"))) {
      console.log(
        "\nCPU profile written — open .cpuprofile in Chrome DevTools > Performance > Load profile"
      );
    }

    await server.stop();
    process.exit(0);
  }, CONFIG.durationSeconds * 1000);
}

main().catch((err) => {
  console.error("NPC AI stress test crashed:", err);
  process.exit(1);
});
