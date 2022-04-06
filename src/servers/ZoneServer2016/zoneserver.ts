// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const debugName = "ZoneServer",
  debug = require("debug")(debugName);

import { EventEmitter } from "events";
import { GatewayServer } from "../GatewayServer/gatewayserver";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import SOEClient from "../SoeServer/soeclient";
import { H1emuZoneServer } from "../H1emuServer/h1emuZoneServer";
import { H1emuClient } from "../H1emuServer/shared/h1emuclient";
import { Resolver } from "dns";

import { promisify } from "util";
import { zonePacketHandlers } from "./zonepackethandlers";
import { ZoneClient2016 as Client } from "./classes/zoneclient";
import { Vehicle2016 as Vehicle } from "./classes/vehicle";
import { WorldObjectManager } from "./classes/worldobjectmanager";

import {
  characterEquipment,
  inventoryItem,
  loadoutContainer,
  loadoutItem,
  Weather2016,
} from "../../types/zoneserver";
import { h1z1PacketsType } from "../../types/packets";
import { Character2016 as Character } from "./classes/character";
import {
  _,
  generateRandomGuid,
  getAppDataFolderPath,
  initMongo,
  Int64String,
  isPosInRadius,
  getDistance,
  randomIntFromInterval,
  Scheduler,
} from "../../utils/utils";
import { MAX_TRANSIENT_ID } from "../../utils/constants";

import { Db, MongoClient } from "mongodb";
import dynamicWeather from "./workers/dynamicWeather";

// need to get 2016 lists
const spawnLocations = require("../../../data/2016/zoneData/Z1_spawnLocations.json"),
  recipes = require("../../../data/2016/sampleData/recipes.json"),
  deprecatedDoors = require("../../../data/2016/sampleData/deprecatedDoors.json"),
  localWeatherTemplates = require("../../../data/2016/dataSources/weather.json"),
  stats = require("../../../data/2016/sampleData/stats.json"),
  resources = require("../../../data/2016/dataSources/resourceDefinitions.json"),
  itemDefinitions = require("./../../../data/2016/dataSources/ServerItemDefinitions.json"),
  containerDefinitions = require("./../../../data/2016/dataSources/ContainerDefinitions.json"),
  loadoutSlotItemClasses = require("./../../../data/2016/dataSources/LoadoutSlotItemClasses.json"),
  equipSlotItemClasses = require("./../../../data/2016/dataSources/EquipSlotItemClasses.json"),
  Z1_POIs = require("../../../data/2016/zoneData/Z1_POIs");

export class ZoneServer2016 extends EventEmitter {
  _gatewayServer: GatewayServer;
  _protocol: H1Z1Protocol;
  _db?: Db;
  _soloMode = false;
  _mongoClient?: MongoClient;
  _mongoAddress: string;
  _clients: { [characterId: string]: Client } = {};
  _characters: { [characterId: string]: Character } = {};
  _clientProtocol = "ClientProtocol_1080";
  _dynamicWeatherWorker: any;
  _dynamicWeatherEnabled = true;
  _defaultWeatherTemplate = "z1br";
  _spawnLocations = spawnLocations;
  _h1emuZoneServer!: H1emuZoneServer;
  _appDataFolder = getAppDataFolderPath();
  _worldId = 0;
  _npcs: any;
  _objects: any;
  _doors: any;
  _props: any;
  _gameTime: any;
  _time = Date.now();
  _serverTime = this.getCurrentTime();
  _startTime = 0;
  _startGameTime = 0;
  _timeMultiplier = 72;
  _cycleSpeed = 100;
  _frozeCycle = false;
  tickRate = 3000;

  _transientIds: any;
  _loginServerInfo: { address?: string; port: number } = {
    address: process.env.LOGINSERVER_IP,
    port: 1110,
  };
  worldRoutineTimer: any;
  _npcRenderDistance = 350;
  _allowedCommands: string[] = [];
  _interactionDistance = 4;
  _pingTimeoutTime = 120000;


  _weather2016: Weather2016;
  //@ts-ignore
  _packetHandlers: zonePacketHandlers;
  _weatherTemplates: any;
  _vehicles: { [characterId: string]: Vehicle } = {};
  _reloadPacketsInterval: any;
  
  worldObjectManager: WorldObjectManager;
  _ready: boolean = false;
  _itemDefinitions: { [itemDefinitionId: number]: any } = itemDefinitions;
  _itemDefinitionIds: any[] = Object.keys(this._itemDefinitions);
  itemDefinitionsCache: any;
  _containerDefinitions: { [containerDefinitionId: number]: any } =
    containerDefinitions;
  _containerDefinitionIds: any[] = Object.keys(this._containerDefinitions);
  _respawnLocations: any;
  _speedTrees: any;
  _recipes: { [recipeId: number]: any } = recipes;
  _explosives: any;
  _temporaryObjects: any;
  _traps: any;
  lastItemGuid: bigint = 0x3000000000000000n;

