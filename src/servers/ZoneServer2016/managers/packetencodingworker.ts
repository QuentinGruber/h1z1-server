import path from "node:path";
import { Worker } from "node:worker_threads";
import { h1z1PacketsType2016 } from "types/packets";

interface PacketEncodeRequest {
  requestId: number;
  packetName: string;
  payload: unknown;
}

interface PacketEncodeResponse {
  requestId: number;
  encoded?: SharedArrayBuffer;
  encodedLength?: number;
  isNull?: boolean;
  error?: string;
}

interface PendingRequest {
  resolve: (value: Buffer | null) => void;
  reject: (reason?: unknown) => void;
}

export class PacketEncodingWorker {
  private readonly worker: Worker;
  private requestId = 0;
  private pendingRequests: Map<number, PendingRequest> = new Map();
  private isStopped = false;

  constructor(protocolName: string) {
    const workerPath = path.join(__dirname, "packetencoding.worker.js");
    this.worker = new Worker(workerPath, {
      workerData: {
        protocolName
      }
    });

    this.worker.on("message", (message: PacketEncodeResponse) => {
      const pendingRequest = this.pendingRequests.get(message.requestId);
      if (!pendingRequest) return;

      this.pendingRequests.delete(message.requestId);
      if (message.error) {
        pendingRequest.reject(new Error(message.error));
        return;
      }

      if (message.isNull || !message.encoded || !message.encodedLength) {
        pendingRequest.resolve(null);
        return;
      }

      pendingRequest.resolve(
        Buffer.from(message.encoded, 0, message.encodedLength)
      );
    });

    this.worker.on("error", (error) => {
      this.rejectAllPending(error);
    });

    this.worker.on("exit", (code) => {
      this.isStopped = true;
      if (code !== 0) {
        this.rejectAllPending(
          new Error(`Packet encoding worker exited with code ${code}`)
        );
      }
    });
  }

  encodePacket<ZonePacket>(
    packetName: h1z1PacketsType2016,
    payload: ZonePacket
  ): Promise<Buffer | null> {
    if (this.isStopped) return Promise.resolve(null);

    const requestId = this.requestId++;
    const request: PacketEncodeRequest = {
      requestId,
      packetName,
      payload
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve,
        reject
      });
      this.worker.postMessage(request);
    });
  }

  async stop(): Promise<void> {
    if (this.isStopped) return;

    this.isStopped = true;
    this.rejectAllPending(new Error("Packet encoding worker stopped"));
    await this.worker.terminate();
  }

  private rejectAllPending(error: unknown): void {
    this.pendingRequests.forEach((pendingRequest) =>
      pendingRequest.reject(error)
    );
    this.pendingRequests.clear();
  }
}
