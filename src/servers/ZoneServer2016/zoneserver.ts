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

const debugName = "ZoneServer";
const debug = require("debug")(debugName);
import { zonePacketHandlers } from "./zonepackethandlers";
import { ZoneServer } from "../ZoneServer/zoneserver";
import { ZoneClient2016 as Client } from "./classes/zoneclient";
import { Vehicle2016 as Vehicle } from "./classes/vehicle";
import { WorldObjectManager } from "./classes/worldobjectmanager";

import {
  characterEquipment,
  characterLoadout,
  Weather2016,
} from "../../types/zoneserver";
import { h1z1PacketsType } from "../../types/packets";
import { Character2016 as Character } from "./classes/character"
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import { _, initMongo, Int64String, isPosInRadius } from "../../utils/utils";

import { Db, MongoClient } from "mongodb";
import dynamicWeather from "./workers/dynamicWeather";

// need to get 2016 lists
const spawnLocations = require("../../../data/2016/zoneData/Z1_spawnLocations.json");
const recipes = require("../../../data/2016/sampleData/recipes.json");
const localWeatherTemplates = require("../../../data/2016/dataSources/weather.json");
const stats = require("../../../data/2016/sampleData/stats.json");
const resources = require("../../../data/2016/dataSources/resourceDefinitions.json");

