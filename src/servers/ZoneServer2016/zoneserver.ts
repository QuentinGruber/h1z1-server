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

import { PlantingManager } from "./classes/Planting/PlantingManager";

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
import { EntityTypes, Items, LoadoutSlots, ResourceIds, ResourceTypes } from "./enums";
import { healthThreadDecorator } from "../shared/workers/healthWorker";
import { changeFog } from "./workers/dynamicWeather";

import {
    characterEquipment,
    DamageRecord,
    inventoryItem,
    loadoutContainer,
    loadoutItem,
    Weather2016,
} from "../../types/zoneserver";
import { h1z1PacketsType, remoteWeaponPacketsType, remoteWeaponUpdatePacketsType, weaponPacketsType } from "../../types/packets";
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
    generateTransientId,
    objectIsEmpty,
    getRandomFromArray,
    getRandomKeyFromAnObject,
    bigIntToHexString,
    calculateDamageDistFallOff,
    eul2quat,
    isInside,
} from "../../utils/utils";

import { Db, MongoClient } from "mongodb";
import dynamicWeather from "./workers/dynamicWeather";
import { BaseFullCharacter } from "./classes/basefullcharacter";
import { ItemObject } from "./classes/itemobject";
import { DEFAULT_CRYPTO_KEY } from "../../utils/constants";
import { TrapEntity } from "./classes/trapentity";
import { DoorEntity } from "./classes/doorentity";
import { Npc } from "./classes/npc";
import { ExplosiveEntity } from "./classes/explosiveentity";
import { BaseLightweightCharacter } from "./classes/baselightweightcharacter";
import { BaseSimpleNpc } from "./classes/basesimplenpc";
import { TemporaryEntity } from "./classes/temporaryentity";
import { BaseEntity } from "./classes/baseentity";
import { constructionDoor } from "./classes/constructionDoor";
import { constructionFoundation } from "./classes/constructionFoundation";
import { simpleConstruction } from "./classes/simpleConstruction";
import { constructionTilledGround } from "./classes/constructionTilledGround";
import { constructionCrop } from "./classes/constructionCrop";

// need to get 2016 lists
//const spawnLocations = require("../../../data/2016/zoneData/Z1_spawnLocations.json"),
const spawnLocations = require("../../../data/2016/zoneData/Z1_PVFiesta.json"),
  recipes = require("../../../data/2016/sampleData/recipes.json"),
  deprecatedDoors = require("../../../data/2016/sampleData/deprecatedDoors.json"),
  localWeatherTemplates = require("../../../data/2016/dataSources/weather.json"),
  stats = require("../../../data/2016/sampleData/stats.json"),
  itemDefinitions = require("./../../../data/2016/dataSources/ServerItemDefinitions.json"),
  growthDefinitions = require("./../../../data/2016/dataSources/ServerFarmingGrowthDefinitions.json"),
  containerDefinitions = require("./../../../data/2016/dataSources/ContainerDefinitions.json"),
  loadoutSlotItemClasses = require("./../../../data/2016/dataSources/LoadoutSlotItemClasses.json"),
  equipSlotItemClasses = require("./../../../data/2016/dataSources/EquipSlotItemClasses.json"),
  Z1_POIs = require("../../../data/2016/zoneData/Z1_POIs"),
  weaponDefinitions = require("../../../data/2016/dataSources/ServerWeaponDefinitions"),
  equipmentModelTexturesMapping = require("../../../data/2016/sampleData/equipmentModelTexturesMapping.json");

@healthThreadDecorator
export class ZoneServer2016 extends EventEmitter {
    _gatewayServer: GatewayServer;
    _protocol: H1Z1Protocol;
    _db?: Db;
    _soloMode = false;
    private _mongoAddress: string;
    _clientProtocol = "ClientProtocol_1080";
    _dynamicWeatherWorker: any;
    _dynamicWeatherEnabled = true;
    _defaultWeatherTemplate = "z1br";
    _spawnLocations = spawnLocations;
    private _h1emuZoneServer!: H1emuZoneServer;
    _appDataFolder = getAppDataFolderPath();
    _worldId = 0;
    _clients: { [characterId: string]: Client } = {};
    _characters: { [characterId: string]: Character } = {};
    _constructionFoundations: { [characterId: string]: constructionFoundation } = {};
    _constructionDoors: { [characterId: string]: constructionDoor } = {};
    _constructionSimple: { [characterId: string]: simpleConstruction } = {};
    _constructionTilledGround: { [characterId: string]: constructionTilledGround } = {};
    _constructionCrops: { [characterId: string]: constructionCrop } = {};
    _npcs: { [characterId: string]: Npc } = {};
    _spawnedItems: { [characterId: string]: ItemObject } = {};
    _doors: { [characterId: string]: DoorEntity } = {};
    _explosives: { [characterId: string]: ExplosiveEntity } = {};
    _traps: { [characterId: string]: TrapEntity } = {};
    _temporaryObjects: { [characterId: string]: TemporaryEntity } = {};
    _vehicles: { [characterId: string]: Vehicle } = {};
    _props: any = {};
    _speedTrees: any = {};
    _speedTreesCounter: any = {};
    _gameTime: any;
    _serverTime = this.getCurrentTime();
    _startTime = 0;
    _startGameTime = 0;
    _timeMultiplier = 72;
    _cycleSpeed = 100;
    _frozeCycle = false;
    tickRate = 500;
    _transientIds: { [transientId: number]: string } = {};
    _characterIds: { [characterId: string]: number } = {};
    _loginServerInfo: { address?: string; port: number } = {
        address: process.env.LOGINSERVER_IP,
        port: 1110,
    };
    worldRoutineTimer!: NodeJS.Timeout;
    _charactersRenderDistance = 350;
    _allowedCommands: string[] = process.env.ALLOWED_COMMANDS
        ? JSON.parse(process.env.ALLOWED_COMMANDS)
        : [
            "tp",
            //"spawnnpc",
            //"rat",
            //"normalsize",
            //"drive",
            //"parachute",
            //"spawnvehicle",
            "hood",
            //"kit"
        ];
    _interactionDistance = 4;
    _pingTimeoutTime = 120000;
    _weather2016: Weather2016;
    _packetHandlers: zonePacketHandlers;
    _weatherTemplates: any;
    worldObjectManager: WorldObjectManager;
    plantingManager: PlantingManager;
    _ready: boolean = false;
    _itemDefinitions: { [itemDefinitionId: number]: any } = itemDefinitions;
    _growthDefinitions: { [itemDefinitionId: number]: any } = growthDefinitions;
    _weaponDefinitions: { [weaponDefinitionId: number]: any } = weaponDefinitions.WEAPON_DEFINITIONS;
    _firegroupDefinitions: { [firegroupId: number]: any } = weaponDefinitions.FIRE_GROUP_DEFINITIONS;
    _firemodeDefinitions: { [firemodeId: number]: any } = weaponDefinitions.FIRE_MODE_DEFINITIONS;
    itemDefinitionsCache: any;
    weaponDefinitionsCache: any;
    _containerDefinitions: { [containerDefinitionId: number]: any } = containerDefinitions;
    _recipes: { [recipeId: number]: any } = recipes;
    private lastItemGuid: bigint = 0x3000000000000000n;
    private _transientIdGenerator = generateTransientId();

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
    this._packetHandlers = new zonePacketHandlers();
    this._mongoAddress = mongoAddress;
    this._worldId = worldId || 0;
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this._weatherTemplates = localWeatherTemplates;
    this._weather2016 = this._weatherTemplates[this._defaultWeatherTemplate];
    this.worldObjectManager = new WorldObjectManager();
    this.plantingManager = new PlantingManager(null);

    if (!this._mongoAddress) {
      this._soloMode = true;
      debug("Server in solo mode !");
    }
    this.on("data", this.onZoneDataEvent);

    this.on("login", (err, client) => {
      this.onZoneLoginEvent(err, client);
    });

    this._gatewayServer._soeServer.on("fatalError", (soeClient: SOEClient) => {
      const client = this._clients[soeClient.sessionId];
      this.deleteClient(client);
      // TODO: force crash the client
    });
    this._gatewayServer.on(
      "login",
      async (
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
        if (!this._soloMode) {
          zoneClient.isAdmin =
            (await this._db?.collection("admins").findOne({
              sessionId: zoneClient.loginSessionId,
              serverId: this._worldId,
            })) != undefined;
        } else {
          zoneClient.isAdmin = true;
        }
        this._clients[client.sessionId] = zoneClient;
        this._characters[characterId] = zoneClient.character;
        zoneClient.pingTimer = setTimeout(() => {
          this.timeoutClient(zoneClient);
        }, this._pingTimeoutTime);
        this.emit("login", err, zoneClient);
      }
    );
    this._gatewayServer.on("disconnect", (err: string, client: SOEClient) => {
      this.deleteClient(this._clients[client.sessionId]);
    });

