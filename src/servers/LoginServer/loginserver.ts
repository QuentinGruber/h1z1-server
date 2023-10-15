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

import { EventEmitter } from "node:events";

import { SOEServer } from "../SoeServer/soeserver";
import { ZoneConnectionManager } from "../LoginZoneConnection/zoneconnectionmanager";
import { LZConnectionClient } from "../LoginZoneConnection/shared/lzconnectionclient";
import { LoginProtocol } from "../../protocols/loginprotocol";
import { Collection, MongoClient } from "mongodb";
import {
  _,
  generateRandomGuid,
  getAppDataFolderPath,
  initMongo,
  setupAppDataFolder,
  isValidCharacterName,
  resolveHostAddress
} from "../../utils/utils";
import {
  BANNED_LIGHT,
  ConnectionAllowed,
  GameServer,
  UserSession
} from "../../types/loginserver";
import Client from "servers/LoginServer/loginclient";
import fs from "node:fs";
import { loginPacketsType } from "types/packets";
import { Worker } from "node:worker_threads";
import { FileHash, httpServerMessage } from "types/shared";
import { LoginProtocol2016 } from "../../protocols/loginprotocol2016";
import { crc_length_options } from "../../types/soeserver";
import { DB_NAME, DEFAULT_CRYPTO_KEY } from "../../utils/constants";
import { healthThreadDecorator } from "../../servers/shared/workers/healthWorker";
import {
  LoginReply,
  CharacterSelectInfoReply,
  ServerListReply,
  CharacterDeleteReply,
  CharacterLoginReply,
  CharacterCreateReply,
  CharacterDeleteRequest,
  CharacterLoginRequest,
  CharacterCreateRequest,
  LoginUdp_11packets,
  LoginRequest
} from "types/LoginUdp_11packets";
import { LoginUdp_9packets } from "types/LoginUdp_9packets";
import { getCharacterModelData } from "../shared/functions";
import LoginClient from "servers/LoginServer/loginclient";
import {
  CONNECTION_REJECTION_FLAGS,
  DB_COLLECTIONS,
  GAME_VERSIONS,
  NAME_VALIDATION_STATUS
} from "../../utils/enums";
import DataSchema from "h1z1-dataschema";
import { applicationDataKOTK } from "../../packets/LoginUdp/LoginUdp_11/loginpackets";
import { Resolver } from "node:dns";

const debugName = "LoginServer";
const debug = require("debug")(debugName);
const characterItemDefinitionsDummy = require("../../../data/2015/sampleData/characterItemDefinitionsDummy.json");
const defaultHashes: Array<FileHash> = require("../../../data/2016/dataSources/AllowedFileHashes.json");

