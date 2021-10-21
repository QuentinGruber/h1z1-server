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
import { SOEServer } from "../SoeServer/soeserver";
import { GatewayProtocol } from "../../protocols/gatewayprotocol";
import SOEClient from "servers/SoeServer/soeclient";

const debug = require("debug")("GatewayServer");

export class GatewayServer extends EventEmitter {
  _soeServer: SOEServer;
  _protocol: GatewayProtocol;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;

  constructor(
    protocolName: string,
    serverPort: number,
    gatewayKey: Uint8Array
  ) {
    super();
    this._compression = 0;
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
    this._soeServer._useEncryption = false; // communication is encrypted only after loginRequest
    this._protocol = new GatewayProtocol();
    this._soeServer.on("connect", (err: string, client: SOEClient) => {
      debug("Client connected from " + client.address + ":" + client.port);
      this.emit("connect", err, client);
    });
    this._soeServer.on("disconnect", (err: string, client: SOEClient) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      this.emit("disconnect", err, client);
    });
    this._soeServer.on("session", (err: string, client: SOEClient) => {
      debug("Session started for client " + client.address + ":" + client.port);
    });

    this._soeServer.on(
      "appdata",
      (err: string, client: SOEClient, data: Buffer) => {
        const packet = this._protocol.parse(data);
        if (packet) {
          const result = packet.result;
          switch (packet.name) {
            case "LoginRequest":
              this._soeServer.toggleEncryption(client);
              this._soeServer.sendAppData(
                client,
                this._protocol.pack("LoginReply", { loggedIn: true }),
                true
              );

              if (result && result.characterId) {
                this.emit(
                  "login",
                  null,
                  client,
                  result.characterId,
                  result.ticket
                );
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
    this.on("logout", (err: string, client: SOEClient) => {
      this._soeServer.deleteClient(client);
    });
  }

  start(useLocalConfig:boolean = false) {
    debug("Starting server");
    if(useLocalConfig){
      this._soeServer._isLocal = true;
    }
    this._soeServer.start(
      this._compression,
      this._crcSeed,
      this._crcLength,
      this._udpLength
    );
  }

  sendTunnelData(client: SOEClient, tunnelData: any, channel = 0) {
    debug("Sending tunnel data to client");
    const data = this._protocol.pack("TunnelPacketToExternalConnection", {
      channel: channel,
      tunnelData: tunnelData,
    });
    (this._soeServer.sendAppData as any)(client, data);
  }

  stop() {
    debug("Shutting down");
    process.exit(0);
  }
}
