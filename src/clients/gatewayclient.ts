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

const debug = require("debug")("GatewayClient");
import { EventEmitter } from "node:events";
import { GatewayProtocol } from "h1emu-core";
import { SOEClient } from "./soeclient";

export class GatewayClient extends EventEmitter {
  private _protocol: GatewayProtocol;
  private _soeClient: SOEClient;
  constructor(
    serverAddress: string,
    serverPort: number,
    key: any,
    localPort: number
  ) {
    super();
    this._soeClient = new SOEClient(
      "ExternalGatewayApi_3",
      serverAddress,
      serverPort,
      key,
      localPort
    );
    this._protocol = new GatewayProtocol();
    // @ts-ignore
    this._soeClient.on("appdata", (err: any, data: Uint8Array) => {
      const packet = JSON.parse(this._protocol.parse(data));
      switch (packet.name) {
        case "LoginReply":
          if (packet.logged_in) {
            this.emit("login", null, { result: packet });
          }
          break;
        case "TunnelPacket":
          this.emit(
            "tunneldata",
            null,
            Buffer.from(packet.tunnel_data),
            packet.channel
          );
          break;
      }
    });

    // @ts-ignore
    this._soeClient.on("connect", (err: any, result: any) => {
      debug("Connected to login server");
      this._soeClient.toggleEncryption(false);
      this.emit("connect", err, result);
    });
  }

  connect() {
    debug("Connecting to gateway server");
    this._soeClient.connect();
  }

  sendTunnelData(tunnelData: Uint8Array, channel: number) {
    channel = channel || 0;
    debug("Sending tunnel data to gateway server");
    const data = this._protocol.pack_tunnel_data_packet_for_server(
      tunnelData,
      channel
    );
    this._soeClient.sendAppData(data, true);
  }

  login(
    characterId: string,
    ticket: string,
    clientProtocol: string,
    clientBuild: string
  ) {
    debug("Sending login request");
    const data = this._protocol.pack_login_request_packet(
      BigInt(characterId),
      ticket,
      clientProtocol,
      clientBuild
    );
    this._soeClient.sendAppData(data, false);
    this._soeClient.toggleEncryption(true);
  }
}