@healthThreadDecorator
export class LoginServer extends EventEmitter {
  _soeServer: SOEServer;
  _protocol: LoginProtocol;
  _protocol2016: LoginProtocol2016;
  _db: any;
  _crcLength: crc_length_options;
  _udpLength: number;
  private readonly _cryptoKey: Uint8Array;
  private readonly _mongoAddress: string;
  private readonly _soloMode: boolean;
  private readonly _appDataFolder: string;
  private _httpServer!: Worker;
  _enableHttpServer: boolean;
  _httpServerPort: number = 80;
  private _zoneConnectionManager!: ZoneConnectionManager;
  private _zoneConnections: { [LZConnectionClientId: string]: number } = {};
  private _internalReqCount: number = 0;
  private _pendingInternalReq: { [requestId: number]: any } = {};
  private _pendingInternalReqTimeouts: { [requestId: number]: NodeJS.Timeout } =
    {};
  private _soloPlayIp: string = process.env.SOLO_PLAY_IP || "127.0.0.1";
  private clients: Map<string, LoginClient>;
  private _resolver = new Resolver();
  constructor(serverPort: number, mongoAddress = "") {
    super();
    this._crcLength = 2;
    this._udpLength = 512;
    this._cryptoKey = Buffer.from(DEFAULT_CRYPTO_KEY, "base64");
    this._soloMode = false;
    this._mongoAddress = mongoAddress;
    this._appDataFolder = getAppDataFolderPath();
    this._enableHttpServer = false;
    this.clients = new Map();

    // reminders
    if (!this._mongoAddress) {
      this._soloMode = true;
      debug("Server in solo mode !");
    }

    this._soeServer = new SOEServer(serverPort, this._cryptoKey);
    // 2016 client doesn't send a disconnect packet so we've to use that
    // But that can't be enabled on zoneserver
    this._soeServer._usePingTimeout = true;

    this._protocol = new LoginProtocol();
    this._protocol2016 = new LoginProtocol2016();

    this._soeServer.on("disconnect", (client: Client) => {
      debug(`Client disconnected from ${client.address}:${client.port}`);
      this.Logout(client);
    });

    this._soeServer.on("appdata", async (client: Client, data: Buffer) => {
      try {
        const packet: { name: string; result: any } | null = this.parseData(
          client.protocolName,
          data
        );
        debug(packet);
        if (packet?.result) {
          // if packet parsing succeed
          switch (packet.name) {
            case "LoginRequest":
              await this.LoginRequest(client, packet.result);
              break;
            case "CharacterSelectInfoRequest":
              await this.CharacterSelectInfoRequest(client);
              break;
            case "ServerListRequest":
              await this.ServerListRequest(client);
              break;
            case "CharacterDeleteRequest":
              await this.CharacterDeleteRequest(client, packet.result);
              break;
            case "CharacterLoginRequest":
              await this.CharacterLoginRequest(client, packet.result);
              break;
            case "CharacterCreateRequest":
              await this.CharacterCreateRequest(client, packet.result);
              break;
            case "TunnelAppPacketClientToServer": // only used for nameValidation rn
              await this.TunnelAppPacketClientToServer(client, packet);
              break;
            case "Logout":
              this.Logout(client);
              break;
          }
        } else {
          debug("Packet parsing was unsuccesful");
        }
      } catch (error) {
        console.log(error);
        process.exitCode = 1;
      }
    });

    if (!this._soloMode) {
      this._zoneConnectionManager = new ZoneConnectionManager(1110);

      this._zoneConnectionManager.on(
        "data",
        async (err: string, client: LZConnectionClient, packet: any) => {
          if (err) {
            console.error(err);
            return;
          }
          try {
            const connectionEstablished: boolean =
              !!this._zoneConnections[client.clientId];
            if (connectionEstablished || packet.name === "SessionRequest") {
              switch (packet.name) {
                case "SessionRequest": {
                  const { serverId, h1emuVersion } = packet.data;
                  debug(
                    `Received session request from ${client.address}:${client.port}`
                  );
                  let status = 0;
                  const server = await this._db
                    .collection(DB_COLLECTIONS.SERVERS)
                    .findOne({ serverId: serverId, isDisabled: false });
                  if (server) {
                    const fullServerAddress = server.serverAddress;
                    const serverAddress = fullServerAddress.split(":")[0];
                    if (serverAddress) {
                      const resolvedServerAddress = await resolveHostAddress(
                        this._resolver,
                        serverAddress
                      );
                      if (resolvedServerAddress.includes(client.address)) {
                        status = 1;
                      }
                    }
                  }
                  if (status === 1) {
                    debug(`ZoneConnection established`);
                    client.serverId = serverId;
                    this._zoneConnections[client.clientId] = serverId;
                    await this.updateZoneServerVersion(serverId, h1emuVersion);
                    await this.updateServerStatus(serverId, true);
                  } else {
                    this.rejectZoneConnection(serverId, client);
                    return;
                  }
                  this._zoneConnectionManager.sendData(client, "SessionReply", {
                    status: status
                  });
                  if (status == 1) await this.sendFileHashes(serverId);
                  break;
                }
                case "UpdateZonePopulation": {
                  const { population } = packet.data;
                  const serverId = this._zoneConnections[client.clientId];
                  this._db?.collection(DB_COLLECTIONS.SERVERS).findOneAndUpdate(
                    { serverId: serverId },
                    {
                      $set: {
                        populationNumber: population,
                        populationLevel: population
                      }
                    }
                  );
                  break;
                }
                case "ClientBan": {
                  const { status, loginSessionId } = packet.data;
                  const serverId = this._zoneConnections[client.clientId],
                    isGlobal = await this._isServerOfficial(serverId);

                  // login server should not track non-global bans
                  if (!isGlobal) return;

                  try {
                    const userSession = await this._db
                      .collection(DB_COLLECTIONS.USERS_SESSIONS)
                      .findOne({ guid: loginSessionId });
                    this._db
                      ?.collection(DB_COLLECTIONS.BANNED_LIGHT)
                      .findOneAndUpdate(
                        { serverId: serverId },
                        {
                          $set: {
                            serverId,
                            authKey: userSession.authKey,
                            status,
                            isGlobal
                          }
                        },
                        { upsert: true }
                      );
                  } catch (e) {
                    console.log(e);
                    console.log(
                      `Failed to register clientBan serverId:${serverId} loginSessionId:${loginSessionId}`
                    );
                  }
                  break;
                }
                case "ClientMessage": {
                  const { guid, message, showConsole, clearOutput } =
                    packet.data;

                  const client = await this.getClientByGuid(guid);
                  if (!client) return;

                  this.sendData(client, "H1emu.PrintToConsole", {
                    message: message,
                    showConsole: showConsole,
                    clearOutput: clearOutput
                  });
                  break;
                }
                default:
                  console.log(
                    `Unhandled ZoneConnection packet: ${packet.name}`
                  );
                  break;
              }
            }
          } catch (e) {
            console.log(e);
          }
        }
      );
      this._zoneConnectionManager.on(
        "processInternalReq",
        (packet: any, keysToReturn: string[]) => {
          const { reqId } = packet.data;
          clearTimeout(this._pendingInternalReqTimeouts[reqId]);
          delete this._pendingInternalReqTimeouts[reqId];
          if (this._pendingInternalReq[reqId]) {
            let returnedData: Record<string, unknown> | number;
            if (keysToReturn.length > 0) {
              if (keysToReturn.length === 1) {
                returnedData = packet.data[keysToReturn[0]];
              } else {
                returnedData = {};
                for (const key of keysToReturn) {
                  returnedData[key] = packet.data[key];
                }
              }
            } else {
              returnedData = packet.data;
            }
            this._pendingInternalReq[reqId](returnedData);
            delete this._pendingInternalReq[reqId];
          }
        }
      );
      this._zoneConnectionManager.on(
        "disconnect",
        async (err: string, client: LZConnectionClient, reason: number) => {
          debug(
            `ZoneConnection dropped: ${
              reason ? "Connection Lost" : "Unknown Error"
            }`
          );
          delete this._zoneConnections[client.clientId];
          if (
            client.serverId &&
            !Object.values(this._zoneConnections).includes(client.serverId)
          ) {
            await this.updateServerStatus(client.serverId, false);
          }
        }
      );

      this._zoneConnectionManager.start();
    }
  }

