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

const debugName = "ZoneServer";
const debug = require("debug")(debugName);
import { zonePacketHandlers } from "./zonepackethandlers";
import { ZoneServer } from "../ZoneServer/zoneserver";
import { ZoneClient2016 as Client } from "./classes/zoneclient";
import { Vehicle2016 as Vehicle } from "./classes/vehicle";
import { WorldObjectManager } from "./classes/worldobjectmanager";

import { inventoryItem, loadoutContainer, Weather2016 } from "../../types/zoneserver";
import { h1z1PacketsType } from "../../types/packets";
import { Character2016 as Character } from "./classes/character";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import {
  _,
  initMongo,
  Int64String,
  isPosInRadius,
  getDistance,
  randomIntFromInterval,
} from "../../utils/utils";

import { Db, MongoClient } from "mongodb";
import dynamicWeather from "./workers/dynamicWeather";

// need to get 2016 lists
const spawnLocations = require("../../../data/2016/zoneData/Z1_spawnLocations.json");
const recipes = require("../../../data/2016/sampleData/recipes.json");
const deprecatedDoors = require("../../../data/2016/sampleData/deprecatedDoors.json");
const localWeatherTemplates = require("../../../data/2016/dataSources/weather.json");
const stats = require("../../../data/2016/sampleData/stats.json");
const resources = require("../../../data/2016/dataSources/resourceDefinitions.json");
let localSpawnList = require("../../../data/2015/sampleData/spawnLocations.json");

const itemDefinitions = require("./../../../data/2016/dataSources/ServerItemDefinitions.json");
const containerDefinitions = require("./../../../data/2016/dataSources/ContainerDefinitions.json");
const loadoutSlotItemClasses = require("./../../../data/2016/dataSources/LoadoutSlotItemClasses.json");
const loadoutEquipSlots = require("./../../../data/2016/dataSources/LoadoutEquipSlots.json");

export class ZoneServer2016 extends ZoneServer {
  _weather2016: Weather2016;
  // @ts-ignore yeah idk how to fix that
  _packetHandlers: zonePacketHandlers = new zonePacketHandlers();
  _weatherTemplates: any;
  _items: any = {};
  _vehicles: { [characterId: string]: Vehicle } = {};
  _reloadPacketsInterval: any;
  _clients: { [characterId: string]: Client } = {};
  _characters: { [characterId: string]: Character } = {};
  worldObjectManager: WorldObjectManager;
  _ready: boolean = false;
  _itemDefinitions: { [itemDefinitionId: number]: any } = itemDefinitions;
  _itemDefinitionIds: any[] = Object.keys(this._itemDefinitions);
  _containerDefinitions: { [containerDefinitionId: number]: any } =
    containerDefinitions;
  _containerDefinitionIds: any[] = Object.keys(this._containerDefinitions);
  _respawnLocations: any;
  _speedTrees: any;
  _recipes: { [recipeId: number]: any } = recipes;
  _explosives: any;
  _traps: any;

  constructor(
    serverPort: number,
    gatewayKey: Uint8Array,
    mongoAddress = "",
    worldId?: number,
    internalServerPort?: number
  ) {
    super(serverPort, gatewayKey, mongoAddress, worldId, internalServerPort);
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this._clientProtocol = "ClientProtocol_1080";
    this._dynamicWeatherEnabled = false;
    this._cycleSpeed = 100;
    this._weatherTemplates = localWeatherTemplates;
    this._defaultWeatherTemplate = "H1emuBaseWeather";
    this._weather2016 = this._weatherTemplates[this._defaultWeatherTemplate];
    this._speedTrees = {};
    this._spawnLocations = spawnLocations;
    this._explosives = {};
    this._traps = {};
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
    this._loginServerInfo = {
      address: "127.0.0.1",
      port: 1110,
    };
    this.worldObjectManager = new WorldObjectManager();
  }

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

    client.character = {
      ...client.character,
      guid: "0x665a2bff2b44c034", // default, only matters for multiplayer
      actorModelId: character.actorModelId,
      headActor: character.headActor,
      isRespawning: character.isRespawning,
      gender: character.gender,
      creationDate: character.creationDate,
      lastLoginDate: character.lastLoginDate,
      factionId: 2, // default
      isRunning: false,
      resources: {
        health: 10000,
        stamina: 600,
        food: 10000,
        water: 10000,
        virus: 0,
        comfort: 5000,
        bleeding: -40,
      },
      equipment: [
        // default SurvivorMale equipment
        {
          modelName: character.headActor,
          slotId: 1,
        },
        {
          modelName: `Survivor${
            client.character.gender == 1 ? "Male" : "Female"
          }_Eyes_01.adr`,
          slotId: 105,
        },
        {
          modelName: `Survivor${
            client.character.gender == 1 ? "Male" : "Female"
          }_Legs_Pants_Underwear.adr`,
          slotId: 4,
        },
        {
          modelName: `Survivor${
            client.character.gender == 1 ? "Male" : "Female"
          }_Chest_Bra.adr`,
          textureAlias: "",
          slotId: 3,
        },
      ],
      _loadout: {},
      currentLoadoutSlot: 7, //fists
      _equipment: {},
      _containers: {},
      state: {
        position: new Float32Array([0, 0, 0, 1]),
        rotation: new Float32Array([0, 0, 0, 1]),
        lookAt: new Float32Array([0, 0, 0, 1]),
        health: 0,
        shield: 0,
      },
    };
    if (character.hairModel) {
      client.character._equipment[27] = {
        modelName: character.hairModel,
        slotId: 27,
      };
    }
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

