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
import Client from "./zoneclient";
import { Weather2016 } from "../../types/zoneserver";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import { _ } from "../../utils/utils";

import {
  //generateRandomGuid,
  initMongo,
  Int64String,
  isPosInRadius,
} from "../../utils/utils";

import { /*Db,*/ MongoClient } from "mongodb";
import dynamicWeather from "./workers/dynamicWeather";

// need to get 2016 lists
const spawnLocations = require("../../../data/2016/zoneData/Z1_spawnLocations.json");
const Z1_POIs = require("../../../data/2015/zoneData/Z1_POIs");
const recipes = require("../../../data/2016/sampleData/recipes.json");
// const localWeatherTemplates = require("../../../data/2015/sampleData/weather.json");
// const stats = require("../../../data/2016/sampleData/stats.json");
const resources = require("../../../data/2016/dataSources/resourceDefinitions.json");

export class ZoneServer2016 extends ZoneServer {
  worldRoutineTimer: any;
  _weather2016: Weather2016;
  constructor(serverPort: number, gatewayKey: Uint8Array, mongoAddress = "") {
    super(serverPort, gatewayKey, mongoAddress);
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this._packetHandlers = packetHandlers;
    this._dynamicWeatherEnabled = false;
    this._cycleSpeed = 100;
    this._weather2016 = {
      name: "",
      unknownDword1: 0,
      unknownDword2: 0,
      skyBrightness1: 1,
      skyBrightness2: 1,
      snow: 0,
      snowMap: 0,
      colorGradient: .7,
      unknownDword8: .16,
      unknownDword9: .68,
      unknownDword10: .08,
      unknownDword11: 0,
      unknownDword12: 0,
      sunAxisX: 0,
      sunAxisY: 0,
      unknownDword15: 0,
      disableTrees: 0,
      disableTrees1: 0,
      disableTrees2: 0,
      wind: 5,
      unknownDword20: 0,
      unknownDword21: 0,
      unknownDword22: 0,
      unknownDword23: 0,
      unknownDword24: 0,
      unknownDword25: 0,
      unknownDword26: 0,
      unknownDword27: 0,
      unknownDword28: 0,
      unknownDword29: 0,
      unknownDword30: 0,
      unknownDword31: 0,
      unknownDword32: 0,
      unknownDword33: 0,
    };
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
  }
  onZoneDataEvent(err: any, client: Client, packet: any){
    if (err) {
      console.error(err);
    } else {
      if (
        packet.name != "KeepAlive" &&
        packet.name != "PlayerUpdateUpdatePositionClientToZone" &&
        packet.name != "PlayerUpdateManagedPosition" &&
        packet.name != "ClientUpdate.MonitorTimeDrift"
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
        comfort: 5000
      },
      equipment: [
        {
          modelName: "SurvivorMale_Head_01.adr",
          slotId: 1,
        },
        {
          modelName: "SurvivorMale_Legs_Pants_Underwear.adr",
          slotId: 4,
        },
        {
          modelName: "SurvivorMale_Eyes_01.adr",
          slotId: 105,
        },
        { modelName: "Weapon_Empty.adr", slotId: 2 },
        { modelName: "Weapon_Empty.adr", slotId: 7 },
        {
          modelName: "SurvivorMale_Hair_ShortMessy.adr",
          slotId: 27,
        },
        {
          modelName: "SurvivorMale_Chest_Shirt_TintTshirt.adr",
          defaultTextureAlias: "Wear.Chest.Shirt.TintTshirt.67",
          slotId: 3,
        },
        {
          modelName: "SurvivorMale_Legs_Pants_SkinnyLeg.adr",
          defaultTextureAlias: "Wear.Legs.Pants.SkinnyLeg.Anarchy",
          slotId: 4,
        },
      ],
      state: {
        position: new Float32Array([0, 0, 0, 1]),
        rotation: new Float32Array([0, 0, 0, 1]),
        lookAt: new Float32Array([0, 0, 0, 1]),
        health: 0,
        shield: 0,
      }
    };
    /*
    const characterDataMongo: any = await this._db
      ?.collection("characters")
      .findOne({ characterId: client.character.characterId });
    client.character.extraModel = characterDataMongo?.extraModelTexture
      ? characterDataMongo.extraModelTexture
      : this._dummySelf.data.extraModelTexture;
    */
    let isRandomlySpawning = false;
    if (
      _.isEqual(character.position, [0, 0, 0, 1]) &&
      _.isEqual(character.rotation, [0, 0, 0, 1])
    ) {
      // if position/rotation hasn't be changed
      if (this._soloMode /*|| !characterDataMongo.position*/) {
        isRandomlySpawning = true;
      }
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
      /*
      if (!this._soloMode) {
        client.character.state.position = characterDataMongo.position;
        client.character.state.rotation = characterDataMongo.rotation;
      }
      */
    }
    this._characters[client.character.characterId] = client.character; // character will spawn on other player's screen(s) at this point
  }

