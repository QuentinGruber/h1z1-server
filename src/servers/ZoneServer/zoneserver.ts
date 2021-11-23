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

import { EventEmitter } from "events";
import { GatewayServer } from "../GatewayServer/gatewayserver";
import { H1Z1Protocol as ZoneProtocol } from "../../protocols/h1z1protocol";
import { H1emuZoneServer } from "../H1emuServer/h1emuZoneServer";
import { H1emuClient } from "../H1emuServer/shared/h1emuclient";
import {
  _,
  generateRandomGuid,
  getAppDataFolderPath,
  initMongo,
  Int64String,
  isPosInRadius,
  setupAppDataFolder,
  getDistance,
} from "../../utils/utils";
import { Weather } from "../../types/zoneserver";
import { Db, MongoClient } from "mongodb";
import { Worker } from "worker_threads";
import SOEClient from "../SoeServer/soeclient";
import { ZoneClient as Client } from "./classes/zoneclient";
import { h1z1PacketsType } from "../../types/packets";
import { Vehicle } from "./classes/vehicles";
import { Resolver } from "dns";

process.env.isBin && require("./workers/dynamicWeather");

import { zonePacketHandlers } from "./zonepackethandlers";
const localSpawnList = require("../../../data/2015/sampleData/spawnLocations.json");