  constructor(
    serverPort: number,
    gatewayKey: Uint8Array,
    mongoAddress = "",
    worldId?: number,
    internalServerPort?: number
  ) {
    super();
    this._gatewayServer = new GatewayServer(
      "ExternalGatewayApi_3",
      serverPort,
      gatewayKey
    );
    this._transientIds = {};
    this._packetHandlers = new zonePacketHandlers();
    this._mongoAddress = mongoAddress;
    this._worldId = worldId || 0;
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this._weatherTemplates = localWeatherTemplates;
    this._weather2016 = this._weatherTemplates[this._defaultWeatherTemplate];
    this._speedTrees = {};
    this._explosives = {};
    this._temporaryObjects = {};
    this._traps = {};
    this._npcs = {};
    this._objects = {};
    this._doors = {};
    this._vehicles = {};
    this._props = {};
    this._respawnLocations = spawnLocations.map((spawn: any) => {
      return {
        guid: this.generateGuid(),
        respawnType: 4,
        position: spawn.position,
        unknownDword1: 1,
        unknownDword2: 1,
        iconId1: 1,
        iconId2: 1,
        respawnTotalTime: 10,
        respawnTimeMs: 10000,
        nameId: 1,
        distance: 1000,
        unknownByte1: 1,
        unknownByte2: 1,
        unknownData1: {
          unknownByte1: 1,
          unknownByte2: 1,
          unknownByte3: 1,
          unknownByte4: 1,
          unknownByte5: 1,
        },
        unknownDword4: 1,
        unknownByte3: 1,
        unknownByte4: 1,
      };
    });
    this.worldObjectManager = new WorldObjectManager();
    if (!this._mongoAddress) {
      this._soloMode = true;
      debug("Server in solo mode !");
    }
    this.on("data", this.onZoneDataEvent);

    this.on("login", (err, client) => {
      this.onZoneLoginEvent(err, client);
    });

    this._gatewayServer._soeServer.on(
      "PacketLimitationReached",
      (soeClient: SOEClient) => {
        const client = this._clients[soeClient.sessionId];
        this.sendChatText(
          client,
          "You've almost reached the packet limitation for the server."
        );
        this.sendChatText(
          client,
          "We will disconnect you in 60 seconds ( You can also do it yourself )"
        );
        this.sendChatText(client, "Sorry for that.");
        setTimeout(() => {
          this.sendData(client, "CharacterSelectSessionResponse", {
            status: 1,
            sessionId: client.loginSessionId,
          });
        }, 60000);
      }
    );
    this._gatewayServer._soeServer.on("fatalError", (soeClient: SOEClient) => {
      const client = this._clients[soeClient.sessionId];
      this.deleteClient(client);
      // TODO: force crash the client
    });
    this._gatewayServer.on(
      "login",
      (
        err: string,
        client: SOEClient,
        characterId: string,
        loginSessionId: string,
        clientProtocol: string
      ) => {
        if (clientProtocol !== this._clientProtocol) {
          debug(`${client.address} is using the wrong client protocol`);
          this.sendData(client as any, "LoginFailed", {});
          return;
        }
        debug(
          `Client logged in from ${client.address}:${client.port} with character id: ${characterId}`
        );
        const generatedTransient = this.getTransientId(characterId);
        const zoneClient = this.createClient(
          client.sessionId,
          client.soeClientId,
          loginSessionId,
          characterId,
          generatedTransient
        );
        this._clients[client.sessionId] = zoneClient;
    
        this._transientIds[generatedTransient] = characterId;
        this._characters[characterId] = zoneClient.character;
        zoneClient.pingTimer = setTimeout(() => {
          this.timeoutClient(zoneClient);
        }, this._pingTimeoutTime);
        this.emit("login", err, zoneClient);
      }
    );
    this._gatewayServer.on("disconnect", (err: string, client: Client) => {
      this.deleteClient(client);
    });

    this._gatewayServer.on("session", (err: string, client: SOEClient) => {
      debug(`Session started for client ${client.address}:${client.port}`);
    });

    this._gatewayServer.on(
      "tunneldata",
      (err: string, client: Client, data: Buffer, flags: number) => {
        const packet = this._protocol.parse(data, flags, true);
        if (packet) {
          this.emit("data", null, this._clients[client.sessionId], packet);
        } else {
          debug("zonefailed : ", data);
        }
      }
    );

    if (!this._soloMode) {
      this._h1emuZoneServer = new H1emuZoneServer(internalServerPort); // opens local socket to connect to loginserver

      this._h1emuZoneServer.on(
        "session",
        (err: string, client: H1emuClient, status: number) => {
          if (err) {
            console.error(err);
          } else {
            debug(`LoginConnection established`);
          }
        }
      );

      this._h1emuZoneServer.on(
        "sessionfailed",
        (err: string, client: H1emuClient, status: number) => {
          console.error("h1emuServer sessionfailed");
          process.exit(1);
        }
      );

      this._h1emuZoneServer.on(
        "disconnect",
        (err: string, client: H1emuClient, reason: number) => {
          debug(
            `LoginConnection dropped: ${
              reason ? "Connection Lost" : "Unknown Error"
            }`
          );
        }
      );

      this._h1emuZoneServer.on(
        "data",
        async (err: string, client: H1emuClient, packet: any) => {
          if (err) {
            console.error(err);
          } else {
            switch (packet.name) {
              case "CharacterCreateRequest": {
                this.onCharacterCreateRequest(client, packet);
                break;
              }
              case "CharacterExistRequest": {
                const { characterId, reqId } = packet.data;
                try {
                  const collection = (this._db as Db).collection("characters");
                  const charactersArray = await collection
                    .find({ characterId: characterId })
                    .toArray();
                  if (charactersArray.length) {
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterExistReply",
                      { status: 1, reqId: reqId }
                    );
                  } else {
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterExistReply",
                      { status: 0, reqId: reqId }
                    );
                  }
                } catch (error) {
                  this._h1emuZoneServer.sendData(
                    client,
                    "CharacterExistReply",
                    { status: 0, reqId: reqId }
                  );
                }
                break;
              }
              case "CharacterDeleteRequest": {
                const { characterId, reqId } = packet.data;
                try {
                  const collection = (this._db as Db).collection("characters");
                  const charactersArray = await collection
                    .find({ characterId: characterId })
                    .toArray();
                  if (charactersArray.length === 1) {
                    await collection.updateOne(
                      { characterId: characterId },
                      {
                        $set: {
                          status: 0,
                        },
                      }
                    );
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterDeleteReply",
                      { status: 1, reqId: reqId }
                    );
                  } else {
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterDeleteReply",
                      { status: 1, reqId: reqId }
                    );
                  }
                } catch (error) {
                  this._h1emuZoneServer.sendData(
                    client,
                    "CharacterDeleteReply",
                    { status: 0, reqId: reqId }
                  );
                }
                break;
              }
              default:
                debug(`Unhandled h1emu packet: ${packet.name}`);
                break;
            }
          }
        }
      );
    }
  }

  onZoneLoginEvent(err: any, client: Client) {
    if (err) {
    console.error(err);
    } else {
      debug("zone login");
      try {
        this.sendInitData(client);
      } catch (error) {
        debug(error);
        this.sendData(client, "LoginFailed", {});
      }
    }
  };

  onZoneDataEvent(err: any, client: Client, packet: any) {
    if (err) {
      console.error(err);
    } else {
      client.pingTimer?.refresh();
      if (
        packet.name != "KeepAlive" &&
        packet.name != "PlayerUpdateUpdatePositionClientToZone" &&
        packet.name != "PlayerUpdateManagedPosition" &&
        packet.name != "ClientUpdate.MonitorTimeDrift"
      ) {
        debug(`Receive Data ${[packet.name]}`);
      }
      try {
        this._packetHandlers.processPacket(this, client, packet);
      } catch (error) {
        console.error(error);
        console.error(`An error occurred while processing a packet : `, packet);
      }
    }
  };
  
  async onCharacterCreateRequest(client: any, packet: any) {
    function getCharacterModelData(payload: any): any {
      switch (payload.headType) {
        case 6: // black female
          return {
            modelId: 9474,
            headActor: "SurvivorFemale_Head_03.adr",
            hairModel: "SurvivorFemale_Hair_ShortMessy.adr",
          };
        case 5: // black male
          return {
            modelId: 9240,
            headActor: "SurvivorMale_Head_04.adr",
            hairModel: "SurvivorMale_HatHair_Short.adr",
          };
        case 4: // older white female
          return {
            modelId: 9474,
            headActor: "SurvivorFemale_Head_02.adr",
            hairModel: "SurvivorFemale_Hair_ShortBun.adr",
          };
        case 3: // young white female
          return {
            modelId: 9474,
            headActor: "SurvivorFemale_Head_02.adr",
            hairModel: "SurvivorFemale_Hair_ShortBun.adr",
          };
        case 2: // bald white male
          return {
            modelId: 9240,
            headActor: "SurvivorMale_Head_01.adr",
            hairModel: "SurvivorMale_HatHair_Short.adr",
          };
        case 1: // white male
        default:
          return {
            modelId: 9240,
            headActor: "SurvivorMale_Head_01.adr",
            hairModel: "SurvivorMale_Hair_ShortMessy.adr",
          };
      }
    }

    const { characterObjStringify, reqId } = packet.data;
    try {
      const characterData = JSON.parse(characterObjStringify),
        characterModelData = getCharacterModelData(characterData.payload);
      let character = require("../../../data/2016/sampleData/character.json");
      character = {
        ...character,
        characterId: characterData.characterId,
        serverId: characterData.serverId,
        ownerId: characterData.ownerId,
        gender: characterData.payload.gender,
        characterName: characterData.payload.characterName,
        actorModelId: characterModelData.modelId,
        headActor: characterModelData.headActor,
        hairModel: characterModelData.hairModel,
      };
      const collection = (this._db as Db).collection("characters");
      const charactersArray = await collection.findOne({
        characterId: character.characterId,
      });
      if (!charactersArray) {
        await collection.insertOne(character);
      }
      this._h1emuZoneServer.sendData(client, "CharacterCreateReply", {
        reqId: reqId,
        status: 1,
      });
    } catch (error) {
      this._h1emuZoneServer.sendData(client, "CharacterCreateReply", {
        reqId: reqId,
        status: 0,
      });
    }
  }

  async loadCharacterData(client: Client) {
    let character: any;
    if (!this._soloMode) {
      character = await this._db
        ?.collection("characters")
        .findOne({ characterId: client.character.characterId });
      client.character.name = character.characterName;
    } else {
      delete require.cache[
        require.resolve(
          `${this._appDataFolder}/single_player_characters2016.json`
        )
      ];
      const SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters2016.json`);
      character = SinglePlayerCharacters.find(
        (character: any) =>
          character.characterId === client.character.characterId
      );
      client.character.name = character.characterName;
    }

    client.character.guid = "0x665a2bff2b44c034" // default, only matters for multiplayer
    client.character.actorModelId = character.actorModelId;
    client.character.headActor = character.headActor;
    client.character.isRespawning = character.isRespawning;
    client.character.gender = character.gender;
    client.character.creationDate = character.creationDate;
    client.character.lastLoginDate = character.lastLoginDate;
    client.character.hairModel = character.hairModel || "";

    let isRandomlySpawning = false;
    if (
      _.isEqual(character.position, [0, 0, 0, 1]) &&
      _.isEqual(character.rotation, [0, 0, 0, 1])
    ) {
      // if position/rotation hasn't changed
      isRandomlySpawning = true;
    }

    if (isRandomlySpawning) {
      // Take position/rotation from a random spawn location.
      const randomSpawnIndex = Math.floor(
        Math.random() * this._spawnLocations.length
      );
      client.character.state.position =
        this._spawnLocations[randomSpawnIndex].position;
      client.character.state.rotation =
        this._spawnLocations[randomSpawnIndex].rotation;
      client.character.spawnLocation =
        this._spawnLocations[randomSpawnIndex].name;
    } else {
      client.character.state.position = character.position;
      client.character.state.rotation = character.rotation;
    }
    this.giveStartingEquipment(client, false, true);
  }

  async sendCharacterData(client: Client) {
    await this.loadCharacterData(client);
    const containers = this.initializeContainerList(client, false);
    this.sendData(client, "SendSelfToClient", {
      data: {
        guid: client.character.guid, // todo: guid should be moved to client, instead of character
        characterId: client.character.characterId,
        transientId: client.character.transientId,
        actorModelId: client.character.actorModelId,
        headActor: client.character.headActor,
        hairModel: client.character.hairModel,
        isRespawning: client.character.isRespawning,
        gender: client.character.gender,
        creationDate: client.character.creationDate,
        lastLoginDate: client.character.lastLoginDate,
        position: client.character.state.position,
        rotation: client.character.state.rotation,
        identity: {
          characterName: client.character.name,
        },
        inventory: {
          items: Object.values(client.character._loadout).filter((slot) => {
            if(slot.itemDefinitionId) {
              return true;
            }
          }).map((slot) => {
            return {
              itemDefinitionId: slot.itemDefinitionId,
              tintId: 0,
              guid: slot.itemGuid,
              count: 1, // also ammoCount
              itemSubData: {
                hasSubData: false,
              },
              containerGuid: slot.containerGuid,
              containerDefinitionId: 101, // loadout containerDefinitionId
              containerSlotId: slot.slotId,
              baseDurability: 2000,
              currentDurability: slot.currentDurability,
              maxDurabilityFromDefinition: 2000,
              unknownBoolean1: true,
              unknownQword3: client.character.characterId,
              unknownDword9: 1,
              unknownBoolean2: false,
            }
          }),
        },
        recipes: Object.values(this._recipes),
        stats: stats,
        loadoutSlots: {
          loadoutId: 3,
          loadoutData: {
            loadoutSlots: Object.keys(client.character._loadout).map(
              (slotId: any) => {
                const slot = client.character._loadout[slotId];
                return {
                  hotbarSlotId: slot.slotId,
                  loadoutId: 3,
                  slotId: slot.slotId,
                  loadoutItemData: {
                    itemDefinitionId: slot.itemDefinitionId,
                    loadoutItemGuid: slot.itemGuid,
                    unknownByte1: 255, // flags?
                  },
                  unknownDword4: slot.slotId,
                };
              }
            ),
          },
          currentSlotId: client.character.currentLoadoutSlot,
        },
        characterResources: [
          {
            ...resources.health,
            resourceData: {
              ...resources.health.resourceData,
              value: client.character.resources.health,
            },
          },
          {
            ...resources.stamina,
            resourceData: {
              ...resources.stamina.resourceData,
              value: client.character.resources.stamina,
            },
          },
          {
            ...resources.food,
            resourceData: {
              ...resources.food.resourceData,
              value: client.character.resources.food,
            },
          },
          {
            ...resources.water,
            resourceData: {
              ...resources.water.resourceData,
              value: client.character.resources.water,
            },
          },
          {
            ...resources.comfort,
            resourceData: {
              ...resources.comfort.resourceData,
              value: client.character.resources.comfort,
            },
          },
          {
            ...resources.virus,
            resourceData: {
              ...resources.virus.resourceData,
              value: client.character.resources.virus,
            },
          },
        ],
        containers: containers,
        //unknownQword1: client.character.characterId,
        //unknownDword38: 1,
        //vehicleLoadoutRelatedQword: client.character.characterId,
        //unknownQword3: client.character.characterId,
        //vehicleLoadoutRelatedDword: 1,
        //unknownDword40: 1
      },
    });

    if (!this.itemDefinitionsCache) {
      this.packItemDefinitions();
    }
    this.sendRawData(client, this.itemDefinitionsCache);

    this.sendData(client, "Container.InitEquippedContainers", {
      ignore: client.character.characterId,
      characterId: client.character.characterId,
      containers: containers,
    });
    this._characters[client.character.characterId] = client.character; // character will spawn on other player's screen(s) at this point
  }

  async fetchZoneData(): Promise<void> {
    if (this._mongoAddress) {
      const mongoClient = (this._mongoClient = new MongoClient(
        this._mongoAddress,
        { maxPoolSize: 50 }
      ));
      try {
        await mongoClient.connect();
      } catch (e) {
        throw debug(
          "[ERROR]Unable to connect to mongo server " + this._mongoAddress
        );
      }
      debug("connected to mongo !");
      // if no collections exist on h1server database , fill it with samples
      (await mongoClient.db("h1server").collections()).length ||
        (await initMongo(mongoClient, debugName));
      this._db = mongoClient.db("h1server");
    }
  }

  addDoor(obj: {}, characterId: string) {
    this._doors[characterId] = obj;
  }

  async loadVehicleData() {
    const vehiclesArray: any = await this._db
      ?.collection("vehicles")
      .find({ worldId: this._worldId })
      .toArray();
    for (let index = 0; index < vehiclesArray.length; index++) {
      const vehicle = vehiclesArray[index];
      this._vehicles[vehicle.characterId] = new Vehicle(
        this._worldId || 0,
        vehicle.characterId,
        vehicle.transientId,
        vehicle.actorModelId,
        new Float32Array(vehicle.state.position),
        new Float32Array(vehicle.state.rotation),
        this._gameTime
      );
      // TODO: update mongo with new schema
      this._vehicles[vehicle.characterId] = {
        ...this._vehicles[vehicle.characterId],
        ...vehicle.npcData,
        actorModelId: vehicle.npcData.modelId
      }
      this._vehicles[vehicle.characterId].state = {
        ...this._vehicles[vehicle.characterId].state,
        position: vehicle.npcData.position,
        rotation: vehicle.npcData.rotation,
      }
      this._vehicles[vehicle.characterId].positionUpdate =
        vehicle.positionUpdate;
    }
  }

  async fetchWorldData(): Promise<void> {
    if (!this._soloMode) {
      this._doors = {};
      const doorArray: any = await this._db
        ?.collection("doors")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < doorArray.length; index++) {
        const door = doorArray[index];
        this._doors[door.characterId] = door;
      }
      /*
      this._props = {};
      const propsArray: any = await this._db
        ?.collection("props")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < propsArray.length; index++) {
        const prop = propsArray[index];
        this._props[prop.characterId] = prop;
      }
      */

      await this.loadVehicleData();

      this._npcs = {};
      const npcsArray: any = await this._db
        ?.collection("npcs")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < npcsArray.length; index++) {
        const npc = npcsArray[index];
        this._npcs[npc.characterId] = npc;
      }
      this._objects = {};
      const objectsArray: any = await this._db
        ?.collection("objects")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < objectsArray.length; index++) {
        const object = objectsArray[index];
        this._objects[object.characterId] = object;
      }
      this._transientIds = this.getAllCurrentUsedTransientId();
      debug("World fetched!");
    }
  }

  async saveWorld(): Promise<void> {
    if (!this._soloMode) {
      if (this._worldId) {
        await this._db
          ?.collection(`npcs`)
          .insertMany(Object.values(this._npcs));
        await this._db
          ?.collection(`doors`)
          .insertMany(Object.values(this._doors));
        /*
        await this._db
          ?.collection(`props`)
          .insertMany(Object.values(this._props));
        */
        await this._db
          ?.collection(`vehicles`)
          .insertMany(Object.values(this._vehicles));
        await this._db
          ?.collection(`objects`)
          .insertMany(Object.values(this._objects));
      } else {
        const numberOfWorld: number =
          (await this._db?.collection("worlds").find({}).count()) || 0;
        this._worldId = numberOfWorld + 1;
        await this._db?.collection("worlds").insertOne({
          worldId: this._worldId,
        });
        await this._db
          ?.collection(`npcs`)
          .insertMany(Object.values(this._npcs));
        /*
        await this._db
          ?.collection(`doors`)
          .insertMany(Object.values(this._doors));
          */
        /*
        await this._db
          ?.collection(`props`)
          .insertMany(Object.values(this._props));
        */
        await this._db
          ?.collection(`vehicles`)
          .insertMany(Object.values(this._vehicles));
        await this._db
          ?.collection(`objects`)
          .insertMany(Object.values(this._objects));
        debug("World saved!");
      }
    }
  }

  packItemDefinitions() {
    this.itemDefinitionsCache = this._protocol.pack("Command.ItemDefinitions", {
      // cache itemDefinitions so server doesn't have to spend time packing for each
      // character login
      data: {
        itemDefinitions: this._itemDefinitionIds.map((itemDefId: any) => {
          const itemDef = this.getItemDefinition(itemDefId);
          return {
            ID: itemDefId,
            definitionData: {
              ...itemDef,
              HUD_IMAGE_SET_ID: itemDef.IMAGE_SET_ID,
              containerDefinitionId:
                itemDef.ITEM_TYPE == 34 ? itemDef.PARAM1 : 0,
              flags1: {
                ...itemDef,
              },
              flags2: {
                ...itemDef,
              },
              stats: [],
            },
          };
        }),
      },
    });
  }

  async setupServer(): Promise<void> {
    this.forceTime(971172000000); // force day time by default - not working for now
    this._frozeCycle = false;
    await this.fetchZoneData();
    //this._profiles = this.generateProfiles();
    if (
      await this._db?.collection("worlds").findOne({ worldId: this._worldId })
    ) {
      await this.fetchWorldData();
    } else {
      await this._db
        ?.collection(`worlds`)
        .insertOne({ worldId: this._worldId });
      await this.saveWorld();
    }

    this.packItemDefinitions();

    // other entities are handled by worldRoutine
    this.worldObjectManager.createDoors(this);

    if (!this._soloMode) {
      debug("Starting H1emuZoneServer");
      if (!this._loginServerInfo.address) {
        await this.fetchLoginInfo();
      }
      this._h1emuZoneServer.setLoginInfo(this._loginServerInfo, {
        serverId: this._worldId,
      });
      this._h1emuZoneServer.start();
      await this._db
        ?.collection("servers")
        .findOneAndUpdate(
          { serverId: this._worldId },
          { $set: { populationNumber: 0, populationLevel: 0 } }
        );
    }
    this._ready = true;
    debug("Server ready");
  }

  async start(): Promise<void> {
    debug("Starting server");
    debug(`Protocol used : ${this._protocol.protocolName}`);

    await this.setupServer();
    this._startTime += Date.now();
    this._startGameTime += Date.now();
    if (this._dynamicWeatherEnabled) {
      this._dynamicWeatherWorker = setTimeout(() => {
        if (!this._dynamicWeatherEnabled) {
          return;
        }
        const rnd_weather = dynamicWeather(
          this._serverTime,
          this._startTime,
          this._timeMultiplier
        );
        this._weather2016 = rnd_weather;
        this.sendDataToAll("UpdateWeatherData", rnd_weather);
        this._dynamicWeatherWorker.refresh();
      }, 360000 / this._timeMultiplier);
    }
    this._gatewayServer.start();
    this.worldRoutineTimer = setTimeout(
      () => this.worldRoutine.bind(this)(true),
      this.tickRate
    );
  }

  sendInitData(client: Client): void {
    this.sendData(client, "InitializationParameters", {
      environment: "LIVE",
      serverId: this._worldId,
    });

    this.sendData(client, "SendZoneDetails", {
      zoneName: "Z1",
      unknownBoolean1: true,
      zoneType: 4,
      skyData: this._weather2016,
      zoneId1: 3905829720,
      zoneId2: 3905829720,
      nameId: 7699,
      unknownBoolean7: true,
    });

    this.sendData(client, "ClientUpdate.ZonePopulation", {
      populations: [0, 0],
    });
    this.sendData(client, "ClientUpdate.RespawnLocations", {
      locations: this._respawnLocations,
      locations2: this._respawnLocations,
    });

    this.sendData(client, "ClientGameSettings", {
      Unknown2: 0,
      interactGlowAndDist: 3,
      unknownBoolean1: false,
      timescale: 1.0,
      Unknown4: 0,
      Unknown: 0,
      unknownFloat1: 0.0,
      unknownFloat2: 0.0,
      velDamageMulti: 1.0,
    });

    this.sendCharacterData(client);

    this.sendData(client, "Character.SetBattleRank", {
      characterId: client.character.characterId,
      battleRank: 100,
    });
  }

  worldRoutine(refresh = false): void {
    debug("WORLDROUTINE");
    this.executeFuncForAllReadyClients((client: Client) => {
      this.vehicleManager(client);
      this.removeOutOfDistanceEntities(client);
      this.spawnCharacters(client);
      this.spawnObjects(client);
      this.spawnDoors(client);
      this.spawnNpcs(client);
      this.spawnExplosives(client);
      this.spawnTraps(client);
      this.spawnTemporaryObjects(client);
      this.POIManager(client);
      client.posAtLastRoutine = client.character.state.position;
    });
    if (this._ready) this.worldObjectManager.run(this);
    if (refresh) this.worldRoutineTimer.refresh();
  }
  deleteClient(client: Client) {
    if (client) {
      if (client.character) {
        this.deleteEntity(client.character.characterId, this._characters);
        clearTimeout(client.character?.resourcesUpdater);
        this.saveCharacterPosition(client);
        client.managedObjects?.forEach((characterId: any) => {
          this.dropVehicleManager(client, characterId);
        });
      }
      delete this._clients[client.sessionId];
      this._gatewayServer._soeServer.deleteClient(
        this.getSoeClient(client.soeClientId)
      );
      if (!this._soloMode) {
        this.sendZonePopulationUpdate();
      }
    }
  }

  killCharacter(client: Client) {
    const character = client.character;
    if (character.isAlive) {
      debug(character.name + " has died");
      client.character.isRunning = false;
      client.character.characterStates.knockedOut = true;
      this.updateCharacterState(
        client,
        client.character.characterId,
        client.character.characterStates,
        false
      );
      this.sendDataToAllWithSpawnedCharacter(
        client,
        "Character.StartMultiStateDeath",
        {
          characterId: client.character.characterId,
        }
      );
    }
    this.clearMovementModifiers(client);
    character.isAlive = false;
  }

  async explosionDamage(position: Float32Array, npcTriggered: string) {
    for (const character in this._clients) {
      const characterObj = this._clients[character];
      if (!characterObj.character.godMode) {
        if (isPosInRadius(8, characterObj.character.state.position, position)) {
          const distance = getDistance(
            position,
            characterObj.character.state.position
          );
          const damage = 50000 / distance;
          this.playerDamage(this._clients[character], damage);
        }
      }
    }
    for (const vehicleKey in this._vehicles) {
      const vehicle = this._vehicles[vehicleKey];
      if (vehicle.characterId != npcTriggered) {
        if (isPosInRadius(5, vehicle.state.position, position)) {
          const distance = getDistance(position, vehicle.state.position);
          const damage = 250000 / distance;
          await Scheduler.wait(150);
          this.damageVehicle(damage, vehicle);
        }
      }
    }
    for (const explosive in this._explosives) {
      const explosiveObj = this._explosives[explosive];
      if (explosiveObj.characterId != npcTriggered) {
        if (getDistance(position, explosiveObj.position) < 2) {
          await Scheduler.wait(150);
          this.explodeExplosive(explosiveObj);
        }
      }
    }
  }

  damageVehicle(damage: number, vehicle: Vehicle, loopDamageMs = 0) {
    if (!vehicle.isInvulnerable) {
      let destroyedVehicleEffect: number;
      let minorDamageEffect: number;
      let majorDamageEffect: number;
      let criticalDamageEffect: number;
      let supercriticalDamageEffect: number;
      let destroyedVehicleModel: number;
      switch (vehicle.vehicleId) {
        case 1: //offroader
          destroyedVehicleEffect = 135;
          destroyedVehicleModel = 7226;
          minorDamageEffect = 182;
          majorDamageEffect = 181;
          criticalDamageEffect = 180;
          supercriticalDamageEffect = 5227;
          break;
        case 2: // pickup
          destroyedVehicleEffect = 326;
          destroyedVehicleModel = 9315;
          minorDamageEffect = 325;
          majorDamageEffect = 324;
          criticalDamageEffect = 323;
          supercriticalDamageEffect = 5228;
          break;
        case 3: // police car
          destroyedVehicleEffect = 286;
          destroyedVehicleModel = 9316;
          minorDamageEffect = 285;
          majorDamageEffect = 284;
          criticalDamageEffect = 283;
          supercriticalDamageEffect = 5229;
          break;
        case 5: // atv
          destroyedVehicleEffect = 357;
          destroyedVehicleModel = 9593;
          minorDamageEffect = 360;
          majorDamageEffect = 359;
          criticalDamageEffect = 358;
          supercriticalDamageEffect = 5226;
          break;
        default:
          destroyedVehicleEffect = 135;
          destroyedVehicleModel = 7226;
          minorDamageEffect = 182;
          majorDamageEffect = 181;
          criticalDamageEffect = 180;
          supercriticalDamageEffect = 5227;
          break;
      }
      vehicle.resources.health -= damage;
      if (vehicle.resources.health <= 0) {
        this.destroyVehicle(
          vehicle,
          destroyedVehicleEffect,
          destroyedVehicleModel
        );
      } else {
        let damageeffect = 0;
        let allowSend = false;
        let startDamageTimeout = false;
        if (
          vehicle.resources.health <= 50000 &&
          vehicle.resources.health > 35000
        ) {
          if (vehicle.destroyedState != 1) {
            damageeffect = minorDamageEffect;
            allowSend = true;
            vehicle.destroyedState = 1;
          }
        } else if (
          vehicle.resources.health <= 35000 &&
          vehicle.resources.health > 20000
        ) {
          if (vehicle.destroyedState != 2) {
            damageeffect = majorDamageEffect;
            allowSend = true;
            vehicle.destroyedState = 2;
          }
        } else if (
          vehicle.resources.health <= 20000 &&
          vehicle.resources.health > 10000
        ) {
          if (vehicle.destroyedState != 3) {
            damageeffect = criticalDamageEffect;
            allowSend = true;
            startDamageTimeout = true;
            vehicle.destroyedState = 3;
          }
        } else if (vehicle.resources.health <= 10000) {
          if (vehicle.destroyedState != 4) {
            damageeffect = supercriticalDamageEffect;
            allowSend = true;
            startDamageTimeout = true;
            vehicle.destroyedState = 4;
          }
        } else if (
          vehicle.resources.health > 50000 &&
          vehicle.destroyedState != 0
        ) {
          vehicle.destroyedState = 0;
          this._vehicles[vehicle.characterId].destroyedEffect = 0;
        }

        if (allowSend) {
          this.sendDataToAllWithSpawnedEntity(
            this._vehicles,
            vehicle.characterId,
            "Command.PlayDialogEffect",
            {
              characterId: vehicle.characterId,
              effectId: damageeffect,
            }
          );
          this._vehicles[vehicle.characterId].destroyedEffect =
            damageeffect;
          if (!vehicle.damageTimeout && startDamageTimeout) {
            this.startVehicleDamageDelay(vehicle);
          }
        }

        this.updateResourceToAllWithSpawnedVehicle(
          vehicle.passengers.passenger1,
          vehicle.characterId,
          vehicle.resources.health,
          561,
          1
        );
      }
    }
  }

  destroyVehicle(
    vehicle: Vehicle,
    destroyedVehicleEffect: number,
    destroyedVehicleModel: number
  ) {
    vehicle.resources.health = 0;
    this.explosionDamage(vehicle.state.position, vehicle.characterId);
    this.sendDataToAllWithSpawnedEntity(
      this._vehicles,
      vehicle.characterId,
      "Character.Destroyed",
      {
        characterId: vehicle.characterId,
        unknown1: destroyedVehicleEffect,
        unknown2: destroyedVehicleModel,
        unknown3: 0,
        disableWeirdPhysics: false,
      }
    );
    for (const c in this._clients) {
      if (
        vehicle.characterId ===
          this._clients[c].vehicle.mountedVehicle &&
        !this._clients[c].character.isAlive
      ) {
        this.dismountVehicle(this._clients[c]);
      }
    }
    this.deleteEntity(vehicle.characterId, this._vehicles);
  }

  startVehicleDamageDelay(vehicle: Vehicle) {
    vehicle.damageTimeout = setTimeout(() => {
      this.damageVehicle(1000, vehicle);
      if (
        vehicle.resources.health < 20000 &&
        vehicle.resources.health > 0
      ) {
        vehicle.damageTimeout.refresh();
      }
    }, 1000);
  }

  async respawnPlayer(client: Client) {
    client.character.isAlive = true;
    client.character.isRunning = false;
    if (client.vehicle.mountedVehicle) {
      this.dismountVehicle(client);
    }
    client.isLoading = true;
    client.character.resources.health = 10000;
    client.character.resources.food = 10000;
    client.character.resources.water = 10000;
    client.character.resources.stamina = 600;
    client.character.resources.bleeding = -120;
    client.character.healingTicks = 0;
    client.character.healingMaxTicks = 0;
    client.character.resourcesUpdater.refresh();
    delete client.character.characterStates.knockedOut;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      false
    );
    this.sendData(client, "Character.RespawnReply", {
      characterId: client.character.characterId,
      status: 1,
    });
    const randomSpawnIndex = Math.floor(Math.random() * this._spawnLocations.length);
    this.sendData(client, "ClientUpdate.UpdateLocation", {
      position: spawnLocations[randomSpawnIndex].position,
    });
    this.clearInventory(client);
    this.giveStartingEquipment(client, true, true);
    this.giveStartingItems(client, true);
    client.character.state.position = this._spawnLocations[randomSpawnIndex].position;
    this.updateResource(
      client,
      client.character.characterId,
      client.character.resources.health,
      1,
      1
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character.resources.stamina,
      6,
      6
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character.resources.food,
      4,
      4
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character.resources.water,
      5,
      5
    );
  }

  speedTreeDestroy(packet: any) {
    this.sendDataToAll("DtoStateChange", {
      objectId: packet.data.id,
      modelName: packet.data.name.concat(".Stump"),
      effectId: 0,
      unk3: 0,
      unk4: true,
    });
    const { id: objectId, name } = packet.data;
    this._speedTrees[packet.data.id] = {
      objectId: objectId,
      modelName: name,
    };
    setTimeout(() => {
      this.sendDataToAll("DtoStateChange", {
        objectId: objectId,
        modelName: this._speedTrees[objectId].modelName,
        effectId: 0,
        unk3: 0,
        unk4: true,
      });
      delete this._speedTrees[objectId];
    }, 1800000);
  }

  speedTreeUse(client: Client, packet: any) {
    const elo = this._speedTrees[packet.data.id];
    if (elo) {
      debug(
        "\x1b[32m",
        client.character.name + "\x1b[0m",
        "tried to use destroyed speedTree id:" + "\x1b[32m",
        packet.data.id
      );
    } else {
      let itemDefId = 0;
      switch (packet.data.name) {
        case "SpeedTree.Blackberry":
          itemDefId = 105;
          if (randomIntFromInterval(1, 10) == 1) {
            this.lootItem(
              client,
              this.generateItem(this.worldObjectManager.eItems.WEAPON_BRANCH),
              1
            );
          }
          break;
        case "SpeedTree.DevilClub":
        case "SpeedTree.VineMaple":
          itemDefId = 111;
          break;
        default:
          break;
      }
      if (itemDefId) {
        this.lootContainerItem(client, this.generateItem(itemDefId), 1);
      }
      this.speedTreeDestroy(packet);
    }
  }

  updateResource(
    client: Client,
    entityId: string,
    value: number,
    resource: number,
    resourceType: number
  ) {
    this.sendData(client, "ResourceEvent", {
      eventData: {
        type: 3,
        value: {
          characterId: entityId,
          resourceId: resource,
          resourceType: resourceType,
          initialValue: value,
          unknownArray1: [],
          unknownArray2: [],
        },
      },
    });
  }

  updateResourceToAllWithSpawnedCharacter(
    client: Client,
    entityId: string,
    value: number,
    resource: number,
    resourceType: number
  ) {
    this.sendDataToAllWithSpawnedCharacter(client, "ResourceEvent", {
      eventData: {
        type: 3,
        value: {
          characterId: entityId,
          resourceId: resource,
          resourceType: resourceType,
          initialValue: value,
          unknownArray1: [],
          unknownArray2: [],
        },
      },
    });
  }

  updateResourceToAllWithSpawnedVehicle(
    client: Client,
    entityId: string,
    value: number,
    resource: number,
    resourceType: number
  ) {
    this.sendDataToAllOthersWithSpawnedEntity(
      this._vehicles,
      client,
      entityId,
      "ResourceEvent",
      {
        eventData: {
          type: 3,
          value: {
            characterId: entityId,
            resourceId: resource,
            resourceType: resourceType,
            initialValue: value,
            unknownArray1: [],
            unknownArray2: [],
          },
        },
      }
    );
  }
  playerDamage(client: Client, damage: number) {
    const character = client.character;
    if (
      !client.character.godMode &&
      client.character.isAlive &&
      client.character.characterId
    ) {
      if (damage < 100) {
        return;
      }
      if (randomIntFromInterval(0, 100) < damage / 100 && damage > 500) {
        client.character.resources.bleeding += 41;
        if (damage > 4000) {
          client.character.resources.bleeding += 41;
        }
        this.updateResourceToAllWithSpawnedCharacter(
          client,
          client.character.characterId,
          client.character.resources.bleeding > 0
            ? client.character.resources.bleeding
            : 0,
          21,
          21
        );
      }
      character.resources.health -= damage;
      if (character.resources.health <= 0) {
        character.resources.health = 0;
        this.killCharacter(client);
      }
      this.updateResource(
        client,
        character.characterId,
        character.resources.health,
        1,
        1
      );
      this.sendData(client, "ClientUpdate.DamageInfo", {
        transientId: 0,
        unknownDword2: 100,
      });
    }
  }

  updateCharacterState(
    client: Client,
    characterId: string,
    object: any,
    sendToAll: boolean
  ) {
    const updateCharacterStateBody = {
      characterId: characterId,
      states1: object,
      states2: object,
      states3: object,
      states4: object,
      states5: object,
      states6: object,
      states7: object,
    };

    if (!sendToAll) {
      this.sendData(
        client,
        "Character.UpdateCharacterState",
        updateCharacterStateBody
      );
    } else {
      this.sendDataToAllOthersWithSpawnedEntity(
        this._characters,
        client,
        client.character.characterId,
        "Character.UpdateCharacterState",
        updateCharacterStateBody
      );
    }
  }

  customizeDTO(client: Client): void {
    const DTOArray: any = [];
    for (const object in this._speedTrees) {
      const DTO = this._speedTrees[object];
      const DTOinstance = {
        objectId: DTO.objectId,
        unknownString1: DTO.modelName.concat(".Stump"),
      };
      DTOArray.push(DTOinstance);
    }
    deprecatedDoors.forEach((door: number) => {
      const DTOinstance = {
        objectId: door,
        unknownString1: "Hospital_Door01_Placer.adr",
      };
      DTOArray.push(DTOinstance);
    });
    this.sendData(client, "DtoObjectInitialData", {
      unknownDword1: 1,
      unknownArray1: DTOArray,
      unknownArray2: [{}],
    });
  }

  sendWeatherUpdatePacket(
    client: Client,
    weather: Weather2016,
    broadcast = false
  ): void {
    if (!this._soloMode) {
      this.sendDataToAll("UpdateWeatherData", weather);
      if (broadcast && client?.character?.name) {
        this.sendGlobalChatText(
          `User "${client.character.name}" has changed weather.`
        );
      }
    } else {
      this.sendData(client, "UpdateWeatherData", weather);
    }
  }

  forceTime(time: number): void {
    this._cycleSpeed = 0.1;
    this._frozeCycle = true;
    this._gameTime = time;
  }

  removeForcedTime(): void {
    this._cycleSpeed = 100;
    this._frozeCycle = false;
    this._gameTime = Date.now();
  }

  removeOutOfDistanceEntities(client: Client): void {
    // does not include vehicles
    const objectsToRemove = client.spawnedEntities.filter(
      (e) =>
        //!e.npcData?.positionUpdateType && // TODO: change this behavior this will cause issues
        !e.vehicleId &&
        this.filterOutOfDistance(e, client.character.state.position)
    );
    client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });
    objectsToRemove.forEach((object: any) => {
      this.sendData(
        client,
        "Character.RemovePlayer",
        {
          characterId: object.characterId,
        },
        1
      );
    });
  }

  despawnEntity(characterId: string) {
    this.sendDataToAll(
      "Character.RemovePlayer",
      {
        characterId: characterId,
      },
      1
    );
  }

  deleteEntity(characterId: string, dictionary: any) {
    this.sendDataToAllWithSpawnedEntity(
      dictionary,
      characterId,
      "Character.RemovePlayer",
      {
        characterId: characterId,
      }
    );
    delete dictionary[characterId];
    delete this._transientIds[characterId];
  }

  sendManagedObjectResponseControlPacket(client: Client, obj: any) {
    this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", obj);
  }

  spawnNpcs(client: Client): void {
    for (const npc in this._npcs) {
      if (
        isPosInRadius(
          this._npcs[npc].npcRenderDistance,
          client.character.state.position,
          this._npcs[npc].position
        ) &&
        !client.spawnedEntities.includes(this._npcs[npc])
      ) {
        this.sendData(
          client,
          "AddLightweightNpc",
          { ...this._npcs[npc], profileId: 65 },
          1
        );
        client.spawnedEntities.push(this._npcs[npc]);
      }
    }
  }

  spawnExplosives(client: Client): void {
    for (const npc in this._explosives) {
      if (
        isPosInRadius(
          300,
          client.character.state.position,
          this._explosives[npc].position
        ) &&
        !client.spawnedEntities.includes(this._explosives[npc])
      ) {
        this.sendData(
          client,
          "AddLightweightNpc",
          { ...this._explosives[npc], profileId: 65 },
          1
        );
        client.spawnedEntities.push(this._explosives[npc]);
      }
    }
  }

  spawnTraps(client: Client): void {
    for (const npc in this._traps) {
      if (
        isPosInRadius(
          75,
          client.character.state.position,
          this._traps[npc].position
        ) &&
        !client.spawnedEntities.includes(this._traps[npc])
      ) {
        this.sendData(client, "AddSimpleNpc", { ...this._traps[npc] }, 1);
        client.spawnedEntities.push(this._traps[npc]);
      }
    }
  }

  spawnTemporaryObjects(client: Client): void {
    for (const npc in this._temporaryObjects) {
      if (
        isPosInRadius(
          40,
          client.character.state.position,
          this._temporaryObjects[npc].position
        ) &&
        !client.spawnedEntities.includes(this._temporaryObjects[npc])
      ) {
        this.sendData(
          client,
          "AddSimpleNpc",
          { ...this._temporaryObjects[npc] },
          1
        );
        client.spawnedEntities.push(this._temporaryObjects[npc]);
      }
    }
  }

  spawnCharacters(client: Client) {
    for (const c in this._clients) {
      const characterObj: Character = this._clients[c].character;
      if (
        client.character.characterId != characterObj.characterId &&
        isPosInRadius(
          this._npcRenderDistance,
          client.character.state.position,
          characterObj.state.position
        ) &&
        !client.spawnedEntities.includes(characterObj)
      ) {
        const vehicleId = this._clients[c].vehicle.mountedVehicle,
          vehicle = vehicleId ? this._vehicles[vehicleId] : false;
        this.sendData(
          client,
          "AddLightweightPc",
          {
            ...characterObj,
            modelId: characterObj.actorModelId,
            transientId: characterObj.transientId,
            identity: {
              characterName: characterObj.name,
            },
            position: characterObj.state.position,
            rotation: characterObj.state.lookAt,
            mountGuid: vehicleId || "",
            mountSeatId: vehicle
              ? vehicle.getCharacterSeat(characterObj.characterId)
              : 0,
            mountRelatedDword1: vehicle ? 1 : 0,
          },
          1
        );
        client.spawnedEntities.push(this._characters[characterObj.characterId]);
      }
    }
  }

  spawnObjects(client: Client): void {
    setImmediate(() => {
      for (const object in this._objects) {
        if (
          isPosInRadius(
            this._objects[object].npcRenderDistance,
            client.character.state.position,
            this._objects[object].position
          ) &&
          !client.spawnedEntities.includes(this._objects[object])
        ) {
          this.sendData(
            client,
            "AddLightweightNpc",
            {
              ...this._objects[object],
              nameId: this.getItemDefinition(
                this._objects[object].item.itemDefinitionId
              ).NAME_ID,
              dontSendFullNpcRequest: true,
            },
            1
          );
          client.spawnedEntities.push(this._objects[object]);
        }
      }
    });
  }

  spawnDoors(client: Client): void {
    setImmediate(() => {
      for (const door in this._doors) {
        if (
          isPosInRadius(
            this._doors[door].npcRenderDistance!,
            client.character.state.position,
            this._doors[door].position
          ) &&
          !client.spawnedEntities.includes(this._doors[door])
        ) {
          const object = this._doors[door];
          this.sendData(
            client,
            "AddLightweightNpc",
            { ...object, dontSendFullNpcRequest: true },
            1
          );
          client.spawnedEntities.push(this._doors[door]);
          if (object.isOpen) {
            this.sendDataToAll("PlayerUpdatePosition", {
              transientId: object.transientId,
              positionUpdate: {
                sequenceTime: 0,
                unknown3_int8: 0,
                position: object.position,
                orientation: object.openAngle,
              },
            });
          }
        }
      }
    });
  }

  POIManager(client: Client) {
    // sends POIChangeMessage or clears it based on player location
    let inPOI = false;
    Z1_POIs.forEach((point: any) => {
      if (
        isPosInRadius(
          point.range,
          client.character.state.position,
          point.position
        )
      ) {
        inPOI = true;
        if (client.currentPOI != point.stringId) {
          // checks if player already was sent POIChangeMessage
          this.sendData(client, "POIChangeMessage", {
            messageStringId: point.stringId,
            id: point.POIid,
          });
          client.currentPOI = point.stringId;
        }
      }
    });
    if (!inPOI && client.currentPOI != 0) {
      // checks if POIChangeMessage was already cleared
      this.sendData(client, "POIChangeMessage", {
        messageStringId: 0,
        id: 115,
      });
      client.currentPOI = 0;
    }
  }

  sendData(
    client: Client,
    packetName: h1z1PacketsType,
    obj: any,
    channel = 0
  ): void {
    switch (packetName) {
      case "KeepAlive":
      case "PlayerUpdatePosition":
      case "GameTimeSync":
      case "Synchronization":
      case "Vehicle.StateData":
        break;
      default:
        debug("send data", packetName);
    }
    const data = this._protocol.pack(packetName, obj);
    this._gatewayServer.sendTunnelData(
      this.getSoeClient(client.soeClientId),
      data,
      channel
    );
  }
  sendChat(client: Client, message: string, channel: number) {
    if (!this._soloMode) {
      this.sendDataToAll("Chat.ChatText", {
        message: `${client.character.name}: ${message}`,
        unknownDword1: 0,
        color: [255, 255, 255, 0],
        unknownDword2: 13951728,
        unknownByte3: 0,
        unknownByte4: 1,
      });
    } else {
      this.sendData(client, "Chat.ChatText", {
        message: `${client.character.name}: ${message}`,
        unknownDword1: 0,
        color: [255, 255, 255, 0],
        unknownDword2: 13951728,
        unknownByte3: 0,
        unknownByte4: 1,
      });
    }
  }

  createClient(
    sessionId: number,
    soeClientId: string,
    loginSessionId: string,
    characterId: string,
    generatedTransient: number
  ) {
    return new Client(
      sessionId,
      soeClientId,
      loginSessionId,
      characterId,
      generatedTransient
    );
  }

  getCurrentTime(): number {
    return Number((Date.now() / 1000).toFixed(0));
  }

  getGameTime(): number {
    //debug("get server time");
    const delta = Date.now() - this._startGameTime;
    return this._frozeCycle
      ? Number(((this._gameTime + delta) / 1000).toFixed(0))
      : Number((this._gameTime / 1000).toFixed(0));
  }

  sendGameTimeSync(client: Client): void {
    debug("GameTimeSync");
    if (!this._frozeCycle) {
      this.sendData(client, "GameTimeSync", {
        time: Int64String(this.getServerTimeTest()),
        cycleSpeed: Math.round(this._timeMultiplier * 0.97222),
        unknownBoolean: false,
      });
    } else if (this._frozeCycle) {
      this.sendData(client, "GameTimeSync", {
        time: Int64String(this.getGameTime()),
        cycleSpeed: 0.1,
        unknownBoolean: false,
      });
    }
  }

  sendRawToAllOthersWithSpawnedCharacter(
    client: Client,
    entityCharacterId: string = "",
    data: any
  ): void {
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.includes(
          this._characters[entityCharacterId]
        )
      ) {
        this.sendRawData(this._clients[a], data);
      }
    }
  }

  sendDataToAllWithSpawnedCharacter(
    client: Client,
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          this._characters[client.character.characterId]
        ) ||
        this._clients[a] === client
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }

  //#region ********************VEHICLE********************
  vehicleManager(client: Client) {
    for (const key in this._vehicles) {
      const vehicle = this._vehicles[key];
      if (
        // vehicle spawning / managed object assignment logic
        isPosInRadius(
          this._npcRenderDistance,
          client.character.state.position,
          vehicle.state.position
        )
      ) {
        if (!client.spawnedEntities.includes(vehicle)) {
          this.sendData(client, "AddLightweightVehicle", {
            ...vehicle,
            npcData: {
              ...vehicle,
              ...vehicle.state,
              modelId: vehicle.actorModelId
            },
            unknownGuid1: this.generateGuid()
          }, 1);
          this.sendData(client, "Vehicle.OwnerPassengerList", {
            characterId: client.character.characterId,
            passengers: vehicle.getPassengerList().map((characterId) => {
              return {
                characterId: characterId,
                identity: {
                  characterName: this._characters[characterId].name,
                },
                unknownString1: this._characters[characterId].name,
                unknownByte1: 1,
              };
            }),
          });
          client.spawnedEntities.push(vehicle);
        }
        if (!vehicle.isManaged) {
          // assigns management to first client within radius
          this.assignManagedObject(client, vehicle);
        }
      } else {
        // vehicle despawning / managed object drop logic

        const index = client.spawnedEntities.indexOf(vehicle);
        if (index > -1) {
          if (vehicle.isManaged) {
            this.dropManagedObject(client, vehicle);
          }
          this.sendData(
            client,
            "Character.RemovePlayer",
            {
              characterId: vehicle.characterId,
            },
            1
          );
          client.spawnedEntities.splice(index, 1);
        }
      }
    }
  }

  assignManagedObject(client: Client, vehicle: Vehicle) {
    // todo: vehicle seat swap managed object assignment logic
    debug("\n\n\n\n\n\n\n\n\n\n assign managed object");

    this.sendData(client, "Character.ManagedObject", {
      objectCharacterId: vehicle.characterId,
      characterId: client.character.characterId,
    });
    this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
      control: true,
      objectCharacterId: vehicle.characterId,
    });
    client.managedObjects.push(vehicle.characterId);
    vehicle.isManaged = true;
  }

  dropManagedObject(
    client: Client,
    vehicle: Vehicle,
    keepManaged: boolean = false
  ) {
    const index = client.managedObjects.indexOf(vehicle.characterId);
    if (index > -1) {
      // todo: vehicle seat swap managed object drop logic
      debug("\n\n\n\n\n\n\n\n\n\n drop managed object");

      /*this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
        control: true,
        objectCharacterId: vehicle.characterId,
      });*/ // dont work :/

      this.sendData(
        // temp workaround
        client,
        "Character.RemovePlayer",
        {
          characterId: vehicle.characterId,
        },
        1
      );

      this.sendData(client, "AddLightweightVehicle", {
        ...vehicle,
        npcData: {
          ...vehicle,
          position: vehicle.state.position,
          rotation: vehicle.state.rotation,
          modelId: vehicle.actorModelId
        }
      }, 1);
      client.managedObjects.splice(index, 1);
      // blocks vehicleManager from taking over management during a takeover
      if (!keepManaged) vehicle.isManaged = false;
    }
  }

  takeoverManagedObject(newClient: Client, vehicle: Vehicle) {
    const index = newClient.managedObjects.indexOf(vehicle.characterId);
    if (index === -1) {
      // if object is already managed by client, do nothing
      debug("\n\n\n\n\n\n\n\n\n\n takeover managed object");
      for (const characterId in this._clients) {
        const oldClient = this._clients[characterId];
        const idx = oldClient.managedObjects.indexOf(
          vehicle.characterId
        );
        if (idx > -1) {
          this.dropManagedObject(oldClient, vehicle, true);
          break;
        }
      }
      this.assignManagedObject(newClient, vehicle);
    }
  }

  sendDataToAllWithSpawnedEntity(
    dictionary: { [id: string]: any },
    entityCharacterId: string = "",
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(dictionary[entityCharacterId])
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }

  sendDataToAllWithSpawnedTemporaryObject(
    entityCharacterId: string = "",
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          this._temporaryObjects[entityCharacterId]
        )
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }

  sendDataToAllOthersWithSpawnedEntity(
    dictionary: { [id: string]: any },
    client: Client,
    entityCharacterId: string = "",
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.includes(dictionary[entityCharacterId])
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }

  mountVehicle(client: Client, vehicleGuid: string): void {
    const vehicle = this._vehicles[vehicleGuid];
    if (!vehicle) return;
    client.character.isRunning = false; // maybe some async stuff make this useless need to test that
    client.vehicle.mountedVehicle = vehicle.characterId;
    switch (vehicle.vehicleId) {
      case 1:
        client.vehicle.mountedVehicleType = "offroader";
        break;
      case 2:
        client.vehicle.mountedVehicleType = "pickup";
        break;
      case 3:
        client.vehicle.mountedVehicleType = "policecar";
        break;
      case 5:
        client.vehicle.mountedVehicleType = "atv";
        break;
      case 13:
        client.vehicle.mountedVehicleType = "parachute";
        break;
      case 1337:
        client.vehicle.mountedVehicleType = "spectate";
        break;
      default:
        client.vehicle.mountedVehicleType = "unknown";
        break;
    }
    const seatId = vehicle.getNextSeatId();
    if (seatId < 0) return; // no available seats in vehicle
    vehicle.seats[seatId] = client.character.characterId;
    this.sendDataToAllWithSpawnedEntity(
      this._vehicles,
      vehicleGuid,
      "Mount.MountResponse",
      {
        // mounts character
        characterId: client.character.characterId,
        vehicleGuid: vehicle.characterId, // vehicle guid
        seatId: Number(seatId),
        unknownDword3: seatId === "0" ? 1 : 0, //isDriver
        identity: {},
      }
    );
    if (seatId === "0") {
      this.takeoverManagedObject(client, vehicle);
      if (vehicle.resources.fuel > 0) {
        this.sendDataToAllWithSpawnedEntity(
          this._vehicles,
          vehicleGuid,
          "Vehicle.Engine",
          {
            guid2: vehicleGuid,
            engineOn: true,
          }
        );
        this._vehicles[vehicleGuid].engineOn = true;
        if (!this._vehicles[vehicleGuid].resourcesUpdater) {
          this._vehicles[vehicleGuid].resourcesUpdater = setTimeout(() => {
            if (!this._vehicles[vehicleGuid]) {
              return;
            }
            if (!this._vehicles[vehicleGuid].engineOn) {
              delete this._vehicles[vehicleGuid].resourcesUpdater;
              return;
            }
            if (this._vehicles[vehicleGuid].positionUpdate.engineRPM) {
              const fuelLoss =
                this._vehicles[vehicleGuid].positionUpdate.engineRPM * 0.01;
              this._vehicles[vehicleGuid].resources.fuel -= fuelLoss;
            }
            if (this._vehicles[vehicleGuid].resources.fuel < 0) {
              this._vehicles[vehicleGuid].resources.fuel = 0;
            }
            if (
              this._vehicles[vehicleGuid].engineOn &&
              this._vehicles[vehicleGuid].resources.fuel <= 0
            ) {
              this.sendDataToAllWithSpawnedEntity(
                this._vehicles,
                vehicleGuid,
                "Vehicle.Engine",
                {
                  guid2: vehicleGuid,
                  engineOn: false,
                }
              );
            }
            this.updateResourceToAllWithSpawnedVehicle(
              vehicle.passengers.passenger1,
              vehicle.characterId,
              vehicle.resources.fuel,
              396,
              50
            );
            this._vehicles[vehicleGuid].resourcesUpdater.refresh();
          }, 3000);
        }
      }
      this.sendDataToAllWithSpawnedCharacter(client, "Vehicle.Owner", {
        guid: vehicle.characterId,
        characterId: client.character.characterId,
        unknownDword1: 0,
        vehicleId: vehicle.vehicleId,
        passengers: [
          {
            passengerData: {
              characterId: client.character.characterId,
              characterData: {
                unknownDword1: 1,
                unknownDword2: 1,
                unknownDword3: 1,
                characterName: client.character.name,
                unknownString1: "",
              },
              unknownDword1: 1,
              unknownString1: "",
            },
            unknownByte1: 1,
          },
        ],
      });
    }
    this.sendData(client, "Vehicle.Occupy", {
      guid: vehicle.characterId,
      characterId: client.character.characterId,
      vehicleId: vehicle.vehicleId,
      clearLoadout: 0,
      unknownArray1: [
        {
          unknownDword1: 0,
          unknownBoolean1: 0,
        },
      ],
      passengers: [
        {
          passengerData: {
            characterId: client.character.characterId,
            characterData: {
              unknownDword1: 0,
              unknownDword2: 0,
              unknownDword3: 0,
              characterName: client.character.name,
            },
          },
        },
      ],
      unknownArray2: [{}],
    });
  }

  dismountVehicle(client: Client): void {
    if (!client.vehicle.mountedVehicle) return;
    const vehicle = this._vehicles[client.vehicle.mountedVehicle];
    if (!vehicle) return;
    const seatId = vehicle.getCharacterSeat(client.character.characterId);
    if (!seatId) return;
    vehicle.seats[seatId] = "";
    this.sendDataToAllWithSpawnedEntity(
      this._vehicles,
      client.vehicle.mountedVehicle,
      "Mount.DismountResponse",
      {
        // dismounts character
        characterId: client.character.characterId,
      }
    );
    if (seatId === "0") {
      this.sendDataToAllWithSpawnedEntity(
        this._vehicles,
        client.vehicle.mountedVehicle,
        "Vehicle.Engine",
        {
          // stops engine
          guid2: client.vehicle.mountedVehicle,
          engineOn: false,
        }
      );
      vehicle.engineOn = false;
    }
    if (client.vehicle.mountedVehicleType == "spectate") {
      this.updateEquipment(client);
    }
    client.vehicle.mountedVehicle = "";
    this.sendData(client, "Vehicle.Occupy", {
      guid: "",
      characterId: client.character.characterId,
      vehicleId: 0,
      clearLoadout: 1,
      unknownArray1: [
        {
          unknownDword1: 0,
          unknownBoolean1: 0,
        },
      ],
      passengers: [],
      unknownArray2: [],
    });
    this.sendDataToAllWithSpawnedCharacter(client, "Vehicle.Owner", {
      guid: vehicle.characterId,
      characterId: client.character.characterId,
      unknownDword1: 0,
      vehicleId: 0,
      passengers: [
        {
          passengerData: {
            characterId: client.character.characterId,
            characterData: {
              unknownDword1: 1,
              unknownDword2: 1,
              unknownDword3: 1,
              characterName: client.character.name,
              unknownString1: "",
            },
            unknownDword1: 1,
            unknownString1: "",
          },
          unknownByte1: 1,
        },
      ],
    });
  }

  changeSeat(client: Client, packet: any): void {
    if (!client.vehicle.mountedVehicle) return;
    const vehicle = this._vehicles[client.vehicle.mountedVehicle],
      seatCount = vehicle.getSeatCount(),
      oldSeatId = vehicle.getCharacterSeat(client.character.characterId);

    if (
      packet.data.seatId < seatCount &&
      !vehicle.seats[packet.data.seatId] &&
      oldSeatId
    ) {
      this.sendDataToAllWithSpawnedEntity(
        this._vehicles,
        client.vehicle.mountedVehicle,
        "Mount.SeatChangeResponse",
        {
          characterId: client.character.characterId,
          vehicleGuid: vehicle.characterId,
          identity: {},
          seatId: packet.data.seatId,
        }
      );
      vehicle.seats[oldSeatId] = "";
      vehicle.seats[packet.data.seatId] = client.character.characterId;
      if (oldSeatId === "0") {
        this.sendDataToAllWithSpawnedEntity(
          this._vehicles,
          client.vehicle.mountedVehicle,
          "Vehicle.Engine",
          {
            // stops engine
            guid2: client.vehicle.mountedVehicle,
            engineOn: false,
          }
        );
      }
      if (packet.data.seatId === 0) {
        this.takeoverManagedObject(client, vehicle);
        this.sendDataToAllWithSpawnedEntity(
          this._vehicles,
          client.vehicle.mountedVehicle,
          "Vehicle.Engine",
          {
            // stops engine
            guid2: client.vehicle.mountedVehicle,
            engineOn: true,
          }
        );
      }
    }
  }
  //#endregion

  startTimer(client: Client, stringId: number, time: number) {
    this.sendData(client, "ClientUpdate.StartTimer", {
      stringId: stringId,
      time: time,
    });
  }

  //#region ********************INVENTORY********************

  updateLoadout(client: Client, character = client.character) {
    this.sendData(client, "Loadout.SetLoadoutSlots", character.pGetLoadoutSlots());
    this.checkConveys(client);
  }

  updateEquipment(client: Client, character = client.character) {
    this.sendData(
      client, 
      "Equipment.SetCharacterEquipment", 
      character.pGetEquipment()
    );
  }

  updateEquipmentSlot(
    client: Client,
    slotId: number,
    character = client.character
  ) {
    this.sendDataToAllWithSpawnedCharacter(
      client,
      "Equipment.SetCharacterEquipmentSlot",
      character.pGetEquipmentSlotFull(slotId)
    );
  }

  addItem(client: Client, item: inventoryItem, containerDefinitionId: number) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: itemDef.ID,
        tintId: 0,
        guid: item.itemGuid,
        count: item.stackCount, // also ammoCount
        itemSubData: {
          hasSubData: false,
        },
        containerGuid: item.containerGuid,
        containerDefinitionId: containerDefinitionId,
        containerSlotId: item.slotId,
        baseDurability: 2000,
        currentDurability: item.currentDurability,
        maxDurabilityFromDefinition: 2000,
        unknownBoolean1: true,
        unknownQword3: client.character.characterId,
        unknownDword9: 1,
        unknownBoolean2: false,
      },
    });
  }

  equipContainerItem(client: Client, item: inventoryItem, slotId: number) {
    // equips an existing item from a container

    if(client.character._containers[slotId] && 
      _.size(client.character._containers[slotId].items) != 0
    ) {
      this.sendChatText(client, "[ERROR] Container must be empty to unequip!");
      return;
    }

    const oldLoadoutItem = client.character._loadout[slotId],
      container = client.character.getItemContainer(item.itemGuid)
    if((!oldLoadoutItem || !oldLoadoutItem.itemDefinitionId) && !container) {
      this.containerError(client, 3); // unknown container
      return;
    }
    if(!this.removeContainerItem(client, item, container, 1)) {
      this.containerError(client, 5); // slot does not contain item
      return;
    }
    if (oldLoadoutItem?.itemDefinitionId) { // if target loadoutSlot is occupied
      if (oldLoadoutItem.itemGuid == item.itemGuid) {
        this.sendChatText(client, "[ERROR] Item is already equipped!");
        return;
      }
      if (!this.removeLoadoutItem(client, oldLoadoutItem.slotId)) {
        this.containerError(client, 5); // slot does not contain item
        return;
      }
      this.lootContainerItem(client, oldLoadoutItem, 1, false);
    }
    this.equipItem(client, item, true, slotId);
  }

  equipItem(client: Client, item: inventoryItem | undefined, sendPacket: boolean = true, loadoutSlotId: number = 0) {
    // equips any item with a vaild itemGuid
    if (!item) {
      debug("[ERROR] EquipItem: Invalid item!");
      return;
    }
    const def = this.getItemDefinition(item.itemDefinitionId);
    if(loadoutSlotId) {
      if(!this.validateLoadoutSlot(item.itemDefinitionId, loadoutSlotId)) {
        debug(`[ERROR] EquipItem: Client tried to equip item ${item.itemDefinitionId} with invalid loadoutSlotId ${loadoutSlotId}!`);
        return;
      }
    }
    else {
      loadoutSlotId = this.getAvailableLoadoutSlot(client, item.itemDefinitionId);
      if(!loadoutSlotId) {
        loadoutSlotId = this.getLoadoutSlot(item.itemDefinitionId)
      }
    }
    if (!loadoutSlotId) {
      debug(
        `[ERROR] EquipItem: Tried to equip item with itemDefinitionId: ${item.itemDefinitionId} with an invalid loadoutSlotId!`
      );
      return;
    }
    
    let equipmentSlotId = def.PASSIVE_EQUIP_SLOT_ID; // default for any equipment
   if(this.isWeapon(item.itemDefinitionId)) {
     if(loadoutSlotId == client.character.currentLoadoutSlot) {
      equipmentSlotId = def.ACTIVE_EQUIP_SLOT_ID;
     }
     else {
      equipmentSlotId = this.getAvailablePassiveEquipmentSlot(client, item);
     }
   }

    if(equipmentSlotId) {
      const equipmentData: characterEquipment = {
        modelName: def.MODEL_NAME.replace(
          "<gender>",
          client.character.gender == 1 ? "Male" : "Female"
        ),
        slotId: equipmentSlotId,
        guid: item.itemGuid,
        textureAlias: def.TEXTURE_ALIAS,
        tintAlias: "",
      };
      client.character._equipment[equipmentSlotId] = equipmentData;
    }
    const loadoutData: loadoutItem = {
      ...item,
      slotId: loadoutSlotId,
      containerGuid: "0xFFFFFFFFFFFFFFFF",
      stackCount: 1,
      loadoutItemOwnerGuid: client.character.characterId,
    }
    client.character._loadout[loadoutSlotId] = loadoutData;
    
    if (client.character._loadout[loadoutSlotId] && sendPacket) {
      this.deleteItem(
        client,
        client.character._loadout[loadoutSlotId].itemGuid
      );
    }

    if (def.ITEM_TYPE === 34) {
      client.character._containers[loadoutSlotId] = {
        ...client.character._loadout[loadoutSlotId],
        containerDefinitionId: def.PARAM1,
        items: {},
      };
      if(sendPacket) this.initializeContainerList(client);
    }

    if (!sendPacket) return;

    this.addItem(client, loadoutData, 101);
    this.updateLoadout(client);
    if(equipmentSlotId) this.updateEquipmentSlot(client, equipmentSlotId);
  }

  getItemDefinition(itemDefinitionId: number) {
    return this._itemDefinitions[itemDefinitionId];
  }

  getContainerHasSpace(
    container: loadoutContainer,
    itemDefinitionId: number,
    count: number
  ): boolean {
    return !!(
      this.getContainerDefinition(container.containerDefinitionId).MAX_BULK -
        (this.getContainerBulk(container) +
          this.getItemDefinition(itemDefinitionId).BULK * count) >=
      0
    );
  }

  getContainerDefinition(containerDefinitionId: any) {
    if (this._containerDefinitions[containerDefinitionId]) {
      return this._containerDefinitions[containerDefinitionId];
    } else {
      debug(
        `Tried to get containerDefinition for invalid containerDefinitionId ${containerDefinitionId}`
      );
      return this._containerDefinitions[119];
    }
  }

  generateItemGuid(): bigint {
    return ++this.lastItemGuid;
  }

  generateItem(itemDefinitionId: number, count: number = 1): inventoryItem | undefined {
    if (!this.getItemDefinition(itemDefinitionId)) {
      debug(
        `[ERROR] GenerateItem: Invalid item definition: ${itemDefinitionId}`
      );
      return;
    }
    const generatedGuid = `0x${this.generateItemGuid().toString(16)}`;
    return {
      itemDefinitionId: itemDefinitionId,
      slotId: 0,
      itemGuid: generatedGuid,
      containerGuid: "0x0",
      currentDurability: 2000,
      stackCount: count
    };
  }

  isWeapon(itemDefinitionId: number): boolean {
    return this.getItemDefinition(itemDefinitionId)?.ITEM_TYPE == 26;
  }

  validateEquipmentSlot(itemDefinitionId: number, equipmentSlotId: number) {
    // only for weapons at the moment
    if(!this.getItemDefinition(itemDefinitionId).FLAG_CAN_EQUIP) return false;
    return !!equipSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS === this.getItemDefinition(itemDefinitionId).ITEM_CLASS &&
        equipmentSlotId === slot.EQUIP_SLOT_ID
    );
  }

  validateLoadoutSlot(itemDefinitionId: number, loadoutSlotId: number): boolean {
    if(!this.getItemDefinition(itemDefinitionId).FLAG_CAN_EQUIP) return false;
    return !!loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS === this.getItemDefinition(itemDefinitionId).ITEM_CLASS &&
        loadoutSlotId === slot.SLOT
    );
  }

  getLoadoutSlot(itemDefinitionId: number, loadoutId: number = 3) {
    // gets the first loadoutSlot an item can go into (occupied or not)
    const itemDef = this.getItemDefinition(itemDefinitionId),
    loadoutSlotItemClass = loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS === itemDef.ITEM_CLASS &&
        loadoutId === slot.LOADOUT_ID
    );
    return loadoutSlotItemClass?.SLOT || 0;
  }

  getAvailableLoadoutSlot(client: Client, itemDefinitionId: number, loadoutId: number = 3): number {
    // gets an open loadoutslot for a specified itemDefinitionId
    const itemDef = this.getItemDefinition(itemDefinitionId),
    loadoutSlotItemClass = loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS === itemDef.ITEM_CLASS &&
        loadoutId === slot.LOADOUT_ID
    );
    let slot = loadoutSlotItemClass?.SLOT;
    if(!slot) return 0;
    if(itemDef.ITEM_CLASS == 25036) {// weapon
      if(client.character._loadout[slot]?.itemDefinitionId) {// primary
        slot = 3; // secondary
      }
      if(slot == 3 && client.character._loadout[slot]?.itemDefinitionId) {// secondary
        slot = 4; // tertiary
      }
    }
    else if(itemDef.ITEM_CLASS == 25054) {// item 1 / item 2
      if(client.character._loadout[slot]?.itemDefinitionId) {// item 1
        slot = 41; // item 2
      }
    }

    if(client.character._loadout[slot]?.itemDefinitionId) {
      slot = 0;
    }
    return slot;
  }

  getAvailablePassiveEquipmentSlot(client: Client, item: inventoryItem): number {
    const itemDef = this.getItemDefinition(item.itemDefinitionId),
    itemClass = itemDef?.ITEM_CLASS
    if(!itemDef || !itemClass || !this.isWeapon(item.itemDefinitionId)) return 0;
    for(const slot of equipSlotItemClasses) {
      if(
        slot.ITEM_CLASS == itemDef.ITEM_CLASS &&
        !client.character._equipment[slot.EQUIP_SLOT_ID]
      ) {
        return slot.EQUIP_SLOT_ID;
      }
    }
    return 0;
  }

  getContainerBulk(container: loadoutContainer): number {
    let bulk = 0;
    for (const item of Object.values(container.items)) {
      bulk +=
        this.getItemDefinition(item.itemDefinitionId).BULK * item.stackCount;
    }
    return bulk;
  }

  getAvailableContainer(
    client: Client,
    itemDefinitionId: number,
    count: number
  ): loadoutContainer | undefined {
    // returns the first container that has enough space to store count * itemDefinitionId bulk

    const itemDef = this.getItemDefinition(itemDefinitionId);
    for (const container of Object.values(client.character._containers)) {
      const containerItemDef = this.getItemDefinition(
          container?.itemDefinitionId
        ),
        containerDef = this.getContainerDefinition(containerItemDef?.PARAM1);
      if (
        container &&
        containerDef?.MAX_BULK >=
          this.getContainerBulk(container) + itemDef.BULK * count
      ) {
        return container;
      }
    }
    return;
  }

  getAvailableItemStack(
    container: loadoutContainer,
    itemDefId: number,
    count: number,
    slotId: number = 0
  ): string {
    // returns the itemGuid of the first open stack in container arg that has enough open slots and is the same itemDefinitionId as itemDefId arg
    // if slotId is defined, then only an item with the same slotId will be returned
    if (this.getItemDefinition(itemDefId).MAX_STACK_SIZE == 1) return "";
    for (const item of Object.values(container.items)) {
      if (
        item.itemDefinitionId == itemDefId &&
        this.getItemDefinition(item.itemDefinitionId).MAX_STACK_SIZE >=
          item.stackCount + count
      ) {
        if (!slotId || slotId == item.slotId) {
          return item.itemGuid;
        }
      }
    }
    return "";
  }

  switchLoadoutSlot(client: Client, loadoutItem: loadoutItem) {
    const oldLoadoutSlot = client.character.currentLoadoutSlot;
    // remove passive equip
    this.removeEquipmentItem(client, client.character.getActiveEquipmentSlot(loadoutItem));
    client.character.currentLoadoutSlot = loadoutItem.slotId;
    this.equipItem(client, loadoutItem, true, loadoutItem.slotId);

    // equip passive slot
    this.equipItem(client, client.character._loadout[oldLoadoutSlot], true, oldLoadoutSlot);
  }

  removeEquipmentItem(client: Client, equipmentSlotId: number): boolean {
    if(!equipmentSlotId) return false;
    delete client.character._equipment[equipmentSlotId];
    this.sendDataToAllWithSpawnedCharacter(client, 
      "Equipment.UnsetCharacterEquipmentSlot", 
    {
      characterData: {
        characterId: client.character.characterId,
      },
      slotId: equipmentSlotId,
    });
    if (equipmentSlotId === 7) {
      // primary slot
      client.character.currentLoadoutSlot = 7;
      this.equipItem(client, client.character._loadout[7]); //equip fists
    }
    return true;
  }

  removeLoadoutItem(client: Client, loadoutSlotId: number): boolean {
    const item = client.character._loadout[loadoutSlotId],
    itemDefId = item?.itemDefinitionId; // save before item gets deleted
    if (!item || !item.itemDefinitionId) return false;
    this.deleteItem(client, item.itemGuid);
    client.character.clearLoadoutSlot(loadoutSlotId);
    this.updateLoadout(client);
    this.removeEquipmentItem(client, client.character.getActiveEquipmentSlot(item));
    if (this.getItemDefinition(itemDefId).ITEM_TYPE === 34) {
      delete client.character._containers[loadoutSlotId];
      this.initializeContainerList(client);
    }
    return true;
  }

  removeContainerItem(
    client: Client,
    item: inventoryItem | undefined,
    container: loadoutContainer | undefined,
    count: number
  ): boolean {
    // removes a specific itemGuid from a specified container
    if (!container || !item) return false;
    if (item.stackCount == count) {
      delete container.items[item.itemGuid];
      this.deleteItem(client, item.itemGuid);
    } else if (item.stackCount > count) {
      item.stackCount -= count;
      this.updateContainerItem(client, item, container);
    } else {
      // if count > removeItem.stackCount
      return false;
    }
    this.updateContainer(client, container);
    return true;
  }

  removeInventoryItem(
    client: Client,
    item: inventoryItem,
    count: number = 1
  ): boolean {
    // removes a specific itemGuid from the inventory (containers and loadout)
    if (client.character._loadout[item.slotId]?.itemGuid == item.itemGuid) {
      return this.removeLoadoutItem(client, item.slotId);
    } else {
      return this.removeContainerItem(
        client,
        item,
        client.character.getItemContainer(item.itemGuid),
        count
      );
    }
  }


  // not used for now, maybe helpful in the future
  /*
  removeInventoryItems(
    client: Client,
    itemDefinitionId: number,
    requiredCount: number = 1
  ): boolean {
    // removes x amount of items between multiple stacks, containers, and loadout
    const loadoutSlotId = 0//this.getActiveLoadoutSlot(client, itemDefinitionId);
    // loadout disabled for now
    if (
      client.character._loadout[loadoutSlotId]?.itemDefinitionId ==
      itemDefinitionId
    ) {
      // todo: check multiple loadout slots for items
      return this.removeLoadoutItem(client, loadoutSlotId);
    } else {
      let removeItems: {
        container: loadoutContainer;
        item: inventoryItem;
        count: number;
      }[] = [];
      for (const container of Object.values(client.character._containers)) {
        console.log(`container: ${container.slotId}`);
        if (!requiredCount) break;
        for (const item of Object.values(container.items)) {
          if (item.itemDefinitionId == itemDefinitionId) {
            console.log(`item: ${item.itemGuid}`);
            if (item.stackCount >= requiredCount) {
              console.log("stack 1");
              removeItems.push({ container, item, count: requiredCount });
              requiredCount = 0;
              break;
            } else {
              console.log("stack 2");
              removeItems.push({ container, item, count: item.stackCount });
              requiredCount -= item.stackCount;
            }
          }
        }
      }
      if (requiredCount) {
        // missing some items
        return false;
      }
      for (const itemStack of Object.values(removeItems)) {
        console.log(itemStack);
        if (
          !this.removeContainerItem(
            client,
            itemStack.item,
            itemStack.container,
            itemStack.count
          )
        ) {
          return false;
        }
      }
      return true;
    }
  }
  */

  dropItem(client: Client, item: inventoryItem, count: number = 1) {
    if(!item) {
      this.containerError(client, 5); // slot does not contain item
      return;
    }
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId),
    modelId = itemDefinition.WORLD_MODEL_ID;
    if (!modelId) {
      debug(
        `[ERROR] DropItem: No WORLD_MODEL_ID mapped to itemDefinitionId: ${item.itemDefinitionId}`
      );
    }
    
    if (!this.removeInventoryItem(client, item, count)) return;
    this.sendData(client, "Character.DroppedIemNotification", {
      characterId: client.character.characterId,
      itemDefId: item.itemDefinitionId,
      count: count,
    });

    let dropItem;
    if(item.stackCount == count) {
      dropItem = item;
    }
    else if(item.stackCount > count){
      dropItem = this.generateItem(item.itemDefinitionId, count)
    }
    else {
      return;
    }
    this.worldObjectManager.createLootEntity(
      this,
      dropItem,
      [...client.character.state.position],
      [0, Number(Math.random() * 10 - 5), 0, 1],
      15
    );
    this.spawnObjects(client); // manually call this for now
  }

  lootItem(client: Client, item: inventoryItem | undefined, count: number) {
    if (!item) return;
    const itemDefId = item.itemDefinitionId,
    itemDef = this.getItemDefinition(itemDefId);
    if (itemDef.FLAG_CAN_EQUIP && 
    this.getAvailableLoadoutSlot(client, itemDefId)
    ) {
      this.sendData(client, "Reward.AddNonRewardItem", {
        itemDefId: itemDefId,
        iconId: this.getItemDefinition(itemDefId).IMAGE_SET_ID,
        count: count,
      });
      this.equipItem(client, item);
    } else {
      this.lootContainerItem(client, item, count);
    }
  }

  pickupItem(client: Client, guid: string) {
    const object = this._objects[guid],
    item: inventoryItem = object.item
    if(!item) {
      this.sendChatText(
        client,
        `[ERROR] Invalid item`
      );
      return;
    }
    this.sendData(client, "Character.PlayWorldCompositeEffect", {
      characterId: "0x0",
      effectId:
        this.getItemDefinition(item.itemDefinitionId)
          .PICKUP_EFFECT ?? 5151,
      position: object.position,
    });
    this.lootItem(client, item, item.stackCount);
    this.deleteEntity(guid, this._objects);
    delete this.worldObjectManager._spawnedObjects[object.spawnerId];
  }

  lootContainerItem(
    client: Client,
    item: inventoryItem | undefined,
    count: number,
    sendUpdate: boolean = true
  ) {
    if (!item) return;
    const itemDefId = item.itemDefinitionId,
      availableContainer = this.getAvailableContainer(client, itemDefId, count);
    if (!availableContainer) {
      // container error full
      this.sendData(client, "Character.NoSpaceNotification", {
        characterId: client.character.characterId,
      });
      this.worldObjectManager.createLootEntity(
        this,
        item,
        [...client.character.state.position],
        [0, Number(Math.random() * 10 - 5), 0, 1],
        15
      );
      this.spawnObjects(client); // manually call this for now
      return;
    }
    const itemStackGuid = this.getAvailableItemStack(
      availableContainer,
      itemDefId,
      count
    );
    if (itemStackGuid) {
      const itemStack =
        client.character._containers[availableContainer.slotId].items[
          itemStackGuid
        ];
      itemStack.stackCount += count;
      this.updateContainerItem(client, itemStack, availableContainer);
      if (sendUpdate) {
        this.sendData(client, "Reward.AddNonRewardItem", {
          itemDefId: itemDefId,
          iconId: this.getItemDefinition(itemDefId).IMAGE_SET_ID,
          count: count,
        });
      }
    } else {
      this.addContainerItem(
        client,
        item,
        availableContainer,
        count,
        sendUpdate
      );
    }
  }

  deleteItem(client: Client, itemGuid: string) {
    this.sendData(client, "ClientUpdate.ItemDelete", {
      characterId: client.character.characterId,
      itemGuid: itemGuid,
    });
  }

  initializeContainerList(client: Client, sendPacket: boolean = true) {
    const containers = Object.values(client.character._containers).map(
      (container) => {
        const containerDefinition = this.getContainerDefinition(
          container.containerDefinitionId
        );
        return {
          loadoutSlotId: container.slotId,
          containerData: {
            guid: container.itemGuid,
            definitionId: container.containerDefinitionId,
            associatedCharacterId: client.character.characterId,
            slots: containerDefinition.MAXIMUM_SLOTS,
            items: Object.values(container.items).map((item, idx) => {
              container.items[item.itemGuid].slotId = idx + 1;
              return {
                itemDefinitionId: item.itemDefinitionId,
                itemData: {
                  itemDefinitionId: item.itemDefinitionId,
                  tintId: 0,
                  guid: item.itemGuid,
                  count: item.stackCount,
                  itemSubData: {
                    hasSubData: false,
                  },
                  containerGuid: container.itemGuid,
                  containerDefinitionId: container.containerDefinitionId,
                  containerSlotId: item.slotId,
                  baseDurability: 2000,
                  currentDurability: item.currentDurability,
                  maxDurabilityFromDefinition: 2000,
                  unknownBoolean1: true,
                  unknownQword3: client.character.characterId,
                  unknownDword9: 1,
                },
              };
            }),
            unknownBoolean1: true, // needs to be true or bulk doesn't show up
            maxBulk: containerDefinition.MAX_BULK,
            unknownDword4: 28,
            bulkUsed: this.getContainerBulk(container),
            hasBulkLimit: !!containerDefinition.MAX_BULK,
          },
        };
      }
    );
    if (sendPacket) {
      this.sendData(client, "Container.InitEquippedContainers", {
        ignore: client.character.characterId,
        characterId: client.character.characterId,
        containers: containers,
      });
    }
    return containers;
  }

  updateContainer(client: Client, container: loadoutContainer | undefined) {
    if (!container) return;
    const containerDefinition = this.getContainerDefinition(
      container.containerDefinitionId
    );
    this.sendData(client, "Container.UpdateEquippedContainer", {
      ignore: client.character.characterId,
      characterId: client.character.characterId,
      containerData: {
        guid: container.itemGuid,
        definitionId: container.containerDefinitionId,
        associatedCharacterId: client.character.characterId,
        slots: containerDefinition.MAXIMUM_SLOTS,
        items: Object.values(container.items).map((item, idx) => {
          container.items[item.itemGuid].slotId = idx + 1;
          return {
            itemDefinitionId: item.itemDefinitionId,
            itemData: {
              itemDefinitionId: item.itemDefinitionId,
              tintId: 0,
              guid: item.itemGuid,
              count: item.stackCount,
              itemSubData: {
                hasSubData: false,
              },
              containerGuid: container.itemGuid,
              containerDefinitionId: container.containerDefinitionId,
              containerSlotId: item.slotId,
              baseDurability: 2000,
              currentDurability: item.currentDurability,
              maxDurabilityFromDefinition: 2000,
              unknownBoolean1: true,
              unknownQword3: client.character.characterId,
              unknownDword9: 1,
            },
          };
        }),
        unknownBoolean1: true, // needs to be true or bulk doesn't show up
        maxBulk: containerDefinition.MAX_BULK,
        unknownDword4: 28,
        bulkUsed: this.getContainerBulk(container),
        hasBulkLimit: !!containerDefinition.MAX_BULK,
      },
    });
  }

  addContainerItem(
    client: Client,
    item: inventoryItem | undefined,
    container: loadoutContainer,
    count: number,
    sendUpdate: boolean = true
  ) {
    if (!item) return;

    const itemDefId = item.itemDefinitionId;
    container.items[item.itemGuid] = {
      ...item,
      slotId: Object.keys(container.items).length,
      containerGuid: container.itemGuid,
      stackCount: count,
    };
    this.addItem(
      client,
      container.items[item.itemGuid],
      container.containerDefinitionId
    );
    this.updateContainer(client, container);
    if (sendUpdate) {
      this.sendData(client, "Reward.AddNonRewardItem", {
        itemDefId: itemDefId,
        iconId: this.getItemDefinition(itemDefId).IMAGE_SET_ID,
        count: count,
      });
    }
  }

  updateContainerItem(
    client: Client,
    item: inventoryItem,
    container: loadoutContainer | undefined
  ) {
    if (!container) return;
    this.sendData(client, "ClientUpdate.ItemUpdate", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: item.itemDefinitionId,
        tintId: 0,
        guid: item.itemGuid,
        count: item.stackCount, // also ammoCount
        itemSubData: {
          hasSubData: false,
        },
        containerGuid: item.containerGuid,
        containerDefinitionId: container.containerDefinitionId,
        containerSlotId: item.slotId,
        baseDurability: 2000,
        currentDurability: item.currentDurability,
        maxDurabilityFromDefinition: 2000,
        unknownBoolean1: true,
        unknownQword3: client.character.characterId,
        unknownDword9: 1,
        unknownBoolean2: false,
      },
    });
    this.updateContainer(client, container);
  }

  giveStartingEquipment(
    client: Client,
    sendPacket: boolean,
    giveBackpack: boolean = false
  ) {
    if (giveBackpack) {
      this.equipItem(client, this.generateItem(2393), sendPacket); // rasta backpack
    }
    this.equipItem(client, this.generateItem(85), sendPacket); // fists weapon
    this.equipItem(client, this.generateItem(2377), sendPacket); // DOA Hoodie
    this.equipItem(client, this.generateItem(2079), sendPacket); // golf pants
  }
  giveStartingItems(client: Client, sendPacket: boolean) {
    this.lootContainerItem(client, this.generateItem(1985), 1, sendPacket); // map
    this.lootContainerItem(client, this.generateItem(1441), 1, sendPacket); // compass
    this.lootContainerItem(client, this.generateItem(1751), 5, sendPacket); // gauze
    this.lootContainerItem(client, this.generateItem(1804), 1, sendPacket); // flare
  }

  clearInventory(client: Client) {
    for (const item of Object.values(client.character._loadout)) {
      if (client.character._containers[item.slotId]) {
        const container = client.character._containers[item.slotId];
        for (const item of Object.values(container.items)) {
          this.removeInventoryItem(client, item, item.stackCount);
        }
      }
      if (item.slotId != 7 && item.itemDefinitionId) {
        this.removeInventoryItem(client, item, item.stackCount);
      }
    }
  }

  eatItem(client: Client, item: inventoryItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if(!itemDef) return;
    let drinkCount = 0;
    let eatCount = 2000;
    let givetrash = 0;
    let timeout = 1000;
    switch (item.itemDefinitionId) {
      case 105: // berries
        drinkCount = 200;
        eatCount = 200;
        timeout = 600;
        break;
      case 7: // canned Food
        eatCount = 4000;
        givetrash = 48;
        break;
      case 1402: // M.R.E Apple
        eatCount = 6000;
        drinkCount = 6000;
        break;
      default:
        this.sendChatText(
          client,
          "[ERROR] eat count not mapped to item Definition " +
            item.itemDefinitionId
        );
    }
    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, () => {
      this.eatItemPass(client, item, eatCount, drinkCount, givetrash);
    });
  }

  useMedical(client: Client, item: inventoryItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if(!itemDef) return;
    let timeout = 1000;
    let healCount = 9;
    let bandagingCount = 40;
    switch (item.itemDefinitionId) {
      case 78: // med kit
      case 2424:
        healCount = 99;
        timeout = 5000;
        bandagingCount = 120;
        break;
      case 24: // bandage
      case 1751: // gauze
        healCount = 9;
        timeout = 1000;
        break;
      case 2214: //dressed bandage
        healCount = 29;
        timeout = 2000;
        break;
      default:
        this.sendChatText(
          client,
          "[ERROR] Medical not mapped to item Definition " +
            item.itemDefinitionId
        );
    }
    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, () => {
      this.useMedicalPass(client, item, healCount, bandagingCount);
    });
  }

  igniteOption(client: Client, item: inventoryItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if(!itemDef) return;
    let timeout = 100;
    switch (item.itemDefinitionId) {
      case 1436: // lighter
        break;
      case 1452: // bow drill
        timeout = 15000;
        break;
      default:
        this.sendChatText(
          client,
          "[ERROR] Igniter not mapped to item Definition " +
            item.itemDefinitionId
        );
    }
    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, () => {
      this.igniteoptionPass(client);
    });
  }

  drinkItem(client: Client, item: inventoryItem) {
    const itemDef = this.getItemDefinition(item.itemDefinitionId);
    if(!itemDef) return;
    let drinkCount = 2000;
    let eatCount = 0;
    let givetrash = 0;
    let timeout = 1000;
    switch (item.itemDefinitionId) {
      case 1368: // dirty water
        drinkCount = 1000;
        givetrash = 1353;
        break;
      case 1535: //stagnant water
        drinkCount = 2000;
        givetrash = 1353;
        break;
      case 1371: // purified water
        drinkCount = 4000;
        givetrash = 1353;
        break;
      default:
        this.sendChatText(
          client,
          "[ERROR] drink count not mapped to item Definition " +
            item.itemDefinitionId
        );
    }
    this.utilizeHudTimer(client, itemDef.NAME_ID, timeout, () => {
      this.drinkItemPass(client, item, eatCount, drinkCount, givetrash);
    });
  }

  fillPass(client: Client, item: inventoryItem) {
    if (client.character.characterStates.inWater) {
      this.removeInventoryItem(client, item, 1);
      this.lootContainerItem(client, this.generateItem(1368), 1); // give dirty water
    } else {
      this.sendData(client, "ClientUpdate.TextAlert", {
        message: "There is no water source nearby",
      });
    }
  }

  sniffPass(client: Client, item: inventoryItem) {
    this.removeInventoryItem(client, item, 1);
    this.applyMovementModifier(client, 1.15, "swizzle");
  }

  useItem(client: Client, item: inventoryItem) {
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId),
    nameId = itemDefinition.NAME_ID;
    let useoption = "";
    let timeout = 1000;
    switch (item.itemDefinitionId) {
      case 1353: // empty bottle
        useoption = "fill";
        break;
      case 1709: // swizzle
        useoption = "sniff";
        timeout = 3000;
        break;
      default:
        this.sendChatText(
          client,
          "[ERROR] No use option mapped to item Definition " +
            item.itemDefinitionId
        );
    }
    switch (useoption) {
      case "fill": // empty bottle
        this.utilizeHudTimer(client, nameId, timeout, () => {
          this.fillPass(client, item);
        });
        break;
      case "sniff": // swizzle
        this.utilizeHudTimer(client, nameId, timeout, () => {
          this.sniffPass(client, item);
        });
        break;
      default:
        return;
    }
  }
  refuelVehicle(client: Client, item: inventoryItem, vehicleGuid: string) {
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId),
    nameId = itemDefinition.NAME_ID;
    let timeout = 5000;
    let fuelValue = 2500;
    switch (item.itemDefinitionId) {
      case 1384: // ethanol
        fuelValue = 5000;
        break;
      default:
        break;
    }
    this.utilizeHudTimer(client, nameId, timeout, () => {
      this.refuelVehiclePass(client, item, vehicleGuid, fuelValue);
    });
  }

  shredItem(client: Client, item: inventoryItem) {
    const itemDefinition = this.getItemDefinition(
      item.itemDefinitionId
    ),
    nameId = itemDefinition.NAME_ID,
    itemType = itemDefinition.ITEM_TYPE;
    let count = 1,
    timeout = 3000;
    switch (itemType) {
      case 36:
      case 39:
        count = 1;
        break;
      case 34: // salvage/shred
        count = 4;
        break;
      default:
        this.sendChatText(client, "[ERROR] Unknown salvage item or count.");
    }
    this.utilizeHudTimer(client, nameId, timeout, () => {
      this.shredItemPass(client, item, count);
    });
  }

  drinkItemPass(
    client: Client,
    item: inventoryItem,
    eatCount: number,
    drinkCount: number,
    givetrash: number
  ) {
    this.removeInventoryItem(client, item, 1);
    client.character.resources.food += eatCount;
    client.character.resources.water += drinkCount;
    const { food, water } = client.character.resources;
    this.updateResource(client, client.character.characterId, food, 4, 4);
    this.updateResource(client, client.character.characterId, water, 5, 5);
    if (givetrash) {
      this.lootContainerItem(client, this.generateItem(givetrash), 1);
    }
  }

  eatItemPass(
    client: Client,
    item: inventoryItem,
    eatCount: number,
    drinkCount: number,
    givetrash: number
  ) {
    this.removeInventoryItem(client, item, 1);
    client.character.resources.food += eatCount;
    client.character.resources.water += drinkCount;
    const { food, water } = client.character.resources;
    this.updateResource(client, client.character.characterId, food, 4, 4);
    this.updateResource(client, client.character.characterId, water, 5, 5);
    if (givetrash) {
      this.lootContainerItem(client, this.generateItem(givetrash), 1);
    }
  }

  igniteoptionPass(client: Client) {
    for (const a in this._explosives) {
      if (
        isPosInRadius(
          1,
          client.character.state.position,
          this._explosives[a].position
        )
      ) {
        this.igniteIED(this._explosives[a]);
      }
    }
  }

  useMedicalPass(
    client: Client,
    item: inventoryItem,
    healCount: number,
    bandagingCount: number
  ) {
    client.character.healingMaxTicks += healCount;
    client.character.resources.bleeding -= bandagingCount;
    const { bleeding } = client.character.resources;
    if (!client.character.healingInterval) {
      client.character.starthealingInterval(client, this);
    }
    this.updateResourceToAllWithSpawnedCharacter(
      client,
      client.character.characterId,
      bleeding > 0 ? bleeding : 0,
      21,
      21
    );
    this.removeInventoryItem(client, item, 1);
  }

  refuelVehiclePass(
    client: Client,
    item: inventoryItem,
    vehicleGuid: string,
    fuelValue: number
  ) {
    this.removeInventoryItem(client, item, 1);
    const vehicle = this._vehicles[vehicleGuid];
    vehicle.resources.fuel += fuelValue;
    if (vehicle.resources.fuel > 10000) {
      vehicle.resources.fuel = 10000;
    }
    this.updateResourceToAllWithSpawnedVehicle(
      client,
      vehicleGuid,
      vehicle.resources.fuel,
      396,
      50
    );
  }

  shredItemPass(client: Client, item: inventoryItem, count: number) {
    this.removeInventoryItem(client, item, 1);
    this.lootItem(client, this.generateItem(23), count);
  }

  pUtilizeHudTimer = promisify(this.utilizeHudTimer);

  utilizeHudTimer(
    client: Client,
    nameId: number,
    timeout: number,
    callback: any
  ) {
    this.startTimer(client, nameId, timeout);
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
    }
    client.posAtLogoutStart = client.character.state.position;
    client.hudTimer = setTimeout(() => {
      callback.apply(this);
    }, timeout);
  }

  igniteIED(IED: any) {
    if (!IED.isIED) {
      return;
    }
    this.sendDataToAllWithSpawnedEntity(
      this._explosives,
      IED.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: IED.characterId,
        effectId: 5034,
      }
    );
    this.sendDataToAllWithSpawnedEntity(
      this._explosives,
      IED.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: IED.characterId,
        effectId: 185,
      }
    );
    setTimeout(() => {
      this.explodeExplosive(IED);
    }, 10000);
  }

  explodeExplosive(explosive: any) {
    if (!this._explosives[explosive.characterId]) {
      return;
    }
    this.sendDataToAllWithSpawnedEntity(
      this._explosives,
      explosive.characterId,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: "0x0",
        effectId: 1875,
        position: explosive.position,
      }
    );
    this.sendDataToAllWithSpawnedEntity(
      this._explosives,
      explosive.characterId,
      "Character.RemovePlayer",
      {
        characterId: explosive.characterId,
      }
    );
    delete this._explosives[explosive.characterId];
    this.explosionDamage(explosive.position, explosive.characterId);
  }

  getInventoryAsContainer(client: Client): {
    [itemDefinitionId: number]: inventoryItem[];
  } {
    const inventory: { [itemDefinitionId: number]: inventoryItem[] } = {};
    for (const container of Object.values(client.character._containers)) {
      for (const item of Object.values(container.items)) {
        if (!inventory[item.itemDefinitionId]) {
          inventory[item.itemDefinitionId] = []; // init array
        }
        inventory[item.itemDefinitionId].push(item); // push new itemstack
      }
    }
    return inventory;
  }

  containerError(client: Client, error: number) {
    this.sendData(client, "Container.Error", {
      characterId: client.character.characterId,
      containerError: error, // unknown container
    });
  }

  clearMovementModifiers(client: Client) {
    for (const a in client.character.timeouts) {
      client.character.timeouts[a]._onTimeout();
      delete client.character.timeouts[a];
    }
  }

  applyMovementModifier(client: Client, modifier: number, type: string) {
    this.multiplyMovementModifier(client, modifier);
    switch (type) {
      case "wellRested":
        if (client.character.timeouts["wellRested"]) {
          client.character.timeouts["wellRested"]._onTimeout();
          delete client.character.timeouts["wellRested"];
        }
        client.character.timeouts["wellRested"] = setTimeout(() => {
          if (!client.character.timeouts["wellRested"]) {
            return;
          }
          this.divideMovementModifier(client, modifier);
          delete client.character.timeouts["wellRested"];
        }, 300000);
        break;
      case "swizzle":
        if (client.character.timeouts["swizzle"]) {
          client.character.timeouts["swizzle"]._onTimeout();
          delete client.character.timeouts["swizzle"];
        }
        client.character.timeouts["swizzle"] = setTimeout(() => {
          if (!client.character.timeouts["swizzle"]) {
            return;
          }
          this.divideMovementModifier(client, modifier);
          delete client.character.timeouts["swizzle"];
        }, 30000);
        break;
      case "snared":
        if (client.character.timeouts["snared"]) {
          client.character.timeouts["snared"]._onTimeout();
          delete client.character.timeouts["snared"];
        }
        client.character.timeouts["snared"] = setTimeout(() => {
          if (!client.character.timeouts["snared"]) {
            return;
          }
          this.divideMovementModifier(client, modifier);
          delete client.character.timeouts["snared"];
        }, 15000);
        break;
      case "boots":
        // some stuff
        break;
    }
  }

  multiplyMovementModifier(client: Client, modifier: number) {
    this.sendData(client, "ClientUpdate.ModifyMovementSpeed", {
      speed: modifier,
    });
  }

  divideMovementModifier(client: Client, modifier: number) {
    const modifierFixed = 1 / modifier;
    this.sendData(client, "ClientUpdate.ModifyMovementSpeed", {
      speed: modifierFixed,
    });
  }

  checkConveys(client: Client, character = client.character) {
    if (!character._equipment["5"]) {
      if (character.hasConveys) {
        character.hasConveys = false;
        this.divideMovementModifier(client, 1.15);
      }
    } else {
      if (character._equipment["5"].guid) {
        const item = client.character.getInventoryItem(character._equipment["5"].guid);
        if(!item) return;
        const itemDef = this.getItemDefinition(item.itemDefinitionId);
        if (itemDef.DESCRIPTION_ID == 11895 && !character.hasConveys) {
          character.hasConveys = true;
          this.applyMovementModifier(client, 1.15, "boots");
        } else if (itemDef.DESCRIPTION_ID != 11895 && character.hasConveys) {
          character.hasConveys = false;
          this.divideMovementModifier(client, 1.15);
        }
      }
    }
  }

  //#endregion

  async reloadZonePacketHandlers() {
    //@ts-ignore
    delete this._packetHandlers;
    delete require.cache[require.resolve("./zonepackethandlers")];
    this._packetHandlers = new (
      require("./zonepackethandlers") as any
    ).zonePacketHandlers();
    await this._packetHandlers.reloadCommandCache();
  }
  generateGuid(): string {
    return generateRandomGuid();
  }
  getSoeClient(soeClientId: string): SOEClient {
    return this._gatewayServer._soeServer._clients[soeClientId];
  }
  sendRawData(client: Client, data: Buffer, channel = 0): void {
    this._gatewayServer.sendTunnelData(
      this.getSoeClient(client.soeClientId),
      data,
      channel
    );
  }
  sendChatText(client: Client, message: string, clearChat = false): void {
    if (clearChat) {
      for (let index = 0; index <= 6; index++) {
        this.sendData(client, "Chat.ChatText", {
          message: " ",
          unknownDword1: 0,
          color: [255, 255, 255, 0],
          unknownDword2: 13951728,
          unknownByte3: 0,
          unknownByte4: 1,
        });
      }
    }
    this.sendData(client, "Chat.ChatText", {
      message: message,
      unknownDword1: 0,
      color: [255, 255, 255, 0],
      unknownDword2: 13951728,
      unknownByte3: 0,
      unknownByte4: 1,
    });
  }
  getAllCurrentUsedTransientId() {
    const allTransient: any = {};
    for (const key in this._doors) {
      const door = this._doors[key];
      allTransient[door.transientId] = key;
    }
    for (const key in this._props) {
      const prop = this._props[key];
      allTransient[prop.transientId] = key;
    }
    for (const key in this._vehicles) {
      const vehicle = this._vehicles[key];
      allTransient[vehicle.transientId] = key;
    }
    for (const key in this._npcs) {
      const npc = this._npcs[key];
      allTransient[npc.transientId] = key;
    }
    for (const key in this._objects) {
      const object = this._objects[key];
      allTransient[object.transientId] = key;
    }
    return allTransient;
  }
  async fetchLoginInfo() {
    const resolver = new Resolver();
    const loginServerAddress = await new Promise((resolve, reject) => {
      resolver.resolve4("loginserver.h1emu.com", (err, addresses) => {
        if (!err) {
          resolve(addresses[0]);
        } else {
          throw err;
        }
      });
    });
    this._loginServerInfo.address = loginServerAddress as string;
  }
  executeFuncForAllReadyClients(callback: any): void {
    for (const client in this._clients) {
      const clientObj: Client = this._clients[client];
      if (!clientObj.isLoading) {
        callback(clientObj);
      }
    }
  }
  async saveCharacterPosition(client: Client, refreshTimeout = false) {
    if (client?.character) {
      const { position, rotation } = client.character.state;
      await this._db?.collection("characters").updateOne(
        { characterId: client.character.characterId },
        {
          $set: {
            position: position,
            rotation: rotation,
          },
        }
      );
      refreshTimeout && client.savePositionTimer.refresh();
    }
  }
  sendDataToAll(packetName: h1z1PacketsType, obj: any, channel = 0): void {
    const data = this._protocol.pack(packetName, obj);
    for (const a in this._clients) {
      this.sendRawData(this._clients[a], data, channel);
    }
  }
  dropVehicleManager(client: Client, vehicleGuid: string) {
    this.sendManagedObjectResponseControlPacket(client, {
      control: 0,
      objectCharacterId: vehicleGuid,
    });
    client.managedObjects.splice(
      client.managedObjects.findIndex((e: string) => e === vehicleGuid),
      1
    );
    delete this._vehicles[vehicleGuid]?.manager;
  }
  sendZonePopulationUpdate() {
    const populationNumber = _.size(this._characters);
    this._h1emuZoneServer.sendData(
      {
        ...this._loginServerInfo,
        session: true,
      } as any,
      "UpdateZonePopulation",
      { population: populationNumber }
    );
  }
  sendGlobalChatText(message: string, clearChat = false): void {
    for (const a in this._clients) {
      this.sendChatText(this._clients[a], message, clearChat);
    }
  }
  filterOutOfDistance(element: any, playerPosition: Float32Array): boolean {
    return !isPosInRadius(
      (element.npcRenderDistance || this._npcRenderDistance) + 5,
      playerPosition,
      element.position || element.state?.position || element.state.position
    );
  }
  getServerTimeTest(): number {
    debug("get server time");
    const delta = Date.now() - this._startTime;
    return Number(
      (((this._serverTime + delta) * this._timeMultiplier) / 1000).toFixed(0)
    );
  }
  getServerTime(): number {
    debug("get server time");
    const delta = Date.now() - this._startTime;
    return this._serverTime + delta;
  }
  dismissVehicle(vehicleGuid: string) {
    /*
    this.sendDataToAll("PlayerUpdate.RemovePlayerGracefully", {
      characterId: vehicleGuid,
    });
    this.deleteEntity(vehicleGuid, this._vehicles);
    */
  }
  getTransientId(guid: string): number {
    let generatedTransient;
    do {
      generatedTransient = Number(
        (Math.random() * MAX_TRANSIENT_ID).toFixed(0)
      );
    } while (!!this._transientIds[generatedTransient]);
    this._transientIds[generatedTransient] = guid;
    return generatedTransient;
  }
  reloadPackets(client: Client, intervalTime = -1): void {
    this.reloadZonePacketHandlers();
    this._protocol.reloadPacketDefinitions();
    this.sendChatText(client, "[DEV] Packets reloaded", true);
  }
  timeoutClient(client: Client): void {
    if (!!this._clients[client.sessionId]) {
      // if hasn't already deleted
      debug(`Client (${client.soeClientId}) disconnected ( ping timeout )`);
      this.deleteClient(client);
    }
  }

  pSetImmediate = promisify(setImmediate);
  pSetTimeout = promisify(setTimeout)
}

if (process.env.VSCODE_DEBUG === "true") {
  new ZoneServer2016(
    1117,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    process.env.MONGO_URL,
    2
  ).start();
}
