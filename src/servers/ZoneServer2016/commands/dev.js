const debug = require("debug")("zonepacketHandlers");
// import fs from "fs";

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
    if (!args[1]) {
      server.sendChatText(client, "Missing 'message' parameter");
      return;
    }
    const msg = {
      unknownDword1: 0,
      message: args[1],
      unknownDword2: 0,
      color: 2,
    };
    server.sendChatText(client, "Sending system message");
    server.sendData(client, "ShowSystemMessage", msg);
  },
  setresource: function (server, client, args) {
    if (!args[3]) {
      server.sendChatText(
        client,
        "Missing resourceId, resourceType, and value args"
      );
      return;
    }
    const resourceEvent = {
      eventData: {
        type: 2,
        value: {
          characterId: "0x03147cca2a860191",
          resourceId: args[1],
          resourceType: args[2],
          unknownArray1: [],
          value: args[3],
          unknownArray2: [],
        },
      },
    };
    server.sendChatText(client, "Setting character resource");
    server.sendData(client, "ResourceEvent", resourceEvent);
  },
  selectloadout: function (server, client, args) {
    if (!args[1]) {
      server.sendChatText(client, "Missing unknownDword1 arg");
      return;
    }
    const loadout = {
      unknownDword1: Number(args[1]),
    };
    server.sendChatText(client, "Sending selectloadout packet");
    server.sendData(client, "Loadout.SelectLoadout", loadout);
  },
  setcurrentloadout: function (server, client, args) {
    if (!args[1]) {
      server.sendChatText(client, "Missing loadoutId arg");
      return;
    }
    const loadout = {
      characterId: client.character.characterId,
      loadoutId: Number(args[1]),
    };
    server.sendChatText(client, "Sending setcurrentloadout packet");
    server.sendData(client, "Loadout.SetCurrentLoadout", loadout);
  },
  selectslot: function (server, client, args) {
    const loadout = {
      characterId: client.character.characterId,
      loadoutItemLoadoutId: 5,
      unknownData1: {
        unknownArray1Length: 1,
        unknownArray1: [
          {
            unknownDword1: 1,
            loadoutItemSlotId: 1,
            itemDefinitionId: 2425,
            unknownData1: {
              unknownDword1: 16,
              unknownQword1: server.generateGuid(),
              unknownByte1: 17,
            },
            unknownDword4: 18,
          },
        ],
      },
      unknownDword2: 19,
    };
    server.sendChatText(client, "Sending selectslot packet");
    server.sendData(client, "Loadout.SelectSlot", loadout);
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
              {
                itemData: {
                  itemSubData: {
                    unknownData1: {},
                  },
                },
              },
            ],
          },
        },
      ],
      array1Length: 1,
      array1: [{ unknownQword1: server.generateGuid(), unknownDword1: 2 }],
    };

    server.sendData(client, "Container.unknown2", containerData);
  },
  containererror: function (server, client, args) {
    if (!args[1]) {
      server.sendChatText(client, "Missing containerError arg");
      return;
    }
    const container = {
      characterId: client.character.characterId,
      containerError: parseInt(args[1]),
    };

    server.sendData(client, "Container.Error", container);
  },
  setequipment: function (server, client, args) {
    /*
    if(!args[5]) {
      server.sendChatText(client, "Missing 5 args");
      return;
    }
    const equipmentEvent = {
      characterData: {
        characterId: client.character.characterId
      },
      equipmentTexture: {
        index: 1, // needs to be non-zero
        slotId: 1, // needs to be non-zero
        unknownQword1: "0x1", // needs to be non-zero
        textureAlias: "",
        unknownString1: ""
      },
      equipmentModel: {
        model: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
        unknownDword1: Number(args[1]),
        unknownDword2: Number(args[2]), // 1, 2, 4
        effectId: Number(args[3]), // 0 - 16
        equipmentSlotId: Number(args[4]), // backpack: 10
        unknownDword4: Number(args[5]),
        unknownArray1: []
      }
    };
    server.sendData(client, "Equipment.SetCharacterEquipmentSlot", equipmentEvent);
    */
    const equipment = {
      // not working yet, attachment error (texture related?)
      characterData: {
        characterId: client.character.characterId,
      },
      gameTime: 1,
      slotsArrayLength: 1,
      slots: [
        {
          index: 1, // needs to be non-zero
          slotId: 3, // needs to be non-zero
        },
      ],
      unknownDword1: 1,
      equipmentTexturesArrayLength: 1,
      equipmentTextures: [
        {
          index: 1, // needs to be non-zero
          slotId: 3, // needs to be non-zero
          unknownQword1: "0x1", // needs to be non-zero
          textureAlias: "",
          unknownString1: "",
        },
      ],
      equipmentModelsArrayLength: 1,
      equipmentModels: [
        {
          model: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
          unknownDword1: 1,
          unknownDword2: 1, // 1, 2, 4
          effectId: 6, // 0 - 16
          equipmentSlotId: 3,
          unknownDword4: 0,
          unknownArray1: [],
        },
      ],
    };
    server.sendChatText(client, "Setting character equipment");
    server.sendData(client, "Equipment.SetCharacterEquipmentSlots", equipment);
  },

  tpVehicle: function (server, client, args) {
    if (!args[1]) {
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
      if (server._vehicles[v].npcData.modelId === parseInt(args[1])) {
        location.position = server._vehicles[v].npcData.position;
        server.sendData(client, "ClientUpdate.UpdateLocation", location);
        server.sendData(client, "UpdateWeatherData", {});
        found = true;
        break;
      }
    }
    if (found) {
      server.sendChatText(client, "TPed successfully");
    } else {
      server.sendChatText(client, `No vehicles of ID: ${args[1]} found`);
    }
  },

  updateWeather: function (server, client, args) {
    /*
    if(!args[7]) {
      server.sendChatText(client, "Missing 7 args");
      return;
    }
    */
    function rnd_number() {
      return Number((Math.random() * 100).toFixed(0));
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
      sunAxisX: 0, // 0 - 360
      sunAxisY: 0, // 0 - 360
      unknownDword15: 0,
      disableTrees: 0,
      disableTrees1: 0,
      disableTrees2: 0,
      wind: 0,
      // below variables do nothing ig
      unknownDword20: rnd_number(),
      unknownDword21: rnd_number(),
      unknownDword22: rnd_number(),
      unknownDword23: rnd_number(),
      unknownDword24: rnd_number(),
      unknownDword25: rnd_number(),
      unknownDword26: rnd_number(),
      unknownDword27: rnd_number(),
      unknownDword28: rnd_number(),
      unknownDword29: rnd_number(),
      unknownDword30: rnd_number(),
      unknownDword31: rnd_number(),
      unknownDword32: rnd_number(),
      unknownDword33: rnd_number(),
    };
    debug(skyData);
    server.sendData(client, "UpdateWeatherData", skyData);
  },

  recipe: function (server, client, args) {
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
        },
      ],
      unknownDword9: 8,
    });
  },

  itemdefinitions: function(server, client, args) {
    console.log("ItemDefinitions\n\n\n\n\n\n\n\n\n");
    if(!args[2]) {
      server.sendChatText(client, "Missing 2 id args");
      return;
    }
    const itemDefinitions = {
      data: {
        itemDefinitionsLength: 2,
        itemDefinitions: [
          {
            ID: Number(args[1]),
            unknownArray1Length: 1,
            unknownArray1: [
              {
                unknownData1: {}
              }
            ]
          }, 
          {
            ID: Number(args[2]),
            unknownArray1Length: 1,
            unknownArray1: [
              {
                unknownData1: {}
              }
            ]
          }, 
        ]
      }
    };

    server.sendData(client, "Command.ItemDefinitions", itemDefinitions) // todo: add ClientItemDefinition data
  }
};

export default dev;
