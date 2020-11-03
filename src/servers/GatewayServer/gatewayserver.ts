// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "events";

import { SOEServer } from "../SoeServer/soeserver";
import { GatewayProtocol } from "../../protocols/gatewayprotocol";
const debug = require("debug")("GatewayServer");

interface Packet {
  result: any;
  name: string;
  tunnelData: any;
  flags: any;
}

interface GatewayProtocol {
  pack: (arg0: string, arg1: any) => Packet;
  parse: (arg0: any) => Packet;
}

interface SoeServer {
  on: (arg0: string, arg1: any) => void;
  start: (
    compression: any,
    crcSeed: any,
    crcLength: any,
    udpLength: any
  ) => void;
  stop: () => void;
  _sendPacket: () => void;
  sendAppData: (arg0: Client, arg1: any, arg2: undefined | any) => void;
  toggleEncryption: () => void;
  setEncryption: (arg0: boolean) => void;
  toggleDataDump: () => void;
  deleteClient: (client: Client) => void;
}

interface Client {
  sessionId: number;
  address: string;
  port: number;
  crcSeed: number;
  crcLength: number;
  clientUdpLength: number;
  serverUdpLength: number;
  sequences: any;
  compression: number;
  useEncryption: boolean;
  outQueue: any;
  outOfOrderPackets: any;
  nextAck: number;
  lastAck: number;
  inputStream: () => void;
  outputStream: () => void;
  outQueueTimer: () => void;
  ackTimer: () => void;
  outOfOrderTimer: () => void;
}

export class GatewayServer extends EventEmitter {
  _soeServer: SoeServer;
  _protocol: GatewayProtocol;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;
  constructor(protocolName: string, serverPort: number, gatewayKey: string) {
    super();
    this._compression = 0x0000;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;

    this._soeServer = new SOEServer(
      protocolName,
      serverPort,
      gatewayKey,
      this._compression,
      true
    ) as any; // as any since SOEServer isn't typed
    this._protocol = new GatewayProtocol() as GatewayProtocol;
    this._soeServer.on("connect", (err: string, client: Client) => {
      debug("Client connected from " + client.address + ":" + client.port);
      this.emit("connect", err, client);
    });
    this._soeServer.on("disconnect", (err: string, client: Client) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      this.emit("disconnect", err, client);
    });
    this._soeServer.on("session", (err: string, client: Client) => {
      debug("Session started for client " + client.address + ":" + client.port);
    });

    this._soeServer.on(
      "appdata",
      (err: string, client: Client, data: Buffer) => {
        const packet = this._protocol.parse(data);
        if ((packet as any) !== false && packet !== undefined) {
          const result = packet.result;
          switch (packet.name) {
            case "LoginRequest":
              this._soeServer.toggleEncryption();
             this._soeServer.sendAppData(
                client,
                this._protocol.pack("LoginReply", {loggedIn:true}),
                true)

              if (result && result.characterId) {
                this.emit("login", null, client, result.characterId);
              }
              break;
            case "Logout":
              debug("Logout");
              this.emit("logout", null, client);
              break;
            case "TunnelPacketFromExternalConnection":
              debug("TunnelPacketFromExternalConnection");
              this.emit(
                "tunneldata",
                null,
                client,
                packet.tunnelData,
                packet.flags
              );
              break;
          }
        } else {
          debug("Packet parsing was unsuccesful");
        }
      }
    );
    this.on("logout", (err: string, client: Client) => {
      this._soeServer.deleteClient(client);
    });
  }
  start() {
    debug("Starting server");
    this._soeServer.start(
      this._compression,
      this._crcSeed,
      this._crcLength,
      this._udpLength
    );
  }
  sendTunnelData(client: Client, tunnelData: any) {
    debug("Sending tunnel data to client");
    const data = this._protocol.pack("TunnelPacketToExternalConnection", {
      channel: 0,
      tunnelData: tunnelData,
    });
    (this._soeServer.sendAppData as any)(client, data);
  }
  stop() {
    debug("Shutting down");
    process.exit(0);
  }
}
