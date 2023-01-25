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
import { H1emuLoginServer } from "../H1emuServer/h1emuLoginServer";
import { H1emuClient } from "../H1emuServer/shared/h1emuclient";
import { LoginProtocol } from "../../protocols/loginprotocol";
import { MongoClient } from "mongodb";
import {
  _,
  generateRandomGuid,
  getAppDataFolderPath,
  initMongo,
  setupAppDataFolder,
  isValidCharacterName,
  resolveHostAddress,
} from "../../utils/utils";
import { GameServer } from "../../types/loginserver";
import Client from "servers/LoginServer/loginclient";
import fs from "fs";
import { loginPacketsType } from "types/packets";
import { Worker } from "worker_threads";
import { httpServerMessage } from "types/shared";
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
} from "types/LoginUdp_11packets";
import { LoginUdp_9packets } from "types/LoginUdp_9packets";
import { getCharacterModelData } from "../shared/functions";
import LoginClient from "servers/LoginServer/loginclient";
import {
  DB_COLLECTIONS,
  GAME_VERSIONS,
  NAME_VALIDATION_STATUS,
} from "../../utils/enums";
import DataSchema from "h1z1-dataschema";
import { applicationDataKOTK } from "../../packets/LoginUdp/LoginUdp_11/loginpackets";
import { Resolver } from "dns";

const debugName = "LoginServer";
const debug = require("debug")(debugName);
const characterItemDefinitionsDummy = require("../../../data/2015/sampleData/characterItemDefinitionsDummy.json");

