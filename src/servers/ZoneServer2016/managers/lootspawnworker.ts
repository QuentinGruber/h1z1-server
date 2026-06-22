import path from "node:path";
import { Worker } from "node:worker_threads";

interface LootPlanEntry {
  spawnerId: number;
  itemDefinitionId: number;
  count: number;
  position: number[];
  rotation: number[];
  functions?: import("types/zoneserver").ItemFunction[];
}

interface NpcPlanEntry {
  spawnerId: number;
  modelId: number;
  position: number[];
  rotation: number[];
  npcId?: number;
}

export interface NpcDespawnSnapshot {
  characterId: string;
  knockedOut: boolean;
  deathTime: number;
}

export interface LootbagDespawnSnapshot {
  characterId: string;
  creationTime: number;
}

export interface ItemDespawnSnapshot {
  characterId: string;
  creationTime: number;
  spawnerId: number;
  itemDefinitionId: number;
}

interface DespawnItemPlanEntry {
  characterId: string;
  spawnerId: number;
  itemDefinitionId: number;
  deleteExplosive: boolean;
}

interface DespawnPlan {
  npcCharacterIds: string[];
  lootbagCharacterIds: string[];
  itemEntries: DespawnItemPlanEntry[];
}

export interface ContainerPropSnapshot {
  characterId: string;
  lootSpawner: string;
  shouldSpawnLoot: boolean;
  position: number[];
  existingItemDefinitionIds: number[];
}

export interface SpawnedItemSnapshot {
  position: [number, number, number];
  itemDefinitionId: number;
}

interface ContainerPlanEntry {
  characterId: string;
  itemDefinitionId: number;
  count: number;
  functions?: import("types/zoneserver").ItemFunction[];
}

type WorkerRequest =
  | {
      requestId: number;
      type: "loot";
      payload: {
        spawnedLootSpawnerIds: number[];
        spawnedItems: SpawnedItemSnapshot[];
        ingameHour: number;
      };
    }
  | {
      requestId: number;
      type: "container";
      payload: {
        props: ContainerPropSnapshot[];
      };
    }
  | {
      requestId: number;
      type: "npcs";
      payload: {
        existingNpcPositions: number[][];
        npcSpawnRadius: number;
        chanceNpc: number;
        chanceScreamer: number;
        chanceGazer: number;
        chanceExploder: number;
        npcSpawnCap: number;
      };
    }
  | {
      requestId: number;
      type: "despawn";
      payload: {
        now: number;
        deadNpcDespawnTimer: number;
        lootbagDespawnTimer: number;
        itemDespawnTimer: number;
        lootDespawnTimer: number;
        fuelItemDefinitionIds: number[];
        npcs: NpcDespawnSnapshot[];
        lootbags: LootbagDespawnSnapshot[];
        items: ItemDespawnSnapshot[];
      };
    };

interface WorkerResponse {
  requestId: number;
  type: "loot" | "container" | "npcs" | "despawn";
  plan?: LootPlanEntry[] | ContainerPlanEntry[] | NpcPlanEntry[] | DespawnPlan;
  error?: string;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: unknown) => void;
}

export class LootSpawnWorker {
  private readonly worker: Worker;
  private requestId = 0;
  private pendingRequests: Map<number, PendingRequest> = new Map();
  private isStopped = false;

  constructor(workerData: {
    groundTables: Record<string, unknown>;
    containerTables: Record<string, unknown>;
  }) {
    const workerPath = path.join(__dirname, "lootspawn.worker.js");
    this.worker = new Worker(workerPath, { workerData });

    this.worker.on("message", (message: WorkerResponse) => {
      const pendingRequest = this.pendingRequests.get(message.requestId);
      if (!pendingRequest) return;

      this.pendingRequests.delete(message.requestId);
      if (message.error) {
        pendingRequest.reject(new Error(message.error));
        return;
      }
      pendingRequest.resolve(message.plan ?? []);
    });

    this.worker.on("error", (error) => {
      this.rejectAllPending(error);
    });

    this.worker.on("exit", (code) => {
      this.isStopped = true;
      if (code !== 0) {
        this.rejectAllPending(
          new Error(`Loot spawn worker exited with code ${code}`)
        );
      }
    });
  }

  createLootPlan(
    spawnedLootSpawnerIds: number[],
    spawnedItems: SpawnedItemSnapshot[],
    ingameHour: number
  ): Promise<LootPlanEntry[]> {
    const request: WorkerRequest = {
      requestId: this.requestId++,
      type: "loot",
      payload: {
        spawnedLootSpawnerIds,
        spawnedItems,
        ingameHour
      }
    };
    return this.request<LootPlanEntry[]>(request);
  }

  createContainerLootPlan(
    props: ContainerPropSnapshot[]
  ): Promise<ContainerPlanEntry[]> {
    const request: WorkerRequest = {
      requestId: this.requestId++,
      type: "container",
      payload: {
        props
      }
    };
    return this.request<ContainerPlanEntry[]>(request);
  }

  createNpcPlan(
    existingNpcPositions: number[][],
    npcSpawnRadius: number,
    chanceNpc: number,
    chanceScreamer: number,
    chanceGazer: number,
    chanceExploder: number,
    npcSpawnCap: number
  ): Promise<NpcPlanEntry[]> {
    const request: WorkerRequest = {
      requestId: this.requestId++,
      type: "npcs",
      payload: {
        existingNpcPositions,
        npcSpawnRadius,
        chanceNpc,
        chanceScreamer,
        chanceGazer,
        chanceExploder,
        npcSpawnCap
      }
    };
    return this.request<NpcPlanEntry[]>(request);
  }

  createDespawnPlan(payload: {
    now: number;
    deadNpcDespawnTimer: number;
    lootbagDespawnTimer: number;
    itemDespawnTimer: number;
    lootDespawnTimer: number;
    fuelItemDefinitionIds: number[];
    npcs: NpcDespawnSnapshot[];
    lootbags: LootbagDespawnSnapshot[];
    items: ItemDespawnSnapshot[];
  }): Promise<DespawnPlan> {
    const request: WorkerRequest = {
      requestId: this.requestId++,
      type: "despawn",
      payload
    };
    return this.request<DespawnPlan>(request);
  }

  async stop(): Promise<void> {
    if (this.isStopped) return;
    this.isStopped = true;
    this.rejectAllPending(new Error("Loot spawn worker stopped"));
    await this.worker.terminate();
  }

  private request<T>(request: WorkerRequest): Promise<T> {
    if (this.isStopped) return Promise.resolve([] as T);

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(request.requestId, {
        resolve,
        reject
      });
      this.worker.postMessage(request);
    });
  }

  private rejectAllPending(error: unknown): void {
    this.pendingRequests.forEach((pendingRequest) =>
      pendingRequest.reject(error)
    );
    this.pendingRequests.clear();
  }
}
