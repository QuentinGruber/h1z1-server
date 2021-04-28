// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2021 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "events";

const SOEServer = require("../SoeServer/soeserver").SOEServer;
import { LoginProtocol } from "../../protocols/loginprotocol";
const debugName = "LoginServer";
const debug = require("debug")(debugName);
import { toUint8Array } from "js-base64";
import { MongoClient } from "mongodb";
import {
  generateCharacterId,
  getCharacterId,
  initMongo,
} from "../../utils/utils";
import { SoeServer, Client, GameServer } from "../../types/loginserver";
import _ from "lodash";

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
  constructor(serverPort: number, mongoAddress: string = "") {
    super();
    this._compression = 0x0100;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;
    this._cryptoKey = toUint8Array("F70IaxuU8C/w7FPXY1ibXw==");
    this._soloMode = false;
    this._mongoAddress = mongoAddress;

    // reminders
    if (!this._mongoAddress) {
      this._soloMode = true;
      debug("Server in solo mode !");
    }

    this._soeServer = new SOEServer(
      "LoginUdp_9",
      serverPort,
      this._cryptoKey,
      null
    );
    this._protocol = new LoginProtocol();
    this._soeServer.on("connect", (err: string, client: Client) => {
      debug("Client connected from " + client.address + ":" + client.port);
      this.emit("connect", err, client);
    });
    this._soeServer.on("disconnect", (err: string, client: Client) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      this.emit("disconnect", err, client);
    });
    this._soeServer.on("session", (err: string, client: Client) => {
      debug("Session started for client " + client.address + ":" + client.port);
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
        const packet: any = this._protocol.parse(data);
        if (packet !== false) {
          // if packet parsing succeed
          const result = packet.result;
          let data: Buffer;
          switch (packet.name) {
            case "LoginRequest":
              client.loginSessionId = packet.result.sessionId;
              const falsified_data = {
                loggedIn: true,
                status: 1,
                isMember: true,
                isInternal: true,
                namespace: "soe",
                ApplicationPayload: "",
              };
              data = this._protocol.pack("LoginReply", falsified_data);
              this._soeServer.sendAppData(client, data, true);
              if (!this._soloMode) {
                client.serverUpdateTimer = setInterval(
                  () => this.updateServerList(client),
                  30000
                );
              }
              if (this._protocol.protocolName !== "LoginUdp_11") break;
            case "CharacterSelectInfoRequest":
              let CharactersInfo;
              if (this._soloMode) {
                const SinglePlayerCharacter = require("../../../data/sampleData/single_player_character.json");

                const cowboy = _.cloneDeep(SinglePlayerCharacter); // for fun 🤠
                cowboy.characterId = getCharacterId(99);
                cowboy.payload.name = "Cowboy";

                CharactersInfo = {
                  status: 1,
                  canBypassServerLock: true,
                  characters: [SinglePlayerCharacter, cowboy],
                };
              } else {
                const charactersQuery = { ownerId: client.loginSessionId };
                const characters = await this._db
                  .collection("characters")
                  .find(charactersQuery)
                  .toArray();
                CharactersInfo = {
                  status: 1,
                  canBypassServerLock: true,
                  characters: characters,
                };
              }
              data = this._protocol.pack(
                "CharacterSelectInfoReply",
                CharactersInfo
              );
              this._soeServer.sendAppData(client, data, true);
              debug("CharacterSelectInfoRequest");
              if (this._protocol.protocolName !== "LoginUdp_11") break;
            case "ServerListRequest":
              let servers;
              if (!this._soloMode) {
                servers = await this._db.collection("servers").find().toArray();
              } else {
                if (this._soloMode) {
                  const SoloServer = require("../../../data/sampleData/single_player_server.json");
                  servers = [SoloServer];
                }
              }
              for (let i = 0; i < servers.length; i++) {
                if (servers[i]._id) {
                  delete servers[i]._id;
                }
              }
              data = this._protocol.pack("ServerListReply", {
                servers: servers,
              });
              this._soeServer.sendAppData(client, data, true);

              break;

            case "CharacterDeleteRequest":
              const characters_delete_info: any = {
                characterId: (packet.result as any).characterId,
                status: 1,
                Payload: "\0",
              };
              data = this._protocol.pack(
                "CharacterDeleteReply",
                characters_delete_info
              );
              this._soeServer.sendAppData(client, data, true);
              debug("CharacterDeleteRequest");

              if (this._soloMode) {
                debug(
                  "Deleting a character in solo mode is weird, modify single_player_character.json instead"
                );
                break;
              } else {
                await this._db
                  .collection("characters")
                  .deleteOne(
                    { characterId: (packet.result as any).characterId },
                    function (err: any, obj: any) {
                      if (err) {
                        debug(err);
                      } else {
                        debug(
                          "Character " +
                            (packet.result as any).characterId +
                            " deleted !"
                        );
                      }
                    }
                  );
              }
              break;
            case "CharacterLoginRequest":
              let charactersLoginInfo: any;
              const { serverId, characterId } = packet.result;
              if (!this._soloMode) {
                const { serverAddress } = await this._db
                  .collection("servers")
                  .findOne({ serverId: serverId });
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
                    characterName: "",
                    unknownString: "",
                  },
                };
              } else {
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
                    characterName: "",
                    unknownString: "",
                  },
                };
              }
              debug(charactersLoginInfo);
              data = this._protocol.pack(
                "CharacterLoginReply",
                charactersLoginInfo
              );
              this._soeServer.sendAppData(client, data, true);
              debug("CharacterLoginRequest");
              break;

            case "CharacterCreateRequest":
              const reply_data = {
                status: 1,
                characterId: "0x0",//generateCharacterId(), TODO: get guids list from mongo
              };
              data = this._protocol.pack("CharacterCreateReply", reply_data);
              this._soeServer.sendAppData(client, data, true);
              break;

            case "TunnelAppPacketClientToServer":
              console.log(packet);
              packet.tunnelData = new (Buffer as any).alloc(4);
              packet.tunnelData.writeUInt32LE(0x1); // TODO
              data = this._protocol.pack(
                "TunnelAppPacketServerToClient",
                packet
              );
              console.log(data);
              this._soeServer.sendAppData(client, data, true);
              break;

            case "Logout":
              clearInterval(client.serverUpdateTimer);
              // this._soeServer.deleteClient(client); this is done to early
              break;
          }
        } else {
          debug("Packet parsing was unsuccesful");
        }
      }
    );
  }
  async updateServerList(client: Client) {
    if (!this._soloMode) {
      // useless if in solomode ( never get called either)
      const servers: Array<GameServer> = await this._db
        .collection("servers")
        .find()
        .toArray();

      for (let i = 0; i < servers.length; i++) {
        const data = this._protocol.pack("ServerUpdate", servers[i]);
        this._soeServer.sendAppData(client, data, true);
      }
    }
  }
  async start() {
    debug("Starting server");
    debug(`Protocol used : ${this._protocol.protocolName}`);
    if (this._mongoAddress) {
      const mongoClient = (this._mongoClient = new MongoClient(
        this._mongoAddress,
        {
          useUnifiedTopology: true,
          native_parser: true,
        }
      ));
      try {
        await mongoClient.connect();
      } catch (e) {
        throw debug("[ERROR]Unable to connect to mongo server");
      }
      if (mongoClient.isConnected()) {
        debug("connected to mongo !");

        // if no collections exist on h1server database , fill it with samples
        (await mongoClient.db("h1server").collections()).length ||
          (await initMongo(this._mongoAddress, debugName));
        this._db = mongoClient.db("h1server");
      } else {
        throw debug("Unable to authenticate on mongo !");
      }
    }

    (this._soeServer as SoeServer).start(
      this._compression,
      this._crcSeed,
      this._crcLength,
      this._udpLength
    );
  }
  data(collectionName: string) {
    if (this._db) {
      return this._db.collection(collectionName);
    }
  }
  stop() {
    debug("Shutting down");
    process.exit(0);
  }
}