  async sendCharacterData(client: Client) {
    await this.loadCharacterData(client);
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
        //stats: stats // todo: fix

        characterResources: [
          {
            ...resources.health,
            resourceData: { 
              ...resources.health.resourceData, 
              value: client.character.resources.health 
            }
          },
          {
            ...resources.stamina,
            resourceData: { 
              ...resources.stamina.resourceData, 
              value: client.character.resources.stamina 
            }
          },
          {
            ...resources.food,
            resourceData: { 
              ...resources.food.resourceData, 
              value: client.character.resources.food 
            }
          },
          {
            ...resources.water,
            resourceData: { 
              ...resources.water.resourceData, 
              value: client.character.resources.water 
            }
          },
          {
            ...resources.comfort,
            resourceData: { 
              ...resources.comfort.resourceData, 
              value: client.character.resources.comfort 
            }
          },
          {
            ...resources.virus,
            resourceData: { 
              ...resources.virus.resourceData, 
              value: client.character.resources.virus 
            }
          },
        ],
      }
    });
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
        throw debug("[ERROR]Unable to connect to mongo server");
      }
      debug("connected to mongo !");
      // if no collections exist on h1server database , fill it with samples
      (await mongoClient.db("h1server").collections()).length ||
        (await initMongo(this._mongoAddress, debugName));
      this._db = mongoClient.db("h1server");
    }

    await this.setupServer();
    this._startTime += Date.now();
    this._startGameTime += Date.now();
    if (this._dynamicWeatherEnabled) {
      this._dynamicWeatherWorker = setInterval(() => dynamicWeather(this), 100);
    }
    this._gatewayServer.start();
    this.worldRoutineTimer = setTimeout(()=>this.worldRoutine2016.bind(this)(true), 3000);
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

  setPosAtLastRoutine(client: Client){
    client.posAtLastRoutine = client.character.state.position;
  }

  worldRoutine2016(refresh = false): void {
    debug("WORLDROUTINE");
    this.executeFuncForAllClients("spawnCharacters");
    this.executeFuncForAllClients("spawnObjects");
    this.executeFuncForAllClients("spawnDoors");
    this.executeFuncForAllClients("spawnNpcs");
    this.executeFuncForAllClients("spawnVehicles");
    this.executeFuncForAllClients("removeOutOfDistanceEntities");
    this.executeFuncForAllClients("POIManager");
    this.executeFuncForAllClients("setPosAtLastRoutine");
    if(refresh) this.worldRoutineTimer.refresh()
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

  SendWeatherUpdatePacket(
    client: Client,
    weather: Weather2016,
    isGlobal = false
  ): void {
    if (isGlobal) {
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

  deleteEntity(characterId: string, dictionnary: any) {
    this.sendDataToAll(
      "Character.RemovePlayer",
      {
        characterId: characterId,
      },
      1
    );
    delete dictionnary[characterId];
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

  updateWeather2016(client: Client): void {
    this.SendWeatherUpdatePacket(
      client,
      this._weather2016,
      this._soloMode ? false : true
    );
  }
}

if (process.env.VSCODE_DEBUG === "true") {
  new ZoneServer2016(
    1117,
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
  ).start();
}
