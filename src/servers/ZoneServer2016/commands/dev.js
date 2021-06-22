const debug = require("debug")("zonepacketHandlers");

const dev = {
  testpacket: function (server, client, args) {
    const packetName = args[1];
    server.sendData(client, packetName, {});
  },
  testNpc: function (server, client, args) {
    const characterId = server.generateGuid();
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
    const containerData = {
      ignore: client.character.characterId,
      containersLength: 1,
      containers: [
        {
          containerItems: {
            itemsLength: 1,
            items: [
              {itemData: {
                itemSubData: {
                  unknownData1: {}
                }
              }}
            ]
          }
        }
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

  tpVehicle: function (server, client, args) {
    if(!args[1]) {
      server.sendChatText(client, "Missing vehicleId arg");
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
      server.sendChatText(client, `No vehicles of ID: ${args[1]} found`);
    }
  },

  updateWeather: function(server, client, args) {
    if(!args[2]) {
      server.sendChatText(client, "Missing 2 args");
      return;
    }
    const skyData = {
      unknownDword1: 0, // breaks the game
      unknownDword2: 0, // breaks the game

      skyBrightness1: 1, // breaks the game
      skyBrightness2: 1, // breaks the game

      snow: 0,
      snowMap: 0, // 32 - 35 snow starts thinning, dissapears over 35
      colorGradient: 0,
      unknownDword8: 0, // AOGamma? sky gets more yellow - test during night
      unknownDword9: 0, // related to previous value - both do same/similar thing
      unknownDword10: 0, // related to previous values - both do same/similar thing

      unknownDword11: 0,
      unknownDword12: 0,
      sunAxisX: parseFloat(args[1]), // 0 - 360
      sunAxisY: parseFloat(args[2]), // 0 - 360
      unknownDword15: 0,
      disableTrees: 0,
      disableTrees1: 0,
      disableTrees2: 0,
      wind: 0,
      // below variables do nothing ig
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
    debug(skyData);
    server.sendData(client, "UpdateWeatherData", skyData);
  },

  recipe: function(server, client, args) {
    /*
    if(!args[2]) {
      server.sendChatText(client, "Missing 2 args");
      return;
    }
    */
    server.sendData(client, "Recipe.Add", {
      unknownDword1: 93,
      unknownDword2: 1536,
      unknownDword3: 103,
      unknownDword4: 4,
      unknownDword5: 1537,
      unknownDword6: 6,
      unknownDword7: 6,
      membersOnly: false,
      unknownDword8: 5,
      componentsLength: 1,
      components: [
        {
          unknownDword0: 10,
          unknownDword1: 49,
          unknownDword2: 18,
          unknownDword3: 4,
          unknownDword4: 20,
          unknownDword5: 5,
          unknownQword1: "0x0000000000000001",
          unknownDword6: 8,
          unknownDword7: 0,
        }
      ],
      unknownDword9: 8,
    });
  }
};

export default dev;
