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
import { default as packetHandlers } from "./zonepackethandlers";
import { ZoneServer } from "../ZoneServer/zoneserver";
import { ZoneClient2016 as Client } from "./classes/zoneclient";

import {
  characterEquipment,
  characterLoadout,
  HandledZonePackets2016,
  Weather2016,
} from "../../types/zoneserver";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import { 
  _, 
  initMongo, 
  Int64String, 
  isPosInRadius 
} from "../../utils/utils";

import { MongoClient } from "mongodb";
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
  _packetHandlers: HandledZonePackets2016;
  _weatherTemplates: any;
  _items: any;
  _vehicles: any;

  constructor(serverPort: number, gatewayKey: Uint8Array, mongoAddress = "") {
    super(serverPort, gatewayKey, mongoAddress);
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this._packetHandlers = packetHandlers;
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
    this._items = {};
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
      if ((this._packetHandlers as any)[packet.name]) {
        try {
          (this._packetHandlers as any)[packet.name](this, client, packet);
        } catch (e) {
          debug(e);
        }
      } else {
        debug(packet);
        debug("Packet not implemented in packetHandlers");
      }
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

      loadouts: [], // default
      inventory: [], // default
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
        // temp
        {
          modelName: "SurvivorMale_Head_01.adr",
          slotId: 1,
        },
        {
          modelName: "SurvivorMale_Eyes_01.adr",
          slotId: 105,
        },
        {
          modelName: "SurvivorMale_Hair_ShortMessy.adr",
          slotId: 27,
        },
        {
          modelName: "SurvivorMale_Legs_Pants_Underwear.adr",
          slotId: 4,
        },
        {
          modelName: "SurvivorMale_Chest_Bra.adr",
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
    this._characters[client.character.characterId] = client.character; // character will spawn on other player's screen(s) at this point
  }

  async sendCharacterData(client: Client) {
    await this.loadCharacterData(client);

    /*
    const item: any = this.generateItem(client, 2425),
    containers = [
      [
        {
          unknownDword1: 1501, // container itemDefinitionId ?
          containerData: {
            guid: this.generateGuid(),
            unknownDword1: 0,
            unknownQword1: this.generateGuid(),
            unknownDword2: 0,
            items: [
              {
                itemDefinitionId: this._items[item].itemDefinitionId,
                itemData: {
                  itemDefinitionId: this._items[item].itemDefinitionId,
                  tintId: 0,
                  guid: item,
                  count: 1,
                  itemSubData: {
                    unknownBoolean1: false
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
                  unknownBoolean2: true
                }
              }
            ]
          }
        }
      ]
    ]
    */

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
        recipes: recipes,
        stats: stats,

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
        //containers: containers,
      },
    });
  }

  async fetchZoneData(): Promise<void> {
    if (this._mongoAddress) {
      const mongoClient = (this._mongoClient = new MongoClient(
        this._mongoAddress
      ));
      try {
        await mongoClient.connect();
      } catch (e) {
        throw debug("[ERROR]Unable to connect to mongo server");
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
      this._vehicles = {};
      const vehiclesArray: any = await this._db
        ?.collection("vehicles")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < vehiclesArray.length; index++) {
        const vehicle = vehiclesArray[index];
        this._vehicles[vehicle.npcData.characterId] = vehicle;
      }
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
        this.createAllObjects();
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
        this.createAllObjects();
        const numberOfWorld: number =
          (await this._db?.collection("worlds").find({}).count()) || 0;
        this._worldId = numberOfWorld + 1;
        await this._db?.collection("worlds").insertOne({
          worldId: this._worldId,
        });
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
        debug("World saved!");
      }
    } else {
      this.createAllObjects();
    }
  }

  async setupServer(): Promise<void> {
    this.forceTime(971172000000); // force day time by default - not working for now
    this._frozeCycle = false;
    await this.fetchZoneData();
    this._profiles = this.generateProfiles();
    //this.createAllObjects();
    
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

    if (!this._soloMode){
      debug("Starting H1emuZoneServer")
      if(!this._loginServerInfo.address){
        await this.fetchLoginInfo()
      }
      this._h1emuZoneServer.setLoginInfo(this._loginServerInfo, {
        serverId: this._worldId
      })
      this._h1emuZoneServer.start()
      await this._db
        ?.collection("servers")
        .findOneAndUpdate(
          { serverId: this._worldId },
          { $set: { populationNumber: 0, populationLevel: 0 } }
        );
    }
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
      serverId: 1,
    });

    this.SendZoneDetailsPacket2016(client, this._weather2016);

    this.sendData(client, "ClientUpdate.ZonePopulation", {
      populations: [0, 0],
    });
    this.sendData(client, "ClientUpdate.RespawnLocations", {
      locations: this._respawnLocations,
      locations2: this._respawnLocations,
    });

    this.sendData(client, "ClientGameSettings", {
      unknownQword1: "0x0000000000000000",
      unknownBoolean1: true,
      timescale: 1,
      unknownQword2: "0x0000000000000000",
      unknownFloat1: 0,
      unknownFloat2: 12,
      unknownFloat3: 110,
    });

    this.sendCharacterData(client);

    this.sendData(client, "Character.SetBattleRank", {
      characterId: client.character.characterId,
      battleRank: 100,
    });
  }

  worldRoutine(refresh = false): void {
    debug("WORLDROUTINE");
    this.executeFuncForAllClients((client: Client) => {
      this.removeOutOfDistanceEntities(client);
      this.spawnCharacters(client);
      this.spawnObjects(client);
      this.spawnDoors(client);
      this.spawnNpcs(client);
      this.spawnVehicles(client);
      this.POIManager(client);
      client.posAtLastRoutine = client.character.state.position;
    });
    if (refresh) this.worldRoutineTimer.refresh();
  }

  SendZoneDetailsPacket2016(client: Client, weather: Weather2016): void {
    const SendZoneDetails_packet = {
      zoneName: "Z1",
      unknownBoolean1: true,
      zoneType: 4,
      skyData: weather,
      zoneId1: 3905829720,
      zoneId2: 3905829720,
      nameId: 7699,
      unknownBoolean7: true,
    };
    this.sendData(client, "SendZoneDetails", SendZoneDetails_packet);
  }

  sendWeatherUpdatePacket(
    client: Client,
    weather: Weather2016
  ): void {
    if (!this._soloMode) {
      this.sendDataToAll("UpdateWeatherData", weather);
      if (client?.character?.name) {
        this.sendGlobalChatText(
          `User "${client.character.name}" has changed weather.`
        );
      }
    } else {
      this.sendData(client, "UpdateWeatherData", weather);
    }
  }

  filterOutOfDistance(element: any, playerPosition: Float32Array): boolean {
    return !isPosInRadius(
      this._npcRenderDistance,
      playerPosition,
      element.position || element.state?.position || element.npcData.position
    );
  }

  forceTime(time: number): void {
    this._cycleSpeed = 0.1;
    this._frozeCycle = true;
    this._gameTime = time;
    this.sendSyncToAll();
  }

  removeForcedTime(): void {
    this._cycleSpeed = 100;
    this._frozeCycle = false;
    this._gameTime = Date.now();
    this.sendSyncToAll();
  }

  removeOutOfDistanceEntities(client: Client): void {
    const objectsToRemove = client.spawnedEntities.filter((e) =>
      this.filterOutOfDistance(e, client.character.state.position)
    );
    client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });
    objectsToRemove.forEach((object: any) => {
      const characterId = object.characterId
        ? object.characterId
        : object.npcData.characterId;
      if (characterId in this._vehicles) {
        this.sendData(client, "Character.ManagedObject", {
          objectCharacterId: characterId,
          characterId: client.character.characterId,
        });
      }

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
    for (const character in this._characters) {
      const characterObj = this._characters[character];
      if (
        client.character.characterId != character &&
        isPosInRadius(
          this._npcRenderDistance,
          client.character.state.position,
          characterObj.state.position
        ) &&
        !client.spawnedEntities.includes(characterObj)
      ) {
        this.sendData(
          client,
          "AddLightweightPc",
          {
            ...characterObj,
            transientId: characterObj.transientId,
            identity: {
              characterName: characterObj.name,
            },
            position: characterObj.state.position,
            rotation: characterObj.state.lookAt,
          },
          1
        );
        client.spawnedEntities.push(this._characters[character]);
      }
    }
  }

  spawnVehicles(client: Client) {
    for (const vehicle in this._vehicles) {
      if (
        isPosInRadius(
          this._npcRenderDistance,
          client.character.state.position,
          this._vehicles[vehicle].npcData.position
        ) &&
        !client.spawnedEntities.includes(this._vehicles[vehicle])
      ) {
        this.sendData(
          client,
          "AddLightweightVehicle",
          this._vehicles[vehicle],
          1
        );
        this.sendData(client, "Character.ManagedObject", {
          objectCharacterId: this._vehicles[vehicle].npcData.characterId,
          characterId: client.character.characterId,
        });
        client.spawnedEntities.push(this._vehicles[vehicle]);
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

  createAllObjects(): void {
    const { createAllEntities } = require("./workers/createBaseEntities");
    const { npcs, objects, vehicles, doors } = createAllEntities(this);
    this._npcs = npcs;
    this._objects = objects;
    this._doors = doors;
    this._vehicles = vehicles;
    debug("All entities created");
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

  mountVehicle(client: Client, packet: any): void {
    client.vehicle.mountedVehicle = packet.data.guid;
    switch (this._vehicles[packet.data.guid].npcData.vehicleId) {
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
    this.sendData(client, "Mount.MountResponse", {
      // mounts character
      characterId: client.character.characterId,
      vehicleGuid: client.vehicle.mountedVehicle, // vehicle guid
      identity: {},
    });

    this.sendData(client, "Vehicle.Engine", {
      // starts engine
      guid2: client.vehicle.mountedVehicle,
      engineOn: true,
    });
  }

  dismountVehicle(client: Client): void {
    this.sendData(client, "Mount.DismountResponse", {
      // dismounts character
      characterId: client.character.characterId,
    });
    this.sendData(client, "Vehicle.Engine", {
      // stops engine
      guid2: client.vehicle.mountedVehicle,
      engineOn: false,
    });
    client.vehicle.mountedVehicle = "";
  }

  changeSeat(client: Client, packet: any): void {
    let seatCount;
    switch (client.vehicle.mountedVehicleType) {
      case "offroader":
      case "pickup":
      case "policecar":
        seatCount = 5;
        break;
      case "atv":
        seatCount = 2;
        break;
      case "parachute":
      default:
        seatCount = 1;
        break;
    }
    if (packet.data.seatId < seatCount) {
      this.sendData(client, "Mount.SeatChangeResponse", {
        characterId: client.character.characterId,
        vehicleGuid: client.vehicle.mountedVehicle,
        identity: {},
        seatId: packet.data.seatId,
      });
    }
  }

//#region ********************INVENTORY********************

  updateLoadout(client: Client) {
    this.sendData(client, "Loadout.SelectSlot", {
      characterId: client.character.characterId,
      loadoutItemLoadoutId: 5,
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
      unknownDword2: 19,
    });
  }

  updateEquipment(client: Client, character = client.character) {
    this.sendData(client, "Equipment.SetCharacterEquipment", {
      characterData: {
        characterId: character.characterId,
      },
      equipmentSlots: character.equipment.map(
        (slot: characterEquipment) => {
          return {
            equipmentSlotId: slot.slotId,
            equipmentSlotData: {
              equipmentSlotId: slot.slotId,
              guid: slot.guid || "",
              tintAlias: slot.tintAlias || "",
              decalAlias: slot.tintAlias || "#",
            },
          };
        }
      ),
      attachmentData: character.equipment.map(
        (slot: characterEquipment) => {
          return {
            modelName: slot.modelName,
            textureAlias: slot.textureAlias || "",
            tintAlias: slot.tintAlias || "",
            decalAlias: slot.tintAlias || "#",
            slotId: slot.slotId,
          };
        }
      ),
    });
  }

  equipItem(client: Client, itemGuid: string = "") {
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
        modelName: def.MODEL_NAME.replace("<gender>", "Male"),
        slotId: equipmentSlotId,
        guid: item.guid,
        textureAlias: def.TEXTURE_ALIAS,
        tintAlias: "",
      };

    /* TODO: keep track of items in the inventory. right now the server does not 
    keep track of inventory, and the clientside inventory has it's 0th inventory 
    slot overwritten everytime a loadout item is added */
    this.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: def.ID,
        tintId: 5,
        guid: item.guid,
        count: 1, // also ammoCount
        itemSubData: {
          unknownBoolean1: true,

          unknownDword1: 1,
          unknownData1: {
            unknownQword1: item.guid,
            unknownDword1: 1,
            unknownDword2: 1,
          },
        },
        unknownQword2: item.guid,
        unknownDword4: 1,
        slot: 1,
        unknownDword6: 1,
        unknownDword7: 1,
        unknownDword8: 1,
        unknownBoolean1: true,
        unknownQword3: item.guid,
        unknownDword9: 1,
        unknownBoolean2: true,
      },
    });

    lIndex === -1
      ? client.character.loadout.push(loadoutData)
      : (client.character.loadout[lIndex] = loadoutData);
    this.updateLoadout(client);

    eIndex === -1
      ? client.character.equipment.push(equipmentData)
      : (client.character.equipment[eIndex] = equipmentData);
    this.updateEquipment(client);
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

}

if (process.env.VSCODE_DEBUG === "true") {
  new ZoneServer2016(
    1117,
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    process.env.MONGO_URL
  ).start();
}
