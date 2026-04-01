import { parentPort } from "node:worker_threads";
import { PluginManager } from "./pluginmanager";
import { lootTables, containerLootSpawners } from "../data/lootspawns";

const Z1_items = PluginManager.loadServerData("2016/zoneData/Z1_items.json");
const Z1_npcs = PluginManager.loadServerData("2016/zoneData/Z1_npcs.json");
const Z1_nerfedPOIs = PluginManager.loadServerData(
  "2016/zoneData/Z1_nerfedPOIs"
);

interface LootPlanRequest {
  requestId: number;
  type: "loot";
  payload: {
    spawnedLootSpawnerIds: number[];
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
}

interface ContainerPlanEntry {
  characterId: string;
  itemDefinitionId: number;
  count: number;
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

function isInsideSquare(point: [number, number], vs: number[][]): boolean {
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

function getLootNerfedValue(position: number[]): number {
  let nerfedValue = 0;
  for (const point of Z1_nerfedPOIs) {
    if (point.bounds) {
      for (const bound of point.bounds) {
        if (isInsideSquare([position[0], position[2]], bound)) {
          nerfedValue = point.nerfValue;
          break;
        }
      }
      continue;
    }
    if (isPosInRadius(point.range, position, point.position)) {
      nerfedValue = point.nerfValue;
    }
  }
  return nerfedValue;
}

function getRandomItem(
  items: Array<{
    item: number;
    weight: number;
    spawnCount: { min: number; max: number };
  }>
) {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  const randomWeight = Math.random() * totalWeight;
  let currentWeight = 0;
  for (let i = 0; i < items.length; i++) {
    currentWeight += items[i].weight;
    if (currentWeight > randomWeight) return items[i];
  }
  return undefined;
}

function createLootPlan(spawnedLootSpawnerIds: number[]): LootPlanEntry[] {
  const spawnedSet = new Set<number>(spawnedLootSpawnerIds);
  const plan: LootPlanEntry[] = [];

  for (const spawnerType of Z1_items) {
    const lootTable = lootTables[spawnerType.actorDefinition];
    if (!lootTable) continue;

    for (const itemInstance of spawnerType.instances) {
      if (spawnedSet.has(itemInstance.id)) continue;

      const chance = Math.floor(Math.random() * 100) + 1;
      const nerf = getLootNerfedValue(itemInstance.position);
      const threshold = lootTable.spawnChance * (1 - nerf / 100);
      if (chance > threshold) continue;

      const item = getRandomItem(lootTable.items);
      if (!item) continue;

      const count = Math.floor(
        Math.random() * (item.spawnCount.max - item.spawnCount.min + 1) +
          item.spawnCount.min
      );
      plan.push({
        spawnerId: itemInstance.id,
        itemDefinitionId: item.item,
        count,
        position: itemInstance.position,
        rotation: itemInstance.rotation
      });
    }
  }

  return plan;
}

function createContainerLootPlan(
  props: ContainerPropSnapshot[]
): ContainerPlanEntry[] {
  const plan: ContainerPlanEntry[] = [];

  for (const prop of props) {
    if (!prop.shouldSpawnLoot) continue;
    if (prop.existingItemDefinitionIds.length > 0) continue;

    const lootTable = containerLootSpawners[prop.lootSpawner];
    if (!lootTable) continue;

    const containerItemIds = new Set<number>(prop.existingItemDefinitionIds);
    for (let x = 0; x < lootTable.maxItems; x++) {
      const item = getRandomItem(lootTable.items);
      if (!item) continue;

      if (containerItemIds.has(item.item)) {
        x--;
        continue;
      }

      const chance = Math.floor(Math.random() * 100) + 1;
      const nerf = getLootNerfedValue(prop.position);
      const threshold = item.weight * (1 - nerf / 100);
      if (chance > threshold) continue;

      const count = Math.floor(
        Math.random() * (item.spawnCount.max - item.spawnCount.min + 1) +
          item.spawnCount.min
      );

      plan.push({
        characterId: prop.characterId,
        itemDefinitionId: item.item,
        count
      });
      containerItemIds.add(item.item);
    }
  }

  return plan;
}

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
      let blocked = false;
      for (const npcPos of plannedPositions) {
        if (isPosInRadius(npcSpawnRadius, npcInstance.position, npcPos)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      const spawnChanceRoll = Math.floor(Math.random() * 100) + 1;
      if (spawnChanceRoll > chanceNpc) continue;

      const models = [...baseModels];
      const screamerChanceRoll = Math.floor(Math.random() * 1000) + 1;
      if (screamerChanceRoll <= chanceScreamer) {
        models.push(9667);
      }

      const modelId = models[Math.floor(Math.random() * models.length)];
      plan.push({
        spawnerId: npcInstance.id,
        modelId,
        position: npcInstance.position,
        rotation: npcInstance.rotation
      });
      plannedPositions.push(npcInstance.position);
    }
  }

  return plan;
}

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

parentPort?.on("message", (request: WorkerRequest) => {
  try {
    if (request.type === "loot") {
      const plan = createLootPlan(request.payload.spawnedLootSpawnerIds);
      const response: WorkerResponse = {
        requestId: request.requestId,
        type: "loot",
        plan
      };
      parentPort?.postMessage(response);
      return;
    }

    if (request.type === "npcs") {
      const plan = createNpcPlan(
        request.payload.existingNpcPositions,
        request.payload.npcSpawnRadius,
        request.payload.chanceNpc,
        request.payload.chanceScreamer
      );
      const response: WorkerResponse = {
        requestId: request.requestId,
        type: "npcs",
        plan
      };
      parentPort?.postMessage(response);
      return;
    }

    if (request.type === "despawn") {
      const plan = createDespawnPlan(request.payload);
      const response: WorkerResponse = {
        requestId: request.requestId,
        type: "despawn",
        plan
      };
      parentPort?.postMessage(response);
      return;
    }

    const plan = createContainerLootPlan(request.payload.props);
    const response: WorkerResponse = {
      requestId: request.requestId,
      type: "container",
      plan
    };
    parentPort?.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      requestId: request.requestId,
      type: request.type,
      error: String(error)
    };
    parentPort?.postMessage(response);
  }
});
