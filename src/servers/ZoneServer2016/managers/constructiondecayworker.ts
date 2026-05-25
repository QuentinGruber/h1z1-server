// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { Worker, isMainThread, parentPort } from "node:worker_threads";

export interface EntityDecaySnapshot {
  characterId: string;
  isDecayProtected: boolean;
  maxHealth: number;
  /** Pre-computed on main thread: true = skip decay (ramps, stairs, foundations, expansions) */
  skipDecay: boolean;
}

export interface ConstructionDecayRequest {
  requestId: number;
  type: "decayDamage";
  payload: {
    ticksToFullDecay: number;
    worldFreeplaceDecayMultiplier: number;
    foundations: EntityDecaySnapshot[];
    worldLootable: EntityDecaySnapshot[];
    worldSimple: EntityDecaySnapshot[];
    constructionSimple: EntityDecaySnapshot[];
    lootableConstruction: EntityDecaySnapshot[];
    constructionDoors: EntityDecaySnapshot[];
  };
}

export interface DecayDamageResult {
  entitiesToDamage: { characterId: string; damage: number }[];
  decayProtectedResets: string[];
}

interface ConstructionDecayResponse {
  requestId: number;
  type: "decayDamage";
  result: DecayDamageResult;
  error?: string;
}

// ── Worker thread logic ──────────────────────────────────────────────

function processEntities(
  entities: EntityDecaySnapshot[],
  ticksToFullDecay: number,
  multiplier: number,
  entitiesToDamage: { characterId: string; damage: number }[],
  decayProtectedResets: string[]
) {
  for (const entity of entities) {
    if (entity.skipDecay) continue;
    if (entity.isDecayProtected) {
      decayProtectedResets.push(entity.characterId);
      continue;
    }
    entitiesToDamage.push({
      characterId: entity.characterId,
      damage: entity.maxHealth / (ticksToFullDecay / multiplier)
    });
  }
}

function computeDecayDamage(
  payload: ConstructionDecayRequest["payload"]
): DecayDamageResult {
  const entitiesToDamage: { characterId: string; damage: number }[] = [];
  const decayProtectedResets: string[] = [];
  const { ticksToFullDecay, worldFreeplaceDecayMultiplier } = payload;

  processEntities(
    payload.foundations,
    ticksToFullDecay,
    1,
    entitiesToDamage,
    decayProtectedResets
  );
  processEntities(
    payload.worldLootable,
    ticksToFullDecay,
    worldFreeplaceDecayMultiplier,
    entitiesToDamage,
    decayProtectedResets
  );
  processEntities(
    payload.worldSimple,
    ticksToFullDecay,
    worldFreeplaceDecayMultiplier,
    entitiesToDamage,
    decayProtectedResets
  );
  processEntities(
    payload.constructionSimple,
    ticksToFullDecay,
    1,
    entitiesToDamage,
    decayProtectedResets
  );
  processEntities(
    payload.lootableConstruction,
    ticksToFullDecay,
    1,
    entitiesToDamage,
    decayProtectedResets
  );
  processEntities(
    payload.constructionDoors,
    ticksToFullDecay,
    1,
    entitiesToDamage,
    decayProtectedResets
  );

  return { entitiesToDamage, decayProtectedResets };
}

if (!isMainThread) {
  parentPort!.on("message", (request: ConstructionDecayRequest) => {
    try {
      const result = computeDecayDamage(request.payload);
      const response: ConstructionDecayResponse = {
        requestId: request.requestId,
        type: "decayDamage",
        result
      };
      parentPort!.postMessage(response);
    } catch (e: any) {
      const response: ConstructionDecayResponse = {
        requestId: request.requestId,
        type: "decayDamage",
        result: { entitiesToDamage: [], decayProtectedResets: [] },
        error: e?.message ?? String(e)
      };
      parentPort!.postMessage(response);
    }
  });
}

// ── Main thread host ─────────────────────────────────────────────────

interface PendingRequest {
  resolve: (value: DecayDamageResult) => void;
  reject: (reason?: unknown) => void;
}

export class ConstructionDecayWorker {
  private readonly worker: Worker;
  private requestId = 0;
  private readonly pendingRequests: Map<number, PendingRequest> = new Map();
  private isStopped = false;

  constructor() {
    this.worker = new Worker(__filename);

    this.worker.on("message", (message: ConstructionDecayResponse) => {
      const pendingRequest = this.pendingRequests.get(message.requestId);
      if (!pendingRequest) return;
      this.pendingRequests.delete(message.requestId);
      if (message.error) {
        pendingRequest.reject(new Error(message.error));
        return;
      }
      pendingRequest.resolve(message.result);
    });

    this.worker.on("error", (error) => {
      this.rejectAllPending(error);
    });

    this.worker.on("exit", (code) => {
      this.isStopped = true;
      if (code !== 0) {
        this.rejectAllPending(
          new Error(`Construction decay worker exited with code ${code}`)
        );
      }
    });
  }

  computeDecayDamage(
    payload: ConstructionDecayRequest["payload"]
  ): Promise<DecayDamageResult> {
    const request: ConstructionDecayRequest = {
      requestId: this.requestId++,
      type: "decayDamage",
      payload
    };
    return this.request(request);
  }

  async stop(): Promise<void> {
    if (this.isStopped) return;
    this.isStopped = true;
    this.rejectAllPending(new Error("Construction decay worker stopped"));
    await this.worker.terminate();
  }

  private request(
    request: ConstructionDecayRequest
  ): Promise<DecayDamageResult> {
    if (this.isStopped) {
      return Promise.resolve({
        entitiesToDamage: [],
        decayProtectedResets: []
      });
    }
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(request.requestId, { resolve, reject });
      this.worker.postMessage(request);
    });
  }

  private rejectAllPending(error: unknown): void {
    this.pendingRequests.forEach((p) => p.reject(error));
    this.pendingRequests.clear();
  }
}
