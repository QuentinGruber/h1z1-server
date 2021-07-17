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

const debugName = "ZoneServer";
const debug = require("debug")(debugName);
import { default as packetHandlers } from "./zonepackethandlers";
import { ZoneServer } from "../ZoneServer/zoneserver";
import { Client, skyData } from "../../types/zoneserver";
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
// const spawnLocations = require("../../../data/2015/sampleData/spawnLocations.json");
// const localWeatherTemplates = require("../../../data/2015/sampleData/weather.json");
// const stats = require("../../../data/2015/sampleData/stats.json");
const recipes = require("../../../data/2016/sampleData/recipes.json");
// const resources = require("../../../data/2015/dataSources/Resources.json");
const Z1_POIs = require("../../../data/2015/zoneData/Z1_POIs");

export class ZoneServer2016 extends ZoneServer {
  constructor(serverPort: number, gatewayKey: Uint8Array, mongoAddress = "") {
    super(serverPort, gatewayKey, mongoAddress);
    this._protocol = new H1Z1Protocol("ClientProtocol_1080");
    this._packetHandlers = packetHandlers;
    this._dynamicWeatherEnabled = false;
  }
  async characterData(client: Client) {
    delete require.cache[
      require.resolve("../../../data/2016/sampleData/sendself.json") // reload json
    ];
    const self = require("../../../data/2016/sampleData/sendself.json"); // dummy self
    const {
      data: { identity },
    } = self;
    client.character.guid = self.data.guid;
    client.character.loadouts = self.data.characterLoadoutData.loadouts;
    client.character.inventory = self.data.inventory;
    client.character.factionId = self.data.factionId;
    client.character.name = identity.characterName;

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
      self.data.position = this._spawnLocations[randomSpawnIndex].position;
      self.data.rotation = this._spawnLocations[randomSpawnIndex].rotation;
      client.character.spawnLocation =
        this._spawnLocations[randomSpawnIndex].name;
    }

    self.data.recipes = recipes; // load recipes into sendself from file

    this.sendData(client, "SendSelfToClient", self);
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
      this._dynamicWeatherInterval = setInterval(
        () => dynamicWeather(this),
        100
      );
    }
    this._gatewayServer.start();
  }

  POIManager(client: Client) {
    // sends POIChangeMessage or clears it based on player location
    let isInAPOIArea = false;
    Z1_POIs.forEach((point: any) => {
      if (
        isPosInRadius(
          point.range,
          client.character.state.position,
          point.position
        )
      ) {
        isInAPOIArea = true;
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
    if (!isInAPOIArea && client.currentPOI != 0) {
      // checks if POIChangeMessage was already cleared
      this.sendData(client, "POIChangeMessage", {
        messageStringId: 0,
        id: 115,
      });
      client.currentPOI = 0;
    }
  }

  worldRoutine(client: Client): void {
    debug("WORLDROUTINE \n\n");
    this.spawnCharacters(client);
    this.spawnObjects(client);
    this.spawnDoors(client);
    this.spawnNpcs(client);
    this.spawnVehicles(client);
    this.removeOutOfDistanceEntities(client);
    this.POIManager(client);
    client.posAtLastRoutine = client.character.state.position;
  }

  SendWeatherUpdatePacket(
    client: Client,
    weather: skyData,
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

  sendEquipment(client: Client): void {
    this.sendData(client, "Equipment.SetCharacterEquipmentSlot", {
      characterData: {
        characterId: client.character.characterId,
      },
      equipmentTexture: {
        index: 1, // needs to be non-zero
        slotId: 1, // needs to be non-zero
        unknownQword1: "0x1", // needs to be non-zero
        textureAlias: "",
        unknownString1: "",
      },
      equipmentModel: {
        model: "SurvivorMale_Hair_ShortMessy.adr",
        effectId: 0,
        equipmentSlotId: 27,
        unknownArray1: [],
      },
    });
  }

  sendResources(client: Client): void {
    this.sendData(client, "ResourceEvent", {
      eventData: {
        type: 1,
        value: {
          characterId: client.character.characterId,
          characterResources: [
            {
              resourceId: 1, // health
              resourceData: {
                resourceId: 1,
                resourceType: 1,
                unknownArray1: [],
                value: 5000, // 10000 max
              },
            },
            {
              resourceId: 6, // stamina
              resourceData: {
                resourceId: 6,
                resourceType: 6,
                unknownArray1: [],
                value: 600, // 600 max
              },
            },
            {
              resourceId: 4, // food
              resourceData: {
                resourceId: 4,
                resourceType: 4,
                unknownArray1: [],
                value: 5000, // 10000 max
              },
            },
            {
              resourceId: 5, // water
              resourceData: {
                resourceId: 5,
                resourceType: 5,
                unknownArray1: [],
                value: 5000, // 10000 max
              },
            },
            {
              resourceId: 68, // comfort
              resourceData: {
                resourceId: 68,
                resourceType: 68,
                unknownArray1: [],
                value: 5000, // 5000 max
              },
            },
            {
              resourceId: 12, // h1z1 virus
              resourceData: {
                resourceId: 12,
                resourceType: 12,
                unknownArray1: [],
                value: 10000, // 10000 max
              },
            },
          ],
        },
      },
    });
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
        this.sendData(client, "PlayerUpdate.ManagedObject", {
          objectCharacterId: characterId,
          characterId: client.character.characterId,
        });
      }

      this.sendData(
        client,
        "PlayerUpdate.RemovePlayer",
        {
          characterId,
        },
        1
      );
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
            transientId: 1,
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
          "AddLightweightVehicle",
          this._vehicles[vehicle],
          1
        );
        this.sendData(client, "PlayerUpdate.ManagedObject", {
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

  sendGameTimeSync(client: Client): void {
    debug("GameTimeSync");
    this.sendData(client, "GameTimeSync", {
      time: Int64String(this.getGameTime()),
      cycleSpeed: this._cycleSpeed,
      unknownBoolean: false,
    });
  }
}

if (process.env.VSCODE_DEBUG === "true") {
  new ZoneServer2016(
    1117,
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
  ).start();
}
