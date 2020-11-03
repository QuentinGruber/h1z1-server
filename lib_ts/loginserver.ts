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

const SOEServer = require("./soeserver").SOEServer;
import { LoginProtocol } from "./loginprotocol";
const debug = require("debug")("LoginServer");
import { MongoClient } from "mongodb";

interface SoeServer {
  on: (arg0: string, arg1: any) => void;
  start: (
    compression: any,
    crcSeed: any,
    crcLength: any,
    udpLength: any
  ) => void;
  stop: () => void;
  _sendPacket: () => void;
  sendAppData: (arg0: Client, arg1: any, arg2: undefined | any) => void;
  toggleEncryption: (arg0: boolean) => void;
  toggleDataDump: () => void;
  deleteClient: (client: Client) => void;
}

interface Client {
  sessionId: number;
  address: string;
  port: number;
  crcSeed: number;
  crcLength: number;
  clientUdpLength: number;
  serverUdpLength: number;
  sequences: any;
  compression: number;
  useEncryption: boolean;
  outQueue: any;
  outOfOrderPackets: any;
  nextAck: number;
  lastAck: number;
  inputStream: () => void;
  outputStream: () => void;
  outQueueTimer: () => void;
  ackTimer: () => void;
  outOfOrderTimer: () => void;
}

interface GameServer {
  serverId: number;
  serverState: number;
  locked: boolean;
  name: string;
  nameId: number;
  description: string;
  descriptionId: number;
  reqFeatureId: number;
  serverInfo: string;
  populationLevel: number;
  populationData: string;
  allowedAccess: boolean;
}

export class LoginServer extends EventEmitter {
  _soeServer: SoeServer;
  _protocol: LoginProtocol;
  _db: any; // TODO
  _mongoClient: any;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;
  _gameId: number;
  _environment: string;
  _cryptoKey: string;
  _soloMode: boolean;
  constructor(
    gameId: number,
    environment: string,
    serverPort: number,
    loginKey: string,
    SoloMode: boolean = false
  ) {
    super();
    this._compression = 0x0100;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;
    this._cryptoKey = loginKey;
    this._gameId = gameId;
    this._environment = environment;
    this._soloMode = SoloMode;

    // reminders
    if (this._soloMode) {
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
        let servers;
        if (!this._soloMode) {
          servers = await this._db.collection("servers").find().toArray();
        } else {
          servers = [
            {
              serverId: 1,
              serverState: 0,
              locked: false,
              name: "fuckdb",
              nameId: 1,
              description: "yeah",
              descriptionId: 1,
              reqFeatureId: 0,
              serverInfo:
                'Region="CharacterCreate.RegionUs" PingAddress="127.0.0.1:1117" Subregion="UI.SubregionUS" IsRecommended="1" IsRecommendedVS="0" IsRecommendedNC="0" IsRecommendedTR="0"',
              populationLevel: 1,
              populationData:
                'ServerCapacity="0" PingAddress="127.0.0.1:1117" Rulesets="Permadeath"',
              allowedAccess: true,
            },
          ];
        }
        for (var i = 0; i < servers.length; i++) {
          if (servers[i]._id) {
            delete servers[i]._id;
          }
          var data = this._protocol.pack("ServerUpdate", servers[i]);
          this._soeServer.sendAppData(client, data, true);
        }
      }
    );

    this._soeServer.on(
      "appdata",
      async (err: string, client: Client, data: Buffer) => {
        const packet: any = this._protocol.parse(data);
        if (packet !== false) {
          // if packet parsing succeed
          var result = packet.result;
          let data: Buffer;
          switch (packet.name) {
            case "LoginRequest":
              var falsified_data = {
                loggedIn: true,
                status: 1,
                isMember: true,
                isInternal: true,
                namespace: "soe",
                ApplicationPayload: "",
              };
              data = this._protocol.pack("LoginReply", falsified_data);
              this._soeServer.sendAppData(client, data, true);
            case "CharacterSelectInfoRequest":
              let CharactersInfo;
              if (this._soloMode) {
                const SinglePlayerCharacter = require("./data/single_player_character.json");
                CharactersInfo = {
                  status: 1,
                  canBypassServerLock: true,
                  characters: [SinglePlayerCharacter],
                };
              } else {
                const characters = await this._db
                  .collection("characters")
                  .find()
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
            case "ServerListRequest":
              let servers;
              if (!this._soloMode) {
                servers = await this._db.collection("servers").find().toArray();
              } else {
                if (this._soloMode) {
                  const SoloServer = require("./data/single_player_server.json");
                  servers = [SoloServer];
                }
              }
              for (var i = 0; i < servers.length; i++) {
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
                status:1,
                Payload:"\0"
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
                const WaitSuccess = await this._db
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
                  characterId: characterId,
                  serverId: serverId,
                  status: 1,
                  unknown: 0,
                  payload: {
                    serverAddress: serverAddress, // zoneserver port
                    serverTicket: "7y3Bh44sKWZCYZH",
                    encryptionKey: this._cryptoKey,
                    characterId: characterId,
                    guid: 722776196,
                    unknown2: 0,
                    stationName: "nope0no",
                    characterName: "LocalPlayer", // get character name from the characterID (ask db)
                    loginQueuePlacement: 0,
                  },
                };
              } else {
                charactersLoginInfo = {
                  characterId: characterId,
                  serverId: serverId,
                  status: 1,
                  unknown: 0,
                  payload: {
                    serverAddress: "127.0.0.1:1117", // zoneserver port
                    serverTicket: "7y3Bh44sKWZCYZH",
                    encryptionKey: this._cryptoKey,
                    characterId: characterId,
                    guid: 722776196, 
                    unknown2: 0,
                    stationName: "nope0no",
                    characterName: "LocalPlayer",
                    loginQueuePlacement: 0,
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
                characterId: "0x03147cca2a860191", // TODO: generate a random id like on zoneserver
              };
              data = this._protocol.pack("CharacterCreateReply", reply_data);
              this._soeServer.sendAppData(client, data, true);
              break;

            case "TunnelAppPacketClientToServer":
              const TestData = {
                unknown1: true,
              };
              data = this._protocol.pack(
                "TunnelAppPacketServerToClient",
                TestData
              );
              this._soeServer.sendAppData(client, data, true);
              break;

            case "Logout":
              this._soeServer.deleteClient(client);
          }
        } else {
          debug("Packet parsing was unsuccesful");
        }
      }
    );
  }
  async start() {
    debug("Starting server");
    if (!this._soloMode) {
      const uri =
        "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
      const mongoClient = (this._mongoClient = new MongoClient(uri, {
        useUnifiedTopology: true,
        native_parser: true,
      }));
      try {
        await mongoClient.connect();
      } catch (e) {
        throw debug("[ERROR]Unable to connect to mongo server");
      }
      if (mongoClient.isConnected()) {
        debug("connected to mongo !");
        this._db = await mongoClient.db("h1server");
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
