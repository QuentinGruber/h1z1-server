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
import { H1emuProtocol } from "../../../protocols/h1emuprotocol";
import { H1emuClient as Client, H1emuClient } from "./h1emuclient";
import { Worker } from "worker_threads";
import { RemoteInfo } from "dgram";

const debug = require("debug")("H1emuServer");
process.env.isBin && require("../../shared/workers/udpServerWorker.js");

export class H1emuServer extends EventEmitter {
  _serverPort?: number;
  _protocol: any;
  _udpLength: number = 512;
  _clients: any = {};
  _connection: Worker;
  _pingTime: number = 10000; // ms
  _pingTimeout: number = 60000;
  _pingTimer!: NodeJS.Timeout;
  constructor(serverPort?: number) {
    super();
    this._serverPort = serverPort;
    this._protocol = new H1emuProtocol();
    this._connection = new Worker(`${__dirname}/../../shared/workers/udpServerWorker.js`, {
      workerData: { serverPort: serverPort },
    });
  }


  clientHandler(remote:RemoteInfo):H1emuClient{
    let client: any;
    const clientId = `${remote.address}:${remote.port}`

    if (!this._clients[clientId]) {
      client = this._clients[clientId] = new Client(remote);
      this.emit("connect", null, this._clients[clientId]);
    }
    else {
      client = this._clients[clientId]
    }
    return client;
  }

  messageHandler(messageType:string,data:Buffer,client:H1emuClient):void{
    throw new Error("You need to implement messageHandler !");
  }

  connectionHandler(message:any):void{
    const { data: dataUint8, remote } = message;
    const client = this.clientHandler(remote);
    const data = Buffer.from(dataUint8);
    this.messageHandler(message.type,data,client);
  }

  start(): void {
    this._connection.on("message", (message)=>this.connectionHandler(message));

    this._connection.postMessage({ type: "bind" });
  }

  stop(): void {
    this._connection.postMessage({ type: "close" });
    process.exit(0);
  }

  sendData(client: Client = {} as Client, packetName: any, obj: any) {
    // blocks zone from sending packet without open session
    if(!client || !client.session && packetName !== "SessionRequest") return; 
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

  connect(serverInfo: any, obj: any) {
    this.sendData(serverInfo as Client, "SessionRequest", obj)
  }

  ping(client: any) {
    this.sendData(client, "Ping", {});
    this._pingTimer.refresh();
  }

}

exports.H1emuServer = H1emuServer;
