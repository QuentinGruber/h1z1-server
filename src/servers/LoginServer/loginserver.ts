// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
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
} from "../../utils/utils";
import { Client, GameServer } from "../../types/loginserver";
import fs from "fs";
import { loginPacketsType } from "types/packets";
import { Worker } from "worker_threads";
import { httpServerMessage } from "types/shared";

const debugName = "LoginServer";
const debug = require("debug")(debugName);
const characterItemDefinitionsDummy = require("../../../data/2015/sampleData/characterItemDefinitionsDummy.json");
export class LoginServer extends EventEmitter {
  _soeServer: SOEServer;
  _protocol: LoginProtocol;
  _db: any;
  _mongoClient: any;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;
  _cryptoKey: Uint8Array;
  _mongoAddress: string;
  _soloMode: boolean;
  _appDataFolder: string;
  _httpServer!: Worker;
  _enableHttpServer: boolean;
  _httpServerPort: number = 80;
  _h1emuLoginServer!: H1emuLoginServer;
  _zoneConnections: { [h1emuClientId: string]: number } = {};
  _zoneWhitelist!: any[];
  _internalReqCount: number = 0;
  _pendingInternalReq: { [requestId: number]: any } = {};
  _pendingInternalReqTimeouts: { [requestId: number]: NodeJS.Timeout } = {};

  constructor(serverPort: number, mongoAddress = "") {
    super();
    this._compression = 0x0100;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;
    this._cryptoKey = new (Buffer as any).from(
      "F70IaxuU8C/w7FPXY1ibXw==",
      "base64"
    );
    this._soloMode = false;
    this._mongoAddress = mongoAddress;
    this._appDataFolder = getAppDataFolderPath();
    this._enableHttpServer = true;

    // reminders
    if (!this._mongoAddress) {
      this._soloMode = true;
      debug("Server in solo mode !");
    }

    this._soeServer = new SOEServer(
      "LoginUdp_9",
      serverPort,
      this._cryptoKey,
      0
    );

    this._protocol = new LoginProtocol();
    this._soeServer.on("connect", (err: string, client: Client) => {
      debug(`Client connected from ${client.address}:${client.port}`);
      this.emit("connect", err, client);
    });
    this._soeServer.on("disconnect", (err: string, client: Client) => {
      debug(`Client disconnected from ${client.address}:${client.port}`);
      this.emit("disconnect", err, client);
    });
    this._soeServer.on("session", (err: string, client: Client) => {
      debug(`Session started for client ${client.address}:${client.port}`);
    });
    this._soeServer.on(
      "SendServerUpdate",
      async (err: string, client: Client) => {
        this.updateServerList(client);
      }
    );

    this._soeServer.on(
      "appdata",
      async (err: string, client: Client, data: Buffer) => {
        try {
          const packet: any = this._protocol.parse(data);
          debug(packet);
          if (packet?.result) {
            // if packet parsing succeed
            const { sessionId, systemFingerPrint } = packet.result;
            switch (packet.name) {
              case "LoginRequest":
                this.LoginRequest(client, sessionId, systemFingerPrint);
                if (this._protocol.protocolName !== "LoginUdp_11") break;
              case "CharacterSelectInfoRequest":
                this.CharacterSelectInfoRequest(client);
                if (this._protocol.protocolName !== "LoginUdp_11") break;
              case "ServerListRequest":
                this.ServerListRequest(client);
                break;
              case "CharacterDeleteRequest":
                this.CharacterDeleteRequest(client, packet);
                break;
              case "CharacterLoginRequest":
                this.CharacterLoginRequest(client, packet);
                break;
              case "CharacterCreateRequest":
                this.CharacterCreateRequest(client, packet);
                break;
              case "TunnelAppPacketClientToServer": // only used for nameValidation rn
                this.TunnelAppPacketClientToServer(client, packet);
                break;
              case "Logout":
                this.Logout(client, packet);
                break;
            }
          } else {
            debug("Packet parsing was unsuccesful");
          }
        } catch (error) {
          console.log(error);
        }
      }
    );

    if (!this._soloMode) {
      this._h1emuLoginServer = new H1emuLoginServer(1110);

      this._h1emuLoginServer.on(
        "data",
        (err: string, client: H1emuClient, packet: any) => {
          if (err) {
            console.error(err);
          } else {
            const connectionEstablished = this._zoneConnections[client.clientId]
              ? 1
              : 0;
            this._db?.collection("internal-connections-logs").insertOne({...packet,connectionEstablished:connectionEstablished,timestamp : Date.now()});
            if (connectionEstablished || packet.name === "SessionRequest") {
              switch (packet.name) {
                case "SessionRequest": {
                  if (!connectionEstablished) {
                    let { serverId } = packet.data;
                    debug(
                      `Received session request from ${client.address}:${client.port}`
                    );
                    const status =
                      this._zoneWhitelist.find((e) => e.serverId === serverId)
                        ?.address === client.address
                        ? 1
                        : 0;
                    if (status === 1) {
                      debug(`ZoneConnection established`);
                      client.session = true;
                      this._zoneConnections[client.clientId] = serverId;
                    } else {
                      delete this._h1emuLoginServer._clients[client.clientId];
                      return;
                    }
                    this._h1emuLoginServer.sendData(client, "SessionReply", {
                      status: status,
                    });
                  }
                  break;
                }
                default:
                  debug(`Unhandled h1emu packet: ${packet.name}`);
                  break;
              }
            }
          }
        }
      );
      this._h1emuLoginServer.on("processInternalReq", (packet: any) => {
        const { reqId, status } = packet.data;
        clearTimeout(this._pendingInternalReqTimeouts[reqId]);
        delete this._pendingInternalReqTimeouts[reqId];
        this._pendingInternalReq[reqId](status);
        delete this._pendingInternalReq[reqId];
      });
      this._h1emuLoginServer.on(
        "disconnect",
        (err: string, client: H1emuClient, reason: number) => {
          debug(
            `ZoneConnection dropped: ${
              reason ? "Connection Lost" : "Unknown Error"
            }`
          );
          delete this._zoneConnections[client.clientId];
        }
      );

      this._h1emuLoginServer.start();
    }
  }

