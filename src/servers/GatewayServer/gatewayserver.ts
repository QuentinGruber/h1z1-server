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

import { EventEmitter } from "events";
import { SOEServer } from "../SoeServer/soeserver";
import { GatewayProtocol } from "h1emu-core";
import SOEClient from "../SoeServer/soeclient";
import { crc_length_options } from "../../types/soeserver";

const debug = require("debug")("GatewayServer");

export class GatewayServer extends EventEmitter {
  _soeServer: SOEServer;
  _protocol: GatewayProtocol;
  private _crcSeed: number;
  private _crcLength: crc_length_options;
  private _udpLength: number;

  constructor(serverPort: number, gatewayKey: Uint8Array) {
    super();
    this._crcSeed = 0;
    this._crcLength = 0;
    this._udpLength = 512;

    this._soeServer = new SOEServer(serverPort, gatewayKey);
    this._soeServer._useEncryption = false; // communication is encrypted only after loginRequest
    this._protocol = new GatewayProtocol();
    this._soeServer.on("disconnect", (client: SOEClient) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      this.emit("disconnect", client);
    });

    this._soeServer.on(
      "appdata",
      (client: SOEClient, data: Uint8Array, isRawData: boolean) => {
        if (isRawData) {
          this.emit("tunneldata", client, data, 0);
          return;
        }
        const packet = JSON.parse(this._protocol.parse(data));
        if (packet) {
          switch (packet.name) {
            case "LoginRequest":
              if (packet.character_id) {
                this._soeServer.toggleEncryption(client);
                const appData = this._protocol.pack_login_reply_packet(true);
                if (appData) {
                  this._soeServer.sendAppData(client, appData);
                }
                this.emit(
                  "login",
                  client,
                  packet.character_id,
                  packet.ticket,
                  packet.client_protocol
                );
              }
              break;
            case "Logout":
              debug("Logout gateway");
              this.emit("disconnect", client);
              break;
            case "TunnelPacket":
              this.emit(
                "tunneldata",
                client,
                Buffer.from(packet.tunnel_data),
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
    const data = this._protocol.pack_tunnel_data_packet_for_client(tunnelData);
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
