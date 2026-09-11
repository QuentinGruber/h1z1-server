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

import path from "path";
import { Worker } from "worker_threads";
import type { ChunkSnapshot, ExplosionPlan } from "./explosion.worker";

interface PendingRequest {
  resolve: (plan: ExplosionPlan) => void;
  reject: (err: Error) => void;
}

interface WorkerResponse {
  requestId: number;
  plan?: ExplosionPlan;
  error?: string;
}

export class ExplosionWorker {
  private readonly _worker: Worker;
  private _requestId = 0;
  private _pending = new Map<number, PendingRequest>();
  private _stopped = false;

  constructor() {
    const workerPath = path.join(__dirname, "explosion.worker.js");
    this._worker = new Worker(workerPath);

    this._worker.on("message", (msg: WorkerResponse) => {
      const req = this._pending.get(msg.requestId);
      if (!req) return;
      this._pending.delete(msg.requestId);
      if (msg.error) {
        req.reject(new Error(msg.error));
      } else {
        req.resolve(msg.plan!);
      }
    });

    this._worker.on("error", (err: Error) => this._rejectAll(err));
    this._worker.on("exit", (code) => {
      this._stopped = true;
      if (code !== 0)
        this._rejectAll(new Error(`explosion worker exited ${code}`));
    });
  }

  processChunk(snapshot: ChunkSnapshot): Promise<ExplosionPlan> {
    if (this._stopped) {
      return Promise.resolve({
        characterDamages: [],
        vehicleDamages: [],
        constructionDamages: []
      });
    }
    const requestId = this._requestId++;
    return new Promise((resolve, reject) => {
      this._pending.set(requestId, { resolve, reject });
      this._worker.postMessage({ requestId, snapshot });
    });
  }

  async stop(): Promise<void> {
    this._stopped = true;
    this._rejectAll(new Error("explosion worker stopped"));
    await this._worker.terminate();
  }

  private _rejectAll(err: Error): void {
    this._pending.forEach((req) => req.reject(err));
    this._pending.clear();
  }
}
