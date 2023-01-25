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

import { H1emuClient } from "./shared/h1emuclient";
import { H1emuServer } from "./shared/h1emuserver";

export class H1emuLoginServer extends H1emuServer {
  constructor(serverPort?: number) {
    super(serverPort);
    this.messageHandler = function (
      messageType: string,
      data: Buffer,
      client: H1emuClient
    ): void {
      const packet = this._protocol.parse(data);
      if (!packet) return;
      switch (packet.name) {
        case "Ping":
          this.ping(client);
          break;
        case "CharacterCreateReply":
        case "CharacterExistReply":
        case "CharacterDeleteReply":
        case "ClientIsAdminReply": {
          this.emit("processInternalReq", packet, ["status"]);
          break;
        }
        default:
          this.emit("data", null, client, packet);
          break;
      }
    };
    this.ping = (client: H1emuClient) => {
      this.updateClientLastPing(client.clientId);
      super.ping(client);
    };
    this._pingTimer = setTimeout(() => {
      for (const key in this._clients) {
        const client = this._clients[key];
        if (Date.now() > client.lastPing + this._pingTimeout) {
          this.emit("disconnect", null, client, 1);
          delete this._clients[client.clientId];
        }
      }
      this._pingTimer.refresh();
    }, this._pingTime);
  }
}
