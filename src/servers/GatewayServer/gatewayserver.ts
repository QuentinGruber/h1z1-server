// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "events";
import { SOEServer } from "../SoeServer/soeserver";
import { GatewayProtocol } from "../../protocols/gatewayprotocol";
import SOEClient from "../SoeServer/soeclient";
import { crc_length_options } from "../../types/soeserver";

const debug = require("debug")("GatewayServer");

export class GatewayServer extends EventEmitter {
  _soeServer: SOEServer;
  _protocol: GatewayProtocol;
  private _compression: number;
  private _crcSeed: number;
  private _crcLength: crc_length_options;
  private _udpLength: number;

  constructor(
    protocolName: string,
    serverPort: number,
    gatewayKey: Uint8Array
  ) {
    super();
    this._compression = 0x0100;
    this._crcSeed = 0;
    this._crcLength = 0;
    this._udpLength = 512;

    this._soeServer = new SOEServer(protocolName, serverPort, gatewayKey);
    this._soeServer._useEncryption = false; // communication is encrypted only after loginRequest
    this._protocol = new GatewayProtocol();
    this._soeServer.on("disconnect", (err: string, client: SOEClient) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      this.emit("disconnect", err, client);
    });

    this._soeServer.on(
      "appdata",
      (err: string, client: SOEClient, data: Buffer) => {
        const packet = this._protocol.parse(data);
        if (packet) {
          const result = packet.result;
          switch (packet.name) {
            case "LoginRequest":
              if (result && result.characterId) {
                this._soeServer.toggleEncryption(client);
                const appData = this._protocol.pack("LoginReply", {
                  loggedIn: true,
                });
                if (appData) {
                  this._soeServer.sendAppData(client, appData);
                }
                this.emit(
                  "login",
                  null,
                  client,
                  result.characterId,
                  result.ticket,
                  result.clientProtocol
                );
              }
              break;
            case "Logout":
              debug("Logout gateway");
              this.emit("disconnect", err, client);
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
  }

  start() {
    debug("Starting server");
    this._soeServer.start(this._crcLength, this._udpLength);
  }

  private _sentTunnelData(
    client: SOEClient,
    tunnelData: Buffer,
    unbuffered: boolean
  ) {
    debug("Sending tunnel data to client");
    const data = this._protocol.pack("TunnelPacketToExternalConnection", {
      channel: 0,
      tunnelData: tunnelData,
    });
    if (data) {
      if (unbuffered) {
        this._soeServer.sendUnbufferedAppData(client, data);
      } else {
        this._soeServer.sendAppData(client, data);
      }
    }
  }

  sendTunnelData(client: SOEClient, tunnelData: Buffer) {
    this._sentTunnelData(client, tunnelData, false);
  }

  sendUnbufferedTunnelData(client: SOEClient, tunnelData: Buffer) {
    this._sentTunnelData(client, tunnelData, true);
  }

  stop() {
    debug("Shutting down");
    process.exitCode = 0;
  }
}
