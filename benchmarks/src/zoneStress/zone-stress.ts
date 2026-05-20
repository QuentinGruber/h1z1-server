// ======================================================================
// Zone stress test — profiles server-side logic with fake clients,
// real construction data, bot movement, and weapon fire.
//
// Run after `npm run build`:
//   npm run stress          — normal run
//   npm run stress-profile  — with --cpu-prof (writes cpuprofile file)
// ======================================================================

/* eslint-disable @typescript-eslint/no-require-imports */
process.env["DISABLE_PLUGINS"] = "true";

// ---- CONFIG (edit these) --------------------------------------------
const CONFIG = {
  clients: 200,
  /** Multiply the 72 example bases by this factor (~72 * N total foundations) */
  baseReplications: 3,
  /** Position updates per second per bot */
  moveHz: 10,
  /** Weapon fire events per second per bot (AK47, no fire-rate throttle issues) */
  fireHz: 2,
  durationSeconds: 60,
  /** Stats print interval in ms */
  statsIntervalMs: 5000,
  explosion: {
    /** How many IEDs to detonate in one wave */
    count: 10000,
    /** Seconds after start to trigger the wave (let bots/construction settle first) */
    delaySeconds: 10
  }
};
// ---------------------------------------------------------------------

const { ZoneServer2016 } = require("../../../h1z1-server");
const {
  ExplosiveEntity
} = require("../../../out/servers/ZoneServer2016/entities/explosiveentity");
const {
  WorldDataManager
} = require("../../../out/servers/ZoneServer2016/managers/worlddatamanager");
const { createFakeCharacter } = require("../../../out/utils/test.utils");
const {
  BaseItem
} = require("../../../out/servers/ZoneServer2016/classes/baseItem");
const {
  LoadoutItem
} = require("../../../out/servers/ZoneServer2016/classes/loadoutItem");
const {
  Weapon
} = require("../../../out/servers/ZoneServer2016/classes/weapon");
const {
  ZoneClient2016
} = require("../../../out/servers/ZoneServer2016/classes/zoneclient");
const rawConstruction: any[] = require("../../src/zoneStress/construction.json");

// Items.WEAPON_AK47 = 2229, LoadoutSlots.PRIMARY = 1
const WEAPON_AK47 = 2229;
const SLOT_PRIMARY = 1;

// ---- Construction replication ---------------------------------------

function deepReplicateBase(
  server: any,
  base: any,
  offsetX: number,
  offsetZ: number
): any {
  const cloned = JSON.parse(JSON.stringify(base));

  function remapEntity(entity: any, newParentId: string) {
    entity.characterId = server.generateGuid();
    entity.parentObjectCharacterId = newParentId;
    if (Array.isArray(entity.position)) {
      entity.position[0] += offsetX;
      entity.position[2] += offsetZ;
    }
    for (const slotGroup of [
      "occupiedWallSlots",
      "occupiedShelterSlots",
      "occupiedExpansionSlots",
      "occupiedRampSlots",
      "occupiedUpperWallSlots",
      "freeplaceEntities"
    ]) {
      for (const key of Object.keys(entity[slotGroup] ?? {})) {
        remapEntity(entity[slotGroup][key], entity.characterId);
      }
    }
  }

  remapEntity(cloned, "0x0000000000000000");
  return cloned;
}

// ---- Bot helpers ----------------------------------------------------

let nextSessionId = 10000;

