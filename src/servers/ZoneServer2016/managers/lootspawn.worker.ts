import { parentPort, workerData } from "node:worker_threads";
import { PluginManager } from "./pluginmanager";
import type {
  GroundLootTableJson,
  ContainerLootTableJson,
  LootCondition,
  LootPool,
  LootTableEntry,
  ItemFunction
} from "types/zoneserver";

const Z1_items = PluginManager.loadServerData("2016/zoneData/Z1_items.json");
const Z1_npcs = PluginManager.loadServerData("2016/zoneData/Z1_npcs.json");
const Z1_POIs = PluginManager.loadServerData("2016/zoneData/Z1_POIs.json");

const { groundTables, containerTables } = workerData as {
  groundTables: Record<string, GroundLootTableJson>;
  containerTables: Record<string, ContainerLootTableJson>;
};

interface SpawnedItemSnapshot {
  position: [number, number, number];
  itemDefinitionId: number;
}

interface LootPlanRequest {
  requestId: number;
  type: "loot";
  payload: {
    spawnedLootSpawnerIds: number[];
    spawnedItems: SpawnedItemSnapshot[];
    ingameHour: number;
  };
}

interface ContainerPropSnapshot {
  characterId: string;
  lootSpawner: string;
  shouldSpawnLoot: boolean;
  position: number[];
  existingItemDefinitionIds: number[];
}

interface ContainerPlanRequest {
  requestId: number;
  type: "container";
  payload: {
    props: ContainerPropSnapshot[];
  };
}

interface NpcPlanRequest {
  requestId: number;
  type: "npcs";
  payload: {
    existingNpcPositions: number[][];
    npcSpawnRadius: number;
    chanceNpc: number;
    chanceScreamer: number;
  };
}

interface DespawnRequest {
  requestId: number;
  type: "despawn";
  payload: {
    now: number;
    deadNpcDespawnTimer: number;
    lootbagDespawnTimer: number;
    itemDespawnTimer: number;
    lootDespawnTimer: number;
    fuelItemDefinitionIds: number[];
    npcs: Array<{
      characterId: string;
      knockedOut: boolean;
      deathTime: number;
    }>;
    lootbags: Array<{
      characterId: string;
      creationTime: number;
    }>;
    items: Array<{
      characterId: string;
      creationTime: number;
      spawnerId: number;
      itemDefinitionId: number;
    }>;
  };
}

type WorkerRequest =
  | LootPlanRequest
  | ContainerPlanRequest
  | NpcPlanRequest
  | DespawnRequest;

interface LootPlanEntry {
  spawnerId: number;
  itemDefinitionId: number;
  count: number;
  position: number[];
  rotation: number[];
  functions?: ItemFunction[];
}

interface ContainerPlanEntry {
  characterId: string;
  itemDefinitionId: number;
  count: number;
  functions?: ItemFunction[];
}

interface ResolvedEntry {
  itemDefinitionId: number;
  count: number;
  functions?: ItemFunction[];
}

interface NpcPlanEntry {
  spawnerId: number;
  modelId: number;
  position: number[];
  rotation: number[];
}

interface DespawnPlan {
  npcCharacterIds: string[];
  lootbagCharacterIds: string[];
  itemEntries: Array<{
    characterId: string;
    spawnerId: number;
    itemDefinitionId: number;
    deleteExplosive: boolean;
  }>;
}

