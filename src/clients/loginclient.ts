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

import { SOEClient } from "./soeclient";
import { LoginProtocol } from "../protocols/loginprotocol";

const loginProtocolName = "LoginUdp_9";
const debug = require("debug")("LoginClient");

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

interface LoginProtocolInterface {
  parse: Function;
  pack: Function;
}

export class LoginClient extends EventEmitter {
  _gameId: number;
  _environment: string;
  _soeClient: any;
  _protocol: LoginProtocolInterface;

  constructor(
    gameId: number,
    environment: string,
    serverAddress: string,
    serverPort: number,
    loginKey: Uint8Array,
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
    let n = 0;
    this._soeClient.on("connect", (err: string, result: string) => {
      debug("Connected to login server");
      this.login("FiNgErPrInT");
    });
    this._soeClient.on("disconnect", (err: string, result: string) => {
      debug("Disconnected");
    });
    this._soeClient.on("appdata", (err: string, data: Buffer) => {
      n++;
      let packet, result;
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
            this.emit("charactercreate", null, {
              characterId: result.characterId,
            });
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
      const data = await protocol.pack("LoginRequest", {
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
    const data = this._protocol.pack("ServerListRequest");
    this._soeClient.sendAppData(data, true);
  }

  requestCharacterInfo() {
    debug("Requesting character info");
    const data = this._protocol.pack("CharacterSelectInfoRequest");
    this._soeClient.sendAppData(data, true);
  }

  requestCharacterLogin(characterId: string, serverId: number, payload: any) {
    debug("Requesting character login");
    const data = this._protocol.pack("CharacterLoginRequest", {
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

  requestCharacterCreate() {
    debug("Requesting character create");
    const data = this._protocol.pack("CharacterCreateRequest", {
      serverId: 1,
      unknown: 0,
      payload: {
        empireId: 2,
        headType: 1,
        profileType: 3,
        gender: 1,
        characterName: "test",
      },
    });
    if (data) {
      this._soeClient.sendAppData(data, true);
    } else {
      debug("Could not pack character create request data");
    }
  }
}
