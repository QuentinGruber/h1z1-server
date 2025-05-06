// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "node:events";
import { SOEOutputChannels } from "servers/SoeServer/soeoutputstream";
import { Worker, MessageChannel } from "node:worker_threads";
import { scheduler } from "node:timers/promises";
import { ClientInfoMessage } from "./gatewayserver.worker";
import path from "node:path";

export enum GatewayServerThreadedInternalEvents {
  START,
  STOP
}

export class GatewayServerThreaded extends EventEmitter {
  worker: Worker;
  appDataChannel: MessageChannel = new MessageChannel();
  loginChannel: MessageChannel = new MessageChannel();
  disconnectChannel: MessageChannel = new MessageChannel();
  clientInfoChannel: MessageChannel = new MessageChannel();
  internalChannel: MessageChannel = new MessageChannel();
  reqCount: number = 0;
  requestQueue: Map<number, any> = new Map();
  constructor(serverPort: number, gatewayKey: Uint8Array) {
    super();
    const workerPath = path.join(__dirname, "gatewayserver.worker.js");
    this.worker = new Worker(workerPath, {
      workerData: {
        serverPort,
        gatewayKey,
        appDataChannel: this.appDataChannel.port1,
        disconnectChannel: this.disconnectChannel.port1,
        loginChannel: this.loginChannel.port1,
        internalChannel: this.internalChannel.port1,
        clientInfoChannel: this.clientInfoChannel.port1
      },
      transferList: [
        this.appDataChannel.port1,
        this.disconnectChannel.port1,
        this.loginChannel.port1,
        this.internalChannel.port1,
        this.clientInfoChannel.port1
      ]
    });
    this.clientInfoChannel.port2.on("message", (msg) => {
      // Resolve the promise with the result
      this.requestQueue.get(msg.requestId)(msg.result);
      this.requestQueue.delete(msg.requestId);
    });
    this.appDataChannel.port2.on("message", (msg) => {
      this.emit(
        "tunneldata",
        msg.sessionId,
        Buffer.from(msg.data),
        msg.channel
      );
    });
    this.disconnectChannel.port2.on("message", (sessionId: number) => {
      this.emit("disconnect", sessionId);
    });
    this.loginChannel.port2.on("message", (msg) => {
      this.emit(
        "login",
        msg.soeClientId,
        msg.characterId,
        msg.ticket,
        msg.client_protocol
      );
    });
    this.internalChannel.port2.on("message", (msg) => {
      console.log(msg);
    });
  }

  start() {
    this.internalChannel.port2.postMessage(
      GatewayServerThreadedInternalEvents.START
    );
  }

  sendTunnelData(
    soeClientId: string,
    data: Buffer,
    channel: SOEOutputChannels
  ) {
    this.appDataChannel.port2.postMessage(
      {
        soeClientId,
        data,
        channel
      }
      // FIXME:  transfering the buffer create weird behavior need to investigate
      // [data.buffer]
    );
  }

  async stop() {
    this.internalChannel.port2.postMessage(
      GatewayServerThreadedInternalEvents.STOP
    );
    await scheduler.wait(1000);
    this.worker.terminate();
  }

  async getSoeClientAvgPing(soeClientId: string): Promise<number | undefined> {
    const fnName = this.getSoeClientAvgPing.name;
    return this.askGatewayThread(fnName, soeClientId);
  }

  async getSoeClientNetworkStats(soeClientId: string): Promise<string[]> {
    const fnName = this.getSoeClientNetworkStats.name;
    return this.askGatewayThread(fnName, soeClientId);
  }

  private askGatewayThread<T>(fnName: string, soeClientId: string): Promise<T> {
    const reqId = this.reqCount++;
    this.clientInfoChannel.port2.postMessage({
      fnName,
      soeClientId,
      requestId: reqId
    } as ClientInfoMessage);
    return new Promise((resolve) => {
      this.requestQueue.set(reqId, resolve);
    });
  }

  async getSoeClientSessionId(
    soeClientId: string
  ): Promise<number | undefined> {
    const fnName = this.getSoeClientSessionId.name;
    return this.askGatewayThread(fnName, soeClientId);
  }
  async getSoeClientNetworkInfos(
    soeClientId: string
  ): Promise<{ address: string; port: number } | undefined> {
    const fnName = this.getSoeClientNetworkInfos.name;
    return this.askGatewayThread(fnName, soeClientId);
  }

  async deleteSoeClient(soeClientId: string) {
    const fnName = this.deleteSoeClient.name;
    return this.askGatewayThread(fnName, soeClientId);
  }
}
