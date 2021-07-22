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
import { GatewayServer } from "../GatewayServer/gatewayserver";
import { default as packetHandlers } from "./zonepackethandlers";
import { H1Z1Protocol as ZoneProtocol } from "../../protocols/h1z1protocol";
import { _ } from "../../utils/utils";
import {
  generateRandomGuid,
  initMongo,
  Int64String,
  isPosInRadius,
} from "../../utils/utils";
import { Client, Weather } from "../../types/zoneserver";
import { Db, MongoClient } from "mongodb";
import { Worker } from "worker_threads";
import dynamicWeather from "./workers/dynamicWeather";

const localSpawnList = require("../../../data/2015/sampleData/spawnLocations.json");

const debugName = "ZoneServer";
const debug = require("debug")(debugName);
const spawnLocations = require("../../../data/2015/sampleData/spawnLocations.json");
const localWeatherTemplates = require("../../../data/2015/sampleData/weather.json");
const stats = require("../../../data/2015/sampleData/stats.json");
const recipes = require("../../../data/2015/sampleData/recipes.json");
const Z1_POIs = require("../../../data/2015/zoneData/Z1_POIs");

export class ZoneServer extends EventEmitter {
  _gatewayServer: GatewayServer;
  _protocol: any;
  _db: Db | undefined;
  _soloMode: any;
  _mongoClient: any;
  _mongoAddress: string;
  _clients: any;
  _characters: any;
  _gameTime: any;
  _serverTime: any;
  _transientIds: any;
  _packetHandlers: any;
  _referenceData: any;
  _startTime: number;
  _startGameTime: number;
  _cycleSpeed: number;
  _frozeCycle: boolean;
  _profiles: any[];
  _weather: Weather;
  _spawnLocations: any;
  _defaultWeatherTemplate: string;
  _weatherTemplates: any;
  _npcs: any;
  _objects: any;
  _reloadPacketsInterval: any;
  _pingTimeoutTime: number;
  _worldId: number;
  _npcRenderDistance: number;
  _dynamicWeatherInterval: any;
  _dynamicWeatherEnabled: boolean;
  _vehicles: any;
  _respawnLocations: any[];
  _doors: any;
  _props: any;
  _interactionDistance: number;
  _dummySelf: any;

