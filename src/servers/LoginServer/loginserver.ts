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
import { LoginProtocol } from "../../protocols/loginprotocol";
import { MongoClient } from "mongodb";
import {
  generateRandomGuid,
  getAppDataFolderPath,
  initMongo,
  _,
  setupAppDataFolder,
} from "../../utils/utils";
import { Client, GameServer, SoeServer } from "../../types/loginserver";
import fs from "fs";

const debugName = "LoginServer";
const debug = require("debug")(debugName);
const characterItemDefinitionsDummy = require("../../../data/2015/sampleData/characterItemDefinitionsDummy.json");

export class LoginServer extends EventEmitter {
  _soeServer: SoeServer;
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
  }

  sendData(client: Client, packetName: string, obj: any) {
    const data = this._protocol.pack(packetName, obj);
    this._soeServer.sendAppData(client, data, true);
  }

  LoginRequest(client: Client, sessionId: string, fingerprint: string) {
    client.loginSessionId = sessionId;
    const falsified_data = {
      loggedIn: true,
      status: 1,
      isMember: true,
      isInternal: true,
      namespace: "soe",
      ApplicationPayload: "",
    };
    this.sendData(client, "LoginReply", falsified_data);
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
    }
    return characters;
  }
  async CharacterSelectInfoRequest(client: Client) {
    let CharactersInfo;
    if (this._soloMode) {
      let SinglePlayerCharacters;
      if (this._protocol.protocolName == "LoginUdp_9") {
        SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters.json`);
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
        SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters2016.json`);
        SinglePlayerCharacters.forEach((character: any) => {
          characters.push({
            characterId: character.characterId,
            serverId: character.serverId,
            payload: {
              name: character.characterName,
              modelId: character.actorModelId,
              gender: character.gender
            }
          })
        });
        characters = this.addDummyDataToCharacters(
          characters
        );
        CharactersInfo = {
          status: 1,
          canBypassServerLock: true,
          characters: characters,
        };
      }
    } else {
      const charactersQuery = { ownerId: client.loginSessionId };
      let characters = await this._db
        .collection("characters")
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
    for (let i = 0; i < servers.length; i++) {
      if (servers[i]._id) {
        delete servers[i]._id;
      }
    }
    this.sendData(client, "ServerListReply", { servers: servers });
  }

  async CharacterDeleteRequest(client: Client, packet: any) {
    const characters_delete_info: any = {
      characterId: (packet.result as any).characterId,
      status: 1,
      Payload: "\0",
    };
    debug("CharacterDeleteRequest");
    this.sendData(client, "CharacterDeleteReply", characters_delete_info);
    if (this._soloMode) {
      if (this._protocol.protocolName == "LoginUdp_9") {
        delete require.cache[
          require.resolve(
            `${this._appDataFolder}/single_player_characters.json`
          )
        ];
        const singlePlayerCharacters: any[] = require(`${this._appDataFolder}/single_player_characters.json`);
        const characterIndex = singlePlayerCharacters.findIndex(
          (character: any) =>
            character.characterId === packet.result.characterId
        );
        singlePlayerCharacters.splice(characterIndex, 1);
        fs.writeFileSync(
          `${this._appDataFolder}/single_player_characters.json`,
          JSON.stringify(singlePlayerCharacters, null, "\t")
        );
      } else {
        // LoginUdp_11
        delete require.cache[
          require.resolve(
            `${this._appDataFolder}/single_player_characters2016.json`
          )
        ];
        const singlePlayerCharacters: any[] = require(`${this._appDataFolder}/single_player_characters2016.json`);
        const characterIndex = singlePlayerCharacters.findIndex(
          (character: any) =>
            character.characterId === packet.result.characterId
        );
        singlePlayerCharacters.splice(characterIndex, 1);
        fs.writeFileSync(
          `${this._appDataFolder}/single_player_characters2016.json`,
          JSON.stringify(singlePlayerCharacters, null, "\t")
        );
      }
    } else {
      await this._db
        .collection("characters")
        .deleteOne(
          { characterId: (packet.result as any).characterId },
          function (err: string) {
            if (err) {
              debug(err);
            } else {
              debug(
                `Character ${(packet.result as any).characterId} deleted !`
              );
            }
          }
        );
    }
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

      charactersLoginInfo = {
        unknownQword1: "0x0",
        unknownDword1: 0,
        unknownDword2: 0,
        status: 1,
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
      let SinglePlayerCharacters;
      if (this._protocol.protocolName == "LoginUdp_9") {
        SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters.json`);
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
        SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters2016.json`);
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

  async CharacterCreateRequest(client: Client, packet: any) {
    const {
      payload: { characterName },
      serverId,
    } = packet.result;
    // create character object
    let SinglePlayerCharacter, SinglePlayerCharacters, newCharacter;
    if (this._protocol.protocolName == "LoginUdp_9") {
      try {
        // delete old character cache
        delete require.cache[
          require.resolve(
            `${this._appDataFolder}/single_player_characters.json`
          )
        ];
      } catch (e) {}
      SinglePlayerCharacter = require("../../../data/2015/sampleData/single_player_character.json");
      if (this._soloMode)
        SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters.json`);
      newCharacter = _.cloneDeep(SinglePlayerCharacter);
      newCharacter.serverId = serverId;
      newCharacter.payload.name = characterName;
      newCharacter.characterId = generateRandomGuid();
    } else {
      // LoginUdp_11
      try {
        // delete old character cache
        delete require.cache[
          require.resolve(
            `${this._appDataFolder}/single_player_characters2016.json`
          )
        ];
      } catch (e) {}
      SinglePlayerCharacter = require("../../../data/2016/sampleData/character.json");
      SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters2016.json`);
      newCharacter = _.cloneDeep(SinglePlayerCharacter);
      newCharacter.serverId = serverId;
      newCharacter.characterName = characterName;
      newCharacter.characterId = generateRandomGuid();
    }
    
    if (this._soloMode) {
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
      await this._db
        .collection("characters")
        .insertOne({ ...newCharacter, ownerId: client.loginSessionId });
    }
    const reply_data = {
      status: 1,
      characterId: newCharacter.characterId,
    };
    this.sendData(client, "CharacterCreateReply", reply_data);
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
    }

    if (this._soloMode) {
      setupAppDataFolder();
    }
    (this._soeServer as SoeServer).start(
      this._compression,
      this._crcSeed,
      this._crcLength,
      this._udpLength
    );
  }

  data(collectionName: string): any | undefined {
    if (this._db) {
      return this._db.collection(collectionName);
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
      "" // <- MongoDB address ( if blank server start in solo mode )
    );
    server._protocol = new LoginProtocol("LoginUdp_11");
    server.start();
  } else {
    new LoginServer(1115, "").start();
  }
}
