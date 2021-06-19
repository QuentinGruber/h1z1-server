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
      eventData: {
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
  containerevent: function (server, client, args) {
    /*
    if(!args[1]){
      server.sendChatText(client, "Missing containerError arg");
      return;
    }
    */
    const containerData = {
      // characterId: client.character.characterId,
      // containerError: parseInt(args[1])
      // array1: [],
      ignore: client.character.characterId,
      containersLength: 1,
      containers: [
        {containerData: {
          
        }}
      ],
      array1Length: 1,
      array1: [{unknownQword1: server.generateGuid(), unknownDword1: 2}]
    }

    server.sendData(client, "Container.unknown2", containerData);
  },
  containererror: function (server, client, args) {
    
    if(!args[1]){
      server.sendChatText(client, "Missing containerError arg");
      return;
    }
    const container = {
      characterId: client.character.characterId,
      containerError: parseInt(args[1])
    }

    server.sendData(client, "Container.Error", container);
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

  tpObject: function (server, client, args) {
    if(!args[1]) {
      server.sendChatText(client, "Missing object arg");
      return;
    }

    const location = {
      position: [0, 80, 0, 1],
      rotation: [0, 0, 0, 1],
      unknownBool1: true,
      unknownByte1: 100,
      unknownBool2: true,
    };
    let found = false;
    for (const v in server._vehicles) {
      console.log(server._vehicles[v]);
      if(server._vehicles[v].npcData.modelId === parseInt(args[1])) {
        location.position = server._vehicles[v].npcData.position;
        server.sendData(client, "ClientUpdate.UpdateLocation", location);
        const SendZoneDetails_packet = {
          zoneName: "Z1",
          unknownBoolean1: true,
          zoneType: 4,
          //skyData: weather,
          skyData: {},
          zoneId1: 3905829720,
          zoneId2: 3905829720,
          nameId: 7699,
          unknownBoolean2: true,
          unknownBoolean3: true,
        };
        server.sendData(client, "SendZoneDetails", SendZoneDetails_packet); // needed or screen is black, maybe use skyChanged instead?
        server.sendData(client, "ClientBeginZoning", {}); // needed or no trees / foliage spawned on tp
        found = true;
        break;
      }
    };
    if(found) {
      server.sendChatText(client, "TPed successfully");
    } else {
      server.sendChatText(client, `No objects of ID: ${args[1]} found`);
    }
  }
};

export default dev;