  async getGuidByAuthkey(authKey: string): Promise<string | undefined> {
    const session = await this._db
      .collection(DB_COLLECTIONS.USERS_SESSIONS)
      .findOne({ authKey });
    if (!session) return;
    return session.guid;
  }

  async getClientByGuid(guid: string): Promise<Client | undefined> {
    const session = await this._db
      .collection(DB_COLLECTIONS.USERS_SESSIONS)
      .findOne({ guid });
    if (!session) return;

    let client: Client | undefined;
    this.clients.forEach((c) => {
      if (c.authKey == session.authKey) {
        client = c;
      }
    });

    return client;
  }

  rejectZoneConnection(serverId: number, client: LZConnectionClient) {
    debug(
      `rejected connection serverId : ${serverId} address: ${client.address} `
    );
    delete this._zoneConnectionManager._clients[client.clientId];
  }
  private async _isServerOfficial(serverId: number): Promise<boolean> {
    const server = await this._db
      .collection(DB_COLLECTIONS.SERVERS)
      .findOne({ serverId });
    return !!server.IsOfficial;
  }

  parseData(clientProtocol: string, data: Buffer) {
    switch (clientProtocol) {
      case "LoginUdp_9":
        return this._protocol.parse(data);
      case "LoginUdp_11":
        return this._protocol2016.parse(data);
      default:
        return null;
    }
  }

  sendData(
    client: Client,
    packetName: loginPacketsType,
    obj: LoginUdp_9packets | LoginUdp_11packets
  ) {
    let data;
    switch (client.protocolName) {
      case "LoginUdp_9": {
        data = this._protocol.pack(packetName, obj);
        break;
      }
      case "LoginUdp_11": {
        data = this._protocol2016.pack(packetName, obj);
        break;
      }
      default:
        return;
    }
    if (data) {
      this._soeServer.sendAppData(client, data);
    }
  }