function createBot(server: any) {
  const character = createFakeCharacter(server);

  const sessionId = nextSessionId++;
  const client = new ZoneClient2016(
    sessionId,
    `bot_${sessionId}`,
    `bot_${sessionId}`,
    character.characterId,
    character.transientId,
    server
  );
  server._clients[sessionId] = client;

  // Give AK47 with unlimited ammo
  const guid = server.generateGuid();
  const baseItem = new BaseItem(WEAPON_AK47, guid, 100, 1);
  const loadoutItem = new LoadoutItem(
    baseItem,
    SLOT_PRIMARY,
    character.characterId
  );
  loadoutItem.weapon = new Weapon(baseItem, 9999);
  character._loadout[SLOT_PRIMARY] = loadoutItem;
  character.currentLoadoutSlot = SLOT_PRIMARY;

  // Initialise state objects normally set during the full login flow
  if (!character.state) character.state = {};
  if (!client.fireHints) client.fireHints = {};

  return { client, character, weapon: loadoutItem };
}

function randomPosition(cx: number, cz: number, radius: number): Float32Array {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * radius;
  return new Float32Array([
    cx + Math.cos(angle) * dist,
    15,
    cz + Math.sin(angle) * dist,
    1
  ]);
}

// ---- Timing helpers -------------------------------------------------

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

// ---- Explosion wave -------------------------------------------------

// Items.IED = 146, actor model 9176 (matches commands.ts placement)
const ITEMS_IED = 146;
const IED_MODEL = 9176;

/** Waits for the explosion manager's queue to fully drain. */
function waitForExplosionFlush(server: any): Promise<void> {
  return new Promise((resolve) => {
    const mgr = server.explosionManager as any;
    function check() {
      if (mgr._pending.length === 0 && !mgr._scheduled) resolve();
      else setImmediate(check);
    }
    setImmediate(check);
  });
}

async function runExplosionWave(
  server: any,
  count: number,
  pos: Float32Array
): Promise<void> {
  console.log(
    `\n[EXPLOSION] Creating ${count} IEDs at (${pos[0].toFixed(0)}, ${pos[1].toFixed(0)}, ${pos[2].toFixed(0)})…`
  );

  const t0 = performance.now();

  for (let i = 0; i < count; i++) {
    const id = server.generateGuid();
    const exp = new ExplosiveEntity(
      id,
      server.getTransientId(id),
      IED_MODEL,
      new Float32Array([pos[0], pos[1], pos[2], 1]),
      new Float32Array([0, 0, 0, 0]),
      server,
      ITEMS_IED,
      "stress-test"
    );
    // Mirror what detonate() does before calling queueExplosion so already-queued
    // IEDs are skipped in the grid scan and don't chain-react with each other.
    exp.detonated = true;
    server._explosives[id] = exp;
    server.explosionManager.queueExplosion(exp);
  }

  const queueMs = performance.now() - t0;
  console.log(
    `[EXPLOSION] Queued in ${queueMs.toFixed(1)}ms — waiting for chunks to drain…`
  );

  await waitForExplosionFlush(server);

  const totalMs = performance.now() - t0;
  const chunks = Math.ceil(count / 200);
  console.log(
    `[EXPLOSION] Done — total ${totalMs.toFixed(0)}ms over ${chunks} chunks (~${(totalMs / chunks).toFixed(1)}ms/chunk)`
  );
}

// ---- Main -----------------------------------------------------------

