// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "events";
import { H1emuProtocol } from "../../protocols/h1emuprotocol";
import { H1emuClient as Client } from "./h1emuclient";
import { Worker } from "worker_threads";

const debug = require("debug")("H1emuServer");
process.env.isBin && require("../shared/workers/udpServerWorker.js");

export class H1emuServer extends EventEmitter {
  _serverPort?: number;
  _protocol: any;
  _udpLength: number;
  _clients: any;
  _connection: Worker;

  constructor(serverPort?: number) {
    super();
    this._serverPort = serverPort;
    this._protocol = new H1emuProtocol();
    this._udpLength = 512;
    this._clients = {};
    this._connection = new Worker(`${__dirname}/workers/udpServerWorker.js`, {
      workerData: { serverPort: serverPort },
    });
  }

  start(): void {
    this._connection.on("message", (message) => {
      const { data: dataUint8, remote } = message;
      const data = Buffer.from(dataUint8);
      let client: any;
      const clientId = remote.address + ":" + remote.port;

      if (!this._clients[clientId]) {
        client = this._clients[clientId] = new Client(
          remote
        );
        this.emit("connect", null, this._clients[clientId]);
      }
      else {
        client = this._clients[clientId]
      }

      switch(message.type) {
        case "incomingPacket":
          const packet = this._protocol.parse(data);
          if (!packet) return;
          switch(packet.name) {
            //case "SessionRequest":
            case "Ping":
              break;
            case "SessionReply":
              this.emit("session", null, client, packet.data.status);
              break;
            default:
              this.emit("data", null, client, packet);
              break;
          }
          break;
        default:
          debug(`Unknown message type ${message.type}`)
          break;
      }

    });
    if(this._serverPort) { // only server (loginserver) has its port bound
      this._connection.postMessage({ type: "bind" });
    }
  }

  stop(): void {
    this._connection.postMessage({ type: "close" });
    process.exit(0);
  }

  sendData(client: any, packetName: any, obj: any) {
    const data = this._protocol.pack(
      packetName,
      obj
    );
    this._connection.postMessage({
      type: "sendPacket",
      data: {
        packetData: data,
        port: client.port,
        address: client.address,
      },
    });
  }

}

exports.H1emuServer = H1emuServer;