@healthThreadDecorator
export class LoginServer extends EventEmitter {
  _soeServer: SOEServer;
  _protocol: LoginProtocol;
  _protocol2016: LoginProtocol2016;
  _db: any;
  _crcSeed: number;
  _crcLength: crc_length_options;
  _udpLength: number;
  private readonly _cryptoKey: Uint8Array;
  private readonly _mongoAddress: string;
  private readonly _soloMode: boolean;
  private readonly _appDataFolder: string;
  private _httpServer!: Worker;
  _enableHttpServer: boolean;
  _httpServerPort: number = 80;
  private _h1emuLoginServer!: H1emuLoginServer;
  private _zoneConnections: { [h1emuClientId: string]: number } = {};
  private _internalReqCount: number = 0;
  private _pendingInternalReq: { [requestId: number]: any } = {};
  private _pendingInternalReqTimeouts: { [requestId: number]: NodeJS.Timeout } =
    {};
  private _soloPlayIp: string = process.env.SOLO_PLAY_IP || "127.0.0.1";
  private clients: Map<string, LoginClient>;
  private _resolver = new Resolver();
  constructor(serverPort: number, mongoAddress = "") {
    super();
    this._crcSeed = 0;
    this._crcLength = 0;
    this._udpLength = 512;
    this._cryptoKey = Buffer.from(DEFAULT_CRYPTO_KEY, "base64");
    this._soloMode = false;
    this._mongoAddress = mongoAddress;
    this._appDataFolder = getAppDataFolderPath();
    this._enableHttpServer = true;
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
              const { sessionId } = packet.result;
              await this.LoginRequest(client, sessionId);
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
      this._h1emuLoginServer = new H1emuLoginServer(1110);

      this._h1emuLoginServer.on(
        "data",
        async (err: string, client: H1emuClient, packet: any) => {
          if (err) {
            console.error(err);
          } else {
            try {
              const connectionEstablished: boolean =
                !!this._zoneConnections[client.clientId];
              if (connectionEstablished || packet.name === "SessionRequest") {
                switch (packet.name) {
                  case "SessionRequest": {
                    const { serverId } = packet.data;
                    debug(
                      `Received session request from ${client.address}:${client.port}`
                    );
                    let status = 0;
                    const { serverAddress: fullServerAddress } = await this._db
                      .collection(DB_COLLECTIONS.SERVERS)
                      .findOne({ serverId: serverId });
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
                    if (status === 1) {
                      debug(`ZoneConnection established`);
                      client.serverId = serverId;
                      this._zoneConnections[client.clientId] = serverId;
                      await this.updateServerStatus(serverId, true);
                    } else {
                      console.log(
                        `rejected connection serverId : ${serverId} address: ${client.address} `
                      );
                      delete this._h1emuLoginServer._clients[client.clientId];
                      return;
                    }
                    this._h1emuLoginServer.sendData(client, "SessionReply", {
                      status: status,
                    });
                    break;
                  }
                  case "UpdateZonePopulation": {
                    const { population } = packet.data;
                    const serverId = this._zoneConnections[client.clientId];
                    const { maxPopulationNumber } = await this._db
                      .collection(DB_COLLECTIONS.SERVERS)
                      .findOne({ serverId: serverId });
                    this._db
                      ?.collection(DB_COLLECTIONS.SERVERS)
                      .findOneAndUpdate(
                        { serverId: serverId },
                        {
                          $set: {
                            populationNumber: population,
                            populationLevel: Number(
                              ((population / maxPopulationNumber) * 3).toFixed(
                                0
                              )
                            ),
                          },
                        }
                      );
                    break;
                  }
                  default:
                    debug(`Unhandled h1emu packet: ${packet.name}`);
                    break;
                }
              }
            } catch (e) {
              console.log(e);
            }
          }
        }
      );
      this._h1emuLoginServer.on(
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
      this._h1emuLoginServer.on(
        "disconnect",
        async (err: string, client: H1emuClient, reason: number) => {
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

      this._h1emuLoginServer.start();
    }
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
        authKey: client.loginSessionId,
        gameVersion: client.gameVersion,
        status: 1,
      };
      return await this._db
        .collection(DB_COLLECTIONS.CHARACTERS_LIGHT)
        .find(charactersQuery)
        .toArray();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async LoginRequest(client: Client, sessionIdString: string) {
    let sessionId, gameVersion;
    // In case of shitty json formatting
    sessionIdString = sessionIdString.replaceAll("\\", "");
    try {
      const sessionIdObject = JSON.parse(sessionIdString);
      sessionId = sessionIdObject.sessionId;
      gameVersion = sessionIdObject.gameVersion;
      if (!sessionId || !gameVersion) {
        throw new Error("Invalid sessionId");
      }
    } catch (e) {
      sessionId = sessionIdString;
      gameVersion =
        client.protocolName === "LoginUdp_9"
          ? GAME_VERSIONS.H1Z1_15janv_2015
          : GAME_VERSIONS.H1Z1_6dec_2016;
      //console.warn(
      //  "Your session id is not a valid json string, please update your launcher to avoid this warning"
      //);
    }
    if (this._soloMode) {
      client.loginSessionId = String(sessionId);
    } else {
      const realSession = await this._db
        .collection(DB_COLLECTIONS.USERS_SESSIONS)
        .findOne({ guid: sessionId });
      client.loginSessionId = realSession ? realSession.authKey : sessionId;
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
            rawData: "test",
          },
        },
      ],
      errorDetails: [
        {
          unknownDword1: 0,
          name: "None",
          value: "None",
        },
      ],
      ipCountryCode: "US",
      applicationPayload: "US",
    };
    this.clients.set(client.soeClientId, client);
    this.sendData(client, "LoginReply", loginReply);
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
              WORD: characterName.toUpperCase(),
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
                status: 1,
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
          status: status,
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
          unknownByte1: 1,
        },
        unknownDword1: 0,
        unknownData2: {
          unknownDword1: 0,
          loadoutName: "",
        },
        tintItemId: 0,
        unknownDword2: 0,
        decalItemId: 0,
        loadoutSlots: [],
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
              gender: character.gender,
            },
          };
        });
        characters = this.addDummyDataToCharacters(characterList);
      }
    } else {
      characters = this.addDummyDataToCharacters(characters);
    }
    const characterSelectInfoReply: CharacterSelectInfoReply = {
      status: 1,
      canBypassServerLock: true,
      characters: characters,
    };
    this.sendData(client, "CharacterSelectInfoReply", characterSelectInfoReply);
    debug("CharacterSelectInfoRequest");
  }

  async updateServerStatus(serverId: number, status: boolean) {
    const server = await this._db
      .collection(DB_COLLECTIONS.SERVERS)
      .findOneAndUpdate(
        { serverId: serverId },
        {
          $set: {
            allowedAccess: status,
            populationNumber: 0,
            populationLevel: 0,
          },
        }
      );
    this.clients.forEach((client: Client) => {
      if (client.gameVersion === server.value.gameVersion) {
        this.sendData(client, "ServerUpdate", {
          ...server.value,
          allowedAccess: status,
        });
      }
    });
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
    let servers;
    if (!this._soloMode) {
      servers = await this._db
        .collection(DB_COLLECTIONS.SERVERS)
        .find({
          gameVersion: client.gameVersion,
        })
        .toArray();
      const userWhiteList = await this._db
        .collection("servers-whitelist")
        .find({ userId: client.loginSessionId })
        .toArray();
      if (userWhiteList) {
        for (let i = 0; i < servers.length; i++) {
          if (!servers[i].allowedAccess) {
            for (let y = 0; y < userWhiteList.length; y++) {
              if (servers[i].serverId == userWhiteList[y].serverId) {
                servers[i].allowedAccess = true;
              }
            }
            delete servers[i]._id;
          }
        }
      }
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
      if (
        charracterToDelete &&
        charracterToDelete.authKey === client.loginSessionId
      ) {
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
                status: 0,
              },
            });
          debug(`Character ${packet.characterId} deleted !`);
        }
      }
    }
    const characterDeleteReply: CharacterDeleteReply = {
      characterId: packet.characterId,
      status: deletionStatus,
      Payload: "\0",
    };
    this.sendData(client, "CharacterDeleteReply", characterDeleteReply);
  }

  async getCharactersLoginInfo(
    serverId: number,
    characterId: string,
    loginSessionId: string | undefined
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
    const hiddenSession = connectionStatus
      ? await this._db
          .collection(DB_COLLECTIONS.USERS_SESSIONS)
          .findOne({ authKey: loginSessionId })
      : { guid: "" };
    if (!connectionStatus) {
      // Admins bypass max pop
      connectionStatus = (await this.askZone(serverId, "ClientIsAdminRequest", {
        guid: hiddenSession?.guid,
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
        guid: characterId,
        unknownQword2: "0x0",
        stationName: "",
        characterName: character ? character.payload.name : "error",
        unknownString: "",
      },
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
        serverTicket: client.loginSessionId,
        encryptionKey: this._cryptoKey,
        guid: characterId,
        unknownQword2: "0x0",
        stationName: "",
        characterName: character.characterName,
        unknownString: "",
      },
    };
  }

  async CharacterLoginRequest(client: Client, packet: CharacterLoginRequest) {
    let charactersLoginInfo: CharacterLoginReply;
    const { serverId, characterId } = packet;
    let characterExistOnZone = 1;
    if (!this._soloMode) {
      charactersLoginInfo = await this.getCharactersLoginInfo(
        serverId,
        characterId,
        client.loginSessionId
      );
      characterExistOnZone = (await this.askZone(
        serverId,
        "CharacterExistRequest",
        { characterId: characterId }
      )) as number;
    } else {
      charactersLoginInfo = await this.getCharactersLoginInfoSolo(
        client,
        characterId
      );
    }
    if (client.gameVersion === GAME_VERSIONS.H1Z1_KOTK_PS3) {
      charactersLoginInfo.applicationData = DataSchema.pack(
        applicationDataKOTK,
        charactersLoginInfo.applicationData
      ).data;
    }
    debug(charactersLoginInfo);
    if (charactersLoginInfo.status) {
      charactersLoginInfo.status = Number(characterExistOnZone);
    }
    this.sendData(client, "CharacterLoginReply", charactersLoginInfo);
    debug("CharacterLoginRequest");
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
        const zoneConnectionIndex = Object.values(
          this._zoneConnections
        ).findIndex((e) => e === serverId);
        const zoneConnectionString = Object.keys(this._zoneConnections)[
          zoneConnectionIndex
        ];
        const [address, port] = zoneConnectionString.split(":");
        this._h1emuLoginServer.sendData(
          {
            address: address,
            port: port,
            clientId: zoneConnectionString,
            serverId: 1, // TODO: that's a hack
          } as any,
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
        resolve(0);
      }
    });
    return askZonePromise as number;
  }

  async CharacterCreateRequest(client: Client, packet: CharacterCreateRequest) {
    const {
      payload: { characterName },
      serverId,
      payload,
    } = packet;
    // create character object
    let sampleCharacter, newCharacter;
    switch (client.gameVersion) {
      case GAME_VERSIONS.H1Z1_15janv_2015: {
        sampleCharacter = require("../../../data/2015/sampleData/single_player_character.json");
        newCharacter = _.cloneDeep(sampleCharacter);
        newCharacter.payload.name = characterName;
        break;
      }
      default:
      case GAME_VERSIONS.H1Z1_KOTK_PS3:
      case GAME_VERSIONS.H1Z1_6dec_2016: {
        sampleCharacter = require("../../../data/2016/sampleData/character.json");
        newCharacter = _.cloneDeep(sampleCharacter);
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
            hairModel: characterModelData.hairModel,
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
            hairModel: characterModelData.hairModel,
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
        .findOne({ authKey: client.loginSessionId, serverId: serverId });
      if (storedUserSession) {
        sessionObj = storedUserSession;
      } else {
        sessionObj = {
          serverId: serverId,
          authKey: client.loginSessionId,
          guid: generateRandomGuid(),
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
            status: 1,
          };
          break;
        }
      }
      creationStatus = (await this.askZone(serverId, "CharacterCreateRequest", {
        characterObjStringify: JSON.stringify(newCharacterData),
      }))
        ? 1
        : 0;

      if (creationStatus === 1) {
        await this._db.collection(DB_COLLECTIONS.CHARACTERS_LIGHT).insertOne({
          authKey: client.loginSessionId,
          serverId: serverId,
          gameVersion: client.gameVersion,
          payload: { name: characterName },
          characterId: newCharacter.characterId,
          status: 1,
        });
      }
      newCharacter;
    }
    const characterCreateReply: CharacterCreateReply = {
      status: creationStatus,
      characterId: newCharacter.characterId,
    };
    this.sendData(client, "CharacterCreateReply", characterCreateReply);
  }

  async start(): Promise<void> {
    debug("Starting server");
    if (this._mongoAddress) {
      const mongoClient = new MongoClient(this._mongoAddress, {
        maxPoolSize: 100,
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
          SERVER_PORT: this._httpServerPort,
        },
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
                : "error",
            };
            this._httpServer.postMessage(response);
            break;
          }
          case "ping": {
            const response: httpServerMessage = {
              type: "ping",
              requestId: requestId,
              data: "pong",
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
