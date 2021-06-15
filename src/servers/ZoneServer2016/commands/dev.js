const debug = require("debug")("zonepacketHandlers");
import { generateCharacterId } from "../../../utils/utils";

const dev = {
  testpacket: function (server, client, args) {
    const packetName = args[1];
    server.sendData(client, packetName, {});
  },
  testNpc: function (server, client, args) {
    const characterId = generateCharacterId();
    server.sendData(client, "PlayerUpdate.AddLightweightNpc", {
      characterId: characterId,
      modelId: 9001,
      transientId: server.getTransientId(client, characterId),
      position: client.character.state.position,
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    });
    setInterval(() => {
      server.sendData(client, "PlayerUpdate.SeekTarget", {
        characterId: characterId,
        TargetCharacterId: client.character.characterId,
        position: client.character.state.position,
      });
    }, 500);
  },
  findModel: function (server, client, args) {
    const models = require("../../../../data/2016/dataSources/Models.json");
    const wordFilter = args[1];
    if (wordFilter) {
      const result = models.filter((word) =>
        word?.MODEL_FILE_NAME?.toLowerCase().includes(wordFilter.toLowerCase())
      );
      server.sendChatText(client, `Found models for ${wordFilter}:`);
      for (let index = 0; index < result.length; index++) {
        const element = result[index];
        server.sendChatText(client, `${element.ID} ${element.MODEL_FILE_NAME}`);
      }
    } else {
      server.sendChatText(client, `missing word filter`);
    }
  },
  reloadPackets: function (server, client, args) {
    if (args[1]) {
      server.reloadPackets(client, args[1]);
    } else {
      server.reloadPackets(client);
    }
  },
  reloadMongo: function (server, client, args) {
    server._soloMode
      ? server.sendChatText(client, "Can't do that in solomode...")
      : server.reloadMongoData(client);
  },
  systemmessage: function (server, client, args) {
    if(!args[1]){
      server.sendChatText(client, "Missing 'message' parameter");
      return;
    }
    const msg = {
      unknownDword1: 0,
      message: args[1],
      unknownDword2: 0,
      color: 2
    };
    server.sendChatText(client, "Sending system message");
    server.sendData(client, "ShowSystemMessage", msg);
  },
  setresource: function (server, client, args) {
  
    if(!args[3]){
      server.sendChatText(client, "Missing resourceId, resourceType, and value args");
      return;
    }
    const resourceEvent = {
      eventData: { // tonumber not defined for some reason, used for args
        type: 2,
        value: {
          characterId: "0x03147cca2a860191",
          resourceId: args[1],
          resourceType: args[2],
          unknownArray1:[],
          value: args[3],
          unknownArray2: [],
        }
      }
    };
    server.sendChatText(client, "Setting character resource");
    server.sendData(client, "ResourceEvent", resourceEvent);
  },
  setloadout: function (server, client, args) {
    /*
    if(!args[3]){
      server.sendChatText(client, "Missing resourceId, resourceType, and value args");
      return;
    }
    */
    const loadoutEvent = {
      eventData: {
        type: 2,
        value: {

        }
      }
    };
    server.sendChatText(client, "Setting character loadout");
    server.sendData(client, "LoadoutEvent", loadoutEvent);
  },

  setequipment: function (server, client, args) {
    /*
    if(!args[3]){
      server.sendChatText(client, "Missing resourceId, resourceType, and value args");
      return;
    }
    */
    const equipmentEvent = {
      unknownData1: {
        unknownData1: {},
        unknownData2: {
          unknownArray1: []
        }
      }
    };
    server.sendChatText(client, "Setting character equipment");
    server.sendData(client, "Equipment.SetCharacterEquipmentSlot", equipmentEvent);
  },
};

export default dev;