  sendData(client: Client, packetName: loginPacketsType, obj: any) {
    const data = this._protocol.pack(packetName, obj);
    this._soeServer.sendAppData(client, data, true);
  }

  async loadCharacterData(client: Client): Promise<any> {
    if (this._protocol.protocolName == "LoginUdp_9") {
      if (this._soloMode) {
        try {
          // delete old character cache
          delete require.cache[
            require.resolve(
              `${this._appDataFolder}/single_player_characters.json`
            )
          ];
        } catch (e) {}
        return require(`${this._appDataFolder}/single_player_characters.json`);
      } else {
        // 2015 mongo
      }
    } else {
      // LoginUdp_11
      if (this._soloMode) {
        try {
          // delete old character cache
          delete require.cache[
            require.resolve(
              `${this._appDataFolder}/single_player_characters2016.json`
            )
          ];
        } catch (e) {}
        return require(`${this._appDataFolder}/single_player_characters2016.json`);
      } else {
        // 2016 mongo
      }
    }
  }

  LoginRequest(client: Client, sessionId: string, fingerprint: string) {
    if (this._protocol.protocolName == "LoginUdp_11" && this._soloMode) {
      const SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters2016.json`);
      // if character file is old, delete it
      if (SinglePlayerCharacters[0] && SinglePlayerCharacters[0].payload) {
        fs.writeFileSync(
          `${this._appDataFolder}/single_player_characters2016.json`,
          JSON.stringify([], null)
        );
        debug("Old character save file detected, deleting.");
      }
      delete require.cache[
        require.resolve(
          `${this._appDataFolder}/single_player_characters2016.json`
        )
      ];
    }

    client.loginSessionId = sessionId;
    this.sendData(client, "LoginReply", {
      loggedIn: true,
      status: 1,
      isMember: true,
      isInternal: true,
      namespace: "soe",
      ApplicationPayload: "",
    });
    if (!this._soloMode) {
      client.serverUpdateTimer = setInterval(
        // TODO: fix the fact that this interval is never cleared
        () => this.updateServerList(client),
        30000
      );
    }
  }

  TunnelAppPacketClientToServer(client: Client, packet: any) {
    const baseResponse = { serverId: packet.serverId };
    let response;
    switch (packet.subPacketName) {
      case "nameValidationRequest":
        response = {
          ...baseResponse,
          subPacketOpcode: 0x02,
          firstName: packet.result.characterName,
          status: 1,
        };
        break;
      default:
        debug(`Unhandled tunnel packet "${packet.subPacketName}"`);
        break;
    }
    this.sendData(client, "TunnelAppPacketServerToClient", response);
  }

  Logout(client: Client, packet: any) {
    clearInterval(client.serverUpdateTimer);
    // this._soeServer.deleteClient(client); this is done too early
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
    let CharactersInfo;
    if (this._soloMode) {
      let SinglePlayerCharacters = await this.loadCharacterData(client);
      if (this._protocol.protocolName == "LoginUdp_9") {
        SinglePlayerCharacters = this.addDummyDataToCharacters(
          SinglePlayerCharacters
        );
        CharactersInfo = {
          status: 1,
          canBypassServerLock: true,
          characters: SinglePlayerCharacters,
        };
      } else {
        // LoginUdp_11
        let characters: Array<any> = [];
        SinglePlayerCharacters.forEach((character: any) => {
          characters.push({
            characterId: character.characterId,
            serverId: character.serverId,
            payload: {
              name: character.characterName,
              modelId: character.actorModelId,
              gender: character.gender,
            },
          });
        });
        characters = this.addDummyDataToCharacters(characters);
        CharactersInfo = {
          status: 1,
          canBypassServerLock: true,
          characters: characters,
        };
      }
    } else {
      const charactersQuery = { authKey: client.loginSessionId };
      let characters = await this._db
        .collection("characters-light")
        .find(charactersQuery)
        .toArray();
      characters = this.addDummyDataToCharacters(characters);
      CharactersInfo = {
        status: 1,
        canBypassServerLock: true,
        characters: characters,
      };
    }
    this.sendData(client, "CharacterSelectInfoReply", CharactersInfo);
    debug("CharacterSelectInfoRequest");
  }

  async ServerListRequest(client: Client) {
    let servers;
    if (!this._soloMode) {
      servers = await this._db.collection("servers").find().toArray();
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
      if (this._soloMode) {
        if (this._protocol.protocolName == "LoginUdp_9") {
          const SoloServer = require("../../../data/2015/sampleData/single_player_server.json");
          servers = [SoloServer];
        } else {
          // LoginUdp_11
          const SoloServer = require("../../../data/2016/sampleData/single_player_server.json");
          servers = [SoloServer];
        }
      }
    }
    this.sendData(client, "ServerListReply", { servers: servers });
  }

  async askZoneForDeletion(
    serverId: number,
    characterId: string
  ): Promise<number> {
    const status = await new Promise((resolve, reject) => {
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
            session: true,
          } as any,
          "CharacterDeleteRequest",
          { reqId: reqId, characterId: characterId }
        );
        this._pendingInternalReq[reqId] = resolve;
        this._pendingInternalReqTimeouts[reqId] = setTimeout(() => {
          delete this._pendingInternalReq[reqId];
          delete this._pendingInternalReqTimeouts[reqId];
          resolve(0);
        }, 10000);
      } catch (e) {
        resolve(0);
      }
    });
    return status as number;
  }

  async CharacterDeleteRequest(client: Client, packet: any) {
    debug("CharacterDeleteRequest");
    let deletionStatus = 1;
    if (this._soloMode) {
      const SinglePlayerCharacters = await this.loadCharacterData(client);
      const characterIndex = SinglePlayerCharacters.findIndex(
        (character: any) => character.characterId === packet.result.characterId
      );
      SinglePlayerCharacters.splice(characterIndex, 1);

      if (this._protocol.protocolName == "LoginUdp_9") {
        fs.writeFileSync(
          `${this._appDataFolder}/single_player_characters.json`,
          JSON.stringify(SinglePlayerCharacters, null, "\t")
        );
      } else {
        // LoginUdp_11
        fs.writeFileSync(
          `${this._appDataFolder}/single_player_characters2016.json`,
          JSON.stringify(SinglePlayerCharacters, null, "\t")
        );
      }
    } else {
      const characterId = (packet.result as any).characterId;
      const characterQuery = { characterId: characterId };
      const charracterToDelete = await this._db
        .collection("characters-light")
        .findOne(characterQuery);
      if (
        charracterToDelete &&
        charracterToDelete.authKey === client.loginSessionId
      ) {
        deletionStatus = await this.askZoneForDeletion(
          charracterToDelete.serverId,
          characterId
        );
        if (deletionStatus) {
          await this._db
            .collection("characters-light")
            .deleteOne(characterQuery, function (err: string) {
              if (err) {
                debug(err);
              } else {
                debug(
                  `Character ${(packet.result as any).characterId} deleted !`
                );
              }
            });
        }
      }
    }
    this.sendData(client, "CharacterDeleteReply", {
      characterId: (packet.result as any).characterId,
      status: deletionStatus,
      Payload: "\0",
    });
  }

  async CharacterLoginRequest(client: Client, packet: any) {
    let charactersLoginInfo: any;
    const { serverId, characterId } = packet.result;
    if (!this._soloMode) {
      const { serverAddress } = await this._db
        .collection("servers")
        .findOne({ serverId: serverId });
      const character = await this._db
        .collection("characters")
        .findOne({ characterId: characterId });
      const connectionStatus = Object.values(this._zoneConnections).includes(
        serverId
      );
      charactersLoginInfo = {
        unknownQword1: "0x0",
        unknownDword1: 0,
        unknownDword2: 0,
        status: connectionStatus,
        applicationData: {
          serverAddress: serverAddress,
          serverTicket: client.loginSessionId,
          encryptionKey: this._cryptoKey,
          guid: characterId,
          unknownQword2: "0x0",
          stationName: "",
          characterName: character.payload.name,
          unknownString: "",
        },
      };
    } else {
      const SinglePlayerCharacters = await this.loadCharacterData(client);
      if (this._protocol.protocolName == "LoginUdp_9") {
        const character = SinglePlayerCharacters.find(
          (character: any) => character.characterId === characterId
        );
        charactersLoginInfo = {
          unknownQword1: "0x0",
          unknownDword1: 0,
          unknownDword2: 0,
          status: 1,
          applicationData: {
            serverAddress: "127.0.0.1:1117",
            serverTicket: client.loginSessionId,
            encryptionKey: this._cryptoKey,
            guid: characterId,
            unknownQword2: "0x0",
            stationName: "",
            characterName: character.payload.name,
            unknownString: "",
          },
        };
      } else {
        // LoginUdp_11
        const character = SinglePlayerCharacters.find(
          (character: any) => character.characterId === characterId
        );
        charactersLoginInfo = {
          unknownQword1: "0x0",
          unknownDword1: 0,
          unknownDword2: 0,
          status: 1,
          applicationData: {
            serverAddress: "127.0.0.1:1117",
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
    }
    debug(charactersLoginInfo);
    this.sendData(client, "CharacterLoginReply", charactersLoginInfo);
    debug("CharacterLoginRequest");
  }

  async askZoneForCreation(
    serverId: number,
    characterData: any
  ): Promise<number> {
    const askZoneForCreationPromise = await new Promise((resolve, reject) => {
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
            session: true,
          } as any,
          "CharacterCreateRequest",
          { reqId: reqId, characterObjStringify: JSON.stringify(characterData) }
        );
        this._pendingInternalReq[reqId] = resolve;
        this._pendingInternalReqTimeouts[reqId] = setTimeout(() => {
          delete this._pendingInternalReq[reqId];
          delete this._pendingInternalReqTimeouts[reqId];
          resolve(0);
        }, 10000);
      } catch (e) {
        resolve(0);
      }
    });
    return askZoneForCreationPromise as number;
  }

  requestZoneCharacterCreation(
    zoneAddress: string,
    characterData: any
  ): number {
    return 1;
  }

  async CharacterCreateRequest(client: Client, packet: any) {
    const {
      payload: { characterName },
      serverId,
    } = packet.result;
    // create character object
    let sampleCharacter, newCharacter;
    if (this._protocol.protocolName == "LoginUdp_9") {
      sampleCharacter = require("../../../data/2015/sampleData/single_player_character.json");
      newCharacter = _.cloneDeep(sampleCharacter);
      newCharacter.payload.name = characterName;
    } else {
      // LoginUdp_11
      sampleCharacter = require("../../../data/2016/sampleData/character.json");
      newCharacter = _.cloneDeep(sampleCharacter);
      newCharacter.characterName = characterName;
    }
    newCharacter.serverId = serverId;
    newCharacter.characterId = generateRandomGuid();
    let creationStatus = 1;
    if (this._soloMode) {
      const SinglePlayerCharacters = await this.loadCharacterData(client);
      SinglePlayerCharacters[SinglePlayerCharacters.length] = newCharacter;
      if (this._protocol.protocolName == "LoginUdp_9") {
        fs.writeFileSync(
          `${this._appDataFolder}/single_player_characters.json`,
          JSON.stringify(SinglePlayerCharacters, null, "\t")
        );
      } else {
        // LoginUdp_11
        fs.writeFileSync(
          `${this._appDataFolder}/single_player_characters2016.json`,
          JSON.stringify(SinglePlayerCharacters, null, "\t")
        );
      }
    } else {
      let sessionObj;
      const storedUserSession = await this._db
        ?.collection("user-sessions")
        .findOne({ authKey: client.loginSessionId, serverId: serverId });
      if (storedUserSession) {
        sessionObj = storedUserSession;
      } else {
        sessionObj = {
          serverId: serverId,
          authKey: client.loginSessionId,
          guid: generateRandomGuid(),
        };
        await this._db?.collection("user-sessions").insertOne(sessionObj);
      }
      const newCharacterData = { ...newCharacter, ownerId: sessionObj.guid };
      creationStatus = (await this.askZoneForCreation(
        serverId,
        newCharacterData
      ))
        ? 1
        : 0;

      if (creationStatus === 1) {
        await this._db
          .collection("characters-light")
          .insertOne({
            authKey: client.loginSessionId,
            serverId: serverId,
            payload: { name: characterName },
            characterId: newCharacter.characterId,
          });
      }
      newCharacter;
    }
    this.sendData(client, "CharacterCreateReply", {
      status: creationStatus,
      characterId: newCharacter.characterId,
    });
  }

  async updateServerList(client: Client): Promise<void> {
    if (!this._soloMode) {
      // useless if in solomode ( never get called either)
      const servers: Array<GameServer> = await this._db
        .collection("servers")
        .find()
        .toArray();

      for (let i = 0; i < servers.length; i++) {
        this.sendData(client, "ServerUpdate", servers[i]);
      }
    }
  }

  async start(): Promise<void> {
    debug("Starting server");
    debug(`Protocol used : ${this._protocol.protocolName}`);
    if (this._mongoAddress) {
      const mongoClient = (this._mongoClient = new MongoClient(
        this._mongoAddress
      ));
      try {
        await mongoClient.connect();
      } catch (e) {
        throw debug("[ERROR]Unable to connect to mongo server");
      }
      debug("connected to mongo !");
      // if no collections exist on h1server database , fill it with samples
      (await mongoClient.db("h1server").collections()).length ||
        (await initMongo(this._mongoAddress, debugName));
      this._db = mongoClient.db("h1server");
      this._zoneWhitelist = await this._db
        .collection("zone-whitelist")
        .find({})
        .toArray();

        setInterval(()=>{
          this._zoneWhitelist = this._db // refresh zoneWhitelist every 30minutes
          .collection("zone-whitelist")
          .find({})
          .toArray();
        },1800000)
    }

    if (this._soloMode) {
      setupAppDataFolder();
      this._soeServer._isLocal = true;
    }
    this._soeServer.start(
      this._compression,
      this._crcSeed,
      this._crcLength,
      this._udpLength
    );
    if (this._mongoAddress && this._enableHttpServer) {
      this._httpServer = new Worker(`${__dirname}/workers/httpServer.js`, {
        workerData: {
          MONGO_URL: this._mongoAddress,
          SERVER_PORT: this._httpServerPort,
        },
      });
      this._httpServer.on("message", (message: httpServerMessage) => {
        const { type, requestId } = message;
        switch (type) {
          case "ping":
            const response: httpServerMessage = {
              type: "ping",
              requestId: requestId,
              data: "pong",
            };
            this._httpServer.postMessage(response);
            break;
          default:
            break;
        }
      });
    }
  }

  data(collectionName: string): any | undefined {
    if (this._db) {
      return this._db.collection(collectionName);
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
    process.exit(0);
  }
}

if (process.env.VSCODE_DEBUG === "true") {
  if (process.env.CLIENT_SIXTEEN === "true") {
    const server = new LoginServer(
      1115, // <- server port
      process.env.MONGO_URL // <- MongoDB address ( if blank server start in solo mode )
    );
    server._protocol = new LoginProtocol("LoginUdp_11");
    server.start();
  } else {
    new LoginServer(1115, process.env.MONGO_URL).start();
  }
}