async function main() {
  console.log("=== H1Z1 Zone Stress Test ===");
  console.log(
    `Config: ${CONFIG.clients} clients | ${rawConstruction.length} base templates x ${CONFIG.baseReplications} replications` +
      ` | move@${CONFIG.moveHz}Hz | fire@${CONFIG.fireHz}Hz | ${CONFIG.durationSeconds}s`
  );

  const server = new ZoneServer2016(0);

  console.log("Starting server (no network, no MongoDB)…");
  await server.start();

  // Stub out sendData — fake clients have no real UDP connection so calling the
  // real one would error. We measure dispatch latency via wall-clock timing instead.
  server.sendData = () => {};
  server.sendUnbufferedData = () => {};
  server.sendOrderedData = () => {};

  // --- Load construction ---
  console.log(`Replicating construction ${CONFIG.baseReplications}x…`);
  const allBases: any[] = [...rawConstruction];
  for (let rep = 1; rep < CONFIG.baseReplications; rep++) {
    for (const base of rawConstruction) {
      allBases.push(deepReplicateBase(server, base, rep * 700, 0));
    }
  }
  WorldDataManager.loadConstructionParentEntities(allBases, server);
  const foundationCount = Object.keys(
    server._constructionFoundations ?? {}
  ).length;
  const simpleCount = Object.keys(server._constructionSimple ?? {}).length;
  const doorCount = Object.keys(server._constructionDoors ?? {}).length;
  console.log(
    `Construction loaded: ${foundationCount} foundations, ${simpleCount} pieces, ${doorCount} doors`
  );

  // --- Create bots ---
  console.log(`Creating ${CONFIG.clients} bots…`);
  // Derive spawn center as the centroid of all replicated base positions
  const CENTER_X = Math.round(
    allBases.reduce((sum: number, b: any) => sum + (b.position?.[0] ?? 0), 0) /
      allBases.length
  );
  const CENTER_Z = Math.round(
    allBases.reduce((sum: number, b: any) => sum + (b.position?.[2] ?? 0), 0) /
      allBases.length
  );
  console.log(
    `Bot spawn center derived from bases: (${CENTER_X}, ${CENTER_Z})`
  );

  const bots: {
    client: any;
    character: any;
    weapon: any;
    pos: Float32Array;
    projCount: number;
  }[] = [];

  for (let i = 0; i < CONFIG.clients; i++) {
    const { client, character, weapon } = createBot(server);
    const pos = randomPosition(CENTER_X, CENTER_Z, 500);
    character.state.position = pos;
    character.state.yaw = Math.random() * Math.PI * 2;
    bots.push({ client, character, weapon, pos, projCount: 0 });
  }
  console.log("Bots created. Running stress loop…\n");

  // Explosion wave — triggers after delay so construction & bots are in place
  setTimeout(
    () =>
      void runExplosionWave(
        server,
        CONFIG.explosion.count,
        new Float32Array([CENTER_X, 15, CENTER_Z, 1])
      ),
    CONFIG.explosion.delaySeconds * 1000
  );

  // --- Metrics ---
  let totalMovePkts = 0;
  let totalFirePkts = 0;
  let moveBatchMs = 0; // cumulative ms spent processing movement
  let fireBatchMs = 0;
  const moveStats = new RollingStats();
  const fireStats = new RollingStats();

  const startTime = Date.now();
  const statRows: {
    t: number;
    moveAvgMs: number;
    fireAvgMs: number;
    memMB: number;
  }[] = [];

  // --- Movement loop ---
  const moveIntervalMs = 1000 / CONFIG.moveHz;
  const moveTimer = setInterval(() => {
    const now = Date.now();
    const t0 = performance.now();

    for (const bot of bots) {
      bot.pos[0] += (Math.random() - 0.5) * 2;
      bot.pos[2] += (Math.random() - 0.5) * 2;
      bot.character.state.position = bot.pos;

      server._packetHandlers.PlayerUpdatePosition(server, bot.client, {
        data: {
          flags: 0,
          sequenceTime: now & 0xffffffff,
          position: bot.pos,
          rotation: new Float32Array([0, 0, 0, 0]),
          orientation: 0,
          rotationRaw: new Float32Array([0, 0, 0, 0]),
          lookAt: new Float32Array([0, 0, 0]),
          stance: 256 // ON_GROUND
        }
      });
      totalMovePkts++;
    }

    const dt = performance.now() - t0;
    moveBatchMs += dt;
    moveStats.push(dt);
  }, moveIntervalMs);

  // --- Fire loop ---
  const fireIntervalMs = 1000 / CONFIG.fireHz;
  const fireTimer = setInterval(() => {
    const t0 = performance.now();

    for (const bot of bots) {
      if (!bot.weapon.weapon) continue;
      if (bot.weapon.weapon.ammoCount <= 0) bot.weapon.weapon.ammoCount = 9999;

      server.handleWeaponFire(bot.client, bot.weapon, {
        gameTime: Date.now() & 0xffffffff,
        packet: {
          position: bot.pos,
          sessionProjectileCount: bot.projCount++,
          rotation: new Float32Array([0, 0, 0, 0])
        }
      });
      totalFirePkts++;
    }

    const dt = performance.now() - t0;
    fireBatchMs += dt;
    fireStats.push(dt);
  }, fireIntervalMs);

  // --- Stats loop ---
  const statsTimer = setInterval(() => {
    const t = Math.round((Date.now() - startTime) / 1000);
    const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

    // ms per batch (200-bot batch), and derived packets-per-second
    const mAvg = moveStats.avg();
    const fAvg = fireStats.avg();
    const movePktsPerSec =
      mAvg > 0 ? Math.round((bots.length / mAvg) * 1000) : 0;
    const firePktsPerSec =
      fAvg > 0 ? Math.round((bots.length / fAvg) * 1000) : 0;

    statRows.push({ t, moveAvgMs: mAvg, fireAvgMs: fAvg, memMB });

    console.log(
      `[${String(t).padStart(3)}s]` +
        `  move batch=${mAvg.toFixed(2).padStart(7)}ms (~${String(movePktsPerSec).padStart(6)}/s)` +
        `  fire batch=${fAvg.toFixed(2).padStart(7)}ms (~${String(firePktsPerSec).padStart(6)}/s)` +
        `  mem=${memMB}MB`
    );
  }, CONFIG.statsIntervalMs);

  // --- Shutdown ---
  setTimeout(async () => {
    clearInterval(moveTimer);
    clearInterval(fireTimer);
    clearInterval(statsTimer);

    const elapsed = (Date.now() - startTime) / 1000;
    const memPeak = statRows.length
      ? Math.max(...statRows.map((r) => r.memMB))
      : 0;
    const memAvg = statRows.length
      ? Math.round(statRows.reduce((a, r) => a + r.memMB, 0) / statRows.length)
      : 0;
    const movePeak = statRows.length
      ? Math.max(...statRows.map((r) => r.moveAvgMs)).toFixed(2)
      : "0";
    const firePeak = statRows.length
      ? Math.max(...statRows.map((r) => r.fireAvgMs)).toFixed(2)
      : "0";

    const totalMoveBudgetMs = elapsed * 1000; // 1 batch per ms at 1kHz theoretical max
    const moveCpuPct = ((moveBatchMs / totalMoveBudgetMs) * 100).toFixed(1);
    const fireCpuPct = ((fireBatchMs / totalMoveBudgetMs) * 100).toFixed(1);

    console.log("\n=== FINAL REPORT ===");
    console.log(`Duration:              ${elapsed.toFixed(1)}s`);
    console.log(`Clients:               ${CONFIG.clients}`);
    console.log(`Foundations loaded:    ${foundationCount}`);
    console.log(`Construction pieces:   ${simpleCount + doorCount}`);
    console.log(`Move packets total:    ${totalMovePkts}`);
    console.log(`Fire events total:     ${totalFirePkts}`);
    console.log(
      `Move batch peak:       ${movePeak}ms  (${moveCpuPct}% of wall time)`
    );
    console.log(
      `Fire batch peak:       ${firePeak}ms  (${fireCpuPct}% of wall time)`
    );
    console.log(`Memory avg / peak:     ${memAvg}MB / ${memPeak}MB`);

    if (process.execArgv.some((a) => a.startsWith("--cpu-prof"))) {
      console.log(
        "\nCPU profile written — open .cpuprofile in Chrome DevTools > Performance > Load profile"
      );
    }

    await server.stop();
    process.exit(0);
  }, CONFIG.durationSeconds * 1000);
}

main().catch((err) => {
  console.error("Stress test crashed:", err);
  process.exit(1);
});
