// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "node:events";
import SOEClient from "../SoeServer/soeclient";
import { SOEOutputChannels } from "servers/SoeServer/soeoutputstream";
import { Worker, MessageChannel } from "node:worker_threads";
import { scheduler } from "node:timers/promises";

export enum GatewayServerThreadedInternalEvents {
  START,
  STOP
}

export class GatewayServerThreaded extends EventEmitter {
  worker: Worker;
  appDataChannel: MessageChannel = new MessageChannel();
  loginChannel: MessageChannel = new MessageChannel();
  disconnectChannel: MessageChannel = new MessageChannel();
  internalChannel: MessageChannel = new MessageChannel();
  constructor(serverPort: number, gatewayKey: Uint8Array) {
    super();
    this.worker = new Worker(
      "./out/servers/GatewayServer/gatewayserver.worker.js",
      {
        workerData: {
          serverPort,
          gatewayKey,
          appDataChannel: this.appDataChannel.port1,
          disconnectChannel: this.disconnectChannel.port1,
          loginChannel: this.loginChannel.port1,
          internalChannel: this.internalChannel.port1
        },
        transferList: [
          this.appDataChannel.port1,
          this.disconnectChannel.port1,
          this.loginChannel.port1,
          this.internalChannel.port1
        ]
      }
    );
    this.appDataChannel.port2.on("message", (msg) => {
      this.emit("tunneldata", msg.client, msg.data, msg.channel);
    });
    this.disconnectChannel.port2.on("message", (msg) => {
      this.emit("disconnect", msg.client);
    });
    this.loginChannel.port2.on("message", (msg) => {
      this.emit(
        "login",
        msg.client,

        msg.character_id,
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

  sendTunnelData(client: SOEClient, data: Buffer, channel: SOEOutputChannels) {
    this.appDataChannel.port2.postMessage(
      {
        client,
        data,
        channel
      },
      [data.buffer]
    );
  }

  async stop() {
    this.internalChannel.port2.postMessage(
      GatewayServerThreadedInternalEvents.STOP
    );
    await scheduler.wait(1000);
    this.worker.terminate();
  }

  getSoeClient(soeClientId: string): SOEClient | undefined {
    soeClientId;
    // TODO: implement
    // return this._soeServer.getSoeClient(soeClientId);
    return undefined;
  }

  deleteSoeClient(soeClient: SOEClient) {
    soeClient;
    // TODO: implement
    // this._soeServer.deleteClient(soeClient);
  }
}