    this._gatewayServer.on(
      "tunneldata",
      (err: string, client: SOEClient, data: Buffer, flags: number) => {
        const packet = this._protocol.parse(data, flags);
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
        (err: string, client: H1emuClient) => {
          if (err) {
            debug(
              `An error occured for LoginConnection with ${client.sessionId}`
            );
            console.error(err);
          } else {
            debug(`LoginConnection established for ${client.sessionId}`);
          }
        }
      );

      this._h1emuZoneServer.on(
        "sessionfailed",
        (err: string, client: H1emuClient) => {
          console.error(`h1emuServer sessionfailed for ${client.sessionId}`);
          console.error(err);
          process.exitCode = 11;
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
  }

  onZoneDataEvent(err: any, client: Client, packet: any) {
    if (err) {
      console.error(err);
    } else {
      if (!client) {
        return;
      }
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
  }

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

    client.guid = "0x665a2bff2b44c034"; // default, only matters for multiplayer
    client.character.actorModelId = character.actorModelId;
    client.character.headActor = character.headActor;
    client.character.isRespawning = character.isRespawning;
    client.character.gender = character.gender;
    client.character.creationDate = character.creationDate;
    client.character.lastLoginDate = character.lastLoginDate;
    client.character.hairModel = character.hairModel || "";

    let isRandomlySpawning = false;
    if (
      (_.isEqual(character.position, [0, 0, 0, 1]) &&
        _.isEqual(character.rotation, [0, 0, 0, 1])) ||
      objectIsEmpty(character.position) ||
      objectIsEmpty(character.rotation)
    ) {
      // if position/rotation hasn't changed
      isRandomlySpawning = true;
    }

    if (isRandomlySpawning) {
      // Take position/rotation from a random spawn location.
      const randomSpawnIndex = Math.floor(
        Math.random() * this._spawnLocations.length
      );
      client.character.state.position = new Float32Array(
        this._spawnLocations[randomSpawnIndex].position
      );
      client.character.state.rotation = new Float32Array(
        this._spawnLocations[randomSpawnIndex].rotation
      );
      client.character.spawnLocation =
        this._spawnLocations[randomSpawnIndex].name;
    } else {
      client.character.state.position = new Float32Array(
        Object.values(character.position)
      );
      client.character.state.rotation = new Float32Array(
        Object.values(character.rotation)
      );
    }

    this.giveStartingEquipment(client, false, true);
    this.giveStartingItems(client, false);
  }

  pGetInventoryItems(client: Client): any[] {
    const items: any[] = Object.values(client.character._loadout)
    .filter((slot) => {
      if (slot.itemDefinitionId) {
        return true;
      }
    })
    .map((slot) => {
      return this.pGetItemData(client.character, slot, 101);
    });
    Object.values(client.character._containers).forEach((container) => {
      Object.values(container.items).forEach((item) => {
        items.push(this.pGetItemData(client.character, item, container.containerDefinitionId))
      })
    })
    return items;
  }

  async sendCharacterData(client: Client) {
    await this.loadCharacterData(client);
    const containers = this.initializeContainerList(client, false);
    this.sendData(client, "SendSelfToClient", {
      data: {
        ...client.character.pGetLightweight(),
        guid: client.guid,
        hairModel: client.character.hairModel,
        isRespawning: client.character.isRespawning,
        gender: client.character.gender,
        creationDate: client.character.creationDate,
        lastLoginDate: client.character.lastLoginDate,
        identity: {
          characterName: client.character.name,
        },
        inventory: {
          items: this.pGetInventoryItems(client),
          //unknownDword1: 2355
        },
        recipes: Object.values(this._recipes),
        stats: stats
        /*()=>{
          const stats = [];
          for(let i =0; i >= 89; i++) {
            stats.push({
              "statId": i,
              "statData": {
                  "statId": i,
                  "statValue": {
                      "type": 1,
                      "value": {
                          "base": randomIntFromInterval(0, 2),
                          "modifier": 0
                      }
                  }
              }
            });
          }
          return stats;
        }*/,
        loadoutSlots: client.character.pGetLoadoutSlots(),
        equipmentSlots: client.character.pGetEquipment(),
        characterResources: client.character.pGetResources(),
        containers: containers,/*
        FIRE_MODES_1: [
          { FIRE_MODE_ID: 366 },
          { FIRE_MODE_ID: 367 },
          { FIRE_MODE_ID: 368 },
        ],
        FIRE_MODES_2: [
          { FIRE_MODE_ID: 539 },
          { FIRE_MODE_ID: 540 },
        ],*/
        profiles: [ // CORRECT profileId for loadoutId 3
          /*{
            profileId: 5,
            nameId: 66,
            descriptionId: 66,
            type: 3,
            unknownDword1: 0,
            unknownArray1: []
          }*/
          /*{profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},
          {profileId: 0},*/
        ],
        currentProfile: 0,
        //unknownQword1: client.character.characterId,
        //unknownDword38: 1,
        //vehicleLoadoutRelatedQword: client.character.characterId,
        //unknownQword3: client.character.characterId,
        //vehicleLoadoutRelatedDword: 1,
        //unknownDword40: 1
      },
    });

    this.sendData(client, "Container.InitEquippedContainers", {
      ignore: client.character.characterId,
      characterId: client.character.characterId,
      containers: containers,
    });


    this._characters[client.character.characterId] = client.character; // character will spawn on other player's screen(s) at this point
  }

  async fetchZoneData(): Promise<void> {
    if (this._mongoAddress) {
      const mongoClient = new MongoClient(this._mongoAddress, {
        maxPoolSize: 50,
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
      (await mongoClient.db("h1server").collections()).length ||
        (await initMongo(mongoClient, debugName));
      this._db = mongoClient.db("h1server");
    }
  }

  async loadVehicleData() {
    const vehiclesArray: any = await this._db
      ?.collection("vehicles")
      .find({ worldId: this._worldId })
      .toArray();
    for (let index = 0; index < vehiclesArray.length; index++) {
      const vehicle = vehiclesArray[index];
      const vehicleData = new Vehicle(
        vehicle.characterId,
        vehicle.transientId,
        vehicle.actorModelId,
        new Float32Array(vehicle.state.position),
        new Float32Array(vehicle.state.rotation),
        this._gameTime
      );
      this.worldObjectManager.createVehicle(this, vehicleData);
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

      const npcsArray: any = await this._db
        ?.collection("npcs")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < npcsArray.length; index++) {
        const npc = npcsArray[index];
        this._npcs[npc.characterId] = npc;
      }
      this._spawnedItems = {};
      const objectsArray: any = await this._db
        ?.collection("objects")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < objectsArray.length; index++) {
        const object = objectsArray[index];
        this._spawnedItems[object.characterId] = object;
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
          .insertMany(Object.values(this._spawnedItems));
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
          .insertMany(Object.values(this._spawnedItems));
        debug("World saved!");
      }
    }
  }

  packItemDefinitions() {
    this.itemDefinitionsCache = this._protocol.pack("Command.ItemDefinitions", {
      // cache itemDefinitions so server doesn't have to spend time packing for each
      // character login
      data: {
        itemDefinitions: Object.values(this._itemDefinitions).map((itemDef: any) => {
          return {
            ID: itemDef.ID,
            definitionData: {
              ...itemDef,
              HUD_IMAGE_SET_ID: itemDef.IMAGE_SET_ID,
              ITEM_TYPE_1: itemDef.ITEM_TYPE,
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

  packWeaponDefinitions() {
    this.weaponDefinitionsCache = this._protocol.pack("ReferenceData.WeaponDefinitions", {
      // cache weaponDefinitions so server doesn't have to spend time packing for each
      // character login
      data: {
        definitionsData: {
          WEAPON_DEFINITIONS: Object.values(weaponDefinitions.WEAPON_DEFINITIONS),
          FIRE_GROUP_DEFINITIONS: Object.values(weaponDefinitions.FIRE_GROUP_DEFINITIONS),
          FIRE_MODE_DEFINITIONS: Object.values(weaponDefinitions.FIRE_MODE_DEFINITIONS),
          PLAYER_STATE_GROUP_DEFINITIONS: Object.values(weaponDefinitions.PLAYER_STATE_GROUP_DEFINITIONS),
          FIRE_MODE_PROJECTILE_MAPPING_DATA: Object.values(weaponDefinitions.FIRE_MODE_PROJECTILE_MAPPING_DATA),
          AIM_ASSIST_DEFINITIONS: Object.values(weaponDefinitions.AIM_ASSIST_DEFINITIONS),
        }
      }
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
    this.packWeaponDefinitions();

    // other entities are handled by worldRoutine
    this.worldObjectManager.createDoors(this);

    if (!this._soloMode) {
      debug("Starting H1emuZoneServer");
      if (!this._loginServerInfo.address) {
        await this.fetchLoginInfo();
      }
      this._h1emuZoneServer.setLoginInfo(this._loginServerInfo, {
        serverId: this._worldId,
        h1emuVersion: process.env.H1Z1_SERVER_VERSION,
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

  sendInitData(client: Client) {
    this.sendData(client, "InitializationParameters", {
      ENVIRONMENT: "LIVE",
      unknownString1: "",
      rulesetDefinitions: [/*
        {
          unknownDword1: 1,
          unknownDword2: 1,
          ruleset: "Permadeath",
          unknownString2: "",
          rulesets: [
            {
              ID: 1,
              DATA: {
                ID: 1,
                RULESET_ID: 1,
                CONTENT_PACK_ID: 112,
                CONTENT_PACK_ACTION_ID: 1,
              }
            }
          ]
        },
        {
          unknownDword1: 3,
          unknownDword2: 3,
          ruleset: "Headshots",
          unknownString2: "",
          rulesets: []
        },
        {
          unknownDword1: 4,
          unknownDword2: 4,
          ruleset: "FirstPersonOnly",
          unknownString2: "",
          rulesets: []
        },
        {
          unknownDword1: 5,
          unknownDword2: 5,
          ruleset: "PvE", //  could be "Normal"
          unknownString2: "",
          rulesets: [
            {
              ID: 3,
              DATA: {
                ID: 3,
                RULESET_ID: 5,
                CONTENT_PACK_ID: 119,
                CONTENT_PACK_ACTION_ID: 2,
              }
            },
          ]
        },
        {
          unknownDword1: 6,
          unknownDword2: 6,
          ruleset: "BattleRoyale",
          unknownString2: "",
          rulesets: [
            
          ]
        },*/
      ]
    });
    
    this.sendData(client, "SendZoneDetails", {
      zoneName: "Z1",
      zoneType: 4,
      unknownBoolean1: false,
      skyData: this._weather2016,
      zoneId1: 5,
      zoneId2: 5,
      nameId: 7699,
      unknownBoolean2: true,
      lighting: "Lighting.txt",
      unknownBoolean3: false
    });
    
    if (!this.itemDefinitionsCache) {
      this.packItemDefinitions();
    }
    // disabled since it breaks weapon inspect
    //this.sendRawData(client, this.itemDefinitionsCache);
    if (!this.weaponDefinitionsCache) {
      this.packWeaponDefinitions();
    }
    this.sendRawData(client, this.weaponDefinitionsCache);
    // packet is just broken, idk why
    /*
    this.sendData(client, "ClientBeginZoning", {
      //position: Array.from(client.character.state.position),
      //rotation: Array.from(client.character.state.rotation),
      skyData: this._weather2016,
    });
    */

    this.sendData(client, "ClientGameSettings", {
      Unknown2: 0,
      interactGlowAndDist: 3,// 3
      unknownBoolean1: true,
      timescale: 1.0,
      enableWeapons: 1,
      Unknown5: 1,
      unknownFloat1: 0.0,
      unknownFloat2: 15,
      damageMultiplier: 11,
    });

    this.sendCharacterData(client);
  }

  worldRoutine(refresh = false) {
        debug("WORLDROUTINE");
        this.executeFuncForAllReadyClients((client: Client) => {
            this.vehicleManager(client);
            this.removeOutOfDistanceEntities(client);
            this.spawnCharacters(client);
            this.spawnItemObjects(client);
            this.spawnDoors(client);
            this.spawnNpcs(client);
            this.spawnConstructionNpcs(client);
            this.spawnExplosives(client);
            this.spawnTraps(client);
            this.spawnTemporaryObjects(client);
            this.POIManager(client);
            this.foundationPermissionChecker(client);
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
      const soeClient = this.getSoeClient(client.soeClientId);
      if (soeClient) {
        this._gatewayServer._soeServer.deleteClient(soeClient);
      }
      if (!this._soloMode) {
        this.sendZonePopulationUpdate();
      }
    }
  }

  generateDamageRecord(targetClient: Client, sourceClient: Client, hitReport: any, damage: number): DamageRecord {
    const sCharacter = sourceClient.character,
    tCharacter = targetClient.character;
    return {
      source: {
        name: sCharacter.name || "Unknown"
      },
      target: {
        name: tCharacter.name || "Unknown"
      },
      hitInfo: {
        timestamp: Date.now(),
        weapon: this.getItemDefinition(sCharacter.getEquippedWeapon().itemDefinitionId).MODEL_NAME,
        distance: getDistance(sCharacter.state.position, tCharacter.state.position).toFixed(1),
        hitLocation: hitReport?.hitLocation || "Unknown",
        hitPosition: hitReport?.position || new Float32Array([0, 0, 0, 0]),
        damage: damage
      }
    }
  }

  killCharacter(client: Client, deathInfo: {client: Client, hitReport: any} | undefined = undefined) {
    const character = client.character;
    if (character.isAlive) {
      debug(character.name + " has died");
      if(deathInfo?.client) {
        this.sendAlertToAll(`${deathInfo.client.character.name} has killed ${client.character.name}!`);
      }
      client.character.isRunning = false;
      client.character.characterStates.knockedOut = true;
      this.updateCharacterState(
        client,
        client.character.characterId,
        client.character.characterStates,
        false
      );
      if (!client.isLoading) {
            this.sendDataToAllWithSpawnedEntity(
                this._characters,
                client.character.characterId,
                "Character.StartMultiStateDeath",
                {
                    characterId: client.character.characterId,
                }
            );
        } else {
            this.sendDataToAllOthersWithSpawnedEntity(
                this._characters,
                client,
                client.character.characterId,
                "Character.StartMultiStateDeath",
                {
                    characterId: client.character.characterId,
                }
            );
        }
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
        if (getDistance(position, explosiveObj.state.position) < 2) {
          await Scheduler.wait(150);
          this.explodeExplosive(explosiveObj);
        }
      }
    }
  }

  damageVehicle(damage: number, vehicle: Vehicle) {
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
      vehicle._resources[ResourceIds.CONDITION] -= damage;
      if (vehicle._resources[ResourceIds.CONDITION] <= 0) {
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
          vehicle._resources[ResourceIds.CONDITION] <= 50000 &&
          vehicle._resources[ResourceIds.CONDITION] > 35000
        ) {
          if (vehicle.destroyedState != 1) {
            damageeffect = minorDamageEffect;
            allowSend = true;
            vehicle.destroyedState = 1;
          }
        } else if (
          vehicle._resources[ResourceIds.CONDITION] <= 35000 &&
          vehicle._resources[ResourceIds.CONDITION] > 20000
        ) {
          if (vehicle.destroyedState != 2) {
            damageeffect = majorDamageEffect;
            allowSend = true;
            vehicle.destroyedState = 2;
          }
        } else if (
          vehicle._resources[ResourceIds.CONDITION] <= 20000 &&
          vehicle._resources[ResourceIds.CONDITION] > 10000
        ) {
          if (vehicle.destroyedState != 3) {
            damageeffect = criticalDamageEffect;
            allowSend = true;
            startDamageTimeout = true;
            vehicle.destroyedState = 3;
          }
        } else if (vehicle._resources[ResourceIds.CONDITION] <= 10000) {
          if (vehicle.destroyedState != 4) {
            damageeffect = supercriticalDamageEffect;
            allowSend = true;
            startDamageTimeout = true;
            vehicle.destroyedState = 4;
          }
        } else if (
          vehicle._resources[ResourceIds.CONDITION] > 50000 &&
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
          this._vehicles[vehicle.characterId].destroyedEffect = damageeffect;
          if (!vehicle.damageTimeout && startDamageTimeout) {
            this.startVehicleDamageDelay(vehicle);
          }
        }

        this.updateResourceToAllWithSpawnedVehicle(
          vehicle.passengers.passenger1,
          vehicle.characterId,
          vehicle._resources[ResourceIds.CONDITION],
          ResourceIds.CONDITION,
          ResourceTypes.CONDITION
        );
      }
    }
  }

  destroyVehicle(
    vehicle: Vehicle,
    destroyedVehicleEffect: number,
    destroyedVehicleModel: number
  ) {
    vehicle._resources[ResourceIds.CONDITION] = 0;
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
        vehicle.characterId === this._clients[c].vehicle.mountedVehicle &&
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
        vehicle._resources[ResourceIds.CONDITION] < 20000 &&
        vehicle._resources[ResourceIds.CONDITION] > 0
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
    client.character._resources[ResourceIds.HEALTH] = 10000;
    client.character._resources[ResourceIds.HUNGER] = 10000;
    client.character._resources[ResourceIds.HYDRATION] = 10000;
    client.character._resources[ResourceIds.STAMINA] = 600;
    client.character._resources[ResourceIds.BLEEDING] = -40;
    client.character.healingTicks = 0;
    client.character.healingMaxTicks = 0;
    client.character.resourcesUpdater.refresh();
    client.character.characterStates.knockedOut = false;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      true
    );
    this.sendData(client, "Character.RespawnReply", {
      characterId: client.character.characterId,
      status: 1,
    });
    const randomSpawnIndex = Math.floor(
      Math.random() * this._spawnLocations.length
    );
    this.sendData(client, "ClientUpdate.UpdateLocation", {
      position: spawnLocations[randomSpawnIndex].position,
    });
    this.clearInventory(client);
    this.giveStartingEquipment(client, true, true);
    this.giveStartingItems(client, true);
    client.character.state.position =
      this._spawnLocations[randomSpawnIndex].position;
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HEALTH],
      ResourceIds.HEALTH
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.STAMINA],
      ResourceIds.STAMINA
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HUNGER],
      ResourceIds.HUNGER
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HYDRATION],
      ResourceIds.HYDRATION
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.BLEEDING],
      ResourceIds.BLEEDING
    );
    
    // fixes characters showing up as dead if they respawn close to other characters
    this.sendDataToAllOthersWithSpawnedEntity(this._characters, client, client.character.characterId, "Character.RemovePlayer", {
      characterId: client.character.characterId
    })
    const vehicleId = client.vehicle.mountedVehicle,
          vehicle = vehicleId ? this._vehicles[vehicleId] : false;
    setTimeout(()=> {
      if(!client?.character) return;
      this.sendDataToAllOthersWithSpawnedEntity(this._characters, client, client.character.characterId, "AddLightweightPc", {
        ...client.character.pGetLightweight(),
        identity: {
          characterName: client.character.name,
        },
        mountGuid: vehicleId || "",
        mountSeatId: vehicle
          ? vehicle.getCharacterSeat(client.character.characterId)
          : 0,
        mountRelatedDword1: vehicle ? 1 : 0,
      })
    }, 2000)
    
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
        let allowDes = false;
        let count = 1;
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
                        this.lootItem(client, this.generateItem(Items.WEAPON_BRANCH), 1);
                    }
                    allowDes = true;
                    count = randomIntFromInterval(1, 2);
                    break;
                case "SpeedTree.DevilClub":
                case "SpeedTree.VineMaple":
                    itemDefId = 111;
                    allowDes = true;
                    count = randomIntFromInterval(1, 2);
                    break;
                default: // default case for cutting trees
                    if (!this._speedTreesCounter[packet.data.id]) {
                        this._speedTreesCounter[packet.data.id] = { hitPoints: randomIntFromInterval(12, 19) }; // add a new tree key with random level of hitpoints
                    } else {
                        if (this._speedTreesCounter[packet.data.id].hitPoints-- == 0) {
                            allowDes = true;
                            delete this._speedTreesCounter[packet.data.id] // If out of health destroy tree and delete its key
                            itemDefId = 16;
                            count = randomIntFromInterval(2, 6)
                        }
                    }
                    break;
            }
            if (itemDefId) {
                this.lootContainerItem(client, this.generateItem(itemDefId), count);
            }
            if (allowDes) {
                this.speedTreeDestroy(packet);
            }
        }
    }

  updateResource(
    client: Client,
    entityId: string,
    value: number,
    resourceId: number,
    resourceType = resourceId // most resources have the same id and type
  ) {
    this.sendData(client, "ResourceEvent", {
      eventData: {
        type: 3,
        value: {
          characterId: entityId,
          resourceId: resourceId,
          resourceType: resourceType,
          initialValue: value>=0?value:0,
        },
      },
    });
  }

  updateResourceToAllWithSpawnedCharacter(
    client: Client,
    entityId: string,
    value: number,
    resourceId: number,
    resourceType = resourceId // most resources have the same id and type
  ) {
    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "ResourceEvent",
      {
        eventData: {
          type: 3,
          value: {
            characterId: entityId,
            resourceId: resourceId,
            resourceType: resourceType,
            initialValue: value>=0?value:0,
          },
        },
      }
    );
  }

  updateResourceToAllWithSpawnedVehicle(
    client: Client,
    entityId: string,
    value: number,
    resourceId: number,
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
            resourceId: resourceId,
            resourceType: resourceType,
            initialValue: value>=0?value:0,
          },
        },
      }
    );
  }
  
  getEntityType(entityKey: string): number {
        switch (true) {
            case !!this._npcs[entityKey]:
                return EntityTypes.NPC;
            case !!this._vehicles[entityKey]:
                return EntityTypes.VEHICLE;
            case !!this._characters[entityKey]:
                return EntityTypes.PLAYER;
            case !!this._spawnedItems[entityKey]:
                return EntityTypes.OBJECT;
            case !!this._doors[entityKey]:
                return EntityTypes.DOOR;
            case !!this._explosives[entityKey]:
                return EntityTypes.EXPLOSIVE;
            case !!this._constructionFoundations[entityKey]:
                return EntityTypes.CONSTRUCTION_FOUNDATION;
            case !!this._constructionDoors[entityKey]:
                return EntityTypes.CONSTRUCTION_DOOR;
            case !!this._constructionSimple[entityKey]:
                return EntityTypes.CONSTRUCTION_SIMPLE;
            case !!this._constructionTilledGround[entityKey]:
                return EntityTypes.CONSTRUCTION_TILLEDGROUND;
            case !!this._constructionCrops[entityKey]:
                return EntityTypes.CONSTRUCTION_CROP;
            default:
                return EntityTypes.INVALID;
        }
    }
    
    damageItem(client: Client, item: loadoutItem, damage: number) {
        item.currentDurability -= damage;
        if (item.currentDurability <= 0) {
            this.removeInventoryItem(client, item)
            if (this.isWeapon(item.itemDefinitionId)) {
                this.lootContainerItem(client, this.generateItem(1354), 1, true);
            }
            return;
        }
        this.updateLoadoutItem(client, item)
    }

    npcDamage(characterId: string, damage: number) {
        if ((this._npcs[characterId].health -= damage) <= 0) {
            this._npcs[characterId].flags.c = 127;
            this.sendDataToAllWithSpawnedEntity(
                this._npcs,
                characterId,
                "Character.StartMultiStateDeath",
                {
                    characterId: characterId,
                }
            );
        }
    }

    getClientByCharId(characterId: string) {
        for (const a in this._clients) {
            const c: Client = this._clients[a];
            if (c.character.characterId === characterId) {
                return c
            }
        }
    }

    hasHelmet(characterId: string): boolean {
      const c = this.getClientByCharId(characterId),
      slot = c?.character._loadout[LoadoutSlots.HEAD],
      itemDef = this.getItemDefinition(slot?.itemDefinitionId);
      if(!slot || !itemDef) return false;
      return slot.itemDefinitionId >= 0 && itemDef.ITEM_CLASS == 25000 && itemDef.IS_ARMOR;
    }

    checkHelmet(packet: any, damage: number, helmetDamageDivder = 1): number {
        const c = this.getClientByCharId(packet.hitReport.characterId);
        if (!c || !this.hasHelmet(c.character.characterId)) {
            return damage;
        }
        damage *= 0.75;
        this.damageItem(c, c.character._loadout[LoadoutSlots.HEAD], damage / helmetDamageDivder);
        return damage;
    }

    hasArmor(characterId: string): boolean {
      const c = this.getClientByCharId(characterId),
      slot = c?.character._loadout[LoadoutSlots.ARMOR],
      itemDef = this.getItemDefinition(slot?.itemDefinitionId);
      if(!slot || !itemDef) return false;
      return slot.itemDefinitionId >= 0 && itemDef.ITEM_CLASS == 25041;
    }

    checkArmor(packet: any, damage: any, kevlarDamageDivider = 4): number {
        const c = this.getClientByCharId(packet.hitReport.characterId),
        slot = c?.character._loadout[LoadoutSlots.ARMOR],
        itemDef = this.getItemDefinition(slot?.itemDefinitionId);
        if (!c || !slot || !slot.itemDefinitionId || !itemDef) {
            return damage;
        }
          if (itemDef.DESCRIPTION_ID == 12073) {
              damage *= 0.5; // was 0.8
              this.damageItem(c, c.character._loadout[LoadoutSlots.ARMOR], (damage / kevlarDamageDivider));
          } else if (itemDef.DESCRIPTION_ID == 11151) {
              damage *= 0.7; // was 0.9
              this.damageItem(c, c.character._loadout[LoadoutSlots.ARMOR], (damage / kevlarDamageDivider));
          }
        return damage;
    }
    
    registerHit(client: Client, packet: any) {
      const characterId = packet.hitReport.characterId,
      entityType = this.getEntityType(packet.hitReport.characterId);
      let hitEntity;
      let damageEntity;
      switch (entityType) {
        case EntityTypes.NPC:
            if(!this._npcs[characterId] || this._npcs[characterId].flags.c == 127 ) {
              return;
            }
            damageEntity = ()=> {
              this.npcDamage(characterId, damage);
            }
            hitEntity = this._npcs[characterId];
            break;
        case EntityTypes.VEHICLE:
            if(!this._vehicles[characterId]) {
              return;
            }
            damageEntity = ()=> {
              this.damageVehicle(damage, this._vehicles[characterId])
            }
            hitEntity = this._vehicles[characterId];
            break;
        case EntityTypes.PLAYER:
          if(!this._characters[characterId] || this._characters[characterId].characterStates.knockedOut) {
            return;
          }
          damageEntity = ()=> {
            const c = this.getClientByCharId(characterId);
            if (!c) {
                return;
            }
            let causeBleed: boolean = true;
            if (canStopBleed && this.hasArmor(c.character.characterId)) {
                causeBleed = false;
            }
            this.sendDataToAllWithSpawnedEntity(
                        this._characters,
                        c.character.characterId,
                        "Character.PlayWorldCompositeEffect", {
                        characterId: c.character.characterId,
                        effectId: hitEffect,
                        position: [
                            packet.hitReport.position[0] + 0.1, packet.hitReport.position[1], packet.hitReport.position[2] + 0.1, 1
                        ],
                    });
            this.playerDamage(c, damage, {client: client, hitReport: packet.hitReport}, causeBleed);
          }
          hitEntity = this._characters[characterId];
          break;
        case EntityTypes.EXPLOSIVE:
          this.explodeExplosive(this._explosives[characterId]);
          return;
        default:
          return;
    }
        let damage: number,
            isHeadshot = 0,
            canStopBleed = false,
            hitEffect = 0,
            isShotgun = false;
        switch (client.character.getEquippedWeapon().itemDefinitionId) {
            case Items.WEAPON_AR15:
            case Items.WEAPON_1911:
                damage = 2500;
                hitEffect = 1165;
                break;
            case Items.WEAPON_M9:
                damage = 1800;
                hitEffect = 1165;
                break;
            case Items.WEAPON_R380:
                damage = 1500;
                hitEffect = 1165;
                break;
            case Items.WEAPON_SHOTGUN:
                isShotgun = true;
                damage = 1200; // 1 pellet (was 1667)
                damage = calculateDamageDistFallOff(
                  getDistance(client.character.state.position, hitEntity.state.position),
                  damage,
                  .5
                )
                hitEffect = 1302;
                break;
            case Items.WEAPON_AK47:
                damage = 2900;
                hitEffect = 1165;
                break;
            case Items.WEAPON_308:
                damage = 8000;
                hitEffect = 5414;
                break;
            case Items.WEAPON_MAGNUM:
                damage = 3000;
                hitEffect = 1165;
                break;
            default:
                damage = 1000;
                hitEffect = 1165;
                break;
        }
        const hasArmor = this.hasArmor(characterId),
        hasHelmet = this.hasHelmet(characterId);
        switch (packet.hitReport.hitLocation.toLowerCase()) {
            case 'head':
            case 'glasses':
            case 'neck':
              damage *= 4;
              isHeadshot = 1;
              damage = this.checkHelmet(packet, damage, isShotgun?100:1);
              break;
            default:
              damage = this.checkArmor(packet, damage, isShotgun?10:4)
              canStopBleed = true;
              break;
        }
        if (packet.hitReport.hitLocation) {
            this.sendData(client, "Ui.ConfirmHit", {
                hitType: {
                    isAlly: 0,
                    isHeadshot: isHeadshot,
                    damagedArmor: 0, // todo: check if kevlar broke or not
                    crackedArmor: 
                      isHeadshot && hasHelmet?1:0 || 
                      !isHeadshot && hasArmor?1:0,
                }
            });
        }
        damageEntity();
    }
  
  playerDamage(client: Client, damage: number, damageInfo: {client: Client, hitReport: any} | undefined = undefined, causeBleeding: boolean = false) {
        const character = client.character;
        if (
            !client.character.godMode &&
            client.character.isAlive &&
            client.character.characterId
        ) {
            if (damage < 100) {
                return;
            }
            if (causeBleeding) {
                if (randomIntFromInterval(0, 100) < damage / 100 && damage > 500) {
                    client.character._resources[ResourceIds.BLEEDING] += 41;
                    if (damage > 4000) {
                        client.character._resources[ResourceIds.BLEEDING] += 41;
                    }
                    this.updateResourceToAllWithSpawnedCharacter(
                        client,
                        client.character.characterId,
                        client.character._resources[ResourceIds.BLEEDING],
                        ResourceIds.BLEEDING
                    );
                }
            }
            character._resources[ResourceIds.HEALTH] -= damage;
            if (character._resources[ResourceIds.HEALTH] <= 0) {
                character._resources[ResourceIds.HEALTH] = 0;
                this.killCharacter(client, damageInfo);
            }
            this.updateResource(
                client,
                character.characterId,
                character._resources[ResourceIds.HEALTH],
                ResourceIds.HEALTH
            );
            if (!damageInfo?.client.character) {
                return
            }
            const damageRecord = this.generateDamageRecord(client, damageInfo.client, damageInfo.hitReport, damage);
            client.character.addCombatlogEntry(damageRecord);
            damageInfo.client.character.addCombatlogEntry(damageRecord);
            this.combatLog(client);
            this.combatLog(damageInfo.client);
            const orientation = Math.atan2(client.character.state.position[2] - damageInfo?.client.character.state.position[2], client.character.state.position[0] - damageInfo?.client.character.state.position[0]) * -1 - 1.4;
            this.sendData(client, "ClientUpdate.DamageInfo", {
                transientId: 0,
                orientationToSource: orientation,
                unknownDword2: 100,
            });
        }
    }

  setGodMode(client: Client, godMode: boolean) {
    client.character.godMode = godMode;
    client.character.characterStates.invincibility = godMode;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      false
    );
  }

  toggleHiddenMode(client: Client) {
    client.character.isHidden = !client.character.isHidden;
    client.character.characterStates.gmHidden = client.character.isHidden;
    this.updateCharacterState(
      client,
      client.character.characterId,
      client.character.characterStates,
      false
    );
  }

  tempGodMode(client: Client, durationMs: number) {
    if (!client.character.godMode) {
      this.setGodMode(client, true);
      setTimeout(() => {
        this.setGodMode(client, false);
      }, durationMs);
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

  customizeDTO(client: Client) {
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
  ) {
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

  forceTime(time: number) {
    this._cycleSpeed = 0.1;
    this._frozeCycle = true;
    this._gameTime = time;
  }

  removeForcedTime() {
    this._cycleSpeed = 100;
    this._frozeCycle = false;
    this._gameTime = Date.now();
  }

  removeOutOfDistanceEntities(client: Client) {
    // does not include vehicles
    const objectsToRemove = client.spawnedEntities.filter(
      (e) =>
        (e && // in case if entity is undefined somehow
        !e.vehicleId &&
        this.filterOutOfDistance(e, client.character.state.position))
    );
    client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });
    objectsToRemove.forEach((object: any) => {
      this.sendData(client, "Character.RemovePlayer", {
        characterId: object.characterId,
      });
    });
  }

  despawnEntity(characterId: string) {
    this.sendDataToAll("Character.RemovePlayer", {
      characterId: characterId,
    });
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

    delete this._transientIds[this._characterIds[characterId]];
    delete this._characterIds[characterId];
  }

  sendManagedObjectResponseControlPacket(client: Client, obj: any) {
    this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", obj);
  }

  addLightweightNpc(client: Client, entity: BaseLightweightCharacter) {
    this.sendData(client, "AddLightweightNpc", entity.pGetLightweight());
  }
  addSimpleNpc(client: Client, entity: BaseSimpleNpc) {
    this.sendData(client, "AddSimpleNpc", entity.pGetSimpleNpc());
  }
  
  foundationPermissionChecker(client: Client) {
        for (const a in this._constructionFoundations) {
            const foundation = this._constructionFoundations[a] as constructionFoundation;
            if (!foundation.isSecured || foundation.itemDefinitionId === Items.FOUNDATION_EXPANSION) continue;
            let allowed = false;
            let detectRange = 2.2;
            foundation.permissions.forEach((element: any) => {
                if (element.characterId === client.character.characterId && element.visit) {
                    allowed = true;
                }
            })
            if (allowed) continue;
            if (foundation.itemDefinitionId === Items.FOUNDATION || foundation.itemDefinitionId === Items.GROUND_TAMPER) {
                if (this.checkInsideFoundation(foundation, client.character)) {
                    this.sendChatText(client, "Construction: no visitor permission")
                    const range = 15,
                        lat = foundation.state.position[0],
                        long = foundation.state.position[2];
                    const currentAngle = 0;
                    const x2 = Math.cos(currentAngle) * range;
                    const y2 = Math.sin(currentAngle) * range;
                    const p = [lat + x2, long + y2];
                    client.character.state.position = new Float32Array([
                        p[0],
                        client.character.state.position[1] + 1,
                        p[1],
                        1,
                    ]);
                    this.sendData(client, "ClientUpdate.UpdateLocation", {
                        position: [
                            p[0],
                            client.character.state.position[1],
                            p[1],
                            1,
                        ],
                        unknownBool2: false
                    });
                }
            } else if (foundation.itemDefinitionId === Items.SHACK) {
                if (
                    isPosInRadius(
                        detectRange,
                        client.character.state.position,
                        foundation.state.position
                    )) {
                    this.sendChatText(client, "Construction: no visitor permission")
                    const range = 5,
                        lat = foundation.state.position[0],
                        long = foundation.state.position[2];
                    const currentAngle = 0;
                    const x2 = Math.cos(currentAngle) * range;
                    const y2 = Math.sin(currentAngle) * range;
                    const p = [lat + x2, long + y2];
                    client.character.state.position = new Float32Array([
                        p[0],
                        client.character.state.position[1] + 1,
                        p[1],
                        1,
                    ]);
                    this.sendData(client, "ClientUpdate.UpdateLocation", {
                        position: [
                            p[0],
                            client.character.state.position[1],
                            p[1],
                            1,
                        ],
                        unknownBool2: false
                    });

                }
            }
        }
    }

    checkInsideFoundation(foundation: constructionFoundation, entity: any) {
        return isInside([entity.state.position[0], entity.state.position[2]], foundation.securedPolygons)
    }

  spawnNpcs(client: Client) {
    for (const characterId in this._npcs) {
      const npc = this._npcs[characterId];
      if (
        isPosInRadius(
          npc.npcRenderDistance,
          client.character.state.position,
          npc.state.position
        ) &&
        !client.spawnedEntities.includes(npc)
      ) {
        this.addLightweightNpc(client, npc);
        this.updateEquipment(client, npc); // TODO: maybe we can already add the equipment to the npc?
        client.spawnedEntities.push(npc);
      }
    }
  }
  
  spawnConstructionNpcs(client: Client) {
        for (const characterId in this._constructionFoundations) {
            const npc = this._constructionFoundations[characterId];
            if (
                isPosInRadius(
                    500,
                    client.character.state.position,
                    npc.state.position
                ) &&
                !client.spawnedEntities.includes(npc)
            ) {
                this.addLightweightNpc(client, npc);
                client.spawnedEntities.push(npc);
            }
        }

        for (const characterId in this._constructionDoors) {
            const npc = this._constructionDoors[characterId];
            if (
                isPosInRadius(
                    500,
                    client.character.state.position,
                    npc.state.position
                ) &&
                !client.spawnedEntities.includes(npc)
            ) {
                this.addLightweightNpc(client, npc);
                client.spawnedEntities.push(npc);
            }
        }

        for (const characterId in this._constructionSimple) {
            const object = this._constructionSimple[characterId];
            if (
                isPosInRadius(
                    30,
                    client.character.state.position,
                    object.state.position
                ) &&
                !client.spawnedEntities.includes(object)
            ) {
                this.addSimpleNpc(client, object);
                client.spawnedEntities.push(object);
            }
        }

        for (const characterId in this._constructionTilledGround) {
          const npc = this._constructionTilledGround[characterId];
          if (
            isPosInRadius(
              500,
              client.character.state.position,
              npc.state.position
            ) &&
            !client.spawnedEntities.includes(npc)
          ) {
            this.addLightweightNpc(client, npc);
            client.spawnedEntities.push(npc);
          }
        }

        for (const characterId in this._constructionCrops) {
          const npc = this._constructionCrops[characterId];
          if (
            isPosInRadius(
              500,
              client.character.state.position,
              npc.state.position
            ) &&
            !client.spawnedEntities.includes(npc)
          ) {
            
            this.addLightweightNpc(client, npc);
            client.spawnedEntities.push(npc);
          }
        }
    }

  spawnExplosives(client: Client) {
    for (const characterId in this._explosives) {
      const explosive = this._explosives[characterId];
      if (
        isPosInRadius(
          explosive.npcRenderDistance as number,
          client.character.state.position,
          explosive.state.position
        ) &&
        !client.spawnedEntities.includes(explosive)
      ) {
        this.addLightweightNpc(client, explosive);
        client.spawnedEntities.push(explosive);
      }
    }
  }

  spawnTraps(client: Client) {
    for (const characterId in this._traps) {
      const trap = this._traps[characterId];
      if (
        isPosInRadius(
          trap.npcRenderDistance as number,
          client.character.state.position,
          trap.state.position
        ) &&
        !client.spawnedEntities.includes(trap)
      ) {
        this.addSimpleNpc(client, trap);
        client.spawnedEntities.push(trap);
      }
    }
  }

  spawnTemporaryObjects(client: Client) {
    for (const characterId in this._temporaryObjects) {
      const tempObj = this._temporaryObjects[characterId];
      if (
        isPosInRadius(
          tempObj.npcRenderDistance as number,
          client.character.state.position,
          tempObj.state.position
        ) &&
        !client.spawnedEntities.includes(tempObj)
      ) {
        this.addSimpleNpc(client, tempObj);
        client.spawnedEntities.push(tempObj);
      }
    }
  }

  spawnCharacters(client: Client) {
    for (const c in this._clients) {
      const characterObj: Character = this._clients[c].character;
      if (
        client.character.characterId != characterObj.characterId &&
        isPosInRadius(
          this._charactersRenderDistance,
          client.character.state.position,
          characterObj.state.position
        ) &&
        !client.spawnedEntities.includes(characterObj)
          && !characterObj.characterStates.knockedOut
      ) {
        const vehicleId = this._clients[c].vehicle.mountedVehicle,
          vehicle = vehicleId ? this._vehicles[vehicleId] : false;
        this.sendData(client, "AddLightweightPc", {
          ...characterObj.pGetLightweight(),
          mountGuid: vehicleId || "",
          mountSeatId: vehicle
            ? vehicle.getCharacterSeat(characterObj.characterId)
            : 0,
          mountRelatedDword1: vehicle ? 1 : 0,
        });
        
        client.spawnedEntities.push(this._characters[characterObj.characterId]);
      }
    }
  }

  spawnItemObjects(client: Client) {
    for (const characterId in this._spawnedItems) {
      const object = this._spawnedItems[characterId];
      if (
        isPosInRadius(
          object.npcRenderDistance,
          client.character.state.position,
          object.state.position
        ) &&
        !client.spawnedEntities.includes(object)
      ) {
        this.sendData(client, "AddLightweightNpc", {
          ...object.pGetLightweight(),
          nameId: this.getItemDefinition(object.item.itemDefinitionId).NAME_ID,
        });
        client.spawnedEntities.push(object);
      }
    }
  }

  spawnDoors(client: Client) {
    for (const characterId in this._doors) {
      const door = this._doors[characterId];
      if (
        isPosInRadius(
          door.npcRenderDistance,
          client.character.state.position,
          door.state.position
        ) &&
        !client.spawnedEntities.includes(door)
      ) {
        this.addLightweightNpc(client, door);
        client.spawnedEntities.push(door);
        if (door.isOpen) {
          this.sendDataToAll("PlayerUpdatePosition", {
            transientId: door.transientId,
            positionUpdate: {
              sequenceTime: 0,
              unknown3_int8: 0,
              position: door.state.position,
              orientation: door.openAngle,
            },
          });
        }
      }
    }
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

  private _sendData(
    client: Client,
    packetName: h1z1PacketsType,
    obj: any,
    unbuffered: boolean
  ) {
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
    if (data) {
      const soeClient = this.getSoeClient(client.soeClientId);
      if (soeClient) {
        if (unbuffered) {
          this._gatewayServer.sendUnbufferedTunnelData(soeClient, data);
        } else {
          this._gatewayServer.sendTunnelData(soeClient, data);
        }
      }
    }
  }

  sendUnbufferedData(client: Client, packetName: h1z1PacketsType, obj: any) {
    this._sendData(client, packetName, obj, true);
  }

  sendData(client: Client, packetName: h1z1PacketsType, obj: any) {
    this._sendData(client, packetName, obj, false);
  }

  sendWeaponData(client: Client, packetName: weaponPacketsType, obj: any) {
    this.sendData(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: packetName,
        gameTime: this.getGameTime(),
        packet: obj
      }
    })
  }

  sendRemoteWeaponData(client: Client, transientId: number, packetName: remoteWeaponPacketsType, obj: any) {
    this.sendData(client, "Weapon.Weapon", {
      weaponPacket: {
        packetName: "Weapon.RemoteWeapon",
        gameTime: this.getGameTime(),
        remoteWeaponPacket: {
          packetName: packetName,
          transientId: transientId,
          packet: obj
        }
      }
    })
  }

  sendRemoteWeaponUpdateData(client: Client, transientId: number, weaponGuid: string, packetName: remoteWeaponUpdatePacketsType, obj: any) {
    this.sendDataToAllOthersWithSpawnedEntity(
      this._characters, client, client.character.characterId, "Weapon.Weapon", {
      weaponPacket: {
        packetName: "Weapon.RemoteWeapon",
        gameTime: this.getGameTime(),
        remoteWeaponPacket: {
          packetName: "RemoteWeapon.Update",
          transientId: transientId,
          remoteWeaponUpdatePacket: {
            packetName: packetName,
            weaponGuid: weaponGuid,
            packet: obj
          }
        }
      }
    })
  }

  sendAlert(client: Client, message: string) {
    this._sendData(client, "ClientUpdate.TextAlert", {
      message: message
    }, false);
  }
  sendAlertToAll(message: string) {
    this._sendDataToAll("ClientUpdate.TextAlert", {
      message: message
    }, false);
  }

  sendChat(client: Client, message: string) {
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

  sendGameTimeSync(client: Client) {
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
  ) {
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

  //#region ********************VEHICLE********************
  vehicleManager(client: Client) {
    for (const key in this._vehicles) {
      const vehicle = this._vehicles[key];
      if (
        // vehicle spawning / managed object assignment logic
        isPosInRadius(
          this._charactersRenderDistance,
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
              actorModelId: vehicle.actorModelId,
            },
            unknownGuid1: this.generateGuid(),
          });
          const passengers: any[] = [];
          vehicle.getPassengerList().forEach((passengerCharacterId: string) => {
            if (this._characters[passengerCharacterId]) {
              passengers.push({
                characterId: passengerCharacterId,
                identity: {
                  characterName: this._characters[passengerCharacterId].name,
                },
                unknownString1: this._characters[passengerCharacterId].name,
                unknownByte1: 1,
              });
            }
          });

          this.sendData(client, "Vehicle.OwnerPassengerList", {
            characterId: client.character.characterId,
            passengers: passengers,
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
          this.sendData(client, "Character.RemovePlayer", {
            characterId: vehicle.characterId,
          });
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
        }
      );

      this.sendData(client, "AddLightweightVehicle", {
        ...vehicle,
        npcData: {
          ...vehicle,
          position: vehicle.state.position,
          rotation: vehicle.state.rotation,
          actorModelId: vehicle.actorModelId,
        },
      });
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
        const idx = oldClient.managedObjects.indexOf(vehicle.characterId);
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
    obj: any
  ) {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          dictionary[entityCharacterId]
        ) ||
        this._clients[a].character.characterId == entityCharacterId
      ) {
        this.sendData(this._clients[a], packetName, obj);
      }
    }
  }

  sendDataToAllOthersWithSpawnedEntity(
    dictionary: { [id: string]: any },
    client: Client,
    entityCharacterId: string = "",
    packetName: any,
    obj: any
  ) {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.includes(dictionary[entityCharacterId])
      ) {
        this.sendData(this._clients[a], packetName, obj);
      }
    }
  }
  
  sendConstructionData(client: Client) {
        const buffer = Buffer.from([0xCA, 0x05, 0x00, 0x09, 0x00, 0x00, 0x00, 0x2E, 0x00, 0x00, 0x00, 0x2D, 0x00, 0x00, 0x00, 0x2F, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x00, 0x31, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x11, 0x00, 0x00, 0x00, 0x2E, 0x00, 0x00, 0x00, 0x2D, 0x00, 0x00, 0x00, 0x2F, 0x00, 0x00, 0x00, 0x30, 0x00, 0x00, 0x00, 0x31, 0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x39, 0x00, 0x00, 0x00, 0x1B, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x37, 0x00, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00]);
        this.sendRawData(client, buffer);
    }
    
    placement(client: Client, itemDefinitionId: number, modelId: number, position: Float32Array, rotation: Float32Array, parentObjectCharacterId: string, BuildingSlot: string) {
        const item = client.character.getItemById(itemDefinitionId);
        if (!item) {
            this.sendData(client, "Construction.PlacementFinalizeResponse", {
                status: 1,
                unknownString1: "",
            });
            return
        }
        const allowedItems = [Items.IED, Items.LANDMINE, Items.PUNJI_STICKS, Items.SNARE]

        for (const a in this._constructionFoundations) {
            const foundation = this._constructionFoundations[a];
            let allowBuild = false;
            this._constructionFoundations[a].permissions.forEach((permission: any) => {
                if (permission.characterId === client.character.characterId && permission.build === true) {
                    allowBuild = true;
                }
            })
            if (isPosInRadius(
                foundation.actorModelId === 9180 ? 5 : 30,
                position,
                foundation.state.position) && allowBuild === false && !allowedItems.includes(itemDefinitionId)
            ) {
                this.sendChatText(client, "Placement blocked: No build permission")
                this.sendData(client, "Construction.PlacementFinalizeResponse", {
                    status: 0,
                    unknownString1: "",
                });
                return;
            }
        }
        this.removeInventoryItem(client, item);
        this.sendData(client, "Construction.PlacementFinalizeResponse", {
            status: 1,
            unknownString1: "",
        });
        switch (itemDefinitionId) {
            case Items.SEED_CORN:
            case Items.SEED_WHEAT: this.placeSeed(client, itemDefinitionId, position, rotation, parentObjectCharacterId, BuildingSlot);
              break;
            case Items.GROUND_TILLER: this.placeGroundTiller(client, itemDefinitionId, position, eul2quat(rotation));
              break;
            case Items.SNARE: this.placeTrap(client, itemDefinitionId, modelId, position, rotation);
                break;
            case Items.PUNJI_STICKS: this.placeTrap(client, itemDefinitionId, modelId, position, rotation);
                break;
            case Items.FLARE: this.placeTemporaryEntity(client, itemDefinitionId, modelId, position, rotation, 900000);
                break;
            case Items.IED: this.placeExplosiveEntity(client, itemDefinitionId, modelId, position, eul2quat(rotation), true);
                break;
            case Items.LANDMINE: this.placeExplosiveEntity(client, itemDefinitionId, modelId, position, eul2quat(rotation), false);
                break;
            case Items.METAL_GATE:
            case Items.METAL_DOOR: this.placeConstructionDoor(client, itemDefinitionId, modelId, position, rotation, parentObjectCharacterId, BuildingSlot);
                break;
            case Items.GROUND_TAMPER:
            case Items.SHACK:
            case Items.FOUNDATION: this.placeConstructionFoundation(client, itemDefinitionId, modelId, position, eul2quat(rotation));
                break;
            case Items.FOUNDATION_EXPANSION:
                const slot = BuildingSlot.substring(BuildingSlot.length, BuildingSlot.length - 2).toString();
                this.placeConstructionFoundation(client, itemDefinitionId, modelId, position, eul2quat(rotation), parentObjectCharacterId, slot);
                break;
            default:
                const characterId = this.generateGuid();
                const transientId = this.getTransientId(characterId);
                if (BuildingSlot.includes('PerimeterWall') && Number(parentObjectCharacterId)) {
                    const slot = BuildingSlot.substring(BuildingSlot.length, BuildingSlot.length - 2).toString();

                    const npc = new simpleConstruction(
                        characterId,
                        transientId,
                        modelId,
                        position,
                        new Float32Array([0, rotation[0], 0]),
                        slot,
                        parentObjectCharacterId

                    );
                    this._constructionSimple[characterId] = npc;
                    switch (this.getEntityType(parentObjectCharacterId)) {
                        case EntityTypes.CONSTRUCTION_FOUNDATION:
                            const foundation = this._constructionFoundations[parentObjectCharacterId] as constructionFoundation;
                            foundation.changePerimeters(this, slot, npc.state.position);
                            break;
                    }
                } else {
                    const npc = new simpleConstruction(
                        characterId,
                        transientId,
                        modelId,
                        position,
                        new Float32Array([0, rotation[0], 0]),

                    );
                    this._constructionSimple[characterId] = npc;
                }
                break;
        }

    }

    placeGroundTiller(client: Client, itemDefinitionId: number, position: Float32Array, rotation: Float32Array, parentObjectCharacterId?: string, BuildingSlot?: string) {
      const characterId = this.generateGuid();
      const transientId = this.getTransientId(characterId);
      this._constructionTilledGround[characterId] = new constructionTilledGround(
        characterId,
        transientId,
        position,
        rotation,
        client.character.characterId,
        BuildingSlot
      );
    }

    placeSeed(client: Client, itemDefinitionId: number, position: Float32Array, rotation: Float32Array, parentObjectCharacterId: string, BuildingSlot: string) {
      const characterId = this.generateGuid();
      const transientId = this.getTransientId(characterId);
      const slot = BuildingSlot.substring(BuildingSlot.length, BuildingSlot.length - 2).toString();

      const npc = new constructionCrop(
        characterId,
        transientId,
        this.getGrowthDefinition(itemDefinitionId).STAGES[0].MODEL_ID,
        position,
        rotation,
        new Float32Array([1, 1, 1, 1]),
        itemDefinitionId,
        client.character.characterId,
        parentObjectCharacterId,
        slot
      )

      if (Number(parentObjectCharacterId)) {
        switch (this.getEntityType(parentObjectCharacterId)) {
            case EntityTypes.CONSTRUCTION_TILLEDGROUND:
                const tilledGround = this._constructionTilledGround[parentObjectCharacterId] as constructionTilledGround;
                tilledGround.sowSeed(this, slot, npc.state.position);
                break;
        }
      }

      this._constructionCrops[characterId] = npc;

      //TODO: Add server side aging for crops
      /*setTimeout(() => {
        this.sendDataToAllWithSpawnedEntity(
          this._constructionCrops,
          characterId,
          "Character.ReplaceBaseModel",
          {
            characterId: characterId,
            modelId: 61,
            effectId: 5056,
          }
        )
      }, 10000);*/
    }

    placeConstructionDoor(client: Client, itemDefinitionId: number, modelId: number, position: Float32Array, rotation: Float32Array, parentObjectCharacterId: string, BuildingSlot: string) {
        const characterId = this.generateGuid();
        const transientId = this.getTransientId(characterId);
        const slot = BuildingSlot.substring(BuildingSlot.length, BuildingSlot.length - 2).toString();

        const npc = new constructionDoor(
            characterId,
            transientId,
            modelId,
            position,
            rotation,
            new Float32Array([1, 1, 1, 1]),
            itemDefinitionId,
            client.character.characterId,
            parentObjectCharacterId,
            slot
        )
        if (Number(parentObjectCharacterId)) {
            switch (this.getEntityType(parentObjectCharacterId)) {
                case EntityTypes.CONSTRUCTION_FOUNDATION:
                    const foundation = this._constructionFoundations[parentObjectCharacterId] as constructionFoundation;
                    foundation.changePerimeters(this, slot, npc.state.position);
                    break;
            }
        }
        this._constructionDoors[characterId] = npc;
    }

    placeConstructionFoundation(client: Client, itemDefinitionId: number, modelId: number, position: Float32Array, rotation: Float32Array, parentObjectCharacterId?: string, BuildingSlot?: string,) {
        const characterId = this.generateGuid();
        const transientId = this.getTransientId(characterId);
        const npc = new constructionFoundation(
            characterId,
            transientId,
            modelId,
            position,
            rotation,
            itemDefinitionId,
            client.character.characterId,
            client.character.name,
            parentObjectCharacterId,
            BuildingSlot,
        )
        this._constructionFoundations[characterId] = npc;
        if (itemDefinitionId === Items.FOUNDATION_EXPANSION && parentObjectCharacterId && BuildingSlot) {
            this._constructionFoundations[parentObjectCharacterId].expansions[BuildingSlot] = characterId;
        }
    }

    placeTemporaryEntity(client: Client, itemDefinitionId: number, modelId: number, position: Float32Array, rotation: Float32Array, time: number) {
        const characterId = this.generateGuid();
        const transientId = this.getTransientId(characterId);
        const npc = new TemporaryEntity(
            characterId,
            transientId,
            modelId,
            position,
            rotation,
        )
        npc.disappearTimer = setTimeout(() => {
            this.sendDataToAllWithSpawnedEntity(
                this._temporaryObjects,
                characterId,
                "Character.RemovePlayer",
                {
                    characterId: characterId,
                }
            );
            delete this._temporaryObjects[characterId];
        }, time);
        this._temporaryObjects[characterId] = npc;
    }

    placeTrap(client: Client, itemDefinitionId: number, modelId: number, position: Float32Array, rotation: Float32Array) {
        const characterId = this.generateGuid();
        const transientId = this.getTransientId(characterId);
        const npc = new TrapEntity(
            characterId,
            transientId,
            modelId,
            position,
            new Float32Array([0, rotation[0], 0]),
        )
        this._traps[characterId] = npc;
        switch (itemDefinitionId) {
            case Items.PUNJI_STICKS:
                npc.trapTimer = setTimeout(() => {
                    if (!this._traps[characterId]) {
                        return;
                    }
                    for (const a in this._clients) {
                        if (
                            getDistance(
                                this._clients[a].character.state.position,
                                npc.state.position
                            ) < 1.5 &&
                            this._clients[a].character.isAlive &&
                            !this._clients[a].vehicle.mountedVehicle
                        ) {
                            this.playerDamage(this._clients[a], 501, undefined, true);
                            this.sendDataToAllWithSpawnedEntity(
                                this._traps,
                                characterId,
                                "Character.PlayWorldCompositeEffect",
                                {
                                    characterId: "0x0",
                                    effectId: 5116,
                                    position: this._clients[a].character.state.position,
                                }
                            );

                            this.sendDataToAllWithSpawnedEntity(
                                this._traps,
                                characterId,
                                "Character.UpdateSimpleProxyHealth",
                                npc.pGetSimpleProxyHealth()
                            );
                            npc.health -= 1000;
                        }
                    }

                    if (npc.health > 0) {
                        npc.trapTimer?.refresh();
                    } else {
                        this.sendDataToAllWithSpawnedEntity(
                            this._traps,
                            characterId,
                            "Character.PlayWorldCompositeEffect",
                            {
                                characterId: "0x0",
                                effectId: 163,
                                position: npc.state.position,
                            }
                        );
                        this.sendDataToAllWithSpawnedEntity(
                            this._traps,
                            characterId,
                            "Character.RemovePlayer",
                            {
                                characterId: characterId,
                            }
                        );
                        delete this._traps[characterId];
                        return;
                    }
                }, 500);
                break;
            case Items.SNARE:
                npc.trapTimer = setTimeout(() => {
                    if (!this._traps[characterId]) {
                        return;
                    }
                    for (const a in this._clients) {
                        if (
                            getDistance(
                                this._clients[a].character.state.position,
                                npc.state.position
                            ) < 1
                        ) {
                            this.playerDamage(this._clients[a], 2000);
                            this._clients[a].character._resources[
                                ResourceIds.BLEEDING
                            ] += 41;
                            this.updateResourceToAllWithSpawnedCharacter(
                                client,
                                client.character.characterId,
                                client.character._resources[ResourceIds.BLEEDING] > 0
                                    ? client.character._resources[ResourceIds.BLEEDING]
                                    : 0,
                                ResourceIds.BLEEDING
                            );
                            this.sendDataToAllWithSpawnedEntity(
                                this._traps,
                                characterId,
                                "Character.PlayWorldCompositeEffect",
                                {
                                    characterId: characterId,
                                    effectId: 1630,
                                    position: this._traps[characterId].state.position,
                                }
                            );
                            npc.isTriggered = true;
                            this.applyMovementModifier(client, 0.4, "snared");
                        }
                    }

                    if (!npc.isTriggered) {
                        npc.trapTimer?.refresh();
                    } else {
                        this.sendDataToAllWithSpawnedEntity(
                            this._traps,
                            characterId,
                            "Character.RemovePlayer",
                            {
                                characterId: characterId,
                            }
                        );
                        npc.actorModelId = 1974;
                        this.worldObjectManager.createLootEntity(
                            this,
                            this.generateItem(1415),
                            npc.state.position,
                            npc.state.rotation,
                            15
                        );
                        delete this._traps[characterId];
                    }
                }, 200);
                break;

        }
        this._traps[characterId] = npc;
    }

    placeExplosiveEntity(client: Client, itemDefinitionId: number, modelId: number, position: Float32Array, rotation: Float32Array, isIed: boolean) {
        const characterId = this.generateGuid();
        const transientId = this.getTransientId(characterId);
        const npc = new ExplosiveEntity(
            characterId,
            transientId,
            modelId,
            position,
            rotation,
            isIed
        )
        if (isIed) {
            this._explosives[characterId] = npc;
            return;
        }
        npc.mineTimer = setTimeout(() => {
            if (!this._explosives[characterId]) {
                return;
            }
            for (const a in this._clients) {
                if (
                    getDistance(
                        this._clients[a].character.state.position,
                        npc.state.position
                    ) < 0.6
                ) {
                    this.explodeExplosive(npc);
                    return;
                }
            }
            for (const a in this._vehicles) {
                if (
                    getDistance(
                        this._vehicles[a].state.position,
                        npc.state.position
                    ) < 2.2
                ) {
                    this.explodeExplosive(npc);
                    return;
                }
            }
            if (this._explosives[characterId]) {
                npc.mineTimer?.refresh();
            }
        }, 90);
        this._explosives[characterId] = npc;
    }
  mountVehicle(client: Client, vehicleGuid: string) {
    const vehicle = this._vehicles[vehicleGuid];
    if (!vehicle) return;
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
      client.hudTimer = null;
    }
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
    /*
    if(seatId === "0") {
      this.sendData(client, "AccessedCharacter.BeginCharacterAccess", {
        objectCharacterId: vehicle.characterId,
        containerGuid: vehicle.characterId,// idk just testing for now
        unknownBool1: false,
        itemsData: {
          items: [],
          unknownDword1: 0,
        },
      });
    }
    */
    if (seatId === "0") {
      this.takeoverManagedObject(client, vehicle);
      if (vehicle._resources[ResourceIds.FUEL] > 0) {
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
              this._vehicles[vehicleGuid]._resources[ResourceIds.FUEL] -=
                fuelLoss;
            }
            if (this._vehicles[vehicleGuid]._resources[ResourceIds.FUEL] < 0) {
              this._vehicles[vehicleGuid]._resources[ResourceIds.FUEL] = 0;
            }
            if (
              this._vehicles[vehicleGuid].engineOn &&
              this._vehicles[vehicleGuid]._resources[ResourceIds.FUEL] <= 0
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
              vehicle._resources[ResourceIds.FUEL],
              ResourceIds.FUEL,
              ResourceTypes.FUEL
            );
            this._vehicles[vehicleGuid].resourcesUpdater.refresh();
          }, 3000);
        }
      }
      this.sendDataToAllWithSpawnedEntity(
        this._characters,
        client.character.characterId,
        "Vehicle.Owner",
        {
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
        }
      );
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

  dismountVehicle(client: Client) {
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
    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "Vehicle.Owner",
      {
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
      }
    );
  }

  changeSeat(client: Client, packet: any) {
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

  reloadInterrupt(client: Client, weaponItem: loadoutItem) {
    if(!weaponItem.weapon) return;
    if(!client.character.reloadTimer) return;
    client.character.clearReloadTimeout();
    this.sendWeaponData(client, "Weapon.Reload", {
      guid: weaponItem.itemGuid,
      unknownDword1: weaponItem.weapon.ammoCount,
      ammoCount: weaponItem.weapon.ammoCount,
      unknownDword3: weaponItem.weapon.ammoCount,
      characterId: "0x2",
    })
    // send reloadinterrupt to all clients with spawned character
  }
  
  combatLog(client: Client) {
    if(!client.character.getCombatLog().length) {
      this.sendChatText(client, "No combatlog info available");
      return;
    }
    const combatlog = client.character.getCombatLog();
    this.sendChatText(client, "---------------------------------COMBATLOG:--------------------------------");
    this.sendChatText(client, `TIME | SOURCE | TARGET | WEAPON | DISTANCE | HITLOCATION | HITPOSITION | DAMAGE`);
    combatlog.forEach((e) => {
      const hitPosition = `[${e.hitInfo.hitPosition[0].toFixed(2)}, ${e.hitInfo.hitPosition[1].toFixed(2)}, ${e.hitInfo.hitPosition[2].toFixed(2)}]`
      this.sendChatText(client, 
        `${((Date.now() - e.hitInfo.timestamp)/1000).toFixed(1)}s ${e.source.name == client.character.name?"YOU":e.source.name||"undefined"} ${e.target.name == client.character.name?"YOU":e.target.name||"undefined"} ${e.hitInfo.weapon} ${e.hitInfo.distance}m ${e.hitInfo.hitLocation} ${hitPosition} ${e.hitInfo.damage.toFixed(2)}`);
    })
    this.sendChatText(client, "---------------------------------------------------------------------------------");
  }

  //#region ********************INVENTORY********************

  pGetItemData(character: Character, item: inventoryItem, containerDefId: number) {
    let durability: number = 0;
    const isWeapon = this.isWeapon(item.itemDefinitionId);
    switch (true) {
      case this.isWeapon(item.itemDefinitionId): durability = 2000;
        break;
      case this.isArmor(item.itemDefinitionId): durability = 1000;
        break;
      case this.isHelmet(item.itemDefinitionId): durability = 100;
        break;
    }
    return {
      itemDefinitionId: item.itemDefinitionId,
      tintId: 0,
      guid: item.itemGuid,
      count: item.stackCount,
      itemSubData: {
        hasSubData: false,
      },
      containerGuid: item.containerGuid,
      containerDefinitionId: containerDefId,
      containerSlotId: item.slotId,
      baseDurability: durability,
      currentDurability: durability ? item.currentDurability : 0,
      maxDurabilityFromDefinition: durability,
      unknownBoolean1: true,
      ownerCharacterId: isWeapon && item.itemDefinitionId !== 85 ? "" : character.characterId,
      unknownDword9: 1,
      unknownData1: this.getItemWeaponData(item)
    }
  }

  getItemWeaponData(slot: inventoryItem) {
    if(slot.weapon) {
      return {
        isWeapon: true, // not sent to client, only used as a flag for pack function
        unknownData1: {
          unknownBoolean1: false,
        },
        unknownData2: {
          ammoSlots: this.getWeaponAmmoId(slot.itemDefinitionId)?[{ammoSlot: slot.weapon?.ammoCount}]:[],
          //this.getWeaponAmmoSlot(slot.itemDefinitionId),
          firegroups: [{
            firegroupId: this.getWeaponDefinition(this.getItemDefinition(slot.itemDefinitionId).PARAM1)?.FIRE_GROUPS[0]?.FIRE_GROUP_ID,
            unknownArray1: [ // maybe firemodes?
              {
                unknownByte1: 0,
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0
              },
              {
                unknownByte1: 0,
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0
              },/*
              {
                unknownByte1: 0,
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0
              },
              {
                unknownByte1: 0,
                unknownDword1: 0,
                unknownDword2: 0,
                unknownDword3: 0
              },*/
            ]
          }],
          loadoutSlotId: slot.slotId,
          unknownByte2: 1,
          unknownDword1: 0,
          unknownByte3: 0,
          unknownByte4: -1,
          unknownByte5: -1,
          unknownFloat1: 0,
          unknownByte6: 0,
          unknownDword2: 0,
          unknownByte7: 0,
          unknownDword3: -1
        },
        characterStats: [],
        unknownArray1: []
      }
    }
    return {
      isWeapon: false, // not sent to client, only used as a flag for pack function
      unknownBoolean1: false,
    }
  }

  updateLoadout(client: Client, character = client.character) {
    this.sendData(
      client,
      "Loadout.SetLoadoutSlots",
      character.pGetLoadoutSlots()
    );
    this.checkConveys(client);
  }

  updateEquipment(
    client: Client,
    character: BaseFullCharacter = client.character
  ) {
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
    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "Equipment.SetCharacterEquipmentSlot",
      character.pGetEquipmentSlotFull(slotId)
    );
  }

  addItem(client: Client, item: inventoryItem, containerDefinitionId: number, character = client.character) {
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: this.pGetItemData(character, item, containerDefinitionId),
    });
  }

  equipContainerItem(client: Client, item: inventoryItem, slotId: number) {
    // equips an existing item from a container

    if (
      client.character._containers[slotId] &&
      _.size(client.character._containers[slotId].items) != 0
    ) {
      this.sendChatText(client, "[ERROR] Container must be empty to unequip!");
      return;
    }

    const oldLoadoutItem = client.character._loadout[slotId],
      container = client.character.getItemContainer(item.itemGuid);
    if ((!oldLoadoutItem || !oldLoadoutItem.itemDefinitionId) && !container) {
      this.containerError(client, 3); // unknown container
      return;
    }
    if (!this.removeContainerItem(client, item, container, 1)) {
      this.containerError(client, 5); // slot does not contain item
      return;
    }
    if (oldLoadoutItem?.itemDefinitionId) {
      // if target loadoutSlot is occupied
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

  equipItem(
    client: Client,
    item: inventoryItem | undefined,
    sendPacket: boolean = true,
    loadoutSlotId: number = 0
  ) {
    // equips any item with a vaild itemGuid
    if (!item) {
      debug("[ERROR] EquipItem: Invalid item!");
      return;
    }
    const def = this.getItemDefinition(item.itemDefinitionId);
    if (loadoutSlotId) {
      if (!this.validateLoadoutSlot(item.itemDefinitionId, loadoutSlotId)) {
        debug(
          `[ERROR] EquipItem: Client tried to equip item ${item.itemDefinitionId} with invalid loadoutSlotId ${loadoutSlotId}!`
        );
        return;
      }
    } else {
      loadoutSlotId = this.getAvailableLoadoutSlot(
        client.character,
        item.itemDefinitionId
      );
      if (!loadoutSlotId) {
        loadoutSlotId = this.getLoadoutSlot(item.itemDefinitionId);
      }
    }
    if (!loadoutSlotId) {
      debug(
        `[ERROR] EquipItem: Tried to equip item with itemDefinitionId: ${item.itemDefinitionId} with an invalid loadoutSlotId!`
      );
      return;
    }

    let equipmentSlotId = def.PASSIVE_EQUIP_SLOT_ID; // default for any equipment
    if (this.isWeapon(item.itemDefinitionId)) {
      if (loadoutSlotId == client.character.currentLoadoutSlot) {
        equipmentSlotId = def.ACTIVE_EQUIP_SLOT_ID;
      } else {
        equipmentSlotId = this.getAvailablePassiveEquipmentSlot(
          client.character,
          item
        );
      }
    }

    if (equipmentSlotId) {
      const equipmentData: characterEquipment = {
        modelName: def.MODEL_NAME.replace(
          "<gender>",
          client.character.gender == 1 ? "Male" : "Female"
        ),
        slotId: equipmentSlotId,
        guid: item.itemGuid,
        textureAlias: def.TEXTURE_ALIAS || "default0",
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
    };
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
      if (sendPacket) this.initializeContainerList(client);
    }

    if (!sendPacket) return;

    this.addItem(client, loadoutData, 101);
    this.updateLoadout(client);
    if (equipmentSlotId) this.updateEquipmentSlot(client, equipmentSlotId);
  }

  generateRandomEquipmentsFromAnEntity(
    entity: BaseFullCharacter,
    slots: number[]
  ) {
    slots.forEach((slot) => {
      entity._equipment[slot] = this.generateRandomEquipmentForSlot(
        slot,
        entity.gender
      );
    });
  }

  generateRandomEquipmentForSlot(slotId: number, gender: number) {
    const models = equipmentModelTexturesMapping[slotId];
    const model = getRandomKeyFromAnObject(models);
    const skins = equipmentModelTexturesMapping[slotId][model];
    let skin;
    if (skins) {
      skin = getRandomFromArray(skins);
    } else {
      skin = "";
    }
    return {
      modelName: model.replace("<gender>", gender==1?"Male":"Female"),
      slotId,
      textureAlias: skin,
      guid: bigIntToHexString(this.generateItemGuid()),
    };
  }

  getGrowthDefinition(itemDefinitionId: number) {
    if(!itemDefinitionId) return;
    return this._growthDefinitions[itemDefinitionId];
  }

  getItemDefinition(itemDefinitionId: number | undefined) {
    if(!itemDefinitionId) return;
    return this._itemDefinitions[itemDefinitionId];
  }
  
  getWeaponDefinition(weaponDefinitionId: number) {
    if(!weaponDefinitionId) return;
    return this._weaponDefinitions[weaponDefinitionId]?.DATA;
  }

  getFiregroupDefinition(firegroupId: number) {
    return this._firegroupDefinitions[firegroupId]?.DATA;
  }

  getFiremodeDefinition(firemodeId: number) {
    return this._firemodeDefinitions[firemodeId]?.DATA.DATA;
  }

  getWeaponAmmoId(itemDefinitionId: number): number {
    const itemDefinition = this.getItemDefinition(itemDefinitionId),
    weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1),
    firegroupDefinition = this.getFiregroupDefinition(weaponDefinition?.FIRE_GROUPS[0]?.FIRE_GROUP_ID),
    firemodeDefinition = this.getFiremodeDefinition(firegroupDefinition?.FIRE_MODES[0]?.FIRE_MODE_ID);

    return firemodeDefinition?.AMMO_ITEM_ID || 0;
  }
  getWeaponReloadTime(itemDefinitionId: number): number {
    const itemDefinition = this.getItemDefinition(itemDefinitionId),
    weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1),
    firegroupDefinition = this.getFiregroupDefinition(weaponDefinition?.FIRE_GROUPS[0]?.FIRE_GROUP_ID),
    firemodeDefinition = this.getFiremodeDefinition(firegroupDefinition?.FIRE_MODES[0]?.FIRE_MODE_ID);

    return firemodeDefinition?.RELOAD_TIME_MS || 0;
  }

  getWeaponMaxAmmo(itemDefinitionId: number): number {
    const itemDefinition = this.getItemDefinition(itemDefinitionId),
    weaponDefinition = this.getWeaponDefinition(itemDefinition?.PARAM1);
    
    return weaponDefinition.AMMO_SLOTS[0]?.CLIP_SIZE || 0
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

  generateItem(
        itemDefinitionId: number,
        count: number = 1
    ): inventoryItem | undefined {
        if (!this.getItemDefinition(itemDefinitionId)) {
            debug(
                `[ERROR] GenerateItem: Invalid item definition: ${itemDefinitionId}`
            );
            return;
        }
        const generatedGuid = `0x${this.generateItemGuid().toString(16)}`;
        let durability: number = 2000;
        switch (true) {
            case this.isWeapon(itemDefinitionId): durability = 2000;
                break;
            case this.isArmor(itemDefinitionId): durability = 1000;
                break;
            case this.isHelmet(itemDefinitionId): durability = 100;
                break;
        }
        const itemData: inventoryItem = {
            itemDefinitionId: itemDefinitionId,
            slotId: 0,
            itemGuid: generatedGuid,
            containerGuid: "0x0",
            currentDurability: durability,
            stackCount: count
        };
        let item: inventoryItem ;
        if (this.isWeapon(itemDefinitionId)) {
            item= {
                ...itemData,
                weapon: { ammoCount: this.getWeaponMaxAmmo(itemDefinitionId) } // default ammo count until we have a method to get max ammo count from definition
            }
        }
        else {
            item = itemData;
        }
        return item;
    }

  isWeapon(itemDefinitionId: number): boolean {
        return this.getItemDefinition(itemDefinitionId)?.ITEM_TYPE == 20;
    }

    isArmor(itemDefinitionId: number): boolean {
        return (this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 12073 || this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 11151);
    }

    isHelmet(itemDefinitionId: number): boolean {
        return (this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 9945 || 
        this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 12994 || 
        this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 9114 ||
        this.getItemDefinition(itemDefinitionId)?.DESCRIPTION_ID == 9945
        );
    }

  validateEquipmentSlot(itemDefinitionId: number, equipmentSlotId: number) {
    // only for weapons at the moment
    if (!this.getItemDefinition(itemDefinitionId).FLAG_CAN_EQUIP) return false;
    return !!equipSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS ===
          this.getItemDefinition(itemDefinitionId).ITEM_CLASS &&
        equipmentSlotId === slot.EQUIP_SLOT_ID
    );
  }

  validateLoadoutSlot(
    itemDefinitionId: number,
    loadoutSlotId: number
  ): boolean {
    if (!this.getItemDefinition(itemDefinitionId).FLAG_CAN_EQUIP) return false;
    return !!loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS ===
          this.getItemDefinition(itemDefinitionId).ITEM_CLASS &&
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

  getAvailableLoadoutSlot(
    character: BaseFullCharacter,
    itemDefinitionId: number,
    loadoutId: number = 3
  ): number {
    // gets an open loadoutslot for a specified itemDefinitionId
    const itemDef = this.getItemDefinition(itemDefinitionId),
      loadoutSlotItemClass = loadoutSlotItemClasses.find(
        (slot: any) =>
          slot.ITEM_CLASS === itemDef.ITEM_CLASS &&
          loadoutId === slot.LOADOUT_ID
      );
    let slot = loadoutSlotItemClass?.SLOT;
    if (!slot ) return 0;
    switch(itemDef.ITEM_CLASS) {
      case 25036: // long weapons
      case 4096: // pistols
      case 4098: // melees
      case 25037: // melees
        if (character._loadout[slot]?.itemDefinitionId) {
          // primary
          slot = 3; // secondary
        }
        if (slot == 3 && character._loadout[slot]?.itemDefinitionId) {
          // secondary
          slot = 4; // tertiary
        }
        break;
      case 25054: // item1/item2 slots
        if (character._loadout[slot]?.itemDefinitionId) {
          // item 1
          slot = 41; // item 2
        }
        break;
    }
    if(character._loadout[slot]?.itemDefinitionId) return 0;
    return slot;
  }

  getAvailablePassiveEquipmentSlot(
    character: BaseFullCharacter,
    item: inventoryItem
  ): number {
    const itemDef = this.getItemDefinition(item.itemDefinitionId),
      itemClass = itemDef?.ITEM_CLASS;
    if (!itemDef || !itemClass || !this.isWeapon(item.itemDefinitionId))
      return 0;
    for (const slot of equipSlotItemClasses) {
      if (
        slot.ITEM_CLASS == itemDef.ITEM_CLASS &&
        !character._equipment[slot.EQUIP_SLOT_ID]
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
    this.reloadInterrupt(client, client.character._loadout[oldLoadoutSlot]);
    // remove passive equip
    this.removeEquipmentItem(
      client,
      client.character.getActiveEquipmentSlot(loadoutItem)
    );
    client.character.currentLoadoutSlot = loadoutItem.slotId;
    this.equipItem(client, loadoutItem, true, loadoutItem.slotId);

    // equip passive slot
    this.equipItem(
      client,
      client.character._loadout[oldLoadoutSlot],
      true,
      oldLoadoutSlot
    );
  }

  removeEquipmentItem(client: Client, equipmentSlotId: number): boolean {
    if (!equipmentSlotId) return false;
    delete client.character._equipment[equipmentSlotId];
    this.sendDataToAllWithSpawnedEntity(
      this._characters,
      client.character.characterId,
      "Equipment.UnsetCharacterEquipmentSlot",
      {
        characterData: {
          characterId: client.character.characterId,
        },
        slotId: equipmentSlotId,
      }
    );
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
    this.removeEquipmentItem(
      client,
      client.character.getActiveEquipmentSlot(item)
    );
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
      const removeItems: {
        container: loadoutContainer;
        item: inventoryItem;
        count: number;
      }[] = [];
      for (const container of Object.values(client.character._containers)) {
        if (!requiredCount) break;
        for (const item of Object.values(container.items)) {
          if (item.itemDefinitionId == itemDefinitionId) {
            if (item.stackCount >= requiredCount) {
              removeItems.push({ container, item, count: requiredCount });
              requiredCount = 0;
              break;
            } else {
              removeItems.push({ container, item, count: item.stackCount });
              requiredCount -= item.stackCount;
            }
          }
        }
      }
      if (requiredCount) { // missing some items
        return false;
      }
      for (const itemStack of Object.values(removeItems)) {
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
  

  dropItem(client: Client, item: inventoryItem, count: number = 1) {
    if (!item) {
      this.containerError(client, 5); // slot does not contain item
      return;
    }
    if (!this.removeInventoryItem(client, item, count)) return;
    this.sendData(client, "Character.DroppedIemNotification", {
      characterId: client.character.characterId,
      itemDefId: item.itemDefinitionId,
      count: count,
    });

    let dropItem;
    if (item.stackCount == count) {
      dropItem = item;
    } else if (item.stackCount > count) {
      dropItem = this.generateItem(item.itemDefinitionId, count);
    } else {
      return;
    }
    this.worldObjectManager.createLootEntity(
      this,
      dropItem,
      client.character.state.position,
      new Float32Array([0, Number(Math.random() * 10 - 5), 0, 1])
    );
  }

  lootItem(client: Client, item: inventoryItem | undefined, count: number) {
    if (!item) return;
    const itemDefId = item.itemDefinitionId,
      itemDef = this.getItemDefinition(itemDefId);
    if (
      itemDef.FLAG_CAN_EQUIP &&
      this.getAvailableLoadoutSlot(client.character, itemDefId)
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
    const object = this._spawnedItems[guid],
      item: inventoryItem = object.item;
    if (!item) {
      this.sendChatText(client, `[ERROR] Invalid item`);
      return;
    }
    this.sendData(client, "Character.PlayWorldCompositeEffect", {
      characterId: "0x0",
      effectId:
        this.getItemDefinition(item.itemDefinitionId).PICKUP_EFFECT ?? 5151,
      position: object.state.position,
    });
    //region Norman added. if it is a crop product, randomly generated product is processed by the planting manager. else, continue
    if (this.plantingManager.TriggerPicking(item, client, this)) {
      return;
    }
    //endregion
    this.lootItem(client, item, item.stackCount);
    this.deleteEntity(guid, this._spawnedItems);
    delete this.worldObjectManager._spawnedLootObjects[object.spawnerId];
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
        client.character.state.position,
        new Float32Array([0, Number(Math.random() * 10 - 5), 0, 1])
      );
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
                itemData: this.pGetItemData(client.character, item, container.containerDefinitionId),
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
            itemData: this.pGetItemData(client.character, item, container.containerDefinitionId),
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


  updateLoadoutItem(
    client: Client,
    item: loadoutItem
  ) {
    this.sendData(client, "ClientUpdate.ItemUpdate", {
      characterId: client.character.characterId,
      data: this.pGetItemData(client.character, item, 101),
    });
    //this.updateLoadout(client);
  }

  updateContainerItem(
    client: Client,
    item: inventoryItem,
    container: loadoutContainer | undefined
  ) {
    if (!container) return;
    this.sendData(client, "ClientUpdate.ItemUpdate", {
      characterId: client.character.characterId,
      data: this.pGetItemData(client.character, item, container.containerDefinitionId),
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
    this.lootContainerItem(client, this.generateItem(1436), 1, sendPacket); // lighter
    this.giveKitItems(client);
  }

  giveKitItems(client: Client) {
    this.lootItem(client, this.generateItem(Items.WEAPON_308), 1); // sniper
    this.lootItem(client, this.generateItem(Items.WEAPON_SHOTGUN), 1); // shotgun
    this.lootItem(client, this.generateItem(Items.WEAPON_AR15), 1); // ar
    this.lootItem(client, this.generateItem(Items.FIRST_AID), 10); // medkit
    this.lootItem(client, this.generateItem(Items.BANDAGE_DRESSED), 10); // dressed bandages
    this.lootItem(client, this.generateItem(Items.AMMO_12GA), 60); // shotgun ammo
    this.lootItem(client, this.generateItem(Items.AMMO_308), 50); // 308 ammo
    this.lootItem(client, this.generateItem(Items.AMMO_223), 120); // ar ammo
    this.lootItem(client, this.generateItem(Items.KEVLAR_DEFAULT), 1); // kevlar
    this.lootItem(client, this.generateItem(Items.HELMET_MOTORCYCLE), 1); // helmet
    this.lootItem(client, this.generateItem(Items.KEVLAR_DEFAULT), 1); // kevlar
    this.lootItem(client, this.generateItem(Items.HELMET_MOTORCYCLE), 1); // helmet
    // todo: fix this
    //this.lootItem(client, this.generateItem(Items.CONVEYS_BLUE), 1); // conveys
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
    if (!itemDef) return;
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
    if (!itemDef) return;
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
    if (!itemDef) return;
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
    if (!itemDef) return;
    let drinkCount = 2000;
    const eatCount = 0;
    let givetrash = 0;
    const timeout = 1000;
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
      this.sendAlert(client, "There is no water source nearby");
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
      case 25: //Fertilizer
        this.utilizeHudTimer(client, nameId, timeout, () => {
          this.plantingManager.FertilizeCrops(client, this);
          this.removeInventoryItem(client, item);
        });
        return;
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
    const timeout = 5000;
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
    const itemDefinition = this.getItemDefinition(item.itemDefinitionId),
      nameId = itemDefinition.NAME_ID,
      itemType = itemDefinition.ITEM_TYPE;
    let count = 1;
    const timeout = 3000;
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
    client.character._resources[ResourceIds.HUNGER] += eatCount;
    client.character._resources[ResourceIds.HYDRATION] += drinkCount;
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HUNGER],
      ResourceIds.HUNGER
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HYDRATION],
      ResourceIds.HYDRATION
    );
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
    client.character._resources[ResourceIds.HUNGER] += eatCount;
    client.character._resources[ResourceIds.HYDRATION] += drinkCount;
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HUNGER],
      ResourceIds.HUNGER
    );
    this.updateResource(
      client,
      client.character.characterId,
      client.character._resources[ResourceIds.HYDRATION],
      ResourceIds.HYDRATION
    );
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
          this._explosives[a].state.position
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
    client.character._resources[ResourceIds.BLEEDING] -= bandagingCount;
    const bleeding = client.character._resources[ResourceIds.BLEEDING];
    if (!client.character.healingInterval) {
      client.character.starthealingInterval(client, this);
    }
    this.updateResourceToAllWithSpawnedCharacter(
      client,
      client.character.characterId,
      bleeding,
      ResourceIds.BLEEDING
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
    vehicle._resources[ResourceIds.FUEL] += fuelValue;
    if (vehicle._resources[ResourceIds.FUEL] > 10000) {
      vehicle._resources[ResourceIds.FUEL] = 10000;
    }
    this.updateResourceToAllWithSpawnedVehicle(
      client,
      vehicleGuid,
      vehicle._resources[ResourceIds.FUEL],
      ResourceIds.FUEL,
      ResourceTypes.FUEL
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

  igniteIED(IED: ExplosiveEntity) {
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

  explodeExplosive(explosive: ExplosiveEntity) {
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
        position: explosive.state.position,
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
    this.explosionDamage(explosive.state.position, explosive.characterId);
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
        const item = client.character.getInventoryItem(
          character._equipment["5"].guid
        );
        if (!item) return;
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
  getSoeClient(soeClientId: string): SOEClient | undefined {
    return this._gatewayServer._soeServer.getSoeClient(soeClientId);
  }
  private _sendRawData(client: Client, data: Buffer, unbuffered: boolean) {
    const soeClient = this.getSoeClient(client.soeClientId);
    if (soeClient) {
      if (unbuffered) {
        this._gatewayServer.sendUnbufferedTunnelData(soeClient, data);
      } else {
        this._gatewayServer.sendTunnelData(soeClient, data);
      }
    }
  }
  sendRawData(client: Client, data: Buffer) {
    this._sendRawData(client, data, false);
  }
  sendUnbufferedRawData(client: Client, data: Buffer) {
    this._sendRawData(client, data, true);
  }
  sendChatText(client: Client, message: string, clearChat = false) {
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
    for (const key in this._spawnedItems) {
      const object = this._spawnedItems[key];
      allTransient[object.transientId] = key;
    }
    return allTransient;
  }
  async fetchLoginInfo() {
    const resolver = new Resolver();
    const loginServerAddress = await new Promise((resolve) => {
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
  executeFuncForAllReadyClients(callback: any) {
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
  private _sendDataToAll(
    packetName: h1z1PacketsType,
    obj: any,
    unbuffered: boolean
  ) {
    const data = this._protocol.pack(packetName, obj);
    if (data) {
      for (const a in this._clients) {
        if (unbuffered) {
          this.sendUnbufferedRawData(this._clients[a], data);
        } else {
          this.sendRawData(this._clients[a], data);
        }
      }
    }
  }

  sendDataToAll(packetName: h1z1PacketsType, obj: any) {
    this._sendDataToAll(packetName, obj, false);
  }
  sendUnbufferedDataToAll(packetName: h1z1PacketsType, obj: any) {
    this._sendDataToAll(packetName, obj, true);
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
  sendChatTextToAllOthers(client: Client, message: string, clearChat = false) {
    for (const a in this._clients) {
      if (client != this._clients[a]) {
        this.sendChatText(this._clients[a], message, clearChat);
      }
    }
  }
  sendGlobalChatText(message: string, clearChat = false) {
    for (const a in this._clients) {
      this.sendChatText(this._clients[a], message, clearChat);
    }
  }
  filterOutOfDistance(
    element: BaseEntity,
    playerPosition: Float32Array
  ): boolean {
    return !isPosInRadius(
      element.npcRenderDistance || this._charactersRenderDistance,
      playerPosition,
      element.state.position
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
    this.sendDataToAll("Character.RemovePlayer", {
      characterId: vehicleGuid,
    });
    this.deleteEntity(vehicleGuid, this._vehicles);
  }
  getTransientId(characterId: string): number {
    const generatedTransient = this._transientIdGenerator.next()
      .value as number;
    this._transientIds[generatedTransient] = characterId;
    this._characterIds[characterId] = generatedTransient;
    return generatedTransient;
  }
  reloadPackets(client: Client) {
    this.reloadZonePacketHandlers();
    this._protocol.reloadPacketDefinitions();
    this.sendChatText(client, "[DEV] Packets reloaded", true);
  }
  timeoutClient(client: Client) {
    if (!!this._clients[client.sessionId]) {
      // if hasn't already deleted
      debug(`Client (${client.soeClientId}) disconnected ( ping timeout )`);
      this.deleteClient(client);
    }
  }

  toggleFog() {
    return changeFog();
  }

  pSetImmediate = promisify(setImmediate);
  pSetTimeout = promisify(setTimeout);
}

if (process.env.VSCODE_DEBUG === "true") {
  const PackageSetting = require("../../../package.json");
  process.env.H1Z1_SERVER_VERSION = PackageSetting.version;
  new ZoneServer2016(
    1117,
    Buffer.from(DEFAULT_CRYPTO_KEY, "base64"),
    process.env.MONGO_URL,
    2
  ).start();
}

process.on('uncaughtException', function (exception) {
  // attempt to log exception
  console.log(exception);
});
