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

  constructor(
    gameId: number,
    environment: string,
    usingMongo: boolean,
    serverPort: number,
    loginKey: string,
    SpamGlitch: boolean
  ) {
    super();
    this._usingMongo = usingMongo;
    this._compression = 0x0100;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;

    this._gameId = gameId;
    this._environment = environment;

    this._soeServer = new SOEServer(
      "LoginUdp_9",
      serverPort,
      loginKey,
      null,
      SpamGlitch
    );
    this._protocol = new LoginProtocol(SpamGlitch);
    if (SpamGlitch) {
      debug("Server using SpamGlitch");
    }
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
      "Force_sendServerList",
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
        // remove object id
        for (let i = 0; i < servers.length; i++) {
          if (servers[i]._id) {
            delete servers[i]._id;
          }
        }
        var data = this._protocol.pack("ServerListReply", {
          servers: servers,
        });
        this._soeServer.sendAppData(client, data, true);
      }
    );
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
              /*
              backend.login(result.sessionId, result.fingerprint, function (
                err,
                result
              ) {
                if (err) {
                  server.emit("login", new LoginError("Login failed"));
                } else {
                  var data = protocol.pack("LoginReply", result);
                  soeServer.sendAppData(client, data, true);
                }
              });
              */
              var falsified_data = {
                // HACK
                loggedIn: true,
                status: 1,
                isMember: true,
                isInternal: true,
                namespace: "",
                payload: "e",
              };
              var data: Buffer = this._protocol.pack(
                "LoginReply",
                falsified_data
              );
              this._soeServer.sendAppData(client, data, true);
              break;
            case "ServerListRequest":
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
              var data: Buffer = this._protocol.pack("ServerListReply", {
                servers: servers,
              });
              this._soeServer.sendAppData(client, data, true);

              break;
            case "CharacterSelectInfoRequest":
              const characters_info: any = {
                status: 1,
                canBypassServerLock: true,
                characters: [
                  {
                    characterId: "0x03147cca2a860191",
                    serverId: 1,
                    status: 0,
                    lastLoginDate: 1403451769,
                    unknown1: 0,
                    unknown2: 1,
                    payload: {
                      name: "LocalPlayer",
                      empireId: 1,
                      battleRank: 100,
                      nextBattleRankPercent: 0,
                      headId: 5,
                      modelId: 174,
                      gender: 2,
                      profileId: 22,
                      unknownDword1: 1,
                      loadoutData: {
                        loadoutId: 20,
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
                        loadoutSlots: [
                          {
                            slotId: 1,
                            loadoutSlotData: {
                              index: 1,
                              unknownData1: {
                                itemLineId: 80,
                                flags: 0,
                                attachments: [
                                  {
                                    attachmentId: 2400,
                                  },
                                  {
                                    attachmentId: 45081,
                                  },
                                  {
                                    attachmentId: 46156,
                                  },
                                  {
                                    attachmentId: 46348,
                                  },
                                ],
                                attachmentClasses: [
                                  {
                                    classId: 1,
                                    attachmentId: 2400,
                                  },
                                  {
                                    classId: 5,
                                    attachmentId: 45081,
                                  },
                                  {
                                    classId: 3,
                                    attachmentId: 46156,
                                  },
                                  {
                                    classId: 2,
                                    attachmentId: 46348,
                                  },
                                ],
                              },
                              tintItemId: 0,
                              itemSlot: 7,
                            },
                          },
                          {
                            slotId: 3,
                            loadoutSlotData: {
                              index: 3,
                              unknownData1: {
                                itemLineId: 2,
                                flags: 0,
                                attachments: [
                                  {
                                    attachmentId: 2000,
                                  },
                                  {
                                    attachmentId: 46165,
                                  },
                                  {
                                    attachmentId: 46357,
                                  },
                                ],
                                attachmentClasses: [
                                  {
                                    classId: 1,
                                    attachmentId: 2000,
                                  },
                                  {
                                    classId: 3,
                                    attachmentId: 46165,
                                  },
                                  {
                                    classId: 2,
                                    attachmentId: 46357,
                                  },
                                ],
                              },
                              tintItemId: 0,
                              itemSlot: 7,
                            },
                          },
                          {
                            slotId: 5,
                            loadoutSlotData: {
                              index: 5,
                              unknownData1: {
                                itemLineId: 1121,
                                flags: 0,
                                attachments: [
                                  {
                                    attachmentId: 48090,
                                  },
                                  {
                                    attachmentId: 48091,
                                  },
                                  {
                                    attachmentId: 48092,
                                  },
                                ],
                                attachmentClasses: [
                                  {
                                    classId: 1,
                                    attachmentId: 48090,
                                  },
                                  {
                                    classId: 2,
                                    attachmentId: 48091,
                                  },
                                  {
                                    classId: 3,
                                    attachmentId: 48092,
                                  },
                                ],
                              },
                              tintItemId: 0,
                              itemSlot: 7,
                            },
                          },
                          {
                            slotId: 6,
                            loadoutSlotData: {
                              index: 6,
                              unknownData1: {
                                itemLineId: 1,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 0,
                            },
                          },
                          {
                            slotId: 7,
                            loadoutSlotData: {
                              index: 7,
                              unknownData1: {
                                itemLineId: 0,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 7,
                            },
                          },
                          {
                            slotId: 8,
                            loadoutSlotData: {
                              index: 8,
                              unknownData1: {
                                itemLineId: 3061,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 0,
                            },
                          },
                          {
                            slotId: 9,
                            loadoutSlotData: {
                              index: 9,
                              unknownData1: {
                                itemLineId: 14,
                                flags: 128,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 13,
                            },
                          },
                          {
                            slotId: 10,
                            loadoutSlotData: {
                              index: 10,
                              unknownData1: {
                                itemLineId: 0,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 3,
                            },
                          },
                          {
                            slotId: 11,
                            loadoutSlotData: {
                              index: 11,
                              unknownData1: {
                                itemLineId: 76429,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 6,
                            },
                          },
                          {
                            slotId: 12,
                            loadoutSlotData: {
                              index: 12,
                              unknownData1: {
                                itemLineId: 0,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 0,
                            },
                          },
                          {
                            slotId: 13,
                            loadoutSlotData: {
                              index: 13,
                              unknownData1: {
                                itemLineId: 0,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 0,
                            },
                          },
                          {
                            slotId: 14,
                            loadoutSlotData: {
                              index: 14,
                              unknownData1: {
                                itemLineId: 7,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 0,
                            },
                          },
                          {
                            slotId: 15,
                            loadoutSlotData: {
                              index: 15,
                              unknownData1: {
                                itemLineId: 0,
                                flags: 0,
                                attachments: [],
                                attachmentClasses: [],
                              },
                              tintItemId: 0,
                              itemSlot: 0,
                            },
                          },
                        ],
                      },
                      itemDefinitions: [
                        {
                          itemId: 80,
                          itemDefinitionData: {
                            itemId: 80,
                            flags: 3072,
                            nameId: 1297664,
                            descriptionId: 1298432,
                            unknownDword1: 256,
                            iconId: 722944,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 20480,
                            unknownDword5: 0,
                            itemSlot: 1792,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "Weapon_VS_LMG001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 20,
                            categoryId: 6,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 19,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 9,
                            clientItemType: 26,
                            skillSetId: 111,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 1800,
                            trialExclusionSec: 2592000,
                            clientUseRequirementId: 118,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 2400,
                          itemDefinitionData: {
                            itemId: 2400,
                            flags: 0,
                            nameId: 1338624,
                            descriptionId: 1342208,
                            unknownDword1: 256,
                            iconId: 135168,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 128512,
                            unknownDword5: 0,
                            itemSlot: 8704,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "WeaponAttachment_VS_Clip_LMG002.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 45081,
                          itemDefinitionData: {
                            itemId: 45081,
                            flags: 0,
                            nameId: 514560,
                            descriptionId: 340224,
                            unknownDword1: 256,
                            iconId: 119808,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 128000,
                            unknownDword5: 0,
                            itemSlot: 10240,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 46156,
                          itemDefinitionData: {
                            itemId: 46156,
                            flags: 0,
                            nameId: 9731328,
                            descriptionId: 0,
                            unknownDword1: 256,
                            iconId: 33792,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 127744,
                            unknownDword5: 0,
                            itemSlot: 9216,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_VS_IronSightFront_003.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 46348,
                          itemDefinitionData: {
                            itemId: 46348,
                            flags: 0,
                            nameId: 9731584,
                            descriptionId: 0,
                            unknownDword1: 256,
                            iconId: 33792,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 127744,
                            unknownDword5: 0,
                            itemSlot: 9472,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_VS_IronSightBack_003.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 21,
                          itemDefinitionData: {
                            itemId: 21,
                            flags: 3072,
                            nameId: 44032,
                            descriptionId: 50432,
                            unknownDword1: 256,
                            iconId: 44032,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 512,
                            unknownDword5: 0,
                            itemSlot: 1792,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "Weapon_VS_PistolBeamer001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 20,
                            categoryId: 3,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 11,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 11,
                            clientItemType: 26,
                            skillSetId: 102,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 1800,
                            trialExclusionSec: 2592000,
                            clientUseRequirementId: 118,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 2000,
                          itemDefinitionData: {
                            itemId: 2000,
                            flags: 0,
                            nameId: 1338624,
                            descriptionId: 1342208,
                            unknownDword1: 256,
                            iconId: 44032,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 128512,
                            unknownDword5: 0,
                            itemSlot: 8704,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_VS_Clip_PistolBeamer001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 46165,
                          itemDefinitionData: {
                            itemId: 46165,
                            flags: 0,
                            nameId: 9731328,
                            descriptionId: 0,
                            unknownDword1: 256,
                            iconId: 33792,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 127744,
                            unknownDword5: 0,
                            itemSlot: 9216,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_VS_IronSightFront_Pistol001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 46357,
                          itemDefinitionData: {
                            itemId: 46357,
                            flags: 0,
                            nameId: 9731584,
                            descriptionId: 0,
                            unknownDword1: 256,
                            iconId: 33792,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 127744,
                            unknownDword5: 0,
                            itemSlot: 9472,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_VS_IronSightBack_Pistol001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 1964,
                          itemDefinitionData: {
                            itemId: 1964,
                            flags: 1024,
                            nameId: 25611264,
                            descriptionId: 25617920,
                            unknownDword1: 256,
                            iconId: 3673088,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 1048320,
                            unknownDword5: 0,
                            itemSlot: 1792,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "Weapon_Common_RocketLauncher001_Auraxium.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 20,
                            categoryId: 13,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 15,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 6,
                            clientItemType: 26,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 1965,
                          itemDefinitionData: {
                            itemId: 1965,
                            flags: 0,
                            nameId: 1338624,
                            descriptionId: 1342208,
                            unknownDword1: 256,
                            iconId: 2560,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 128512,
                            unknownDword5: 0,
                            itemSlot: 8704,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_NC_Clip_RocketLauncherAmmo001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 1966,
                          itemDefinitionData: {
                            itemId: 1966,
                            flags: 0,
                            nameId: 1337344,
                            descriptionId: 1340928,
                            unknownDword1: 256,
                            iconId: 33792,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 127744,
                            unknownDword5: 0,
                            itemSlot: 9216,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_Common_IronSightFront_001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 1967,
                          itemDefinitionData: {
                            itemId: 1967,
                            flags: 0,
                            nameId: 1337600,
                            descriptionId: 1341184,
                            unknownDword1: 256,
                            iconId: 33792,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 127744,
                            unknownDword5: 0,
                            itemSlot: 9472,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "WeaponAttachment_Common_IronSightBack_001.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 21,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 27,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 19,
                          itemDefinitionData: {
                            itemId: 19,
                            flags: 0,
                            nameId: 43520,
                            descriptionId: 49920,
                            unknownDword1: 256,
                            iconId: 129536,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 256,
                            unknownDword5: 0,
                            itemSlot: 1792,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "Weapon_VS_Knife.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 20,
                            categoryId: 2,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 46,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 26,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 29,
                          itemDefinitionData: {
                            itemId: 29,
                            flags: 0,
                            nameId: 1477376,
                            descriptionId: 153600768,
                            unknownDword1: 256,
                            iconId: 566016,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 22528,
                            unknownDword5: 0,
                            itemSlot: 0,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 28,
                            categoryId: 103,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 122,
                            passiveAbilityId: 622,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 0,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 36,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 44705,
                          itemDefinitionData: {
                            itemId: 44705,
                            flags: 49408,
                            nameId: 11444480,
                            descriptionId: 11447040,
                            unknownDword1: 256,
                            iconId: 128256,
                            unknownDword2: 0,
                            hudImageSetId: 804864,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 12800,
                            itemClass: 3584,
                            unknownDword5: 0,
                            itemSlot: 3328,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "Weapon_VS_HandGrenade001_Held.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 20,
                            categoryId: 17,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 4,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 6211,
                            equipCountMax: 1,
                            currencyType: 4,
                            unknownDword17: 0,
                            clientItemType: 26,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 76429,
                          itemDefinitionData: {
                            itemId: 76429,
                            flags: 2048,
                            nameId: 2045952,
                            descriptionId: 2047488,
                            unknownDword1: 0,
                            iconId: 2376960,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 44032,
                            unknownDword5: 0,
                            itemSlot: 256,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName: "Helmet_VS_<gender>_All_PS011.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 30,
                            categoryId: 103,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 88,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 39,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 118,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                        {
                          itemId: 7,
                          itemDefinitionData: {
                            itemId: 7,
                            flags: 1024,
                            nameId: 14318848,
                            descriptionId: 13697792,
                            unknownDword1: 256,
                            iconId: 401408,
                            unknownDword2: 0,
                            hudImageSetId: 0,
                            unknownDword3: 0,
                            unknownDword4: 0,
                            cost: 0,
                            itemClass: 2560,
                            unknownDword5: 0,
                            itemSlot: 1792,
                            slotOverrideKey: 0,
                            unknownDword6: 0,
                            modelName:
                              "Weapon_Common_SpawnBeacon_NoCollision.adr",
                            unknownString1: "",
                            unknownByte1: 0,
                            itemType: 20,
                            categoryId: 0,
                            unknownDword7: 0,
                            unknownDword8: 0,
                            unknownDword9: 0,
                            unknownDword10: 1,
                            unknownDword11: 0,
                            activatableAbilityId: 0,
                            passiveAbilityId: 0,
                            unknownDword12: 0,
                            maxStackSize: 1,
                            tintName: "",
                            unknownDword13: 0,
                            unknownDword14: 0,
                            unknownDword15: 0,
                            unknownDword16: 0,
                            uiModelCamera: 429,
                            equipCountMax: 0,
                            currencyType: 0,
                            unknownDword17: 0,
                            clientItemType: 26,
                            skillSetId: 0,
                            overlayTexture: "",
                            decalSlot: "",
                            unknownDword18: 0,
                            trialDurationSec: 0,
                            trialExclusionSec: 0,
                            clientUseRequirementId: 0,
                            overrideAppearance: "",
                            unknownDword19: 0,
                            clientUseRequirementId2: 119,
                          },
                        },
                      ],
                      attachmentDefinitions: [
                        {
                          attachmentId: 2400,
                          attachmentData: {
                            attachmentId: 2400,
                            groupId: 25,
                            itemLineId: 21199,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [1],
                          },
                        },
                        {
                          attachmentId: 45081,
                          attachmentData: {
                            attachmentId: 45081,
                            groupId: 25,
                            itemLineId: 21299,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [5],
                          },
                        },
                        {
                          attachmentId: 46156,
                          attachmentData: {
                            attachmentId: 46156,
                            groupId: 25,
                            itemLineId: 20811,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [3],
                          },
                        },
                        {
                          attachmentId: 46348,
                          attachmentData: {
                            attachmentId: 46348,
                            groupId: 25,
                            itemLineId: 21003,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [2],
                          },
                        },
                        {
                          attachmentId: 2000,
                          attachmentData: {
                            attachmentId: 2000,
                            groupId: 21,
                            itemLineId: 21188,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [1],
                          },
                        },
                        {
                          attachmentId: 46165,
                          attachmentData: {
                            attachmentId: 46165,
                            groupId: 21,
                            itemLineId: 20820,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [3],
                          },
                        },
                        {
                          attachmentId: 46357,
                          attachmentData: {
                            attachmentId: 46357,
                            groupId: 21,
                            itemLineId: 21012,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [2],
                          },
                        },
                        {
                          attachmentId: 48090,
                          attachmentData: {
                            attachmentId: 48090,
                            groupId: 1237,
                            itemLineId: 1122,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [1],
                          },
                        },
                        {
                          attachmentId: 48091,
                          attachmentData: {
                            attachmentId: 48091,
                            groupId: 1237,
                            itemLineId: 1123,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [2],
                          },
                        },
                        {
                          attachmentId: 48092,
                          attachmentData: {
                            attachmentId: 48092,
                            groupId: 1237,
                            itemLineId: 1124,
                            flags: {
                              bit0: false,
                              bit1: false,
                              bit2: false,
                              bit3: false,
                              bit4: false,
                              bit5: false,
                              bit6: false,
                              required: true,
                            },
                            classes: [3],
                          },
                        },
                      ],
                      lastUseDate: "0x0000000053da0a5b",
                    },
                  },
                ],
              };
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
              } else {
                characters_Login_info = {
                  characterId: "0x03147cca2a860191",
                  serverId: 1,
                  unknown: 0,
                  status: 1,
                  payload: {
                    serverAddress: "127.0.0.1:1117",
                    serverTicket: "7y3Bh44sKWZCYZH",
                    encryptionKey: [
                      23,
                      189,
                      8,
                      107,
                      27,
                      148,
                      240,
                      47,
                      240,
                      236,
                      83,
                      215,
                      99,
                      88,
                      155,
                      95,
                    ],
                    characterId: "0x03147cca2a860191",
                    unknown1: 722776196,
                    unknown2: 0,
                    stationName: "reside0cupboy",
                    characterName: "VanuLabsVS",
                    unknown3: 0,
                  },
                };
              }
              var data: Buffer = this._protocol.pack(
                "CharacterLoginReply",
                characters_Login_info
              );
              this._soeServer.sendAppData(client, data, true);
              debug("CharacterLoginRequest");
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
    process.exit(1);
  }
}
