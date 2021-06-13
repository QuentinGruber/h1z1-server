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
import { Client, Weather } from "../../types/zoneserver";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";
import _ from "lodash";
import { Base64 } from "js-base64";

export class ZoneServer2016 extends ZoneServer {
  constructor(
    serverPort: number,
    gatewayKey: Uint8Array,
    mongoAddress: string = ""
  ) {
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
      self.data.position = this._spawnLocations[randomSpawnIndex].position;
      self.data.rotation = this._spawnLocations[randomSpawnIndex].rotation;
      client.character.spawnLocation =
        this._spawnLocations[randomSpawnIndex].name;
    }
    this.sendData(client, "SendSelfToClient", self);
  }

  worldRoutine(client: Client): void {
    // this.spawnCharacters(client);
    // this.spawnObjects(client);
    // this.spawnDoors(client);
    // this.spawnNpcs(client);
    // this.spawnVehicles(client);
    // this.removeOutOfDistanceEntities(client);
    // this.pointOfInterest(client);
    // client.posAtLastRoutine = client.character.state.position;
  }



  SendSkyChangedPacket(
    client: Client,
    weather: Weather,
    isGlobal = false
  ): void {
    if (isGlobal) {
      this.sendDataToAll("SendZoneDetails", weather);
      if (client?.character?.name) {
        this.sendGlobalChatText(
          `User "${client.character.name}" has changed weather.`
        );
      }
    } else {
      this.sendData(client, "SendZoneDetails", weather);
    }
  }
  spawnNpcs(client: Client) {
    for (let npc in this._npcs) {
      this.sendData(client, "AddLightweightNpc", this._npcs[npc]);
    }
  }

  spawnVehicles(client: Client) {
    for (let vehicle in this._vehicles) {
      this.sendData(client, "AddLightweightVehicle", this._vehicles[vehicle]);
    }
  }

  sendChat(client: Client, message: string, channel: number) {
    const { character } = client;
    if (!this._soloMode) {
      /*
      this.sendDataToAll("Chat.Chat", {
        channel: 0,
        identity1: { characterFirstName: character.name, unknownQword1: "0x03147cca2a860191"},
        identity2: { characterFirstName: character.name, unknownQword1: "0x03147cca2a860191"},
        characterId1: "0x03147cca2a860191",
        characterId2: "0x03147cca2a860191",
        message: message,
        color1: 4294967295,
        position: character.spawnLocation
      });
      */
      this.sendDataToAll("Chat.ChatText", {
        message: `${client.character.name}: ${message}`,
        unknownDword1: 0,
        color: [255, 255, 255, 0],
        unknownDword2: 13951728,
        unknownByte3: 0,
        unknownByte4: 1,
      });
    } else {
      /*
      this.sendData(client, "Chat.Chat", {
        channel: 0,
        identity1: { characterFirstName: character.name, unknownQword1: "0x03147cca2a860191"},
        identity2: { characterFirstName: character.name, unknownQword1: "0x03147cca2a860191"},
        characterId1: "0x03147cca2a860191",
        characterId2: "0x03147cca2a860191",
        message: message,
        color1: 4294967295,
        position: character.spawnLocation
      });
      */
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
}

if (process.env.VSCODE_DEBUG === "true") {
  new ZoneServer2016(
    1117,
    Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")
  ).start();
}
