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

import { SOEServer } from "../SoeServer/soeserver";
import { LoginProtocol } from "../../protocols/loginprotocol";
import { toUint8Array } from "js-base64";
import { MongoClient } from "mongodb";
import { generateRandomGuid, initMongo } from "../../utils/utils";
import { Client, GameServer, SoeServer } from "../../types/loginserver";
import _ from "lodash";

const debugName = "LoginServer";
const debug = require("debug")(debugName);

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

  constructor(serverPort: number, mongoAddress = "") {
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
      0
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
          const { sessionId } = packet.result;
          switch (packet.name) {
            case "LoginRequest": {
              this.LoginRequest(client,sessionId)
              if (this._protocol.protocolName !== "LoginUdp_11") break;
            }
            case "CharacterSelectInfoRequest": {
              this.CharacterSelectInfoRequest(client)
              if (this._protocol.protocolName !== "LoginUdp_11") break;
            }
            case "ServerListRequest":
              this.ServerListRequest(client)
              break;

            case "CharacterDeleteRequest": {
              this.CharacterDeleteRequest(client,packet)
              break;
            }
            case "CharacterLoginRequest": {
              this.CharacterLoginRequest(client,packet)
              break;
            }
            case "CharacterCreateRequest": {
             this.CharacterCreateRequest(client)
              break;
            }
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

  LoginRequest(client:Client,sessionId:string){
    client.loginSessionId = sessionId;
    const falsified_data = {
      loggedIn: true,
      status: 1,
      isMember: true,
      isInternal: true,
      namespace: "soe",
      ApplicationPayload: "",
    };
    const data = this._protocol.pack("LoginReply", falsified_data);
    this._soeServer.sendAppData(client, data, true);
    if (!this._soloMode) {
      client.serverUpdateTimer = setInterval(
        // TODO: fix the fact that this interval is never cleared
        () => this.updateServerList(client),
        30000
      );
    }
  }

  async CharacterSelectInfoRequest(client:Client){
    let CharactersInfo;
    if (this._soloMode) {
      const SinglePlayerCharacter = require("../../../data/2015/sampleData/single_player_character.json");

      const cowboy = _.cloneDeep(SinglePlayerCharacter); // for fun 🤠
      cowboy.characterId = "0x0000000000000001";
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
    const data = this._protocol.pack(
      "CharacterSelectInfoReply",
      CharactersInfo
    );
    this._soeServer.sendAppData(client, data, true);
    debug("CharacterSelectInfoRequest");
  }

  async ServerListRequest(client:Client){
    let servers;
    if (!this._soloMode) {
      servers = await this._db
        .collection("servers")
        .find()
        .toArray();
    } else {
      if (this._soloMode) {
        const SoloServer = require("../../../data/2015/sampleData/single_player_server.json");
        servers = [SoloServer];
      }
    }
    for (let i = 0; i < servers.length; i++) {
      if (servers[i]._id) {
        delete servers[i]._id;
      }
    }
    const data = this._protocol.pack("ServerListReply", {
      servers: servers,
    });
    this._soeServer.sendAppData(client, data, true);
  }

  async CharacterDeleteRequest(client:Client,packet:any){
    const characters_delete_info: any = {
      characterId: (packet.result as any).characterId,
      status: 1,
      Payload: "\0",
    };
    const data = this._protocol.pack(
      "CharacterDeleteReply",
      characters_delete_info
    );
    this._soeServer.sendAppData(client, data, true);
    debug("CharacterDeleteRequest");

    if (this._soloMode) {
      debug(
        "Deleting a character in solo mode is weird, modify single_player_character.json instead"
      );
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
                "Character " +
                  (packet.result as any).characterId +
                  " deleted !"
              );
            }
          }
        );
    }
  }

  async CharacterLoginRequest(client: Client,packet:any){
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
    const data = this._protocol.pack(
      "CharacterLoginReply",
      charactersLoginInfo
    );
    this._soeServer.sendAppData(client, data, true);
    debug("CharacterLoginRequest");
  }

  CharacterCreateRequest(client:Client){
    const reply_data = {
      status: 1,
      characterId: generateRandomGuid(),
    };
    const data = this._protocol.pack("CharacterCreateReply", reply_data);
    this._soeServer.sendAppData(client, data, true);
  }

  async updateServerList(client: Client): Promise<void> {
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

  async start(): Promise<void> {
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
    new LoginServer(1115).start();
  }
}
