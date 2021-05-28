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
import fs from "fs";
import { default as packetHandlers } from "./zonepackethandlers";
import { H1Z1Protocol as ZoneProtocol } from "../../protocols/h1z1protocol";
import _ from "lodash";
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

const localSpawnList = require("../../../data/sampleData/spawnLocations.json");

const debugName = "ZoneServer";
const debug = require("debug")(debugName);
const localWeatherTemplates = require("../../../data/sampleData/weather.json");
const stats = require("../../../data/sampleData/stats.json");
const recipes = require("../../../data/sampleData/recipes.json");
const ressources = require("../../../data/dataSources/Resources.json");
const Z1_POIs = require("../../../data/zoneData/Z1_POIs");

export class ZoneServer extends EventEmitter {
  _gatewayServer: GatewayServer;
  _protocol: any;
  _db: Db | undefined;
  _soloMode: any;
  _mongoClient: any;
  _mongoAddress: string;
  _clients: any;
  _characters: any;
  _gameTime: number;
  _serverTime: any;
  _transientId: any;
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
  _gameTimeSyncInterval: any;

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
    this._serverTime = this.getCurrentTime();
    this._transientId = 0;
    this._referenceData = this.parseReferenceData();
    this._packetHandlers = packetHandlers;
    this._startTime = 0;
    this._startGameTime = 0;
    this._gameTime = 32400000; // 9am
    this._cycleSpeed = 60;
    this._frozeCycle = false;
    this._reloadPacketsInterval;
    this._soloMode = false;
    this._weatherTemplates = localWeatherTemplates;
    this._defaultWeatherTemplate = "H1emuBaseWeather";
    this._weather = this._weatherTemplates[this._defaultWeatherTemplate];
    this._profiles = [];
    this._npcRenderDistance = 350;
    this._pingTimeoutTime = 30000;
    this.setupTimeSyncInterval()
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
          packet.name != "PlayerUpdateUpdatePositionClientToZone"
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
        setImmediate(() => {
          this.sendInitData(client);
        });
      }
    });

    this._gatewayServer.on(
      "login",
      (
        err: string,
        client: Client,
        characterId: string,
        loginSessionId: string
      ) => {
        debug(
          "Client logged in from " +
            client.address +
            ":" +
            client.port +
            " with character id " +
            characterId
        );

        this._clients[client.sessionId] = client;
        client.loginSessionId = loginSessionId;
        client.transientIds = {};
        client.transientId = 0;
        client.character = {
          characterId: characterId,
          state: {
            position: new Float32Array([0, 0, 0, 0]),
            rotation: new Float32Array([0, 0, 0, 0]),
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
      debug("Client disconnected from " + client.address + ":" + client.port);
      clearInterval(client.pingTimer);
      if (client.character?.characterId) {
        delete this._characters[client.character.characterId];
      }
      delete this._clients[client.sessionId];
      this.emit("disconnect", err, client);
    });

    this._gatewayServer.on("session", (err: string, client: Client) => {
      debug("Session started for client " + client.address + ":" + client.port);
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
      : _.find(this._weatherTemplates, (template: { templateName: string; }) => {
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

  async fetchWorldData(): Promise<void> {
    if (!this._soloMode) {
      const worldData = await this._db
        ?.collection("worlds")
        .findOne({ worldId: this._worldId });
      this._npcs = worldData.npcs;
      this._objects = worldData.objects;
      this._weather = worldData.weather;
      debug("World fetched!");
    }
  }

  async saveWorld(): Promise<void> {
    if (!this._soloMode) {
      const save = {
        worldId: this._worldId,
        npcs: this._npcs,
        weather: this._weather,
        objects: this._objects,
      };
      if (this._worldId) {
        if (
          await this._db
            ?.collection("worlds")
            .findOne({ worldId: this._worldId })
        ) {
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
          await this._db?.collection("worlds").insertOne(save);
        }
      } else {
        this.createAllObjects();
        const numberOfWorld: number =
          (await this._db?.collection("worlds").find({}).count()) || 0;
        const createdWorld = await this._db?.collection("worlds").insertOne({
          worldId: numberOfWorld + 1,
          npcs: save.npcs,
          weather: save.weather,
          objects: save.objects,
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
    this._dynamicWeatherInterval = setInterval(()=>dynamicWeather(this),5000)
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
      debug(
        "Client disconnected from " +
          client.address +
          ":" +
          client.port +
          " ( ping timeout )"
      );
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
    }
    return { itemTypes: items };
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
      require.resolve("../../../data/sampleData/sendself.json") // reload json
    ];
    const self = require("../../../data/sampleData/sendself.json"); // dummy self
    if (String(client.character.characterId) === "0x0000000000000001") {
      // for fun 🤠
      self.data.characterId = "0x0000000000000001";
      self.data.identity.characterFirstName = "Cowboy :)";
      self.data.extraModel = "SurvivorMale_Ivan_OutbackHat_Base.adr";
      self.data.extraModelTexture = "Ivan_OutbackHat_LeatherTan";
    }
    const {
      data: { identity },
    } = self;
    client.character.guid = self.data.guid;
    client.character.name =
      identity.characterFirstName + identity.characterLastName;
    const characterDataMongo = await this._db
      ?.collection("characters")
      .findOne({ characterId: client.character.characterId });
    if (
      _.isEqual(self.data.position, [0, 0, 0, 1]) &&
      _.isEqual(self.data.rotation, [0, 0, 0, 1])
    ) {
      // if position/rotation hasn't be changed
      if (this._soloMode || !characterDataMongo.position) {
        self.data.isRandomlySpawning = true;
      }
    }

    if (self.data.isRandomlySpawning) {
      // Take position/rotation from a random spawn location.
      const randomSpawnIndex = Math.floor(
        Math.random() * this._spawnLocations.length
      );
      self.data.position = client.character.state.position =
        this._spawnLocations[randomSpawnIndex].position;
      self.data.rotation = client.character.state.rotation =
        this._spawnLocations[randomSpawnIndex].rotation;
      client.character.spawnLocation =
        this._spawnLocations[randomSpawnIndex].name;
    } else {
      if (!this._soloMode) {
        self.data.position = characterDataMongo.position;
        self.data.rotation = characterDataMongo.rotation;
      }
      client.character.state.position = self.data.position;
      client.character.state.rotation = self.data.rotation;
    }
    const characterResources: any[] = [];
    ressources.forEach((ressource: any) => {
      characterResources.push({
        resourceType: ressource.RESOURCE_TYPE,
        resourceData: {
          subResourceData: {
            resourceId: ressource.ID,
            resourceType: ressource.RESOURCE_TYPE,
            unknownArray1: [],
          },
          unknownData2: {
            max_value: ressource.MAX_VALUE,
            initial_value: ressource.INITIAL_VALUE,
          },
        },
      });
    });
    self.data.profiles = this._profiles;
    self.data.stats = stats;
    self.data.characterResources = characterResources;
    self.data.recipes = recipes;
    this.sendData(client, "SendSelfToClient", self);
  }

  generateProfiles(): any[] {
    const profiles: any[] = [];
    const profileTypes = require("../../../data/dataSources/ProfileTypes.json");
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
      unknownFlags: 0,
      locations: [
        {
          guid: this.generateGuid(),
          respawnType: 1,
          position: [0, 50, 0, 1],
          unknownDword1: 1,
          unknownDword2: 1,
          iconId1: 1,
          iconId2: 1,
          respawnTotalTime: 1,
          respawnTimeMs: 1,
          nameId: 1,
          distance: 1,
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
        },
      ],
      unknownDword1: 0,
      unknownDword2: 0,
      locations2: [
        {
          guid: this.generateGuid(),
          respawnType: 1,
          position: [0, 50, 0, 1],
          unknownDword1: 1,
          unknownDword2: 1,
          iconId1: 1,
          iconId2: 1,
          respawnTotalTime: 1,
          respawnTimeMs: 1,
          nameId: 1,
          distance: 1,
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
        },
      ],
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
          this._npcs[npc],
          1
        );
        client.spawnedEntities.push(this._npcs[npc]);
      }
    }
  }

  pointOfInterest(client: Client) {
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
      }
    });
  }

  worldRoutine(client: Client): void {
    this.spawnObjects(client);
    this.spawnNpcs(client);
    this.removeOutOfDistanceEntities(client);
    this.pointOfInterest(client);
  }

  filterOutOfDistance(element: any, playerPosition: Float32Array): boolean {
    return !isPosInRadius(
      this._npcRenderDistance,
      playerPosition,
      element.position
    );
  }
  removeOutOfDistanceEntities(client: Client): void {
    const objectsToRemove = client.spawnedEntities.filter((e) =>
      this.filterOutOfDistance(e, client.character.state.position)
    );
    client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });
    objectsToRemove.forEach((object: any) => {
      this.sendData(
        client,
        "PlayerUpdate.RemovePlayer",
        {
          characterId: object.characterId,
        },
        1
      );
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
            this._objects[object],
            1
          );
          client.spawnedEntities.push(this._objects[object]);
        }
      }
    });
  }

  despawnEntity(characterId: string) {
    this.sendDataToAll(
      "PlayerUpdate.RemovePlayer",
      {
        characterId: characterId,
      },
      1
    );
  }

  deleteEntity(characterId: string, dictionnary: any) {
    this.sendDataToAll(
      "PlayerUpdate.RemovePlayer",
      {
        characterId: characterId,
      },
      1
    );
    delete dictionnary[characterId];
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
    const { npcs, objects } = createAllEntities();
    this._npcs = npcs;
    this._objects = objects;
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
      if(client?.character?.name){
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
    if (!this._soloMode) {
      this.sendDataToAll("Chat.Chat", {
        channel: channel,
        characterName1: character.name,
        message: message,
        color1: 1,
      });
    } else {
      this.sendData(client, "Chat.Chat", {
        channel: channel,
        characterName1: character.name,
        message: message,
        color1: 1,
      });
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
    if (Array.isArray(client)) {
      for (let i = 0; i < client.length; i++) {
        this._gatewayServer.sendTunnelData(client[i], data, channel);
      }
    } else {
      this._gatewayServer.sendTunnelData(client, data, channel);
    }
  }

  sendDataToAll(packetName: string, obj: any, channel = 0): void {
    for (const a in this._clients) {
      this.sendData(this._clients[a], packetName, obj, channel);
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

  setupTimeSyncInterval(){
    this._gameTimeSyncInterval = setInterval(() => {
      this._gameTime += 60000;
    }, 5000);
  }

  forceTime(time: number): void {
    this._cycleSpeed = 600;
    this._frozeCycle = false;
    this._gameTime = time;
    clearInterval(this._gameTimeSyncInterval);
    this.sendSyncToAll();
  }

  removeForcedTime(): void {
    this._cycleSpeed = 60;
    this._frozeCycle = false;
    this._gameTime = Date.now();
    this.setupTimeSyncInterval()
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
      time: Int64String(this._gameTime),
      cycleSpeed: this._cycleSpeed,
      unknownBoolean: this._frozeCycle,
      });
  }

  sendSyncToAll(): void {
    debug("GameTimeSync");
    this.sendDataToAll("GameTimeSync",  {
      time: Int64String(this._gameTime),
      cycleSpeed: this._cycleSpeed,
      unknownBoolean: this._frozeCycle,
      });
  }

  getTransientId(client: any, guid: string): number {
    if (!client.transientIds[guid]) {
      client.transientId++;
      client.transientIds[guid] = client.transientId;
    }
    return client.transientIds[guid];
  }

  createPositionUpdate(position: Float32Array, rotation: Array<number>): any {
    const obj = {
      flags: 4095,
      unknown2_int32: this.getGameTime(),
      unknown3_int8: 0,
      unknown4: 1,
      position: position,
      unknown6_int32: 3217625048,
      unknown7_float: 0,
      unknown8_float: 0,
      unknown9_float: 0,
      unknown10_float: 0,
      unknown11_float: 0,
      unknown12_float: [0, 0, 0],
      unknown13_float: rotation,
      unknown14_float: 0,
      unknown15_float: 0,
    };
    return obj;
  }
}
