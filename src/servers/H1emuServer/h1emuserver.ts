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
import { H1emuProtocol } from "../../protocols/h1emuprotocol"; // todo
import Client from "./h1emuclient"; // todo
import { Worker } from "worker_threads";

const debug = require("debug")("H1emuServer");
process.env.isBin && require("./workers/udpServerWorker");

export class H1emuServer extends EventEmitter {
  _serverPort?: number;
  _protocol: any;
  _udpLength: number;
  _clients: any;
  _connection: Worker;

  constructor(serverPort?: number) {
    super();
    EventEmitter.call(this);
    this._serverPort = serverPort;
    this._protocol = new H1emuProtocol();
    this._udpLength = 512;
    this._clients = {};
    this._connection = new Worker(`${__dirname}/workers/udpServerWorker.js`, {
      workerData: { serverPort: serverPort },
    });
  }

  handlePacket(client: Client, packet: any) {
    const result = packet.result;
    if (result) {
      switch (packet.name) {
        case "SessionRequest":
          debug(`Received session request from ${client.address}:${client.port}`);

          this.emit("session")
          break;
        case "test":
          debug(result)
          this.emit("test", null, client, result.msg);
          break;
        default:
          debug(`Unhandled h1emu packet: ${packet.name}`)
          break;
      }
    }
  }

  start(): void {

    this._connection.on("message", (message) => {
      const { data: dataUint8, remote } = message;
      const data = Buffer.from(dataUint8);
      let client: any;
      const clientId = remote.address + ":" + remote.port;

      let newClient;
      if (!this._clients[clientId]) {
        newClient = true;
        client = this._clients[clientId] = new Client(
          remote
        );

        this.emit("connect", null, this._clients[clientId]);
      }

      switch(message.type) {
        case "incomingPacket":
          debug(`received ${data.length} bytes from ${remote.address}:${remote.port}`);
          const result = this._protocol.parse(
            data
          );
          if (result) {
            this.handlePacket(client, result);
          }
          break;
        default:
          debug(`Unknown message type ${message.type}`)
          break;
      }

    });
    if(this._serverPort) {
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
        //length: data.length,
        port: client.port,
        address: client.address,
      },
    });
  }

  /*
  deleteClient(client: SOEClient): void {
    client.clearTimers();
    delete this._clients[client.address + ":" + client.port];
    debug("client connection from port : ", client.port, " deleted");
  }
  */
}

exports.H1emuServer = H1emuServer;
