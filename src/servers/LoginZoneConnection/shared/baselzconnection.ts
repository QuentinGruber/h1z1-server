// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "node:events";
import { LZConnectionProtocol } from "../../../protocols/lzconnectionprotocol";
import { LZConnectionClient } from "./lzconnectionclient";
import { Worker } from "node:worker_threads";
import { RemoteInfo } from "node:dgram";

const debug = require("debug")("LZConnection");
process.env.isBin && require("../../shared/workers/udpServerWorker.js");

export abstract class BaseLZConnection extends EventEmitter {
  _serverPort?: number;
  _protocol: LZConnectionProtocol;
  _udpLength: number = 512;
  _clients: { [clientId: string]: LZConnectionClient } = {};
  _connection: Worker;
  _pingTime: number = 5000; // ms
  _pingTimeout: number = 12000;
  _pingTimer!: NodeJS.Timeout;
  protected constructor(serverPort?: number) {
    super();
    this._serverPort = serverPort;
    this._protocol = new LZConnectionProtocol();
    this._connection = new Worker(
      `${__dirname}/../../shared/workers/udpServerWorker.js`,
      {
        workerData: { serverPort: serverPort }
      }
    );
  }

  clientHandler(remote: RemoteInfo, opcode: number): LZConnectionClient | void {
    let client: LZConnectionClient;
    const clientId: string = `${remote.address}:${remote.port}`;
    if (!this._clients[clientId]) {
      // if client doesn't exist yet, only accept sessionrequest or sessionreply
      if (opcode !== 0x01 && opcode !== 0x02) return;
      client = this._clients[clientId] = new LZConnectionClient(remote);
      this.updateClientLastPing(clientId);
    } else {
      client = this._clients[clientId];
    }
    return client;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  messageHandler(
    messageType: string,
    data: Buffer,
    client: LZConnectionClient
  ): void {
    throw new Error("You need to implement messageHandler !");
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  connectionHandler(message: any): void {
    const { data: dataUint8, remote } = message;
    const data = Buffer.from(dataUint8);
    const client = this.clientHandler(remote, dataUint8[0]);
    if (client) {
      this.messageHandler(message.type, data, client);
    } else {
      debug(`Connection rejected from remote ${remote.address}:${remote.port}`);
    }
  }

  start(): void {
    this._connection.on("message", (message) =>
      this.connectionHandler(message)
    );

    this._connection.postMessage({ type: "bind" });
  }

  stop(): void {
    this._connection.postMessage({ type: "close" });
    process.exitCode = 0;
  }

  sendData(client: LZConnectionClient | undefined, packetName: any, obj: any) {
    // blocks zone from sending packet without open session
    if (!client || (!client.serverId && packetName !== "SessionRequest"))
      return;
    const data = this._protocol.pack(packetName, obj);
    if (data) {
      this._connection.postMessage(
        {
          type: "sendPacket",
          data: {
            packetData: data,
            port: client.port,
            address: client.address
          }
        },
        [data.buffer]
      );
    }
  }

  ping(client: LZConnectionClient) {
    this.sendData(client, "Ping", {});
  }

  updateClientLastPing(clientId: string) {
    this._clients[clientId].lastPing = Date.now();
  }
}

exports.BaseLZConnection = BaseLZConnection;
