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

import { LZConnectionClient } from "./shared/lzconnectionclient";
import { BaseLZConnection } from "./shared/baselzconnection";
const debug = require("debug")("BaseLZConnection");

/**
 * Handles connections between the zoneserver and the loginserver
 * Instantiated by a zoneserver only.
 */
export class LoginConnectionManager extends BaseLZConnection {
  _loginServerInfo: any;
  _sessionData: any;
  _loginConnection?: LZConnectionClient;
  _maxConnectionRetry: number = 0;
  _hasBeenConnectedToLogin: boolean = false;
  constructor(serverId: number, serverPort?: number) {
    super(serverPort);
    this.messageHandler = (data: Buffer, client: LZConnectionClient): void => {
      const packet = this._protocol.parse(data);
      debug(packet);
      if (!packet) return;
      switch (packet.name) {
        case "Ping":
          this.updateClientLastPing(client.clientId);
          break;
        case "SessionReply": {
          debug(`Received session reply from ${client.address}:${client.port}`);
          if (
            client.clientId !==
            `${this._loginServerInfo.address}:${this._loginServerInfo.port}`
          ) {
            // blocks unknown sessionreplies
            debug(`LoginConnection refused: Unknown login address / port`);
            return;
          }
          if (client.serverId) {
            // ignores sessionreplies with an already open session
            debug(
              `LoginConnection already had open session, ignoring SessionReply`
            );
            return;
          }
          if (packet.data.status === 1) {
            this._hasBeenConnectedToLogin = true;
            client.serverId = serverId;
            this._loginConnection = client;
            this.emit("session", null, client);
          } else {
            debug(`LoginConnection refused: Zone not whitelisted`);
            this.emit("sessionfailed", null, client);
          }
          break;
        }
        default:
          this.emit("data", null, client, packet);
          break;
      }
    };
    this.ping = (client: LZConnectionClient) => {
      if (client?.serverId) {
        super.ping(client);
        if (Date.now() > client.lastPing + this._pingTimeout) {
          this.emit("disconnect", null, client, 1);
          delete this._loginConnection;
          delete this._clients[client.clientId];
        }
      } else {
        this.connect();
      }
      this._pingTimer.refresh();
    };
  }
  connect() {
    this.sendData(
      this._loginServerInfo as LZConnectionClient,
      "SessionRequest",
      this._sessionData
    );
    this._maxConnectionRetry++;
    if (!this._hasBeenConnectedToLogin && this._maxConnectionRetry > 10) {
      throw new Error(
        "Can't connect to loginServer " + JSON.stringify(this._loginServerInfo)
      );
    }
  }

  setLoginInfo(serverInfo: any, obj: any) {
    this._loginServerInfo = serverInfo;
    this._sessionData = obj;
  }

  async stop() {
    if (this._pingTimer) {
      clearTimeout(this._pingTimer);
    }
    super.stop();
  }

  async start() {
    if (!this._loginServerInfo || !this._sessionData) {
      console.log(
        "[ERROR] LoginConnectionManager started without setting login info!"
      );
      return;
    }
    await super.start();
    this.connect();
    this._pingTimer = setTimeout(() => {
      this.ping(this._loginConnection as LZConnectionClient);
    }, this._pingTime);
  }
}