const debugName = "ZoneServer";
const debug = require("debug")(debugName);
let spawnLocations = require("../../../data/2015/sampleData/spawnLocations.json");
let localWeatherTemplates = require("../../../data/2015/sampleData/weather.json");
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
  _time: number;
  _serverTime: any;
  _transientIds: any;
  _packetHandlers: zonePacketHandlers;
  _startTime: number;
  _startGameTime: number;
  _timeMultiplier: number;
  _cycleSpeed: number;
  _frozeCycle: boolean = false;
  _profiles: any[];
  _weather!: Weather;
  _spawnLocations: any;
  _defaultWeatherTemplate: string;
  _npcs: any;
  _objects: any;
  _pingTimeoutTime: number;
  _worldId: number;
  _npcRenderDistance: number;
  _dynamicWeatherWorker: any;
  _dynamicWeatherEnabled: boolean;
  _vehicles: { [characterId: string]: Vehicle };
  _respawnLocations: any[];
  _doors: any;
  _props: any;
  _interactionDistance: number;
  _dummySelf: any;
  _appDataFolder: string;
  _respawnOnLastPosition: boolean = false;
  _worldRoutineRadiusPercentage: number = 0.4;
  _enableGarbageCollection: boolean = true;
  worldRoutineTimer: any;
  tickRate: number = 3000;
  _h1emuZoneServer!: H1emuZoneServer;
  _loginServerInfo: { address?: string; port: number } = {
    address: process.env.LOGINSERVER_IP,
    port: 1110,
  };
  _clientProtocol: string = "ClientProtocol_860";
  _allowedCommands: string[] = [];
  _maxAllowedPing: number = 300;
  constructor(
    serverPort: number,
    gatewayKey: Uint8Array,
    mongoAddress = "",
    worldId = 0,
    internalServerPort = 0
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
    this._packetHandlers = new zonePacketHandlers();
    this._startTime = 0;
    this._time = Date.now();
    this._startGameTime = 0;
    this._timeMultiplier = 72;
    this._cycleSpeed = 0;
    this._soloMode = false;
    this._defaultWeatherTemplate = "h1emubaseweather";
    this._profiles = [];
    this._interactionDistance = 4;
    this._npcRenderDistance = 350;
    this._pingTimeoutTime = 120000;
    this._dynamicWeatherEnabled = true;
    this._dummySelf = require("../../../data/2015/sampleData/sendself.json");
    this._appDataFolder = getAppDataFolderPath();
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
      this._enableGarbageCollection = false;
    }
    this.on("data", this.onZoneDataEvent);

    this.on("login", (err, client) => {
      this.onZoneLoginEvent(err, client);
    });

    this._gatewayServer._soeServer.on(
      "PacketLimitationReached",
      (client: Client) => {
        this.onSoePacketLimitationReachedEvent(client);
      }
    );

    this._gatewayServer.on(
      "login",
      (
        err: string,
        client: SOEClient,
        characterId: string,
        loginSessionId: string,
        clientProtocol: string
      ) => {
        this.onGatewayLoginEvent(
          err,
          client,
          characterId,
          loginSessionId,
          clientProtocol
        );
      }
    );

    this._gatewayServer.on("disconnect", (err: string, client: Client) => {
      this.onGatewayDisconnectEvent(err, client);
    });

    this._gatewayServer.on("session", (err: string, client: Client) => {
      this.onGatewaySessionEvent(err, client);
    });

    this._gatewayServer.on(
      "tunneldata",
      (err: string, client: Client, data: Buffer, flags: number) => {
        this.onGatewayTunnelDataEvent(
          err,
          this._clients[client.sessionId],
          data,
          flags
        );
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
              case "ZonePingRequest": {
                const { address, reqId } = packet.data;
                try {
                  // TODO: improve this
                  const soeClient: SOEClient = Object.values(
                    this._gatewayServer._soeServer._clients
                  ).find((client) => {
                    return (client as SOEClient).address === address;
                  }) as SOEClient;
                  const clientPingMs = soeClient.zonePingTimeMs;

                  this._h1emuZoneServer.sendData(client, "ZonePingReply", {
                    reqId: reqId,
                    status: clientPingMs > this._maxAllowedPing ? 0 : 1,
                  });
                } catch (error) {
                  this._h1emuZoneServer.sendData(client, "ZonePingReply", {
                    reqId: reqId,
                    status: 0,
                  });
                }
                break;
              }
              case "CharacterCreateRequest": {
                const { characterObjStringify, reqId } = packet.data;
                try {
                  const characterObj = JSON.parse(characterObjStringify);
                  const collection = (this._db as Db).collection("characters");
                  const charactersArray = await collection.findOne({
                    characterId: characterObj.characterId,
                  });
                  if (!charactersArray) {
                    await collection.insertOne(characterObj);
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
                    await collection.updateOne({ characterId: characterId },{$set: {
                      status: 0
                    }});
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterDeleteReply",
                      { status: 1, reqId: reqId }
                    );
                  } else {
                    this._h1emuZoneServer.sendData(
                      client,
                      "CharacterDeleteReply",
                      { status: 0, reqId: reqId }
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

  onZoneDataEvent(err: any, client: Client, packet: any) {
    if (err) {
      console.error(err);
    } else {
      client.pingTimer?.refresh();
      if (
        packet.name != "KeepAlive" &&
        packet.name != "PlayerUpdateUpdatePositionClientToZone" &&
        packet.name != "PlayerUpdateManagedPosition"
      ) {
        debug(`Receive Data ${[packet.name]}`);
      }
      this._packetHandlers.processPacket(this, client, packet);
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

  onSoePacketLimitationReachedEvent(client: Client) {
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

  onGatewayLoginEvent(
    err: string,
    client: SOEClient,
    characterId: string,
    loginSessionId: string,
    clientProtocol: string
  ) {
    if (clientProtocol !== this._clientProtocol) {
      debug(`${client.address} is using the wrong client protocol`);
      this.sendData(client as Client, "LoginFailed", {});
      return;
    }
    debug(
      `Client logged in from ${client.address}:${client.port} with character id: ${characterId}`
    );
    let generatedTransient;
    do {
      generatedTransient = Number((Math.random() * 30000).toFixed(0));
    } while (this._transientIds[generatedTransient]);
    const zoneClient = new Client(
      client,
      loginSessionId,
      characterId,
      generatedTransient
    );
    zoneClient.npcsToSpawnTimer = setTimeout(() => {
      const npcData = zoneClient.npcsToSpawn.shift();
      if (npcData) {
        this.sendData(zoneClient, "PlayerUpdate.AddLightweightNpc", npcData);
        zoneClient.npcsToSpawnTimer.refresh();
      }
    });
    this._clients[client.sessionId] = zoneClient;

    this._transientIds[generatedTransient] = characterId;
    this._characters[characterId] = zoneClient.character;
    zoneClient.pingTimer = setTimeout(() => {
      this.timeoutClient(zoneClient);
    }, this._pingTimeoutTime);
    this.emit("login", err, zoneClient);
  }

  onGatewayDisconnectEvent(err: string, client: Client) {
    debug(`Client disconnected from ${client.address}:${client.port}`);
    clearTimeout(client.character?.resourcesUpdater);
    if (client.character?.characterId) {
      delete this._characters[client.character.characterId];
    }
    delete this._clients[client.sessionId];
    this._gatewayServer._soeServer.deleteClient(client);
    this.emit("disconnect", null, client);
  }

  onGatewaySessionEvent(err: string, client: Client) {
    debug(`Session started for client ${client.address}:${client.port}`);
  }

  onGatewayTunnelDataEvent(
    err: string,
    client: Client,
    data: Buffer,
    flags: number
  ) {
    const packet = this._protocol.parse(data, flags, true);
    if (packet) {
      this.emit("data", null, client, packet);
    } else {
      debug("zonefailed : ", data);
    }
  }

  removeSoloCache(){
    spawnLocations = null;
    localWeatherTemplates = null;
    delete require.cache[require.resolve("../../../data/2015/sampleData/spawnLocations.json")];
    delete require.cache[require.resolve("../../../data/2015/sampleData/weather.json")];
  }

  async setupServer(): Promise<void> {
    this.forceTime(971172000000); // force day time by default - not working for now
    this._frozeCycle = false;
    this._weather = this._soloMode
      ? localWeatherTemplates[this._defaultWeatherTemplate]
      : await this._db?.collection("weathers").findOne({ templateName: this._defaultWeatherTemplate });
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
    if (!this._soloMode) {
      this.removeSoloCache();
      debug("Starting H1emuZoneServer");
      if (!this._loginServerInfo.address) {
        await this.fetchLoginInfo();
      }
      this._h1emuZoneServer.setLoginInfo(this._loginServerInfo, {
        serverId: this._worldId,
      });
      this._h1emuZoneServer.start();
      this.sendZonePopulationUpdate();
    }
    if (this._enableGarbageCollection) {
      setInterval(() => {
        this.garbageCollection();
      }, 120000);
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

  getEntityType(entityKey: string): number {
    if (!!this._npcs[entityKey]) {
      return 1;
    } else if (!!this._vehicles[entityKey]) {
      return 2;
    } else if (!!this._characters[entityKey]) {
      return 3;
    } else if (!!this._objects[entityKey]) {
      return 4;
    } else if (!!this._props[entityKey]) {
      return 5;
    } else {
      return 6; // doors
    }
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
      this._props = {};
      const propsArray: any = await this._db
        ?.collection("props")
        .find({ worldId: this._worldId })
        .toArray();
      for (let index = 0; index < propsArray.length; index++) {
        const prop = propsArray[index];
        this._props[prop.characterId] = prop;
      }
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
        await this._db
          ?.collection(`props`)
          .insertMany(Object.values(this._props));
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
        await this._db
          ?.collection(`props`)
          .insertMany(Object.values(this._props));
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

  async start(): Promise<void> {
    debug("Starting server");
    debug(`Protocol used : ${this._protocol.protocolName}`);
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
      const dbIsEmpty =
        (await mongoClient.db("h1server").collections()).length < 1;
      if (dbIsEmpty) {
        await initMongo(this._mongoAddress, debugName);
      }
      delete require.cache[require.resolve("mongodb-restore-dump")];
      this._db = mongoClient.db("h1server");
    }
    await this.setupServer();
    this._startTime += Date.now() + 82201232; // summer start
    this._startGameTime += Date.now();
    if (this._soloMode) {
      setupAppDataFolder();
    }
    if (this._dynamicWeatherEnabled) {
      this._dynamicWeatherWorker = new Worker(
        `${__dirname}/workers/dynamicWeather.js`,
        {
          workerData: {
            timeMultiplier: this._timeMultiplier,
            serverTime: this._serverTime,
            startTime: this._startTime,
          },
        }
      );
      this._dynamicWeatherWorker.on("message", (weather: Uint8Array) => {
        this.sendRawToAll(Buffer.from(weather))
      });
    }
    this._gatewayServer.start(this._soloMode);
    this.worldRoutineTimer = setTimeout(
      () => this.worldRoutine.bind(this)(true),
      this.tickRate
    );
  }

  reloadPackets(client: Client, intervalTime = -1): void {
    this.reloadZonePacketHandlers();
    this._protocol.reloadPacketDefinitions();
    this.sendChatText(client, "[DEV] Packets reloaded", true);
  }

  async reloadZonePacketHandlers() {
    //@ts-ignore
    delete this._packetHandlers;
    delete require.cache[require.resolve("./zonepackethandlers")];
    this._packetHandlers = new (
      require("./zonepackethandlers") as any
    ).zonePacketHandlers();
    await this._packetHandlers.reloadCommandCache();
  }

  garbageCollection(): void {
    // backup plan to free memory
    for (const clientKey in this._clients) {
      //@ts-ignore
      if (this._clients[clientKey]._destroyed) {
        console.log(`${clientKey} removed by garbage collection`);
        delete this._clients[clientKey];
      }
    }
  }

  timeoutClient(client: Client): void {
    debug(
      `Client disconnected from ${client.address}:${client.port} ( ping timeout )`
    );
    clearTimeout(client.character?.resourcesUpdater);
    if (client.character?.characterId) {
      delete this._characters[client.character.characterId];
    }
    delete this._clients[client.sessionId];
    this._gatewayServer._soeServer.deleteClient(client);
    this.emit("disconnect", null, client);
  }

  generateGuid(): string {
    return generateRandomGuid();
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

  async characterData(client: Client): Promise<void> {
    const {
      data: { identity },
    } = this._dummySelf;

    let characterName;
    let character: any;
    if (!this._soloMode) {
      character = await this._db
        ?.collection("characters")
        .findOne({ characterId: client.character.characterId });
      if (!character) {
        this.sendData(client, "LoginFailed", {});
        return;
      }
      characterName = character.payload.name;
    } else {
      delete require.cache[
        require.resolve(`${this._appDataFolder}/single_player_characters.json`)
      ];
      const SinglePlayerCharacters = require(`${this._appDataFolder}/single_player_characters.json`);
      character = SinglePlayerCharacters.find(
        (character: any) =>
          character.characterId === client.character.characterId
      );
      characterName = character.payload.name;
    }

    this._dummySelf.data.identity.characterFirstName = characterName;
    this._dummySelf.data.guid = generateRandomGuid();
    this._dummySelf.data.characterId = character.characterId;
    client.character.guid = client.character.characterId;
    client.character.name =
      identity.characterFirstName + identity.characterLastName;
    const characterDataMongo: any = await this._db
      ?.collection("characters")
      .findOne({ characterId: client.character.characterId });
    client.character.extraModel = characterDataMongo?.extraModelTexture
      ? characterDataMongo.extraModelTexture
      : this._dummySelf.data.extraModelTexture;

    let isRandomlySpawning = false;
    if (
      this._soloMode ||
      !characterDataMongo.position ||
      !this._respawnOnLastPosition
    ) {
      isRandomlySpawning = true;
    }

    if (isRandomlySpawning) {
      // Take position/rotation from a random spawn location.
      const spawnLocations = this._soloMode
      ? localSpawnList
      : await this._db?.collection("spawns").find().toArray();
      const randomSpawnIndex = Math.floor(
        Math.random() * spawnLocations.length
      );
      this._dummySelf.data.position = client.character.state.position =
        spawnLocations[randomSpawnIndex].position;
      this._dummySelf.data.rotation = client.character.state.rotation =
        spawnLocations[randomSpawnIndex].rotation;
      client.character.spawnLocation =
        spawnLocations[randomSpawnIndex].name;
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
    delete require.cache[
      require.resolve("../../../data/2015/dataSources/ProfileTypes.json")
    ];
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
        client.npcsToSpawn.push({ ...this._npcs[npc], profileId: 65 });
        client.spawnedEntities.push(this._npcs[npc]);
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

  executeFuncForAllReadyClients(callback: any): void {
    for (const client in this._clients) {
      const clientObj: Client = this._clients[client];
      if (!clientObj.isLoading) {
        callback(clientObj);
      }
    }
  }

  worldRoutine(refresh = false): void {
    this.executeFuncForAllReadyClients((client: Client) => {
      this.spawnCharacters(client);
      this.spawnObjects(client);
      this.spawnDoors(client);
      this.spawnProps(client);
      this.spawnNpcs(client);
      this.spawnVehicles(client);
      this.removeOutOfDistanceEntities(client);
      this.POIManager(client);
      client.npcsToSpawnTimer.refresh();
      client.posAtLastRoutine = client.character.state.position;
    });
    if (refresh) this.worldRoutineTimer.refresh();
  }
  setGodMode(client: Client, godMode: boolean) {
    client.character.godMode = godMode;
    this.sendChatText(
      client,
      `GODMODE: ${client.character.godMode ? "ON" : "OFF"}`
    );
    const godModeState = client.character.godMode
      ? "00000000000A000000"
      : "000000000000000000";
    this.sendData(client, "PlayerUpdate.UpdateCharacterState", {
      characterId: client.character.characterId,
      state: godModeState,
      gameTime: this.getSequenceTime(),
    });
  }
  tempGodMode(client: Client, durationMs: number) {
    if (!client.character.godMode) {
      client.character.godMode = true;
      setTimeout(() => {
        client.character.godMode = false;
      }, durationMs);
    }
  }
  killCharacter(client: Client) {
    debug(client.character.name + " has died");
    client.character.isAlive = false;
    this.sendDataToAll("PlayerUpdate.UpdateCharacterState", {
      characterId: client.character.characterId,
      state: "0000000000000000C00",
      gameTime: Int64String(this.getSequenceTime()),
    });
    if (!client.vehicle.mountedVehicle) {
      this.sendDataToAll("Ragdoll.UpdatePose", {
        characterId: client.character.characterId,
        positionUpdate: {
          sequenceTime: this.getSequenceTime(),
          unknown3_int8: 1,
          stance: 1089,
          position: client.character.state.position,
          orientation: 0,
          frontTilt: 0,
          sideTilt: 0,
          angleChange: 0,
          verticalSpeed: 0,
          horizontalSpeed: 0,
          unknown12_float: [0, 0, 0],
          rotationRaw: [0, 0, -0, 1],
          direction: 0,
          engineRPM: 0,
        },
      });
    } else {
      this.sendDataToAllOthers(client, "PlayerUpdate.RemovePlayerGracefully", {
        characterId: client.character.characterId,
      });
    }
  }

  playerDamage(client: Client, damage: number) {
    if (!client.character.godMode) {
      if (damage > 99) {
        client.character.resources.health -= damage;
      }
      if (client.character.resources.health <= 0) {
        this.killCharacter(client);
      }
      if (client.character.resources.health < 0) {
        client.character.resources.health = 0;
      }
      this.updateResource(
        client,
        client.character.characterId,
        client.character.resources.health,
        48,
        1
      );
    }
  }

  async respawnPlayer(client: Client) {
    client.character.isAlive = true;
    client.character.resources.health = 10000;
    client.character.resources.food = 10000;
    client.character.resources.water = 10000;
    client.character.resources.stamina = 600;
    client.character.resourcesUpdater.refresh();
    this.sendDataToAll("PlayerUpdate.UpdateCharacterState", {
      characterId: client.character.characterId,
      state: "000000000000000000",
      gameTime: Int64String(this.getSequenceTime()),
    });
    const spawnLocations = this._soloMode
    ? localSpawnList
    : await this._db?.collection("spawns").find().toArray();
    const randomSpawnIndex = Math.floor(
      Math.random() * spawnLocations.length
    );
    this.sendData(client, "ClientUpdate.UpdateLocation", {
      position: spawnLocations[randomSpawnIndex].position,
    });
    client.character.state.position =
    spawnLocations[randomSpawnIndex].position;
    this.updateResource(
      client,
      client.character.characterId,
      client.character.resources.health,
      48,
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

  explosionDamage(position: Float32Array,npcTriggered:string) {
    for (const character in this._clients) {
      const characterObj = this._clients[character];
      if (!characterObj.character.godMode) {
        if (isPosInRadius(5, characterObj.character.state.position, position)) {
          const distance = getDistance(
            position,
            characterObj.character.state.position
          );
          const damage = 20000 / distance;
          this.playerDamage(this._clients[character], damage);
        }
      }
    }
    for (const vehicleKey in this._vehicles) {
      const vehicle = this._vehicles[vehicleKey];
      if (!vehicle.isInvulnerable && vehicle.npcData.characterId != npcTriggered) {
        if (isPosInRadius(5, vehicle.npcData.position, position)) {
          const distance = getDistance(
            position,
            vehicle.npcData.position
          );
          const damage = 20000 / distance;
          this.damageVehicle(damage,vehicle)
        }
      }
    }
  }

  damageVehicle(damage: number, vehicle: Vehicle) {
    if (!vehicle.isInvulnerable) {
      let destroyedVehicleEffect: number;
      let destroyedVehicleModel: number;
      let minorDamageEffect: number;
      let majorDamageEffect: number;
      let criticalDamageEffect: number;
      switch (vehicle.vehicleType) {
        case "offroader":
          destroyedVehicleEffect = 135;
          destroyedVehicleModel = 7226;
          minorDamageEffect = 182;
          majorDamageEffect = 181;
          criticalDamageEffect = 180;
          break;
        case "pickup":
          destroyedVehicleEffect = 326;
          destroyedVehicleModel = 9315;
          minorDamageEffect = 325;
          majorDamageEffect = 324;
          criticalDamageEffect = 323;
          break;
        case "policecar":
          destroyedVehicleEffect = 286;
          destroyedVehicleModel = 9316;
          minorDamageEffect = 285;
          majorDamageEffect = 284;
          criticalDamageEffect = 283;
          break;
        default:
          destroyedVehicleEffect = 135;
          destroyedVehicleModel = 7226;
          minorDamageEffect = 182;
          majorDamageEffect = 181;
          criticalDamageEffect = 180;
          break;
      }
      vehicle.npcData.resources.health -= 10 * Math.floor(damage);

      if (vehicle.npcData.resources.health <= 0) {
        vehicle.npcData.resources.health = 0;
        if (vehicle.passengers.passenger1) {
          this.dismountVehicle(
            vehicle.passengers.passenger1,
            vehicle.npcData.characterId
          );
        }
        if (vehicle.passengers.passenger2) {
          this.dismountVehicle(
            vehicle.passengers.passenger2,
            vehicle.npcData.characterId
          );
        }
        if (vehicle.passengers.passenger3) {
          this.dismountVehicle(
            vehicle.passengers.passenger3,
            vehicle.npcData.characterId
          );
        }
        if (vehicle.passengers.passenger4) {
          this.dismountVehicle(
            vehicle.passengers.passenger4,
            vehicle.npcData.characterId
          );
        }
        this.sendDataToAll("PlayerUpdate.Destroyed", {
          characterId: vehicle.npcData.characterId,
          unknown1: destroyedVehicleEffect, // destroyed offroader effect
          unknown2: destroyedVehicleModel, // destroyed offroader model
          unknown3: 0,
          disableWeirdPhysics: false,
        });
        this.explosionDamage(vehicle.npcData.position,vehicle.npcData.characterId);
        vehicle.npcData.destroyedState = 4;
        this.sendDataToAll(
          "PlayerUpdate.RemovePlayerGracefully",
          {
            characterId: vehicle.npcData.characterId,
            timeToDisappear: 13000,
            stickyEffectId: 156,
          },
          1
        );
        if(vehicle.passengers.passenger1){
          const client = this._clients[vehicle.passengers.passenger1];
          client.vehicle.mountedVehicleType = "0";
          delete client.vehicle.mountedVehicle;
          client.vehicle.vehicleState = 0;
          this.vehicleDelete(client);
        }
      } else if (
        vehicle.npcData.resources.health <= 50000 &&
        vehicle.npcData.resources.health > 35000
      ) {
        if (vehicle.npcData.destroyedState != 1) {
          vehicle.npcData.destroyedState = 1;
          this.sendDataToAll("PlayerUpdate.SetSpawnerActivationEffect", {
            characterId: vehicle.npcData.characterId,
            effectId: minorDamageEffect,
          });
        }
      } else if (
        vehicle.npcData.resources.health <= 35000 &&
        vehicle.npcData.resources.health > 20000
      ) {
        if (vehicle.npcData.destroyedState != 2) {
          vehicle.npcData.destroyedState = 2;
          this.sendDataToAll( "PlayerUpdate.SetSpawnerActivationEffect", {
            characterId: vehicle.npcData.characterId,
            effectId: majorDamageEffect,
          });
        }
      } else if (vehicle.npcData.resources.health <= 20000) {
        if (vehicle.npcData.destroyedState != 3) {
          vehicle.npcData.destroyedState = 3;
          this.sendDataToAll("PlayerUpdate.SetSpawnerActivationEffect", {
            characterId: vehicle.npcData.characterId,
            effectId: criticalDamageEffect,
          });
        }
      }
      if (vehicle.passengers.passenger1) {
        this.updateResource(
          vehicle.passengers.passenger1,
          vehicle.npcData.characterId,
          vehicle.npcData.resources.health,
          561,
          1
        );
      }
      if (vehicle.passengers.passenger2) {
        this.updateResource(
          vehicle.passengers.passenger2,
          vehicle.npcData.characterId,
          vehicle.npcData.resources.health,
          561,
          1
        );
      }
      if (vehicle.passengers.passenger3) {
        this.updateResource(
          vehicle.passengers.passenger3,
          vehicle.npcData.characterId,
          vehicle.npcData.resources.health,
          561,
          1
        );
      }
      if (vehicle.passengers.passenger4) {
        this.updateResource(
          vehicle.passengers.passenger4,
          vehicle.npcData.characterId,
          vehicle.npcData.resources.health,
          561,
          1
        );
      }
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

  turnOnEngine(vehicleGuid: string) {
    if (this._vehicles[vehicleGuid].npcData.resources.fuel > 0) {
      this.sendDataToAll("Vehicle.Engine", {
        guid2: vehicleGuid,
        unknownBoolean: true,
      });
      this._vehicles[vehicleGuid].engineOn = true;
      this._vehicles[vehicleGuid].resourcesUpdater = setInterval(() => {
        const fuelLoss =
          this._vehicles[vehicleGuid].positionUpdate.engineRPM * 0.005;
        this._vehicles[vehicleGuid].npcData.resources.fuel -= fuelLoss;
        if (this._vehicles[vehicleGuid].npcData.resources.fuel < 0) {
          this._vehicles[vehicleGuid].npcData.resources.fuel = 0;
        }
        if (
          this._vehicles[vehicleGuid].engineOn &&
          this._vehicles[vehicleGuid].npcData.resources.fuel <= 0
        ) {
          this.turnOffEngine(vehicleGuid);
        }
        if (this._vehicles[vehicleGuid].passengers.passenger1) {
          this.updateResource(
            this._vehicles[vehicleGuid].passengers.passenger1,
            this._vehicles[vehicleGuid].npcData.characterId,
            this._vehicles[vehicleGuid].npcData.resources.fuel,
            396,
            50
          );
        }
        if (this._vehicles[vehicleGuid].passengers.passenger2) {
          this.updateResource(
            this._vehicles[vehicleGuid].passengers.passenger2,
            this._vehicles[vehicleGuid].npcData.characterId,
            this._vehicles[vehicleGuid].npcData.resources.fuel,
            396,
            50
          );
        }
        if (this._vehicles[vehicleGuid].passengers.passenger3) {
          this.updateResource(
            this._vehicles[vehicleGuid].passengers.passenger3,
            this._vehicles[vehicleGuid].npcData.characterId,
            this._vehicles[vehicleGuid].npcData.resources.fuel,
            396,
            50
          );
        }
        if (this._vehicles[vehicleGuid].passengers.passenger4) {
          this.updateResource(
            this._vehicles[vehicleGuid].passengers.passenger4,
            this._vehicles[vehicleGuid].npcData.characterId,
            this._vehicles[vehicleGuid].npcData.resources.fuel,
            396,
            50
          );
        }
      }, 3000);
    }
  }

  turnOffEngine(vehicleGuid: string) {
    this._vehicles[vehicleGuid].engineOn = false;
    this.sendDataToAll("Vehicle.Engine", {
      guid2: vehicleGuid,
      unknownBoolean: false,
    });
    clearInterval(this._vehicles[vehicleGuid].resourcesUpdater);
  }

  manageVehicle(client: Client, vehicleGuid: string) {
    if (this._vehicles[vehicleGuid].manager) {
      this.dropVehicleManager(this._vehicles[vehicleGuid].manager, vehicleGuid);
    }
    this._vehicles[vehicleGuid].isManaged = true;
    this._vehicles[vehicleGuid].manager = client;
    client.managedObjects.push(vehicleGuid);
    this.sendData(client, "PlayerUpdate.ManagedObject", {
      guid: vehicleGuid,
      characterId: client.character.characterId,
    });
  }

  dropVehicleManager(client: Client, vehicleGuid: string) {
    this.sendData(client, "PlayerUpdate.ManagedObjectResponseControl", {
      unk: 0,
      characterId: vehicleGuid,
    });
    client.managedObjects.splice(client.managedObjects.findIndex((e:string)=> e === vehicleGuid),1) ;
    delete this._vehicles[vehicleGuid]?.manager;
  }

  enterVehicle(client: Client, entityData: any) {
    let allowedAccess;
    let seat;
    let isDriver;
    if (!entityData.seat.seat1) {
      isDriver = 1;
      seat = 0;
      allowedAccess = 1;
      entityData.isLocked = 0;
      client.vehicle.mountedVehicleSeat = 1;
    } else if (!entityData.seat.seat2) {
      isDriver = 0;
      seat = 1;
      allowedAccess = 1;
      client.vehicle.mountedVehicleSeat = 2;
    } else if (!entityData.seat.seat3) {
      isDriver = 0;
      seat = 2;
      allowedAccess = 1;
      client.vehicle.mountedVehicleSeat = 3;
    } else if (!entityData.seat.seat4) {
      isDriver = 0;
      seat = 3;
      allowedAccess = 1;
      client.vehicle.mountedVehicleSeat = 4;
    } else {
      allowedAccess = 3;
    }
    if (allowedAccess === 1 && entityData.isLocked != 2) {
      const { characterId: vehicleGuid } = entityData.npcData;
      const { modelId: vehicleModelId } = entityData.npcData;
      switch (vehicleModelId) {
        case 7225:
          client.vehicle.mountedVehicleType = "offroader";
          break;
        case 9258:
          client.vehicle.mountedVehicleType = "pickup";
          break;
        case 9301:
          client.vehicle.mountedVehicleType = "policecar";
          break;
        default:
          client.vehicle.mountedVehicleType = "offroader";
          break;
      }

      switch (seat) {
        case 0:
          this._vehicles[vehicleGuid].seat.seat1 = true;
          this.manageVehicle(client, vehicleGuid);
          this._vehicles[vehicleGuid].isLocked = 0;
          this.turnOnEngine(vehicleGuid);
          this._vehicles[vehicleGuid].passengers.passenger1 = client;

          break;
        case 1:
          this._vehicles[vehicleGuid].seat.seat2 = true;
          this._vehicles[vehicleGuid].passengers.passenger2 = client;
          break;
        case 2:
          this._vehicles[vehicleGuid].seat.seat3 = true;
          this._vehicles[vehicleGuid].passengers.passenger3 = client;
          break;
        case 3:
          this._vehicles[vehicleGuid].seat.seat4 = true;
          this._vehicles[vehicleGuid].passengers.passenger4 = client;
          break;
      }

      this.sendDataToAll("Mount.MountResponse", {
        characterId: client.character.characterId,
        guid: vehicleGuid,
        unknownDword1: seat,
        unknownDword3: isDriver,
        characterData: [],
      });
      this.updateResource(
        client,
        vehicleGuid,
        entityData.npcData.resources.fuel,
        396,
        50
      );
      this.updateResource(
        client,
        vehicleGuid,
        entityData.npcData.resources.health,
        561,
        1
      );
      if (isDriver === 1) {
        this.sendDataToAll("Vehicle.Owner", {
          guid: vehicleGuid,
          characterId: client.character.characterId,
          unknownDword1: 0,
          vehicleId: entityData.npcData.vehicleId,
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
        guid: entityData.npcData.characterId,
        characterId: client.character.characterId,
        vehicleId: entityData.npcData.vehicleId,
        unknownDword1: 0,
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
            unknownDword1: 0,
          },
        ],
        unknownArray2: [{}],
        unknownData1: {
          unknownData1: {
            unknownArray1: [{}],
            unknownArray2: [{}],
          },
        },
      });
      this.sendData(client, "PlayerUpdate.UpdateMutateRights", {
        unknownQword1: "1",
        unknownBoolean1: true,
      });
      client.vehicle.mountedVehicle = vehicleGuid;
      client.character.isRunning = false;
    } else if (entityData.isLocked === 2) {
      this.sendData(client, "ClientUpdate.TextAlert", {
        message: "Vehicle is locked",
      });
    }
  }

  dismountVehicle(client: Client, vehicleGuid: any) {
    const vehicleData = this._vehicles[vehicleGuid];
    if (
      vehicleData.passengers.passenger1 &&
      vehicleData.passengers.passenger1 != client
    ) {
      this.sendData(
        vehicleData.passengers.passenger1,
        "Mount.DismountResponse",
        {
          characterId: vehicleData.passengers.passenger1.character.characterId,
          guid: vehicleData.npcData.characterId,
        }
      );
    }
    if (
      vehicleData.passengers.passenger2 &&
      vehicleData.passengers.passenger2 != client
    ) {
      this.sendData(
        vehicleData.passengers.passenger2,
        "Mount.DismountResponse",
        {
          characterId: vehicleData.passengers.passenger2.character.characterId,
          guid: vehicleData.npcData.characterId,
        }
      );
    }
    if (
      vehicleData.passengers.passenger3 &&
      vehicleData.passengers.passenger3 != client
    ) {
      this.sendData(
        vehicleData.passengers.passenger3,
        "Mount.DismountResponse",
        {
          characterId: vehicleData.passengers.passenger3.character.characterId,
          guid: vehicleData.npcData.characterId,
        }
      );
    }
    if (
      vehicleData.passengers.passenger4 &&
      vehicleData.passengers.passenger4 != client
    ) {
      this.sendData(
        vehicleData.passengers.passenger4,
        "Mount.DismountResponse",
        {
          characterId: vehicleData.passengers.passenger4.character.characterId,
          guid: vehicleData.npcData.characterId,
        }
      );
    }

    this.sendDataToAll("Mount.DismountResponse", {
      characterId: client.character.characterId,
      guid: vehicleData.npcData.characterId,
    });

    if (
      vehicleData.passengers.passenger1 &&
      vehicleData.passengers.passenger1 != client
    ) {
      this.sendDataToAll("Mount.MountResponse", {
        characterId: vehicleData.passengers.passenger1.character.characterId,
        guid: vehicleData.npcData.characterId,
        unknownDword1: 0,
        unknownDword3: 1,
        characterData: [],
      });
    }
    if (
      vehicleData.passengers.passenger2 &&
      vehicleData.passengers.passenger2 != client
    ) {
      this.sendDataToAll("Mount.MountResponse", {
        characterId: vehicleData.passengers.passenger2.character.characterId,
        guid: vehicleData.npcData.characterId,
        unknownDword1: 1,
        unknownDword3: 0,
        characterData: [],
      });
    }
    if (
      vehicleData.passengers.passenger3 &&
      vehicleData.passengers.passenger3 != client
    ) {
      this.sendDataToAll("Mount.MountResponse", {
        characterId: vehicleData.passengers.passenger3.character.characterId,
        guid: vehicleData.npcData.characterId,
        unknownDword1: 2,
        unknownDword3: 0,
        characterData: [],
      });
    }
    if (
      vehicleData.passengers.passenger4 &&
      vehicleData.passengers.passenger4 != client
    ) {
      this.sendDataToAll("Mount.MountResponse", {
        characterId: vehicleData.passengers.passenger4.character.characterId,
        guid: vehicleData.npcData.characterId,
        unknownDword1: 3,
        unknownDword3: 0,
        characterData: [],
      });
    }

    this.sendData(client, "Vehicle.Occupy", {
      guid: "",
      characterId: client.character.characterId,
      vehicleId: 0,
      unknownDword1: 1,
      unknownArray1: [
        {
          unknownDword1: 1,
          unknownBoolean1: 1,
        },
      ],
      passengers: [
        {
          passengerData: { characterData: {} },
        },
      ],
      unknownArray2: [{}],
      unknownData1: {
        unknownData1: {
          unknownArray1: [{}],
          unknownArray2: [{}],
        },
      },
    });
    client.vehicle.mountedVehicleType = "0";
    delete client.vehicle.mountedVehicle;
    switch (client.vehicle.mountedVehicleSeat) {
      case 1:
        this._vehicles[vehicleGuid].seat.seat1 = false;
        delete this._vehicles[vehicleGuid].passengers.passenger1;
        this.turnOffEngine(vehicleData.npcData.characterId);
        break;
      case 2:
        this._vehicles[vehicleGuid].seat.seat2 = false;
        delete this._vehicles[vehicleGuid].passengers.passenger2;
        break;
      case 3:
        this._vehicles[vehicleGuid].seat.seat3 = false;
        delete this._vehicles[vehicleGuid].passengers.passenger3;
        break;
      case 4:
        this._vehicles[vehicleGuid].seat.seat4 = false;
        delete this._vehicles[vehicleGuid].passengers.passenger4;
        break;
    }
    if (vehicleData.onDismount) {
      vehicleData.onDismount();
    }
  }
  dismissVehicle(vehicleGuid: string) {
    this.sendDataToAll("PlayerUpdate.RemovePlayerGracefully", {
      characterId: vehicleGuid,
    });
    this.deleteEntity(vehicleGuid, this._vehicles);
  }

  dropPlayerInParachute(client: Client, position: Float32Array) {
    const characterId = this.generateGuid();
    const vehicleData = new Vehicle(
      this._worldId,
      characterId,
      this.getTransientId(client, characterId),
      9374,
      position,
      client.character.state.lookAt
    );

    this.sendDataToAll("PlayerUpdate.AddLightweightVehicle", vehicleData);
    this.sendData(client, "PlayerUpdate.ManagedObject", {
      guid: vehicleData.npcData.characterId,
      characterId: client.character.characterId,
    });
    vehicleData.isManaged = true;
    vehicleData.isInvulnerable = true;
    this._vehicles[characterId] = vehicleData;
    this.worldRoutine();
    this.sendDataToAll("Mount.MountResponse", {
      characterId: client.character.characterId,
      guid: characterId,
      characterData: [],
    });
    client.vehicle.mountedVehicle = characterId;
    client.managedObjects.push(characterId);
  }

  updatePosition(client: Client, position: Float32Array) {
    client.character.state.position = position;
  }

  spawnCharacters(client: Client) {
    for (const character in this._characters) {
      const characterObj = this._characters[character];
      if (
        isPosInRadius(
          this._npcRenderDistance,
          client.character.state.position,
          characterObj.state.position
        ) &&
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
        if (!this._vehicles[vehicle].isManaged) {
          this.sendData(client, "PlayerUpdate.ManagedObject", {
            guid: this._vehicles[vehicle].npcData.characterId,
            characterId: client.character.characterId,
          });
          this._vehicles[vehicle].isManaged = true;
          this._vehicles[vehicle].manager = client;
        }

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
    client.spawnedEntities = client.spawnedEntities.filter((el) => {
      return !objectsToRemove.includes(el);
    });
    objectsToRemove.forEach((object: any) => {
      const characterId = object.characterId
        ? object.characterId
        : object.npcData.characterId;
      if (characterId in this._vehicles) {
        if (this._vehicles[characterId].manager === client) {
          this._vehicles[characterId].isManaged = false;
          this.dropVehicleManager(client, characterId);
        }
      }
      this.sendData(
        client,
        "PlayerUpdate.RemovePlayerGracefully",
        {
          characterId,
        },
        1
      );
    });
  }

  spawnObjects(client: Client): void {
    this.spawnNpcCollection(client, this._objects);
  }

  spawnNpcCollection(client: Client, collection: any) {
      for (const item in collection) {
        const itemData = collection[item];
        if (
          isPosInRadius(
            this._npcRenderDistance,
            client.character.state.position,
            itemData.position
          ) &&
          !client.spawnedEntities.includes(itemData)
        ) {
          client.npcsToSpawn.push(itemData);
          client.spawnedEntities.push(itemData);
        }
      }
  }

  spawnDoors(client: Client): void {
    this.spawnNpcCollection(client, this._doors);
  }

  spawnProps(client: Client): void {
    this.spawnNpcCollection(client, this._props);
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
    delete require.cache[require.resolve("./workers/createBaseEntities")];
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

  async changeWeatherWithTemplate(client: Client, weatherTemplate: string): Promise<void> {
    const weather = this._soloMode ? localSpawnList[weatherTemplate]: await this._db?.collection("weathers").findOne({ templateName: weatherTemplate });
    if(weather){
      this._weather = weather;
      this.SendSkyChangedPacket(client, weather, !this._soloMode);
    }
    else{
      this.sendChatText(client, `"${weatherTemplate}" isn't a weather template`);
      this.sendChatText(
          client,
          `Use "/hax weather list" to know all available templates`
        );
    }
  }

  changeWeather(client: Client, weather: Weather): void {
    this._weather = weather;
    this.SendSkyChangedPacket(client, weather, !this._soloMode);
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

  sendGlobalTextAlert(message: string): void {
    for (const a in this._clients) {
      this.sendTextAlert(this._clients[a], message);
    }
  }

  sendTextAlert(client: Client, message: string): void {
    this.sendData(client, "ClientUpdate.TextAlert", {
      message: message,
    });
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

  sendData(
    client: Client,
    packetName: h1z1PacketsType,
    obj: any,
    channel = 0
  ): void {
    if (packetName != "KeepAlive") {
      debug("send data", packetName);
    }
    const data = this._protocol.pack(packetName, obj);
    this._gatewayServer.sendTunnelData(client, data, channel);
  }

  sendDataToAll(packetName: h1z1PacketsType, obj: any, channel = 0): void {
    for (const a in this._clients) {
      this.sendData(this._clients[a], packetName, obj, channel);
    }
  }

  sendDataToAllOthers(
    client: Client,
    packetName: h1z1PacketsType,
    obj: any,
    channel = 0
  ): void {
    for (const a in this._clients) {
      if (client != this._clients[a]) {
        this.sendData(this._clients[a], packetName, obj, channel);
      }
    }
  }

  sendRawToAll(data: Buffer): void {
    for (const a in this._clients) {
      this.sendRawData(this._clients[a], data);
    }
  }

  sendRawToAllOthers(client: Client, data: Buffer): void {
    for (const a in this._clients) {
      if (client != this._clients[a]) {
        this.sendRawData(this._clients[a], data);
      }
    }
  }

  sendWeaponPacket(client: Client, packetName: string, obj: any): void {
    const weaponPacket = {
      gameTime: this.getSequenceTime(),
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
  }

  removeForcedTime(): void {
    this._cycleSpeed = 0.1;
    this._frozeCycle = false;
    this._gameTime = Date.now();
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

  getSequenceTime(): number {
    return Date.now() - this._time;
  }

  getServerTimeTest(): number {
    debug("get server time");
    const delta = Date.now() - this._startTime;
    return Number(
      (((this._serverTime + delta) * this._timeMultiplier) / 1000).toFixed(0)
    );
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

  getTransientId(client: any, guid: string): number {
    let generatedTransient;
    do {
      generatedTransient = Number((Math.random() * 30000).toFixed(0));
    } while (!!this._transientIds[generatedTransient]);
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

if (
  process.env.VSCODE_DEBUG === "true" &&
  process.env.CLIENT_SIXTEEN !== "true"
) {
  const zoneServer = new ZoneServer(
    1117,
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    process.env.MONGO_URL,
    1
  );
  zoneServer._maxAllowedPing = 9999;
  zoneServer.start();
}
