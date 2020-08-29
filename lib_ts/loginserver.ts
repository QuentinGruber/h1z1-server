import { EventEmitter } from "events";

const SOEServer = require("./soeserver").SOEServer,
  LoginProtocol = require("./loginprotocol").LoginProtocol,
  debug = require("debug")("LoginServer"),
  MongoClient = require("mongodb").MongoClient;

interface LoginProtocol {
  parse: Function;
  pack: Function;
}

interface SoeServer {
  on: Function;
  start: Function;
  stop: Function;
  _sendPacket: Function;
  sendAppData: Function;
  toggleEncryption: Function;
  toggleDataDump: Function;
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
  inputStream: Function;
  outputStream: Function;
  outQueueTimer: Function;
  ackTimer: Function;
  outOfOrderTimer: Function;
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
  _usingMongo: boolean;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;
  _gameId: number;
  _environment: string;
  _cryptoKey: string;

  constructor(
    gameId: number,
    environment: string,
    usingMongo: boolean,
    serverPort: number,
    loginKey: string,
    SoloMode: boolean = false,
    ServerList: Array<GameServer>
  ) {
    super();
    this._usingMongo = usingMongo;
    this._compression = 0x0100;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;
    this._cryptoKey = loginKey;
    this._gameId = gameId;
    this._environment = environment;

    // reminders
    if (SoloMode) {
      debug("Server in solo mode, Serverlist argument & MongoDB ignored !");
    } else if (usingMongo && ServerList != undefined) {
      debug("Server using Mongo, the defined Serverlist is ignored !");
    } else if (!usingMongo && ServerList == undefined) {
      debug(
        "You must provide a serverlist with Mongodb or with the serverlist argument !"
      );
      debug("you can run the server in solo mode to fix this problem.");
      this.stop();
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
      //server.emit('connect', err, client);
    });
    this._soeServer.on("disconnect", (err: string, client: Client) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      //server.emit('disconnect', err, client);
    });
    this._soeServer.on("session", (err: string, client: Client) => {
      debug("Session started for client " + client.address + ":" + client.port);
    });
    this._soeServer.on(
      "SendServerUpdate",
      async (err: string, client: Client) => {
        let servers;
        if (usingMongo) {
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
        var packet = this._protocol.parse(data);
        if (packet != false) {
          // if packet parsing succeed
          var result = packet.result;
          switch (packet.name) {
            case "LoginRequest":
              var falsified_data = {
                loggedIn: true,
                status: 1,
                isMember: true,
                isInternal: true,
                namespace: "soe",
                payload: "",
              };
              var data: Buffer = this._protocol.pack(
                "LoginReply",
                falsified_data
              );
              this._soeServer.sendAppData(client, data, true);
              break;
            case "ServerListRequest":
              let servers;
              if (usingMongo && !SoloMode) {
                servers = await this._db.collection("servers").find().toArray();
              } else {
                if (SoloMode) {
                  const SoloServer = require("../single_player_server.json");
                  servers = [SoloServer];
                } else {
                  servers = ServerList;
                }
              }
              for (var i = 0; i < servers.length; i++) {
                if (servers[i]._id) {
                  delete servers[i]._id;
                }
              }
              var data: Buffer = this._protocol.pack("ServerListReply", {
                servers: servers,
              });
              this._soeServer.sendAppData(client, data, true);

              break;

            case "CharacterDeleteRequest":
              const characters_delete_info: any = {
                characterId: packet.result.characterId,
              };
              var data: Buffer = this._protocol.pack(
                "CharacterDeleteReply",
                characters_delete_info
              );
              this._soeServer.sendAppData(client, data, true, true);
              debug("CharacterDeleteRequest");
              break;
            case "CharacterSelectInfoRequest":
              let characters_info;
              if (SoloMode) {
                const SinglePlayerCharacter = require("../single_player_character.json");
                characters_info = {
                  status: 1,
                  canBypassServerLock: true,
                  characters: [SinglePlayerCharacter],
                };
              } else {
                characters_info = {
                  status: 1,
                  canBypassServerLock: true,
                  characters: [],
                };
              }
              var data: Buffer = this._protocol.pack(
                "CharacterSelectInfoReply",
                characters_info
              );
              this._soeServer.sendAppData(client, data, true, true);
              debug("CharacterSelectInfoRequest");
              break;
            case "CharacterLoginRequest":
              let characters_Login_info: any;
              if (usingMongo) {
                debug("[error] MongoDB support isn't ready");
                characters_Login_info = {
                  characterId: packet.result.characterId,
                  serverId: 1,
                  status: 1,
                  unknown: 0,
                  payload: "\u0000",
                };
              } else {
                characters_Login_info = {
                  characterId: packet.result.characterId,
                  serverId: 1,
                  status: 1,
                  unknown: 0,
                  // prettier-ignore
                  payload: "\u0000",
                };
              }
              debug(characters_Login_info);
              var data: Buffer = this._protocol.pack(
                "CharacterLoginReply",
                characters_Login_info
              );
              this._soeServer.sendAppData(client, data, true);
              debug("CharacterLoginRequest");
              break;

            case "TunnelAppPacketClientToServer":
              var test_data = {
                unknown1: true,
              };
              var data: Buffer = this._protocol.pack(
                "TunnelAppPacketServerToClient",
                test_data
              );
              this._soeServer.sendAppData(client, data, true);
              break;
          }
        } else {
          debug("Packet parsing was unsuccesful");
        }
      }
    );
  }
  async start() {
    debug("Starting server");
    if (this._usingMongo) {
      const uri =
        "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
      const mongoClient = (this._mongoClient = new MongoClient(uri, {
        useUnifiedTopology: true,
        native_parser: true,
      }));
      try {
        let waiting = await mongoClient.connect();
      } catch (e) {
        throw console.error("[ERROR]Unable to connect to mongo server");
      }
      if (mongoClient.isConnected()) {
        debug("connected to mongo !");
        this._db = await mongoClient.db("h1server");
      } else {
        throw console.error("Unable to authenticate on mongo !", 2);
      }
    }

    this._soeServer.start(
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