const itemDefinitions = require("./../../../data/2016/dataSources/ServerItemDefinitions.json");
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

  constructor(serverPort: number, gatewayKey: Uint8Array, mongoAddress = "") {
    super(serverPort, gatewayKey, mongoAddress, 0);
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this._clientProtocol = "ClientProtocol_1080";
    this._dynamicWeatherEnabled = false;
    this._cycleSpeed = 100;
    this._weatherTemplates = localWeatherTemplates;
    this._defaultWeatherTemplate = "H1emuBaseWeather";
    this._weather2016 = this._weatherTemplates[this._defaultWeatherTemplate];
    this._spawnLocations = spawnLocations;
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
      this._packetHandlers.processPacket(this, client, packet);
    }
  }

  
  async onCharacterCreateRequest(client: any, packet: any) {
    function getCharacterModelData(payload: any): any {
      switch(payload.headType){
        case 6: // black female
          return {modelId: 9474, headActor: "SurvivorFemale_Head_03.adr", hairModel: "SurvivorFemale_Hair_ShortMessy.adr"};
        case 5: // black male
          return {modelId: 9240, headActor: "SurvivorMale_Head_04.adr", hairModel: "SurvivorMale_HatHair_Short.adr"};
        case 4: // older white female
          return {modelId: 9474, headActor: "SurvivorFemale_Head_02.adr", hairModel: "SurvivorFemale_Hair_ShortBun.adr"};
        case 3: // young white female
          return {modelId: 9474, headActor: "SurvivorFemale_Head_02.adr", hairModel: "SurvivorFemale_Hair_ShortBun.adr"};
        case 2: // bald white male
          return {modelId: 9240, headActor: "SurvivorMale_Head_01.adr", hairModel: "SurvivorMale_HatHair_Short.adr"};
        case 1: // white male
        default:
          return {modelId: 9240, headActor: "SurvivorMale_Head_01.adr", hairModel: "SurvivorMale_Hair_ShortMessy.adr"};
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
        hairModel: characterModelData.hairModel
      }
      const collection = (this._db as Db).collection("characters");
      const charactersArray = await collection.findOne({
        characterId: character.characterId,
      });
      if (!charactersArray) {
        await collection.insertOne(character);
      }
      this._h1emuZoneServer.sendData(
        client,
        "CharacterCreateReply",
        { reqId: reqId, status: 1 }
      );
    } catch (error) {
      this._h1emuZoneServer.sendData(
        client,
        "CharacterCreateReply",
        { reqId: reqId, status: 0 }
      );
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
      _inventory: {}, // default
      factionId: 2, // default
      isRunning: false,
      resources: {
        health: 5000,
        stamina: 600,
        food: 5000,
        water: 5000,
        virus: 6000,
        comfort: 5000,
      },
      equipment: [
        // default SurvivorMale equipment
        {
          modelName: character.headActor,
          slotId: 1,
        },
        {
          modelName: `Survivor${client.character.gender==1?"Male":"Female"}_Eyes_01.adr`,
          slotId: 105,
        },
        {
          modelName: `Survivor${client.character.gender==1?"Male":"Female"}_Legs_Pants_Underwear.adr`,
          slotId: 4,
        },
        {
          modelName: `Survivor${client.character.gender==1?"Male":"Female"}_Chest_Bra.adr`,
          textureAlias: "",
          slotId: 3,
        },
      ],
      loadout: [],
      state: {
        position: new Float32Array([0, 0, 0, 1]),
        rotation: new Float32Array([0, 0, 0, 1]),
        lookAt: new Float32Array([0, 0, 0, 1]),
        health: 0,
        shield: 0,
      },
    };
    if(character.hairModel) {
      client.character.equipment.push({
        modelName: character.hairModel,
        slotId: 27,
      })
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
  }

  async sendCharacterData(client: Client) {
    await this.loadCharacterData(client);

    const item: any = this.generateItem(2425),
      containerGuid = this.generateGuid(),
      containers = [
        [
          {
            unknownDword1: 3, // container itemDefinitionId ?
            containerData: {
              guid: containerGuid,
              unknownDword1: 3,
              associatedCharacterId: client.character.characterId,
              slots: 9999,
              items: [
                {
                  itemDefinitionId: this._items[item].itemDefinitionId,
                  itemData: {
                    itemDefinitionId: this._items[item].itemDefinitionId,
                    itemData: {
                      itemDefinitionId: this._items[item].itemDefinitionId,
                      tintId: 0,
                      guid: item,
                      count: 1,
                      itemSubData: {
                        unknownBoolean1: false,
                      },
                      unknownQword2: item,
                      unknownDword4: 0,
                      slot: 0,
                      unknownDword6: 0,
                      unknownDword7: 0,
                      unknownDword8: 0,
                      unknownBoolean1: true,
                      unknownQword3: item,
                      unknownDword9: 0,
                      unknownBoolean2: true,
                    },
                    containerGuid: containerGuid,
                    containerDefinitionId: 3,
                    containerSlotId: 1,
                    baseDurability: 0,
                    currentDurability: 0,
                    maxDurabilityFromDefinition: 0,
                    unknownBoolean1: true,
                    unknownQword3: containerGuid,
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
        ],
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
          items: Object.keys(client.character._inventory).map(
            (item: any, index: number) => {
              return {
                itemDefinitionId: this._items[item].itemDefinition.ID,
                tintId: 5,
                guid: item,
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
                containerGuid: item,
                containerDefinitionId: 1,
                containerSlotId: 1,
                baseDurability: 1,
                currentDurability: 1,
                maxDurabilityFromDefinition: 1,
                unknownBoolean1: true,
                unknownQword3: item,
                unknownDword9: 1,
                unknownBoolean2: true,
              };
            }
          ),
        },
        recipes: recipes,
        stats: stats,
        loadoutSlots: {
          loadoutId: 3,
          loadoutData: {
            loadoutSlots: client.character.loadout.map(
              (slot: characterLoadout) => {
                return {
                  unknownDword1: 3,
                  itemDefinitionId: slot.itemDefinitionId,
                  slotId: slot.slotId,
                  unknownData1: {
                    itemDefinitionId: slot.itemDefinitionId,
                    loadoutItemOwnerGuid: slot.itemGuid,
                    unknownByte1: 17,
                  },
                  unknownDword4: 18,
                };
              }
            ),
          },
          loadoutSlotId: 3,
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
        )
        this._vehicles[vehicle.npcData.characterId].npcData = vehicle.npcData;
        this._vehicles[vehicle.npcData.characterId].positionUpdate = vehicle.positionUpdate;
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
      this.POIManager(client);
      client.posAtLastRoutine = client.character.state.position;
    });
    if (this._ready) this.worldObjectManager.run(this); 
    if (refresh) this.worldRoutineTimer.refresh();
  }

  sendWeatherUpdatePacket(client: Client, weather: Weather2016, broadcast = false): void {
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

  filterOutOfDistance(element: any, playerPosition: Float32Array): boolean {
    if(!element) return false;
    return !isPosInRadius(
      this._npcRenderDistance,
      playerPosition,
      element.position || element.state?.position || element.npcData?.position
    );
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
        this.filterOutOfDistance(e, client.character.state.position) &&
        !e.npcData?.isVehicle
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

  spawnNpcs(client: Client): void {
    for (const npc in this._npcs) {
      if (
        isPosInRadius(
          this._npcRenderDistance,
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
        vehicle = vehicleId?this._vehicles[vehicleId]:false;
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
            mountSeatId: vehicle?vehicle.getCharacterSeat(characterObj.characterId):0,
            mountRelatedDword1: vehicle?1:0,
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
            this._npcRenderDistance,
            client.character.state.position,
            this._objects[object].position
          ) &&
          !client.spawnedEntities.includes(this._objects[object])
        ) {
          this.sendData(
            client,
            "AddSimpleNpc",
            { ...this._objects[object] },
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
            this._npcRenderDistance,
            client.character.state.position,
            this._doors[door].position
          ) &&
          !client.spawnedEntities.includes(this._doors[door])
        ) {
          this.sendData(client, "AddSimpleNpc", this._doors[door], 1);
          client.spawnedEntities.push(this._doors[door]);
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
    switch(packetName) {
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
    this._gatewayServer.sendTunnelData(client, data, channel);
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
        ) || this._clients[a] === client
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
                  characterName: this._characters[characterId].name
                },
                unknownString1:this._characters[characterId].name,
                unknownByte1: 1
              }
            })
          })
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
    client.managedObjects.push(vehicle);
    vehicle.isManaged = true;
  }

  dropManagedObject(
    client: Client,
    vehicle: Vehicle,
    keepManaged: boolean = false
  ) {
    const index = client.managedObjects.indexOf(vehicle);
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
    const index = newClient.managedObjects.indexOf(vehicle);
    if (index === -1) {
      // if object is already managed by client, do nothing
      debug("\n\n\n\n\n\n\n\n\n\n takeover managed object");
      for (const characterId in this._clients) {
        const oldClient = this._clients[characterId];
        const idx = oldClient.managedObjects.indexOf(vehicle);
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
  mountVehicle(client: Client, packet: any): void {
    const vehicle = this._vehicles[packet.data.guid];
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
      default:
        client.vehicle.mountedVehicleType = "unknown";
        break;
    }
    const seatId = vehicle.getNextSeatId();
    if (seatId < 0) return; // no available seats in vehicle
    vehicle.seats[seatId] = client.character.characterId;
    this.sendDataToAllWithSpawnedVehicle(
      packet.data.guid,
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
      this.sendDataToAllWithSpawnedVehicle(packet.data.guid, "Vehicle.Engine", {
        // starts engine
        guid2: client.vehicle.mountedVehicle,
        engineOn: true,
      });
    }
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
    }
    client.vehicle.mountedVehicle = "";
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
      loadoutId: 3,
      loadoutData: {
        loadoutSlots: client.character.loadout.map((slot: characterLoadout) => {
          return {
            unknownDword1: 3,
            itemDefinitionId: slot.itemDefinitionId,
            slotId: slot.slotId,
            unknownData1: {
              itemDefinitionId: slot.itemDefinitionId,
              loadoutItemOwnerGuid: slot.itemGuid,
              unknownByte1: 17,
            },
            unknownDword4: 18,
          };
        }),
      },
      loadoutSlotId: 3,
    });
  }

  updateEquipment(client: Client, character = client.character) {
    this.sendDataToAllWithSpawnedCharacter(client, "Equipment.SetCharacterEquipment", {
      characterData: {
        characterId: character.characterId,
      },
      equipmentSlots: character.equipment.map((slot: characterEquipment) => {
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
      attachmentData: character.equipment.map((slot: characterEquipment) => {
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

  addItem(client: Client, itemGuid: string) {
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: this._items[itemGuid].itemDefinition.ID,
        tintId: 5,
        guid: itemGuid,
        count: 1, // also ammoCount
        itemSubData: {
          unknownBoolean1: false,
        },
        containerGuid: itemGuid,
        containerDefinitionId: 1,
        containerSlotId: 1,
        baseDurability: 1,
        currentDurability: 1,
        maxDurabilityFromDefinition: 1,
        unknownBoolean1: true,
        unknownQword3: itemGuid,
        unknownDword9: 1,
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
      def = item.itemDefinition,
      loadoutSlotItemClass = loadoutSlotItemClasses.find(
        (slot: any) => slot.ITEM_CLASS === def.ITEM_CLASS
      ),
      loadoutSlotId = loadoutSlotItemClass ? loadoutSlotItemClass.SLOT : 1, // use primary slot if ItemClass is invalid
      lIndex = client.character.loadout
        .map((slot: any) => slot.slotId)
        .indexOf(loadoutSlotId),
      equipmentSlotId = loadoutEquipSlots.find(
        (slot: any) => slot.SLOT_ID === loadoutSlotId
      ).EQUIP_SLOT_ID,
      eIndex = client.character.equipment
        .map((slot: any) => slot.slotId)
        .indexOf(equipmentSlotId),
      loadoutData = {
        itemDefinitionId: def.ID,
        slotId: loadoutSlotId,
        itemGuid: item.guid,
      },
      equipmentData = {
        modelName: def.MODEL_NAME.replace("<gender>", client.character.gender==1?"Male":"Female"),
        slotId: equipmentSlotId,
        guid: item.guid,
        textureAlias: def.TEXTURE_ALIAS,
        tintAlias: "",
      };

    lIndex === -1
      ? client.character.loadout.push(loadoutData)
      : (client.character.loadout[lIndex] = loadoutData);
    eIndex === -1
      ? client.character.equipment.push(equipmentData)
      : (client.character.equipment[eIndex] = equipmentData);

    const existingItem = Object.keys(client.character._inventory).find(
      (guid: any) =>
        client.character._inventory[guid].loadoutSlotId === loadoutSlotId
    );
    if (existingItem && sendPacket) {
      delete client.character._inventory[existingItem];
      this.sendData(client, "ClientUpdate.ItemDelete", {
        characterId: client.character.characterId,
        itemGuid: existingItem,
      });
    }
    client.character._inventory[item.guid] = item;

    // put this above ItemAdd function when inventory items are tracked in client.character
    if (!sendPacket) return;

    this.updateLoadout(client);
    this.updateEquipment(client);
    this.addItem(client, item.guid);
  }

  generateItem(itemDefinitionId: any) {
    const generatedGuid = this.generateGuid();
    this._items[generatedGuid] = {
      guid: generatedGuid,
      itemDefinition: itemDefinitions.find(
        (itemDef: any) => itemDef.ID === itemDefinitionId
      ),
    };
    if (!this._items[generatedGuid].itemDefinition) {
      debug(
        `[ERROR] GenerateItem: Invalid item definition: ${itemDefinitionId}`
      );
      return;
    }
    return generatedGuid;
  }

  generatePickupItem(objectData: any): any {
    function rnd_number(max: any, fixed: Boolean = false) {
      const num = Math.random() * max;
      return Number(fixed ? num.toFixed(0) : num);
    }

    const authorizedItemDefinitions = itemDefinitions.filter(
      (def: any) =>
        def.WORLD_MODEL_ID === objectData.modelId &&
        def.CODE_FACTORY_NAME !== "AccountRecipe"
    );
    if (!authorizedItemDefinitions.length) {
      debug(
        `[ERROR] GeneratePickupItem: No item definition mapped to id: ${objectData.modelId}`
      );
      return;
    }
    return this.generateItem(
      authorizedItemDefinitions[
        rnd_number(authorizedItemDefinitions.length - 1, true)
      ].ID
    );
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
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    process.env.MONGO_URL
  ).start();
}
