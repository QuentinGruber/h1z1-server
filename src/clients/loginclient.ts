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
var SOEClient = require("./soeclient").SOEClient,
  https = require("https"),
  util = require("util"),
  LoginProtocol = require("../protocols/loginprotocol").LoginProtocol,
  loginProtocolName = "LoginUdp_9",
  debug = require("debug")("LoginClient");

interface SoeClient {
  on: Function;
  emit: Function;
  connect: Function;
  start: Function;
  stop: Function;
  _sessionId: number;
  _protocol: LoginProtocol;
  _sendPacket: Function;
  sendAppData: Function;
  toggleEncryption: Function;
  toggleDataDump: Function;
}

interface LoginProtocol {
  parse: Function;
  pack: Function;
}

export class LoginClient extends EventEmitter {
  _gameId: number;
  _environment: string;
  _soeClient: SoeClient;
  _protocol: LoginProtocol;
  constructor(
    gameId: number,
    environment: string,
    serverAddress: string,
    serverPort: number,
    loginKey: string,
    localPort: number
  ) {
    super();
    this._gameId = gameId;
    this._environment = environment;
    this._soeClient = new SOEClient(
      loginProtocolName,
      serverAddress,
      serverPort,
      loginKey,
      localPort
    );
    this._protocol = new LoginProtocol();
    var n = 0;
    this._soeClient.on("connect", (err: string, result: string) => {
      debug("Connected to login server");
      this.login("FiNgErPrInT");
    });
    this._soeClient.on("disconnect", (err: string, result: string) => {
      debug("Disconnected");
    });
    this._soeClient.on("appdata", (err: string, data: Buffer) => {
      n++;
      var packet, result;
      try {
        packet = this._protocol.parse(data);
      } catch (e) {
        debug("Failed parsing app data loginclient_appdata_" + n + ".dat");
        return;
      }

      result = packet.result;

      switch (packet.name) {
        case "LoginReply":
          if (result.status === 1) {
            this.emit("login", null, {
              loggedIn: result.loggedIn,
              isMember: result.isMember,
            });
          } else {
            this.emit("login", "Login failed");
          }
          break;
        case "ForceDisconnect":
          break;
        case "CharacterLoginReply":
          if (result.status === 1) {
            debug(JSON.stringify(result, null, 4));
            this.emit("characterlogin", null, result);
          } else {
            this.emit("characterlogin", "Character login failed");
          }
          break;
        case "CharacterCreateReply":
          if (result.status === 1) {
            this.emit("charactercreate", null, {});
          } else {
            this.emit("charactercreate", "Character create failed");
          }
          break;
        case "CharacterDeleteReply":
          if (result.status === 1) {
            this.emit("characterdelete", null, {});
          } else {
            this.emit("characterdelete", "Character delete failed");
          }
          break;
        case "CharacterSelectInfoReply":
          if (result.status === 1) {
            this.emit("characterinfo", null, result);
          } else {
            this.emit("characterinfo", "Character info failed");
          }
          break;
        case "ServerListReply":
          this.emit("serverlist", null, {
            servers: result.servers,
          });
          break;
        case "ServerUpdate":
          if (result.status === 1) {
            this.emit("serverupdate", null, result.server);
          } else {
            this.emit("serverupdate", "Server update failed");
          }
          break;
        case "TunnelAppPacketServerToClient":
          break;
      }
    });
  }
  connect() {
    debug("Connecting to login server");
    this._soeClient.connect();
  }

  async login(fingerprint: string) {
    async function SetupLoginRequest(
      fingerprint: any,
      sessionId: any,
      protocol: any
    ) {
      var data = await protocol.pack("LoginRequest", {
        sessionId: sessionId,
        systemFingerPrint: fingerprint,
      });
      return data;
    }
    var data = await SetupLoginRequest(
      fingerprint,
      this._soeClient._sessionId.toString(),
      this._protocol
    );
    debug("Sending login request");
    this._soeClient.sendAppData(data, true);

    this.emit("connect");
  }

  disconnect() {
    this.emit("disconnect");
  }

  requestServerList() {
    debug("Requesting server list");
    var data = this._protocol.pack("ServerListRequest");
    this._soeClient.sendAppData(data, true);
  }

  requestCharacterInfo() {
    debug("Requesting character info");
    var data = this._protocol.pack("CharacterSelectInfoRequest");
    this._soeClient.sendAppData(data, true);
  }

  requestCharacterLogin(characterId: number, serverId: number, payload: any) {
    debug("Requesting character login");
    var data = this._protocol.pack("CharacterLoginRequest", {
      characterId: characterId,
      serverId: serverId,
      payload: payload,
    });
    if (data) {
      this._soeClient.sendAppData(data, true);
    } else {
      debug("Could not pack character login request data");
    }
  }

  requestCharacterDelete = function () {};

  requestCharacterCreate = function () {};
}