    // default equipment / loadout
    this.equipItem(client, this.generateItem(85), false); // fists weapon
    this.equipItem(client, this.generateItem(2377), false); // DOA Hoodie
    this.equipItem(client, this.generateItem(2079), false); // golf pants
    //this.equipItem(client, this.generateItem(2425), false); // ar15
  }

  async sendCharacterData(client: Client) {
    await this.loadCharacterData(client);

    const backpack = this.generateItem(2393);
    this.equipItem(client, backpack, false); // test backpack
    const item: any = this.generateItem(2425),
      containers = [
        {
          unknownDword1: 28, // container itemDefinitionId ?
          containerData: {
            guid: backpack,
            unknownDword1: 28,
            associatedCharacterId: client.character.characterId,
            slots: 9999,
            items: [
              {
                itemDefinitionId: this._items[item].itemDefinitionId,
                itemData: {
                  itemDefinitionId: this._items[item].itemDefinitionId,
                  tintId: 0,
                  guid: item,
                  count: 1,
                  itemSubData: {
                    unknownBoolean1: false,
                  },
                  containerGuid: backpack,
                  containerDefinitionId: 3,
                  containerSlotId: 1,
                  baseDurability: 0,
                  currentDurability: 0,
                  maxDurabilityFromDefinition: 0,
                  unknownBoolean1: true,
                  unknownQword3: backpack,
                  unknownDword9: 0,
                  unknownBoolean2: true,
                },
              },
            ],
            unknownBoolean1: false,
            unknownDword3: 999,
            unknownDword4: 3,
            unknownDword5: 777,
            unknownBoolean2: true,
          },
        },
      ];

    this.sendData(client, "SendSelfToClient", {
      data: {
        guid: client.character.guid, // todo: guid should be moved to client, instead of character
        characterId: client.character.characterId,
        transientId: client.character.transientId,
        actorModelId: client.character.actorModelId,
        headActor: client.character.headActor,
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
          items: Object.keys(client.character._loadout).map((slotId: any) => {
            const slot = client.character._loadout[slotId];
            return {
              itemDefinitionId: slot.itemDefinitionId,
              tintId: 5,
              guid: slot.itemGuid,
              count: 1, // also ammoCount
              itemSubData: {
                hasSubData: false /*
                unknownDword1: 1,
                unknownData1: {
                  unknownQword1: item,
                  unknownDword1: 1,
                  unknownDword2: 1
                }*/,
              },
              containerGuid: slot.containerGuid,
              containerDefinitionId: 28, // TEMP
              containerSlotId: slot.slotId,
              baseDurability: 2000,
              currentDurability: slot.currentDurability,
              maxDurabilityFromDefinition: 2000,
              unknownBoolean1: true,
              unknownQword3: client.character.characterId,
              unknownDword9: 1,
              unknownBoolean2: true,
            };
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
                  unknownDword4: 3,
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

    this.sendData(client, "Command.ItemDefinitions", {
      // sends full list of item definitions
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
        this._mongoAddress
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
        (await initMongo(this._mongoAddress, debugName));
      this._db = mongoClient.db("h1server");
    }

    this._spawnLocations = this._soloMode
      ? spawnLocations
      : await this._db?.collection("spawns").find().toArray();
    this._weatherTemplates = this._soloMode
      ? localWeatherTemplates
      : await this._db?.collection("weathers").find().toArray();
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
      this._vehicles[vehicle.npcData.characterId] = new Vehicle(
        this._worldId,
        vehicle.npcData.characterId,
        vehicle.npcData.transientId,
        vehicle.npcData.modelId,
        new Float32Array(vehicle.npcData.position),
        new Float32Array(vehicle.npcData.rotation),
        this._gameTime
      );
      this._vehicles[vehicle.npcData.characterId].npcData = vehicle.npcData;
      this._vehicles[vehicle.npcData.characterId].positionUpdate =
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

  async setupServer(): Promise<void> {
    this.forceTime(971172000000); // force day time by default - not working for now
    this._frozeCycle = false;
    await this.fetchZoneData();
    this._profiles = this.generateProfiles();
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
      this._dynamicWeatherWorker = setInterval(() => dynamicWeather(this), 100);
    }
    this._gatewayServer.start(true); // SET TO TRUE OR ELSE MULTIPLAYER PACKETS ARE BROKEN
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
      this.POIManager(client);
      client.posAtLastRoutine = client.character.state.position;
    });
    if (this._ready) this.worldObjectManager.run(this);
    if (refresh) this.worldRoutineTimer.refresh();
  }
  deleteClient(client: Client) {
    if(client){
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
      /*const guid = this.generateGuid();
      const transientId = 1;
      const characterId = this.generateGuid();
      const prop = {
        characterId: characterId,
        worldId: this._worldId,
        guid: guid,
        transientId: transientId,
        modelId: 9,
        position: character.state.position,
        rotation: [0, 0, 0, 0],
        scale: [1, 1, 1, 1],
        positionUpdateType: 1,
      };
      this.sendDataToAll("PlayerUpdate.AddLightweightNpc", prop);
      if (!this._soloMode) {
        this._db?.collection("props").insertOne(prop);
      }
      this._props[characterId] = prop;*/
    }
    character.isAlive = false;
  }
  
  explosionDamage(position: Float32Array, npcTriggered: string) {
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
      if (vehicle.npcData.characterId != npcTriggered) {
        if (isPosInRadius(5, vehicle.npcData.position, position)) {
          const distance = getDistance(position, vehicle.npcData.position);
          const damage = 250000 / distance;
          setTimeout(() => {
            this.damageVehicle(damage, vehicle);
          }, 100);
        }
      }
    }
    for (const explosive in this._explosives) {
      const explosiveObj = this._explosives[explosive];
      if (explosiveObj.characterId != npcTriggered) {
        if (getDistance(position, explosiveObj.position) < 3) {
          setTimeout(() => {
            this.explodeExplosive(explosiveObj);
          }, 150);
          return;
        }
      }
    }
  }

  damageVehicle(damage: number, vehicle: Vehicle, loopDamageMs = 0) {
    if (!vehicle.isInvulnerable) {
      let destroyedVehicleEffect: number;
      let destroyedVehicleModel: number;
      let minorDamageEffect: number;
      let majorDamageEffect: number;
      let criticalDamageEffect: number;
      let supercriticalDamageEffect: number;
      switch (vehicle.npcData.vehicleId) {
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
      vehicle.npcData.resources.health -= damage;
      if (vehicle.npcData.resources.health <= 0) {
        vehicle.npcData.resources.health = 0;
        this.explosionDamage(
          vehicle.npcData.position,
          vehicle.npcData.characterId
        );
        this.sendDataToAll("Character.Destroyed", {
          characterId: vehicle.npcData.characterId,
          unknown1: destroyedVehicleEffect, // destroyed offroader effect
          unknown2: destroyedVehicleModel, // destroyed offroader model
          unknown3: 0,
          disableWeirdPhysics: false,
        });
        vehicle.npcData.destroyedState = 4;
        for (const c in this._clients) {
          if (
            vehicle.npcData.characterId ===
            this._clients[c].vehicle.mountedVehicle
          ) {
            this.dismountVehicle(this._clients[c]);
          }
        }
        if (vehicle.resourcesUpdater) {
          clearInterval(vehicle.resourcesUpdater);
        }
        delete this._vehicles[vehicle.npcData.characterId];
        setTimeout(() => {
          this.sendDataToAllWithSpawnedVehicle(
            vehicle.npcData.characterId,
            "Character.RemovePlayer",
            {
              characterId: vehicle.npcData.characterId,
            }
          );
        }, 15000);
      } else {
        let damageeffect = 0;
        let allowSend = false;
        let startDamageTimeout = false;
        if (
          vehicle.npcData.resources.health <= 50000 &&
          vehicle.npcData.resources.health > 35000
        ) {
          if (vehicle.npcData.destroyedState != 1) {
            damageeffect = minorDamageEffect;
            allowSend = true;
            vehicle.npcData.destroyedState = 1;
          }
        } else if (
          vehicle.npcData.resources.health <= 35000 &&
          vehicle.npcData.resources.health > 20000
        ) {
          if (vehicle.npcData.destroyedState != 2) {
            damageeffect = majorDamageEffect;
            allowSend = true;
            vehicle.npcData.destroyedState = 2;
          }
        } else if (
          vehicle.npcData.resources.health <= 20000 &&
          vehicle.npcData.resources.health > 10000
        ) {
          if (vehicle.npcData.destroyedState != 3) {
            damageeffect = criticalDamageEffect;
            allowSend = true;
            startDamageTimeout = true;
            vehicle.npcData.destroyedState = 3;
          }
        } else if (vehicle.npcData.resources.health <= 10000) {
          if (vehicle.npcData.destroyedState != 4) {
            damageeffect = supercriticalDamageEffect;
            allowSend = true;
            startDamageTimeout = true;
            vehicle.npcData.destroyedState = 4;
          }
        } else if (
          vehicle.npcData.resources.health > 50000 &&
          vehicle.npcData.destroyedState != 0
        ) {
          vehicle.npcData.destroyedState = 0;
          this._vehicles[vehicle.npcData.characterId].destroyedEffect = 0;
        }

        if (allowSend) {
          this.sendDataToAllWithSpawnedVehicle(
            vehicle.npcData.characterId,
            "Command.PlayDialogEffect",
            {
              characterId: vehicle.npcData.characterId,
              effectId: damageeffect,
            }
          );
          this._vehicles[vehicle.npcData.characterId].destroyedEffect =
            damageeffect;
          if (!vehicle.damageTimeout && startDamageTimeout) {
            this.startVehicleDamageDelay(vehicle);
          }
        }

        this.updateResourceToAllWithSpawnedVehicle(
          vehicle.passengers.passenger1,
          vehicle.npcData.characterId,
          vehicle.npcData.resources.health,
          561,
          1
        );
      }
    }
  }

  startVehicleDamageDelay(vehicle: Vehicle) {
    vehicle.damageTimeout = setTimeout(() => {
      this.damageVehicle(1000, vehicle);
      if (
        vehicle.npcData.resources.health < 20000 &&
        vehicle.npcData.resources.health > 0
      ) {
        vehicle.damageTimeout.refresh();
      }
    }, 1000);
  }

  async respawnPlayer(client: Client) {
    client.character.isAlive = true;
    client.isLoading = true;
    client.character.resources.health = 10000;
    client.character.resources.food = 10000;
    client.character.resources.water = 10000;
    client.character.resources.stamina = 600;
    client.character.resources.bleeding = -40;
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
    const spawnLocations = this._soloMode
      ? localSpawnList
      : await this._db?.collection("spawns").find().toArray();
    const randomSpawnIndex = Math.floor(Math.random() * spawnLocations.length);
    this.sendData(client, "ClientUpdate.UpdateLocation", {
      position: spawnLocations[randomSpawnIndex].position,
    });
    client.character.state.position = spawnLocations[randomSpawnIndex].position;
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
          if (Math.floor(Math.random() * 10) == 1) {
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
  
  updateResourceToAllWithSpawnedVehicle(
    client: Client,
    entityId: string,
    value: number,
    resource: number,
    resourceType: number
  ) {
    this.sendDataToAllOthersWithSpawnedVehicle(
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
        this.updateResource(
          client,
          client.character.characterId,
          client.character.resources.bleeding > 0 ? client.character.resources.bleeding : 0,
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
      this.sendDataToAllOthersWithSpawnedCharacter(
        client,
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
        !e.npcData?.positionUpdateType && // TODO: change this behavior this will cause issues
        this.filterOutOfDistance(e, client.character.state.position)
    );
    client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });
    objectsToRemove.forEach((object: any) => {
      const characterId = object.characterId
        ? object.characterId
        : object.npcData.characterId;
      this.sendData(
        client,
        "Character.RemovePlayer",
        {
          characterId,
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
    this.sendDataToAll(
      "Character.RemovePlayer",
      {
        characterId: characterId,
      },
      1
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
          /*
          this.sendData(
            client,
            "AddSimpleNpc",
            { ...this._objects[object] },
            1
          );
          */
          this.sendData(
            client,
            "AddLightweightNpc",
            {
              ...this._objects[object],
              nameId: this.getItemDefinition(
                this._items[this._objects[object].itemGuid].itemDefinitionId
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

  createClient(sessionId:number,soeClientId:string,loginSessionId:string,characterId:string,generatedTransient:number){
    return new Client(
      sessionId,
      soeClientId,
      loginSessionId,
      characterId,
      generatedTransient
    );
  }

  getGameTime(): number {
    //debug("get server time");
    const delta = Date.now() - this._startGameTime;
    return this._frozeCycle
      ? Number(((this._gameTime + delta) / 1000).toFixed(0))
      : Number((this._gameTime / 1000).toFixed(0));
  }

  sendGameTimeSync(client: Client): void {
    debug(`GameTimeSync ${this._cycleSpeed} ${this.getGameTime()}\n`);
    //this._gameTime = this.getGameTime();
    this.sendData(client, "GameTimeSync", {
      time: Int64String(this.getGameTime()),
      cycleSpeed: this._cycleSpeed,
      unknownBoolean: false,
    });
  }

  getTransientId(guid: string): number {
    let generatedTransient;
    do {
      generatedTransient = Number((Math.random() * 30000).toFixed(0));
    } while (this._transientIds[generatedTransient]);
    this._transientIds[generatedTransient] = guid;
    return generatedTransient;
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
  sendDataToAllOthersWithSpawnedCharacter(
    client: Client,
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    for (const a in this._clients) {
      if (
        client != this._clients[a] &&
        this._clients[a].spawnedEntities.includes(
          this._characters[client.character.characterId]
        )
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
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
          vehicle.npcData.position
        )
      ) {
        if (!client.spawnedEntities.includes(vehicle)) {
          this.sendData(client, "AddLightweightVehicle", vehicle, 1);
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
              characterId: vehicle.npcData.characterId,
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
      objectCharacterId: vehicle.npcData.characterId,
      characterId: client.character.characterId,
    });
    this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
      control: true,
      objectCharacterId: vehicle.npcData.characterId,
    });
    client.managedObjects.push(vehicle.npcData.characterId);
    vehicle.isManaged = true;
  }

  dropManagedObject(
    client: Client,
    vehicle: Vehicle,
    keepManaged: boolean = false
  ) {
    const index = client.managedObjects.indexOf(vehicle.npcData.characterId);
    if (index > -1) {
      // todo: vehicle seat swap managed object drop logic
      debug("\n\n\n\n\n\n\n\n\n\n drop managed object");

      this.sendData(client, "Character.ManagedObject", {
        objectCharacterId: vehicle.npcData.characterId,
        characterId: client.character.characterId,
      });
      this.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
        control: false,
        objectCharacterId: vehicle.npcData.characterId,
      });
      client.managedObjects.splice(index, 1);
      // blocks vehicleManager from taking over management during a takeover
      if (!keepManaged) vehicle.isManaged = false;
    }
  }

  takeoverManagedObject(newClient: Client, vehicle: Vehicle) {
    const index = newClient.managedObjects.indexOf(vehicle.npcData.characterId);
    if (index === -1) {
      // if object is already managed by client, do nothing
      debug("\n\n\n\n\n\n\n\n\n\n takeover managed object");
      for (const characterId in this._clients) {
        const oldClient = this._clients[characterId];
        const idx = oldClient.managedObjects.indexOf(
          vehicle.npcData.characterId
        );
        if (idx > -1) {
          this.dropManagedObject(oldClient, vehicle, true);
          break;
        }
      }
      this.assignManagedObject(newClient, vehicle);
    }
  }

  sendDataToAllWithSpawnedVehicle(
    entityCharacterId: string = "",
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          this._vehicles[entityCharacterId]
        )
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }

  sendDataToAllWithSpawnedExplosive(
    entityCharacterId: string = "",
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          this._explosives[entityCharacterId]
        )
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }
	
  sendDataToAllWithSpawnedTrap(
    entityCharacterId: string = "",
    packetName: any,
    obj: any,
    channel = 0
  ): void {
    if (!entityCharacterId) return;
    for (const a in this._clients) {
      if (
        this._clients[a].spawnedEntities.includes(
          this._traps[entityCharacterId]
        )
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }
	
  sendDataToAllOthersWithSpawnedVehicle(
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
        this._clients[a].spawnedEntities.includes(
          this._vehicles[entityCharacterId]
        )
      ) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }
  mountVehicle(client: Client, vehicleGuid: string): void {
    const vehicle = this._vehicles[vehicleGuid];
    if (!vehicle) return;
    client.vehicle.mountedVehicle = vehicle.npcData.characterId;
    switch (vehicle.npcData.vehicleId) {
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
    this.sendDataToAllWithSpawnedVehicle(
      vehicleGuid,
      "Mount.MountResponse",
      {
        // mounts character
        characterId: client.character.characterId,
        vehicleGuid: vehicle.npcData.characterId, // vehicle guid
        seatId: Number(seatId),
        unknownDword3: seatId === "0" ? 1 : 0, //isDriver
        identity: {},
      }
    );
    if (seatId === "0") {
      //this.takeoverManagedObject(client, vehicle); // disabled for now, client won't drop management
      if (vehicle.npcData.resources.fuel > 0) {
        this.sendDataToAllWithSpawnedVehicle(
          vehicleGuid,
          "Vehicle.Engine",
          {
            guid2: vehicleGuid,
            engineOn: true,
          }
        );
        this._vehicles[vehicleGuid].engineOn = true;
        this._vehicles[vehicleGuid].resourcesUpdater = setInterval(() => {
          if (!this._vehicles[vehicleGuid].engineOn) {
            clearInterval(this._vehicles[vehicleGuid].resourcesUpdater);
          }
          if (this._vehicles[vehicleGuid].positionUpdate.engineRPM) {
            const fuelLoss =
              this._vehicles[vehicleGuid].positionUpdate.engineRPM * 0.01;
            this._vehicles[vehicleGuid].npcData.resources.fuel -= fuelLoss;
          }
          if (this._vehicles[vehicleGuid].npcData.resources.fuel < 0) {
            this._vehicles[vehicleGuid].npcData.resources.fuel = 0;
          }
          if (
            this._vehicles[vehicleGuid].engineOn &&
            this._vehicles[vehicleGuid].npcData.resources.fuel <= 0
          ) {
            this.sendDataToAllWithSpawnedVehicle(
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
            vehicle.npcData.characterId,
            vehicle.npcData.resources.fuel,
            396,
            50
          );
        }, 3000);
      }
      this.sendDataToAllWithSpawnedCharacter(client, "Vehicle.Owner", {
        guid: vehicle.npcData.characterId,
        characterId: client.character.characterId,
        unknownDword1: 0,
        vehicleId: vehicle.npcData.vehicleId,
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
      guid: vehicle.npcData.characterId,
      characterId: client.character.characterId,
      vehicleId: vehicle.npcData.vehicleId,
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
    this.sendDataToAllWithSpawnedVehicle(
      client.vehicle.mountedVehicle,
      "Mount.DismountResponse",
      {
        // dismounts character
        characterId: client.character.characterId,
      }
    );
    if (seatId === "0") {
      this.sendDataToAllWithSpawnedVehicle(
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
    if(client.vehicle.mountedVehicleType == "spectate") {
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
      guid: vehicle.npcData.characterId,
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
      this.sendDataToAllWithSpawnedVehicle(
        client.vehicle.mountedVehicle,
        "Mount.SeatChangeResponse",
        {
          characterId: client.character.characterId,
          vehicleGuid: vehicle.npcData.characterId,
          identity: {},
          seatId: packet.data.seatId,
        }
      );
      vehicle.seats[oldSeatId] = "";
      vehicle.seats[packet.data.seatId] = client.character.characterId;
      if (oldSeatId === "0") {
        this.sendDataToAllWithSpawnedVehicle(
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
        //this.takeoverManagedObject(client, vehicle); // disabled for now, client won't drop management
        this.sendDataToAllWithSpawnedVehicle(
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
  //#region ********************INVENTORY********************

  updateLoadout(client: Client) {
    this.sendData(client, "Loadout.SetLoadoutSlots", {
      characterId: client.character.characterId,
      loadoutId: 3, // needs to be 3
      loadoutData: {
        loadoutSlots: Object.keys(client.character._loadout).map(
          (slotId: any) => {
            const slot = client.character._loadout[slotId];
            return {
              hotbarSlotId: slot.slotId, // affects Equip Item context entry packet, and Container.MoveItem
              loadoutId: 3,
              slotId: slot.slotId,
              loadoutItemData: {
                itemDefinitionId: slot.itemDefinitionId,
                loadoutItemOwnerGuid: slot.itemGuid,
                unknownByte1: 255, // flags?
              },
              unknownDword4: 3,
            };
          }
        ),
      },
      currentSlotId: client.character.currentLoadoutSlot,
    });
  }

  addLoadoutItem(client: Client, slotId: number) {
    const loadoutItem = client.character._loadout[slotId];
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: loadoutItem.itemDefinitionId,
        tintId: 5,
        guid: loadoutItem.itemGuid,
        count: 1, // also ammoCount
        itemSubData: {
          unknownBoolean1: false,
        },
        containerGuid: loadoutItem.containerGuid,
        containerDefinitionId: 28, // temp
        containerSlotId: loadoutItem.slotId,
        baseDurability: 2000,
        currentDurability: loadoutItem.currentDurability,
        maxDurabilityFromDefinition: 2000,
        unknownBoolean1: true,
        unknownQword3: client.character.characterId,
        unknownDword9: 28,
        unknownBoolean2: true,
      },
    });
  }

  updateEquipment(client: Client, character = client.character) {
    this.sendData(client, "Equipment.SetCharacterEquipment", {
      characterData: {
        characterId: character.characterId,
      },
      equipmentSlots: Object.keys(character._equipment).map((slotId: any) => {
        const slot = character._equipment[slotId];
        return {
          equipmentSlotId: slot.slotId,
          equipmentSlotData: {
            equipmentSlotId: slot.slotId,
            guid: slot.guid || "",
            tintAlias: slot.tintAlias || "",
            decalAlias: slot.tintAlias || "#",
          },
        };
      }),
      attachmentData: Object.keys(character._equipment).map((slotId: any) => {
        const slot = character._equipment[slotId];
        return {
          modelName: slot.modelName,
          textureAlias: slot.textureAlias || "",
          tintAlias: slot.tintAlias || "",
          decalAlias: slot.tintAlias || "#",
          slotId: slot.slotId,
        };
      }),
    });
  }

  updateEquipmentSlot(
    client: Client,
    slotId: number,
    character = client.character
  ) {
    const equipmentSlot = client.character._equipment[slotId];
    this.sendDataToAllWithSpawnedCharacter(
      client,
      "Equipment.SetCharacterEquipmentSlot",
      {
        characterData: {
          characterId: character.characterId,
        },
        equipmentSlot: {
          equipmentSlotId: equipmentSlot.slotId,
          equipmentSlotData: {
            equipmentSlotId: equipmentSlot.slotId,
            guid: equipmentSlot.guid || "",
            tintAlias: equipmentSlot.tintAlias || "",
            decalAlias: equipmentSlot.tintAlias || "#",
          },
        },
        attachmentData: {
          modelName: equipmentSlot.modelName,
          textureAlias: equipmentSlot.textureAlias || "",
          tintAlias: equipmentSlot.tintAlias || "",
          decalAlias: equipmentSlot.tintAlias || "#",
          slotId: equipmentSlot.slotId,
        },
      }
    );
  }

  addItem(
    client: Client,
    itemGuid: string,
    containerGuid: string,
    slot: number
  ) {
    const item = this._items[itemGuid],
      itemDef = this.getItemDefinition(item.itemDefinitionId);
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: itemDef.ID,
        tintId: 5,
        guid: itemGuid,
        count: 1, // also ammoCount
        itemSubData: {
          unknownBoolean1: false,
        },
        containerGuid: containerGuid,
        containerDefinitionId: 28,
        containerSlotId: slot,
        baseDurability: 2000,
        currentDurability: 2000,
        maxDurabilityFromDefinition: 2000,
        unknownBoolean1: true,
        unknownQword3: client.character.characterId,
        unknownDword9: 28,
        unknownBoolean2: true,
      },
    });
  }

  equipItem(client: Client, itemGuid: string = "", sendPacket: boolean = true) {
    if (!itemGuid) {
      debug("[ERROR] EquipItem: ItemGuid is blank!");
      return;
    }
    const item = this._items[itemGuid],
      def = this.getItemDefinition(item.itemDefinitionId),
      loadoutSlotId = this.getLoadoutSlot(item.itemDefinitionId);
    if (loadoutSlotId == -1) {
      debug(
        `[ERROR] equipItem: Tried to equip item with itemDefinitionId: ${item.itemDefinitionId} with an invalid loadoutSlotId!`
      );
      return;
    }
    const equipmentSlotId = this.getEquipmentSlot(loadoutSlotId),
      loadoutData = {
        itemDefinitionId: def.ID,
        slotId: loadoutSlotId,
        itemGuid: item.guid,
        containerGuid: "0xFFFFFFFFFFFFFFFF",
        currentDurability: 2000,
        stackCount: 1,
        loadoutItemOwnerGuid: client.character.characterId,
      },
      equipmentData = {
        modelName: def.MODEL_NAME.replace(
          "<gender>",
          client.character.gender == 1 ? "Male" : "Female"
        ),
        slotId: equipmentSlotId,
        guid: item.guid,
        textureAlias: def.TEXTURE_ALIAS,
        tintAlias: "",
      };

    client.character._loadout[loadoutSlotId] = loadoutData;
    client.character._equipment[equipmentSlotId] = equipmentData;

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
    }

    if (!sendPacket) return;

    this.addLoadoutItem(client, loadoutSlotId);
    this.updateLoadout(client);
    this.updateEquipmentSlot(client, equipmentSlotId);
  }

  getItemDefinition(itemDefinitionId: any) {
    return this._itemDefinitions[itemDefinitionId];
  }
  getContainerDefinition(containerDefinitionId: any) {
    return this._containerDefinitions[containerDefinitionId];
  }

  generateItem(itemDefinitionId: any) {
    const generatedGuid = `0x${Math.floor(
      Math.random() * (0x3fffffffffffffff - 0x3000000000000000) +
        0x3000000000000000
    ).toString(16)}`;
    this._items[generatedGuid] = {
      guid: generatedGuid,
      itemDefinitionId: Number(itemDefinitionId),
    };
    if (!this.getItemDefinition(this._items[generatedGuid].itemDefinitionId)) {
      debug(
        `[ERROR] GenerateItem: Invalid item definition: ${itemDefinitionId}`
      );
      return;
    }
    return generatedGuid;
  }

  getLoadoutSlot(itemDefinitionId: number) {
    const loadoutSlotItemClass = loadoutSlotItemClasses.find(
      (slot: any) =>
        slot.ITEM_CLASS === this.getItemDefinition(itemDefinitionId).ITEM_CLASS
    );
    return loadoutSlotItemClass ? loadoutSlotItemClass.SLOT : -1;
  }

  getEquipmentSlot(loadoutSlotId: number) {
    return loadoutEquipSlots.find((slot: any) => slot.SLOT_ID === loadoutSlotId)
      .EQUIP_SLOT_ID;
  }

  getContainerBulk(container: loadoutContainer): number {
    let bulk = 0;
    Object.keys(container.items).forEach((itemGuid) => {
      const item = container.items[itemGuid];
      bulk += this.getItemDefinition(item.itemDefinitionId).BULK;
    });
    return bulk;
  }

  getAvailableContainer(
    client: Client,
    itemDefinitionId: number,
    count: number
  ): loadoutContainer | undefined {
    // returns the first container that has enough space to store count * itemDefinitionId bulk
    /*
    let availableContainer = null;
    const itemDef = this.getItemDefinition(itemDefinitionId);
    Object.keys(client.character._containers).every((loadoutSlotId) => {
      const container = client.character._containers[Number(loadoutSlotId)],
      containerItemDef = this.getItemDefinition(container?.itemDefinitionId),
      containerDef = this.getContainerDefinition(containerItemDef?.PARAM1)
      if(container && containerDef?.MAX_BULK >= (this.getContainerBulk(container) + (itemDef.BULK * count))){
        availableContainer = container;
        return false;
      }
      return true;
    })
    return availableContainer;
    */

    // TEMP LOGIC UNTIL CONTAINERS WORK
    if (client.character._loadout[12] && client.character._containers[12]) {
      return client.character._containers[12];
    } // backpack
    return undefined;
  }

  getItemContainer(
    client: Client,
    itemGuid: string
  ): loadoutContainer | undefined {
    // returns the container that an item is contained in
    let itemContainer = undefined;
    Object.keys(client.character._containers).forEach((loadoutSlotId) => {
      const container = client.character._containers[Number(loadoutSlotId)];
      if (container.items[itemGuid]) {
        itemContainer = container;
      }
    });
    return itemContainer;
  }

  getAvailableItemStack(
    container: loadoutContainer,
    itemDefId: number,
    count: number
  ): string {
    // returns the itemGuid of the first open stack in container arg that has enough open slots and is the same itemDefinitionId as itemDefId arg
    let itemStack = "";
    if (this.getItemDefinition(itemDefId).MAX_STACK_SIZE == 1) return itemStack;
    Object.keys(container.items).every((itemGuid) => {
      const item = container.items[itemGuid];
      if (
        item.itemDefinitionId == itemDefId &&
        this.getItemDefinition(item.itemDefinitionId).MAX_STACK_SIZE >=
          item.stackCount + count
      ) {
        itemStack = item.itemGuid;
        return false;
      }
      return true;
    });
    return itemStack;
  }

  hasInventoryItem(client: Client, itemGuid: string, count: number = 1): boolean {
    const item = this._items[itemGuid],
      itemDefinition = this.getItemDefinition(item.itemDefinitionId);
    const loadoutSlotId = this.getLoadoutSlot(itemDefinition.ID);
    if (client.character._loadout[loadoutSlotId]?.itemGuid == itemGuid) {
      return true;
    } else {
      const removeItemContainer = this.getItemContainer(client, itemGuid);
      const removeItem = removeItemContainer?.items[itemGuid];
      if (!removeItemContainer || !removeItem) return false;
      if (removeItem.stackCount == count) {
        return true;
      } else if (removeItem.stackCount > count) {
        return true;
      }
      else { // if count > removeItem.stackCount 
        return false;
      }
    }
  }

  removeInventoryItem(client: Client, itemGuid: string, count: number = 1): boolean {
    const item = this._items[itemGuid],
      itemDefinition = this.getItemDefinition(item.itemDefinitionId);
    const loadoutSlotId = this.getLoadoutSlot(itemDefinition.ID);
    if (client.character._loadout[loadoutSlotId]?.itemGuid == itemGuid) {
      this.deleteItem(client, itemGuid);
      // TODO: add logic for checking if loadout item has an equipment slot, ex. radio doesn't have one
      const equipmentSlotId = this.getEquipmentSlot(loadoutSlotId);
      delete client.character._loadout[loadoutSlotId];
      delete client.character._equipment[equipmentSlotId];
      this.updateLoadout(client);
      this.sendData(client, "Equipment.UnsetCharacterEquipmentSlot", {
        characterData: {
          characterId: client.character.characterId,
        },
        slotId: equipmentSlotId,
      });
      if (equipmentSlotId === 7) {
        // primary slot
        this.equipItem(client, client.character._loadout[7].itemGuid); //equip fists
      }
    } else {
      const removeItemContainer = this.getItemContainer(client, itemGuid);
      const removeItem = removeItemContainer?.items[itemGuid];
      if (!removeItemContainer || !removeItem) return false;
      if (removeItem.stackCount == count) {
        delete removeItemContainer.items[itemGuid];
        this.deleteItem(client, itemGuid);
      } else if (removeItem.stackCount > count) {
        removeItem.stackCount -= count;
        this.updateContainerItem(
          client,
          removeItem.itemGuid,
          removeItemContainer
        );
      }
      else { // if count > removeItem.stackCount 
        return false;
      }
    }
    if (itemDefinition.ITEM_TYPE === 34) {
      delete client.character._containers[item.guid];
    }
    return true;
  }

  dropItem(client: Client, itemGuid: string, count: number = 1) {
    const item = this._items[itemGuid],
      itemDefinition = this.getItemDefinition(item.itemDefinitionId);
    const modelId = itemDefinition.WORLD_MODEL_ID;
    if (!modelId) {
      debug(
        `[ERROR] DropItem: No WORLD_MODEL_ID mapped to itemDefinitionId: ${this._items[itemGuid].itemDefinitionId}`
      );
    }
    if(!this.removeInventoryItem(client, itemGuid, count)) return;
    this.sendData(client, "Character.DroppedIemNotification", {
      characterId: client.character.characterId,
      itemDefId: item.itemDefinitionId,
      count: count,
    });
    
    this.worldObjectManager.createLootEntity(
      this,
      itemDefinition.ID,
      count,
      [...client.character.state.position],
      [0, Number(Math.random() * 10 - 5), 0, 1],
	    15,
    );
    this.spawnObjects(client); // manually call this for now
  }

  lootItem(client: Client, itemGuid: string | undefined, count: number) {
    if (!itemGuid) return;
    const itemDefId = this._items[itemGuid].itemDefinitionId;
    if (this.getItemDefinition(itemDefId).FLAG_CAN_EQUIP) {
      if (client.character._loadout[this.getLoadoutSlot(itemDefId)]) {
        this.lootContainerItem(client, itemGuid, count);
      } else {
        this.sendData(client, "Reward.AddNonRewardItem", {
          itemDefId: itemDefId,
          iconId: this.getItemDefinition(itemDefId).IMAGE_SET_ID,
          count: count,
        });
        this.equipItem(client, itemGuid);
      }
    } else {
      this.lootContainerItem(client, itemGuid, count);
    }
  }

  pickupItem(client: Client, guid: string) {
    const object = this._objects[guid];
    if (!this._items[object.itemGuid]) {
      this.sendChatText(
        client,
        `[ERROR] No item definition mapped to id: ${object.modelId}`
      );
      return;
    }
    this.sendData(client, "Command.PlayDialogEffect", {
      characterId: guid,
      effectId: this.getItemDefinition(
        this._items[object.itemGuid].itemDefinitionId
      ).PICKUP_EFFECT ?? 5151,
    });
    this.lootItem(client, object.itemGuid, object.stackCount);
    this.deleteEntity(guid, this._objects);
    delete this.worldObjectManager._spawnedObjects[object.spawnerId];
  }

  lootContainerItem(
    client: Client,
    itemGuid: string | undefined,
    count: number,
    sendUpdate: boolean = true
  ) {
    if (!itemGuid) return;
    const itemDefId = this._items[itemGuid].itemDefinitionId,
      availableContainer = this.getAvailableContainer(client, itemDefId, count);
    if (!availableContainer) {
      // container error full
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
      this.updateContainerItem(client, itemStack.itemGuid, availableContainer);
      if (sendUpdate) {
        this.sendData(client, "Reward.AddNonRewardItem", {
          itemDefId: itemDefId,
          iconId: this.getItemDefinition(itemDefId).IMAGE_SET_ID,
          count: count,
        });
      }
      delete this._items[itemGuid];
    } else {
      this.addContainerItem(
        client,
        itemGuid,
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

  addContainerItem(
    client: Client,
    itemGuid: string | undefined,
    container: loadoutContainer,
    count: number,
    sendUpdate: boolean = true
  ) {
    if (!itemGuid) return;
    const itemDefId = this._items[itemGuid].itemDefinitionId;
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: itemDefId,
        tintId: 3,
        guid: itemGuid,
        count: count, // also ammoCount
        itemSubData: {
          hasSubData: true,
          unknownDword1: 1,
          unknownData1: {
            unknownQword1: client.character.characterId,
            unknownDword1: 3,
            unknownDword2: 3,
          },
        },
        containerGuid: container.itemGuid,
        containerDefinitionId: 0,
        containerSlotId: 1,
        baseDurability: 2000,
        currentDurability: 2000,
        maxDurabilityFromDefinition: 2000,
        unknownBoolean1: true,
        unknownQword3: client.character.characterId,
        unknownDword9: 0,
        unknownBoolean2: true,
      },
    });
    container.items[itemGuid] = {
      itemDefinitionId: itemDefId,
      slotId: 1,
      itemGuid: itemGuid,
      containerGuid: container.itemGuid,
      stackCount: count,
      currentDurability: 2000,
    };
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
    itemGuid: string,
    container: loadoutContainer | undefined
  ) {
    if (!container) return;
    const itemDefId = this._items[itemGuid].itemDefinitionId;
    const item = container.items[itemGuid];
    this.sendData(client, "ClientUpdate.ItemUpdate", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: itemDefId,
        tintId: 3,
        guid: itemGuid,
        count: item.stackCount, // also ammoCount
        itemSubData: {
          hasSubData: true,
          unknownDword1: 1,
          unknownData1: {
            unknownQword1: client.character.characterId,
            unknownDword1: 3,
            unknownDword2: 3,
          },
        },
        containerGuid: container.itemGuid,
        containerDefinitionId: 0,
        containerSlotId: 1,
        baseDurability: 2000,
        currentDurability: 2000,
        maxDurabilityFromDefinition: 2000,
        unknownBoolean1: true,
        unknownQword3: client.character.characterId,
        unknownDword9: 0,
        unknownBoolean2: true,
      },
    });
  }

  startTimer(client: Client, stringId: number, time: number) {
    this.sendData(client, "ClientUpdate.StartTimer", {
      stringId: stringId,
      time: time,
    });
  }

  eatItem(client: Client, itemGuid: string, nameId: number) {
    const item = this._items[itemGuid];
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
    this.utilizeHudTimer(
      client,
      this.eatItemPass,
      [client, itemGuid, eatCount, drinkCount, givetrash],
      nameId,
      timeout
    );
  }

  useMedical(client: Client, itemGuid: string, nameId: number) {
    const item = this._items[itemGuid];
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
    this.utilizeHudTimer(
      client,
      this.useMedicalPass,
      [client, itemGuid, healCount, bandagingCount],
      nameId,
      timeout
    );
  }

  igniteOption(client: Client, itemGuid: string, nameId: number) {
    const item = this._items[itemGuid];
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
    this.utilizeHudTimer(
      client,
      this.igniteoptionPass,
      [client, itemGuid],
      nameId,
      timeout
    );
  }

  drinkItem(client: Client, itemGuid: string, nameId: number) {
    const item = this._items[itemGuid];
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

    this.utilizeHudTimer(
      client,
      this.drinkItemPass,
      [client, itemGuid, eatCount, drinkCount, givetrash],
      nameId,
      timeout
    );
  }

  
  fillPass(client: Client, itemGuid: string) {
    if (client.character.characterStates.inWater) {
      this.removeInventoryItem(client, itemGuid, 1);
      this.lootContainerItem(client, this.generateItem(1368), 1); // give dirty water
    } else {
      this.sendData(client, "ClientUpdate.TextAlert", {
        message: "There is no water source nearby",
      });
    }
  }

  useItem(client: Client, itemGuid: string) {
    const item = this._items[itemGuid],
      itemDefinition = this.getItemDefinition(item.itemDefinitionId);
    const nameId = itemDefinition.NAME_ID;
    let useoption = "";
    let timeout = 1000;
    switch (item.itemDefinitionId) {
      case 1353: // empty bottle
        useoption = "fill";
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
        this.utilizeHudTimer(
          client,
          this.fillPass,
          [client, itemGuid],
          nameId,
          timeout
        );
        break;
      default:
        return;
    }
  }
  refuelVehicle(client: Client, itemGuid: string, vehicleGuid: string) {
    const item = this._items[itemGuid],
      itemDefinition = this.getItemDefinition(item.itemDefinitionId);
    const nameId = itemDefinition.NAME_ID;
    let timeout = 5000;
    let fuelValue = 2500;
    switch (item.itemDefinitionId) {
      case 1384: // ethanol
        fuelValue = 5000;
        break;
      default:
        break;
    }
    this.utilizeHudTimer(
      client,
      this.refuelVehiclePass,
      [client, itemGuid, vehicleGuid, fuelValue],
      nameId,
      timeout
    );
  }

  shredItem(client: Client, itemGuid: string) {
    const itemDefinition = this.getItemDefinition(
      this._items[itemGuid].itemDefinitionId
    );
    const nameId = itemDefinition.NAME_ID;
    const itemType = itemDefinition.ITEM_TYPE;
    let count = 1;
    let timeout = 3000;
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
    this.utilizeHudTimer(
      client,
      this.shredItemPass,
      [client, itemGuid, count],
      nameId,
      timeout
    );
  }

  drinkItemPass(
    client: Client,
    itemGuid: string,
    eatCount: number,
    drinkCount: number,
    givetrash: number
  ) {
    this.removeInventoryItem(client, itemGuid, 1);
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
    itemGuid: string,
    eatCount: number,
    drinkCount: number,
    givetrash: number
  ) {
    this.removeInventoryItem(client, itemGuid, 1);
    client.character.resources.food += eatCount;
    client.character.resources.water += drinkCount;
    const { food, water } = client.character.resources;
    this.updateResource(client, client.character.characterId, food, 4, 4);
    this.updateResource(client, client.character.characterId, water, 5, 5);
    if (givetrash) {
      this.lootContainerItem(client, this.generateItem(givetrash), 1);
    }
  }

  igniteoptionPass(client: Client, itemGuid: string) {
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
    itemGuid: string,
    healCount: number,
    bandagingCount: number
  ) {
    client.character.healingMaxTicks += healCount;
    client.character.resources.bleeding -= bandagingCount;
    const { bleeding } = client.character.resources;
    if (!client.character.healingInterval) {
      client.character.starthealingInterval(client, this);
    }
    this.updateResource(
      client,
      client.character.characterId,
      bleeding > 0 ? bleeding : 0,
      21,
      21
    );
    this.removeInventoryItem(client, itemGuid, 1);
  }

  refuelVehiclePass(
    client: Client,
    itemGuid: string,
    vehicleGuid: string,
    fuelValue: number
  ) {
    this.removeInventoryItem(client, itemGuid, 1);
    const vehicle = this._vehicles[vehicleGuid];
    vehicle.npcData.resources.fuel += fuelValue;
    if (vehicle.npcData.resources.fuel > 10000) {
      vehicle.npcData.resources.fuel = 10000;
    }
    this.updateResourceToAllWithSpawnedVehicle(
      client,
      vehicleGuid,
      vehicle.npcData.resources.fuel,
      396,
      50
    );
  }

  shredItemPass(client: Client, itemGuid: string, count: number) {
    this.removeInventoryItem(client, itemGuid, 1);
    this.lootItem(client, this.generateItem(23), count);
  }

  utilizeHudTimer(
    client: Client,
    callback: any,
    args: any,
    nameId: number,
    timeout: number
  ) {
    this.startTimer(client, nameId, timeout);
    if (client.hudTimer != null) {
      clearTimeout(client.hudTimer);
    }
    client.posAtLogoutStart = client.character.state.position;
    client.hudTimer = setTimeout(() => {
      callback.apply(this, args);
    }, timeout);
  }

  igniteIED(IED: any) {
    if (!IED.isIED) {
      return;
    }
    this.sendDataToAllWithSpawnedExplosive(
      IED.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: IED.characterId,
        effectId: 5034,
      }
    );
    this.sendDataToAllWithSpawnedExplosive(
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
    this.sendDataToAllWithSpawnedExplosive(
      explosive.characterId,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: explosive.characterId,
        effectId: 1875,
        position: explosive.position,
      }
    );
    this.sendDataToAllWithSpawnedExplosive(
      explosive.characterId,
      "Character.RemovePlayer",
      {
        characterId: explosive.characterId,
      }
    );
    delete this._explosives[explosive.characterId];
    this.explosionDamage(explosive.position, explosive.characterId);
  }
  
  getInventoryAsContainer(client: Client): {[itemDefinitionId: number]: inventoryItem[]} {
    const inventory: {[itemDefinitionId: number]: inventoryItem[]} = {};
    Object.keys(client.character._containers).forEach((loadoutSlotId) => {
      const container = client.character._containers[Number(loadoutSlotId)];
      Object.keys(container.items).forEach((itemGuid) => {
        const item = container.items[itemGuid];
        inventory[item.itemDefinitionId] = []; // init array
        inventory[item.itemDefinitionId].push(item); // push new itemstack
      });
    });
    return inventory;
  }
  
  craftItem(client: Client, recipeId: number, count: number): string | undefined{
  // TODO: convert this to a class because this function sucks

    /*
  const timerTime = 1000;
  this.sendData(client, "ClientUpdate.StartTimer", {
    stringId: 0,
    time: timerTime,
  });
  */
    const recipe = this._recipes[recipeId];
    if(!recipe) {
      this.sendChatText(client, `[ERROR] Invalid recipeId ${recipeId}`);
      return undefined;
    }
    
    for(const component of recipe.components){
      let inventory = this.getInventoryAsContainer(client);
      if(!Object.keys(inventory).includes(component.itemDefinitionId.toString())) {
        // if inventory doesn't have component but has materials for it
        if(!this._recipes[component.itemDefinitionId]) {
          return undefined; // no valid recipe to craft component
        }
        //for(let i = 0; i < count; i++) {
          if(!this.craftItem(client, component.itemDefinitionId, component.requiredAmount * count)){
            console.log("Craftitem error")
            return undefined; // craftItem returned some error
          }
        //}
      } 
      let remainingItems = component.requiredAmount * count;
      inventory = this.getInventoryAsContainer(client);
      inventory[component.itemDefinitionId]?.forEach((item) => {
        if(item.stackCount >= remainingItems) {
          if(this.hasInventoryItem(client, item.itemGuid, remainingItems)) {
            this.removeInventoryItem(client, item.itemGuid, remainingItems);
          }
          else {
            return undefined; // return if not enough items
          }
        }
        else {
          if(this.hasInventoryItem(client, item.itemGuid, item.stackCount)) {
            this.removeInventoryItem(client, item.itemGuid, item.stackCount)
          }
          else {
            return undefined; // return if not enough items
          }
        }
      })
    }
    const itemGuid = this.generateItem(recipe.itemDefinitionId);
    this.lootItem(client, itemGuid, count);
    return itemGuid;
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

  reloadPackets(client: Client, intervalTime = -1): void {
    this.reloadZonePacketHandlers();
    this._protocol.reloadPacketDefinitions();
    this.sendChatText(client, "[DEV] Packets reloaded", true);
  }
}

if (process.env.VSCODE_DEBUG === "true") {
  new ZoneServer2016(
    1117,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    process.env.MONGO_URL,
    2
  ).start();
}

