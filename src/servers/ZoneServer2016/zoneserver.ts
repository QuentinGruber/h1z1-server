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
import { Client } from "../../types/zoneserver";
import { H1Z1Protocol } from "../../protocols/h1z1protocol";

export class ZoneServer2016 extends ZoneServer {
  constructor(
    serverPort: number,
    gatewayKey: Uint8Array,
    mongoAddress: string = ""
  ) {
    super(serverPort,gatewayKey,mongoAddress)
    this._protocol = new H1Z1Protocol("ClientProtocol_1080")
    this._packetHandlers = packetHandlers
  }
  spawnNpcs(client:Client){
    for (let npc in this._npcs) {
      this.sendData(client, "AddLightweightNpc", this._npcs[npc]);
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