interface WorkerResponse {
  requestId: number;
  type: "loot" | "container" | "npcs" | "despawn";
  plan?: LootPlanEntry[] | ContainerPlanEntry[] | NpcPlanEntry[] | DespawnPlan;
  error?: string;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function getAuthorizedNpcModels(actorDefinition: string): number[] {
  switch (actorDefinition) {
    case "NPCSpawner_ZombieLazy.adr":
    case "NPCSpawner_ZombieWalker.adr":
      return [9510, 9634];
    case "NPCSpawner_Deer001.adr":
      return [9002, 9253];
    case "NPCSpawner_Wolf001.adr":
      return [9003];
    case "Bear_Brown.adr":
      return [9187];
    default:
      return [];
  }
}

function isPosInRadius(
  radius: number,
  position1: number[],
  position2: number[]
): boolean {
  const x = position1[0] - position2[0];
  const y = position1[1] - position2[1];
  const z = position1[2] - position2[2];
  return Math.sqrt(x * x + y * y + z * z) <= radius;
}

function isPosInRadius2D(
  radius: number,
  position1: number[],
  position2: number[]
): boolean {
  const x = position1[0] - position2[0];
  const z = position1[2] - position2[2];
  return Math.sqrt(x * x + z * z) <= radius;
}

function isInsidePolygon(point: [number, number], vs: number[][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Returns true if the XZ position is inside a POI's polygon bounds or radius. */
function isPosInPoi(position: number[], poi: any): boolean {
  if (poi.bounds) {
    for (const bound of poi.bounds) {
      if (isInsidePolygon([position[0], position[2]], bound)) return true;
    }
    return false;
  }
  if (poi.range && poi.position) {
    return isPosInRadius2D(poi.range, position, poi.position);
  }
  return false;
}

// ── Condition evaluation ──────────────────────────────────────────────────────

interface LootContext {
  position: number[];
  spawnedItems: SpawnedItemSnapshot[];
  ingameHour: number;
}

function evaluateConditions(
  conditions: LootCondition[],
  ctx: LootContext
): boolean {
  for (const cond of conditions) {
    switch (cond.condition) {
      case "in_poi": {
        const match = Z1_POIs.some((poi: any) => {
          if (cond.poi_ids && !cond.poi_ids.includes(poi.POIid)) return false;
          if (cond.poi_names && !cond.poi_names.includes(poi.POIname))
            return false;
          return isPosInPoi(ctx.position, poi);
        });
        if (!match) return false;
        break;
      }

      case "not_in_poi": {
        const anyPoi = Z1_POIs.some((poi: any) =>
          isPosInPoi(ctx.position, poi)
        );
        if (anyPoi) return false;
        break;
      }

      case "poi_tag": {
        const match = Z1_POIs.some(
          (poi: any) =>
            Array.isArray(poi.tags) &&
            (cond.tags ?? []).some((tag: string) => poi.tags.includes(tag)) &&
            isPosInPoi(ctx.position, poi)
        );
        if (!match) return false;
        break;
      }

      case "not_poi_tag": {
        // Skip pool if the position is inside ANY POI that has one of the given tags
        const inTaggedPoi = Z1_POIs.some(
          (poi: any) =>
            Array.isArray(poi.tags) &&
            (cond.tags ?? []).some((tag: string) => poi.tags.includes(tag)) &&
            isPosInPoi(ctx.position, poi)
        );
        if (inTaggedPoi) return false;
        break;
      }

      case "random_chance": {
        if (Math.random() * 100 > (cond.chance ?? 100)) return false;
        break;
      }

      case "elevation_range": {
        const y = ctx.position[1];
        if (cond.min !== undefined && y < cond.min) return false;
        if (cond.max !== undefined && y > cond.max) return false;
        break;
      }

      case "item_density": {
        const ids = new Set<number>(cond.item_ids ?? []);
        const radius = cond.radius ?? 50;
        const maxCount = cond.max_count ?? 1;
        let count = 0;
        for (const item of ctx.spawnedItems) {
          if (!ids.has(item.itemDefinitionId)) continue;
          if (isPosInRadius2D(radius, ctx.position, item.position)) {
            count++;
            if (count >= maxCount) break;
          }
        }
        if (count >= maxCount) return false;
        break;
      }

      case "server_time": {
        const hour = ctx.ingameHour;
        const min = cond.hour_min ?? 0;
        const max = cond.hour_max ?? 23;
        // Support wrap-around (e.g. 22–04)
        const active =
          min <= max ? hour >= min && hour <= max : hour >= min || hour <= max;
        if (!active) return false;
        break;
      }
    }
  }
  return true;
}

/**
 * Returns entries from all pools whose conditions pass for the given context.
 * Pools with empty conditions arrays always pass.
 */
function getEligibleEntries(
  pools: LootPool[],
  ctx: LootContext
): LootTableEntry[] {
  const entries: LootTableEntry[] = [];
  for (const pool of pools) {
    if (evaluateConditions(pool.conditions, ctx)) {
      entries.push(...pool.entries);
    }
  }
  return entries;
}

function getRandomItem(items: LootTableEntry[]): LootTableEntry | undefined {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  const randomWeight = Math.random() * totalWeight;
  let currentWeight = 0;
  for (let i = 0; i < items.length; i++) {
    currentWeight += items[i].weight;
    if (currentWeight > randomWeight) return items[i];
  }
  return undefined;
}

/**
 * Resolves a raw LootTableEntry to a concrete item, handling entry types:
 * - "item" (default): returns the item directly.
 * - "loot_table": recursively draws from the referenced table.
 * - "empty": returns null (no item spawns).
 * Depth-limited to 5 to prevent infinite cycles.
 */
function resolveEntry(
  entry: LootTableEntry | undefined,
  ctx: LootContext,
  depth = 0
): ResolvedEntry | null {
  if (!entry || depth > 5) return null;
  const type = entry.type ?? "item";

  if (type === "empty") return null;

  if (type === "loot_table") {
    const table =
      (containerTables[entry.table ?? ""] as
        | { pools: LootPool[] }
        | undefined) ??
      (groundTables[entry.table ?? ""] as { pools: LootPool[] } | undefined);
    if (!table) return null;
    const eligible = getEligibleEntries(table.pools, ctx);
    return resolveEntry(getRandomItem(eligible), ctx, depth + 1);
  }

  // type === "item"
  if (entry.item === undefined) return null;
  const count = entry.count
    ? Math.floor(
        Math.random() * (entry.count.max - entry.count.min + 1) +
          entry.count.min
      )
    : 1;
  return { itemDefinitionId: entry.item, count, functions: entry.functions };
}

// ── Loot plan ────────────────────────────────────────────────────────────────

function createLootPlan(
  spawnedLootSpawnerIds: number[],
  spawnedItems: SpawnedItemSnapshot[],
  ingameHour: number
): LootPlanEntry[] {
  const spawnedSet = new Set<number>(spawnedLootSpawnerIds);
  const plan: LootPlanEntry[] = [];

  for (const spawnerType of Z1_items) {
    const lootTable = groundTables[spawnerType.actorDefinition];
    if (!lootTable) continue;

    for (const itemInstance of spawnerType.instances) {
      if (spawnedSet.has(itemInstance.id)) continue;

      const chance = Math.floor(Math.random() * 100) + 1;
      if (chance > lootTable.spawnChance) continue;

      const ctx: LootContext = {
        position: itemInstance.position,
        spawnedItems,
        ingameHour
      };

      const entries = getEligibleEntries(lootTable.pools, ctx);
      if (!entries.length) continue;

      const resolved = resolveEntry(getRandomItem(entries), ctx);
      if (!resolved) continue;

      plan.push({
        spawnerId: itemInstance.id,
        itemDefinitionId: resolved.itemDefinitionId,
        count: resolved.count,
        position: itemInstance.position,
        rotation: itemInstance.rotation,
        functions: resolved.functions
      });
    }
  }

  return plan;
}

// ── Container loot plan ───────────────────────────────────────────────────────

function createContainerLootPlan(
  props: ContainerPropSnapshot[]
): ContainerPlanEntry[] {
  const plan: ContainerPlanEntry[] = [];

  for (const prop of props) {
    if (!prop.shouldSpawnLoot) continue;
    if (prop.existingItemDefinitionIds.length > 0) continue;

    const lootTable = containerTables[prop.lootSpawner];
    if (!lootTable) continue;

    // Containers don't use item_density / server_time / loot_tier by default,
    // but they can — pass neutral values so conditions still evaluate correctly.
    const ctx: LootContext = {
      position: prop.position,
      spawnedItems: [],
      ingameHour: 12
    };

    const containerItemIds = new Set<number>(prop.existingItemDefinitionIds);

    for (const pool of lootTable.pools) {
      if (!evaluateConditions(pool.conditions, ctx)) continue;

      const rolls = pool.rolls
        ? Math.floor(
            Math.random() * (pool.rolls.max - pool.rolls.min + 1) +
              pool.rolls.min
          )
        : 1;

      for (let r = 0; r < rolls; r++) {
        const resolved = resolveEntry(getRandomItem(pool.entries), ctx);
        if (!resolved) continue;
        if (containerItemIds.has(resolved.itemDefinitionId)) continue;
        plan.push({
          characterId: prop.characterId,
          itemDefinitionId: resolved.itemDefinitionId,
          count: resolved.count,
          functions: resolved.functions
        });
        containerItemIds.add(resolved.itemDefinitionId);
      }
    }
  }

  return plan;
}

// ── NPC plan ──────────────────────────────────────────────────────────────────

function createNpcPlan(
  existingNpcPositions: number[][],
  npcSpawnRadius: number,
  chanceNpc: number,
  chanceScreamer: number
): NpcPlanEntry[] {
  const plan: NpcPlanEntry[] = [];
  const plannedPositions: number[][] = [...existingNpcPositions];

  for (const spawnerType of Z1_npcs) {
    const baseModels = getAuthorizedNpcModels(spawnerType.actorDefinition);
    if (!baseModels.length) continue;

    for (const npcInstance of spawnerType.instances) {
      const spawnCount: number = npcInstance.count ?? 1;
      for (let i = 0; i < spawnCount; i++) {
        let pos: number[] = npcInstance.position;
        if (i > 0) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 4 + Math.random() * 4;
          pos = [
            npcInstance.position[0] + Math.cos(angle) * dist,
            npcInstance.position[1],
            npcInstance.position[2] + Math.sin(angle) * dist,
            1
          ];
        }

        let blocked = false;
        for (const npcPos of plannedPositions) {
          if (isPosInRadius(npcSpawnRadius, pos, npcPos)) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;

        const spawnChanceRoll = Math.floor(Math.random() * 100) + 1;
        if (spawnChanceRoll > chanceNpc) continue;

        const models = [...baseModels];
        const screamerChanceRoll = Math.floor(Math.random() * 1000) + 1;
        if (screamerChanceRoll <= chanceScreamer) models.push(9667);

        const modelId = models[Math.floor(Math.random() * models.length)];
        plan.push({
          spawnerId: i === 0 ? npcInstance.id : 0,
          modelId,
          position: pos,
          rotation: npcInstance.rotation
        });
        plannedPositions.push([pos[0], pos[1], pos[2]]);
      }
    }
  }

  return plan;
}

// ── Despawn plan ──────────────────────────────────────────────────────────────

function createDespawnPlan(payload: DespawnRequest["payload"]): DespawnPlan {
  const fuelItemDefinitionIds = new Set<number>(payload.fuelItemDefinitionIds);

  return {
    npcCharacterIds: payload.npcs
      .filter(
        (npc) =>
          npc.knockedOut &&
          payload.now - npc.deathTime >= payload.deadNpcDespawnTimer
      )
      .map((npc) => npc.characterId),
    lootbagCharacterIds: payload.lootbags
      .filter(
        (lootbag) =>
          payload.now - lootbag.creationTime >= payload.lootbagDespawnTimer
      )
      .map((lootbag) => lootbag.characterId),
    itemEntries: payload.items
      .filter((item) => {
        const despawnTime =
          item.spawnerId === -1
            ? payload.itemDespawnTimer
            : payload.lootDespawnTimer;
        return payload.now - item.creationTime >= despawnTime;
      })
      .map((item) => ({
        characterId: item.characterId,
        spawnerId: item.spawnerId,
        itemDefinitionId: item.itemDefinitionId,
        deleteExplosive: fuelItemDefinitionIds.has(item.itemDefinitionId)
      }))
  };
}

// ── Message handler ───────────────────────────────────────────────────────────

parentPort?.on("message", (request: WorkerRequest) => {
  try {
    if (request.type === "loot") {
      const plan = createLootPlan(
        request.payload.spawnedLootSpawnerIds,
        request.payload.spawnedItems,
        request.payload.ingameHour
      );
      parentPort?.postMessage({
        requestId: request.requestId,
        type: "loot",
        plan
      } as WorkerResponse);
      return;
    }

    if (request.type === "npcs") {
      const plan = createNpcPlan(
        request.payload.existingNpcPositions,
        request.payload.npcSpawnRadius,
        request.payload.chanceNpc,
        request.payload.chanceScreamer
      );
      parentPort?.postMessage({
        requestId: request.requestId,
        type: "npcs",
        plan
      } as WorkerResponse);
      return;
    }

    if (request.type === "despawn") {
      const plan = createDespawnPlan(request.payload);
      parentPort?.postMessage({
        requestId: request.requestId,
        type: "despawn",
        plan
      } as WorkerResponse);
      return;
    }

    const plan = createContainerLootPlan(request.payload.props);
    parentPort?.postMessage({
      requestId: request.requestId,
      type: "container",
      plan
    } as WorkerResponse);
  } catch (error) {
    parentPort?.postMessage({
      requestId: request.requestId,
      type: request.type,
      error: String(error)
    } as WorkerResponse);
  }
});
