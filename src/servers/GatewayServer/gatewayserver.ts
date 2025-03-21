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
import { SOEServer } from "../SoeServer/soeserver";
import { GatewayProtocol } from "h1emu-core";
import SOEClient from "../SoeServer/soeclient";
import { crc_length_options } from "../../types/soeserver";
import { SOEOutputChannels } from "servers/SoeServer/soeoutputstream";

const debug = require("debug")("GatewayServer");

export class GatewayServer extends EventEmitter {
  private _soeServer: SOEServer;
  private _protocol: GatewayProtocol;
  private _crcLength: crc_length_options;
  private _udpLength: number;

  constructor(serverPort: number, gatewayKey: Uint8Array) {
    super();
    this._crcLength = 2;
    this._udpLength = 512;

    this._soeServer = new SOEServer(serverPort, gatewayKey);
    this._soeServer._useEncryption = false; // communication is encrypted only after loginRequest
    this._soeServer.keepAliveTimeoutTime = 20000; // On zone a client expire after 20s without activity
    this._protocol = new GatewayProtocol();
    this._soeServer.on("disconnect", (client: SOEClient) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      this.emit("disconnect", client.sessionId);
    });

    this._soeServer.on(
      "appdata",
      (client: SOEClient, data: Uint8Array, isRawData: boolean) => {
        if (isRawData) {
          this.emit("tunneldata", client, data, 0);
          return;
        }
        try {
          const packet = JSON.parse(this._protocol.parse(data));
          if (packet) {
            switch (packet.name) {
              case "LoginRequest":
                if (packet.character_id) {
                  this._soeServer.setEncryption(client, true);
                  const appData = this._protocol.pack_login_reply_packet(true);
                  if (appData) {
                    this._soeServer.sendAppData(client, appData);
                  }
                  this.emit(
                    "login",
                    client.soeClientId,
                    packet.character_id,
                    packet.ticket,
                    packet.client_protocol
                  );
                }
                break;
              case "Logout":
                debug("Logout gateway");
                this.emit("disconnect", client.sessionId);
                break;
              case "TunnelPacket":
                this.emit(
                  "tunneldata",
                  client.sessionId,
                  Buffer.from(packet.tunnel_data),
                  packet.channel
                );
                break;
            }
          } else {
            console.log(`Unsupported gateway packet ${packet.name}`);
            console.log(packet);
          }
        } catch (e) {
          console.error("Gateway: packet parsing failed");
          console.log(data);
          console.log(e);
        }
      }
    );
  }

  getSoeClientAvgPing(soeClientId: string): number | undefined {
    return this._soeServer.getSoeClient(soeClientId)?.avgPing;
  }

  isSoeClientFlooded(soeClientId: string): boolean {
    return !this._soeServer.getSoeClient(soeClientId)?.outputStream.isFlooded();
  }

  getSoeClientNetworkStats(soeClientId: string): string[] | undefined {
    return this._soeServer.getSoeClient(soeClientId)?.getNetworkStats();
  }

  getServerNetworkStats(): string[] {
    return this._soeServer.getNetworkStats();
  }

  getSoeClientSessionId(soeClientId: string): number | undefined {
    return this._soeServer.getSoeClient(soeClientId)?.sessionId;
  }

  getSoeClientNetworkInfos(
    soeClientId: string
  ): { address: string; port: number } | undefined {
    const client = this._soeServer.getSoeClient(soeClientId);
    if (client) {
      return { address: client.address, port: client.port };
    }
  }

  deleteSoeClient(soeClientId: string) {
    const soeClient = this._soeServer.getSoeClient(soeClientId);
    if (soeClient) {
      this._soeServer.deleteClient(soeClient);
    }
  }

  start() {
    debug("Starting server");
    this._soeServer.start(this._crcLength, this._udpLength);
  }

  sendTunnelData(
    soeClientId: string,
    tunnelData: Buffer,
    channel: SOEOutputChannels
  ) {
    debug("Sending tunnel data to client");
    const data = this._protocol.pack_tunnel_data_packet_for_client(
      tunnelData,
      0
    );
    if (data) {
      const client = this._soeServer.getSoeClient(soeClientId);
      if (client) {
        this._soeServer.sendAppData(client, data, channel);
      }
    }
  }

  async stop() {
    debug("Stopping server");
    await this._soeServer.stop();
  }
}
