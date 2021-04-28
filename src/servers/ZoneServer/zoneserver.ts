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
const localSpawnList = require("../../../data/sampleData/spawnLocations.json");
import _ from "lodash";
import {
  Int64String,
  initMongo,
  getCharacterId,
  generateCharacterId,
} from "../../utils/utils";
const debugName = "ZoneServer";
const debug = require("debug")(debugName);
const localWeatherTemplates = require("../../../data/sampleData/weather.json");
const Z1_doors = require("../../../data/zoneData/Z1_doors.json");
const models = require("../../../data/dataSources/Models.json");
import { Weather, Client } from "../../types/zoneserver";
import { MongoClient , Db} from "mongodb";

export class ZoneServer extends EventEmitter {
  _gatewayServer: any;
  _protocol: any;
  _db: Db | undefined;
  _soloMode: any;
  _mongoClient: any;
  _mongoAddress: string;
  _clients: any;
  _characters: any;
  _gameTime: any;
  _serverTime: any;
  _transientId: any;
  _guids: Array<string>;
  _characterIds: any;
  _packetHandlers: any;
  _referenceData: any;
  _startTime: number;
  _startGameTime: number;
  _cycleSpeed: number;
  _frozeCycle: boolean;
  _weather: Weather;
  _spawnLocations: any;
  _defaultWeatherTemplate: string;
  _weatherTemplates: any;
  _npcs: any;
  _objects: any;
  _reloadPacketsInterval: any;
  _pingTimeoutTime: number;
  _worldId: number;
  constructor(
    serverPort: number,
    gatewayKey: string,
    mongoAddress: string = "",
    worldId: number = 0
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
    this._guids = [];
    this._characterIds = {};
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
    this._pingTimeoutTime = 30000;
    if (!this._mongoAddress) {
      this._soloMode = true;
      debug("Server in solo mode !");
    }
    this.on("data", (err, client, packet) => {
      if (err) {
        console.error(err);
      } else {
        if (packet.name != "KeepAlive") {
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
            position: [0, 0, 0, 0],
            rotation: [0, 0, 0, 0],
            health: 0,
            shield: 0,
          },
        };
        client.lastPingTime = new Date().getTime() + 120 * 1000;
        client.pingTimer = setInterval(() => {
          this.checkIfClientStillOnline(client);
        }, 20000);
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

  async setupServer() {
    this.forceTime(971172000000); // force day time by default
    await this.loadMongoData();
    this._weather = this._soloMode
      ? this._weatherTemplates[this._defaultWeatherTemplate]
      : _.find(this._weatherTemplates, (template) => {
          return template.templateName === this._defaultWeatherTemplate;
        });
        if(!this._soloMode && (await this._db?.collection("worlds").findOne({worldId:this._worldId}))){
          this.fetchWorldData();
        }
        else{
          this.createAllObjects();
          await this.saveWorld();
        }
    debug("Server ready");
  }
  async fetchWorldData() {
    if(!this._soloMode){
      const worldData = await this._db?.collection("worlds").findOne({worldId:this._worldId});
      this._npcs = worldData.npcs
      this._objects = worldData.objects
      this._weather = worldData.weather
      debug("World fetched!")
    }
  }
  async saveWorld() {
    if(!this._soloMode){
      const save = {
        worldId:this._worldId,
        npcs:this._npcs,
        weather:this._weather,
        objects:this._objects
      }
      if(this._worldId){
        if((await this._db?.collection("worlds").findOne({worldId:this._worldId}))){
          await this._db?.collection("worlds").updateOne({worldId:this._worldId},{$set:save});

        }
        else {
          await this._db?.collection("worlds").insertOne(save);
        }

      }
      else{
        const numberOfWorld:number = await this._db?.collection("worlds").find( {  } ).count() || 0
        const createdWorld = await this._db?.collection("worlds").insertOne( {
          worldId:numberOfWorld +1,
          npcs:save.npcs,
          weather:save.weather,
          objects:save.objects
        });
        this._worldId = createdWorld?.ops[0].worldId
      }
      debug("World saved!")
      setTimeout(() => {
        this.saveWorld();
      }, 30000);
    }
  }
  async start() {
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
    this._gatewayServer.start();
  }

  async loadMongoData() {
    this._spawnLocations = this._soloMode
      ? localSpawnList
      : await this._db?.collection("spawns").find().toArray();
    this._weatherTemplates = this._soloMode
      ? localWeatherTemplates
      : await this._db?.collection("weathers").find().toArray();
  }

  async reloadMongoData(client: Client) {
    await this.loadMongoData();
    this.sendChatText(client, "[DEV] Mongo data reloaded", true);
  }

  reloadPackets(client: Client, intervalTime: number = -1) {
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

  reloadZonePacketHandlers() {
    delete require.cache[require.resolve("./zonepackethandlers")];
    this._packetHandlers = require("./zonepackethandlers").default;
  }

  checkIfClientStillOnline(client: Client) {
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

  generateGuid() {
    let guid: string;
    do {
      guid = "0x";
      for (let i: any = 0; i < 16; i++) {
        guid += Math.floor(Math.random() * 16).toString(16) as string;
      }
    } while (!_.indexOf(this._guids, guid));
    this._guids.push(guid);
    return guid;
  }

  parseReferenceData() {
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

  characterData(client: Client) {
    delete require.cache[
      require.resolve("../../../data/sampleData/sendself.json") // reload json
    ];
    const self = require("../../../data/sampleData/sendself.json"); // dummy self
    if (
      String(client.character.characterId).toUpperCase() ===
      String(getCharacterId(99)).toUpperCase()
    ) {
      // for fun 🤠
      self.data.characterId = String(getCharacterId(99)).toUpperCase();
      self.data.identity.characterFirstName = "Cowboy :)";
      self.data.extraModel = "SurvivorMale_Ivan_OutbackHat_Base.adr";
      self.data.extraModelTexture = "Ivan_OutbackHat_LeatherTan";
    }
    const {
      data: { identity },
    } = self;
    client.character.guid = self.data.guid;
    client.character.loadouts = self.data.characterLoadoutData.loadouts;
    client.character.inventory = self.data.inventory;
    client.character.factionId = self.data.factionId;
    client.character.name =
      identity.characterFirstName + identity.characterLastName;

    if (
      _.isEqual(self.data.position, [0, 0, 0, 1]) &&
      _.isEqual(self.data.rotation, [0, 0, 0, 1])
    ) {
      // if position/rotation hasn't be changed
      self.data.isRandomlySpawning = true;
    }

    if (self.data.isRandomlySpawning) {
      // Take position/rotation from a random spawn location.
      const randomSpawnIndex = Math.floor(
        Math.random() * this._spawnLocations.length
      );
      self.data.position = client.character.state.position = this._spawnLocations[randomSpawnIndex].position;
      self.data.rotation = client.character.state.rotation = this._spawnLocations[randomSpawnIndex].rotation;
      client.character.spawnLocation = this._spawnLocations[
        randomSpawnIndex
      ].name;
    }
    else{
      client.character.state.position = self.data.position
      client.character.state.rotation = self.data.rotation
    }
    this.sendData(client, "SendSelfToClient", self);
  }
  generateProfiles(): any[] {
    const profiles: any[] = [];
    const profileTypes = require("../../../data/dataSources/ProfileTypes.json")
    profileTypes.forEach((profile:any) => {
      profiles.push({profileId:profile.ID,type:profile.ID,nameId:profile.NAME_ID})
    });
    debug("Generated profiles")
    return profiles;
  }

  sendInitData(client: Client) {
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

  spawnAllNpc(client: Client) {
    for (let npc in this._npcs) {
      setImmediate(() => {
        this.sendData(
          client,
          "PlayerUpdate.AddLightweightNpc",
          this._npcs[npc]
        );
      });
    }
  }

  spawnAllObject(client: Client) {
    for (let object in this._objects) {
      setImmediate(() => {
        this.sendData(
          client,
          "PlayerUpdate.AddLightweightNpc",
          this._objects[object]
        );
      });
    }
  }

  removeNpc(characterId:string){
    this.sendDataToAll("PlayerUpdate.RemovePlayer", {
      characterId: characterId,
    });
    delete this._characterIds[characterId.replace("0x","")]
  }

  createObject(
    modelID: number,
    position: Array<number>,
    rotation: Array<number>
  ) {
    const guid = this.generateGuid();
    const characterId = generateCharacterId(this._characterIds);
    rotation[0] += 250;
    this._objects[characterId] = {
      characterId: characterId,
      guid: guid,
      transientId: 1,
      modelId: modelID,
      position: position,
      rotation: rotation,
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    };
  }

  createAllObjects() {
    this.createAllDoors();
    debug("All objects created");
  }
  createAllDoors() {
    Z1_doors.forEach((doorType: any) => {
      // TODO: add types for Z1_doors
      const modelId: number = _.find(models, {
        MODEL_FILE_NAME: doorType.actorDefinition.replace("_Placer", ""),
      })?.ID;
      doorType.instances.forEach((doorInstance: any) => {
        modelId
          ? this.createObject(
              modelId,
              doorInstance.position,
              doorInstance.rotation
            )
          : this.createObject(
              9183,
              doorInstance.position,
              doorInstance.rotation
            );
      });
    });
    debug("All doors objects created");
  }

  data(collectionName: string) {
    if (this._db) {
      return this._db.collection(collectionName);
    }
  }

  SendZoneDetailsPacket(client: Client, weather: Weather) {
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
    isGlobal: boolean = false
  ) {
    if (isGlobal) {
      this.sendDataToAll("SkyChanged", weather);
      this.sendGlobalChatText(
        `User "${client.character.name}" has changed weather.`
      );
    } else {
      this.sendData(client, "SkyChanged", weather);
    }
  }

  changeWeather(client: Client, weather: Weather) {
    this._weather = weather;
    this.SendSkyChangedPacket(client, weather, this._soloMode ? false : true);
  }
  sendSystemMessage(message: string) {
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

  sendChat(client: Client, message: string, channel: number) {
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

  sendGlobalChatText(message: string, clearChat: boolean = false) {
    for (let a in this._clients) {
      this.sendChatText(this._clients[a], message, clearChat);
    }
  }
  sendChatText(client: Client, message: string, clearChat: boolean = false) {
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

  setCharacterLoadout(client: Client, loadoutId: number, loadoutTab: any) {
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
  sendData(client: Client, packetName: string, obj: any) {
    if (packetName != "KeepAlive") {
      debug("send data", packetName);
    }
    const data = this._protocol.pack(packetName, obj, this._referenceData);
    if (Array.isArray(client)) {
      for (let i = 0; i < client.length; i++) {
        this._gatewayServer.sendTunnelData(client[i], data);
      }
    } else {
      this._gatewayServer.sendTunnelData(client, data);
    }
  }

  sendDataToAll(packetName: string, obj: any) {
    for (let a in this._clients) {
      this.sendData(this._clients[a], packetName, obj);
    }
  }

  sendWeaponPacket(client: Client, packetName: string, obj: any) {
    const weaponPacket = {
      gameTime: this.getServerTime(),
      packetName: packetName,
      packet: obj,
    };
    this.sendData(client, "Weapon.Weapon", {
      weaponPacket: weaponPacket,
    });
  }

  sendRawData(client: Client, data: Buffer) {
    this._gatewayServer.sendTunnelData(client, data);
  }

  stop() {
    debug("Shutting down");
    process.exit(0);
  }

  forceTime(time: number) {
    this._cycleSpeed = 0.1;
    this._frozeCycle = true;
    this._gameTime = time;
    this.sendSyncToAll();
  }

  removeForcedTime() {
    this._cycleSpeed = 0.1;
    this._frozeCycle = false;
    this._gameTime = Date.now();
    this.sendSyncToAll();
  }

  getCurrentTime() {
    return (Date.now() / 1000).toFixed(0);
  }

  getGameTime() {
    debug("get server time");
    let delta = Date.now() - this._startGameTime;
    return this._frozeCycle
      ? Number(((this._gameTime + delta) / 1000).toFixed(0))
      : Number((this._gameTime / 1000).toFixed(0));
  }

  getServerTime() {
    debug("get server time");
    let delta = Date.now() - this._startTime;
    return this._serverTime + delta;
  }

  sendGameTimeSync(client: Client) {
    debug("GameTimeSync");
    this.sendData(client, "GameTimeSync", {
      time: Int64String(this.getGameTime()),
      cycleSpeed: this._cycleSpeed,
      unknownBoolean: false,
    });
  }

  sendSyncToAll() {
    // TODO: this do not seems to work
    debug("Synchronization");
    this.sendDataToAll("Synchronization", {
      serverTime: Int64String(this.getServerTime()),
      serverTime2: Int64String(this.getServerTime()),
    });
  }

  getTransientId(client: any, guid: string) {
    if (!client.transientIds[guid]) {
      client.transientId++;
      client.transientIds[guid] = client.transientId;
    }
    return client.transientIds[guid];
  }

  createPositionUpdate(position: Array<number>, rotation: Array<number>) {
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
