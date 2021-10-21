import { H1emuClient } from "./shared/h1emuclient";
import { H1emuServer } from "./shared/h1emuserver";
const debug = require("debug")("H1emuServer");

export class H1emuLoginServer extends H1emuServer {
  constructor(serverPort?: number) {
    super(serverPort);
    this.messageHandler = function (
      messageType: string,
      data: Buffer,
      client: H1emuClient
    ): void {
      switch (messageType) {
        case "incomingPacket":
          client.lastPing = Date.now();
          const packet = this._protocol.parse(data);
          if (!packet) return;
          switch (packet.name) {
            case "Ping":
              this.ping(client);
              break;
            case "CharacterCreateReply":
            case "CharacterDeleteReply": {
              this.emit("processInternalReq", packet);
              break;
            }
            default:
              this.emit("data", null, client, packet);
              break;
          }
          break;
        default:
          debug(`Unknown message type ${messageType}`);
          break;
      }
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
