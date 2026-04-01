import { parentPort, workerData } from "node:worker_threads";
import { H1Z1Protocol } from "../../../protocols/h1z1protocol";

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

const protocol = new H1Z1Protocol(workerData.protocolName);

parentPort?.on("message", (request: PacketEncodeRequest) => {
  try {
    const packed = protocol.pack(request.packetName, request.payload);
    if (!packed) {
      const nullResponse: PacketEncodeResponse = {
        requestId: request.requestId,
        isNull: true
      };
      parentPort?.postMessage(nullResponse);
      return;
    }

    const encoded = new SharedArrayBuffer(packed.length);
    const encodedView = new Uint8Array(encoded);
    encodedView.set(packed);

    const response: PacketEncodeResponse = {
      requestId: request.requestId,
      encoded,
      encodedLength: packed.length
    };
    parentPort?.postMessage(response);
  } catch (error) {
    const errorResponse: PacketEncodeResponse = {
      requestId: request.requestId,
      error: String(error)
    };
    parentPort?.postMessage(errorResponse);
  }
});
