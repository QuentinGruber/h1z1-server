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

const SOEServer = require("../SoeServer/soeserver").SOEServer;
import { LoginProtocol } from "../../protocols/loginprotocol";
const debug = require("debug")("LoginServer");
import { toUint8Array } from "js-base64";
import { MongoClient } from "mongodb";
import { generateGuid } from "../../utils/utils"

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
  _db: any;
  _mongoClient: any;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;
  _cryptoKey: Uint8Array;
  _mongoAddress: string;
  _soloMode: boolean;
  constructor(
    serverPort: number,
    mongoAddress: string
  ) {
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
        let servers: Array<GameServer>;
        if (!this._soloMode) {
          // useless if in solomode ( never get called either)
          servers = await this._db.collection("servers").find().toArray();

          for (var i = 0; i < servers.length; i++) {
            var data = this._protocol.pack("ServerUpdate", servers[i]);
            this._soeServer.sendAppData(client, data, true);
          }
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
                const SinglePlayerCharacter = require("../../../data/single_player_character.json");
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
                  const SoloServer = require("../../../data/single_player_server.json");
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
                  characterId: characterId,
                  serverId: serverId,
                  lastLogin: 1406824518,
                  status: 1,
                  applicationData: {
                    serverAddress: serverAddress, // zoneserver port
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
              } else {
                charactersLoginInfo = {
                  characterId: characterId,
                  serverId: serverId,
                  lastLogin: 1406824518,
                  status: 1,
                  applicationData: {
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
                characterId: generateGuid(),
              };
              data = this._protocol.pack("CharacterCreateReply", reply_data);
              this._soeServer.sendAppData(client, data, true);
              break;

            case "TunnelAppPacketClientToServer":

              // weird stuff here :D
              // I try to simulate the tunnelpacket sending and 
              // to send back a convincing result to the game without having to transfer the packet to the game server.

              const { tunnelData } = packet;
              const tunnelPackets = [0x14] // an array containing all tunnel packets opcodes
              let tunnelAppPacket;
              for (let index = 0; index < tunnelPackets.length; index++) {
                // Build a "simulated" packet
                const opcode = tunnelPackets[index];
                const prefix = Buffer.alloc(1)
                prefix.writeUInt8(opcode)
                const SimulatedPacket = Buffer.concat([prefix, tunnelData])
                // parse that packet
                let result;
                try {
                  result = this._protocol.parse(SimulatedPacket)
                } catch (error) {}
                // if parsing is a success then we have identified our package
                if(result){
                  tunnelAppPacket = result
                  break}
              }
              //debug(tunnelAppPacket)
              // Do something with the identify packet
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
    if (this._mongoAddress) {
      const mongoClient = (this._mongoClient = new MongoClient(this._mongoAddress, {
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
