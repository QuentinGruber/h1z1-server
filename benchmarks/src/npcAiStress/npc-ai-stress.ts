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
  let totalPathTicks = 0;
  let totalPathMs = 0;
  const pathStats = new RollingStats();

  const origTick = server.updatePathfindingPositions.bind(server);
  server.updatePathfindingPositions = () => {
    const t0 = performance.now();
    origTick();
    const dt = performance.now() - t0;
    pathStats.push(dt);
    totalPathMs += dt;
    totalPathTicks++;
  };

  // --- Instrument tickAi ---------------------------------------------
  let totalAiTicks = 0;
  let totalAiTickMs = 0;
  const aiTickStats = new RollingStats();

  const origTickAi = (server as any).tickAi.bind(server);
  (server as any).tickAi = () => {
    const t0 = performance.now();
    origTickAi();
    const dt = performance.now() - t0;
    aiTickStats.push(dt);
    totalAiTickMs += dt;
    totalAiTicks++;
  };

  // --- Stats loop -----------------------------------------------------
  const startTime = Date.now();
  const statRows: {
    t: number;
    aiAvgMs: number;
    aiMaxMs: number;
    pathAvgMs: number;
    pathMaxMs: number;
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
    const dist = getStateDist(server);

    const aiAvg = aiTickStats.avg();
    const aiMax = aiTickStats.max();
    const pAvg = pathStats.avg();
    const pMax = pathStats.max();

    statRows.push({
      t,
      aiAvgMs: aiAvg,
      aiMaxMs: aiMax,
      pathAvgMs: pAvg,
      pathMaxMs: pMax,
      memMB,
      stateDist: dist
    });

    const distStr = ZOMBIE_STATES.filter((s) => dist[s] > 0)
      .map((s) => `${s}:${dist[s]}`)
      .join(" ");

    console.log(
      `[${String(t).padStart(3)}s]` +
        `  tickAI   avg=${aiAvg.toFixed(2).padStart(7)}ms  max=${aiMax.toFixed(2).padStart(7)}ms` +
        `  |  pathfind avg=${pAvg.toFixed(2).padStart(7)}ms  max=${pMax.toFixed(2).padStart(7)}ms` +
        `  mem=${memMB}MB  [${distStr}]`
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

    const wallMs = elapsed * 1000;

    const aiAvgOverall =
      totalAiTicks > 0 ? (totalAiTickMs / totalAiTicks).toFixed(2) : "0";
    const aiPeak = statRows.length
      ? Math.max(...statRows.map((r) => r.aiMaxMs)).toFixed(2)
      : "0";
    const aiCpuPct = ((totalAiTickMs / wallMs) * 100).toFixed(1);

    const pathAvgOverall =
      totalPathTicks > 0 ? (totalPathMs / totalPathTicks).toFixed(2) : "0";
    const pathPeak = statRows.length
      ? Math.max(...statRows.map((r) => r.pathMaxMs)).toFixed(2)
      : "0";
    const pathCpuPct = ((totalPathMs / wallMs) * 100).toFixed(1);

    const finalDist = getStateDist(server);

    console.log("\n=== FINAL REPORT ===");
    console.log(`Duration:              ${elapsed.toFixed(1)}s`);
    console.log(`Zombies:               ${npcCount}`);
    console.log(`Fake players:          ${CONFIG.playerCount}`);
    console.log(`Total AI ticks:        ${totalAiTicks}`);
    console.log(
      `tickAI avg:            ${aiAvgOverall}ms  peak: ${aiPeak}ms  (${aiCpuPct}% of wall time)`
    );
    console.log(`Total pathfind ticks:  ${totalPathTicks}`);
    console.log(
      `pathfind avg:          ${pathAvgOverall}ms  peak: ${pathPeak}ms  (${pathCpuPct}% of wall time)`
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
