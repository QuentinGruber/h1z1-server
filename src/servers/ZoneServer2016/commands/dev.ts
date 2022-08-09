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

/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO enable @typescript-eslint/no-unused-vars
import { BaseLightweightCharacter } from "../classes/baselightweightcharacter";
import { Npc } from "../classes/npc";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
//import { NormanTest } from "../classes/Planting/Test";

const debug = require("debug")("zonepacketHandlers");

const dev: any = {
  path: function (server: ZoneServer2016, client: Client, args: any[]) {
    const characterId = server.generateGuid();
    const npc = new BaseLightweightCharacter(
      characterId,
      server.getTransientId(characterId),
      9510,
      client.character.state.position,
      client.character.state.rotation
    );
    server.addLightweightNpc(client, npc);
    setTimeout(() => {
      server.sendData(client, "ClientPath.Reply", {
        unknownDword2: npc.transientId,
        nodes: [{ node: client.character.state.position }],
      });
    }, 2000);
  },
  zombie: function (server: ZoneServer2016, client: Client, args: any[]) {
    // spawn a zombie
    const characterId = server.generateGuid();
    const transient = server.getTransientId(characterId);
    const zombie = new Npc(
      characterId,
      transient,
      9510,
      client.character.state.position,
      client.character.state.rotation
    );
    server._npcs[characterId] = zombie;
    setTimeout(() => {
      const generatedGuid = `0x${server.generateItemGuid().toString(16)}`;

      zombie._equipment[3] = {
        modelName: "SurvivorFemale_Chest_Hoodie_Down.adr",
        slotId: 3,
        textureAlias: "Hoodie_DOA_Navy",
        guid: generatedGuid,
      };
      console.log(zombie.pGetEquipmentSlotFull(3));

      server.sendDataToAll(
        "Equipment.SetCharacterEquipmentSlot",
        zombie.pGetEquipmentSlotFull(3)
      );
    }, 2000);
  },
  stats: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.logStats();
  },
  spam: function (server: ZoneServer2016, client: Client, args: any[]) {
    const spamNb = args[1] || 1;
    for (let i = 0; i < spamNb; i++) {
      server.sendChatText(client, `spam ${i}`);
    }
  },
  list: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/dev commands list: \n/dev ${Object.keys(this).join("\n/dev ")}`
    );
  },
  d: function (server: ZoneServer2016, client: Client, args: any[]) {
    // quick disconnect
    server.sendData(client, "CharacterSelectSessionResponse", {
      status: 1,
      sessionId: client.loginSessionId,
    });
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
    server.reloadPackets(client);
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
          },
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
      loadoutId: Number(args[1]),
    });
  },
  selectslot: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(client, "Missing loadoutSlotId arg");
      return;
    }
    server.sendChatText(client, "Sending SelectSlot packet");
    server.sendData(client, "Loadout.SelectSlot", {
      characterId: client.character.characterId,
      loadoutSlotId: Number(args[1]),
    });
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
          loadoutItemGuid: client.character.characterId,
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
      if (server._vehicles[v].actorModelId === parseInt(args[1])) {
        location.position = server._vehicles[v].state.position;
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
      position: new Float32Array([0, 80, 0, 1]),
      rotation: new Float32Array([0, 0, 0, 1]),
      triggerLoadingScreen: true,
    };
    let found = false;
    for (const n in server._npcs) {
      if (server._npcs[n].actorModelId === parseInt(args[1])) {
        console.log(server._npcs[n]);
        location.position = server._npcs[n].state.position;
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
  listcontainers: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    server.sendData(client, "Container.ListAll", {
      characterId: client.character.characterId,
      containers: server.initializeContainerList(client, false),
    });
  },
  shutdown: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendData(client, "WorldShutdownNotice", {
      timeLeft: 0,
      message: " ",
    });
  },
  begincharacteraccess: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    /*
    const backpack: any = server.generateItem(1602)?.itemGuid;
    server.equipItem(client, backpack);*/
    const objectCharacterId = server.generateGuid(),
      npc = new Npc(
        objectCharacterId,
        server.getTransientId(objectCharacterId),
        9034,
        client.character.state.position,
        client.character.state.lookAt
      );
    npc.onReadyCallback = () => {
      const item = server.generateItem(1504)?.itemGuid;
      server.sendData(client, "ClientUpdate.ItemAdd", {
        characterId: objectCharacterId,
        data: {
          itemDefinitionId: 1504,
          tintId: 5,
          guid: item,
          count: 1, // also ammoCount
          itemSubData: {
            unknownBoolean1: false,
          },
          containerGuid: "0xFFFFFFFFFFFFFFFF",
          containerDefinitionId: 28,
          containerSlotId: 31,
          baseDurability: 2000,
          currentDurability: 2000,
          maxDurabilityFromDefinition: 2000,
          unknownBoolean1: true,
          unknownQword3: client.character.characterId,
          unknownDword9: 28,
          unknownBoolean2: true,
        },
      });
      server.sendData(client, "Loadout.SetLoadoutSlots", {
        characterId: objectCharacterId,
        loadoutId: 5,
        loadoutData: {
          loadoutSlots: [
            {
              hotbarSlotId: 31, // affects Equip Item context entry packet, and Container.MoveItem
              loadoutId: 5,
              slotId: 31,
              loadoutItemData: {
                itemDefinitionId: 1504,
                loadoutItemOwnerGuid: item,
                unknownByte1: 255, // flags?
              },
              unknownDword4: 3,
            },
          ],
        },
        currentSlotId: 31,
      });
    };
    const item: any = server.generateItem(2425)?.itemGuid; /*,
      containerGuid = server.generateGuid(),
      containers = [
        {
          loadoutSlotId: 92,
          containerData: {
            guid: objectCharacterId,
            definitionId: 92,
            associatedCharacterId: objectCharacterId,
            slots: 9999,
            items: [
              {
                itemDefinitionId: server._items[item].itemDefinitionId,
                itemData: {
                  itemDefinitionId: server._items[item].itemDefinitionId,
                  itemData: {
                    itemDefinitionId: server._items[item].itemDefinitionId,
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
            maxBulk: 1,
            unknownDword4: 1,
            bulkUsed: 1,
            hasBulkLimit: true,
          },
        },
      ];
      */
    server._npcs[objectCharacterId] = npc; // save npc
    //server.spawnNpcs(client);
    setTimeout(() => {
      /*
      server.sendData(client, "Container.InitEquippedContainers", {
        ignore: client.character.characterId,
        //ignore2: client.character.characterId,
        characterId: objectCharacterId,
        containers: containers,
      });
      */
      server.sendData(client, "AccessedCharacter.BeginCharacterAccess", {
        objectCharacterId: objectCharacterId,
        containerGuid: objectCharacterId,
        unknownBool1: false,
        itemsData: {
          items: [
            {
              item: {
                //itemDefinitionId: server._items[item].itemDefinitionId,
                itemData: {
                  //itemDefinitionId: server._items[item].itemDefinitionId,
                  itemData: {
                    //itemDefinitionId: server._items[item].itemDefinitionId,
                    tintId: 1,
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
    }, 5000);
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
    const item: any = server.generateItem(2425)?.itemGuid,
      guid1 = server.generateGuid(),
      guid2 = server.generateGuid(),
      guid3 = server.generateGuid();
    console.log(
      `item: ${item}, guid1: ${guid1}, guid2: ${guid2}, guid3: ${guid3}`
    );
    server.sendData(client, "ClientUpdate.ProximateItems", {
      items: [
        {
          //itemDefinitionId: server._items[item].itemDefinitionId,
          itemData: {
            //itemDefinitionId: server._items[item].itemDefinitionId,
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
  /*
  //region norman testing
  norman: function (server: ZoneServer2016, client: Client, args: any[]) {
    NormanTest.TestEntry(server, client, args);
  },
  //endregion
  */

  weapondefs: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.packWeaponDefinitions();
    server.sendRawData(client, server.weaponDefinitionsCache);
  },

  poi: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendData(client, "POIChangeMessage", {
      messageStringId: Number(args[1]) || 0,
      id: Number(args[1]) || 0,
    });
  },
};

export default dev;