  async loadCharacterData(client: Client): Promise<any> {
    if (this._soloMode) {
      switch (client.gameVersion) {
        default:
        case GAME_VERSIONS.H1Z1_15janv_2015: {
          try {
            // delete old character cache
            delete require.cache[
              require.resolve(
                `${this._appDataFolder}/single_player_characters.json`
              )
            ];
          } catch (e) {
            console.error(e);
          }
          return require(`${this._appDataFolder}/single_player_characters.json`);
        }
        case GAME_VERSIONS.H1Z1_6dec_2016: {
          try {
            // delete old character cache
            delete require.cache[
              require.resolve(
                `${this._appDataFolder}/single_player_characters2016.json`
              )
            ];
          } catch (e) {
            console.error(e);
          }
          return require(`${this._appDataFolder}/single_player_characters2016.json`);
        }
        case GAME_VERSIONS.H1Z1_KOTK_PS3: {
          try {
            // delete old character cache
            delete require.cache[
              require.resolve(
                `${this._appDataFolder}/single_player_charactersKOTK.json`
              )
            ];
          } catch (e) {
            console.error(e);
          }
          return require(`${this._appDataFolder}/single_player_charactersKOTK.json`);
        }
      }
    } else {
      const charactersQuery = {
        authKey: client.authKey,
        gameVersion: client.gameVersion,
        status: 1
      };
      return await this._db
        .collection(DB_COLLECTIONS.CHARACTERS_LIGHT)
        .find(charactersQuery)
        .toArray();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async LoginRequest(client: Client, request: LoginRequest) {
    let authKey, gameVersion;
    let sessionIdString = request.sessionId;
    // In case of shitty json formatting
    sessionIdString = sessionIdString.replaceAll("\\", "");
    try {
      const sessionIdObject = JSON.parse(sessionIdString);
      authKey = sessionIdObject.sessionId;
      gameVersion = sessionIdObject.gameVersion;
      if (!authKey || !gameVersion) {
        throw new Error("Invalid sessionId");
      }
    } catch (e) {
      authKey = sessionIdString;
      gameVersion =
        client.protocolName === "LoginUdp_9"
          ? GAME_VERSIONS.H1Z1_15janv_2015
          : GAME_VERSIONS.H1Z1_6dec_2016;
      //console.warn(
      //  "Your session id is not a valid json string, please update your launcher to avoid this warning"
      //);
    }
    if (this._soloMode) {
      client.authKey = String(authKey);
    } else {
      const realSession = await this._db
        .collection(DB_COLLECTIONS.USERS_SESSIONS)
        .findOne({ guid: authKey });
      client.authKey = realSession ? realSession.authKey : authKey;
    }
    client.gameVersion = gameVersion;
    const loginReply: LoginReply = {
      loggedIn: true,
      status: 1,
      resultCode: 1,
      isMember: true,
      isInternal: true,
      namespace: "soe",
      accountFeatures: [
        {
          key: 2,
          accountFeature: {
            id: 2,
            active: true,
            remainingCount: 2,
            rawData: "test"
          }
        }
      ],
      errorDetails: [
        {
          unknownDword1: 0,
          name: "None",
          value: "None"
        }
      ],
      ipCountryCode: "US",
      applicationPayload: "US"
    };
    this.clients.set(client.soeClientId, client);
    this.sendData(client, "LoginReply", loginReply);

    if (client.gameVersion == GAME_VERSIONS.H1Z1_6dec_2016 && !this._soloMode) {
      this.sendData(client, "H1emu.HadesQuery", {
        authTicket: "-",
        gatewayServer: "-"
      });
    }
  }

  async TunnelAppPacketClientToServer(client: Client, packet: any) {
    const baseResponse = { serverId: packet.serverId };
    let response: unknown;
    switch (packet.subPacketName) {
      case "nameValidationRequest":
        const characterName = packet.result.characterName;
        let status = isValidCharacterName(characterName);
        if (!this._soloMode) {
          const blackListedEntry = await this._db
            .collection(DB_COLLECTIONS.BLACK_LIST_ENTRIES)
            .findOne({
              WORD: characterName.toUpperCase()
            });
          if (blackListedEntry) {
            if (blackListedEntry.FILTER_TYPE === 3) {
              status = NAME_VALIDATION_STATUS.RESERVED;
            } else {
              status = NAME_VALIDATION_STATUS.PROFANE;
            }
          } else {
            const duplicateCharacter = await this._db
              .collection(DB_COLLECTIONS.CHARACTERS_LIGHT)
              .findOne({
                "payload.name": characterName,
                serverId: baseResponse.serverId,
                status: 1
              });
            if (duplicateCharacter) {
              status = NAME_VALIDATION_STATUS.TAKEN;
            }
          }
        }
        response = {
          ...baseResponse,
          subPacketOpcode: 0x02,
          firstName: characterName,
          status: status
        };
        break;
      default:
        debug(`Unhandled tunnel packet "${packet.subPacketName}"`);
        break;
    }
    this.sendData(
      client,
      "TunnelAppPacketServerToClient",
      response as LoginUdp_9packets | LoginUdp_11packets
    );
  }

  Logout(client: Client) {
    this.clients.delete(client.soeClientId);
    this._soeServer.deleteClient(client);
  }

  addDummyDataToCharacters(characters: any[]) {
    for (let index = 0; index < characters.length; index++) {
      // add required dummy data
      const PlayerCharacter = characters[index];
      PlayerCharacter.payload.itemDefinitions = characterItemDefinitionsDummy;
      PlayerCharacter.payload.loadoutData = {
        loadoutId: 3,
        unknownData1: {
          unknownDword1: 22,
          unknownByte1: 1
        },
        unknownDword1: 0,
        unknownData2: {
          unknownDword1: 0,
          loadoutName: ""
        },
        tintItemId: 0,
        unknownDword2: 0,
        decalItemId: 0,
        loadoutSlots: []
      };
      PlayerCharacter.payload.attachmentDefinitions = [];
    }
    return characters;
  }

  async CharacterSelectInfoRequest(client: Client) {
    let characters = await this.loadCharacterData(client);
    if (this._soloMode) {
      if (client.gameVersion === GAME_VERSIONS.H1Z1_15janv_2015) {
        characters = this.addDummyDataToCharacters(characters);
      } else {
        // LoginUdp_11
        let characterList: Array<any> = [];
        characterList = characters.map((character: any) => {
          return {
            characterId: character.characterId,
            serverId: character.serverId,
            payload: {
              name: character.characterName,
              modelId: character.actorModelId,
              gender: character.gender
            }
          };
        });
        characters = characterList;
      }
    } else {
      if (client.gameVersion === GAME_VERSIONS.H1Z1_15janv_2015) {
        characters = this.addDummyDataToCharacters(characters);
      }
    }
    const characterSelectInfoReply: CharacterSelectInfoReply = {
      status: 1,
      canBypassServerLock: true,
      characters: characters
    };
    this.sendData(client, "CharacterSelectInfoReply", characterSelectInfoReply);
    debug("CharacterSelectInfoRequest");
  }

  async sendFileHashes(serverId: number) {
    if (this._soloMode) return;

    const collection: Collection = this._db.collection(
      DB_COLLECTIONS.ASSET_HASHES
    );
    let hashes = await collection.findOne();

    if (!hashes) {
      debug("Setting default asset-hashes in mongo");
      await collection.insertOne({
        type: "assets",
        hashes: defaultHashes
      });
      hashes = await collection.findOne({});
    }

    debug(`Sending OverrideAllowedFileHashes to zone ${serverId}`);
    this._zoneConnectionManager.sendData(
      this.getZoneConnectionClient(serverId),
      "OverrideAllowedFileHashes",
      { types: [hashes] }
    );
  }

  async updateServerStatus(serverId: number, status: boolean) {
    const server = await this._db
      .collection(DB_COLLECTIONS.SERVERS)
      .findOneAndUpdate(
        { serverId: serverId },
        {
          $set: {
            allowedAccess: status,
            statusTimestamp: Date.now(),
            populationNumber: 0,
            populationLevel: 0
          }
        }
      );
    this.clients.forEach((client: Client) => {
      if (client.gameVersion === server.value.gameVersion) {
        this.sendData(client, "ServerUpdate", {
          ...server.value,
          allowedAccess: !server.value.locked ? status : false
        });
      }
    });
  }

  async updateZoneServerVersion(serverId: number, version: string) {
    await this._db.collection(DB_COLLECTIONS.SERVERS).updateOne(
      { serverId: serverId },
      {
        $set: {
          h1emuVersion: version
        }
      }
    );
  }

  async updateServersStatus(): Promise<void> {
    const servers = await this._db
      .collection(DB_COLLECTIONS.SERVERS)
      .find()
      .toArray();

    for (let index = 0; index < servers.length; index++) {
      const server: GameServer = servers[index];
      if (
        server.allowedAccess &&
        !Object.values(this._zoneConnections).includes(server.serverId)
      ) {
        await this.updateServerStatus(server.serverId, false);
      }
    }
  }

  async ServerListRequest(client: Client) {
    let servers: any[];
    if (!this._soloMode) {
      servers = await this._db
        .collection(DB_COLLECTIONS.SERVERS)
        .find({
          gameVersion: client.gameVersion
        })
        .toArray();
      servers = servers
        .map((server: any) => {
          if (server.locked) {
            server.allowedAccess = false;
          }
          return server;
        })
        .filter((v) => {
          return !v.isDisabled;
        });
    } else {
      switch (client.gameVersion) {
        default:
        case GAME_VERSIONS.H1Z1_15janv_2015: {
          const SoloServer = require("../../../data/2015/sampleData/single_player_server.json");
          servers = [SoloServer];
          break;
        }
        case GAME_VERSIONS.H1Z1_6dec_2016: {
          const SoloServer = require("../../../data/2016/sampleData/single_player_server.json");
          servers = [SoloServer];
          break;
        }
        case GAME_VERSIONS.H1Z1_KOTK_PS3: {
          const SoloServer = require("../../../data/kotk/sampleData/single_player_server.json");
          servers = [SoloServer];
          break;
        }
      }
    }
    const serverListReply: ServerListReply = { servers: servers };
    this.sendData(client, "ServerListReply", serverListReply);
  }

  async CharacterDeleteRequest(client: Client, packet: CharacterDeleteRequest) {
    debug("CharacterDeleteRequest");
    let deletionStatus = 1;
    if (this._soloMode) {
      const SinglePlayerCharacters = await this.loadCharacterData(client);
      const characterIndex = SinglePlayerCharacters.findIndex(
        (character: any) => character.characterId === packet.characterId
      );
      SinglePlayerCharacters.splice(characterIndex, 1);
      switch (client.gameVersion) {
        default:
        case GAME_VERSIONS.H1Z1_15janv_2015: {
          fs.writeFileSync(
            `${this._appDataFolder}/single_player_characters.json`,
            JSON.stringify(SinglePlayerCharacters, null, "\t")
          );
          break;
        }
        case GAME_VERSIONS.H1Z1_6dec_2016: {
          fs.writeFileSync(
            `${this._appDataFolder}/single_player_characters2016.json`,
            JSON.stringify(SinglePlayerCharacters, null, "\t")
          );
          break;
        }
        case GAME_VERSIONS.H1Z1_KOTK_PS3: {
          fs.writeFileSync(
            `${this._appDataFolder}/single_player_charactersKOTK.json`,
            JSON.stringify(SinglePlayerCharacters, null, "\t")
          );
          break;
        }
      }
    } else {
      const characterId = packet.characterId;
      const characterQuery = { characterId: characterId };
      const charracterToDelete = await this._db
        .collection(DB_COLLECTIONS.CHARACTERS_LIGHT)
        .findOne(characterQuery);
      if (charracterToDelete && charracterToDelete.authKey === client.authKey) {
        deletionStatus = (await this.askZone(
          charracterToDelete.serverId,
          "CharacterDeleteRequest",
          { characterId: characterId }
        )) as number;
        if (deletionStatus) {
          await this._db
            .collection(DB_COLLECTIONS.CHARACTERS_LIGHT)
            .updateOne(characterQuery, {
              $set: {
                status: 0
              }
            });
          debug(`Character ${packet.characterId} deleted !`);
        }
      }
    }
    const characterDeleteReply: CharacterDeleteReply = {
      characterId: packet.characterId,
      status: deletionStatus,
      Payload: "\0"
    };
    this.sendData(client, "CharacterDeleteReply", characterDeleteReply);
  }

  async getCharactersLoginInfo(
    serverId: number,
    characterId: string,
    authKey: string | undefined
  ): Promise<CharacterLoginReply> {
    const { serverAddress, populationNumber, maxPopulationNumber } =
      await this._db
        .collection(DB_COLLECTIONS.SERVERS)
        .findOne({ serverId: serverId });
    const character = await this._db
      .collection(DB_COLLECTIONS.CHARACTERS_LIGHT)
      .findOne({ characterId: characterId });
    let connectionStatus =
      Object.values(this._zoneConnections).includes(serverId) &&
      (populationNumber < maxPopulationNumber || !maxPopulationNumber);
    debug(`connectionStatus ${connectionStatus}`);

    if (!character) {
      console.error(
        `CharacterId "${characterId}" unfound on serverId: "${serverId}"`
      );
    }
    const hiddenSession = (await this._db
      .collection(DB_COLLECTIONS.USERS_SESSIONS)
      .findOne({ authKey })) ?? { guid: "" };
    if (!connectionStatus && hiddenSession.guid) {
      // Admins bypass max pop
      connectionStatus = (await this.askZone(serverId, "ClientIsAdminRequest", {
        guid: hiddenSession.guid
      })) as boolean;
    }
    return {
      unknownQword1: "0x0",
      unknownDword1: 0,
      unknownDword2: 0,
      status: character ? Number(connectionStatus) : 0,
      applicationData: {
        serverAddress: serverAddress,
        serverTicket: hiddenSession?.guid,
        encryptionKey: this._cryptoKey,
        guid: characterId
      }
    };
  }

  async getCharactersLoginInfoSolo(client: Client, characterId: string) {
    const SinglePlayerCharacters = await this.loadCharacterData(client);
    let character;
    switch (client.gameVersion) {
      default:
      case GAME_VERSIONS.H1Z1_15janv_2015: {
        character = SinglePlayerCharacters.find(
          (character: any) => character.characterId === characterId
        );
        character.characterName = character.payload.name;
        break;
      }
      case GAME_VERSIONS.H1Z1_KOTK_PS3:
      case GAME_VERSIONS.H1Z1_6dec_2016: {
        character = SinglePlayerCharacters.find(
          (character: any) => character.characterId === characterId
        );
        break;
      }
    }
    return {
      unknownQword1: "0x0",
      unknownDword1: 0,
      unknownDword2: 0,
      status: 1,
      applicationData: {
        serverAddress: `${this._soloPlayIp}:1117`,
        serverTicket: client.authKey,
        encryptionKey: this._cryptoKey,
        guid: characterId,
        unknownQword2: "0x0",
        stationName: "",
        characterName: character.characterName,
        unknownString: ""
      }
    };
  }

  // need to be self-implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isClientUsingVpn(_address: string): Promise<boolean> {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isClientHWIDBanned(client: Client, serverId: number): Promise<boolean> {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isClientVerified(client: Client): Promise<boolean> {
    // to implement
    return true;
  }
  async getClientRejectionFlags(serverId: number, client: Client) {
    const banInfo: Array<BANNED_LIGHT> = await this._db
      .collection(DB_COLLECTIONS.BANNED_LIGHT)
      .find({ authKey: client.authKey, status: true })
      .toArray();
    const rejectionFlags: Array<CONNECTION_REJECTION_FLAGS> = [];
    for (let i = 0; i < banInfo.length; i++) {
      if (banInfo[i].isGlobal) {
        rejectionFlags.push(CONNECTION_REJECTION_FLAGS.GLOBAL_BAN);
      }
    }

    if (await this.isClientUsingVpn(client.address)) {
      rejectionFlags.push(CONNECTION_REJECTION_FLAGS.VPN);
    }

    if (await this.isClientHWIDBanned(client, serverId)) {
      rejectionFlags.push(CONNECTION_REJECTION_FLAGS.HWID);
    }

    if (!(await this.isClientVerified(client))) {
      rejectionFlags.push(CONNECTION_REJECTION_FLAGS.UNVERIFIED);
    }

    return rejectionFlags;
  }

  async CharacterLoginRequest(client: Client, packet: CharacterLoginRequest) {
    const { serverId, characterId } = packet;
    let connectionAllowed: ConnectionAllowed = { status: 1 };
    let rejectionFlags: Array<CONNECTION_REJECTION_FLAGS> = [];

    if (this._soloMode) {
      this.sendData(
        client,
        "CharacterLoginReply",
        await this.getCharactersLoginInfoSolo(client, characterId)
      );
      return;
    }

    const charactersLoginInfo = await this.getCharactersLoginInfo(
      serverId,
      characterId,
      client.authKey
    );
    rejectionFlags = await this.getClientRejectionFlags(serverId, client);

    const userSession = (await this._db
      ?.collection(DB_COLLECTIONS.USERS_SESSIONS)
      .findOne({ serverId: packet.serverId, authKey: client.authKey })) as
      | UserSession
      | undefined;

    connectionAllowed = (await this.askZone(
      serverId,
      "CharacterAllowedRequest",
      {
        characterId,
        loginSessionId: userSession?.guid ?? "",
        rejectionFlags: rejectionFlags.map((flag) => {
          return { rejectionFlag: flag };
        })
      }
    )) as ConnectionAllowed;

    if (client.gameVersion === GAME_VERSIONS.H1Z1_KOTK_PS3) {
      // any type can be pass to a byteswithlength field but only the specified type in the table can be read
      charactersLoginInfo.applicationData = DataSchema.pack(
        applicationDataKOTK,
        charactersLoginInfo.applicationData
      ).data as unknown as CharacterLoginReply["applicationData"];
    }
    debug(charactersLoginInfo);
    if (charactersLoginInfo.status) {
      charactersLoginInfo.status = Number(connectionAllowed.status);
    } else {
      this.sendData(client, "H1emu.PrintToConsole", {
        message: `Invalid character status! If this is a new character, please delete and recreate it.`,
        showConsole: true,
        clearOutput: true
      });
    }
    if (!connectionAllowed.status) {
      let reason =
        "UNDEFINED! Server may be running an old version, please report this to the server owner!";
      switch (connectionAllowed.rejectionFlag) {
        case CONNECTION_REJECTION_FLAGS.ERROR:
          reason = "ERROR";
          break;
        case CONNECTION_REJECTION_FLAGS.LOCAL_BAN:
          reason = "LOCAL_BAN";
          break;
        case CONNECTION_REJECTION_FLAGS.GLOBAL_BAN:
          reason = "GLOBAL_BAN";
          break;
        case CONNECTION_REJECTION_FLAGS.VPN:
          reason = "VPN";
          break;
        case CONNECTION_REJECTION_FLAGS.HWID:
          reason = "HWID_BAN";
          break;
        case CONNECTION_REJECTION_FLAGS.UNVERIFIED:
          reason = "UNVERIFIED";
          break;
        case CONNECTION_REJECTION_FLAGS.SERVER_LOCKED:
          reason = "SERVER IS LOCKED";
          break;
        case CONNECTION_REJECTION_FLAGS.SERVER_REBOOT:
          reason = "SERVER IS REBOOTING";
          break;
        case CONNECTION_REJECTION_FLAGS.CHARACTER_NOT_FOUND:
          reason = "CHARACTER NOT FOUND";
          break;
        case CONNECTION_REJECTION_FLAGS.OTHER:
          reason = "OTHER";
          break;
      }
      this.sendData(client, "H1emu.PrintToConsole", {
        message: `CONNECTION REJECTED! Reason: ${reason}`,
        showConsole: true,
        clearOutput: true
      });
      if (reason == "UNVERIFIED") {
        this.sendData(client, "H1emu.PrintToConsole", {
          message: `Please follow the steps to verify your account using the #how-to-play channel in the discord. discord.gg/h1emu`,
          showConsole: false,
          clearOutput: false
        });
      }
      if (connectionAllowed.message) {
        this.sendData(client, "H1emu.PrintToConsole", {
          message: connectionAllowed.message,
          showConsole: false,
          clearOutput: false
        });
      }
    }
    this.sendData(client, "CharacterLoginReply", charactersLoginInfo);
    debug("CharacterLoginRequest");
  }

  getZoneConnectionClient(serverId: number): LZConnectionClient | undefined {
    const zoneConnectionIndex = Object.values(this._zoneConnections).findIndex(
      (e) => e === serverId
    );
    const zoneConnectionString = Object.keys(this._zoneConnections)[
      zoneConnectionIndex
    ];
    const [address, port] = zoneConnectionString.split(":");

    return {
      address: address,
      port: port,
      clientId: zoneConnectionString,
      serverId: 1 // TODO: that's a hack
    } as any;
  }

  async askZone(
    serverId: number,
    packetName: string,
    packetObj: any
  ): Promise<unknown> {
    const askZonePromise = await new Promise((resolve) => {
      this._internalReqCount++;
      const reqId = this._internalReqCount;
      try {
        this._zoneConnectionManager.sendData(
          this.getZoneConnectionClient(serverId),
          packetName,
          { reqId: reqId, ...packetObj }
        );
        this._pendingInternalReq[reqId] = resolve;
        this._pendingInternalReqTimeouts[reqId] = setTimeout(() => {
          delete this._pendingInternalReq[reqId];
          delete this._pendingInternalReqTimeouts[reqId];
          resolve(0);
        }, 5000);
      } catch (e) {
        console.error(e);
        resolve(0);
      }
    });
    return askZonePromise as number;
  }

  async CharacterCreateRequest(client: Client, packet: CharacterCreateRequest) {
    const {
      payload: { characterName },
      serverId,
      payload
    } = packet;
    // create character object
    let sampleCharacter, newCharacter;
    switch (client.gameVersion) {
      case GAME_VERSIONS.H1Z1_15janv_2015: {
        sampleCharacter = require("../../../data/2015/sampleData/single_player_character.json");
        newCharacter = _.cloneDeep(sampleCharacter) as any;
        newCharacter.payload.name = characterName;
        break;
      }
      default:
      case GAME_VERSIONS.H1Z1_KOTK_PS3:
      case GAME_VERSIONS.H1Z1_6dec_2016: {
        sampleCharacter = require("../../../data/2016/sampleData/character.json");
        newCharacter = _.cloneDeep(sampleCharacter) as any;
        newCharacter.characterName = characterName;
        break;
      }
    }
    newCharacter.serverId = serverId;
    newCharacter.characterId = generateRandomGuid();
    let creationStatus = 1;
    if (this._soloMode) {
      const SinglePlayerCharacters = await this.loadCharacterData(client);
      switch (client.gameVersion) {
        case GAME_VERSIONS.H1Z1_15janv_2015: {
          SinglePlayerCharacters[SinglePlayerCharacters.length] = newCharacter;
          fs.writeFileSync(
            `${this._appDataFolder}/single_player_characters.json`,
            JSON.stringify(SinglePlayerCharacters, null, "\t")
          );
          break;
        }
        default:
        case GAME_VERSIONS.H1Z1_6dec_2016: {
          const characterModelData = getCharacterModelData(payload);
          newCharacter = {
            ...newCharacter,
            actorModelId: characterModelData.modelId,
            headActor: characterModelData.headActor,
            gender: payload.gender,
            hairModel: characterModelData.hairModel
          };
          SinglePlayerCharacters[SinglePlayerCharacters.length] = newCharacter;
          fs.writeFileSync(
            `${this._appDataFolder}/single_player_characters2016.json`,
            JSON.stringify(SinglePlayerCharacters, null, "\t")
          );
          break;
        }
        case GAME_VERSIONS.H1Z1_KOTK_PS3: {
          const characterModelData = getCharacterModelData(payload);
          newCharacter = {
            ...newCharacter,
            actorModelId: characterModelData.modelId,
            headActor: characterModelData.headActor,
            gender: payload.gender,
            hairModel: characterModelData.hairModel
          };
          SinglePlayerCharacters[SinglePlayerCharacters.length] = newCharacter;
          fs.writeFileSync(
            `${this._appDataFolder}/single_player_charactersKOTK.json`,
            JSON.stringify(SinglePlayerCharacters, null, "\t")
          );
          break;
        }
      }
    } else {
      let sessionObj;
      const storedUserSession = await this._db
        ?.collection(DB_COLLECTIONS.USERS_SESSIONS)
        .findOne({ authKey: client.authKey });
      if (storedUserSession) {
        sessionObj = storedUserSession;
      } else {
        sessionObj = {
          authKey: client.authKey,
          guid: generateRandomGuid()
        };
        await this._db
          ?.collection(DB_COLLECTIONS.USERS_SESSIONS)
          .insertOne(sessionObj);
      }
      let newCharacterData;
      switch (client.gameVersion) {
        case GAME_VERSIONS.H1Z1_15janv_2015: {
          newCharacterData = { ...newCharacter, ownerId: sessionObj.guid };
          break;
        }
        default:
        case GAME_VERSIONS.H1Z1_KOTK_PS3:
        case GAME_VERSIONS.H1Z1_6dec_2016: {
          newCharacterData = {
            characterId: newCharacter.characterId,
            serverId: newCharacter.serverId,
            ownerId: sessionObj.guid,
            payload: packet.payload,
            status: 1
          };
          break;
        }
      }
      creationStatus = (await this.askZone(serverId, "CharacterCreateRequest", {
        characterObjStringify: JSON.stringify(newCharacterData)
      }))
        ? 1
        : 0;

      if (creationStatus === 1) {
        await this._db.collection(DB_COLLECTIONS.CHARACTERS_LIGHT).insertOne({
          authKey: client.authKey,
          serverId: serverId,
          gameVersion: client.gameVersion,
          payload: { name: characterName },
          characterId: newCharacter.characterId,
          status: 1
        });
      }
      newCharacter;
    }
    const characterCreateReply: CharacterCreateReply = {
      status: creationStatus,
      characterId: newCharacter.characterId
    };
    this.sendData(client, "CharacterCreateReply", characterCreateReply);
  }

  async start(): Promise<void> {
    debug("Starting server");
    if (this._mongoAddress) {
      const mongoClient = new MongoClient(this._mongoAddress, {
        maxPoolSize: 100
      });
      try {
        await mongoClient.connect();
      } catch (e) {
        throw debug(
          "[ERROR]Unable to connect to mongo server " + this._mongoAddress
        );
      }
      debug("connected to mongo !");
      // if no collections exist on h1server database , fill it with samples
      const dbIsEmpty =
        (await mongoClient.db(DB_NAME).collections()).length < 1;
      if (dbIsEmpty) {
        await initMongo(mongoClient, debugName);
      }
      this._db = mongoClient.db(DB_NAME);
      this.updateServersStatus();
    }

    if (this._soloMode) {
      setupAppDataFolder();
    }
    this._soeServer.start(this._crcLength, this._udpLength);
    if (this._mongoAddress && this._enableHttpServer) {
      this._httpServer = new Worker(`${__dirname}/workers/httpServer.js`, {
        workerData: {
          MONGO_URL: this._mongoAddress,
          SERVER_PORT: this._httpServerPort
        }
      });
      this._httpServer.on("message", (message: httpServerMessage) => {
        const { type, requestId, data } = message;
        switch (type) {
          case "pingzone": {
            const response: httpServerMessage = {
              type: "pingzone",
              requestId: requestId,
              data: Object.values(this._zoneConnections).includes(data)
                ? "pong"
                : "error"
            };
            this._httpServer.postMessage(response);
            break;
          }
          case "ping": {
            const response: httpServerMessage = {
              type: "ping",
              requestId: requestId,
              data: "pong"
            };
            this._httpServer.postMessage(response);
            break;
          }
          default:
            break;
        }
      });
    }
  }

  deleteAllLocalCharacters(): void {
    // used for testing / benchmarks
    if (fs.existsSync(`${this._appDataFolder}/single_player_characters.json`)) {
      fs.unlinkSync(`${this._appDataFolder}/single_player_characters.json`);
    }
  }
  stop(): void {
    debug("Shutting down");
    process.exitCode = 0;
  }
}

if (process.env.VSCODE_DEBUG === "true") {
  const PackageSetting = require("../../../package.json");
  process.env.H1Z1_SERVER_VERSION = PackageSetting.version;
  new LoginServer(1115, process.env.MONGO_URL).start();
}
