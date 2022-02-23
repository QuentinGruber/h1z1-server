// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { Int64String } from "../../../utils/utils";

const debug = require("debug")("zonepacketHandlers");

const dev: any = {
  list: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/dev commands list: \n/dev ${Object.keys(this).join("\n/dev ")}`
    );
  },
  testpacket: function (server: ZoneServer2016, client: Client, args: any[]) {
    const packetName = args[1];
    server.sendData(client, packetName, {});
  },
  findmodel: function (server: ZoneServer2016, client: Client, args: any[]) {
    const models = require("../../../../data/2016/dataSources/Models.json");
    const wordFilter = args[1];
    if (wordFilter) {
      const result = models.filter((word: any) =>
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
  reloadpackets: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (args[1]) {
      server.reloadPackets(client, args[1]);
    } else {
      server.reloadPackets(client);
    }
  },
  systemmessage: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
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
  setresource: function (server: ZoneServer2016, client: Client, args: any[]) {
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
          characterId: client.character.characterId,
          resourceData: {
            resourceId: Number(args[1]),
            resourceType: Number(args[2]),
            unknownArray1: [],
            value: Number(args[3]),
            unknownArray2: [],
          }
        },
      },
    };
    server.sendChatText(client, "Setting character resource");
    server.sendData(client, "ResourceEvent", resourceEvent);
  },
  selectloadout: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing loadoutSlotId arg");
      return;
    }
    server.sendChatText(client, "Sending selectloadout packet");
    server.sendData(client, "Loadout.SelectLoadout", {
      loadoutSlotId: Number(args[1]),
    });
  },
  setcurrentloadout: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing loadoutSlotId arg");
      return;
    }
    const loadout = {
      characterId: client.character.characterId,
      loadoutSlotId: Number(args[1]),
    };
    server.sendChatText(client, "Sending setcurrentloadout packet");
    server.sendData(client, "Loadout.SetCurrentLoadout", loadout);
  },
  createcustomloadout: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[2]) {
      server.sendChatText(client, "Missing slotId and loadoutSlotId args");
      return;
    }
    const loadout = {
      slotId: Number(args[1]),
      loadoutSlotId: Number(args[2]),
    };
    server.sendChatText(client, "Sending setcurrentloadout packet");
    server.sendData(client, "Loadout.CreateCustomLoadout", loadout);
  },

  setslot: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[2]) {
      server.sendChatText(client, "Missing slotId and itemDefinitionId args.");
      return;
    }
    server.sendChatText(client, "Sending selectslot packet");
    server.sendData(client, "Loadout.SetLoadoutSlot", {
      characterId: client.character.characterId,
      loadoutSlot: {
        itemDefinitionId: Number(args[2]),
        slotId: Number(args[1]),
        unknownData1: {
          itemDefinitionId: Number(args[2]),
          loadoutItemOwnerGuid: client.character.characterId,
          unknownByte1: 17,
        },
        unknownDword1: 16,
      },
      unknownDword1: 18,
    });
  },
  containererror: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
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
  setequipment: function (server: ZoneServer2016, client: Client, args: any[]) {
    /*
    if(!args[5]) {
      server.sendChatText(client, "Missing 5 args");
      return;
    }
    const equipmentEvent = {
      characterData: {
        characterId: client.character.characterId
      },
      equipmentSlot: {
        equipmentSlotId: 3,
        equipmentSlotData: {
          equipmentSlotId: 3,
          guid: "0x1", // needs to be non-zero
          tintAlias: "",
          decalAlias: "#"
        }
      },
      attachmentData: {
        modelName: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
        unknownDword1: Number(args[1]),
        unknownDword2: Number(args[2]), // 1, 2, 4
        effectId: Number(args[3]), // 0 - 16
        slotId: Number(args[4]), // backpack: 10
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
      slots: [
        {
          index: 1, // needs to be non-zero
          slotId: 3, // needs to be non-zero
        },
      ],
      unknownDword1: 1,
      equipmentSlots: [
        {
          equipmentSlotId: 3,
          equipmentSlotData: {
            equipmentSlotId: 3,
            guid: "0x1", // needs to be non-zero
            tintAlias: "",
            decalAlias: "#",
          },
        },
      ],
      attachmentData: [
        {
          modelName: "SurvivorMale_Chest_Hoodie_Up_Tintable.adr",
          unknownDword1: 1,
          unknownDword2: 1, // 1, 2, 4
          effectId: 6, // 0 - 16
          slotId: 3,
          unknownDword4: 0,
          unknownArray1: [],
        },
      ],
    };
    server.sendChatText(client, "Setting character equipment");
    server.sendData(client, "Equipment.SetCharacterEquipmentSlots", equipment);
  },

  tpvehicle: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(client, "Missing vehicleId arg");
      return;
    }
    const location = {
      position: new Float32Array([0, 80, 0, 1]),
      rotation: [0, 0, 0, 1],
      triggerLoadingScreen: true,
    };
    let found = false;
    for (const v in server._vehicles) {
      console.log(server._vehicles[v]);
      if (server._vehicles[v].npcData.modelId === parseInt(args[1])) {
        location.position = server._vehicles[v].npcData.position;
        server.sendData(client, "ClientUpdate.UpdateLocation", location);
        server.sendWeatherUpdatePacket(client, server._weather2016);
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

  tpnpc: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(client, "Missing npc modelId arg");
      return;
    }
    const location = {
      position: [0, 80, 0, 1],
      rotation: [0, 0, 0, 1],
      triggerLoadingScreen: true,
    };
    let found = false;
    for (const n in server._npcs) {
      if (server._npcs[n].modelId === parseInt(args[1])) {
        console.log(server._npcs[n]);
        location.position = server._npcs[n].position;
        server.sendData(client, "ClientUpdate.UpdateLocation", location);
        server.sendWeatherUpdatePacket(client, server._weather2016);
        found = true;
        break;
      }
    }
    if (found) {
      server.sendChatText(client, "TPed successfully");
    } else {
      server.sendChatText(client, `No npcs of ID: ${args[1]} found`);
    }
  },

  updateweather: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    /*
        if(!args[7]) {
          server.sendChatText(client, "Missing 7 args");
          return;
        }
        */
    /*
        function rnd_number() {
          return Number((Math.random() * 100).toFixed(0));
        }
        function rnd_number2(max: any, fixed: Boolean = false) {
          const num = Math.random() * max;
          return Number(fixed?num.toFixed(0):num);
        }
        */
    server._weather2016 = {
      ...server._weather2016,

      //unknownDword1: 0, // breaks the game
      //unknownDword2: 0, // breaks the game

      //skyBrightness1: 1, // breaks the game
      //skyBrightness2: 1, // breaks the game

      //snow: 0,
      //snowMap: 0, // 32 - 35 snow starts thinning, dissapears over 35
      //colorGradient: 0,
      //unknownDword8: 0, // AOGamma? sky gets more yellow - test during night
      //unknownDword9: 0, // related to previous value - both do same/similar thing
      //unknownDword10: 0, // related to previous values - both do same/similar thing

      //unknownDword11: rnd_number(),
      //unknownDword12: rnd_number(),
      //sunAxisX: 0, // 0 - 360 // heading?
      //sunAxisY: 0, // 0 - 360 // pitch?
      //unknownDword15: rnd_number(),

      //windDirectionX: rnd_number2(360, true),
      //windDirectionY: rnd_number2(360, true),
      //windDirectionZ: rnd_number2(360, true),

      //wind: 0,

      //unknownDword20: rnd_number(), // world reflection related?
      //unknownDword21: rnd_number(), // world reflection related?

      //unknownDword22: rnd_number2(1), // ??
      //unknownDword23: rnd_number2(1), // ??

      //unknownDword24: rnd_number2(50), // sky starts blinking? (affects clouds) solarFlareFrequency?

      //unknownDword25: rnd_number2(1), // sky starts blinking? (affects clouds) solarFlareIntensity? (cloudSpeed?) (rainClouds?)

      //unknownDword26: rnd_number2(1), // ?? (cloudWeight0?)
      //unknownDword27: rnd_number2(1), // ?? (cloudWeight1?)
      //unknownDword28: rnd_number2(1), // ?? (cloudWeight2?)
      //unknownDword29: rnd_number2(1), // ?? (cloudWeight3?)
      //unknownDword33: rnd_number2(0.5), // ?? (cloudThickness?)
    };
    console.log(server._weather2016);
    server.sendWeatherUpdatePacket(client, server._weather2016, true);
  },

  recipe: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendData(client, "Recipe.Add", {
      recipeId: 93,
      nameId: 1536,
      iconId: 103,
      unknownDword1: 0,
      descriptionId: 1537,
      unknownDword2: 0,
      bundleCount: 0,
      membersOnly: false,
      filterId: 5,
      components: [
        {
          unknownDword1: 0,
          nameId: 49,
          iconId: 0,
          unknownDword2: 0,
          descriptionId: 0,
          requiredAmount: 1,
          unknownQword1: server.generateGuid(),
          unknownDword3: 0,
          itemDefinitionId: 1, // crashes the game if 0, recipe turns green
        },
        {
          unknownDword1: 0,
          nameId: 254,
          iconId: 0,
          unknownDword2: 0,
          descriptionId: 0,
          requiredAmount: 1,
          unknownQword1: server.generateGuid(),
          unknownDword3: 0,
          itemDefinitionId: 1,
        },
      ],
      itemDefinitionId: 8,
    });
  },

  seatchange: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[3]) {
      server.sendChatText(client, "Missing 3 args");
      return;
    }
    server.sendData(client, "Mount.SeatChangeResponse", {
      unknownQword1: client.character.characterId,
      unknownQword2: client.vehicle.mountedVehicle,
      identity: {
        unknownDword1: 0,
        unknownDword2: 0,
        unknownDword3: 0,
        characterFirstName: "",
        characterLastName: "",
        unknownString1: "",
        characterName: "LocalPlayer",
        unknownQword1: "0",
      },
      unknownDword1: Number(args[1]),
      unknownDword2: Number(args[2]),
      unknownDword3: Number(args[3]),
    });
    server.sendChatText(client, `sent seatchange`);
  },

  gametime: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(client, "Missing 1 arg");
      return;
    }
    debug("GameTimeSync");
    server.sendData(client, "GameTimeSync", {
      time: Int64String(server.getGameTime()),
      cycleSpeed: Number(args[1]),
      unknownBoolean: false,
    });
  },
  activateprofile: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(client, "Missing 1 arg");
      return;
    }
    server.sendData(client, "ClientUpdate.ActivateProfile", {
      profileData: {
        profileId: 1,
        nameId: 12,
        descriptionId: 13,
        type: 3,
        unknownDword1: 0,
        abilityBgImageSet: 4,
        badgeImageSet: 5,
        buttonImageSet: 6,
        unknownByte1: 0,
        unknownByte2: 0,
        unknownDword4: 0,
        unknownArray1: [],
        unknownDword5: 0,
        unknownDword6: 0,
        unknownByte3: 1,
        unknownDword7: 0,
        unknownDword8: 0,
        unknownDword9: 0,
        unknownDword10: 0,
        unknownDword11: 0,
        unknownDword12: 0,
        unknownDword13: 0,
        unknownDword14: 0,
        unknownDword15: 0,
        unknownDword16: 0,
      },
      attachmentData: [
        {
          modelName: "SurvivorMale_Head_01.adr",
          unknownDword1: 0,
          unknownDword2: 0,
          effectId: 0,
          slotId: 1,
          unknownDword4: 0,
          unknownArray1: [],
        },
        {
          modelName: "SurvivorMale_Chest_Jacket_Farmer.adr",
          unknownDword1: 0,
          unknownDword2: 0,
          effectId: 0,
          slotId: 3,
          unknownDword4: 0,
          unknownArray1: [],
        },
        {
          modelName: "SurvivorMale_Legs_Pants_Underwear.adr",
          unknownDword1: 0,
          unknownDword2: 0,
          effectId: 0,
          slotId: 4,
          unknownDword4: 0,
          unknownArray1: [],
        },
        {
          modelName: "SurvivorMale_Eyes_01.adr",
          unknownDword1: 0,
          unknownDword2: 0,
          effectId: 0,
          slotId: 105,
          unknownDword4: 0,
          unknownArray1: [],
        },
        {
          modelName: "Weapons_PumpShotgun01.adr",
          unknownDword1: 0,
          unknownDword2: 0,
          effectId: 0,
          slotId: 14,
          unknownDword4: 0,
          unknownArray1: [],
        },
      ],
      unknownDword1: 1,
      unknownDword2: 1,
      actorModelId: 9240,
      tintAlias: "",
      decalAlias: "#",
    });
  },
  placement: function (server: ZoneServer2016, client: Client, args: any[]) {
    const modelChoosen = args[1];
    if (!modelChoosen) {
      server.sendChatText(client, "[ERROR] Usage /hax placement {modelId}");
      return;
    }
    if (!args[2]) {
      server.sendChatText(client, "missing 1 arg");
      return;
    }
    server.sendData(client, "Construction.PlacementResponse", {
      unknownDword1: Number(args[2]),
      model: modelChoosen,
    });
  },
  stat: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[3]) {
      server.sendChatText(client, "missing statId, baseValue, modifierValue");
      return;
    }

    server.sendData(client, "ClientUpdate.UpdateStat", {
      statId: Number(args[1]),
      statValue: {
        type: 0,
        value: {
          baseValue: Number(args[2]),
          modifierValue: Number(args[3]),
        },
      },
    });
  },
  additem: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(client, "Missing itemDefinitionid");
      return;
    }
    const item = server.generateItem(Number(args[1]));
    server.sendData(client, "ClientUpdate.ItemAdd", {
      characterId: client.character.characterId,
      data: {
        itemDefinitionId: Number(args[1]),
        tintId: 5,
        guid: item,
        count: 1, // also ammoCount
        itemSubData: {
          unknownBoolean1: true,

          unknownDword1: 1,
          unknownData1: {
            unknownQword1: item,
            unknownDword1: 0,
            unknownDword2: 0,
          },
        },
        unknownQword2: item,
        unknownDword4: 0,
        slot: 0,
        unknownDword6: 0,
        unknownDword7: 0,
        unknownDword8: 0,
        unknownBoolean1: true,
        unknownQword3: item,
        unknownDword9: 0,
        unknownBoolean2: true,
      },
    });
    server.equipItem(client, item);
  },
  addcontainers: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    const backpack: any = server.generateItem(1602);
    server.equipItem(client, backpack);
    const item: any = server.generateItem(2425),
      //containerGuid = server.generateGuid(),
      containers = [
        {
          unknownDword1: 3, // container itemDefinitionId ?
          containerData: {
            guid: backpack,
            definitionId: 3,
            associatedCharacterId: client.character.characterId,
            slots: 9999,
            items: [
              {
                itemDefinitionId: server._items[item].itemDefinition.ID,
                itemData: {
                  itemDefinitionId: server._items[item].itemDefinition.ID,
                  tintId: 1,
                  guid: item,
                  count: 1,
                  itemSubData: {
                    unknownBoolean1: false,
                  },
                  containerGuid: backpack,
                  containerDefinitionId: 1,
                  containerSlotId: 1,
                  baseDurability: 1,
                  currentDurability: 1,
                  maxDurabilityFromDefinition: 1,
                  unknownBoolean1: true,
                  unknownQword3: backpack,
                  unknownDword9: 1,
                },
              },
            ],
            unknownBoolean1: true,
            unknownDword3: 3,
            unknownDword4: 3,
            unknownDword5: 3,
            unknownBoolean2: true,
          },
        },
      ];
    server.sendData(client, "Container.InitEquippedContainers", {
      ignore: client.character.characterId,
      characterId: client.character.characterId,
      containers: containers,
    });
  },
  listcontainers: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    const item: any = server.generateItem(2425);
    console.log(item);
    const containers = [
        {
          guid: item,
          definitionId: 4,
          associatedCharacterId: client.character.characterId,
          slots: 9999,
          items: [
            {
              itemDefinitionId: server._items[item].itemDefinition.ID,
              itemData: {
                itemDefinitionId: server._items[item].itemDefinition.ID,
                tintId: 1,
                guid: item,
                count: 1,
                itemSubData: {
                  unknownBoolean1: false,
                },
                containerGuid: client.character.characterId,
                containerDefinitionId: 1,
                containerSlotId: 1,
                baseDurability: 1,
                currentDurability: 1,
                maxDurabilityFromDefinition: 1,
                unknownBoolean1: true,
                unknownQword3: "",
                unknownDword9: 1,
              },
            },
          ],
          unknownBoolean1: true,
          unknownDword3: 565,
          unknownDword4: 999,
          unknownDword5: 991,
          unknownBoolean2: false,
        },
      ];
    server.sendData(client, "Container.ListAll", {
      characterId: client.character.characterId,
      containers: containers,
    });
  },
  addcontainer: function (server: ZoneServer2016, client: Client, args: any[]) {
    const backpack: any = server.generateItem(1602);
    server.equipItem(client, backpack);
    const item: any = server.generateItem(2425),
      containerData = {
        guid: backpack,
        definitionId: server._items[backpack].itemDefinition.ID,
        associatedCharacterId: backpack,
        slots: 2,
        items: [
          {
            itemDefinitionId: server._items[item].itemDefinition.ID,
            itemData: {
              itemDefinitionId: server._items[item].itemDefinition.ID,
              tintId: 1,
              guid: item,
              count: 1,
              itemSubData: {
                unknownBoolean1: false,
              },
              containerGuid: "",
              containerDefinitionId: 1,
              containerSlotId: 1,
              baseDurability: 1,
              currentDurability: 1,
              maxDurabilityFromDefinition: 1,
              unknownBoolean1: true,
              unknownQword3: "",
              unknownDword9: 1,
            },
          },
        ],
        unknownBoolean1: true,
        unknownDword3: 2,
        unknownDword4: 2,
        unknownDword5: 2,
        unknownBoolean2: true,
      };
    server.sendData(client, "Container.UpdateEquippedContainer", {
      ignore: client.character.characterId,
      characterId: client.character.characterId,
      containerData: containerData,
    });
  },
  shutdown: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendData(client, "WorldShutdownNotice", {
      timeLeft: 0,
      message: " ",
    });
  },
  loginmsg: function (server: ZoneServer2016, client: Client, args: any[]) {
    server._h1emuZoneServer.sendData(
      server._h1emuZoneServer._loginConnection,
      "test",
      {
        msg: Number(args[1]) | 99,
      }
    );
  },
  begincharacteraccess: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {/*
    const backpack: any = server.generateItem(1602);
    server.equipItem(client, backpack);*/
    const objectCharacterId = server.generateGuid(),
      npc = {
        characterId: objectCharacterId,
        guid: server.generateGuid(),
        transientId: 9999,
        modelId: 9034,
        position: [
          client.character.state.position[0],
          client.character.state.position[1],
          client.character.state.position[2],
        ],
        rotation: [
          client.character.state.rotation[0],
          client.character.state.rotation[1],
          client.character.state.rotation[2],
        ],
        color: {},
        unknownData1: { unknownData1: {} },
        attachedObject: {},
      };
    const item: any = server.generateItem(2425)/*,
      containerGuid = server.generateGuid(),
      containers = [
        {
          unknownDword1: 92, // container itemDefinitionId ?
          containerData: {
            guid: objectCharacterId,
            definitionId: 92,
            associatedCharacterId: objectCharacterId,
            slots: 9999,
            items: [
              {
                itemDefinitionId: server._items[item].itemDefinition.ID,
                itemData: {
                  itemDefinitionId: server._items[item].itemDefinition.ID,
                  itemData: {
                    itemDefinitionId: server._items[item].itemDefinition.ID,
                    tintId: 1,
                    guid: item,
                    count: 1,
                    itemSubData: {
                      unknownBoolean1: false,
                    },
                    containerGuid: containerGuid,
                    containerDefinitionId: 1,
                    containerSlotId: 1,
                    baseDurability: 1,
                    currentDurability: 1,
                    maxDurabilityFromDefinition: 1,
                    unknownBoolean1: true,
                    unknownQword3: containerGuid,
                    unknownDword9: 1,
                  },
                },
              },
            ],
            unknownBoolean1: true,
            unknownDword3: 1,
            unknownDword4: 1,
            unknownDword5: 1,
            unknownBoolean2: true,
          },
        },
      ];
      */
    server._npcs[objectCharacterId] = npc; // save npc
    server.worldRoutine();
    setTimeout(() => {/*
      server.sendData(client, "Container.InitEquippedContainers", {
        ignore: client.character.characterId,
        //ignore2: client.character.characterId,
        characterId: objectCharacterId,
        containers: containers,
      });
      */
      server.sendData(client, "AccessedCharacter.BeginCharacterAccess", {
        objectCharacterId: objectCharacterId,
        containerGuid: client.character.characterId,
        unknownBool1: false,
        itemsData: {
          items: [
            {
              item: {
                itemDefinitionId: server._items[item].itemDefinition.ID,
                itemData: {
                  itemDefinitionId: server._items[item].itemDefinition.ID,
                  itemData: {
                    itemDefinitionId: server._items[item].itemDefinition.ID,
                    tintId: 92,
                    guid: item,
                    count: 92,
                    itemSubData: {
                      unknownBoolean1: false,
                    },
                    containerGuid: objectCharacterId,
                    containerDefinitionId: 92,
                    containerSlotId: 92,
                    baseDurability: 92,
                    currentDurability: 92,
                    maxDurabilityFromDefinition: 92,
                    unknownBoolean1: true,
                    unknownQword3: client.character.characterId,
                    unknownDword9: 92,
                  },
                },
              },
              unknownBool1: true,
            },
          ],
          unknownDword1: 92,
        },
      });
    }, 500);
  },
  fte: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[3]) {
      server.sendChatText(client, "Missing 3 args");
      return;
    }
    server.sendData(client, "FirstTimeEvent.State", {
      unknownDword1: Number(args[1]),
      unknownDword2: Number(args[2]),
      unknownBoolean1: Boolean(args[3]),
    });
  },
  proximateitems: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    const item: any = server.generateItem(2425),
      guid1 = server.generateGuid(),
      guid2 = server.generateGuid(),
      guid3 = server.generateGuid();
    console.log(
      `item: ${item}, guid1: ${guid1}, guid2: ${guid2}, guid3: ${guid3}`
    );
    server.sendData(client, "ClientUpdate.ProximateItems", {
      items: [
        {
          itemDefinitionId: server._items[item].itemDefinition.ID,
          itemData: {
            itemDefinitionId: server._items[item].itemDefinition.ID,
            tintId: 43,
            guid: item,
            count: 44,
            itemSubData: {
              unknownBoolean1: false /*
                unknownDword1: 1,
                unknownData1: {
                  unknownQword1: guid4,
                  unknownDword1: 99,
                  unknownDword2: 101,
                }*/,
            },
            containerGuid: guid1,
            containerDefinitionId: 45,
            containerSlotId: 46,
            baseDurability: 47,
            currentDurability: 48,
            maxDurabilityFromDefinition: 49,
            unknownBoolean1: true,
            unknownQword3: guid2,
            unknownDword9: 54,
          },
          associatedCharacterGuid: guid3,
        },
      ],
    });
  },
  /*
    proxiedobjects: function(server: ZoneServer2016, client: Client, args: any[]) {

      objects.runtime_object.runtime_objects.forEach((object) => {
        if(object.actor_file === "Common_Props_Dryer.adr") {
          object.instances.forEach((instance) => {
            console.log("proxied object")
            const obj = {
              guid: instance.id,
              transientId: server.getTransientId(client, instance.id),
              unknownByte1: 0,
              position: [instance.position[0], instance.position[1], instance.position[2]],
              rotation: [instance.rotation[1], instance.rotation[0], instance.rotation[2]],
            };
            server.sendData(client, "AddProxiedObject", obj);
          });
          server.sendChatText(client, `Sent ${object.instance_count} ProxiedObject Packets`);
        }
      });
    }
    */
};

export default dev;