  constructor(
    serverPort: number,
    gatewayKey: Uint8Array,
    mongoAddress = "",
    worldId = 0
  ) {
    super();
    this._gatewayServer = new GatewayServer(
      "ExternalGatewayApi_3",
      serverPort,
      gatewayKey
    );
    this._mongoAddress = mongoAddress;
    this._worldId = worldId;
    this._protocol = new ZoneProtocol();
    this._clients = {};
    this._characters = {};
    this._npcs = {};
    this._objects = {};
    this._doors = {};
    this._vehicles = {};
    this._props = {};
    this._serverTime = this.getCurrentTime();
    this._transientIds = {};
    this._referenceData = this.parseReferenceData();
    this._packetHandlers = packetHandlers;
    this._startTime = 0;
    this._startGameTime = 0;
    this._cycleSpeed = 0;
    this._frozeCycle = false;
    this._reloadPacketsInterval;
    this._soloMode = false;
    this._weatherTemplates = localWeatherTemplates;
    this._defaultWeatherTemplate = "H1emuBaseWeather";
    this._weather = this._weatherTemplates[this._defaultWeatherTemplate];
    this._profiles = [];
    this._interactionDistance = 4;
    this._npcRenderDistance = 350;
    this._pingTimeoutTime = 30000;
    this._dynamicWeatherEnabled = true;
    this._dummySelf = require("../../../data/2015/sampleData/sendself.json");
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
    if (!this._mongoAddress) {
      this._soloMode = true;
      debug("Server in solo mode !");
    }
    this.on("data", (err, client, packet) => {
      if (err) {
        console.error(err);
      } else {
        if (
          packet.name != "KeepAlive" &&
          packet.name != "PlayerUpdateUpdatePositionClientToZone" &&
          packet.name != "PlayerUpdateManagedPosition"
        ) {
          debug(`Receive Data ${[packet.name]}`);
        }
        if (this._packetHandlers[packet.name]) {
          try {
            this._packetHandlers[packet.name](this, client, packet);
          } catch (e) {
            debug(e);
          }
        } else {
          debug(packet);
          debug("Packet not implemented in packetHandlers");
        }
      }
    });

    this.on("login", (err, client) => {
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
    });

    this._gatewayServer._soeServer.on(
      "PacketLimitationReached",
      (client: Client) => {
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

    this._gatewayServer.on(
      "login",
      (
        err: string,
        client: Client,
        characterId: string,
        loginSessionId: string
      ) => {
        debug( `Client logged in from ${client.address}:${client.port} with character id: ${characterId}` );
        this._clients[client.sessionId] = client;
        let generatedTransient;
        do {
          generatedTransient = Number((Math.random() * 30000).toFixed(0));
        } while (this._transientIds[generatedTransient]);
        this._transientIds[generatedTransient] = characterId;
        client.isLoading = true;
        client.firstLoading = true;
        client.loginSessionId = loginSessionId;
        client.vehicle = {
          vehicleState: 0,
          falling: -1,
        };
        client.character = {
          characterId: characterId,
          transientId: generatedTransient,
          isRunning: false,
          equipment: [
            { modelName: "Weapon_Empty.adr", slotId: 1 }, // yeah that's an hack TODO find a better way
            { modelName: "Weapon_Empty.adr", slotId: 7 },
            {
              modelName: "SurvivorMale_Ivan_Shirt_Base.adr",
              defaultTextureAlias: "Ivan_Tshirt_Navy_Shoulder_Stripes",
              slotId: 3,
            },
            {
              modelName: "SurvivorMale_Ivan_Pants_Base.adr",
              defaultTextureAlias: "Ivan_Pants_Jeans_Blue",
              slotId: 4,
            },
          ],
          resources: {
            health: 5000,
            stamina: 50,
            food: 5000,
            water: 5000,
            virus: 6000,
          },
          state: {
            position: new Float32Array([0, 0, 0, 0]),
            rotation: new Float32Array([0, 0, 0, 0]),
            lookAt: new Float32Array([0, 0, 0, 0]),
            health: 0,
            shield: 0,
          },
        };
        client.lastPingTime = new Date().getTime() + 120 * 1000;
        client.pingTimer = setInterval(() => {
          this.checkIfClientStillOnline(client);
        }, 20000);
        client.spawnedEntities = [];
        this._characters[characterId] = client.character;

        this.emit("login", err, client);
      }
    );

    this._gatewayServer.on("disconnect", (err: string, client: Client) => {
      debug(`Client disconnected from ${client.address}:${client.port}`);
      clearInterval(client.pingTimer);
      if (client.character?.characterId) {
        delete this._characters[client.character.characterId];
      }
      delete this._clients[client.sessionId];
      this.emit("disconnect", err, client);
    });

    this._gatewayServer.on("session", (err: string, client: Client) => {
      debug(`Session started for client ${client.address}:${client.port}`);
    });

    this._gatewayServer.on(
      "tunneldata",
      (err: string, client: Client, data: Buffer, flags: number) => {
        const packet = this._protocol.parse(
          data,
          flags,
          true,
          this._referenceData
        );
        if (packet) {
          this.emit("data", null, client, packet);
        } else {
          debug("zonefailed : ", data);
        }
      }
    );
  }

  async setupServer(): Promise<void> {
    this.forceTime(971172000000); // force day time by default
    await this.loadMongoData();
    this._weather = this._soloMode
      ? this._weatherTemplates[this._defaultWeatherTemplate]
      : _.find(this._weatherTemplates, (template: { templateName: string }) => {
          return template.templateName === this._defaultWeatherTemplate;
        });
    this._profiles = this.generateProfiles();
    if (
      await this._db?.collection("worlds").findOne({ worldId: this._worldId })
    ) {
      await this.fetchWorldData();
      setTimeout(() => {
        this.saveWorld();
      }, 30000);
    } else {
      await this.saveWorld();
    }
    debug("Server ready");
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
      allTransient[vehicle.npcData.transientId] = key;
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

  async fetchWorldData(): Promise<void> {
    if (!this._soloMode) {
      const worldData = await this._db
        ?.collection("worlds")
        .findOne({ worldId: this._worldId });
      this._doors = worldData.doors;
      this._props = worldData.props;
      this._vehicles = worldData.vehicles;
      this._npcs = worldData.npcs;
      this._objects = worldData.objects;
      this._weather = worldData.weather;
      this._transientIds = this.getAllCurrentUsedTransientId();
      debug("World fetched!");
    }
  }

  async saveWorld(): Promise<void> {
    if (!this._soloMode) {
      if (this._worldId) {
        if (
          await this._db
            ?.collection("worlds")
            .findOne({ worldId: this._worldId })
        ) {
          const save = {
            worldId: this._worldId,
            npcs: this._npcs,
            doors: this._doors,
            props: this._props,
            vehicles: this._vehicles,
            weather: this._weather,
            objects: this._objects,
          };
          const worker = new Worker(__dirname + "/workers/saveWorld.js", {
            workerData: {
              mongoAddress: this._mongoAddress,
              worldId: this._worldId,
              worldSave: JSON.stringify(save),
            },
          });
          worker.on("message", debug);
          worker.on("error", debug);
        } else {
          this.createAllObjects();
          const save = {
            worldId: this._worldId,
            npcs: this._npcs,
            doors: this._doors,
            props: this._props,
            vehicles: this._vehicles,
            weather: this._weather,
            objects: this._objects,
          };
          await this._db?.collection("worlds").insertOne(save);
        }
      } else {
        this.createAllObjects();
        const save = {
          worldId: this._worldId,
          npcs: this._npcs,
          doors: this._doors,
          props: this._props,
          vehicles: this._vehicles,
          weather: this._weather,
          objects: this._objects,
        };
        const numberOfWorld: number =
          (await this._db?.collection("worlds").find({}).count()) || 0;
        const createdWorld = await this._db?.collection("worlds").insertOne({
          ...save,
          worldId: numberOfWorld + 1,
        });
        this._worldId = createdWorld?.ops[0].worldId;
        debug("World saved!");
      }
      setTimeout(() => {
        this.saveWorld();
      }, 30000);
    } else {
      this.createAllObjects();
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
    await this.setupServer();
    this._startTime += Date.now();
    this._startGameTime += Date.now();
    if (this._dynamicWeatherEnabled) {
      this._dynamicWeatherInterval = setInterval(
        () => dynamicWeather(this),
        5000
      );
    }
    this._gatewayServer.start();
  }

  async loadMongoData(): Promise<void> {
    this._spawnLocations = this._soloMode
      ? localSpawnList
      : await this._db?.collection("spawns").find().toArray();
    this._weatherTemplates = this._soloMode
      ? localWeatherTemplates
      : await this._db?.collection("weathers").find().toArray();
  }

  async reloadMongoData(client: Client): Promise<void> {
    await this.loadMongoData();
    this.sendChatText(client, "[DEV] Mongo data reloaded", true);
  }

  reloadPackets(client: Client, intervalTime = -1): void {
    if (intervalTime > 0) {
      if (this._reloadPacketsInterval)
        clearInterval(this._reloadPacketsInterval);
      this._reloadPacketsInterval = setInterval(
        () => this.reloadPackets(client),
        intervalTime * 1000
      );
      this.sendChatText(
        client,
        `[DEV] Packets reload interval is set to ${intervalTime} seconds`,
        true
      );
    } else {
      this.reloadZonePacketHandlers();
      this._protocol.reloadPacketDefinitions();
      this.sendChatText(client, "[DEV] Packets reloaded", true);
    }
  }

  reloadZonePacketHandlers(): void {
    delete require.cache[require.resolve("./zonepackethandlers")];
    this._packetHandlers = require("./zonepackethandlers").default;
  }

  checkIfClientStillOnline(client: Client): void {
    if (new Date().getTime() - client.lastPingTime > this._pingTimeoutTime) {
      clearInterval(client.pingTimer);
      debug( `Client disconnected from ${client.address}:${client.port} ( ping timeout )` );
      clearInterval(client.character?.resourcesUpdater);
      if (client.character?.characterId) {
        delete this._characters[client.character.characterId];
      }
      delete this._clients[client.sessionId];
      this._gatewayServer._soeServer.deleteClient(client);
      this.emit("disconnect", null, client);
    }
  }

  generateGuid(): string {
    const guid = generateRandomGuid();
    return guid;
  }

  parseReferenceData(): any {
    /*
    const itemData = fs.readFileSync(
        `${__dirname}/../../../data/dataSources/ClientItemDefinitions.txt`,
        "utf8"
      ),
      itemLines = itemData.split("\n"),
      items = {};
    for (let i = 1; i < itemLines.length; i++) {
      const line = itemLines[i].split("^");
      if (line[0]) {
        (items as any)[line[0]] = line[1];
      }
    }*/
    return { itemTypes: undefined };
  }

  async saveCharacterPosition(client: Client, updtTimeMs = 0) {
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
    if (updtTimeMs) {
      setTimeout(() => {
        this.saveCharacterPosition(client, updtTimeMs);
      }, updtTimeMs);
    }
  }

  async characterData(client: Client): Promise<void> {
    delete require.cache[
      require.resolve("../../../data/2015/sampleData/sendself.json") // reload json
    ];
    this._dummySelf = require("../../../data/2015/sampleData/sendself.json"); // dummy this._dummySelf
    const {
      data: { identity },
    } = this._dummySelf;

    let characterName;
    let character;
    if (!this._soloMode) {
      character = await this._db
        ?.collection("characters")
        .findOne({ characterId: client.character.characterId });
      characterName = character.payload.name;
    } else {
      delete require.cache[
        require.resolve(
          "../../../data/2015/sampleData/single_player_characters.json"
        )
      ];
      const SinglePlayerCharacters = require("../../../data/2015/sampleData/single_player_characters.json");
      character = SinglePlayerCharacters.find(
        (character: any) =>
          character.characterId === client.character.characterId
      );
      characterName = character.payload.name;
    }

    this._dummySelf.data.identity.characterFirstName = characterName;
    this._dummySelf.data.guid = character.characterId;
    this._dummySelf.data.characterId = character.characterId;
    client.character.guid = client.character.characterId;
    client.character.name =
      identity.characterFirstName + identity.characterLastName;
    const characterDataMongo = await this._db
      ?.collection("characters")
      .findOne({ characterId: client.character.characterId });
    client.character.extraModel = characterDataMongo?.extraModelTexture
      ? characterDataMongo.extraModelTexture
      : this._dummySelf.data.extraModelTexture;

    if (
      _.isEqual(this._dummySelf.data.position, [0, 0, 0, 1]) &&
      _.isEqual(this._dummySelf.data.rotation, [0, 0, 0, 1])
    ) {
      // if position/rotation hasn't be changed
      if (this._soloMode || !characterDataMongo.position) {
        this._dummySelf.data.isRandomlySpawning = true;
      }
    }

    if (this._dummySelf.data.isRandomlySpawning) {
      // Take position/rotation from a random spawn location.
      const randomSpawnIndex = Math.floor(
        Math.random() * this._spawnLocations.length
      );
      this._dummySelf.data.position = client.character.state.position =
        this._spawnLocations[randomSpawnIndex].position;
      this._dummySelf.data.rotation = client.character.state.rotation =
        this._spawnLocations[randomSpawnIndex].rotation;
      client.character.spawnLocation =
        this._spawnLocations[randomSpawnIndex].name;
    } else {
      if (!this._soloMode) {
        this._dummySelf.data.position = characterDataMongo.position;
        this._dummySelf.data.rotation = characterDataMongo.rotation;
      }
      client.character.state.position = this._dummySelf.data.position;
      client.character.state.rotation = this._dummySelf.data.rotation;
    }
    /* const characterResources: any[] = []; DISABLED since it's not read by the game rn + we don't need to send all resources
    resources.forEach((resource: any) => {
      characterResources.push({
        resourceType: resource.RESOURCE_TYPE,
        resourceData: {
          subResourceData: {
            resourceId: resource.ID,
            resourceType: resource.RESOURCE_TYPE,
            unknownArray1: [],
          },
          unknownData2: {
            max_value: resource.MAX_VALUE,
            initial_value: resource.INITIAL_VALUE,
          },
        },
      });
    });
    this._dummySelf.data.characterResources = characterResources;*/
    this._dummySelf.data.profiles = this._profiles;
    this._dummySelf.data.stats = stats;
    this._dummySelf.data.recipes = recipes;
    this.sendData(client, "SendSelfToClient", this._dummySelf);
  }

  generateProfiles(): any[] {
    const profiles: any[] = [];
    const profileTypes = require("../../../data/2015/dataSources/ProfileTypes.json");
    profileTypes.forEach((profile: any) => {
      profiles.push({
        profileId: profile.ID,
        type: profile.ID,
        nameId: profile.NAME_ID,
      });
    });
    debug("Generated profiles");
    return profiles;
  }

  sendInitData(client: Client): void {
    this.sendData(client, "InitializationParameters", {
      environment: "LIVE",
      serverId: 1,
    });

    this.SendZoneDetailsPacket(client, this._weather);

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

    this.characterData(client);

    this.sendData(client, "PlayerUpdate.SetBattleRank", {
      characterId: client.character.characterId,
      battleRank: 100,
    });
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
          "PlayerUpdate.AddLightweightNpc",
          { ...this._npcs[npc], profileId: 65 },
          1
        );
        client.spawnedEntities.push(this._npcs[npc]);
      }
    }
  }

  pointOfInterest(client: Client) {
    let isInAPOIArea = false;
    Z1_POIs.forEach((point: any) => {
      if (
        isPosInRadius(
          point.range,
          client.character.state.position,
          point.position
        )
      ) {
        this.sendData(client, "POIChangeMessage", {
          messageStringId: point.stringId,
          id: point.POIid,
        });
        isInAPOIArea = true;
      }
    });
    if (!isInAPOIArea) {
      this.sendData(client, "POIChangeMessage", {
        messageStringId: 0,
        id: 115,
      });
    }
  }

  worldRoutine(client: Client): void {
    this.spawnCharacters(client);
    this.spawnObjects(client);
    this.spawnDoors(client);
    this.spawnProps(client);
    this.spawnNpcs(client);
    this.spawnVehicles(client);
    this.removeOutOfDistanceEntities(client);
    this.pointOfInterest(client);
    client.posAtLastRoutine = client.character.state.position;
  }

  executeFuncForAllClients(zoneServerFuncName: string): void {
    for (const client in this._clients) {
      (this as any)[zoneServerFuncName](this._clients[client]);
    }
  }

  spawnCharacters(client: Client) {
    for (const character in this._characters) {
      const characterObj = this._characters[character];
      if (
        client.character.characterId != character &&
        !client.spawnedEntities.includes(characterObj)
      ) {
        this.sendData(
          client,
          "PlayerUpdate.AddLightweightPc",
          {
            ...characterObj,
            transientId: characterObj.transientId,
            characterFirstName: characterObj.name,
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
          "PlayerUpdate.AddLightweightVehicle",
          this._vehicles[vehicle],
          1
        );
        this.sendData(client, "PlayerUpdate.ManagedObject", {
          guid: this._vehicles[vehicle].npcData.characterId,
          characterId: client.character.characterId,
        });
        client.spawnedEntities.push(this._vehicles[vehicle]);
      }
    }
  }

  filterOutOfDistance(element: any, playerPosition: Float32Array): boolean {
    return !isPosInRadius(
      this._npcRenderDistance,
      playerPosition,
      element.position || element.state?.position || element.npcData.position
    );
  }
  removeOutOfDistanceEntities(client: Client): void {
    const objectsToRemove = client.spawnedEntities.filter((e) =>
      this.filterOutOfDistance(e, client.character.state.position)
    );
    /*client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });*/
    objectsToRemove.forEach((object: any) => {
      const characterId = object.characterId
        ? object.characterId
        : object.npcData.characterId;
      if (characterId in this._vehicles) {
        this.sendData(
          client,
          "PlayerUpdate.RemovePlayerGracefully",
          {
            characterId,
          },
          1
        );
      }
    });
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
            "PlayerUpdate.AddLightweightNpc",
            { ...this._objects[object], profileId: 10 },
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
          this.sendData(
            client,
            "PlayerUpdate.AddLightweightNpc",
            this._doors[door],
            1
          );
          client.spawnedEntities.push(this._doors[door]);
        }
      }
    });
  }

  spawnProps(client: Client): void {
    setImmediate(() => {
      for (const prop in this._props) {
        if (
          isPosInRadius(
            this._npcRenderDistance,
            client.character.state.position,
            this._props[prop].position
          ) &&
          !client.spawnedEntities.includes(this._props[prop])
        ) {
          this.sendData(
            client,
            "PlayerUpdate.AddLightweightNpc",
            this._props[prop],
            1
          );
          client.spawnedEntities.push(this._props[prop]);
        }
      }
    });
  }

  despawnEntity(characterId: string) {
    this.sendDataToAll(
      "PlayerUpdate.RemovePlayerGracefully",
      {
        characterId: characterId,
      },
      1
    );
  }

  deleteEntity(characterId: string, dictionnary: any) {
    this.sendDataToAll(
      "PlayerUpdate.RemovePlayerGracefully",
      {
        characterId: characterId,
      },
      1
    );
    delete dictionnary[characterId];
  }

  vehicleDelete(client: Client) {
    if (client.vehicle.mountedVehicle) {
      delete this._vehicles[client.vehicle.mountedVehicle];
    }
  }

  createEntity(
    modelID: number,
    position: Array<number>,
    rotation: Array<number>,
    dictionnary: any
  ): void {
    const guid = this.generateGuid();
    const characterId = this.generateGuid();
    dictionnary[characterId] = {
      characterId: characterId,
      guid: guid,
      transientId: 1,
      modelId: modelID,
      position: position,
      rotation: rotation,
      attachedObject: {},
      color: {},
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    };
  }

  createAllObjects(): void {
    const { createAllEntities } = require("./workers/createBaseEntities");
    const { npcs, objects, vehicles, doors, props } = createAllEntities(this);
    this._npcs = npcs;
    this._objects = objects;
    this._doors = doors;
    this._vehicles = vehicles;
    this._props = props;
    debug("All entities created");
  }

  data(collectionName: string): any {
    if (this._db) {
      return this._db.collection(collectionName);
    }
  }

  SendZoneDetailsPacket(client: Client, weather: Weather): void {
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

  SendSkyChangedPacket(
    client: Client,
    weather: Weather,
    isGlobal = false
  ): void {
    if (isGlobal) {
      this.sendDataToAll("SkyChanged", weather);
      if (client?.character?.name) {
        this.sendGlobalChatText(
          `User "${client.character.name}" has changed weather.`
        );
      }
    } else {
      this.sendData(client, "SkyChanged", weather);
    }
  }

  changeWeather(client: Client, weather: Weather): void {
    this._weather = weather;
    this.SendSkyChangedPacket(client, weather, this._soloMode ? false : true);
  }

  sendSystemMessage(message: string): void {
    this.sendDataToAll("Chat.Chat", {
      unknown2: 0,
      channel: 2,
      characterId1: "0x0000000000000000",
      characterId2: "0x0000000000000000",
      unknown5_0: 0,
      unknown5_1: 0,
      unknown5_2: 0,
      characterName1: "",
      unknown5_3: "",
      unknown6_0: 0,
      unknown6_1: 0,
      unknown6_2: 0,
      characterName2: "",
      unknown6_3: "",
      message: message,
      position: [0, 0, 0, 1],
      unknownGuid: "0x0000000000000000",
      unknown13: 0,
      color1: 0,
      color2: 0,
      unknown15: 0,
      unknown16: false,
    });
  }

  sendChat(client: Client, message: string, channel: number): void {
    const { character } = client;
    for (const clientKey in this._clients) {
      const targetClient = this._clients[clientKey];
      if (
        isPosInRadius(
          350,
          client.character.state.position,
          targetClient.character.state.position
        )
      ) {
        this.sendData(targetClient, "Chat.Chat", {
          channel: channel,
          characterName1: character.name,
          message: message,
          color1: 1,
        });
      }
    }
  }

  sendGlobalChatText(message: string, clearChat = false): void {
    for (const a in this._clients) {
      this.sendChatText(this._clients[a], message, clearChat);
    }
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

  setCharacterLoadout(
    client: Client,
    loadoutId: number,
    loadoutTab: number
  ): void {
    for (let i = 0; i < client.character.loadouts.length; i++) {
      const loadout = client.character.loadouts[i];
      if (loadout.loadoutId == loadoutId && loadout.loadoutTab == loadoutTab) {
        this.sendChatText(client, "Setting loadout " + loadoutId);
        debug(JSON.stringify(loadout, null, 2));
        client.character.currentLoadout = loadout.loadoutData;

        client.character.currentLoadoutId = loadoutId;
        client.character.currentLoadoutTab = loadoutTab;
        this.sendData(client, "Loadout.SetCurrentLoadout", {
          type: 2,
          unknown1: 0,
          loadoutId: loadoutId,
          tabId: loadoutTab,
          unknown2: 1,
        });
        break;
      }
    }
  }

  sendData(client: Client, packetName: string, obj: any, channel = 0): void {
    if (packetName != "KeepAlive") {
      debug("send data", packetName);
    }
    const data = this._protocol.pack(packetName, obj, this._referenceData);
    this._gatewayServer.sendTunnelData(client, data, channel);
  }

  sendDataToAll(packetName: string, obj: any, channel = 0): void {
    for (const a in this._clients) {
      this.sendData(this._clients[a], packetName, obj, channel);
    }
  }

  sendDataToAllOthers(
    client: Client,
    packetName: string,
    obj: any,
    channel = 0
  ): void {
    for (const a in this._clients) {
      if (client != this._clients[a]) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }

  sendRawToAllOthers(client: Client, data: any): void {
    for (const a in this._clients) {
      if (client != this._clients[a]) {
        this.sendRawData(this._clients[a], data);
      }
    }
  }

  sendWeaponPacket(client: Client, packetName: string, obj: any): void {
    const weaponPacket = {
      gameTime: this.getServerTime(),
      packetName: packetName,
      packet: obj,
    };
    this.sendData(client, "Weapon.Weapon", {
      weaponPacket: weaponPacket,
    });
  }

  sendRawData(client: Client, data: Buffer): void {
    this._gatewayServer.sendTunnelData(client, data);
  }

  stop(): void {
    debug("Shutting down");
    process.exit(0);
  }

  forceTime(time: number): void {
    this._cycleSpeed = 0.1;
    this._frozeCycle = true;
    this._gameTime = time;
    this.sendSyncToAll();
  }

  removeForcedTime(): void {
    this._cycleSpeed = 0.1;
    this._frozeCycle = false;
    this._gameTime = Date.now();
    this.sendSyncToAll();
  }

  getCurrentTime(): number {
    return Number((Date.now() / 1000).toFixed(0));
  }

  getGameTime(): number {
    debug("get server time");
    const delta = Date.now() - this._startGameTime;
    return this._frozeCycle
      ? Number(((this._gameTime + delta) / 1000).toFixed(0))
      : Number((this._gameTime / 1000).toFixed(0));
  }

  getServerTime(): number {
    debug("get server time");
    const delta = Date.now() - this._startTime;
    return this._serverTime + delta;
  }

  sendGameTimeSync(client: Client): void {
    debug("GameTimeSync");
    this.sendData(client, "GameTimeSync", {
      time: Int64String(this.getGameTime()),
      cycleSpeed: this._cycleSpeed,
      unknownBoolean: false,
    });
  }

  sendSyncToAll(): void {
    // TODO: this do not seems to work
    debug("Synchronization");
    this.sendDataToAll("Synchronization", {
      serverTime: Int64String(this.getServerTime()),
      serverTime2: Int64String(this.getServerTime()),
    });
  }

  getTransientId(client: any, guid: string): number {
    let generatedTransient;
    do {
      generatedTransient = Number((Math.random() * 30000).toFixed(0));
    } while (!this._transientIds[generatedTransient]);
    this._transientIds[generatedTransient] = guid;
    return generatedTransient;
  }

  createPositionUpdate(position: Float32Array, rotation?: any): any {
    const obj: any = {
      flags: 4095,
      unknown2_int32: this.getGameTime(),
      unknown3_int8: 0,
      unknown4: 1,
      position: position,
    };
    if (rotation) {
      obj.unknown13_float = rotation;
    }
    return obj;
  }
}
if (process.env.VSCODE_DEBUG === "true") {
  new ZoneServer(
    1117,
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
  ).start();
}
